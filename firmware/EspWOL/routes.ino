#include "routes.h"

void sendJsonResponse(int statusCode, bool success, const String &message) {
  JsonDocument doc;
  doc[F("success")] = success;
  doc[F("message")] = message;

  String response;
  serializeJson(doc, response);
  server.send(statusCode, "application/json", response);
}


void sendJsonResponse(int statusCode, bool success, const String &message, const JsonDocument &dataDoc) {
  JsonDocument doc;
  doc[F("success")] = success;
  doc[F("message")] = message;
  doc[F("data")] = dataDoc;

  String response;
  serializeJson(doc, response);
  server.send(statusCode, "application/json", response);
}


bool isAuthenticated() {
  bool valid = false;

  if (server.hasHeader("X-Session-Token")) {
    String sessionToken = server.header("X-Session-Token");

    valid = isSessionValid(sessionToken);
  }

  if (!valid) {
    sendJsonResponse(401, false, "Authentication required");
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