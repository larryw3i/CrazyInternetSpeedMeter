/*
 * Name: Crazy Internet Speed Meter
 * Description: A simple and minimal internet speed meter extension for Gnome Shell.
 * Author: larryw3i
 * GitHub: https://github.com/larryw3i/InternetSpeedMeter
 * License: GPLv3.0
 *
 */

import {
    ExtensionPreferences
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class ExamplePreferences extends ExtensionPreferences {
    settings_file = "org.gnome.shell.extensions.CrazyInternetSpeedMeter"
    fillPreferencesWindow(window) {
        window._settings = this.getSettings(this.settings_file);
    }
}


// The end.
