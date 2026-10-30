import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {afterEach, describe, it} from 'node:test';
import vm from 'node:vm';

const extensionSource = readFileSync(new URL('../extension.js', import.meta.url), 'utf8')
    .replace(/^import .*;?$/gm, '')
    .replace('export default class EditDesktopFilesExtension', 'class EditDesktopFilesExtension')
    + '\nglobalThis.EditDesktopFilesExtension = EditDesktopFilesExtension;';

/*
 * The extension imports GNOME Shell APIs that aren't available in Node, so
 * evaluate its class with small stand-ins for the shell, settings, menus, and
 * file-opening APIs. This lets the tests exercise the real extension behavior
 * without launching GNOME Shell or requiring a desktop session.
 * 
 * This mock was built with GNOME 51's behavior as the template.
 */
function createHarness() {
    const spawnedCommands = [];
    const launchedUris = [];
    const warnings = [];
    let defaultDirectoryExecutable = null;
    let overviewVisible = true;
    let settings;

    class Settings {
        constructor() {
            this.values = new Map([
                ['hide-edit-menu-item', false],
                ['hide-open-entry-location-menu-item', false],
                ['use-custom-edit-command', false],
                ['custom-edit-command', 'editor %U'],
            ]);
            this.handlers = new Map();
            this.disconnected = false;
        }

        get_boolean(key) {
            return this.values.get(key);
        }

        get_string(key) {
            return this.values.get(key);
        }

        set(key, value) {
            this.values.set(key, value);
            this.handlers.get(`changed::${key}`)?.(this, key);
        }

        connectObject(...args) {
            for (let index = 0; index < args.length - 1; index += 2)
                this.handlers.set(args[index], args[index + 1]);
        }

        disconnectObject() {
            this.disconnected = true;
            this.handlers.clear();
        }
    }

    class Extension {
        constructor() {
            this.metadata = {name: 'Edit Desktop Files'};
        }

        getSettings() {
            return settings;
        }
    }

    class InjectionManager {
        constructor() {
            this.originalMethods = [];
        }

        overrideMethod(target, methodName, createOverride) {
            const originalMethod = target[methodName];
            this.originalMethods.push([target, methodName, originalMethod]);
            target[methodName] = createOverride(originalMethod);
        }

        clear() {
            for (const [target, methodName, originalMethod] of this.originalMethods)
                target[methodName] = originalMethod;
        }
    }

    class AppMenu {
        constructor(appInfo, items = []) {
            this._app = {app_info: appInfo};
            this.items = items;
            this.openCalls = 0;
            this.moves = [];
        }

        open() {
            this.openCalls++;
            return 'opened';
        }

        addAction(label, callback) {
            const item = {
                label: {text: label},
                activate: callback,
                destroyed: false,
                destroy() {
                    this.destroyed = true;
                },
            };
            this.items.push(item);
            return item;
        }

        _getMenuItems() {
            return this.items;
        }

        moveMenuItem(item, index) {
            const currentIndex = this.items.indexOf(item);
            this.items.splice(currentIndex, 1);
            this.items.splice(index, 0, item);
            this.moves.push([item.label.text, index]);
        }
    }

    const makeFile = path => ({
        get_path: () => path,
        get_uri: () => `file://${encodeURI(path)}`,
        get_parent: () => makeFile(path.slice(0, path.lastIndexOf('/'))),
    });

    const context = {
        Extension,
        InjectionManager,
        AppMenu,
        GLib: {
            spawn_command_line_async: command => spawnedCommands.push(command),
        },
        Gio: {
            File: {new_for_path: makeFile},
            AppInfo: {
                launch_default_for_uri_async: uri => launchedUris.push(uri),
                get_default_for_type: () => defaultDirectoryExecutable
                    ? {get_executable: () => defaultDirectoryExecutable}
                    : null,
            },
        },
        Main: {
            overview: {
                get visible() {
                    return overviewVisible;
                },
                hide() {
                    overviewVisible = false;
                },
            },
        },
        gettext: text => text,
        _: text => text,
        console: {warn: message => warnings.push(message)},
    };
    vm.runInNewContext(extensionSource, context);

    settings = new Settings();
    const extension = new context.EditDesktopFilesExtension();
    const appInfo = {filename: '/usr/share/applications/example.desktop'};

    return {
        appInfo,
        AppMenu,
        extension,
        launchedUris,
        makeMenu(items = [{label: {text: 'App Details'}}], info = appInfo) {
            return new AppMenu(info, items);
        },
        setDefaultDirectoryExecutable(executable) {
            defaultDirectoryExecutable = executable;
        },
        settings,
        spawnedCommands,
        warnings,
        openOverview() {
            overviewVisible = true;
        },
        isOverviewVisible() {
            return overviewVisible;
        },
    };
}

