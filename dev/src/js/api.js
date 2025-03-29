/**
 * API functions for EspWOL
 * Handles all API interactions with the backend
 */

// Mock data for demo mode (will be overridden by build-demo.js)
let hosts = [];
let simulatedData = {};

// Host Management
async function getAllHost() {
  try {
    // Implementation depends on environment
    // Development/Production uses real API
    // Demo uses mock data
    const response = await fetch('/hosts', { method: 'GET' });
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected an array');

    renderHostList(data);
    return data;
  } catch (error) {
    console.error('Error fetching host list:', error);
    showNotification('Failed to fetch hosts', 'danger', 'Error');
    return [];
  }
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
    const response = await fetch('/hosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mac, ip, periodicPing })
    });
    const data = await response.json();

    disabledLoaderButton(button, `Add`);

    if (data.success) {
      modal.hide();
      await getAllHostWithLoader();
      document.getElementById('host-name').value = '';
      document.getElementById('host-mac').value = '';
      document.getElementById('host-ip').value = '';
      document.getElementById('add-select-periodic-ping').value = 0;
    }

    showNotification(
      data.message,
      data.success ? 'success' : 'danger',
      data.success ? 'Notification' : 'Error'
    );
  } catch (error) {
    disabledLoaderButton(button, `Add`);
    showNotification('Error adding host', 'danger', 'Error');
    console.error('Error adding host:', error);
  }
}

async function editHost(index) {
  const button = document.getElementById(`edit-button-${index}`);
  enableLoaderButton(button);
  document.getElementById('edit-host-modal').setAttribute('data-index', index);

  const modal = new bootstrap.Modal('#edit-host-modal');
  try {
    const response = await fetch('/hosts?id=' + index, { method: 'GET' });
    const data = await response.json();

    document.getElementById('edit-host-name').value = data.name;
    document.getElementById('edit-host-mac').value = data.mac;
    document.getElementById('edit-host-ip').value = data.ip;
    document.getElementById('edit-select-periodic-ping').value =
      data.periodicPing;

    if (
      typeof data.lastPing === 'number' &&
      !isNaN(data.lastPing) &&
      data.lastPing >= 0
    ) {
      const lastPingMinutes = Math.floor(data.lastPing / 60);
      document.getElementById(
        'edit-last-ping'
      ).innerText = `Last ping: ${lastPingMinutes} mins ago`;
    } else {
      document.getElementById('edit-last-ping').innerText = 'Last ping: N/A';
    }

    disabledLoaderButton(button, `<i class="fas fa-edit"></i>`);
    modal.show();
  } catch (error) {
    disabledLoaderButton(button, `<i class="fas fa-edit"></i>`);
    showNotification('Error edit host', 'danger', 'Error');
    console.error('Error edit host:', error);
  }
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
    const response = await fetch('/hosts?id=' + index, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mac, ip, periodicPing })
    });
    const data = await response.json();

    if (data.success) {
      await getAllHostWithLoader();
    }

    modal.hide();
    disabledLoaderButton(button, `Save changes`);

    showNotification(
      data.message,
      data.success ? 'success' : 'danger',
      data.success ? 'Notification' : 'Error'
    );
  } catch (error) {
    disabledLoaderButton(button, `Save changes`);
    showNotification('Error edit host', 'danger', 'Error');
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
    const response = await fetch('/hosts?id=' + index, {
      method: 'DELETE'
    });
    const data = await response.json();

    modal.hide();
    disabledLoaderButton(button, `Delete`);

    if (data.success) {
      await getAllHostWithLoader();
    }

    showNotification(
      data.message,
      data.success ? 'success' : 'danger',
      data.success ? 'Notification' : 'Error'
    );
  } catch (error) {
    disabledLoaderButton(button, `Delete`);
    showNotification('Error delete host', 'danger', 'Error');
    console.error('Error delete host:', error);
  }
}

// Host Actions
async function pingHost(index) {
  const button = document.getElementById(`ping-button-${index}`);
  enableLoaderButton(button);

  try {
    const response = await fetch('/ping?id=' + index, {
      method: 'POST'
    });

    const data = await response.json();
    const statusCircle = document.getElementById(`status-${index}`);
    disabledLoaderButton(button, '<i class="fas fa-table-tennis"></i>');

    if (data.success) {
      statusCircle.classList.remove('red', 'lumen-red');
      statusCircle.classList.add('green', 'lumen');

      showNotification(data.message, 'success');
      setTimeout(() => {
        statusCircle.classList.remove('lumen', 'green');
      }, 10000);
    } else {
      statusCircle.classList.remove('green', 'lumen');
      statusCircle.classList.add('red', 'lumen-red');
      showNotification(data.message, 'danger', 'Error');

      setTimeout(() => {
        statusCircle.classList.remove('lumen-red', 'red');
      }, 10000);
    }
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
  } finally {
    disabledLoaderButton(button, '<i class="fas fa-play"></i>');
  }
}

// Settings Management
async function getSettings() {
  const button = document.getElementById(`settings-button`);
  enableLoaderButton(button);
  try {
    await Promise.all([getAbout(), getNetworkSettings(), getAuthentication()]);
    const modal = new bootstrap.Modal('#settings-modal');
    modal.show();
  } catch (error) {
    console.error('Error loading settings:', error);
    showNotification('Failed to load settings', 'danger', 'Error');
  } finally {
    disabledLoaderButton(button, '<i class="fas fa-cog"></i>');
  }
}

