#ifndef VALIDATION_H
#define VALIDATION_H

/**
 * @brief Checks if the given value is a valid periodic ping interval.
 * 
 * @param value The interval value in seconds.
 * @return true if the value is a valid interval, false otherwise.
 */
bool isValidPeriodicPing(long value);

/**
 * @brief Validates if the given string is a correctly formatted IPv4 address.
 * 
 * @param ip The IP address string to validate.
 * @return true if the IP format is valid, false otherwise.
 */
bool isValidIPAddress(const String &ip);

/**
 * @brief Validates if a given password meets security requirements.
 * 
 * Requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one special character
 * 
 * @param password The password string to validate.
 * @return true if the password meets all criteria, false otherwise.
 */
bool isValidPassword(const String &password);

/**
 * @brief Validates if the given string is a correctly formatted MAC address.
 * 
 * The MAC address must:
 * - Have exactly 6 pairs of hexadecimal characters (0-9, A-F)
 * - Be separated by either `:`
 * 
 * @param mac The MAC address string to validate.
 * @return true if the MAC address is correctly formatted, false otherwise.
 */
bool isValidMACAddress(const String &mac);

/**
 * @brief Checks if a new host is not duplicated (unique mac & ip)
 * 
 * @param value The string to check.
 * @return true if the value is `"true"` or `"false"`, false otherwise.
 */
bool isHostDuplicate(const Host &newHost);

#endif  // VALIDATION_H
