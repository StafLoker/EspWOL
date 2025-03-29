// Data simulation
let hosts = [
  {
    name: 'Server',
    mac: '76:14:22:af:23:46',
    ip: '192.168.1.101',
    periodicPing: 0,
    lastPing: -1
  },
  {
    name: 'PC',
    mac: '76:14:22:af:23:46',
    ip: '192.168.1.102',
    periodicPing: 3600,
    lastPing: 1000
  }
];

document.addEventListener('DOMContentLoaded', async function () {
  // Light-Dark mode toggle
  const htmlElement = document.documentElement;
  const darkModeToggle = document.getElementById('darkModeToggle');
  const darkModeIcon = document.getElementById('darkModeIcon');
  const prefersDarkScheme = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;
  const currentTheme =
    localStorage.getItem('bsTheme') || (prefersDarkScheme ? 'dark' : 'light');

  function updateThemeIcon(theme) {
    darkModeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    updateLoaderColor(theme);
  }

  function updateLoaderColor(theme) {
    const loader = document.querySelector('l-bouncy');
    if (loader) {
      loader.setAttribute('color', theme === 'dark' ? 'white' : 'black');
    }
  }

  htmlElement.setAttribute('data-bs-theme', currentTheme);
  updateThemeIcon(currentTheme);

  darkModeToggle.addEventListener('click', function () {
    const newTheme =
      htmlElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('bsTheme', newTheme);
    updateThemeIcon(newTheme);
  });

  // Forms validation
  document.querySelectorAll('.needs-validation').forEach((form) => {
    form.addEventListener('submit', handleFormSubmit);
  });

  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      switch (input.name) {
        case 'mac':
          testInputAndSetClass(input, validateMAC);
          break;
        case 'ip':
          testInputAndSetClass(input, validateIP);
          break;
        case 'password':
          testInputAndSetClass(
            input,
            validatePassword,
            'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
          );
          break;
        case 'username':
          testInputAndSetClass(
            input,
            validateUsername,
            'Username must be at least 3 characters long.'
          );
          break;
      }
    });
  });

  // Load all hosts
  enableLoaderWithBlur();
  updateLoaderColor(currentTheme);
  const loader = document.getElementById('loader');
  await getAllHost();
  disabledLoaderWithBlur(loader);
});

async function getAllHostWithLoader() {
  enableLoaderWithBlur();
  const loader = document.getElementById('loader');
  await getAllHost();
  disabledLoaderWithBlur(loader);
}

function enableLoaderWithBlur() {
  const loaderHTML = `
    <l-bouncy
      id="loader"
      size="54"
      speed="1.9"
      color="white"
    ></l-bouncy>
  `;
  const layoutDiv = document.querySelector('.layout');
  layoutDiv.insertAdjacentHTML('afterbegin', loaderHTML);
  document.body.classList.add('blurred');
}

function disabledLoaderWithBlur(loader) {
  setTimeout(() => {
    document.body.classList.remove('blurred');
    loader.remove();
  }, 2500);
}

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
      case 'importForm':
        await importDatabaseFromCSV();
    }
  } catch (error) {
    console.error('Error during processing form', error);
  }
}

function testInputAndSetClass(
  input,
  validationFn,
  errorMessage = 'Invalid field.'
) {
  if (validationFn(input.value)) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    input.setCustomValidity('');
  } else {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    input.setCustomValidity(errorMessage);
  }
}

function validateMAC(mac) {
  return /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(mac);
}


function validateIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  ip = ip.trim();
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

function validatePassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}

function validateUsername(username) {
  return username.length >= 3;
}