async function getAbout() {
  const response = await fetch('/about');
  if (!response.ok) {
    if (response.status === 400) {
      const data = await response.json();
      showNotification(data.message, 'danger', 'Error');
    }
    throw new Error('Failed to fetch About information');
  }

  const data = await response.json();
  const versionElement = document.getElementById('version');
  const versionContainer = document.getElementById('version-container');

  versionElement.innerText = data.version;
  versionElement.className = 'badge rounded-pill';

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
  document.getElementById('fieldDNS').value = data.dns;

  toggleNetworkFields();
}

async function getAuthentication() {
  const response = await fetch('/authenticationSettings');
  if (!response.ok) throw new Error('Failed to fetch Authentication Settings');

  const data = await response.json();
  document.getElementById('switchEnableAuthentication').checked = data.enable;
  document.getElementById('fieldUsername').value = data.username;

  toggleAuthenticationFields();
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
    const response = await fetch('/networkSettings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable, ip, networkMask, gateway, dns })
    });
    const data = await response.json();

    modal.hide();
    disabledLoaderButton(button, `Update`);

    showNotification(
      data.message,
      data.success ? 'success' : 'danger',
      data.success ? 'Notification' : 'Error'
    );

    if (data.success) {
      setTimeout(() => {
        if (enable) {
          window.location.replace('http://' + ip);
        } else {
          location.reload();
        }
      }, 500);
    }
  } catch (error) {
    disabledLoaderButton(button, `Update`);
    showNotification('Error to update network settings', 'danger', 'Error');
    console.error('Fetch error:', error);
  }
}

async function updateAuthentication() {
  const button = document.getElementById(`updateAuthenticationButton`);
  enableLoaderButton(button);
  const enable = document.getElementById('switchEnableAuthentication').checked;
  const username = document.getElementById('fieldUsername').value;
  const password = document.getElementById('fieldPassword').value;

  const modalElement = document.getElementById('settings-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const response = await fetch('/authenticationSettings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable, username, password })
    });
    const data = await response.json();

    modal.hide();
    disabledLoaderButton(button, `Update`);

    showNotification(
      data.message,
      data.success ? 'success' : 'danger',
      data.success ? 'Notification' : 'Error'
    );

    if (data.success) {
      setTimeout(() => {
        location.reload();
      }, 500);
    }
  } catch (error) {
    disabledLoaderButton(button, `Update`);
    showNotification(
      'Error to update authentication settings',
      'danger',
      'Error'
    );
    console.error('Fetch error:', error);
  }
}

async function resetWiFiSettings() {
  const button = document.getElementById(`reset-wifi-button`);
  const modalElement = document.getElementById('reset-wifi-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);
  enableLoaderButton(button);

  try {
    const response = await fetch('/resetWifi', { method: 'POST' });
    const data = await response.json();

    showNotification(
      data.message,
      data.success ? 'success' : 'danger',
      data.success ? 'Notification' : 'Error'
    );

    modal.hide();
    disabledLoaderButton(button, `Reset`);

    if (data.success) {
      setTimeout(() => {
        location.reload();
      }, 500);
    }
  } catch (error) {
    disabledLoaderButton(button, `Reset`);
    showNotification('Error to reset WIFI settings', 'danger', 'Error');
    console.error('Fetch reset WIFI settings error:', error);
  }
}

// Version Management
async function getUpdateVersion() {
  const modal = new bootstrap.Modal('#update-version-modal');
  try {
    const response = await fetch('/updateVersion');
    const data = await response.json();

    if (response.status === 400) {
      showNotification(data.message, 'danger', 'Error');
    } else {
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
    }
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
    const response = await fetch('/updateVersion', { method: 'POST' });
    const data = await response.json();

    showNotification(
      data.message,
      data.success ? 'success' : 'danger',
      data.success ? 'Update' : 'Error'
    );

    modal.hide();
    disabledLoaderButton(button, `Update`);

    if (data.success) {
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
    }
  } catch (error) {
    disabledLoaderButton(button, `Update`);
    showNotification(
      'Error to updating to last version',
      'danger',
      'Updating error'
    );
    console.error('Error fetching update version:', error);
  }
}

// Import/Export Functions
async function exportDatabase2CSV() {
  const button = document.getElementById(`exportButton`);
  enableLoaderButton(button);
  const modalElement = document.getElementById('export-import-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const response = await fetch('/hosts', { method: 'GET' });
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected an array');

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
  } catch (error) {
    disabledLoaderButton(button, `Export`);
    showNotification('Error exporting data', 'danger', 'Error');
    console.error('Error exporting data:', error);
  }
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

    const hosts = lines
      .slice(1)
      .map((line) => {
        const values = line.split(',').map((value) => value.trim());
        const host = {};
        if (values[0]) host.name = values[0];
        if (values[1]) host.mac = values[1];
        if (values[2]) host.ip = values[2];
        if (values[3]) host.periodicPing = parseInt(values[3], 10);
        return host;
      })
      .filter((host) => host);

    try {
      const response = await fetch('/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hosts)
      });

      const data = await response.json();
      showNotification(
        data.message,
        data.success ? 'success' : 'danger',
        data.success ? 'Import' : 'Error'
      );

      modal.hide();
      disabledLoaderButton(button, `Import`);

      await getAllHostWithLoader();
    } catch (error) {
      disabledLoaderButton(button, `Import`);
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
