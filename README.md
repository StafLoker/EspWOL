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

- **Add host**: Add new hosts to the list with their name, MAC address, and IP address.
- **Edit host**: Edit the name, MAC address, or IP address of a host.
- **Delete host**: Remove a host from the list (via modal window).
- **Wake on LAN**: Send a WOL request to wake a host remotely.
- **Basic HTTP Authentication**: Enable or disable authentication, and update the username or password as needed.
- **Network Configuration**: Switch seamlessly between static IP and DHCP modes.
- **Host Ping Utility**: Test connectivity by pinging a specified host.
- **Over-The-Air (OTA)**: Password: `ber#912NerYi`
- **Update to last version**: Update to last version without using IDE
- **Dark mode**: Switch between light and dark mode

## Requirements

- ESP8266 board (e.g., NodeMCU, Wemos D1 Mini)
- Arduino IDE
- ESP8266 library
- [WakeOnLan library](https://github.com/a7md0/WakeOnLan)
- [WIFI Manager library](https://github.com/tzapu/WiFiManager)
- [ArduinoJson library](https://github.com/bblanchon/ArduinoJson)
- [ESP8266Ping library](https://github.com/dancol90/ESP8266Ping)
- [ArduinoOTA](https://github.com/JAndrassy/ArduinoOTA)
- [GTimer](https://github.com/GyverLibs/GTimer)
- [AutoOTA](https://github.com/GyverLibs/AutoOTA)

## Installation

1. Clone this repository:
2. Open the project in the Arduino IDE.
3. Install the required libraries from the Library Manager
4. Upload the code to your ESP8266 board.

## Usage

1. Once the ESP8266 is powered and connected to Wi-Fi, navigate to the IP address displayed in the Serial Monitor using your web browser.
2. Use the web interface to manage your registered hosts:
   - Click the `+` button next to the **Registered hosts** title to add a new host.
   - Click the **settings** button next to any host to edit its details.
   - Use the **play** button to send a Wake-on-LAN request to a host.
