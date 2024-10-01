/*
 * Edit Desktop Files for GNOME Shell 45+
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
import GLib from 'gi://GLib';
import {Extension, InjectionManager, gettext} from 'resource:///org/gnome/shell/extensions/extension.js';
import {AppMenu} from 'resource:///org/gnome/shell/ui/appMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class EditDesktopFilesExtension extends Extension {

    enable() {
        this._settings = this.getSettings();
        this._injectionManager = new InjectionManager();
        this._affectedMenus = []
        this._addedMenuItems = []
        // Call gettext here explicitly so "Edit" can be localized as part of the extension
        let localizedEditStr = gettext('Edit')

        // Extend the AppMenu's open method to add an 'Edit' MenuItem
        // See: https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/appMenu.js
        this._injectionManager.overrideMethod(AppMenu.prototype, 'open',
            originalMethod => {
                const metadata = this.metadata;
                const settings = this.getSettings();
                const affectedMenus = this._affectedMenus;
                const addedMenuItems = this._addedMenuItems;

                return function (...args) {

                    // Suitably awful name to ensure it doesn't conflict with an existing/future property
                    if (this._editDesktopFilesExtensionMenuItem) {
                        return originalMethod.call(this, ...args);
                    }

                    const appInfo = this._app?.app_info;
                    if (!appInfo) {
                        return originalMethod.call(this, ...args);
                    }

                    // Add the 'Edit' MenuItem
                    let editMenuItem = this.addAction(localizedEditStr, () => {
                        // Open the GNOME Text Editor by default, otherwise use the command provided by the user
                        let editCommand = `gapplication launch org.gnome.TextEditor '${appInfo.filename}'`
                        if (settings.get_boolean("use-custom-edit-command")) {
                            let customEditCommand = settings.get_string("custom-edit-command")
                            // If the user forgot to include %U in the command, fallback to the default with a warning
                            if (customEditCommand.indexOf('%U') != -1) {
                                editCommand = customEditCommand.replace('%U', `'${appInfo.filename}'`)
                            } else {
                                console.warn(`${metadata.name}: Custom edit command is missing '%U', falling back to default GNOME Text Editor`)
                            }
                        }

                        GLib.spawn_command_line_async(editCommand);
                        
                        if(Main.overview.visible) {
                            Main.overview.hide();
                        }
                    })

                    // Move the 'Edit' MenuItem to be after 'App Details' MenuItem
                    let menuItems = this._getMenuItems()
                    for (let i = 0; i < menuItems.length; i++) {
                        let menuItem = menuItems[i]
                        if (menuItem.label) {
                            if (menuItem.label.text == _('App Details')) {
                                this.moveMenuItem(editMenuItem, i+1)
                                break;
                            }
                        }
                    }

                    // Keep track of menus that have been affected so they can be cleaned up later
                    this._editDesktopFilesExtensionMenuItem = editMenuItem
                    affectedMenus.push(this)
                    addedMenuItems.push(editMenuItem)

                    return originalMethod.call(this, ...args);
                };
            }
        );
    }

    disable() {
        this._settings = null
        this._injectionManager.clear();
        this._injectionManager = null;
        this.removeAllMenuItems()
        this._addedMenuItems = null
        this._affectedMenus = null
    }

    removeAllMenuItems() {
        // Delete the added properties
        for (let menu of this._affectedMenus) {
            delete menu._editDesktopFilesExtensionMenuItem
        }
        
        // Delete all added MenuItems
        for (let menuItem of this._addedMenuItems) {
            menuItem.destroy();
        }

        this._addedMenuItems = []
        this._affectedMenus = []
    }
}