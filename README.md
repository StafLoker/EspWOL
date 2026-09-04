<div align="center">
   <img width="93" src="logo.png" alt="Logo">
   <h1><b>EspWOL</b></h1>
   <p><i>~ Wake & play! ~</i></p>
   <p align="center">
      <a href="https://github.com/StafLoker/EspWOL/releases">Releases</a> ·
      <a href="https://stafloker-espwol.apidocumentation.com">Docs</a>
   </p>
</div>

<div align="center">
   <a href="https://github.com/StafLoker/EspWOL/releases"><img src="https://img.shields.io/github/downloads/StafLoker/EspWOL/total.svg?style=flat" alt="downloads"/></a>
   <a href="https://github.com/StafLoker/EspWOL/releases"><img src="https://img.shields.io/github/release-pre/StafLoker/EspWOL.svg?style=flat" alt="latest version"/></a>
   <a href="https://github.com/StafLoker/EspWOL/blob/main/LICENSE"><img src="https://img.shields.io/github/license/StafLoker/EspWOL.svg?style=flat" alt="license"/></a>
   <img src="https://img.shields.io/badge/platform-ESP8266-blue.svg?style=flat" alt="platform"/>
   <div align="center">
      <a href="https://github.com/StafLoker/EspWOL/actions/workflows/ci.yml">
         <img src="https://github.com/StafLoker/EspWOL/actions/workflows/ci.yml/badge.svg" alt="CI"/>
      </a>
      <a href="https://github.com/StafLoker/EspWOL/actions/workflows/release.yml">
         <img src="https://github.com/StafLoker/EspWOL/actions/workflows/release.yml/badge.svg" alt="Release"/>
      </a>
   </div>

   <p>This project provides a web-based interface for power on hosts using an ESP8266 and Wake On Lan magic packets.</p>

<img src="ui.png" width="824" alt="Screenshot">
</div>

## Alerts

