# Changelog

All notable changes to EspWOL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - Unreleased

Breaking release. The REST API was reorganized and the host model changed, so
v2 clients and stored databases are not compatible without migration.

### Added
- `/update`: firmware images can be uploaded straight from the browser, protected by the same credentials
- `/settings`, returning the about block, ping period and network settings in one request
- `/settings/ping_period`, exposing the ping sweep interval as a device-wide setting
- Free-memory checks before adding a host and before each entry on import, so the device refuses work it cannot store
- Memory metadata (heap, flash and host-slot usage) on the host responses
- Wi-Fi configuration portal themed to match the main interface

### Changed
- **API routes reorganized**: `/ping` and `/wake` are now `/hosts/ping` and `/hosts/wake`, `/import` is `/hosts/import`, `/networkSettings` is `/settings/network`, `/about` is `/settings/about`, `/resetWifi` is `/settings/reset_wifi`, and `/authenticationSettings` is `/account`
- **Responses use a common envelope** of `success`, `message` and `data`, replacing the ad-hoc shapes returned by v2
- **The per-host `periodicPing` interval is gone.** Hosts now carry a boolean `autoWake`, and the sweep interval is a single device-wide setting at `/settings/ping_period`
- Hosts are addressed by a server-assigned `id` and report a `status` field
- Web interface rewritten in plain JavaScript web components and hand-written CSS, replacing Bootstrap 5.3.3
- The interface is bundled into a single gzipped page served from flash, so it no longer loads Bootstrap from a CDN and works without internet access
- Single neutral theme replaces the light and dark modes
- Firmware split into per-concern modules (hosts, auth, settings, server, memory, wifi, OTA)

### Fixed
- Host IDs were reused after a delete, so a new host could inherit a deleted one's identity
- RAM was reset when fetching version information
- Authorization header was not captured on some routes
- IP field validation accepted malformed addresses

### Removed
- **Self-update from GitHub releases.** `/updateVersion` and the AutoOTA dependency are gone; update by uploading a `.bin` at `/update`
- **ArduinoOTA** and its network update port
- Bootstrap and the CDN it was loaded from

### Migration from 2.x.x
- Export the host database before upgrading; the stored format changed and is not read by v3
- After flashing, re-import and set `autoWake` per host, then choose a sweep interval in the settings
- API clients must move to the new routes, unwrap the `data` field, and replace `periodicPing` with `autoWake`

## [2.3.3] - 2025-04-06

### Fixed
- Firmware path in the build pipeline; build files are no longer committed to the repository

## [2.3.2] - 2025-04-06

### Fixed
- IP field validation
- Build and release pipeline did not commit new `.bin` files
- Build and release pipeline lacked write permissions

## [2.3.1] - 2025-03-28

### Added
- Build pipeline producing the firmware `.bin`
- Release-check pipeline
- Build badge in the README

### Changed
- Build pipelines use Arduino CLI instead of PlatformIO, via `setup-arduino-cli`
- Button sequence adapted to mobile screens

## [2.3.0] - 2025-02-27

### Added
- Styled "not found" page

### Changed
- Improved the WiFi reset flow; the ESP now restarts after resetting WiFi settings

### Fixed
- WiFi reset was not handled when the server sent no response

## [2.2.1] - 2025-02-26

### Fixed
- OTA interface was not detected
- Waiting time after the update progress bar filled

## [2.2.0] - 2025-02-26

### Added
- mDNS support: reach the interface at `wol.local`
- Explicit response when no update is available

## [2.1.0] - 2025-02-26

### Added
- DNS field in the network settings
- Update modal showing release notes for new versions
- Backend check for errors while updating to the latest version

### Changed
- Toast delay increased from 3 to 5 seconds

### Fixed
- Update check when static IP is enabled
- `AutoOTA::Error::NoUpdates` was reported as an error

## [2.0.0] - 2025-02-18

### Added
- Periodic ping with automatic Wake-on-LAN for offline hosts
- Database import/export, with an import endpoint and modal
- Request body validation for IP, MAC, and boolean fields
- Duplicate-host detection when adding and editing
- Dark mode with a toggle
- Toast notifications and a top loading progress bar
- API documentation

### Changed
- Migrated from Bootstrap 4 to Bootstrap 5 and removed jQuery
- Reorganized the web page into per-concern API and script files
- Renamed "PC" to "host" throughout
- Reworked the API and made it consistent across pages

### Fixed
- Page reloaded when submitting the network, auth, add-host, and edit-host forms
- Timer creation when the periodic ping value is 0
- `lastPing` value for hosts without periodic ping

## [1.2.3] - 2025-02-16

### Added
- Database export

### Fixed
- Undefined variable in the export function

## [1.2.2] - 2025-01-18

### Added
- `/about` endpoint and an About card in the settings

### Changed
- Updated Bootstrap to 4.6.2 and switched CDN

## [1.2.1] - 2025-01-17

### Added
- Functionality to the demo page

## [1.2.0] - 2025-01-16

### Added
- OTA updates

## [1.1.1] - 2025-01-16

### Added
- Checkbox toggling that enables and disables the related fields

## [1.1.0] - 2025-01-16

### Added
- Ping endpoint, ping indicator, and loading animation
- Static IP and HTTP authentication settings, with a settings page
- Redirect to the new IP after updating the network settings
- Persistence for the network and authentication configuration

### Changed
- HTML page moved into a `.h` file and stored in `PROGMEM`
- Removed serial output

### Fixed
- IP parsing in the network configuration
- `POST` handling for `/update_network_settings` and `/update_authentication`

## [1.0.1] - 2025-01-15

### Added
- Demo page

## [1.0.0] - 2025-01-15

### Added
- Web interface to manage hosts and send Wake-on-LAN magic packets from an ESP8266
- HTTP Basic Authentication on every route
