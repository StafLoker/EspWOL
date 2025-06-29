#include "network_routes.h"
#include "routes.h"
#include "repository.h"
#include <WakeOnLan.h>
#include <ESP8266Ping.h>

extern WakeOnLan wol;

// =============================================================================
// CONFIGURACIÓN DE RUTAS DE RED
// =============================================================================

void setupNetworkRoutes() {
  server.on("/wake", HTTP_POST, handleWakeHost);
  server.on("/ping", HTTP_POST, handlePingHost);
  server.on("/hosts/status", HTTP_GET, handleHostsStatus);
}

// =============================================================================
// FUNCIONES AUXILIARES DE RED
// =============================================================================

void pingHost(const String &id) {
  extern std::map<int, Host> hosts;
  extern std::map<int, boolean> hostsStatus;
  
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    Host &host = hosts[index];
    IPAddress ip;
    ip.fromString(host.ip);
    bool pingResult = Ping.ping(ip, 3);
    hostsStatus[index] = pingResult;
    
    if (pingResult) {
      sendJsonResponse(200, "Host is online", true);
    } else {
      sendJsonResponse(200, "Host is offline", false);
    }
  } else {
    sendJsonResponse(400, "Host not found", false);
  }
}

// =============================================================================
// RUTAS DE RED (WOL Y PING)
// =============================================================================

void handleWakeHost() {
  if (isAuthenticated()) {
    if (server.hasArg("id")) {
      extern std::map<int, Host> hosts;
      int index = server.arg("id").toInt();
      if (index >= 0 && index < hosts.size()) {
        Host &host = hosts[index];
        if (wol.sendMagicPacket(host.mac.c_str())) {
          sendJsonResponse(200, "WOL packet sent", true);
        } else {
          sendJsonResponse(200, "Failed to send WOL packet", false);
        }
      } else {
        sendJsonResponse(400, "Host not found", false);
      }
    } else {
      sendJsonResponse(405, "HTTP Method Not Allowed", false);
    }
  }
}

void handlePingHost() {
  if (isAuthenticated()) {
    if (server.hasArg("id")) {
      int index = server.arg("id").toInt();
      pingHost(String(index));
    } else {
      sendJsonResponse(405, "HTTP Method Not Allowed", false);
    }
  }
}

void handleHostsStatus() {
  if (isAuthenticated()) {
    extern std::map<int, Host> hosts;
    extern std::map<int, boolean> hostsStatus;
    
    JsonDocument doc;
    JsonArray array = doc.to<JsonArray>();
    
    for (const auto &pair : hosts) {
      int index = pair.first;
      const Host &host = pair.second;
      
      JsonObject obj = array.createNestedObject();
      obj["id"] = index;
      obj["name"] = host.name;
      obj["ip"] = host.ip;
      obj["status"] = hostsStatus.count(index) ? hostsStatus[index] : false;
    }
    
    sendJsonResponse(200, doc);
  }
}