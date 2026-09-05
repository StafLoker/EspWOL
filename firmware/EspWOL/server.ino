#include "server.h"
#include "index_page.h"
#include "not_found_page.h"

void server_send_json(int status_code, bool success, const String &message, bool add_memory_meta) {
  JsonDocument doc;
  String response;

  doc[F("success")] = success;
  doc[F("message")] = message;

  if (add_memory_meta) {
    memory_add_metadata(doc);
  }

  serializeJson(doc, response);
  server.send(status_code, FPSTR(CONTENT_TYPE_JSON), response);
}

void server_send_json(int status_code, bool success, const String &message, const JsonDocument &data_doc, bool add_memory_meta) {
  JsonDocument doc;
  String response;

  doc[F("success")] = success;
  doc[F("message")] = message;
  doc[F("data")] = data_doc;

  if (add_memory_meta) {
    memory_add_metadata(doc);
  }

  serializeJson(doc, response);
  server.send(status_code, FPSTR(CONTENT_TYPE_JSON), response);
}

static void server_handle_root() {
  if (auth_ok()) {
    server.sendHeader(F("Content-Encoding"), F("gzip"));
    server.send_P(200, CONTENT_TYPE_HTML, (const char *)INDEX_PAGE_HTML, INDEX_PAGE_HTML_LEN);
  }
}

static void server_handle_not_found() {
  if (!auth_ok()) return;

  server.sendHeader(F("Content-Encoding"), F("gzip"));
  server.send_P(404, CONTENT_TYPE_HTML, (const char *)NOT_FOUND_PAGE_HTML, NOT_FOUND_PAGE_HTML_LEN);
}

void server_setup() {
  hosts_setup_routes();
  settings_setup_routes();
  auth_setup_routes();
  ota_setup_routes();

  server.on(FPSTR(ROUTE_ROOT), HTTP_GET, server_handle_root);
  server.onNotFound(server_handle_not_found);
}
