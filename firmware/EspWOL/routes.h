#ifndef ROUTES_H
#define ROUTES_H

void setupRoutes();

void sendJsonResponse(int statusCode, bool success, const String &message);
void sendJsonResponse(int statusCode, bool success, const String &message, const JsonDocument &dataDoc);
bool isAuthenticated();

#endif