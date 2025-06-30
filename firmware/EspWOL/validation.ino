#include "validation.h"

bool isValidPeriodicPing(unsigned long value) {
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
  if (password.length() < 8 || password.length() > MAX_PASSWORD_LENGTH) {
    return false;
  }

  bool hasUpper = false, hasLower = false, hasSpecial = false;
  for (char c : password) {
    if (isUpperCase(c))
      hasUpper = true;
    else if (isLowerCase(c))
      hasLower = true;
    else if (isPunct(c))
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
