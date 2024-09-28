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
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import {AppMenu} from 'resource:///org/gnome/shell/ui/appMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class PlainExampleExtension extends Extension {

    enable() {
        this._injectionManager = new InjectionManager();

        // Extend the AppMenu's setApp method to add an edit button
        // See: https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/appMenu.js
        this._injectionManager.overrideMethod(AppMenu.prototype, 'setApp',
            originalMethod => {
                const metadata = this.metadata;

                return function (app) {
                    originalMethod.call(this, app);

                    const appInfo = this._app?.app_info;
                    if (!appInfo) {
                        return
                    }

                    let editMenuItem = this.addAction(_('Edit'), () => {
                        GLib.spawn_command_line_async(`gapplication launch org.gnome.TextEditor ${appInfo.filename}`);
                        Main.overview.hide();
                    })

                    // Move the menu item to be after App Details
                    let menuItems = this._getMenuItems()
                    for (let i = 0; i < menuItems.length; i++) {
                        let menuItem = menuItems[i]
                        if (menuItem.label) {
                            if (menuItem.label.text == 'App Details') {
                                this.moveMenuItem(editMenuItem, i+1)
                                break;
                            }
                        }
                    }
                };
            }
        );
    }

    disable() {
        this._injectionManager.clear();
        this._injectionManager = null;
    }
}
