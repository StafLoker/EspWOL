#ifndef OTA_HANDLER_H
#define OTA_HANDLER_H

const char ROUTE_UPDATE[] PROGMEM = "/update";

void ota_setup_routes();

// Drives the deferred reboot after a successful flash. Call from loop().
void ota_loop();

#endif
