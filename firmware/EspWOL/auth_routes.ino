#include "auth_routes.h"
#include "routes.h"
#include "repository.h"

// Variables para autenticación
std::map<String, Session> activeSessions;
const unsigned long SESSION_TIMEOUT = 3600000; // 1 hora en milliseconds

// =============================================================================
// CONFIGURACIÓN DE RUTAS DE AUTENTICACIÓN
// =============================================================================

void setupAuthRoutes() {
  server.on("/login", HTTP_POST, handleLogin);
  server.on("/logout", HTTP_POST, handleLogout);
}

// =============================================================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================================================

unsigned long generateToken() {
  return millis() + random(1000, 9999);
}

String generateSessionId() {
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
    if (currentTime - it->second.createdAt > SESSION_TIMEOUT) {
      it = activeSessions.erase(it);
    } else {
      ++it;
    }
  }
}

bool validateCredentials(const String &username, const String &password) {
  extern Authentication authentication;
  
  // Si la autenticación está deshabilitada, permitir acceso
  if (!authentication.enable) {
    return true;
  }
  
  return (username == authentication.username && password == authentication.password);
}

bool isSessionValid(const String &sessionId) {
  cleanExpiredSessions();
  
  auto it = activeSessions.find(sessionId);
  if (it != activeSessions.end()) {
    unsigned long currentTime = millis();
    return (currentTime - it->second.createdAt) <= SESSION_TIMEOUT;
  }
  
  return false;
}

String createSession(const String &username) {
  String sessionId = generateSessionId();
  
  Session session;
  session.token = generateToken();
  session.createdAt = millis();
  session.username = username;
  
  activeSessions[sessionId] = session;
  
  return sessionId;
}

void destroySession(const String &sessionId) {
  auto it = activeSessions.find(sessionId);
  if (it != activeSessions.end()) {
    activeSessions.erase(it);
  }
}

// =============================================================================
// RUTAS DE AUTENTICACIÓN
// =============================================================================

void handleLogin() {
  extern Authentication authentication;
  
  // Si la autenticación está deshabilitada, devolver éxito sin hacer nada
  if (!authentication.enable) {
    sendJsonResponse(200, "Authentication disabled - access granted", true);
    return;
  }
  
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "Missing body", false);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, "Invalid JSON", false);
    return;
  }

  if (!doc.containsKey("username") || !doc.containsKey("password")) {
    sendJsonResponse(400, "Missing username or password", false);
    return;
  }

  String username = doc["username"].as<String>();
  String password = doc["password"].as<String>();

  if (validateCredentials(username, password)) {
    // Limpiar sesiones expiradas antes de crear una nueva
    cleanExpiredSessions();
    
    // Crear nueva sesión
    String sessionId = createSession(username);
    
    JsonDocument responseDoc;
    responseDoc["success"] = true;
    responseDoc["message"] = "Login successful";
    responseDoc["sessionId"] = sessionId;
    responseDoc["username"] = username;
    
    sendJsonResponse(200, responseDoc);
  } else {
    sendJsonResponse(401, "Invalid credentials", false);
  }
}

void handleLogout() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "Missing body", false);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, "Invalid JSON", false);
    return;
  }

  if (doc.containsKey("sessionId")) {
    String sessionId = doc["sessionId"].as<String>();
    destroySession(sessionId);
  }

  sendJsonResponse(200, "Logout successful", true);
}