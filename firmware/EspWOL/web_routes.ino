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
  if (!isAuthenticated()) return;
  server.sendHeader(F("Content-Encoding"), F("gzip"));
  server.send_P(200, CONTENT_TYPE_HTML, (const char *)indexHtmlPage, indexHtmlPageLen);
}

void handleNotFound() {
  server.sendHeader(F("Content-Encoding"), F("gzip"));
  server.send_P(404, CONTENT_TYPE_HTML, (const char *)notFoundHtmlPage, notFoundHtmlPageLen);
}