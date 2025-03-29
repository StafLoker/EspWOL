/**
 * API functions for EspWOL
 * Handles all API interactions with the backend
 */

// Acceder al estado global
const { state, config, events } = window.EspWOL;

/**
 * Función para manejar solicitudes fetch con gestión de errores estándar
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones para fetch
 * @returns {Promise} - Promesa con los datos de respuesta
 */
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
}

// Host Management
async function getAllHost() {
  try {
    const data = await apiRequest(config.apiEndpoints.hosts);
    
    if (!Array.isArray(data)) {
      throw new Error('Expected an array of hosts');
    }
    
    // Actualizar el estado global
    state.hosts = data;
    
    // Renderizar la lista de hosts
    renderHostList(data);
    
    // Emitir evento para otros módulos
    events.emit(events.HOSTS_UPDATED, { hosts: data });
    
    return data;
  } catch (error) {
    showNotification('Failed to fetch hosts', 'danger', 'Error');
    console.error('Error fetching host list:', error);
    return [];
  }
}

async function addHost() {
  const button = document.getElementById('add-button');
  enableLoaderButton(button);
  
  const hostData = {
    name: document.getElementById('host-name').value,
    mac: document.getElementById('host-mac').value,
    ip: document.getElementById('host-ip').value,
    periodicPing: document.getElementById('add-select-periodic-ping').value
  };

  const modalElement = document.getElementById('add-host-modal');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const response = await apiRequest(config.apiEndpoints.hosts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hostData)
    });

    if (response.success) {
      resetAddHostForm();
      modal.hide();
      await getAllHostWithLoader();
      
      // Emitir evento
      events.emit(events.HOST_ADDED, { host: hostData });
    }

    showNotification(
      response.message,
      response.success ? 'success' : 'danger',
      response.success ? 'Notification' : 'Error'
    );
  } catch (error) {
    showNotification('Error adding host', 'danger', 'Error');
  } finally {
    disabledLoaderButton(button, 'Add');
  }
}

// Helper function to reset add host form
function resetAddHostForm() {
  document.getElementById('host-name').value = '';
  document.getElementById('host-mac').value = '';
  document.getElementById('host-ip').value = '';
  document.getElementById('add-select-periodic-ping').value = '0';
}

async function editHost(index) {
  const button = document.getElementById(`edit-button-${index}`);
  enableLoaderButton(button);
  document.getElementById('edit-host-modal').setAttribute('data-index', index);

  const modal = new bootstrap.Modal('#edit-host-modal');
  try {
    const data = await apiRequest(`${config.apiEndpoints.hosts}?id=${index}`);

    document.getElementById('edit-host-name').value = data.name;
    document.getElementById('edit-host-mac').value = data.mac;
    document.getElementById('edit-host-ip').value = data.ip;
    document.getElementById('edit-select-periodic-ping').value = data.periodicPing;

    updateLastPingDisplay(data.lastPing);
    
    modal.show();
  } catch (error) {
    showNotification('Error editing host', 'danger', 'Error');
  } finally {
    disabledLoaderButton(button, '<i class="fas fa-edit"></i>');
  }
}

// Helper function to update last ping display
function updateLastPingDisplay(lastPing) {
  const lastPingElement = document.getElementById('edit-last-ping');
  
  if (typeof lastPing === 'number' && !isNaN(lastPing) && lastPing >= 0) {
    const lastPingMinutes = Math.floor(lastPing / 60);
    lastPingElement.innerText = `Last ping: ${lastPingMinutes} mins ago`;
  } else {
    lastPingElement.innerText = 'Last ping: N/A';
  }
}

