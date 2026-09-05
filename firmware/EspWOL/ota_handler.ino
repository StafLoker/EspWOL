#include "ota_handler.h"
#include "update_page.h"

static bool ota_should_reboot = false;
static unsigned long ota_reboot_at = 0;

static bool ota_upload_started = false;
static bool ota_auth_failed = false;

static void ota_handle_page() {
  if (!auth_ok()) return;
  server.sendHeader(F("Content-Encoding"), F("gzip"));
  server.send_P(200, CONTENT_TYPE_HTML, (const char *)UPDATE_PAGE_HTML, UPDATE_PAGE_HTML_LEN);
}

static void ota_handle_upload() {
  HTTPUpload &upload = server.upload();
  uint32_t max_sketch_space;

  switch (upload.status) {
    case UPLOAD_FILE_START:
      ota_auth_failed = false;

      if (!server.authenticate(user.username.c_str(), user.password.c_str())) {
        ota_auth_failed = true;
        return;
      }

      WiFiUDP::stopAll();

      Update.clearError();

      max_sketch_space = (ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000;
      Update.runAsync(true);

      ota_upload_started = Update.begin(max_sketch_space, U_FLASH);
      break;

    case UPLOAD_FILE_WRITE:
      if (ota_upload_started && !Update.hasError()) {
        Update.write(upload.buf, upload.currentSize);
      }
      break;
    case UPLOAD_FILE_END:
      if (ota_upload_started) {
        Update.end(true);
      }
      break;
    case UPLOAD_FILE_ABORTED:
      if (ota_upload_started) {
        Update.end();
      }
  }
  yield();
}

static void ota_handle_result() {
  StreamString err;

  if (ota_auth_failed) {
    ota_auth_failed = false;
    auth_ok();  // sends the 401 challenge
    return;
  }

  if (!ota_upload_started && !Update.hasError()) {
    if (!auth_ok()) return;
    server.send(400, F("text/plain"), F("No firmware uploaded"));
    return;
  }

  ota_upload_started = false;

  if (Update.hasError()) {
    Update.printError(err);
    server.send(400, F("text/plain"), err);
    return;
  }

  server.sendHeader(F("Connection"), F("close"));
  server.send(200, F("text/plain"), F("OK"));
  ota_should_reboot = true;
  ota_reboot_at = millis() + 1000;
}

// Called from loop()
void ota_loop() {
  if (ota_should_reboot && millis() >= ota_reboot_at) {
    ota_should_reboot = false;
    ota_reboot_at = 0;
    ESP.restart();
  }
}

void ota_setup_routes() {
  server.on(FPSTR(ROUTE_UPDATE), HTTP_GET, ota_handle_page);
  server.on(FPSTR(ROUTE_UPDATE), HTTP_POST, ota_handle_result, ota_handle_upload);
}
