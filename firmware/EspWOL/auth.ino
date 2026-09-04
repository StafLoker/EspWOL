#include "auth.h"

User auth_load_user() {
  User user = { FPSTR(INIT_USER_USERNAME), FPSTR(INIT_USER_PASSWORD) };
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
  return user;
}

void auth_save_user(User& user) {
  File file = LittleFS.open(FPSTR(USER_FILE_PATH), "w");
  JsonDocument doc;

  if (file) {
    doc[F("username")] = user.username;
    doc[F("password")] = user.password;
    serializeJson(doc, file);
    file.close();
  }
}

bool auth_ok() {
  User user = auth_load_user();

  if (server.authenticate(user.username.c_str(), user.password.c_str())) {
    return true;
  }

  server.requestAuthentication(BASIC_AUTH, String(FPSTR(AUTH_REALM)).c_str(), String(FPSTR(MSG_AUTH_REQUIRED)));
  return false;
}
