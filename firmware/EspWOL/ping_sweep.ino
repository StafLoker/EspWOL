#include "ping_sweep.h"

static GTimer<millis> ping_timer;

// Pings one host, updating its status and waking it when it is due.
static void ping_one(Host &host) {
  IPAddress ip;

  ip.fromString(host.ip);
  host.up = Ping.ping(ip, PING_COUNT_QUICK);

  // If host is offline and auto_wake is enabled, send WOL packet
  if (!host.up && host.auto_wake) {
    wol.sendMagicPacket(host.mac.c_str());
  }
}

struct PingSweep {
  int next_id = INACTIVE_SWEEP;

  bool active() {
    return next_id != INACTIVE_SWEEP;
  }

  void start() {
    next_id = 0;
  }

  void stop() {
    next_id = INACTIVE_SWEEP;
  }

  void step() {
    if (active()) {
      auto it = hosts.upper_bound(next_id);

      if (it == hosts.end()) {
        next_id = INACTIVE_SWEEP;
      } else {
        next_id = it->first;
        ping_one(it->second);
      }
    }
  }
};

static struct PingSweep ping_sweep;

// A period of 0 means "disabled". GTimer fires on every tick() when its period
// is 0, so the timer has to be stopped rather than just given a 0 period.
void ping_apply_period_config() {
  if (settings.ping_period_ms == 0) {
    ping_timer.stop();
    ping_sweep.stop();
  } else {
    ping_timer.setTime(settings.ping_period_ms);
    ping_timer.start();
  }
}

void ping_start_sweep() {
  ping_sweep.start();
}

void ping_service_tick() {
  if (ping_timer) {
    ping_sweep.start();
  }
  ping_sweep.step();
}
