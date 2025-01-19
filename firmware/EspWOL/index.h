// HTML content
const char htmlPage[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wake on LAN</title>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
    />
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
      crossorigin="anonymous"
    />
    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
      crossorigin="anonymous"
    ></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        getAllHost();

        (() => {
          'use strict';

          // Fetch all the forms we want to apply custom Bootstrap validation styles to
          const forms = document.querySelectorAll('.needs-validation');

          // Loop over them and prevent submission
          Array.from(forms).forEach((form) => {
            form.addEventListener(
              'submit',
              async (event) => {
                event.preventDefault();
                event.stopPropagation();

                if (form.checkValidity()) {
                  const formId = form.id;
                  switch (formId) {
                    case 'addHostForm':
                      await addHost();
                      break;
                    case 'editHostForm':
                      await saveEditHost();
                      break;
                    case 'editNetworkSettingsForm':
                      await updateNetworkSettings();
                      break;
                    case 'editAuthenticationSettingsForm':
                      await updateAuthentication();
                  }
                }

                form.classList.add('was-validated');
              },
              false
            );
          });
        })();
      });

      async function getAllHost() {
        try {
          const response = await fetch('/hosts', { method: 'GET' });
          if (!response.ok) throw new Error('Network response was not ok');

          const data = await response.json();
          if (!Array.isArray(data)) throw new Error('Expected an array');

          const hosts = document.getElementById('host-list');
          hosts.innerHTML = '';
          data.forEach((host, index) => {
            const listItem = document.createElement('li');
            listItem.className =
              'list-group-item d-flex justify-content-between align-items-center';
            listItem.id = `host-item-${index}`;
            listItem.innerHTML = `
                        <div class="d-flex align-items-center">
                            <div class="status-circle" id="status-${index}"></div>
                            ${host.name} - ${host.ip}
                        </div>
                        <div>
                            <button id="ping-button-${index}" class="btn btn-info btn-sm me-2" onclick="pingHost(${index})">
                                <i class="fas fa-table-tennis"></i>
                            </button>
                            <button class="btn btn-warning btn-sm me-2" onclick="editHost()" data-index="${index}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="wakeHost(${index})">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>`;
            hosts.appendChild(listItem);
          });
        } catch (error) {
          console.error('Error fetching host list:', error);
        }
      }

      async function addHost() {
        const name = document.getElementById('host-name').value;
        const mac = document.getElementById('host-mac').value;
        const ip = document.getElementById('host-ip').value;

        const modal = new bootstrap.Modal(
          document.getElementById('add-host-modal')
        );

        try {
          const response = await fetch('/hosts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mac, ip })
          });

          const data = await response.json();
          if (data.success) {
            getAllHost();
            modal.hide();
            document.getElementById('host-name').value = '';
            document.getElementById('host-mac').value = '';
            document.getElementById('host-ip').value = '';
          }
          showNotification(data.message, data.success ? 'success' : 'danger');
        } catch (error) {
          showNotification('Error adding HOST', 'danger');
          console.error('Error adding HOST:', error);
        }
      }

      async function editHost(index) {
        const host = document.getElementById(`host-item-${index}`);
        document
          .getElementById('edit-host-modal')
          .setAttribute('data-index', index);
        const modal = new bootstrap.Modal(
          document.getElementById('edit-host-modal')
        );
        try {
          const response = await fetch('/hosts?id=' + index, { method: 'GET' });
          const data = await response.json();
          document.getElementById('edit-host-name').value = data.name;
          document.getElementById('edit-host-mac').value = data.mac;
          document.getElementById('edit-host-ip').value = data.ip;
          modal.show();
        } catch (error) {
          showNotification('Error edit HOST', 'danger');
          console.error('Error edit HOST:', error);
        }
      }

      async function saveEditHost() {
        const index = document
          .getElementById('edit-host-modal')
          .modal.getAttribute('data-index');
        const name = document.getElementById('edit-host-name').value;
        const mac = document.getElementById('edit-host-mac').value;
        const ip = document.getElementById('edit-host-ip').value;

        const modal = new bootstrap.Modal(
          document.getElementById('edit-host-modal')
        );

        try {
          const response = await fetch('/hosts?id=' + index, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mac, ip })
          });
          const data = await response.json();
          if (data.success) {
            getAllHost();
          }

          modal.hide();

          showNotification(data.message, data.success ? 'success' : 'danger');
        } catch (error) {
          modal.hide();

          showNotification('Error edit HOST', 'danger');
          console.error('Error edit HOST:', error);
        }
      }

      async function confirmDelete() {
        const index = document
          .getElementById('edit-host-modal')
          .modal.getAttribute('data-index');
        const modal = new bootstrap.Modal(
          document.getElementById('edit-host-modal')
        );

        try {
          const response = await fetch('/hosts?id=' + index, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (data.success) {
            getAllHost();
          }

          modal.hide();

          showNotification(data.message, data.success ? 'success' : 'danger');
        } catch (error) {
          modal.hide();
          showNotification('Error delete HOST', 'danger');
          console.error('Error delete HOST:', error);
        }
      }

      async function pingHost(index) {
        const button = document.getElementById(`ping-button-${index}`);
        button.setAttribute('disabled', '');
        button.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status"></span>';

        try {
          const response = await fetch('/ping?id=' + index, {
            method: 'POST'
          });

          const data = await response.json();
          const statusCircle = document.getElementById(`status-${index}`);
          ipField.removeAttribute('disabled');
          button.innerHTML = '<i class="fas fa-table-tennis"></i>';

          if (data.success) {
            statusCircle.classList.remove('red');
            statusCircle.classList.add('green');
            statusCircle.classList.add('blinking');

            showNotification(data.message, 'success');
            setTimeout(() => {
              statusCircle.classList.remove('blinking');
              statusCircle.classList.remove('green');
            }, 10000);
          } else {
            statusCircle.classList.remove('green', 'blinking');
            statusCircle.classList.add('red');
            showNotification(data.message, 'danger');

            setTimeout(() => {
              statusCircle.classList.remove('red');
            }, 10000);
          }
        } catch (error) {
          showNotification('Ping failed', 'danger');
          console.error('Ping failed:', error);
        }
      }

      async function wakeHost(index) {
        try {
          const response = await fetch('/wake?id=' + index, {
            method: 'POST'
          });
          const data = await response.json();
          showNotification(data.message, data.success ? 'info' : 'danger');
        } catch (error) {
          showNotification("WOL packet don't sent", 'danger');
          console.error('Ping failed:', error);
        }
      }

      async function getAbout() {
        try {
          const response = await fetch('/about', { method: 'GET' });
          const data = await response.json();

          document.getElementById('version').innerText = data.version;
          document.getElementById('hostname').innerText = data.hostname;
        } catch (error) {
          showNotification('Error to get about information', 'danger');
          console.error('Fetch error (About):', error);
        }
      }

      async function getNetworkSettings() {
        try {
          const response = await fetch('/networkSettings', { method: 'GET' });
          const data = await response.json();

          document.getElementById('inlineRadioStaticIP').checked = data.enable;
          document.getElementById('inlineRadioDHCP').checked = !data.enable;
          document.getElementById('fieldIP').value = data.ip;
          document.getElementById('fieldNetworkMask').value = data.networkMask;
          document.getElementById('fieldGateway').value = data.gateway;

          toggleNetworkFields();
        } catch (error) {
          showNotification('Error to get network settings', 'danger');
          console.error('Fetch error (Network Settings):', error);
        }
      }

      async function getAuthentication() {
        try {
          const response = await fetch('/authenticationSettings', {
            method: 'GET'
          });
          const data = await response.json();

          document.getElementById('switchEnableAuthentication').checked =
            data.enable;
          document.getElementById('fieldUsername').value = data.username;
          document.getElementById('fieldPassword').value = data.password;

          const form = document.getElementById(
            'editAuthenticationSettingsForm'
          );
          if (data.enable) {
            form.classList.add('needs-validation');
            form.classList.add('novalidate');
          }

          toggleAuthenticationFields();
        } catch (error) {
          showNotification('Error to get authentication settings', 'danger');
          console.error('Fetch error (Authentication):', error);
        }
      }

      async function getSettings() {
        await getAbout();
        await getNetworkSettings();
        await getAuthentication();

        const modal = new bootstrap.Modal(
          document.getElementById('settings-modal')
        );
        modal.show();
      }

      async function updateNetworkSettings() {
        const enable = document.getElementById('inlineRadioStaticIP').checked;
        const ip = document.getElementById('fieldIP').value;
        const networkMask = document.getElementById('fieldNetworkMask').value;
        const gateway = document.getElementById('fieldGateway').value;

        const modal = new bootstrap.Modal(
          document.getElementById('settings-modal')
        );

        try {
          const response = await fetch('/networkSettings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enable, ip, networkMask, gateway })
          });
          const data = await response.json();

          modal.hide();

          showNotification(data.message, data.success ? 'success' : 'danger');
          if (data.success) {
            location.replace(`http://${ip}`);
          }
        } catch {
          modal.hide();

          showNotification('Error to update network settings', 'danger');
          console.error('Fetch error:', error);
        }
      }

      async function updateAuthentication() {
        const enable = document.getElementById(
          'switchEnableAuthentication'
        ).checked;
        const username = document.getElementById('fieldUsername').value;
        const password = document.getElementById('fieldPassword').value;

        const modal = new bootstrap.Modal(
          document.getElementById('settings-modal')
        );

        try {
          const response = await fetch('/authenticationSettings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enable, username, password })
          });
          const data = await response.json();

          modal.hide();

          showNotification(data.message, data.success ? 'success' : 'danger');
          if (data.success) {
            location.reload();
          }
        } catch {
          modal.hide();

          showNotification('Error to update authentication settings', 'danger');
          console.error('Fetch error:', error);
        }
      }

      async function resetWiFiSettings() {
        try {
          const response = await fetch('/resetWifi', { method: 'POST' });
          const data = await response.json();
          showNotification(data.message, data.success ? 'success' : 'danger');
          if (data.success) {
            location.reload();
          }
        } catch (error) {
          console.error('Fetch reset WIFI settings error:', error);
        }
      }

      function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.role = 'alert';
        notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

        const notificationArea = document.getElementById('notification-area');
        notificationArea.appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 3000);
      }

      function toggleNetworkFields() {
        const isStaticIP = document.getElementById(
          'inlineRadioStaticIP'
        ).checked;
        const form = document.getElementById('editNetworkSettingsForm');
        const ipField = document.getElementById('fieldIP');
        const networkMaskField = document.getElementById('fieldNetworkMask');
        const gatewayField = document.getElementById('fieldGateway');
        const updateButton = document.getElementById(
          'updateNetworkSettingsButton'
        );

        if (isStaticIP) {
          ipField.removeAttribute('disabled');
          networkMaskField.removeAttribute('disabled');
          gatewayField.removeAttribute('disabled');

          form.classList.add('needs-validation');
          form.classList.add('novalidate');
          ipField.setAttribute('required', '');
          networkMaskField.setAttribute('required', '');
          gatewayField.setAttribute('required', '');

          updateButton.setAttribute('form', 'editNetworkSettingsForm');
          updateButton.setAttribute('type', 'submit');
          updateButton.removeAttribute('onclick');
        } else {
          ipField.setAttribute('disabled', '');
          networkMaskField.setAttribute('disabled', '');
          gatewayField.setAttribute('disabled', '');

          form.classList.remove('needs-validation');
          form.classList.remove('novalidate');
          ipField.removeAttribute('required');
          networkMaskField.removeAttribute('required');
          gatewayField.removeAttribute('required');

          updateButton.removeAttribute('form');
          updateButton.setAttribute('type', 'button');
          updateButton.setAttribute('onclick', 'updateNetworkSettings()');
        }
      }

      function toggleAuthenticationFields() {
        const form = document.getElementById('editAuthenticationSettingsForm');
        const switchElement = document.getElementById(
          'switchEnableAuthentication'
        );
        const usernameField = document.getElementById('fieldUsername');
        const passwordField = document.getElementById('fieldPassword');
        const updateButton = document.getElementById(
          'updateAuthenticationButton'
        );

        if (switchElement.checked) {
          usernameField.removeAttribute('disabled');
          passwordField.removeAttribute('disabled');

          form.classList.add('needs-validation');
          form.classList.add('novalidate');
          usernameField.setAttribute('required', '');
          passwordField.setAttribute('required', '');

          updateButton.setAttribute('form', 'editAuthenticationSettingsForm');
          updateButton.setAttribute('type', 'submit');
          updateButton.removeAttribute('onclick');
        } else {
          usernameField.setAttribute('disabled', '');
          passwordField.setAttribute('disabled', '');

          form.classList.remove('needs-validation');
          form.classList.remove('novalidate');
          usernameField.removeAttribute('required');
          passwordField.removeAttribute('required');

          updateButton.removeAttribute('form');
          updateButton.setAttribute('type', 'button');
          updateButton.setAttribute('onclick', 'updateAuthentication()');
        }
      }
    </script>
    <style>
      .status-circle {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background-color: gray;
        margin-right: 10px;
        transition: background-color 0.3s ease;
      }

      .blinking {
        animation: blink-animation 1s infinite;
      }

      @keyframes blink-animation {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }

      .status-circle.green {
        background-color: green;
      }

      .status-circle.red {
        background-color: red;
      }
    </style>
    <body class="bg-light text-dark">
      <!-- Main -->
      <div class="container mt-5">
        <h1 class="text-center">Wake on LAN</h1>
        <!-- Notification Area -->
        <div id="notification-area"></div>
        <!-- Control -->
        <h2 class="mt-4 d-flex justify-content-between align-items-center">
          <span>Hosts</span>
          <div class="ml-auto">
            <button
              class="btn btn-success"
              data-bs-toggle="modal"
              data-bs-target="#add-host-modal"
            >
              <i class="fas fa-plus"></i>
            </button>
            <button
              class="btn btn-secondary btn-md"
              title="Settings"
              onclick="getSettings()"
            >
              <i class="fas fa-cog"></i>
            </button>
          </div>
        </h2>
        <!-- HOST List -->
        <ul id="host-list" class="list-group mt-3"></ul>
      </div>

      <!-- Add host modal -->
      <div
        class="modal fade"
        id="add-host-modal"
        tabindex="-1"
        aria-labelledby="addHostLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="addHostLabel">Add host</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <form class="needs-validation" novalidate id="addHostForm">
                <div class="mb-3">
                  <label for="host-name" class="form-label">Name</label>
                  <input
                    type="text"
                    class="form-control"
                    id="host-name"
                    placeholder="Enter hostname"
                    required
                  />
                  <div class="invalid-feedback">Please enter hostname.</div>
                </div>
                <div class="mb-3">
                  <label for="host-mac" class="form-label">MAC Address</label>
                  <input
                    type="text"
                    class="form-control"
                    id="host-mac"
                    placeholder="Enter MAC address"
                    required
                  />
                  <div class="invalid-feedback">Please enter MAC address.</div>
                </div>
                <div class="mb-3">
                  <label for="host-ip" class="form-label">IP Address</label>
                  <input
                    type="text"
                    class="form-control"
                    id="host-ip"
                    placeholder="Enter IP address"
                    required
                  />
                  <div class="invalid-feedback">Please enter IP address.</div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary" form="addHostForm">
                Add
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit host modal -->
      <div
        class="modal fade"
        id="edit-host-modal"
        tabindex="-1"
        aria-labelledby="editHostLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editHostLabel">Edit HOST</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <form class="needs-validation" novalidate id="editHostForm">
                <div class="mb-3">
                  <label for="edit-host-name" class="form-label">Name</label>
                  <input
                    type="text"
                    class="form-control"
                    id="edit-host-name"
                    placeholder="Enter hostname"
                    required
                  />
                  <div class="invalid-feedback">Please enter hostname.</div>
                </div>
                <div class="mb-3">
                  <label for="edit-host-mac" class="form-label"
                    >MAC Address</label
                  >
                  <input
                    type="text"
                    class="form-control"
                    id="edit-host-mac"
                    placeholder="Enter MAC address"
                    required
                  />
                  <div class="invalid-feedback">Please enter MAC address.</div>
                </div>
                <div class="mb-3">
                  <label for="edit-host-ip" class="form-label"
                    >IP Address</label
                  >
                  <input
                    type="text"
                    class="form-control"
                    id="edit-host-ip"
                    placeholder="Enter IP address"
                    required
                  />
                </div>
                <div class="invalid-feedback">Please enter IP address.</div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary" form="editHostForm">
                Save changes
              </button>
              <button
                type="button"
                class="btn btn-danger"
                onclick="confirmDelete()"
              >
                Delete
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings modal -->
      <div
        class="modal fade"
        id="settings-modal"
        tabindex="-1"
        aria-labelledby="settingsLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="settingsLabel">Settings</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <!-- About card -->
              <div class="card">
                <div class="card-header">
                  <h5 class="modal-title">About</h5>
                </div>
                <div class="card-body">
                  <p class="card-text">
                    Version:
                    <span
                      id="version"
                      class="badge rounded-pill text-bg-success"
                    ></span>
                  </p>
                  <p class="card-text">
                    Hostname:
                    <span id="hostname" class="badge text-bg-info"></span>
                  </p>
                </div>
              </div>
              <hr />

              <!-- Network card -->
              <div class="card">
                <div class="card-header">
                  <h5 class="modal-title">Network</h5>
                </div>
                <div class="card-body">
                  <form id="editNetworkSettingsForm">
                    <div class="form-check form-check-inline mb-3">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="inlineRadioOptions"
                        id="inlineRadioStaticIP"
                        value="staticIP"
                        onchange="toggleNetworkFields()"
                      />
                      <label class="form-check-label" for="inlineRadio1"
                        >Static IP</label
                      >
                    </div>
                    <div class="form-check form-check-inline">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="inlineRadioOptions"
                        id="inlineRadioDHCP"
                        value="dhcp"
                        onchange="toggleNetworkFields()"
                      />
                      <label class="form-check-label" for="inlineRadio2"
                        >DHCP</label
                      >
                    </div>
                    <div class="mb-3">
                      <label for="ip" class="form-label">IP:</label>
                      <input
                        type="text"
                        class="form-control"
                        id="fieldIP"
                        placeholder="192.168.2.9"
                      />
                      <div class="invalid-feedback">Please enter static IP</div>
                    </div>
                    <div class="mb-3">
                      <label for="static-network-mask" class="form-label"
                        >Network Mask:</label
                      >
                      <input
                        type="text"
                        class="form-control"
                        id="fieldNetworkMask"
                        placeholder="255.255.255.0"
                      />
                      <div class="invalid-feedback">
                        Please enter network mask
                      </div>
                    </div>
                    <div class="mb-3">
                      <label for="static-gateway" class="form-label"
                        >Gateway:</label
                      >
                      <input
                        type="text"
                        class="form-control"
                        id="fieldGateway"
                        placeholder="192.168.2.1"
                      />
                      <div class="invalid-feedback">Please enter gateway</div>
                    </div>
                  </form>
                </div>
                <div class="card-footer">
                  <button
                    type="button"
                    class="btn btn-primary"
                    id="updateNetworkSettingsButton"
                    onclick="updateNetworkSettings()"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    class="btn btn-danger"
                    title="Reset WiFi"
                    data-bs-toggle="modal"
                    data-bs-target="#reset-wifi-modal"
                    data-bs-dismiss="modal"
                  >
                    Reset WiFi
                  </button>
                </div>
              </div>
              <hr />

              <!-- Authentication card -->
              <div class="card">
                <div class="card-header">
                  <h5 class="modal-title">Authentication</h5>
                </div>
                <div class="card-body">
                  <form id="editAuthenticationSettingsForm">
                    <div class="form-check form-switch mb-3">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="switchEnableAuthentication"
                        onchange="toggleAuthenticationFields()"
                      />
                      <label
                        class="form-check-label"
                        for="switchEnableAuthentication"
                        >Enable</label
                      >
                    </div>
                    <div class="mb-3">
                      <label for="username" class="form-label">Username:</label>
                      <input
                        type="text"
                        class="form-control"
                        id="fieldUsername"
                        placeholder="Enter username"
                      />
                      <div class="invalid-feedback">Please enter username</div>
                    </div>
                    <div class="mb-3">
                      <label for="password" class="form-label">Password:</label>
                      <input
                        type="password"
                        class="form-control"
                        id="fieldPassword"
                        placeholder="Enter password"
                      />
                      <div class="invalid-feedback">Please enter password</div>
                    </div>
                  </form>
                </div>
                <div class="card-footer">
                  <button
                    type="button"
                    class="btn btn-primary"
                    id="updateAuthenticationButton"
                    onclick="updateAuthentication()"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Reset wifi modal -->
      <div
        class="modal fade"
        id="reset-wifi-modal"
        tabindex="-1"
        aria-labelledby="resetWiFiLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="resetWiFiLabel">
                Reset WiFi Settings
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <p>
                Are you sure you want to reset WiFi settings? This will clear
                saved credentials.
              </p>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-danger"
                onclick="resetWiFiSettings()"
              >
                Reset
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
                data-bs-toggle="modal"
                data-bs-target="#settings-modal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer class="text-center mt-5">
        <p>&copy; 2025 StafLoker</p>
      </footer>
    </body>
  </head>
</html>
)rawliteral";
