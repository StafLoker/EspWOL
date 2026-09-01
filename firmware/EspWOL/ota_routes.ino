#include "ota_routes.h"

static bool otaShouldReboot = false;
static unsigned long otaRebootAt = 0;

static bool otaAuthorized = false;

void setupOtaRoutes() {
  server.on(FPSTR(ROUTE_UPDATE), HTTP_GET, handleUpdatePage);
  // The upload handler runs first (per chunk), then the result handler once done.
  server.on(FPSTR(ROUTE_UPDATE), HTTP_POST, handleUpdateResult, handleUpdateUpload);
}

void handleUpdatePage() {
  if (!isAuthenticated()) return;
  server.sendHeader(F("Content-Encoding"), F("gzip"));
  server.send_P(200, CONTENT_TYPE_HTML, (const char *)updateHtmlPage, updateHtmlPageLen);
}

void handleUpdateUpload() {
  HTTPUpload &upload = server.upload();

  switch (upload.status) {
    case UPLOAD_FILE_START: {
      // Check credentials without answering: writing a response mid-body would
      // corrupt the upload. handleUpdateResult sends the 401 afterwards.
      User user = loadUser();
      otaAuthorized = server.authenticate(user.username.c_str(), user.password.c_str());
      if (!otaAuthorized) return;

      WiFiUDP::stopAll();
      uint32_t maxSketchSpace = (ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000;
      Update.runAsync(true);
      Update.begin(maxSketchSpace, U_FLASH);
      break;
    }
    case UPLOAD_FILE_WRITE:
      if (otaAuthorized && !Update.hasError()) {
        Update.write(upload.buf, upload.currentSize);
      }
      break;
    case UPLOAD_FILE_END:
      if (otaAuthorized) {
        Update.end(true);
      }
      break;
    case UPLOAD_FILE_ABORTED:
      if (otaAuthorized) {
        Update.end();
      }
      break;
  }
  yield();
}

void handleUpdateResult() {
  if (!otaAuthorized) {
    if (!isAuthenticated()) return;  // sends the 401 challenge
  }

  if (Update.hasError()) {
    String err;
    {
      StreamString s;
      Update.printError(s);
      err = s.c_str();
    }
    server.send(400, F("text/plain"), err);
    return;
  }

  server.sendHeader(F("Connection"), F("close"));
  server.send(200, F("text/plain"), F("OK"));
  otaShouldReboot = true;
  otaRebootAt = millis() + 1000;
}

// Called from loop()
void otaLoop() {
  if (otaShouldReboot && millis() >= otaRebootAt) {
    otaShouldReboot = false;
    ESP.restart();
  }
}
