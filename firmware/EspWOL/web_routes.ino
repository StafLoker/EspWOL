#include "web_routes.h"
#include "routes.h"
#include "index.h"

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
  sendJsonResponse(404, "Not found", false);
}