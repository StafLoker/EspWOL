#ifndef SETTINGS_ROUTES_H
#define SETTINGS_ROUTES_H

void setupSettingsRoutes();

void handleGetSettings();
void handleNetworkSettings();
void handleUser();
void handleGetAbout();
void handlePingPeriod();
void handleResetWiFiSettings();

void getSettings();
void getPingPeriod();
void updateNetworkSettings();
void getNetworkSettings();
void updateUser();
void getUser();
void updatePingPeriod();

#endif