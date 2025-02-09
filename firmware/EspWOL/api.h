#ifndef API_H
#define API_H
void handleRoot();

void getHostList();
void getHost(const String& id);
void addHost();
void editHost(const String& id);
void deleteHost(const String& id);
void handleHosts();

void handleWakeHost();
void handlePingHost();

void updateNetworkSettings();
void getNetworkSettings();
void handleNetworkSettings();

void updateAuthenticationSettings();
void getAuthenticationSettings();
void handleAuthenticationSettings();

void handleGetAbout();

#endif