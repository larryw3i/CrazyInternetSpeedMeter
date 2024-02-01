/*
 * Name: Crazy Internet Speed Meter
 * Description: A simple and minimal internet speed meter extension for Gnome
 * Shell.
 * Author: larryw3i
 * GitHub: https://github.com/larryw3i/CrazyInternetSpeedMeter
 * License: GPLv3.0
 *
 * Name: Internet Speed Meter
 * Description: A simple and minimal internet speed meter extension for Gnome
 * Shell.
 * Author: Al Shakib
 * GitHub: https://github.com/AlShakib/InternetSpeedMeter
 * License: GPLv3.0
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
    static unitBase = 1024.0 // 1 GB == 1024MB or 1MB == 1024KB etc.
    static units = ['KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s', 'EB/s']

    float_scale = 1
    defaultNetSpeedText = ' '.repeat(this.float_scale + 6)
    prevUploadBytes = 0
    prevDownloadBytes = 0
    container = null
    netSpeedLabel = null
    timeoutId = 0
    arrowChar = '\u21c5'

    getShowRightArrow() {
        return this._settings.get_boolean('show-right-arrow')
    }

    getShowLeftArrow() {
        return this._settings.get_boolean('show-left-arrow')
    }

    getShowBytePerSecondText() {
        return this._settings.get_boolean('show-byte-per-second-text')
    }

    getRefreshThresholdInSecond() {
        return this._settings.get_int('refresh-threshold-in-second')
    }

    getShowBorder() {
        return this._settings.get_boolean('show-border')
    }

    getNetSpeedLabelStyleClass() {
        return this.getShowBorder()
            ? 'netSpeedLabelWithBorder'
            : 'netSpeedLabel'
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
                    this.getRefreshThresholdInSecond() /
                    CrazyInternetSpeedMeter.unitBase

                // Current download speed
                let downloadSpeed =
                    (downloadBytes - this.prevDownloadBytes) /
                    this.getRefreshThresholdInSecond() /
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
        // if this.settings
        let i = 0
        while (speed >= CrazyInternetSpeedMeter.unitBase) {
            // Convert speed to KB, MB, GB or TB
            speed /= CrazyInternetSpeedMeter.unitBase
            ++i
        }
        let speed_unit = CrazyInternetSpeedMeter.units[i]

        return this.getFormattedSpeedByDefault(speed, speed_unit)
    }

    getFormattedSpeedByDefault(speed, speed_unit) {
        speed = speed.toFixed(this.float_scale).toString()
        let split_speeds = speed.split('.')
        let speed_int = split_speeds[0]
        let speed_float = split_speeds[1]

        if (speed_int.length < 4) {
            if (this.getShowLeftArrow()) {
                speed_int =
                    this.arrowChar +
                    ' '.repeat(3 - speed_int.length) +
                    speed_int
            } else {
                speed_int = ' '.repeat(4 - speed_int.length) + speed_int
            }
        }
        speed = speed_int + '.' + speed_float
        if (this.getShowBytePerSecondText()) {
            speed_unit = speed_unit.slice(0, -3)
        }
        speed = speed + speed_unit
        if (this.getShowRightArrow()) {
            speed = speed + this.arrowChar
        }

        return speed
    }

    bindUpdateNetSpeed() {
        if (this.timeoutId != 0) {
            GLib.Source.remove(this.timeoutId)
            this.timeoutId = 0
        }
        this.timeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this.getRefreshThresholdInSecond(),
            this.updateNetSpeed.bind(this)
        )
    }

    enable() {
        this._settings = this.getSettings()

        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false)

        this.netSpeedLabel = new St.Label({
            text: this.defaultNetSpeedText,
            style_class: this.getNetSpeedLabelStyleClass(),
            y_align: Clutter.ActorAlign.CENTER,
        })
        this._indicator.add_child(this.netSpeedLabel)

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.uuid, this._indicator)

        this._indicator.menu.addAction(_('Preferences'), () =>
            this.openPreferences()
        )

        this._settings.connect('changed::refresh-threshold-in-second', () => {
            this.bindUpdateNetSpeed()
        })

        this._settings.connect('changed::show-left-arrow', () => {
            if (this.getShowLeftArrow()) {
                this._settings.set_boolean('show-right-arrow', false)
            }
        })

        this._settings.connect('changed::show-right-arrow', () => {
            if (this.getShowRightArrow()) {
                this._settings.set_boolean('show-left-arrow', false)
            }
        })

        this._settings.connect('changed::show-border', () => {
            this.netSpeedLabel.set_style_class_name(
                this.getNetSpeedLabelStyleClass()
            )
        })

        let bytes = this.getBytes()
        this.prevDownloadBytes = bytes[0]
        this.prevUploadBytes = bytes[1]

        this.bindUpdateNetSpeed()
    }

    disable() {
        if (this.timeoutId != 0) {
            GLib.Source.remove(this.timeoutId)
            this.timeoutId = 0
        }
        if (this._indicator != null) {
            Main.panel._rightBox.remove_child(this._indicator)
            this._indicator.destroy()
            this._indicator = null
        }
        this.netSpeedLabel = null
        this._settings = null
    }
}

// The end.
