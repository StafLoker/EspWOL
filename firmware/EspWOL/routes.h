#ifndef ROUTES_H
#define ROUTES_H

#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

extern ESP8266WebServer server;

// Función principal para configurar todas las rutas
void setupRoutes();

// Funciones utilitarias compartidas
void sendJsonResponse(int statusCode, const String &message, bool success);
void sendJsonResponse(int statusCode, const JsonDocument &doc);
bool isAuthenticated();
bool isSessionAuthenticated();

#endif