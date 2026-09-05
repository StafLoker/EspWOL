#include "auth.h"

// =============================================================================
// INPUT VALIDATION
// =============================================================================

static bool is_valid_password(const String& password) {
  bool has_upper = false, has_lower = false, has_non_letter = false;
  char c;
  int i;

  if (password.length() < 8 || password.length() > MAX_PASSWORD_LENGTH) {
    return false;
  }

  for (i = 0; i < (int)password.length() && !(has_upper && has_lower && has_non_letter); i++) {
    c = password[i];

    if (isUpperCase(c))
      has_upper = true;
    else if (isLowerCase(c))
      has_lower = true;
    else if (isDigit(c) || isPunct(c))
      has_non_letter = true;
  }

  return has_upper && has_lower && has_non_letter;
}

void auth_load_user() {
  JsonDocument doc;

  if (LittleFS.exists(FPSTR(USER_FILE_PATH))) {
    File file = LittleFS.open(FPSTR(USER_FILE_PATH), "r");

    if (file) {
      DeserializationError error = deserializeJson(doc, file);

      if (!error) {
        user.username = doc[F("username")].as<String>();
        user.password = doc[F("password")].as<String>();
      }
      file.close();
    }
  }
}

void auth_save_user(User& new_user) {
  JsonDocument doc;
  File file = LittleFS.open(FPSTR(USER_FILE_PATH), "w");

  if (file) {
    doc[F("username")] = new_user.username;
    doc[F("password")] = new_user.password;
    serializeJson(doc, file);
    file.close();

    user = new_user;
  }
}

bool auth_ok() {
  if (server.authenticate(user.username.c_str(), user.password.c_str())) {
    return true;
  }

  server.requestAuthentication(BASIC_AUTH, String(FPSTR(AUTH_REALM)).c_str(), String(FPSTR(MSG_AUTH_REQUIRED)));
  return false;
}

// =============================================================================
// SERVICE
// =============================================================================

static void auth_get_user() {
  JsonDocument doc;

  doc[F("username")] = user.username;
  server_send_json(200, true, F("User"), doc);
}

static void auth_update_user() {
  JsonDocument doc, response_doc;
  String username, password;

  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    server_send_json(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    server_send_json(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (doc[F("username")].isNull() || doc[F("password")].isNull()) {
    server_send_json(400, false, FPSTR(MSG_MISSING_FIELDS));
    return;
  }

  username = doc[F("username")].as<String>();
  password = doc[F("password")].as<String>();

  if (username.length() < 3 || username.length() > MAX_USERNAME_LENGTH || !is_valid_password(password)) {
    server_send_json(400, false, FPSTR(MSG_INVALID_FORMAT));
    return;
  }

  User new_user = { username, password };
  auth_save_user(new_user);

  response_doc[F("username")] = username;
  server_send_json(200, true, F("User updated"), response_doc);
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

static void auth_handle_user() {
  if (auth_ok()) {
    if (server.method() == HTTP_GET) {
      auth_get_user();
    } else if (server.method() == HTTP_PUT) {
      auth_update_user();
    } else {
      server_send_json(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}

// =============================================================================
// ROUTE REGISTRATION
// =============================================================================

void auth_setup_routes() {
  server.on(FPSTR(ROUTE_ACCOUNT), HTTP_ANY, auth_handle_user);
}
