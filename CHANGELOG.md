# Changelog

All notable changes to EspWOL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.2] - 2026-09-05

### Fixed
- **The periodic ping sweep kept running unthrottled after disabling it.** Setting the ping period to 0 stopped the timer but left a sweep already in progress running host-to-host with no delay until it reached the end of the host list. Disabling the sweep now also aborts the one in progress
- Hosts renamed via the API no longer trigger an extra `GET /hosts` request: `PUT /hosts`, `PUT /account` and `PUT /settings/ping_period` already return the updated data, so the web interface applies it directly instead of re-fetching

### Changed
- **Host field `status` renamed to `up`** in the API, web interface, and firmware, to avoid confusion with non-boolean "status" values (e.g. `healthy`)
- `PUT /settings/network` no longer returns the network config in its response, since the device restarts immediately after and nothing reads it
- Ping sweep logic extracted from `EspWOL.ino` into its own `ping.h`/`ping.ino` module
- Duplicate-host check and password/MAC validation rewritten so their loops express the stop condition in the loop header, instead of exiting early from inside the loop body

## [3.0.1] - 2026-09-04

### Fixed
- **Uploading a firmware image at `/update` wiped the host database, settings and credentials.** Release binaries were built for `esp8266:esp8266:generic`, whose default flash layout is 1MB with a 64KB filesystem, not the 4MB (FS:2MB) layout of the LOLIN(WEMOS) D1 mini this firmware targets. After the update the firmware looked for the filesystem at an offset where it does not live, `LittleFS.begin()` failed, and startup formatted the flash it could not mount. Release builds now pin an explicit layout per binary, and startup no longer formats a filesystem it cannot mount

### Changed
- **Releases now ship one binary per flash layout**, named after the layout it was built for, replacing the single `EspWOL-generic-<tag>.bin`:
  - `EspWOL-4M2M-<tag>.bin` for 4MB boards (LOLIN(WEMOS) D1 mini, NodeMCU, ESP-12E/F), with a 2MB filesystem
  - `EspWOL-1M64-<tag>.bin` for 1MB boards (ESP-01S, D1 mini Lite), with a 64KB filesystem
- The release pipeline checks that each image fits the over-the-air slot of its layout, so a build too large to update over `/update` fails in CI instead of on the device
- CI builds the web interface once and hands the generated headers to the firmware jobs, rather than rebuilding it for every layout

### Which binary to download
Pick the one matching the flash size your board is flashed with; the layout an
image was built for decides whether it finds the filesystem. `EspWOL-4M2M` is
the right choice for a D1 mini or NodeMCU. On 1MB boards the image leaves only
about 7KB spare in the update slot, so `/update` may stop fitting as the
firmware grows.

### Note for existing 3.0.0 devices
The filesystem on a device running 3.0.0 was written under the wrong layout, so
the first 3.0.1 image will not find it either. Flash 3.0.1 over USB once with
*Erase Flash: All Flash Contents*; updates over `/update` keep their data from
then on.

## [3.0.0] - 2026-09-04

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
