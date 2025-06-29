#include "auth_routes.h"

// =============================================================================
// CONFIGURATION OF AUTHENTICATION PATHS
// =============================================================================

void setupAuthRoutes() {
  server.on("/login", HTTP_POST, handleLogin);
  server.on("/logout", HTTP_POST, handleLogout);
}

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

String generateSessionToken() {
  String sessionId = "";
  const char charset[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (int i = 0; i < 32; i++) {
    sessionId += charset[random(0, sizeof(charset) - 1)];
  }

  return sessionId;
}

void cleanExpiredSessions() {
  unsigned long currentTime = millis();

  for (auto it = activeSessions.begin(); it != activeSessions.end();) {
    if (currentTime - it->second > SESSION_TIMEOUT) {
      it = activeSessions.erase(it);
    } else {
      ++it;
    }
  }
}

bool validateCredentials(const String &username, const String &password) {
  User user = loadUser();

  return (username == user.username && password == user.password);
}

bool isSessionValid(const String &sessionToken) {
  auto it = activeSessions.find(sessionToken);
  if (it != activeSessions.end()) {
    return (millis() - it->second) <= SESSION_TIMEOUT;
  }

  return false;
}

String createSession(const String &username) {
  cleanExpiredSessions();

  String sessionToken = generateSessionToken();

  activeSessions[sessionToken] = millis();

  return sessionToken;
}

void destroySession(const String &sessionToken) {
  auto it = activeSessions.find(sessionToken);
  if (it != activeSessions.end()) {
    activeSessions.erase(it);
  }
}

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

void handleLogin() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, "Missing body");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, false, "Invalid JSON");
    return;
  }

  if (!doc.containsKey("username") || !doc.containsKey("password")) {
    sendJsonResponse(400, false, "Missing username or password");
    return;
  }

  String username = doc["username"].as<String>();
  String password = doc["password"].as<String>();

  if (validateCredentials(username, password)) {
    String sessionToken = createSession(username);

    JsonDocument responseDoc;
    responseDoc["username"] = username;
    responseDoc["token"] = sessionId;

    sendJsonResponse(200, true, "Login successful", responseDoc);
  } else {
    sendJsonResponse(401, false, "Invalid credentials");
  }
}

void handleLogout() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, "Missing body");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, false, "Invalid JSON");
    return;
  }

  if (doc.containsKey("token")) {
    String sessionToken = doc["token"].as<String>();
    destroySession(sessionToken);
  }

  sendJsonResponse(200, true, "Logout successful");
}