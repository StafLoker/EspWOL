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
   <a href="https://github.com/MonitorControl/MonitorControl"><img src="https://img.shields.io/badge/platform-ESP8266-blue.svg?style=flat" alt="platform"/></a>

   <p>This project provides a web-based interface for power on hosts using an ESP8266 and Wake On Lan magic packets.</p>

<img src="ui.png" width="824" alt="Screenshot">
</div>

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

1. **Clone the Repository**:  
   `git clone [repository-url]`  
2. **Open Project**: Open the cloned project in the Arduino IDE.  
3. **Install Libraries**: Install all required libraries via the Arduino IDE’s **Library Manager**.  
4. **Upload Code**: Connect your ESP8266 board and upload the code.  

## Usage

1. **Access Web Interface**:  
   - Power the ESP8266 and connect it to Wi-Fi.  
   - Open the IP address shown in the Serial Monitor using a web browser.  

2. **Manage Hosts**:  
   - **Add Host**: Click the `+` button under **Registered Hosts**.  
   - **Wake Host**: Click the **play** button (▶️) next to a host to send a WoL request.  

### Updating to the Latest Version

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
4. Upload **version 2.x.x** to the device with the **"Erase all content"** option enabled.  
5. Click the **Export** button again.  
6. Upload the previously exported file.  
7. Click **Import**.  
8. Migration complete!