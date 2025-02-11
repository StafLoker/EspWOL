#ifndef API_H
#define API_H
/**
 * @brief Checks if the user is authenticated.
 * 
 * If authentication is enabled, this function verifies the provided credentials.
 * If authentication fails, it requests authentication from the client.
 * 
 * @return true if authenticated, false otherwise.
 */
static bool isAuthenticated();

/**
 * @brief Checks if value of periodic ping is valid
 * 
 * @return true if valid, false otherwise.
 */
static bool isValidPeriodicPing(long value);

/**
 * @brief Handles the root API request ('/').
 * 
 * Sends an HTML page to the client if the user is authenticated.
 */
void handleRoot();

/**
 * @brief Retrieves a list of all registered hosts.
 * 
 * API Endpoint: GET '/hosts'
 * 
 * Generates a JSON response containing all registered hosts, including their names, MAC addresses, and IP addresses.
 */
static void getHostList();

/**
 * @brief Retrieves a specific host by its index.
 * 
 * API Endpoint: GET '/hosts?id={index}'
 * 
 * If the index is valid, returns the host's details in JSON format.
 * If the host is not found, returns an error message.
 * 
 * @param id The index of the host to retrieve.
 */
static void getHost(const String &id);

/**
 * @brief Adds a new host to the list.
 * 
 * API Endpoint: POST '/hosts'
 * 
 * Parses a JSON request body containing the host's name, MAC address, and IP address.
 * Saves the new host to the list and updates storage.
 */
static void addHost();

/**
 * @brief Edits an existing host's information.
 * 
 * API Endpoint: PUT '/hosts?id={index}'
 * 
 * Updates the name, MAC address, and IP address of the host specified by the index.
 * Returns a success message if updated successfully, or an error if the index is invalid.
 * 
 * @param id The index of the host to update.
 */
static void editHost(const String &id);

/**
 * @brief Deletes a host from the list.
 * 
 * API Endpoint: DELETE '/hosts?id={index}'
 * 
 * Removes the host at the specified index and updates storage.
 * Returns a success message if deleted, or an error if the index is invalid.
 * 
 * @param id The index of the host to delete.
 */
static void deleteHost(const String &id);

/**
 * @brief Handles API requests related to hosts.
 * 
 * Determines the HTTP method and processes the request accordingly:
 * - GET: Retrieves host information.
 * - POST: Adds a new host.
 * - PUT: Edits an existing host.
 * - DELETE: Removes a host.
 */
void handleHosts();

/**
 * @brief Sends a Wake-on-LAN (WOL) packet to a specified host.
 * 
 * API Endpoint: POST '/wake?id={index}'
 * 
 * If the host index is valid, attempts to send a WOL magic packet.
 * Returns a success or failure message.
 */
void handleWakeHost();

/**
 * @brief Pings a specific host to check its availability.
 * 
 * API Endpoint: POST '/ping?id={index}'
 * 
 * Attempts to ping the host at the specified index.
 * Returns a success message if the host responds, or a failure message if it does not.
 */
void handlePingHost();

/**
 * @brief Updates network configuration settings.
 * 
 * API Endpoint: PUT '/networkSettings'
 * 
 * Parses a JSON request body containing new network settings.
 * Saves the configuration and restarts the ESP device to apply changes.
 */
static void updateNetworkSettings();

/**
 * @brief Updates authentication settings.
 * 
 * API Endpoint: PUT '/authenticationSettings'
 * 
 * Parses a JSON request body containing authentication parameters.
 * Saves the updated authentication settings.
 */
static void updateAuthenticationSettings();

/**
 * @brief Retrieves the current network settings.
 * 
 * API Endpoint: GET '/networkSettings'
 * 
 * Returns the current IP address, subnet mask, and gateway in JSON format.
 */
static void getNetworkSettings();

/**
 * @brief Retrieves authentication settings.
 * 
 * API Endpoint: GET '/authenticationSettings'
 * 
 * Returns authentication status and username.
 * The password is not exposed for security reasons.
 */
static void getAuthenticationSettings();

/**
 * @brief Handles API requests related to network settings.
 * 
 * Determines the HTTP method and processes the request:
 * - GET: Retrieves network settings.
 * - PUT: Updates network settings.
 */
void handleNetworkSettings();

/**
 * @brief Handles API requests related to authentication settings.
 * 
 * Determines the HTTP method and processes the request:
 * - GET: Retrieves authentication settings.
 * - PUT: Updates authentication settings.
 */
void handleAuthenticationSettings();

/**
 * @brief Retrieves system information.
 * 
 * API Endpoint: GET '/about'
 * 
 * Returns device version and hostname in JSON format.
 */
void handleGetAbout();

/**
 * @brief Retrieves information about the current and latest available firmware versions.
 * 
 * API Endpoint: GET '/updateVersion'
 * 
 * Checks for available updates and retrieves version information.
 * Returns a JSON response containing:
 * - The currently installed firmware version.
 * - The latest available firmware version.
 */
static void getInformationToUpdate();

/**
 * @brief Initiates an update to the latest firmware version.
 * 
 * API Endpoint: POST '/updateVersion'
 * 
 * If an update is available, this function sends a success response, waits briefly, 
 * and then starts the update process.
 */
static void updateToLastVersion();

/**
 * @brief Handles API requests related to firmware updates.
 * 
 * Determines the HTTP method and processes the request:
 * - GET: Retrieves update information.
 * - POST: Initiates an update to the latest version.
 */
void handleUpdateVersion();

#endif
