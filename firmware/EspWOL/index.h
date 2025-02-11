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
    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/ldrs/dist/auto/bouncy.js"
    ></script>
    <script>
      document.addEventListener('DOMContentLoaded', async function () {
        // Light-Dark mode toggle
        const htmlElement = document.documentElement;
        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeIcon = document.getElementById('darkModeIcon');
        const prefersDarkScheme = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        const currentTheme =
          localStorage.getItem('bsTheme') ||
          (prefersDarkScheme ? 'dark' : 'light');

        function updateThemeIcon(theme) {
          darkModeIcon.className =
            theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
          document
            .querySelector('l-bouncy')
            .setAttribute('color', theme === 'dark' ? 'white' : 'black');
        }

        htmlElement.setAttribute('data-bs-theme', currentTheme);
        updateThemeIcon(currentTheme);

        darkModeToggle.addEventListener('click', function () {
          const newTheme =
            htmlElement.getAttribute('data-bs-theme') === 'dark'
              ? 'light'
              : 'dark';
          htmlElement.setAttribute('data-bs-theme', newTheme);
          localStorage.setItem('bsTheme', newTheme);
          updateThemeIcon(newTheme);
        });
        // Forms
        const forms = document.querySelectorAll('.needs-validation');
        forms.forEach((form) => {
          form.addEventListener('submit', handleFormSubmit);
        });

        const loader = document.getElementById('loader');

        // Load all hosts
        document.body.classList.add('blurred');
        loader.style.display = 'block';

        await getAllHost();

        loader.style.display = 'none';
        document.body.classList.remove('blurred');
      });

      async function handleFormSubmit(event) {
        event.preventDefault();
        event.stopPropagation();

        const form = event.target;

        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        try {
          switch (form.id) {
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
              break;
          }

          form.classList.add('was-validated');
        } catch (error) {
          console.error('Error during processing form', error);
        }
      }

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
                            <button class="btn btn-warning btn-sm me-2" onclick="editHost(${index})" data-index="${index}">
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
        const periodicPing = document.getElementById(
          'add-select-periodic-ping'
        ).value;

        const modal = new bootstrap.Modal('#add-host-modal');

        try {
          const response = await fetch('/hosts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mac, ip, periodicPing })
          });

          const data = await response.json();
          if (data.success) {
            await getAllHost();
            document.getElementById('host-name').value = '';
            document.getElementById('host-mac').value = '';
            document.getElementById('host-ip').value = '';
            document.getElementById('add-select-periodic-ping').value = 0;

            modal.hide();
          }
          showNotification(
            data.message,
            data.success ? 'success' : 'danger',
            data.success ? 'Notification' : 'Error'
          );
        } catch (error) {
          modal.hide();
          showNotification('Error adding host', 'danger', 'Error');
          console.error('Error adding host:', error);
        }
      }

      async function editHost(index) {
        const host = document.getElementById(`host-item-${index}`);
        document
          .getElementById('edit-host-modal')
          .setAttribute('data-index', index);

        const modal = new bootstrap.Modal('#edit-host-modal');
        try {
          const response = await fetch('/hosts?id=' + index, { method: 'GET' });
          const data = await response.json();
          document.getElementById('edit-host-name').value = data.name;
          document.getElementById('edit-host-mac').value = data.mac;
          document.getElementById('edit-host-ip').value = data.ip;
          document.getElementById('edit-select-periodic-ping').value =
            data.periodicPing;
          document.getElementById('edit-last-ping').value =
            'Last ping:' + data.lastPing / 60 + 'mins ago';
          modal.show();
        } catch (error) {
          showNotification('Error edit host', 'danger', 'Error');
          console.error('Error edit host:', error);
        }
      }

      async function saveEditHost() {
        const modalElement = document.getElementById('edit-host-modal');
        const index = modalElement.getAttribute('data-index');
        const name = document.getElementById('edit-host-name').value;
        const mac = document.getElementById('edit-host-mac').value;
        const ip = document.getElementById('edit-host-ip').value;
        const periodicPing = document.getElementById(
          'edit-select-periodic-ping'
        ).value;

        const modal = new bootstrap.Modal('#edit-host-modal');

        try {
          const response = await fetch('/hosts?id=' + index, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mac, ip, periodicPing })
          });
          const data = await response.json();
          if (data.success) {
            await getAllHost();
          }

          modal.hide();

          showNotification(
            data.message,
            data.success ? 'success' : 'danger',
            data.success ? 'Notification' : 'Error'
          );
        } catch (error) {
          modal.hide();

          showNotification('Error edit host', 'danger', 'Error');
          console.error('Error edit host:', error);
        }
      }

      async function confirmDelete() {
        const modalElement = document.getElementById('edit-host-modal');
        const index = modalElement.getAttribute('data-index');

        const modal = new bootstrap.Modal('#edit-host-modal');

        try {
          const response = await fetch('/hosts?id=' + index, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (data.success) {
            await getAllHost();
          }

          modal.hide();

          showNotification(
            data.message,
            data.success ? 'success' : 'danger',
            data.success ? 'Notification' : 'Error'
          );
        } catch (error) {
          modal.hide();
          showNotification('Error delete host', 'danger', 'Error');
          console.error('Error delete host:', error);
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
          button.innerHTML = '<i class="fas fa-table-tennis"></i>';
          button.removeAttribute('disabled');

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
            showNotification(data.message, 'danger', 'Error');

            setTimeout(() => {
              statusCircle.classList.remove('red');
            }, 10000);
          }
        } catch (error) {
          showNotification('Ping failed', 'danger', 'Error');
          button.innerHTML = '<i class="fas fa-table-tennis"></i>';
          button.removeAttribute('disabled');
          console.error('Ping failed:', error);
        }
      }

      async function wakeHost(index) {
        try {
          const response = await fetch('/wake?id=' + index, {
            method: 'POST'
          });
          const data = await response.json();
          showNotification(
            data.message,
            data.success ? 'info' : 'danger',
            data.success ? 'Notification' : 'Error'
          );
        } catch (error) {
          showNotification("WOL packet don't sent", 'danger');
          console.error("WOL packet don't sent:", error);
        }
      }

      async function getAbout() {
        const response = await fetch('/about');
        if (!response.ok) throw new Error('Failed to fetch About information');

        const data = await response.json();
        document.getElementById('version').innerText = data.version;
        document
          .getElementById('version')
          .classList.add(
            data.lastVersion ? 'bg-success' : 'bg-warning text-dark'
          );
        document.getElementById('hostname').innerText = data.hostname;
      }

      async function getNetworkSettings() {
        const response = await fetch('/networkSettings');
        if (!response.ok) throw new Error('Failed to fetch Network Settings');

        const data = await response.json();
        document.getElementById('inlineRadioStaticIP').checked = data.enable;
        document.getElementById('inlineRadioDHCP').checked = !data.enable;
        document.getElementById('fieldIP').value = data.ip;
        document.getElementById('fieldNetworkMask').value = data.networkMask;
        document.getElementById('fieldGateway').value = data.gateway;

        toggleNetworkFields();
      }

      async function getAuthentication() {
        const response = await fetch('/authenticationSettings');
        if (!response.ok)
          throw new Error('Failed to fetch Authentication Settings');

        const data = await response.json();
        document.getElementById('switchEnableAuthentication').checked =
          data.enable;
        document.getElementById('fieldUsername').value = data.username;
        document.getElementById('fieldPassword').value = data.password;

        const form = document.getElementById('editAuthenticationSettingsForm');
        if (data.enable) {
          form.classList.add('needs-validation');
          form.classList.add('novalidate');
        }

        toggleAuthenticationFields();
      }

      async function getSettings() {
        try {
          await Promise.all([
            getAbout(),
            getNetworkSettings(),
            getAuthentication()
          ]);
          const modal = new bootstrap.Modal('#settings-modal');
          modal.show();
        } catch (error) {
          console.error('Error loading settings:', error);
          showNotification('Failed to load settings', 'danger', 'Error');
        }
      }

      async function updateNetworkSettings() {
        const enable = document.getElementById('inlineRadioStaticIP').checked;
        const ip = document.getElementById('fieldIP').value;
        const networkMask = document.getElementById('fieldNetworkMask').value;
        const gateway = document.getElementById('fieldGateway').value;

        const modal = new bootstrap.Modal('#settings-modal');

        try {
          const response = await fetch('/networkSettings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enable, ip, networkMask, gateway })
          });
          const data = await response.json();

          modal.hide();

          showNotification(
            data.message,
            data.success ? 'success' : 'danger',
            data.success ? 'Notification' : 'Error'
          );
          if (data.success) {
            setTimeout(() => {
              window.location.href = `http://${ip}`;
            }, 1500);
          }
        } catch {
          modal.hide();

          showNotification(
            'Error to update network settings',
            'danger',
            'Error'
          );
          console.error('Fetch error:', error);
        }
      }

      async function updateAuthentication() {
        const enable = document.getElementById(
          'switchEnableAuthentication'
        ).checked;
        const username = document.getElementById('fieldUsername').value;
        const password = document.getElementById('fieldPassword').value;

        const modal = new bootstrap.Modal('#settings-modal');

        try {
          const response = await fetch('/authenticationSettings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enable, username, password })
          });
          const data = await response.json();

          modal.hide();

          showNotification(
            data.message,
            data.success ? 'success' : 'danger',
            data.success ? 'Notification' : 'Error'
          );
          setTimeout(() => {
            location.reload();
          }, 1500);
        } catch {
          modal.hide();

          showNotification(
            'Error to update authentication settings',
            'danger',
            'Error'
          );
          console.error('Fetch error:', error);
        }
      }

      async function resetWiFiSettings() {
        try {
          const response = await fetch('/resetWifi', { method: 'POST' });
          const data = await response.json();
          showNotification(
            data.message,
            data.success ? 'success' : 'danger',
            data.success ? 'Notification' : 'Error'
          );
          if (data.success) {
            location.reload();
          }
        } catch (error) {
          showNotification('Error to reset WIFI settings', 'danger', 'Error');
          console.error('Fetch reset WIFI settings error:', error);
        }
      }

      async function getUpdateVersion() {
        const modal = new bootstrap.Modal('#update-version-modal');
        try {
          const response = await fetch('/updateVersion');
          const data = await response.json();

          const textBody = document.getElementById('update-version-text-body');
          const updateButton = document.getElementById('button-update-version');

          if (data.version === data.lastVersion) {
            textBody.textContent = `You are up to date!`;
            updateButton.style.display = 'none';
          } else {
            textBody.innerHTML = `New version available: <span class="badge rounded-pill bg-primary">${data.lastVersion}</span>.
                You are using version <span class="badge rounded-pill bg-secondary">${data.version}</span>.`;
            updateButton.style.display = 'block';
          }
          modal.show();
        } catch (error) {
          showNotification(
            'Error to get information about updating',
            'danger',
            'Error'
          );
          console.error('Error fetching update version:', error);
        }
      }

      async function updateToLastVersion() {
        const modal = new bootstrap.Modal('#update-version-modal');
        const updateContainer = document.getElementById('update-container');
        const updatingBar = document.getElementById('updating-bar');
        try {
          const response = await fetch('/updateVersion', { method: 'POST' });
          const data = await response.json();
          showNotification(
            data.message,
            data.success ? 'success' : 'danger',
            data.success ? 'Update' : 'Error'
          );

          modal.hide();
          document.body.classList.add('blurred');
          updateContainer.style.display = 'block';

          let progress = 0;
          const duration = 30000; // 30 seconds

          // Function to increment the progress
          function updateProgress() {
            if (progress < 100) {
              progress += 100 / (duration / 100); // Increase by 1% every 100ms
              updatingBar.style.width = `${progress}%`;
            } else {
              clearInterval(progressInterval); // Stop the interval when it reaches 100%
            }
          }

          // Start the interval to update the progress every 100ms
          const progressInterval = setInterval(updateProgress, 100);

          setTimeout(() => {
            location.reload();
          }, duration);
        } catch (error) {
          showNotification(
            'Error to updating to last version',
            'danger',
            'Updating error'
          );
          console.error('Error fetching update version:', error);
        }
      }

      function showNotification(message, type, title = 'Notification') {
        const notificationList = document.getElementById('notification-list');
        const notificationCount = notificationList.children.length;

        if (notificationCount >= 3) {
          notificationList.firstElementChild.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast align-items-center border-0 rounded-3`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.setAttribute('data-bs-autohide', 'true');
        toast.setAttribute('data-bs-delay', '3000');
        toast.style.opacity = 1;

        toast.innerHTML = `
          <div class="toast-header">
              <div class="me-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--bs-${type})" class="bi bi-square-fill" viewBox="0 0 16 16">
                    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z"/>
                  </svg>
              </div>
              <strong class="me-auto">${title}</strong>
              <small class="text-muted ms-auto">Just now</small>
              <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">
              ${message}
          </div>`;

        notificationList.appendChild(toast);

        const toastInstance = new bootstrap.Toast(toast);
        toastInstance.show();

        const notifications = notificationList.children;
        let opacity = 1;
        for (let i = notifications.length - 1; i >= 0; i--, opacity -= 0.25) {
          notifications[i].style.opacity = opacity;
        }

        const timeElapsed = toast.querySelector('.toast-header small');
        let secondsElapsed = 0;
        const interval = setInterval(() => {
          secondsElapsed++;
          timeElapsed.innerText = `${secondsElapsed} seg ago`;

          if (!document.body.contains(toast)) {
            clearInterval(interval);
          }
        }, 1000);
      }

      function toggleNetworkFields() {
        const isStaticIP = document.getElementById(
          'inlineRadioStaticIP'
        ).checked;
        const form = document.getElementById('editNetworkSettingsForm');
        const fields = ['fieldIP', 'fieldNetworkMask', 'fieldGateway'];
        const updateButton = document.getElementById(
          'updateNetworkSettingsButton'
        );

        fields.forEach((fieldId) => {
          const field = document.getElementById(fieldId);
          if (isStaticIP) {
            field.removeAttribute('disabled');
            field.setAttribute('required', '');
          } else {
            field.setAttribute('disabled', '');
            field.removeAttribute('required');
          }
        });

        if (isStaticIP) {
          form.classList.add('needs-validation');
          updateButton.setAttribute('form', 'editNetworkSettingsForm');
          updateButton.setAttribute('type', 'submit');
          updateButton.removeAttribute('onclick');
        } else {
          form.classList.remove('needs-validation');
          updateButton.removeAttribute('form');
          updateButton.setAttribute('type', 'button');
          updateButton.setAttribute('onclick', 'updateNetworkSettings()');
        }
      }

      function toggleAuthenticationFields() {
        const isEnabled = document.getElementById(
          'switchEnableAuthentication'
        ).checked;
        const form = document.getElementById('editAuthenticationSettingsForm');
        const fields = ['fieldUsername', 'fieldPassword'];
        const updateButton = document.getElementById(
          'updateAuthenticationButton'
        );

        fields.forEach((fieldId) => {
          const field = document.getElementById(fieldId);
          if (isEnabled) {
            field.removeAttribute('disabled');
            field.setAttribute('required', '');
          } else {
            field.setAttribute('disabled', '');
            field.removeAttribute('required');
          }
        });

        if (isEnabled) {
          form.classList.add('needs-validation');
          updateButton.setAttribute('form', 'editAuthenticationSettingsForm');
          updateButton.setAttribute('type', 'submit');
          updateButton.removeAttribute('onclick');
        } else {
          form.classList.remove('needs-validation');
          updateButton.removeAttribute('form');
          updateButton.setAttribute('type', 'button');
          updateButton.setAttribute('onclick', 'updateAuthentication()');
        }
      }
    </script>
    <style>
      html {
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      .layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
        position: relative;
      }

      main {
        flex-grow: 1;
      }

      footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        height: 40px;
        border-radius: 9px;
        padding: 10px;
      }

      footer span {
        font-size: 15px;
      }

      #github {
        text-decoration: none;
        color: inherit;
        margin-right: 10px;
      }

      #github i {
        font-size: 22px;
      }

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

      l-bouncy {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
      }

      body.blurred main {
        filter: blur(5px);
      }

      body.blurred button {
        pointer-events: none;
        opacity: 0.5;
      }

      #update-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        width: 35%;
        z-index: 9999; /* Ensure it's above other content */
      }

      #update-container h3 {
        margin-bottom: 20px;
        color: white; /* Optional: if you want the text to be white */
      }

      #update-container .progress {
        width: 80%;
        max-width: 400px;
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <!-- Loading -->
      <l-bouncy
        id="loader"
        size="54"
        speed="1.9"
        color="white"
        style="display: none"
      ></l-bouncy>

      <!-- Update banner -->
      <div id="update-container" style="display: none">
        <h3>Updating</h3>
        <div
          class="progress bg-warning"
          id="updating-bar"
          role="progressbar"
          aria-label="Updating bar"
          aria-valuenow="0"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="progress-bar" style="width: 0%"></div>
        </div>
      </div>

      <header class="d-flex justify-content-end p-3">
        <button
          id="darkModeToggle"
          class="btn btn-outline-secondary"
          data-bs-toggle="tooltip"
        >
          <i id="darkModeIcon" class="fas"></i>
        </button>
      </header>
      <main class="container mt-5">
        <h1 class="text-center">Wake on LAN</h1>

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
      </main>
      <!-- Alert Zone (Toast Container) -->
      <div aria-live="polite" aria-atomic="true" class="position-relative">
        <div
          class="toast-container bottom-0 end-0 p-3"
          id="notification-list"
        ></div>
      </div>

      <footer class="bg-body-secondary">
        <span class="fw-medium font-monospace">EspWOL</span>
        <span class="fw-medium">&copy; 2025 StafLoker</span>
        <a
          href="https://github.com/StafLoker/EspWOL"
          id="github"
          target="_blank"
        >
          <i class="fab fa-github"></i>
        </a>
      </footer>
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
              <div class="mb-3">
                <label for="add-select-periodic-ping" class="form-label"
                  >Periodic ping</label
                >
                <select
                  class="form-select"
                  id="add-select-periodic-ping"
                  aria-label="Periodic ping"
                >
                  <option value="0" selected>Disabled</option>
                  <option value="60">1 min</option>
                  <option value="300">5 min</option>
                  <option value="600">10 min</option>
                  <option value="900">15 min</option>
                  <option value="1800">30 min</option>
                  <option value="2700">45 min</option>
                  <option value="3600">1 hour</option>
                  <option value="10800">3 hours</option>
                  <option value="21600">6 hours</option>
                  <option value="43200">12 hours</option>
                  <option value="86400">24 hours</option>
                </select>
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
            <h5 class="modal-title" id="editHostLabel">Edit host</h5>
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
                <label for="edit-host-ip" class="form-label">IP Address</label>
                <input
                  type="text"
                  class="form-control"
                  id="edit-host-ip"
                  placeholder="Enter IP address"
                  required
                />
                <div class="invalid-feedback">Please enter IP address.</div>
              </div>
              <div class="mb-3">
                <label for="edit-select-periodic-ping" class="form-label"
                  >Periodic ping</label
                >
                <select
                  class="form-select"
                  id="edit-select-periodic-ping"
                  aria-label="Periodic ping"
                >
                  <option value="0" selected>Disabled</option>
                  <option value="60">1 min</option>
                  <option value="300">5 min</option>
                  <option value="600">10 min</option>
                  <option value="900">15 min</option>
                  <option value="1800">30 min</option>
                  <option value="2700">45 min</option>
                  <option value="3600">1 hour</option>
                  <option value="10800">3 hours</option>
                  <option value="21600">6 hours</option>
                  <option value="43200">12 hours</option>
                  <option value="86400">24 hours</option>
                </select>
                <small
                  class="text-muted d-flex justify-content-end"
                  id="edit-last-ping"
                >
                  Last ping: _ min ago
                </small>
              </div>
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
                    class="badge rounded-pill"
                    data-bs-dismiss="modal"
                    onclick="getUpdateVersion()"
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
            <h5 class="modal-title" id="resetWiFiLabel">Reset WiFi Settings</h5>
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

    <!-- Update version modal -->
    <div
      class="modal fade"
      id="update-version-modal"
      tabindex="-1"
      aria-labelledby="updateVersionLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="updateVersionLabel">Update version</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p id="update-version-text-body"></p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              id="button-update-version"
              class="btn btn-success"
              onclick="updateToLastVersion()"
            >
              Update
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
  </body>
</html>
)rawliteral";
