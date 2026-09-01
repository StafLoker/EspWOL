#include "routes.h"

void sendJsonResponse(int statusCode, bool success, const String &message, bool addMemoryMeta) {
  JsonDocument doc;
  doc[F("success")] = success;
  doc[F("message")] = message;

  if (addMemoryMeta) {
    createMemoryMetadata(doc);
  }

  String response;
  serializeJson(doc, response);
  server.send(statusCode, FPSTR(CONTENT_TYPE_JSON), response);
}

void sendJsonResponse(int statusCode, bool success, const String &message, const JsonDocument &dataDoc, bool addMemoryMeta) {
  JsonDocument doc;
  doc[F("success")] = success;
  doc[F("message")] = message;
  doc[F("data")] = dataDoc;

  if (addMemoryMeta) {
    createMemoryMetadata(doc);
  }

  String response;
  serializeJson(doc, response);
  server.send(statusCode, FPSTR(CONTENT_TYPE_JSON), response);
}

bool isAuthenticated() {
  User user = loadUser();

  if (server.authenticate(user.username.c_str(), user.password.c_str())) {
    return true;
  }

  server.requestAuthentication(BASIC_AUTH, String(FPSTR(AUTH_REALM)).c_str(), String(FPSTR(MSG_AUTH_REQUIRED)));
  return false;
}

void setupRoutes() {
  setupHostRoutes();
  setupSettingsRoutes();
  setupOtaRoutes();
  setupWebRoutes();
}
