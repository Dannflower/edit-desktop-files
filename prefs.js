import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class EditDesktopFilesPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        // General settings group
        const genGroup = new Adw.PreferencesGroup({
            title: _('General'),
            description: _('Hide or show the menu items.'),
        });
        page.add(genGroup);

        // Create the two rows and add them to the group
        const hideEdit = new Adw.SwitchRow({
            title: _('Hide "Edit Entry" Menu Item'),
        });
        genGroup.add(hideEdit);

        const hideOpenLoc = new Adw.SwitchRow({
            title: _('Hide "Open Entry Location" Menu Item'),
        });
        genGroup.add(hideOpenLoc);

        const hideEntryLoc = new Adw.SwitchRow({
            title: _('Hide "Hide Entry" Menu Item'),
        });
        genGroup.add(hideEntryLoc);

        // Advanced settings group
        const advGroup = new Adw.PreferencesGroup({
            title: _('Advanced'),
            description: _('By default, the desktop entry will be opened with your system\'s default application for .desktop files (usually GNOME Text Editor).\n\n' +
                'Custom commands must include "%U" to indicate where the filepath to the desktop file should be inserted. ' +
                'If missing, the default command will be used instead.\n'
            ),
        });
        page.add(advGroup);

        const useCmdRow = new Adw.SwitchRow({
            title: _('Use Custom Edit Command'),
            subtitle: _('Whether to edit desktop files using a custom command'),
        });
        advGroup.add(useCmdRow);

        const cmdRow = new Adw.EntryRow({
            title: _('Custom Edit Command'),
        });
        advGroup.add(cmdRow);

        // Bind the settings to the rows
        window._settings = this.getSettings();
        window._settings.bind('hide-edit-menu-item', hideEdit, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('hide-open-entry-location-menu-item', hideOpenLoc, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('hide-hide-desktop-entry-menu-item', hideEntryLoc, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('use-custom-edit-command', useCmdRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('custom-edit-command', cmdRow, 'text', Gio.SettingsBindFlags.DEFAULT);

        // Only allow interaction with the cmdRow if the user has selected to use a custom edit command
        window._settings.bind('use-custom-edit-command', cmdRow, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
    }
}