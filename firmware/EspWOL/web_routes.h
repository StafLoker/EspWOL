#ifndef WEB_ROUTES_H
#define WEB_ROUTES_H

#include <Arduino.h>

// Función para configurar rutas web
void setupWebRoutes();

// Rutas web
void handleRoot();
void handleNotFound();

#endif