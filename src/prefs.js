/*
 * Name: Crazy Internet Speed Meter
 * Description: A simple and minimal internet speed meter extension for Gnome
 * Shell.
 * Author: larryw3i
 * GitHub: https://github.com/larryw3i/CrazyInternetSpeedMeter
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
    netSpeedCharList = new Gtk.StringList({
        strings: ["F", "T", "~", "*", "#", "^"],
    })

    getPetNameWithSpace_T() {
        let petName0 = _('Crazy Internet Speed Meter')
        let petName1 = _('Internet Speed Meter')
        let petName = petName1
        return petName
    }

    fillPreferencesWindow(window) {
        window.set_title(this.getPetNameWithSpace_T())
        window._settings = this.getSettings()
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

        const getSavedNetSpeedCharIndex = () => {
            let savedNetSpeedChar =
                window._settings.get_string('net-speed-char')
            for (let i = 0; i < this.netSpeedCharList.get_n_items(); i++) {
                if (this.netSpeedCharList.get_string(i) === savedNetSpeedChar) {
                    return i
                }
            }
            return 0
        }
        const netSpeedCharsRow = new Adw.ComboRow({
            title: _('Internet speed icon'),
            subtitle: _('Select the icon to display next to the text.'),
            model: this.netSpeedCharList,
            selected: getSavedNetSpeedCharIndex(),
        })
        group.add(netSpeedCharsRow)
        netSpeedCharsRow.connect('notify::selected', (widget) => {
            window._settings.set_string(
                'net-speed-char',
                this.netSpeedCharList.get_string(widget.selected)
            )
        })

        const showRightCharRow = new Adw.SwitchRow({
            title: _('Show right icon'),
            subtitle: _('Whether to show speed text with right icon.'),
        })
        group.add(showRightCharRow)
        window._settings.bind(
            'show-right-char',
            showRightCharRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )
        const showLeftCharRow = new Adw.SwitchRow({
            title: _('Show left icon'),
            subtitle: _('Whether to show speed text with left icon.'),
        })
        group.add(showLeftCharRow)
        window._settings.bind(
            'show-left-char',
            showLeftCharRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        const showBytePerSecondTextRow = new Adw.SwitchRow({
            title: _("Show \"B/s\" text"),
            subtitle: _("Whether to show \"B/s\" text."),
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
            }),
        })
        group.add(refreshThresholdInSecondRow)
        window._settings.bind(
            'refresh-threshold-in-second',
            refreshThresholdInSecondRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        )

        const showBorderRow = new Adw.SwitchRow({
            title: _('Show border'),
            subtitle: _('Whether to show border.'),
        })
        group.add(showBorderRow)
        window._settings.bind(
            'show-border',
            showBorderRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )
    }
}

// The end.
