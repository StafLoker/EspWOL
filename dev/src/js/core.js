// Structure for dev/src/js/

// core.js - Core functionality & initialization
/**
 * Core functionality and initialization for EspWOL
 * Base functionality for the application.
 */

// Document Ready Handler
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize theme
    initializeTheme();
    
    // Setup form validation
    setupFormValidation();
    
    // Load initial data
    await loadInitialData();
  });
  
  // Theme Handling
  function initializeTheme() {
    // Dark/Light mode implementation
    const htmlElement = document.documentElement;
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = localStorage.getItem('bsTheme') || (prefersDarkScheme ? 'dark' : 'light');
  
    htmlElement.setAttribute('data-bs-theme', currentTheme);
    updateThemeIcon(currentTheme);
  
    darkModeToggle.addEventListener('click', function () {
      const newTheme = htmlElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      htmlElement.setAttribute('data-bs-theme', newTheme);
      localStorage.setItem('bsTheme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
  
  function updateThemeIcon(theme) {
    const darkModeIcon = document.getElementById('darkModeIcon');
    darkModeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    updateLoaderColor(theme);
  }
  
  function updateLoaderColor(theme) {
    const loader = document.querySelector('l-bouncy');
    if (loader) {
      loader.setAttribute('color', theme === 'dark' ? 'white' : 'black');
    }
  }
  
  // Setup Form Validation
  function setupFormValidation() {
    document.querySelectorAll('.needs-validation').forEach((form) => {
      form.addEventListener('submit', handleFormSubmit);
    });
  
    document.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => {
        validateInput(input);
      });
    });
  }
  
  // Initial Data Loading
  async function loadInitialData() {
    enableLoaderWithBlur();
    updateLoaderColor(document.documentElement.getAttribute('data-bs-theme'));
    const loader = document.getElementById('loader');
    await getAllHost();
    disabledLoaderWithBlur(loader);
  }
  
  // ui.js - UI functions and components
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
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
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
      listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
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
    const isEnabled = document.getElementById('switchEnableAuthentication').checked;
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
  
  // Modal Utilities
  function resetValidation(modalElement) {
    if (modalElement) {
      modalElement.querySelectorAll('input').forEach((input) => {
        input.classList.remove('is-valid', 'is-invalid');
        input.setCustomValidity('');
      });
    }
  }
  
  // validation.js - Form validation functions
  /**
   * Validation functions for EspWOL
   * Handles form validation and input validation
   */
  
  // Form Submission Handler
  function handleFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
  
    const form = event.target;
  
    // Clear previous error messages
    form.querySelectorAll('.validation-error-message').forEach((msg) => msg.remove());
  
    // Validate all fields
    const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])');
    inputs.forEach((input) => {
      if (input.value.trim() === '' && input.hasAttribute('required')) {
        input.classList.add('is-invalid');
        addErrorMessage(input, 'This field is required.');
      } else {
        input.dispatchEvent(new Event('input'));
      }
    });
  
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
  
    try {
      switch (form.id) {
        case 'addHostForm':
          addHost();
          break;
        case 'editHostForm':
          saveEditHost();
          break;
        case 'editNetworkSettingsForm':
          updateNetworkSettings();
          break;
        case 'editAuthenticationSettingsForm':
          updateAuthentication();
          break;
        case 'importForm':
          importDatabaseFromCSV();
      }
    } catch (error) {
      console.error('Error during processing form', error);
    }
  }
  
  // Input Validation
  function validateInput(input) {
    switch (input.name) {
      case 'mac':
        testInputAndSetClass(
          input,
          validateMAC,
          'Please enter a valid MAC address (format: XX:XX:XX:XX:XX:XX)'
        );
        break;
      case 'ip':
        testInputAndSetClass(
          input,
          validateIP,
          'Please enter a valid IP address (format: 192.168.1.1)'
        );
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
  }
  
  // Test Input and Set Appropriate Classes
  function testInputAndSetClass(input, validationFn, errorMessage = 'Invalid field.') {
    removeErrorMessage(input);
  
    if (input.name === 'password') {
      if (input.value.length > 0) {
        createPasswordToggle(input);
      }
      
      const result = validationFn(input.value);
      
      let requirementsContainer = input.nextElementSibling;
      if (!requirementsContainer || !requirementsContainer.classList.contains('password-requirements-container')) {
        requirementsContainer = document.createElement('div');
        requirementsContainer.className = 'password-requirements-container';
  
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
  
        const requirementsList = document.createElement('ul');
        requirementsList.className = 'password-requirements';
  
        const requirements = [
          { key: 'length', text: 'At least 8 characters' },
          { key: 'uppercase', text: 'At least one uppercase letter' },
          { key: 'lowercase', text: 'At least one lowercase letter' },
          { key: 'number', text: 'At least one number' },
          { key: 'special', text: 'At least one special character' }
        ];
  
        requirements.forEach((req) => {
          const li = document.createElement('li');
          li.innerHTML = `<i class="fas fa-times requirement-invalid"></i> ${req.text}`;
          li.dataset.requirement = req.key;
          requirementsList.appendChild(li);
        });
  
        requirementsContainer.appendChild(strengthIndicator);
        requirementsContainer.appendChild(requirementsList);
  
        input.parentNode.insertBefore(requirementsContainer, input.nextSibling);
      }
  
      const strengthIndicator = requirementsContainer.querySelector('.password-strength');
      const requirementItems = requirementsContainer.querySelectorAll('li');
  
      const strength = getPasswordStrength(result.requirements);
      strengthIndicator.className = 'password-strength';
      strengthIndicator.classList.add(`strength-${strength}`);
  
      requirementItems.forEach((item) => {
        const requirement = item.dataset.requirement;
        const icon = item.querySelector('i');
  
        if (result.requirements[requirement]) {
          icon.className = 'fas fa-check requirement-valid';
        } else {
          icon.className = 'fas fa-times requirement-invalid';
        }
      });
  
      if (result.isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        input.setCustomValidity('');
      } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        input.setCustomValidity(errorMessage);
        if (!requirementsContainer.querySelector('.validation-error-message')) {
          addErrorMessage(input, 'Please fulfill all password requirements.');
        }
      }
  
      return;
    }
  
    if (validationFn(input.value)) {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      input.setCustomValidity('');
    } else {
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
      input.setCustomValidity(errorMessage);
      addErrorMessage(input, errorMessage);
    }
  }
  
  // Error Message Handling
  function addErrorMessage(input, message) {
    removeErrorMessage(input);
  
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error-message text-danger small mt-1';
    errorDiv.textContent = message;
  
    const container = input.closest('.mb-3') || input.parentNode;
    container.appendChild(errorDiv);
  }
  
  function removeErrorMessage(input) {
    const container = input.closest('.mb-3') || input.parentNode;
    const existingError = container.querySelector('.validation-error-message');
  
    if (existingError) {
      existingError.remove();
    }
  }
  
  // Password Toggle Button
  function createPasswordToggle(inputField) {
    const parent = inputField.parentElement;
    if (parent.querySelector('.password-toggle-btn')) {
      return;
    }
  
    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
  
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle-btn';
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
  
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.right = '10px';
    toggleBtn.style.top = '50%';
    toggleBtn.style.transform = 'translateY(-50%)';
    toggleBtn.style.border = 'none';
    toggleBtn.style.background = 'transparent';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.zIndex = '100';
    toggleBtn.style.height = '38px';
    toggleBtn.style.padding = '0 10px';
    toggleBtn.title = 'Show/Hide Password';
  
    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (inputField.type === 'password') {
        inputField.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        inputField.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
      }
      inputField.focus();
    });
  
    parent.appendChild(toggleBtn);
  }
  
  // Validation Functions
  function validateMAC(mac) {
    if (!mac || typeof mac !== 'string') return false;
    mac = mac.trim();
    return /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(mac);
  }
  
  function validateIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    ip = ip.trim();
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
  }
  
  function validatePassword(password) {
    const pass = String(password || '');
  
    const requirements = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /\d/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    };
  
    const isValid = Object.values(requirements).every(Boolean);
  
    return {
      isValid,
      requirements
    };
  }
  
  function validateUsername(username) {
    return username.length >= 3;
  }
  
  function getPasswordStrength(requirements) {
    const satisfiedRequirements = Object.values(requirements).filter(Boolean).length;
    if (satisfiedRequirements <= 2) return 'weak';
    if (satisfiedRequirements === 3) return 'medium';
    if (satisfiedRequirements === 4) return 'good';
    return 'strong';
  }
  
  // api.js - API Interaction functions
  /**
   * API functions for EspWOL
   * Handles all API interactions with the backend
   */
  
  // Host Management
  async function getAllHost() {
    try {
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
  
  async function getAllHostWithLoader() {
    enableLoaderWithBlur();
    const loader = document.getElementById('loader');
    await getAllHost();
    disabledLoaderWithBlur(loader);
  }
  
  async function addHost() {
    const button = document.getElementById(`add-button`);
    enableLoaderButton(button);
    const name = document.getElementById('host-name').value;
    const mac = document.getElementById('host-mac').value;
    const ip = document.getElementById('host-ip').value;
    const periodicPing = document.getElementById('add-select-periodic-ping').value;
  
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
        resetValidation(modalElement);
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
      document.getElementById('edit-select-periodic-ping').value = data.periodicPing;
      
      if (typeof data.lastPing === 'number' && !isNaN(data.lastPing) && data.lastPing >= 0) {
        const lastPingMinutes = Math.floor(data.lastPing / 60);
        document.getElementById('edit-last-ping').innerText = `Last ping: ${lastPingMinutes} mins ago`;
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
    const periodicPing = document.getElementById('edit-select-periodic-ping').value;
  
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
      resetValidation(modalElement);
  
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
    if (data.lastVersion) {
      versionElement.classList.add('bg-success');
      const notificationCircle = versionContainer.querySelector('.notification-circle');
      if (notificationCircle) {
        notificationCircle.remove();
      }
    } else {
      versionElement.classList.add('bg-warning');
      versionElement.classList.add('text-dark');
      if (!versionContainer.querySelector('.notification-circle')) {
        const notificationCircle = document.createElement('span');
        notificationCircle.className = 'position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle notification-circle';
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
      resetValidation(modalElement);
  
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
      resetValidation(modalElement);
  
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
      showNotification('Error to update authentication settings', 'danger', 'Error');
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
      showNotification('Error to get information about updating', 'danger', 'Error');
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
      showNotification('Error to updating to last version', 'danger', 'Updating error');
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
        resetValidation(modalElement);
  
        await getAllHostWithLoader();
      } catch (error) {
        disabledLoaderButton(button, `Import`);
        console.error('Error importing CSV:', error);
        showNotification('Error importing CSV. Please try again.', 'danger', 'Error');
      } finally {
        fileInput.value = '';
      }
    };
  
    reader.readAsText(selectedFile);
  }