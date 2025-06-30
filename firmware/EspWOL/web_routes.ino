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
  server.send_P(200, CONTENT_TYPE_HTML, indexHtmlPage);
}

void handleNotFound() {
  server.send_P(404, CONTENT_TYPE_HTML, notFoundHtmlPage);
}