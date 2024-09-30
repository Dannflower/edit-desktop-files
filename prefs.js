import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class EditDesktopFilesPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('General'),
            description: _('The desktop file is opened with the GNOME Text Editor by default.\n\n' + 
                'Custom commands must include "%U" to indicate where the filepath to the desktop file should be inserted. ' +
                'If missing, the default command will be used instead.\n'
            ),
        });
        page.add(group);

        // Create the two rows and add them to the group
        const useCmdRow = new Adw.SwitchRow({
            title: _('Use Custom Edit Command'),
            subtitle: _('Whether to edit desktop files using a custom command'),
        });
        group.add(useCmdRow);
        
        const cmdRow = new Adw.EntryRow({
            title: _('Custom Edit Command'),
        });
        group.add(cmdRow);

        // Bind the settings to the rows
        window._settings = this.getSettings();
        window._settings.bind('use-custom-edit-command', useCmdRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('custom-edit-command', cmdRow, 'text', Gio.SettingsBindFlags.DEFAULT);

        // Only allow interaction with the cmdRow if the user has selected to use a custom edit command
        window._settings.bind('use-custom-edit-command', cmdRow, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
    }
}