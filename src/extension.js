/*
 * Name: Crazy Internet Speed Meter
 * Description: A simple and minimal internet speed meter extension for Gnome Shell.
 * Author: larryw3i
 * GitHub: https://github.com/larryw3i/CrazyInternetSpeedMeter
 * License: GPLv3.0
 * 2024.01.26 -- now
 *
 * Name: Internet Speed Meter
 * Description: A simple and minimal internet speed meter extension for Gnome Shell.
 * Author: Al Shakib
 * GitHub: https://github.com/AlShakib/InternetSpeedMeter
 * License: GPLv3.0
 * init -- 2024.01.26
 */

import GLib from 'gi://GLib'
import Gio from 'gi://Gio'
import St from 'gi://St'
import Clutter from 'gi://Clutter'
import Shell from 'gi://Shell'

import {
    Extension,
    gettext as _,
    ngettext,
    pgettext,
} from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'

export default class CrazyInternetSpeedMeter extends Extension {
    static refreshTimeInSeconds = 1
    static unitBase = 1024.0 // 1 GB == 1024MB or 1MB == 1024KB etc.
    static units = ['KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s', 'EB/s']

    float_scale = 1
    defaultNetSpeedText = '----.' + '-'.repeat(this.float_scale) + 'KB/s'
    prevUploadBytes = 0
    prevDownloadBytes = 0
    container = null
    netSpeedLabel = null
    timeoutId = 0
    petName = 'CrazyInternetSpeedMeter'
    setting_file = `org.gnome.shell.extensions.${this.petName}`

    constructor(metadata) {
        super(metadata)

        this.initTranslations(this.petName)
    }

    // Read total download and upload bytes from /proc/net/dev file
    getBytes() {
        let lines =
            Shell.get_file_contents_utf8_sync('/proc/net/dev').split('\n')
        let downloadBytes = 0
        let uploadBytes = 0
        for (let i = 0; i < lines.length; ++i) {
            let column = lines[i].trim().split(/\W+/)
            if (column.length <= 2) {
                break
            }
            if (
                !column[0].match(/^lo$/) &&
                !column[0].match(/^br[0-9]+/) &&
                !column[0].match(/^tun[0-9]+/) &&
                !column[0].match(/^tap[0-9]+/) &&
                !column[0].match(/^vnet[0-9]+/) &&
                !column[0].match(/^virbr[0-9]+/)
            ) {
                let download = parseInt(column[1])
                let upload = parseInt(column[9])
                if (!isNaN(download) && !isNaN(upload)) {
                    downloadBytes += download
                    uploadBytes += upload
                }
            }
        }
        return [downloadBytes, uploadBytes]
    }

    // Update current net speed to shell
    updateNetSpeed() {
        if (this.netSpeedLabel != null) {
            try {
                let bytes = this.getBytes()
                let downloadBytes = bytes[0]
                let uploadBytes = bytes[1]

                // Current upload speed
                let uploadSpeed =
                    (uploadBytes - this.prevUploadBytes) /
                    CrazyInternetSpeedMeter.unitBase

                // Current download speed
                let downloadSpeed =
                    (downloadBytes - this.prevDownloadBytes) /
                    CrazyInternetSpeedMeter.unitBase

                // Show upload + download = total speed on the shell
                this.netSpeedLabel.set_text(
                    this.getFormattedSpeed(uploadSpeed + downloadSpeed)
                )

                this.prevUploadBytes = uploadBytes
                this.prevDownloadBytes = downloadBytes
                return true
            } catch (e) {
                log(`Can not fetch internet speed from /proc/net/dev: ${e}`)
                this.netSpeedLabel.set_text(this.defaultNetSpeedText)
            }
        }
        return false
    }

    // Format bytes to readable string
    getFormattedSpeed(speed) {
        let i = 0
        while (speed >= CrazyInternetSpeedMeter.unitBase) {
            // Convert speed to KB, MB, GB or TB
            speed /= CrazyInternetSpeedMeter.unitBase
            ++i
        }
        speed = speed.toFixed(this.float_scale).toString()

        let split_speeds = speed.split('.')
        let speed_int = split_speeds[0]
        let speed_float = split_speeds[1]

        speed_int =
            speed_int.length < 4
                ? ' '.repeat(4 - speed_int.length) + speed_int
                : speed_int

        speed = speed_int + '.' + speed_float
        return speed + CrazyInternetSpeedMeter.units[i]
    }

    enable() {
        this._settings = this.getSettings(this.setting_file)
        // this.container = new St.Bin({
        //   reactive: true,
        //   can_focus: false,
        //   x_expand: true,
        //   y_expand: false,
        //   track_hover: false,
        // });
        this.netSpeedLabel = new St.Label({
            text: this.defaultNetSpeedText,
            style_class: 'netSpeedLabel',
            y_align: Clutter.ActorAlign.CENTER,
        })

        // this.container.set_child(this.netSpeedLabel);

        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false)

        // Add an icon
        // const icon = new St.Icon({
        //     icon_name: 'face-laugh-symbolic',
        //     style_class: 'system-status-icon',
        // });
        this._indicator.add_child(this.netSpeedLabel)

        // Add the indicator to the panel
        Main.panel.addToStatusArea(
            this.uuid,
            this._indicator
            // 0,
            // 2
        )
        // Main.panel._rightBox.insert_child_at_index(this.container, 0);
        // Main.panel.addToStatusArea(this.uuid,this.container)

        this._indicator.menu.addAction(_('Preferences'), () =>
            this.openPreferences()
        )
        this._settings.bind(
            'show-arrow',
            // this.container,
            this._indicator,
            'visible',
            Gio.SettingsBindFlags.DEFAULT
        )
        this._settings.connect('changed::show-arrow', (settings, key) => {
            console.debug(`${key} = ${settings.get_value(key).print(true)}`)
        })

        let bytes = this.getBytes()
        this.prevDownloadBytes = bytes[0]
        this.prevUploadBytes = bytes[1]

        this.timeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            CrazyInternetSpeedMeter.refreshTimeInSeconds,
            this.updateNetSpeed.bind(this)
        )
    }

    disable() {
        if (this.timeoutId != 0) {
            GLib.Source.remove(this.timeoutId)
            this.timeoutId = 0
        }
        if (this.container != null) {
            Main.panel._rightBox.remove_child(this.container)
            this.container.destroy()
            this.container = null
        }
        this.netSpeedLabel = null
        this._settings = null
    }
}

// The end.
