#include "network_routes.h"

// =============================================================================
// NETWORK ROUTING CONFIGURATION
// =============================================================================

void setupNetworkRoutes() {
  server.on(FPSTR(ROUTE_WAKE), HTTP_POST, handleWakeHost);
  server.on(FPSTR(ROUTE_PING), HTTP_POST, handlePingHost);
}

// =============================================================================
// NETWORK AUXILIARY FUNCTIONS
// =============================================================================

void pingHost(int id) {
  if (id >= 0 && id < hosts.size()) {
    Host &host = hosts[id];
    IPAddress ip;
    ip.fromString(host.ip);
    bool pingResult = Ping.ping(ip, 3);
    hostsStatus[id] = pingResult;

    if (pingResult) {
      sendJsonResponse(200, true, "Host is online");
    } else {
      sendJsonResponse(200, false, "Host is offline");
    }
  } else {
    sendJsonResponse(400, false, FPSTR(MSG_HOST_NOT_FOUND));
  }
}

// =============================================================================
// NETWORK ROUTES
// =============================================================================

void handleWakeHost() {
  if (isAuthenticated()) {
    if (server.hasArg(FPSTR(ARG_ID))) {
      int id = server.arg(FPSTR(ARG_ID)).toInt();
      if (id >= 0 && id < hosts.size()) {
        Host &host = hosts[id];
        if (wol.sendMagicPacket(host.mac.c_str())) {
          sendJsonResponse(200, true, "WOL packet sent");
        } else {
          sendJsonResponse(200, false, "Failed to send WOL packet");
        }
      } else {
        sendJsonResponse(400, false, FPSTR(MSG_HOST_NOT_FOUND));
      }
    } else {
      sendJsonResponse(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}

void handlePingHost() {
  if (isAuthenticated()) {
    if (server.hasArg("id")) {
      pingHost(server.arg("id").toInt());
    } else {
      sendJsonResponse(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}