describe('app menu actions', () => {
    const activeExtensions = [];

    afterEach(() => {
        for (const extension of activeExtensions.splice(0))
            extension.disable();
    });

    it('adds actions after App Details in the expected order and avoids duplicates', () => {
        const harness = createHarness();
        const extension = harness.extension;
        activeExtensions.push(extension);
        const menu = harness.makeMenu([
            {label: {text: 'App Details'}},
            {label: {text: 'Other Action'}},
        ]);

        extension.enable();

        assert.equal(menu.open(), 'opened');
        assert.equal(menu.open(), 'opened');
        assert.deepEqual(menu.items.map(item => item.label.text), [
            'App Details',
            'Edit Entry',
            'Open Entry Location',
            'Other Action',
        ]);
        assert.equal(menu.openCalls, 2);
        assert.equal(harness.extension._addedEditMenuItems.length, 1);
        assert.equal(harness.extension._addedOpenLocationMenuItems.length, 1);
    });

    it('does not add actions when the app has no desktop entry', () => {
        const harness = createHarness();
        activeExtensions.push(harness.extension);
        const menu = harness.makeMenu([], null);

        harness.extension.enable();

        assert.equal(menu.open(), 'opened');
        assert.equal(menu.items.length, 0);
        assert.equal(menu.openCalls, 1);
    });

    it('runs each action and hides the overview when activated', () => {
        const harness = createHarness();
        activeExtensions.push(harness.extension);
        const calls = [];
        harness.extension.openDesktopFile = (...args) => calls.push(['edit', ...args]);
        harness.extension.openDesktopFileLocation = (...args) => calls.push(['location', ...args]);
        const menu = harness.makeMenu();

        harness.extension.enable();
        menu.open();
        menu.items.find(item => item.label.text === 'Edit Entry').activate();

        assert.equal(calls[0][0], 'edit');
        assert.equal(calls[0][3], harness.appInfo);
        assert.equal(harness.isOverviewVisible(), false);

        harness.openOverview();
        menu.items.find(item => item.label.text === 'Open Entry Location').activate();

        assert.equal(calls[1][0], 'location');
        assert.equal(calls[1][1], harness.appInfo);
        assert.equal(harness.isOverviewVisible(), false);
    });

    it('omits both actions when their hide settings are enabled before opening', () => {
        const harness = createHarness();
        activeExtensions.push(harness.extension);
        harness.settings.set('hide-edit-menu-item', true);
        harness.settings.set('hide-open-entry-location-menu-item', true);
        const menu = harness.makeMenu();

        harness.extension.enable();
        menu.open();

        assert.deepEqual(menu.items.map(item => item.label.text), ['App Details']);
        assert.equal('_editDesktopFilesExtensionEditMenuItem' in menu, false);
        assert.equal('_editDesktopFilesExtensionOpenLocationMenuItem' in menu, false);
    });

    it('removes Edit Entry when its hide setting changes while enabled', () => {
        const harness = createHarness();
        activeExtensions.push(harness.extension);
        const menu = harness.makeMenu();
        harness.extension.enable();
        menu.open();

        const editItem = menu.items.find(item => item.label.text === 'Edit Entry');
        harness.settings.set('hide-edit-menu-item', true);

        assert.equal(editItem.destroyed, true);
        assert.equal('_editDesktopFilesExtensionEditMenuItem' in menu, false);
        assert.equal(menu.items.some(item => item.label.text === 'Open Entry Location'), true);
    });

    it('removes Open Entry Location when its hide setting changes while enabled', () => {
        const harness = createHarness();
        activeExtensions.push(harness.extension);
        const menu = harness.makeMenu();
        harness.extension.enable();
        menu.open();

        const locationItem = menu.items.find(item => item.label.text === 'Open Entry Location');
        harness.settings.set('hide-open-entry-location-menu-item', true);

        assert.equal(locationItem.destroyed, true);
        assert.equal('_editDesktopFilesExtensionOpenLocationMenuItem' in menu, false);
        assert.equal(menu.items.some(item => item.label.text === 'Edit Entry'), true);
    });

    it('removes added actions and disconnects settings when disabled', () => {
        const harness = createHarness();
        const extension = harness.extension;
        const menu = harness.makeMenu();
        extension.enable();
        menu.open();

        extension.disable();

        assert.equal(harness.settings.disconnected, true);
        assert.equal(menu.items[1].destroyed, true);
        assert.equal(menu.items[2].destroyed, true);
        assert.equal('_editDesktopFilesExtensionEditMenuItem' in menu, false);
        assert.equal('_editDesktopFilesExtensionOpenLocationMenuItem' in menu, false);
        assert.equal(menu.open(), 'opened');
        assert.equal(menu.items.length, 3);
    });
});