async function getAllHost() {
  try {
    const hostsList = document.getElementById('host-list');
    hostsList.innerHTML = '';
    hosts.forEach((host, index) => {
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
    <div class="d-none d-sm-inline-block">
      <button id="ping-button-${index}" class="btn btn-info btn-sm me-2" onclick="pingHost(${index})">
        <i class="fas fa-table-tennis"></i>
      </button>
      <button id="edit-button-${index}" class="btn btn-warning btn-sm me-2" onclick="editHost(${index})" data-index="${index}">
        <i class="fas fa-edit"></i>
      </button>
    </div>
    
    <div class="dropdown d-inline-block d-sm-none">
      <button class="btn btn-secondary btn-sm dropdown-toggle me-2" type="button" 
          id="hostActionMenu-${index}" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="fas fa-wrench"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="hostActionMenu-${index}">
        <li>
          <button class="dropdown-item" onclick="pingHost(${index})">
            <i class="fas fa-table-tennis text-info"></i> Ping
          </button>
        </li>
        <li>
          <button class="dropdown-item" onclick="editHost(${index})" data-index="${index}">
            <i class="fas fa-edit text-warning"></i> Edit
          </button>
        </li>
      </ul>
    </div>
    
    <button id="wake-button-${index}" class="btn btn-primary btn-sm" onclick="wakeHost(${index})">
      <i class="fas fa-play"></i>
    </button>
  </div>`;
      hostsList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error fetching host list:', error);
  }
}

function enableLoaderButton(button) {
  button.setAttribute('disabled', '');
  button.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status"></span>';
}

function disabledLoaderButton(button, html) {
  button.innerHTML = html;
  button.removeAttribute('disabled');
}

async function addHost() {
  const button = document.getElementById(`add-button`);
  enableLoaderButton(button);
  const name = document.getElementById('host-name').value;
  const mac = document.getElementById('host-mac').value;
  const ip = document.getElementById('host-ip').value;
  const periodicPing = document.getElementById(
    'add-select-periodic-ping'
  ).value;

  const modalElement = document.getElementById('add-host-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    hosts.push({ name, mac, ip, periodicPing, lastPing: 0 });
    await getAllHostWithLoader();
    document.getElementById('host-name').value = '';
    document.getElementById('host-mac').value = '';
    document.getElementById('host-ip').value = '';
    document.getElementById('add-select-periodic-ping').value = 0;
    setTimeout(() => {
      modal.hide();
      disabledLoaderButton(button, `Add`);
    }, 1000);
    showNotification('Host added successfully', 'success', 'Notification');
  } catch (error) {
    setTimeout(() => {
      disabledLoaderButton(button, `Add`);
    }, 1000);
    showNotification('Error adding host', 'danger', 'Error');
    console.error('Error adding host:', error);
  }
}

async function editHost(index) {
  const button = document.getElementById(`edit-button-${index}`);
  enableLoaderButton(button);
  const host = hosts[index];
  document.getElementById('edit-host-modal').setAttribute('data-index', index);
  const modal = new bootstrap.Modal('#edit-host-modal');
  setTimeout(() => {
    try {
      document.getElementById('edit-host-name').value = host.name;
      document.getElementById('edit-host-mac').value = host.mac;
      document.getElementById('edit-host-ip').value = host.ip;
      document.getElementById('edit-select-periodic-ping').value =
        host.periodicPing;
      if (
        typeof host.lastPing === 'number' &&
        !isNaN(host.lastPing) &&
        host.lastPing >= 0
      ) {
        const lastPingMinutes = Math.floor(host.lastPing / 60);
        document.getElementById(
          'edit-last-ping'
        ).innerText = `Last ping: ${lastPingMinutes} mins ago`;
      } else {
        document.getElementById('edit-last-ping').innerText = 'Last ping: N/A';
      }
      modal.show();
    } catch (error) {
      showNotification('Error edit host', 'danger', 'Error');
      console.error('Error edit host:', error);
    }
    disabledLoaderButton(button, '<i class="fas fa-edit"></i>');
  }, 1000);
}

async function saveEditHost() {
  const button = document.getElementById(`save-button`);
  enableLoaderButton(button);
  const modalElement = document.getElementById('edit-host-modal');
  const index = modalElement.getAttribute('data-index');
  const name = document.getElementById('edit-host-name').value;
  const mac = document.getElementById('edit-host-mac').value;
  const ip = document.getElementById('edit-host-ip').value;
  const periodicPing = document.getElementById(
    'edit-select-periodic-ping'
  ).value;

  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    hosts[index] = {
      name,
      mac,
      ip,
      periodicPing,
      lastPing: hosts[index].lastPing
    };
    setTimeout(async () => {
      modal.hide();
      disabledLoaderButton(button, `Save changes`);
      await getAllHostWithLoader();
      showNotification('Host updated successfully', 'success', 'Notification');
    }, 1000);
  } catch (error) {
    setTimeout(() => {
      disabledLoaderButton(button, `Save changes`);
      showNotification('Error edit host', 'danger', 'Error');
    }, 1000);
    console.error('Error edit host:', error);
  }
}

async function confirmDelete() {
  const button = document.getElementById(`delete-button`);
  enableLoaderButton(button);
  const modalElement = document.getElementById('edit-host-modal');
  const index = modalElement.getAttribute('data-index');

  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    hosts.splice(index, 1);
    setTimeout(async () => {
      modal.hide();
      disabledLoaderButton(button, `Delete`);
      await getAllHostWithLoader();
      showNotification('Host deleted successfully', 'success', 'Notification');
    }, 1000);
  } catch (error) {
    setTimeout(() => {
      disabledLoaderButton(button, `Delete`);
      showNotification('Error delete host', 'danger', 'Error');
    }, 1000);
    console.error('Error delete host:', error);
  }
}

async function pingHost(index) {
  const button = document.getElementById(`ping-button-${index}`);
  enableLoaderButton(button);

  try {
    setTimeout(() => {
      const success = Math.random() > 0.5;
      const statusCircle = document.getElementById(`status-${index}`);
      disabledLoaderButton(button, '<i class="fas fa-table-tennis"></i>');

      if (success) {
        statusCircle.classList.remove('red', 'lumen-red');
        
        statusCircle.classList.add('green', 'lumen');

        showNotification('Ping successful', 'success');
        
        setTimeout(() => {
          statusCircle.classList.remove('lumen', 'green');
        }, 10000);
      } else {
        statusCircle.classList.remove('green', 'lumen');
        
        statusCircle.classList.add('red', 'lumen-red');
        
        showNotification('Ping failed', 'danger', 'Error');

        setTimeout(() => {
          statusCircle.classList.remove('lumen-red', 'red');
        }, 10000);
      }
    }, 2000);
  } catch (error) {
    showNotification('Ping failed', 'danger', 'Error');
    disabledLoaderButton(button, '<i class="fas fa-table-tennis"></i>');
    console.error('Ping failed:', error);
  }
}

async function wakeHost(index) {
  const button = document.getElementById(`wake-button-${index}`);
  enableLoaderButton(button);
  try {
    const success = Math.random() > 0.5;
    showNotification(
      success ? 'WOL packet sent successfully' : 'WOL packet failed to send',
      success ? 'info' : 'danger',
      success ? 'Notification' : 'Error'
    );
  } catch (error) {
    showNotification("WOL packet don't sent", 'danger');
    console.error("WOL packet don't sent:", error);
  } finally {
    setTimeout(() => {
      disabledLoaderButton(button, '<i class="fas fa-play"></i>');
    }, 500);
  }
}

const simulatedData = {
  about: {
    version: '2.0.0',
    lastVersion: '2.1.0',
    notesLastVersion:
      'Add DNS field to network configuration and fix update functionality to the latest version. Enhance UI user experience.',
    hostname: 'demo-host'
  },
  networkSettings: {
    enable: true,
    ip: '192.168.1.100',
    networkMask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: '8.8.8.8'
  },
  authenticationSettings: {
    enable: true,
    username: 'admin',
    password: 'password123'
  }
};

async function getAbout() {
  try {
    const data = simulatedData.about;
    const versionElement = document.getElementById('version');
    const versionContainer = document.getElementById('version-container');
    versionElement.innerText = data.version;
    if (data.version === data.lastVersion) {
      versionElement.classList.add('bg-success');
      const notificationCircle = versionContainer.querySelector(
        '.notification-circle'
      );
      if (notificationCircle) {
        notificationCircle.remove();
      }
    } else {
      versionElement.classList.add('bg-warning');
      versionElement.classList.add('text-dark');
      if (!versionContainer.querySelector('.notification-circle')) {
        const notificationCircle = document.createElement('span');
        notificationCircle.className =
          'position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle notification-circle';
        versionContainer.appendChild(notificationCircle);
      }
    }
    document.getElementById('hostname').innerText = data.hostname;
  } catch (error) {
    console.error('Error fetching About information:', error);
    showNotification('Failed to fetch About information', 'danger', 'Error');
  }
}

async function getNetworkSettings() {
  try {
    const data = simulatedData.networkSettings;
    document.getElementById('inlineRadioStaticIP').checked = data.enable;
    document.getElementById('inlineRadioDHCP').checked = !data.enable;
    document.getElementById('fieldIP').value = data.ip;
    document.getElementById('fieldNetworkMask').value = data.networkMask;
    document.getElementById('fieldGateway').value = data.gateway;
    document.getElementById('fieldDNS').value = data.dns;

    toggleNetworkFields();
  } catch (error) {
    console.error('Error fetching Network Settings:', error);
    showNotification('Failed to fetch Network Settings', 'danger', 'Error');
  }
}

async function getAuthentication() {
  try {
    const data = simulatedData.authenticationSettings;
    document.getElementById('switchEnableAuthentication').checked = data.enable;
    document.getElementById('fieldUsername').value = data.username;

    const form = document.getElementById('editAuthenticationSettingsForm');
    if (data.enable) {
      form.classList.add('needs-validation');
      form.classList.add('novalidate');
    }

    toggleAuthenticationFields();
  } catch (error) {
    console.error('Error fetching Authentication Settings:', error);
    showNotification(
      'Failed to fetch Authentication Settings',
      'danger',
      'Error'
    );
  }
}

async function getSettings() {
  const button = document.getElementById(`settings-button`);
  enableLoaderButton(button);
  setTimeout(async () => {
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
    disabledLoaderButton(button, '<i class="fas fa-cog"></i>');
  }, 1000);
}

async function updateNetworkSettings() {
  const button = document.getElementById(`updateNetworkSettingsButton`);
  enableLoaderButton(button);
  const enable = document.getElementById('inlineRadioStaticIP').checked;
  const ip = document.getElementById('fieldIP').value;
  const networkMask = document.getElementById('fieldNetworkMask').value;
  const gateway = document.getElementById('fieldGateway').value;
  const dns = document.getElementById('fieldDNS').value;

  const modalElement = document.getElementById('settings-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    simulatedData.networkSettings = {
      enable,
      ip,
      networkMask,
      gateway,
      dns
    };

    setTimeout(() => {
      modal.hide();
      disabledLoaderButton(button, `Update`);
    }, 500);

    showNotification(
      'Network settings updated successfully',
      'success',
      'Notification'
    );

    if (enable) {
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  } catch (error) {
    setTimeout(() => {
      disabledLoaderButton(button, `Update`);
    }, 500);
    showNotification('Error updating network settings', 'danger', 'Error');
    console.error('Error updating network settings:', error);
  }
}

async function updateAuthentication() {
  const button = document.getElementById('updateAuthenticationButton');
  enableLoaderButton(button);
  const enable = document.getElementById('switchEnableAuthentication').checked;
  const username = document.getElementById('fieldUsername').value;
  const password = document.getElementById('fieldPassword').value;

  const modalElement = document.getElementById('settings-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    simulatedData.authenticationSettings = { enable, username, password };

    setTimeout(() => {
      modal.hide();
      disabledLoaderButton(button, `Update`);
    }, 500);

    showNotification(
      'Authentication settings updated successfully',
      'success',
      'Notification'
    );

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    setTimeout(() => {
      disabledLoaderButton(button, `Update`);
    }, 500);
    showNotification(
      'Error updating authentication settings',
      'danger',
      'Error'
    );
    console.error('Error updating authentication settings:', error);
  }
}

async function exportDatabase2CSV() {
  const button = document.getElementById(`exportButton`);
  enableLoaderButton(button);
  const modalElement = document.getElementById('export-import-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  const data = hosts;

  let csvContent = 'data:text/csv;charset=utf-8,';

  csvContent += 'Name, MAC Address, IP Address, Periodic ping\n';

  data.forEach((host) => {
    let row = `${host.name}, ${host.mac}, ${host.ip}, ${host.periodicPing}`;
    csvContent += row + '\n';
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}--${hours}-${minutes}-${seconds}`;
  const filename = `export-db-hosts-espwol-${timestamp}.csv`;

  modal.hide();
  disabledLoaderButton(button, `Export`);

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function importDatabaseFromCSV() {
  const button = document.getElementById(`importButton`);
  enableLoaderButton(button);
  const modalElement = document.getElementById('export-import-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  const fileInput = document.getElementById('importFormFile');
  const selectedFile = fileInput.files[0];

  const reader = new FileReader();
  reader.onload = async function (e) {
    const csvData = e.target.result;
    const lines = csvData
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    const host2import = lines
      .slice(1)
      .map((line) => {
        const values = line.split(',').map((value) => value.trim());
        const host = {};
        if (values[0]) host.name = values[0];
        if (values[1]) host.mac = values[1];
        if (values[2]) host.ip = values[2];
        host.periodicPing = values[3] ? parseInt(values[3], 10) : 0;
        return host;
      })
      .filter((host) => host);

    try {
      hosts.push(...host2import);

      showNotification('All is imported.', 'success', 'Import');

      setTimeout(async () => {
        modal.hide();
        disabledLoaderButton(button, `Import`);
        await getAllHostWithLoader();
      }, 1000);
    } catch (error) {
      setTimeout(() => {
        disabledLoaderButton(button, `Import`);
      }, 1000);
      console.error('Error importing CSV:', error);
      showNotification(
        'Error importing CSV. Please try again.',
        'danger',
        'Error'
      );
    } finally {
      fileInput.value = '';
    }
  };

  reader.readAsText(selectedFile);
}

async function resetWiFiSettings() {
  const button = document.getElementById(`reset-wifi-button`);
  enableLoaderButton(button);
  try {
    showNotification(
      'WiFi settings reset successfully',
      'success',
      'Notification'
    );
    setTimeout(() => {
      disabledLoaderButton(button, `Reset`);
    }, 500);

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    setTimeout(() => {
      disabledLoaderButton(button, `Reset`);
    }, 1000);
    showNotification('Error resetting WiFi settings', 'danger', 'Error');
    console.error('Error resetting WiFi settings:', error);
  }
}

async function getUpdateVersion() {
  const modal = new bootstrap.Modal('#update-version-modal');
  try {
    const data = simulatedData.about;
    const textBody = document.getElementById('update-version-text-body');
    const updateButton = document.getElementById('button-update-version');

    if (data.version === data.lastVersion) {
      textBody.textContent = `You are up to date!`;
      updateButton.style.display = 'none';
    } else {
      textBody.innerHTML = `
    New version available: <span class="badge rounded-pill bg-primary">${data.lastVersion}</span>.
    You are using version <span class="badge rounded-pill bg-secondary">${data.version}</span>.
    <hr />
    <p>
      <h5>Detail of new release:</h5> 
      <span>${data.notesLastVersion}</span>
      <p>
        <a href="https://github.com/StafLoker/EspWOL/releases/tag/v${data.lastVersion}" target="_blank">Learn more</a>
      </p>
    </p>
  `;
      updateButton.style.display = 'block';
    }
    modal.show();
  } catch (error) {
    showNotification('Error fetching update version', 'danger', 'Error');
    console.error('Error fetching update version:', error);
  }
}

async function updateToLastVersion() {
  const button = document.getElementById(`button-update-version`);
  enableLoaderButton(button);
  const updateBannerHTML = `
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
`;

  const layoutDiv = document.querySelector('.layout');
  const modalElement = document.getElementById('update-version-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    showNotification('Update started successfully', 'success', 'Update');
    setTimeout(() => {
      modal.hide();
      disabledLoaderButton(button, `Update`);
      layoutDiv.insertAdjacentHTML('afterbegin', updateBannerHTML);
      const updateContainer = document.getElementById('update-container');
      updateContainer.style.display = 'flex';
      const updatingBar = document.getElementById('updating-bar');
      document.body.classList.add('blurred');

      let progress = 0;
      const duration = 30000; // 30 seconds
      const stepTime = 200; // ms
      const increment = 100 / (duration / stepTime); // Increase per step

      function updateProgress() {
        if (progress < 100) {
          progress += increment;
          updatingBar.style.width = `${progress}%`;
        } else {
          clearInterval(progressInterval);
          location.reload();
        }
      }

      const progressInterval = setInterval(updateProgress, stepTime);
    }, 1000);
  } catch (error) {
    setTimeout(() => {
      disabledLoaderButton(button, `Update`);
    }, 500);
    showNotification(
      'Error updating to last version',
      'danger',
      'Updating error'
    );
    console.error('Error updating to last version:', error);
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
  toast.setAttribute('data-bs-delay', '5000');
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
  const isStaticIP = document.getElementById('inlineRadioStaticIP').checked;
  const fields = ['fieldIP', 'fieldNetworkMask', 'fieldGateway', 'fieldDNS'];

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
}

function toggleAuthenticationFields() {
  const isEnabled = document.getElementById(
    'switchEnableAuthentication'
  ).checked;
  const fields = ['fieldUsername', 'fieldPassword'];

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
}
