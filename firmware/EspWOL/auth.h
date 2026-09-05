#ifndef AUTH_H
#define AUTH_H

#define MAX_USERNAME_LENGTH 20
#define MAX_PASSWORD_LENGTH 32

struct User {
  String username;
  String password;
};

const char USER_FILE_PATH[] PROGMEM = "/user.json";

const char ROUTE_ACCOUNT[] PROGMEM = "/api/account";

const char AUTH_REALM[] PROGMEM = "EspWOL";
const char MSG_AUTH_REQUIRED[] PROGMEM = "Authentication required";


void auth_load_user();

// Persists the credentials and updates the global `user`.
void auth_save_user(User& new_user);

// Returns true when the request carries valid credentials. Otherwise sends the
// 401 challenge and returns false, so callers just `if (!auth_ok()) return;`.
bool auth_ok();

void auth_setup_routes();

#endif
