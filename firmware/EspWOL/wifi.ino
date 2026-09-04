#include "wifi.h"
#include "wifi_portal_style.h"

// Held for as long as the portal runs; WiFiManager keeps a pointer into it.
static String portal_style;

void wifi_setup_portal() {
  wifi_manager.setTitle(F("EspWOL"));
  wifi_manager.setScanDispPerc(true);        // percentages read better than the icon sprite
  wifi_manager.setMinimumSignalQuality(20);  // hide APs below ~-90 dBm; they would not associate anyway
  wifi_manager.setMenu(PORTAL_MENU, sizeof(PORTAL_MENU) / sizeof(PORTAL_MENU[0]));

  wifi_manager.setDebugOutput(false);

  wifi_manager.setAPCallback([](WiFiManager* wm) {
    portal_style = FPSTR(PORTAL_STYLE);  // flash -> RAM, once, only in portal mode
    wm->setCustomHeadElement(portal_style.c_str());
  });
}

void wifi_apply_ip_config() {
  if (settings.network_config.enable) {
    wifi_manager.setSTAStaticIPConfig(settings.network_config.ip, settings.network_config.gateway, settings.network_config.network_mask, settings.network_config.dns);
  } else {
    wifi_station_dhcpc_start();
  }
}
