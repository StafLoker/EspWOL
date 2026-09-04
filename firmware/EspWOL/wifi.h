#ifndef WIFI_H
#define WIFI_H

const char* PORTAL_MENU[] = { "wifi", "info", "sep", "restart", "erase" };

// Applies the app's dim theme to the WiFiManager captive portal.
// Call before wifiManager.autoConnect().
void wifi_setup_portal();

// Applies the stored network config: static IP via WiFiManager, or DHCP.
void wifi_apply_ip_config();

#endif
