#include "auth_routes.h"

// =============================================================================
// CONFIGURATION OF AUTHENTICATION PATHS
// =============================================================================

void setupAuthRoutes() {
  server.on(FPSTR(ROUTE_LOGIN), HTTP_POST, handleLogin);
  server.on(FPSTR(ROUTE_LOGOUT), HTTP_POST, handleLogout);
}

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

String generateSessionToken() {
  String sessionToken = "";
  const char charset[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (int i = 0; i < 32; i++) {
    sessionToken += charset[random(0, sizeof(charset) - 2)];
  }

  return sessionToken;
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
  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (!doc.containsKey(F("username")) || !doc.containsKey(F("password"))) {
    sendJsonResponse(400, false, "Missing username or password");
    return;
  }

  String username = doc[F("username")].as<String>();
  String password = doc[F("password")].as<String>();

  if (validateCredentials(username, password)) {
    String sessionToken = createSession(username);

    JsonDocument responseDoc;
    responseDoc[F("username")] = username;
    responseDoc[F("token")] = sessionToken;

    sendJsonResponse(200, true, "Login successful", responseDoc);
  } else {
    sendJsonResponse(401, false, "Invalid credentials");
  }
}

void handleLogout() {
  if (isAuthenticated()) {
    String sessionToken = server.header(FPSTR(HEADER_SESSION_TOKEN));
    destroySession(sessionToken);

    sendJsonResponse(200, true, "Logout successful");
  }
}