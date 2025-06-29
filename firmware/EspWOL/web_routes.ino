#include "web_routes.h"

// =============================================================================
// WEB ROUTE CONFIGURATION
// =============================================================================

void setupWebRoutes() {
  server.on("/", HTTP_GET, handleRoot);
  server.onNotFound(handleNotFound);
}

// =============================================================================
// WEB ROUTES
// =============================================================================

void handleRoot() {
  if (isAuthenticated()) {
    server.send_P(200, "text/html", indexHtmlPage);
  }
}

void handleNotFound() {
  sendJsonResponse(404, false, "Not found");
}