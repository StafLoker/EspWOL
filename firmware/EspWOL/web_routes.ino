#include "web_routes.h"
#include "routes.h"
#include "index.h"

// =============================================================================
// CONFIGURACIÓN DE RUTAS WEB
// =============================================================================

void setupWebRoutes() {
  server.on("/", HTTP_GET, handleRoot);
  server.onNotFound(handleNotFound);
}

// =============================================================================
// RUTAS WEB
// =============================================================================

void handleRoot() {
  if (isAuthenticated()) {
    server.send_P(200, "text/html", indexHtmlPage);
  }
}

void handleNotFound() {
  sendJsonResponse(404, "Not found", false);
}