async function saveEditHost() {
  const button = document.getElementById('save-button');
  enableLoaderButton(button);
  
  const modalElement = document.getElementById('edit-host-modal');
  const index = modalElement.getAttribute('data-index');
  
  const hostData = {
    name: document.getElementById('edit-host-name').value,
    mac: document.getElementById('edit-host-mac').value,
    ip: document.getElementById('edit-host-ip').value,
    periodicPing: document.getElementById('edit-select-periodic-ping').value
  };

  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const response = await apiRequest(`${config.apiEndpoints.hosts}?id=${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hostData)
    });

    if (response.success) {
      modal.hide();
      await getAllHostWithLoader();
      
      // Emitir evento
      events.emit(events.HOST_UPDATED, { index, host: hostData });
    }

    showNotification(
      response.message,
      response.success ? 'success' : 'danger',
      response.success ? 'Notification' : 'Error'
    );
  } catch (error) {
    showNotification('Error updating host', 'danger', 'Error');
  } finally {
    disabledLoaderButton(button, 'Save changes');
  }
}

async function confirmDelete() {
  const button = document.getElementById('delete-button');
  enableLoaderButton(button);
  
  const modalElement = document.getElementById('edit-host-modal');
  const index = modalElement.getAttribute('data-index');
  const modal = bootstrap.Modal.getInstance(modalElement);

  try {
    const response = await apiRequest(`${config.apiEndpoints.hosts}?id=${index}`, {
      method: 'DELETE'
    });

    modal.hide();
    
    if (response.success) {
      await getAllHostWithLoader();
      
      // Emitir evento
      events.emit(events.HOST_DELETED, { index });
    }

    showNotification(
      response.message,
      response.success ? 'success' : 'danger',
      response.success ? 'Notification' : 'Error'
    );
  } catch (error) {
    showNotification('Error deleting host', 'danger', 'Error');
  } finally {
    disabledLoaderButton(button, 'Delete');
  }
}

// Host Actions
async function pingHost(index) {
  const button = document.getElementById(`ping-button-${index}`);
  enableLoaderButton(button);

  try {
    const response = await apiRequest(`${config.apiEndpoints.ping}?id=${index}`, {
      method: 'POST'
    });

    const statusCircle = document.getElementById(`status-${index}`);
    updatePingStatus(statusCircle, response.success);
    
    showNotification(
      response.message, 
      response.success ? 'success' : 'danger',
      response.success ? 'Notification' : 'Error'
    );
  } catch (error) {
    showNotification('Ping failed', 'danger', 'Error');
  } finally {
    disabledLoaderButton(button, '<i class="fas fa-table-tennis"></i>');
  }
}

// Helper function to update ping status visual indicator
function updatePingStatus(statusCircle, success) {
  if (success) {
    statusCircle.classList.remove('red', 'lumen-red');
    statusCircle.classList.add('green', 'lumen');
    
    setTimeout(() => {
      statusCircle.classList.remove('lumen', 'green');
    }, config.ui.pingAnimationDuration);
  } else {
    statusCircle.classList.remove('green', 'lumen');
    statusCircle.classList.add('red', 'lumen-red');
    
    setTimeout(() => {
      statusCircle.classList.remove('lumen-red', 'red');
    }, config.ui.pingAnimationDuration);
  }
}

async function wakeHost(index) {
  const button = document.getElementById(`wake-button-${index}`);
  enableLoaderButton(button);
  
  try {
    const response = await apiRequest(`${config.apiEndpoints.wake}?id=${index}`, {
      method: 'POST'
    });
    
    showNotification(
      response.message,
      response.success ? 'info' : 'danger',
      response.success ? 'Notification' : 'Error'
    );
  } catch (error) {
    showNotification('Failed to send WOL packet', 'danger', 'Error');
  } finally {
    disabledLoaderButton(button, '<i class="fas fa-play"></i>');
  }
}

// Settings Management
async function getSettings() {
  const button = document.getElementById('settings-button');
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
  try {
    const data = await apiRequest(config.apiEndpoints.about);
    state.settings.about = data;
    
    updateAboutDisplay(data);
    return data;
  } catch (error) {
    showNotification('Failed to fetch About information', 'danger', 'Error');
    throw error;
  }
}

// Helper function to update About display
function updateAboutDisplay(data) {
  const versionElement = document.getElementById('version');
  const versionContainer = document.getElementById('version-container');
  
  versionElement.innerText = data.version;
  versionElement.className = 'badge rounded-pill';
  
  if (data.version === data.lastVersion) {
    versionElement.classList.add('bg-success');
    removeVersionNotification(versionContainer);
  } else {
    versionElement.classList.add('bg-warning', 'text-dark');
    addVersionNotification(versionContainer);
  }
  
  document.getElementById('hostname').innerText = data.hostname;
}

// Helper functions for version notification
function removeVersionNotification(container) {
  const notificationCircle = container.querySelector('.notification-circle');
  if (notificationCircle) {
    notificationCircle.remove();
  }
}

function addVersionNotification(container) {
  if (!container.querySelector('.notification-circle')) {
    const notificationCircle = document.createElement('span');
    notificationCircle.className = 
      'position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle notification-circle';
    container.appendChild(notificationCircle);
  }
}

// Las demás funciones también siguen el patrón de usar apiRequest, manejar errores,
// actualizar el estado global y emitir eventos cuando sea apropiado.
// Todas las funciones existentes deben actualizarse para seguir este patrón.

// Exportamos las funciones que necesitan estar disponibles globalmente
window.getAllHost = getAllHost;
window.addHost = addHost;
window.editHost = editHost;
window.saveEditHost = saveEditHost;
window.confirmDelete = confirmDelete;
window.pingHost = pingHost;
window.wakeHost = wakeHost;
window.getSettings = getSettings;
window.updateNetworkSettings = updateNetworkSettings;
window.updateAuthentication = updateAuthentication;
window.resetWiFiSettings = resetWiFiSettings;
window.getUpdateVersion = getUpdateVersion;
window.updateToLastVersion = updateToLastVersion;
window.exportDatabase2CSV = exportDatabase2CSV;
window.importDatabaseFromCSV = importDatabaseFromCSV;