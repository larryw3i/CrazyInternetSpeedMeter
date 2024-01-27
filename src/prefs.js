/*
 * Name: Crazy Internet Speed Meter
 * Description: A simple and minimal internet speed meter extension for Gnome Shell.
 * Author: larryw3i
 * GitHub: https://github.com/larryw3i/InternetSpeedMeter
 * License: GPLv3.0
 *
 */

import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class CrazyInternetSpeedMeterPreferences extends ExtensionPreferences {
    settings_file = "org.gnome.shell.extensions.CrazyInternetSpeedMeter";
    fillPreferencesWindow(window) {
        // window._settings = this.getSettings(this.settings_file);
    
        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Configure the appearance of the extension'),
        });
        page.add(group);

        // Create a new preferences row
        const row = new Adw.SwitchRow({
            title: _('Show Arrow'),
            subtitle: _('Whether to show speed text with arrow.'),
        });
        group.add(row);

        // Create a settings object and bind the row to the `show-indicator` key
        window._settings = this.getSettings(this.settings_file);
        window._settings.bind(
            'show-arrow', 
            row, 
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
    }
}


// The end.
