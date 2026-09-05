#ifndef PING_H
#define PING_H

#define INACTIVE_SWEEP -1

#define PING_COUNT_QUICK 2  // status probe on add/edit and the periodic sweep=

// Applies settings.ping_period_ms to the sweep timer. A period of 0 means
// "disabled". Call at startup and whenever the ping period setting changes.
void ping_apply_period_config();

// Starts a fresh sweep from the first host. Call once at startup.
void ping_start_sweep();

// Advances the periodic ping sweep by one step, starting a new sweep when the
// period timer fires. Call once per loop() iteration.
void ping_service_tick();

#endif
