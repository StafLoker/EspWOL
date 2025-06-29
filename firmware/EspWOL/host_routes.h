#ifndef HOST_ROUTES_H
#define HOST_ROUTES_H

#include <Arduino.h>
#include <ArduinoJson.h>

// Función para configurar rutas de hosts
void setupHostRoutes();

// Rutas de hosts
void handleHosts();
void handleHostsById();
void handleImportDatabase();

// Funciones auxiliares para hosts
bool validateHostData(const JsonDocument &doc, String &name, String &mac, String &ip, bool &autoWake);
void getHostList();
void getHost(const String &id);
void addHost();
void editHost(const String &id);
void deleteHost(const String &id);

#endif