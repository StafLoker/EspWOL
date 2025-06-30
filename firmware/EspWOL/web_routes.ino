#include "web_routes.h"

// =============================================================================
// WEB ROUTE CONFIGURATION
// =============================================================================

void setupWebRoutes() {
  server.on(FPSTR(ROUTE_ROOT), HTTP_GET, handleRoot);
  server.onNotFound(handleNotFound);
}

// =============================================================================
// WEB ROUTES
// =============================================================================

void handleRoot() {
  if (isAuthenticated()) {
    server.send_P(200, CONTENT_TYPE_HTML, indexHtmlPage);
  }
}

void handleNotFound() {
  sendJsonResponse(404, false, FPSTR(MSG_NOT_FOUND));
}