#include "routes.h"
#include "auth_routes.h"
#include "host_routes.h"
#include "network_routes.h"
#include "settings_routes.h"
#include "web_routes.h"
#include "repository.h"

// =============================================================================
// FUNCIONES UTILITARIAS COMPARTIDAS
// =============================================================================

void sendJsonResponse(int statusCode, const String &message, bool success) {
  String jsonResponse;
  jsonResponse = String("{\"success\":") + (success ? "true" : "false") + ",\"message\":\"" + message + "\"}";
  server.send(statusCode, "application/json", jsonResponse);
}

void sendJsonResponse(int statusCode, const JsonDocument &doc) {
  String jsonResponse;
  serializeJson(doc, jsonResponse);
  server.send(statusCode, "application/json", jsonResponse);
}

bool isAuthenticated() {
  extern Authentication authentication;
  if (authentication.enable && !server.authenticate(authentication.username.c_str(), authentication.password.c_str())) {
    server.requestAuthentication();
    return false;
  }
  return true;
}

bool isSessionAuthenticated() {
  extern Authentication authentication;
  
  // Si la autenticación está deshabilitada, permitir acceso
  if (!authentication.enable) {
    return true;
  }
  
  // Verificar si hay un header de sesión
  if (server.hasHeader("X-Session-Id")) {
    String sessionId = server.header("X-Session-Id");
    return isSessionValid(sessionId);
  }
  
  // Si no hay sesión, usar autenticación básica como fallback
  return isAuthenticated();
}

// =============================================================================
// CONFIGURACIÓN PRINCIPAL DE RUTAS
// =============================================================================

void setupRoutes() {
  // Configurar rutas de cada módulo
  setupAuthRoutes();
  setupHostRoutes();
  setupNetworkRoutes();
  setupSettingsRoutes();
  setupWebRoutes();
}