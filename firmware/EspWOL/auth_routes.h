#ifndef AUTH_ROUTES_H
#define AUTH_ROUTES_H

void setupAuthRoutes();

void handleLogin();
void handleLogout();

String generateSessionToken();
void cleanExpiredSessions();
bool validateCredentials(const String &username, const String &password);
bool isSessionValid(const String &sessionToken);
String createSession(const String &username);
void destroySession(const String &sessionToken);

#endif