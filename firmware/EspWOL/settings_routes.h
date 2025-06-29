#ifndef SETTINGS_ROUTES_H
#define SETTINGS_ROUTES_H

#include <Arduino.h>

// Función para configurar rutas de configuración
void setupSettingsRoutes();

// Rutas de configuración
void handleNetworkSettings();
void handleAuthenticationSettings();
void handleGetAbout();
void handleResetWiFiSettings();

// Funciones auxiliares de configuración
void updateNetworkSettings();
void getNetworkSettings();
void updateAuthenticationSettings();
void getAuthenticationSettings();

#endif