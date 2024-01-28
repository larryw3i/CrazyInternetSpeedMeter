/*
 * Name: Crazy Internet Speed Meter
 * Description: A simple and minimal internet speed meter extension for Gnome
 * Shell.
 * Author: larryw3i
 * GitHub: https://github.com/larryw3i/InternetSpeedMeter
 * License: GPLv3.0
 *
 */

import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'
import Adw from 'gi://Adw'
import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

export default class CrazyInternetSpeedMeterPreferences extends ExtensionPreferences {
    petName = 'CrazyInternetSpeedMeter'
    petNameWithSpace = 'Crazy Internet Speed Meter'
    settingsFile = `org.gnome.shell.extensions.${this.petName}`
    fillPreferencesWindow(window) {
        // window._settings = this.getSettings(this.settings_file);

        window._settings = this.getSettings(this.settings_file)
        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        })
        window.add(page)

        const group = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _(
                `Configure the appearance of ${this.petNameWithSpace}.`
            ),
        })
        page.add(group)

        /*
         * Normally, we design this extension for checking the network
         * traffic speed. For a general user, 1 decimal point is already
         * sufficient, and it should occupy the space as less as possible,
         * third, it's best not to distract user, it means we do NOT make
         * the position of the text change, otherwise, the position of some
         * icons will also change.
         *
         */

        const showArrowRow = new Adw.SwitchRow({
            title: _('Show Arrow'),
            subtitle: _('Whether to show speed text with arrow.'),
        })
        group.add(showArrowRow)
        window._settings.bind(
            'show-arrow',
            showArrowRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        const showBytePerSecondTextRow = new Adw.SwitchRow({
            title: _("Show 'B/s' text"),
            subtitle: _("Whether to show 'B/s' text."),
        })
        group.add(showBytePerSecondTextRow)
        window._settings.bind(
            'show-byte-per-second-text',
            showBytePerSecondTextRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        const refreshThresholdInSecondRow = new Adw.SpinRow({
            title: _('Refresh threshold (in second)'),
            subtitle: _(
                'Refresh the network traffic speed after specific time.'
            ),
            numeric: true,
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 5,
                step_increment: 1,
                // value: window._setting..unpack(),
            }),
        })
        group.add(refreshThresholdInSecondRow)
        window._settings.bind(
            'refresh-threshold-in-second',
            refreshThresholdInSecondRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        )
    }
}

// The end.
