#include "validation.h"
#include <unordered_set>

const std::unordered_set<long> VALID_PING_VALUES = {
  0, 60, 300, 600, 900, 1800, 2700, 3600, 10800, 21600, 43200, 86400
};

bool isValidPeriodicPing(long value) {
  return VALID_PING_VALUES.find(value) != VALID_PING_VALUES.end();
}

bool isValidIPAddress(const String &ip) {
  int sections = 0;
  int length = ip.length();

  if (length < 7 || length > 15)
    return false;

  bool hasDigit = false;

  for (int i = 0; i < length; i++) {
    char c = ip[i];

    if (isdigit(c)) {
      hasDigit = true;
    } else if (c == '.') {
      if (!hasDigit)
        return false;
      sections++;
      hasDigit = false;
    } else {
      return false;
    }
  }

  return (sections == 3 && hasDigit);
}

bool isValidPassword(const String &password) {
  if (password.length() < 8)
    return false;
  bool hasUpper = false, hasLower = false, hasSpecial = false;
  for (char c : password) {
    if (isUpperCase(c))
      hasUpper = true;
    else if (isLowerCase(c))
      hasLower = true;
    else if (isPunct(c) || isGraph(c))
      hasSpecial = true;

    if (hasUpper && hasLower && hasSpecial)
      return true;
  }
  return false;
}

bool isValidMACAddress(const String &mac) {
  if (mac.length() != 17)
    return false;

  for (int i = 0; i < mac.length(); i++) {
    if (i % 3 == 2) {
      if (mac[i] != ':')
        return false;
    } else {
      if (!isHexadecimalDigit(mac[i]))
        return false;
    }
  }
  return true;
}

bool isHostDuplicate(const Host &newHost) {
  for (const auto &pair : hosts) {
    const Host &existingHost = pair.second;

    if (existingHost.mac == newHost.mac || existingHost.ip == newHost.ip) {
      return true;
    }
  }
  return false;
}
