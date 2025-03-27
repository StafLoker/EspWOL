<div align="center">
   <img width="150" height="150" src="logo.jpeg" alt="Logo">
   <h1><b>EspWOL</b></h1>
   <p><i>~ Wake & play! ~</i></p>
   <p align="center">
      <a href="https://stafloker.github.io/EspWOL/">Demo</a> ·
      <a href="https://github.com/StafLoker/EspWOL/releases">Releases</a>
   </p>
</div>

<div align="center">
   <a href="https://github.com/StafLoker/EspWOL/releases"><img src="https://img.shields.io/github/downloads/StafLoker/EspWOL/total.svg?style=flat" alt="downloads"/></a>
   <a href="https://github.com/StafLoker/EspWOL/releases"><img src="https://img.shields.io/github/release-pre/StafLoker/EspWOL.svg?style=flat" alt="latest version"/></a>
   <a href="https://github.com/StafLoker/EspWOL/blob/main/LICENSE"><img src="https://img.shields.io/github/license/StafLoker/EspWOL.svg?style=flat" alt="license"/></a>
   <img src="https://img.shields.io/badge/platform-ESP8266-blue.svg?style=flat" alt="platform"/>

   <p>This project provides a web-based interface for power on hosts using an ESP8266 and Wake On Lan magic packets.</p>

<img src="ui.png" width="824" alt="Screenshot">
</div>

## Alerts
> [!IMPORTANT]
> [Instruction](#migration-from-v1xx-to-v2xx) of migration to version `2.x.x`.

> [!IMPORTANT]
> Same [instruction](#migration-from-v1xx-to-v2xx) to upgrade from version `2.0.0` to version >= `2.1.0`.

## Features

- **CRUD Host Management**: CRUD functionality to manage host information.
- **Wake on LAN (WoL)**: Send a WoL request to wake a host remotely.
- **Basic HTTP Authentication**: Enable/disable authentication and update credentials (username/password) as needed.
- **Network Configuration**: Switch seamlessly between static IP and DHCP modes.
- **Host Ping Utility**: Test connectivity by pinging a specified host.
- **Over-The-Air (OTA) Updates**: Secure OTA updates with password: `ber#912NerYi`.
- **Auto-Update**: Update to the latest version without using an IDE via internet.
- **Dark Mode**: Toggle between light and dark themes.
- **Periodic Ping**: Configure periodic pings; if a ping fails, the program attempts to wake the host.
- **Export database**: Export database to **CSV** file.  
- **Import database**: Import database from **CSV** file.
- **mDNS**: You can access the web page using a domain name. The default is `wol.local`.
- **Mobile-Friendly UI**: The web interface is optimized for mobile screens.

## Build Status

<div align="center">
   <a href="https://github.com/StafLoker/EspWOL/actions/workflows/esp8266-ci.yml">
      <img src="https://github.com/StafLoker/EspWOL/actions/workflows/esp8266-ci.yml/badge.svg" alt="ESP8266 CI Build Status"/>
   </a>
</div>

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
  - [ArduinoOTA](https://github.com/JAndrassy/ArduinoOTA)
  - [GTimer](https://github.com/GyverLibs/GTimer)
  - [AutoOTA](https://github.com/GyverLibs/AutoOTA)

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
2. **Open the Project:** Open the cloned project in the **Arduino IDE**.  
3. **Install Required Libraries:** Use the **Library Manager** in the Arduino IDE to install all necessary libraries.  
4. **Upload the Code:** Connect your ESP8266 board and upload the code.  

---

### Method 2: Using Precompiled Binary  

1. **Download the Binary File** (`EspWOL.bin`) from the latest release.  
2. **Flash the Firmware:** Use one of the following online tools to flash the binary:  
   - [ESP Huhn](https://esp.huhn.me)  
   - [ESPHome Web](https://web.esphome.io)  

## Usage

1. **Access Web Interface**:  
   - Power the ESP8266 and connect it to Wi-Fi.  
   - Open the IP address of the board in a web browser (the IP is set using the DHCP protocol).

2. **Manage Hosts**:  
   - **Add Host**: Click the `+` button.  
   - **Wake Host**: Click the **play** button (▶️) next to a host to send a WoL request.  

### Updating to the Latest Version

> [!WARNING]
> In version `2.0.0`, it is not possible to perform an update. This functionality is available starting from version `2.1.0`. [Instruction](#migration-from-v1xx-to-v2xx) to upgrade from version `2.0.0` to version >= `2.1.0`.

1. **Open Settings**:  
   - Click the **Settings** button.  
     - **Green Badge**: Indicates the latest version is installed.  
     - **Yellow Badge**: An update is available.  

2. **Start Update**:  
   - Click the yellow badge, then click **Update** in the next window.  

3. **Wait for Completion**:  
   - Do not disconnect power until the update finishes.

## Migration from v1.x.x to v2.x.x  

1. Ensure your firmware version is **1.2.3**.  
2. Click the **Export** button.  
3. Export the database and download the export file.  
4. Upload **version 2.x.x** to the device with the **"All Flash Contents"** option enabled.  
5. Click the **Export** button again.  
6. Upload the previously exported file.  
7. Click **Import**.  
8. Migration complete!