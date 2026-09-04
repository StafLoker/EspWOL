#ifndef AUTH_H
#define AUTH_H

const char USER_FILE_PATH[] PROGMEM = "/user.json";

const char ROUTE_ACCOUNT[] PROGMEM = "/api/account";

const char INIT_USER_USERNAME[] PROGMEM = "glavniy";
const char INIT_USER_PASSWORD[] PROGMEM = "Lep#Chick43";

const char AUTH_REALM[] PROGMEM = "EspWOL";
const char MSG_AUTH_REQUIRED[] PROGMEM = "Authentication required";

struct User {
  String username;
  String password;
};

User auth_load_user();
void auth_save_user(User& user);

// Returns true when the request carries valid credentials. Otherwise sends the
// 401 challenge and returns false, so callers just `if (!auth_ok()) return;`.
bool auth_ok();

#endif
