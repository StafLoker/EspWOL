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
  form
    .querySelectorAll('.validation-error-message')
    .forEach((msg) => msg.remove());

  // Validate all fields
  const inputs = form.querySelectorAll(
    'input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])'
  );
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
function testInputAndSetClass(
  input,
  validationFn,
  errorMessage = 'Invalid field.'
) {
  removeErrorMessage(input);

  if (input.name === 'password') {
    if (input.value.length > 0) {
      createPasswordToggle(input);
    }

    const result = validationFn(input.value);

    let requirementsContainer = input.nextElementSibling;
    if (
      !requirementsContainer ||
      !requirementsContainer.classList.contains(
        'password-requirements-container'
      )
    ) {
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

    const strengthIndicator =
      requirementsContainer.querySelector('.password-strength');
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
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    ip
  );
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
  const satisfiedRequirements =
    Object.values(requirements).filter(Boolean).length;
  if (satisfiedRequirements <= 2) return 'weak';
  if (satisfiedRequirements === 3) return 'medium';
  if (satisfiedRequirements === 4) return 'good';
  return 'strong';
}
