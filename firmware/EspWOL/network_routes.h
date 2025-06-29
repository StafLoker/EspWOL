#ifndef NETWORK_ROUTES_H
#define NETWORK_ROUTES_H

#include <Arduino.h>

// Función para configurar rutas de red
void setupNetworkRoutes();

// Rutas de red (WOL y ping)
void handleWakeHost();
void handlePingHost();
void handleHostsStatus();

// Funciones auxiliares de red
void pingHost(const String &id);

#endif