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


/**
 * Create a new indicator.
 *
 * @param {string} [name] - A name for the indicator
 * @returns {PanelMenu.Button} A new indicator
 */
export function createIndicator(name = 'Unknown') {
    return new PanelMenu.Button(0.0, name, true);
}

export default class PlainExampleExtension extends Extension {

    enable() {
        this._injectionManager = new InjectionManager();

        // Extend the AppMenu's setApp method to add an edit button
        this._injectionManager.overrideMethod(AppMenu.prototype, 'setApp',
            originalMethod => {
                const metadata = this.metadata;

                return function (app) {
                    originalMethod.call(this, app);

                    const appInfo = this._app?.app_info;
                    if (!appInfo) {
                        // Probably a window backed app, ignore it
                        return
                    }

                    this.addAction(_('Edit'), () => {
                        // console.debug(`${metadata.name}: ${this._app.app_info.filename}`);
                        // console.debug(`${metadata.name}: ${this._app.get_id()}`);
                        GLib.spawn_command_line_async(`gapplication launch org.gnome.TextEditor ${appInfo.filename}`);
                    })
                };
            }
        );
    }

    disable() {
        this._injectionManager.clear();
        this._injectionManager = null;
    }
}
