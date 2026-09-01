#include "wifi_portal.h"

// =============================================================================
// WIFI PORTAL THEME
//
// WiFiManager renders its own pages; setCustomHeadElement() appends a <style>
// after the library's own, so these rules win on equal specificity.
// Only the pages PORTAL_MENU exposes are themed: the menu, /wifi, /info, and the
// save/erase results. Selectors come from wm_strings_en.h:
//   body.invert > .wrap        page container
//   .msg .msg.P/.D/.S          status callouts (info / danger / success)
//   .q, .q[role=img], .h       scan rows: signal percentage, icon sprite, hidden
//   dt/dd/progress             /info definition list and memory meters
// Keep the palette in sync with web/src/style.css.
//
// setCustomHeadElement() stores the bare pointer and later does `page += ptr`,
// which reads it as RAM. A PROGMEM pointer would render as garbage, so the CSS
// is copied into RAM - but only from the AP callback, i.e. only when the portal
// actually opens. A device that connects normally never pays those ~3 KB.
// =============================================================================

static const char PORTAL_STYLE[] PROGMEM =
  "<meta name='viewport' content='width=device-width,initial-scale=1'>"
  "<meta name='theme-color' content='#18181b'>"
  "<style>"
  ":root{color-scheme:dark}"

  "body,body.invert{background:#18181b;color:#e4e4e7;"
  "font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;"
  "-webkit-font-smoothing:antialiased;padding:1.5rem 1rem}"

  ".wrap{max-width:24rem;margin:0 auto;text-align:left}"

  "h1,h3,body.invert h1{text-align:left;font-weight:500;letter-spacing:-.01em;color:#e4e4e7}"
  "h1,body.invert h1{font-size:1.125rem;margin:0 0 .25rem}"
  "h3{font-size:.8125rem;color:#8b8b93;margin:0 0 1.5rem;font-weight:400}"

  /* Controls */
  "input{background:#18181b;color:#e4e4e7;border:1px solid #3f3f46;"
  "border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;margin:.25rem 0 .75rem}"
  "input::placeholder{color:#8b8b93}"
  "input:focus,button:focus-visible,a:focus-visible{outline:2px solid #e4e4e7;"
  "outline-offset:2px;border-color:#a1a1aa}"
  "input[type=checkbox]{width:auto;accent-color:#e4e4e7;margin-right:.35rem}"

  /* Secondary by default; the first menu entry and submits are the primary action */
  "button,input[type=submit]{background:transparent;color:#e4e4e7;"
  "border:1px solid #3f3f46;border-radius:.5rem;padding:.55rem 1rem;font-size:.875rem;"
  "font-weight:500;line-height:1.5;cursor:pointer}"
  "button:hover,input[type=submit]:hover{background:#26262a;border-color:#52525b}"
  ".wrap>form:first-of-type button,button[type=submit],input[type=submit]{"
  "background:#e4e4e7;color:#18181b;border-color:#e4e4e7}"
  ".wrap>form:first-of-type button:hover,button[type=submit]:hover,input[type=submit]:hover{"
  "background:#fff;border-color:#fff}"
  /* Destructive wins wherever it sits, including as a form's first button */
  "button.D,.wrap>form:first-of-type button.D{background:transparent;color:#f87171;"
  "border-color:#7f1d1d}"
  "button.D:hover,.wrap>form:first-of-type button.D:hover{background:#450a0a;"
  "border-color:#991b1b;color:#fca5a5}"

  "label{font-size:.8125rem;font-weight:500;color:#a1a1aa}"
  "form{margin:0 0 .5rem}"
  "br{line-height:0}"

  /* Scanned networks: SSID left, signal right, on one row */
  ".wrap>div{display:flex;align-items:center;gap:.5rem;padding:0;margin:0 0 .375rem;"
  "border:1px solid #2e2e32;border-radius:.5rem;background:#212124}"
  ".wrap>div:hover{background:#26262a;border-color:#3f3f46}"
  ".wrap>div>a,body.invert .wrap>div>a{flex:1;min-width:0;overflow:hidden;"
  "text-overflow:ellipsis;white-space:nowrap;color:#e4e4e7;font-weight:400;"
  "text-decoration:none;padding:.6rem .75rem}"
  ".wrap>div>a:hover{color:#fff;text-decoration:none}"
  "a,body.invert a{color:#e4e4e7}"

  /* RSSI: the sprite is dark artwork, so invert it for a dark surface */
  ".q{float:none;height:auto;min-width:0;padding:0 .75rem 0 0;color:#8b8b93;"
  "font-size:.75rem;font-variant-numeric:tabular-nums;margin:0}"
  /* body.invert already inverts the sprite; match that selector so this does not
     stack a second inversion on top of it. */
  "body.invert .q[role=img]{-webkit-filter:invert(1);filter:invert(1);opacity:.6}"

  /* Status callouts */
  ".msg,body.invert .msg{display:block;background:#212124;color:#e4e4e7;"
  "border:1px solid #2e2e32;border-left-width:3px;border-radius:.5rem;"
  "padding:.875rem;margin:1rem 0;font-size:.875rem;line-height:1.5}"
  ".msg h4{display:block;margin:0 0 .375rem;font-size:.875rem;font-weight:500}"
  ".msg.P{border-left-color:#a1a1aa}.msg.P h4{color:#e4e4e7}"
  ".msg.D{border-left-color:#f87171}.msg.D h4{color:#f87171}"
  ".msg.S{border-left-color:#4ade80}.msg.S h4{color:#4ade80}"

  /* /info definition lists and its memory meters */
  "dt{font-weight:500;color:#e4e4e7;font-size:.8125rem}"
  "dd{color:#a1a1aa;font-size:.8125rem;margin:0 0 .5rem}"
  /* accent-color is ignored for <progress> in Chromium, so style the parts too */
  "progress{width:100%;height:.25rem;border:0;margin-top:.25rem;background:#2e2e32;"
  "-webkit-appearance:none;appearance:none;border-radius:2px;overflow:hidden}"
  "progress::-webkit-progress-bar{background:#2e2e32}"
  "progress::-webkit-progress-value{background:#a1a1aa}"
  "progress::-moz-progress-bar{background:#a1a1aa}"

  "hr{border:0;border-top:1px solid #2e2e32;margin:1.25rem 0}"
  "</style>";

// The portal always registers its own /update route, but the device is only in
// portal mode before it has WiFi. Firmware updates go through ota_routes on the
// main server instead, so that entry stays out of the menu.
static const char* PORTAL_MENU[] = { "wifi", "info", "sep", "restart", "erase" };

// Held for as long as the portal runs; WiFiManager keeps a pointer into it.
static String portalStyle;

void setupWifiPortal() {
  wifiManager.setTitle(F("EspWOL"));
  wifiManager.setDarkMode(true);
  wifiManager.setScanDispPerc(true);  // percentages read better than the icon sprite
  wifiManager.setMenu(PORTAL_MENU, sizeof(PORTAL_MENU) / sizeof(PORTAL_MENU[0]));

  wifiManager.setAPCallback([](WiFiManager* wm) {
    portalStyle = FPSTR(PORTAL_STYLE);  // flash -> RAM, once, only in portal mode
    wm->setCustomHeadElement(portalStyle.c_str());
  });
}