describe('desktop entry opening', () => {
    it('substitutes every %U with the desktop file path for custom commands', () => {
        const harness = createHarness();
        harness.settings.set('use-custom-edit-command', true);
        harness.settings.set('custom-edit-command', 'editor --first=%U --second=%U');

        harness.extension.openDesktopFile(
            harness.extension.metadata, harness.settings, harness.appInfo);

        assert.deepEqual(harness.spawnedCommands, [
            "editor --first='/usr/share/applications/example.desktop' --second='/usr/share/applications/example.desktop'",
        ]);
        assert.deepEqual(harness.launchedUris, []);
    });

    it('uses the default application when custom commands are disabled', () => {
        const harness = createHarness();

        harness.extension.openDesktopFile(
            harness.extension.metadata, harness.settings, harness.appInfo);

        assert.deepEqual(harness.launchedUris, [
            'file:///usr/share/applications/example.desktop',
        ]);
        assert.deepEqual(harness.spawnedCommands, []);
    });

    it('warns and falls back when a custom command has no %U placeholder', () => {
        const harness = createHarness();
        harness.settings.set('use-custom-edit-command', true);
        harness.settings.set('custom-edit-command', 'editor');

        harness.extension.openDesktopFile(
            harness.extension.metadata, harness.settings, harness.appInfo);

        assert.match(harness.warnings[0], /missing '%U'/);
        assert.deepEqual(harness.launchedUris, [
            'file:///usr/share/applications/example.desktop',
        ]);
    });

    it('selects the desktop file in Nautilus', () => {
        const harness = createHarness();
        harness.setDefaultDirectoryExecutable('nautilus');

        harness.extension.openDesktopFileLocation(harness.appInfo);

        assert.deepEqual(harness.spawnedCommands, [
            "nautilus --select '/usr/share/applications/example.desktop'",
        ]);
        assert.deepEqual(harness.launchedUris, []);
    });

    it('opens the containing folder when the file manager has no select command', () => {
        const harness = createHarness();
        harness.setDefaultDirectoryExecutable('dolphin');

        harness.extension.openDesktopFileLocation(harness.appInfo);

        assert.deepEqual(harness.launchedUris, [
            'file:///usr/share/applications',
        ]);
        assert.deepEqual(harness.spawnedCommands, []);
    });
});
