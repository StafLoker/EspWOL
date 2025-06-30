#include "routes.h"

void sendJsonResponse(int statusCode, bool success, const String &message) {
  JsonDocument doc;
  doc[F("success")] = success;
  doc[F("message")] = message;

  String response;
  serializeJson(doc, response);
  server.send(statusCode, FPSTR(CONTENT_TYPE_JSON), response);
}

void sendJsonResponse(int statusCode, bool success, const String &message, const JsonDocument &dataDoc) {
  JsonDocument doc;
  doc[F("success")] = success;
  doc[F("message")] = message;
  doc[F("data")] = dataDoc;

  String response;
  serializeJson(doc, response);
  server.send(statusCode, FPSTR(CONTENT_TYPE_JSON), response);
}

bool isAuthenticated() {
  bool valid = false;

  if (server.hasHeader(FPSTR(HEADER_SESSION_TOKEN))) {
    String sessionToken = server.header(FPSTR(HEADER_SESSION_TOKEN));
    valid = isSessionValid(sessionToken);
  }

  if (!valid) {
    sendJsonResponse(401, false, FPSTR(MSG_AUTH_REQUIRED));
  }

  return valid;
}

void setupRoutes() {
  setupAuthRoutes();
  setupHostRoutes();
  setupNetworkRoutes();
  setupSettingsRoutes();
  setupWebRoutes();
}