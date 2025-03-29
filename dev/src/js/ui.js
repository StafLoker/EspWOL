/**
 * UI-related functionality for EspWOL
 * Handles UI components and interactions
 */

// Loading Indicators
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
  document.body.classList.remove('blurred');
  loader.remove();
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

// Host List Rendering
function renderHostList(hosts) {
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
}

// Notifications
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

// Form Field Toggling
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

// Loading with async operations
async function getAllHostWithLoader() {
  enableLoaderWithBlur();
  const loader = document.getElementById('loader');
  await getAllHost();
  disabledLoaderWithBlur(loader);
}
