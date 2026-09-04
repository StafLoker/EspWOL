#include "wifi.h"
#include "wifi_portal_style.h"

// Held for as long as the portal runs; WiFiManager keeps a pointer into it.
static String portal_style;

void wifi_setup_portal() {
  wifiManager.setTitle(F("EspWOL"));
  wifiManager.setDarkMode(true);
  wifiManager.setScanDispPerc(true);  // percentages read better than the icon sprite
  wifiManager.setMenu(PORTAL_MENU, sizeof(PORTAL_MENU) / sizeof(PORTAL_MENU[0]));

  wifiManager.setDebugOutput(false);

  wifiManager.setAPCallback([](WiFiManager* wm) {
    portal_style = FPSTR(PORTAL_STYLE);  // flash -> RAM, once, only in portal mode
    wm->setCustomHeadElement(portal_style.c_str());
  });
}

void wifi_apply_ip_config() {
  if (settings.network_config.enable) {
    wifiManager.setSTAStaticIPConfig(settings.network_config.ip, settings.network_config.gateway, settings.network_config.network_mask, settings.network_config.dns);
  } else {
    wifi_station_dhcpc_start();
  }
}
