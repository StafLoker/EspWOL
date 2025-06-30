#ifndef ROUTES_H
#define ROUTES_H

void setupHeaders();
void setupRoutes();

void sendJsonResponse(int statusCode, bool success, const String &message, bool addMemoryMeta = false);
void sendJsonResponse(int statusCode, bool success, const String &message, const JsonDocument &dataDoc, bool addMemoryMeta = false);
bool isAuthenticated();

#endif