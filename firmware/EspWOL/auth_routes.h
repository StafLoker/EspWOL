#ifndef AUTH_ROUTES_H
#define AUTH_ROUTES_H

#include <Arduino.h>
#include <map>

// Estructura para sesión
struct Session {
  unsigned long token;
  unsigned long createdAt;
  String username;
};

// Variables globales para autenticación
extern std::map<String, Session> activeSessions;
extern const unsigned long SESSION_TIMEOUT;

// Función para configurar rutas de autenticación
void setupAuthRoutes();

// Rutas de autenticación
void handleLogin();
void handleLogout();

// Funciones de autenticación
unsigned long generateToken();
String generateSessionId();
void cleanExpiredSessions();
bool validateCredentials(const String &username, const String &password);
bool isSessionValid(const String &sessionId);
String createSession(const String &username);
void destroySession(const String &sessionId);

#endif