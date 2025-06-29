#ifndef HOST_ROUTES_H
#define HOST_ROUTES_H

void setupHostRoutes();

void handleHosts();
void handleHostsById();
void handleImportDatabase();

bool validateHostData(const JsonDocument &doc, String &name, String &mac, String &ip, bool &autoWake);
JsonObject createHostJson(JsonDocument &doc, int id, const Host &host);
bool isHostDuplicate(const Host &newHost);
void getHostList();
void getHost(int id);
void addHost();
void editHost(int id);
void deleteHost(int id);

#endif