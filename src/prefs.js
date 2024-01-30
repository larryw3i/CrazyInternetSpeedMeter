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
    settingsFile = `org.gnome.shell.extensions.${this.petName}`

    getPetNameWithSpace_T() {
        return _('Crazy Internet Speed Meter')
    }

    fillPreferencesWindow(window) {
        window._settings = this.getSettings(this.settings_file)
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        })
        window.add(page)

        const group = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Configure the appearance of %s.').format(
                this.getPetNameWithSpace_T()
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

        const showRightArrowRow = new Adw.SwitchRow({
            title: _('Show right arrow'),
            subtitle: _('Whether to show right speed text with arrow.'),
        })
        group.add(showRightArrowRow)
        window._settings.bind(
            'show-right-arrow',
            showRightArrowRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )
        const showLeftArrowRow = new Adw.SwitchRow({
            title: _('Show left arrow'),
            subtitle: _('Whether to show left speed text with arrow.'),
        })
        group.add(showLeftArrowRow)
        window._settings.bind(
            'show-left-arrow',
            showLeftArrowRow,
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
            Gio.SettingsBindFlags.INVERT_BOOLEAN
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