> [!IMPORTANT]
> [Instruction](#migration-from-v2xx-to-v3xx) of migration to version `3.x.x`.

## Features

### App logic

- **CRUD Host Management**: Full CRUD functionality to manage host information with persistent storage.
- **Wake on LAN (WoL)**: Send magic packets to wake hosts remotely with real-time feedback.
- **HTTP Basic Authentication**: Every route is protected by HTTP Basic Auth with configurable credentials.
- **Network Configuration**: Switch seamlessly between static IP and DHCP modes with automatic restart.
- **Host Ping Utility**: Test connectivity by pinging specified hosts with automatic status updates.
- **Periodic Ping & Auto-Wake**: Configure periodic pings with automatic WoL for offline hosts.
- **Database Export/Import**: Export and import host databases in CSV or JSON format.

### User experience

- **Mobile-Friendly UI**: Responsive web interface optimized for all screen sizes.
- **Single Neutral Theme**: One low-glare palette that works day and night — no theme switch to maintain.
- **Accessible**: Semantic HTML, keyboard navigation and focus management following WCAG 2.1 AA.
- **Tiny Footprint**: Plain JavaScript web components and hand-written CSS, bundled into a single gzipped page served from flash.

### Other

- **Web OTA Updates**: Upload a new `.bin` from the browser at `/update`, protected by the same credentials.
- **mDNS Support**: Access the web interface using `wol.local` domain name.
- **WiFi Manager**: Built-in WiFi configuration portal, themed to match the main UI.

## Requirements

- **Hardware**: ESP8266 board (e.g., NodeMCU, Wemos D1 Mini).
- **Software**:
  - Arduino IDE
  - ESP8266 Core for Arduino
- **Libraries**:
  - [WakeOnLan](https://github.com/a7md0/WakeOnLan)
  - [WiFiManager](https://github.com/tzapu/WiFiManager)
  - [ArduinoJson](https://github.com/bblanchon/ArduinoJson)
  - [ESP8266Ping](https://github.com/dancol90/ESP8266Ping)
  - [GTimer](https://github.com/GyverLibs/GTimer)

## Installation

### Requirements

Installation of the CH341 driver is required. Use the following links to download and install it:

- **Windows:** [Download CH341SER.EXE](https://wch-ic.com/downloads/CH341SER_EXE.html)
- **Linux** [Download CH341SER_LINUX_ZIP](https://wch-ic.com/downloads/CH341SER_LINUX_ZIP.html)
- **MacOS:** [Download CH341SER_MAC.ZIP](https://wch-ic.com/downloads/CH341SER_MAC_ZIP.html)

After installation, add the following URL to the **Arduino IDE** settings:

```
http://arduino.esp8266.com/stable/package_esp8266com_index.json
```

Then, install the latest version of the **ESP8266** board package via the **Boards Manager** in the Arduino IDE.

---

### Method 1: Using Arduino IDE

1. **Clone the Repository:**
   ```bash
   git clone [repository-url]
   ```
2. **Open the Project:** Open `firmware/EspWOL/EspWOL.ino` in the **Arduino IDE**.
3. **Install Required Libraries:** Use the **Library Manager** in the Arduino IDE to install all necessary libraries.
4. **Upload the Code:** Connect your ESP8266 board and upload the code.

---

### Method 2: Using Precompiled Binary

1. **Download the Binary File** (`EspWOL.bin`) from the latest release.
2. **Flash the Firmware:** Use one of the following online tools to flash the binary:
   - [ESP Huhn](https://esp.huhn.me)
   - [ESPHome Web](https://web.esphome.io)

Once a device is already running v3, later updates can be uploaded from the browser at `/update` instead of reflashing over USB.

## Web UI development

The web interface lives in `web/` and is built with [Vite](https://vite.dev). No CSS framework — plain hand-written CSS, since every unused byte is flash the device pays for. The main app is plain-JS Web Components under `web/src/`; each component keeps its markup and styles together (`web/src/components/<name>/`). Styles are split by concern under `web/src/styles/` and pulled in from `web/src/style.css`.

```bash
cd web
pnpm install
pnpm dev      # local dev server
pnpm build    # bundle + gzip + generate firmware/EspWOL/*.h
pnpm format   # oxfmt
```

`pnpm build` runs Vite then `build-firmware.js`, which:

- inlines the main app into one HTML file and gzips it → `index_page.h`;
- minifies and gzips the two standalone pages in `web/public/` → `not_found_page.h` (404) and `update_page.h` (OTA uploader);
- minifies the captive-portal theme in `web/public/portal.css` → `wifi_portal_style.h`.

Commit the generated `firmware/EspWOL/*.h` together with the sources — the firmware compiles from those headers, not from `web/`.

The three pages in `web/public/` are standalone: they cannot import the app stylesheet, so their `:root` tokens are copied from `web/src/styles/tokens.css` and must be kept in sync with it.

## Usage

### Initial Setup

1. **First Boot**:

   - Power the ESP8266. If no WiFi is configured, it will create an access point named `WOL-ESP8266`.
   - Connect to this network and configure your WiFi credentials.

2. **Access Web Interface**:

   - After WiFi setup, find the device IP address (check your router or use `wol.local` if mDNS is enabled).
   - Open the IP address in a web browser.

3. **Login**:
   - The browser asks for credentials. Default: `glavniy` / `Lep#Chick43`
   - Change these credentials immediately in Settings → Account.

### Configuration

- **Network Settings**: Configure static IP or use DHCP.
- **Ping Period**: Set automatic ping intervals (0 to disable, or 1 min to 24 hours).
- **Authentication**: Update username and password.
- **WiFi Reset**: Reset WiFi credentials to reconfigure network.
- **Firmware Update**: Upload a new `.bin` from Settings → System.

## Migration from v2.x.x to v3.x.x

> [!CAUTION]
> Version 3.x.x introduces breaking changes in authentication and data storage format.

> [!NOTE]
> Session-token login, the light/dark theme switch, UI translations and network/IDE OTA (ArduinoOTA) were removed in v3. Authentication is now HTTP Basic Auth and firmware updates go through the `/update` web page.

1. **Export from v2.x.x**:

   - Export your host database before upgrading.
   - Note your current settings and credentials.

2. **Flash v3.x.x**:

   - Upload **version 3.x.x** to the device with the **"All Flash Contents"** option enabled.

3. **Reconfigure**:

   - Set up WiFi connection.
   - Login with default credentials: `glavniy` / `Lep#Chick43`
   - Import your host database via the Import function.
   - Reconfigure your settings and update credentials.

4. **Verify**:
   - Test all hosts and functionality.
   - Migration complete!

## Technical Details

- **Authentication**: HTTP Basic Auth on every route, including the OTA upload
- **Password Requirements**: 8–32 characters with uppercase, lowercase, and a special character
- **Storage**: LittleFS for persistent configuration and host data
- **Network**: Supports both DHCP and static IP configuration
- **Ping Values**: Configurable intervals from 1 minute to 24 hours
- **MAC Format**: Standard format AA:BB:CC:DD:EE:FF
- **File System**: JSON-based configuration files
- **Web Assets**: Pages minified at build time, stored pre-gzipped in PROGMEM and served with `Content-Encoding: gzip`

## Troubleshooting

- **Can't connect to WiFi**: Reset WiFi settings via the web interface or reflash firmware
- **Forgot password**: Reflash firmware to reset to defaults
- **Host won't wake**: Verify MAC address, ensure target device supports WoL
- **mDNS not working**: Some networks don't support mDNS; use IP address instead
- **Browser keeps old credentials**: Basic Auth is cached by the browser; close the window or clear the site's HTTP auth to log in as someone else

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for any improvements.

## License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for the full text.

The GPLv3 lets people do almost anything they want with this project, **except distributing closed source versions**. Any redistributed copy or modified version must also be released under the GPLv3 with its source available.
