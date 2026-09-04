#ifndef SERVER_H
#define SERVER_H

const char CONTENT_TYPE_JSON[] PROGMEM = "application/json";
const char CONTENT_TYPE_HTML[] PROGMEM = "text/html";

const char ROUTE_ROOT[] PROGMEM = "/";

// Server arguments
const char ARG_PLAIN[] PROGMEM = "plain";
const char ARG_ID[] PROGMEM = "id";

// Response messages
const char MSG_MISSING_BODY[] PROGMEM = "Missing body";
const char MSG_INVALID_JSON[] PROGMEM = "Invalid JSON";
const char MSG_MISSING_FIELDS[] PROGMEM = "Missing required fields";
const char MSG_INVALID_FORMAT[] PROGMEM = "Invalid data format";
const char MSG_METHOD_NOT_ALLOWED[] PROGMEM = "HTTP Method Not Allowed";

// Wires up every route and starts the HTTP server.
void server_setup();

void server_send_json(int status_code, bool success, const String &message, bool add_memory_meta = false);
void server_send_json(int status_code, bool success, const String &message, const JsonDocument &data_doc, bool add_memory_meta = false);

#endif
