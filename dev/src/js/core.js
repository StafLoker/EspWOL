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
  const htmlElement = document.documentElement;
  const darkModeToggle = document.getElementById('darkModeToggle');
  const darkModeIcon = document.getElementById('darkModeIcon');
  const prefersDarkScheme = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;
  const currentTheme =
    localStorage.getItem('bsTheme') || (prefersDarkScheme ? 'dark' : 'light');

  htmlElement.setAttribute('data-bs-theme', currentTheme);
  updateThemeIcon(currentTheme);

  darkModeToggle.addEventListener('click', function () {
    const newTheme =
      htmlElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
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

  // Modal cleanup on hide
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('hidden.bs.modal', function () {
      resetModalState(this);
    });
  });
}

function resetModalState(modalElement) {
  const requirementsContainers = modalElement.querySelectorAll(
    '.password-requirements-container'
  );
  requirementsContainers.forEach((container) => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const errorMessages = modalElement.querySelectorAll(
    '.validation-error-message'
  );
  errorMessages.forEach((msg) => {
    if (msg && msg.parentNode) {
      msg.parentNode.removeChild(msg);
    }
  });

  const toggleButtons = modalElement.querySelectorAll('.password-toggle-btn');
  toggleButtons.forEach((button) => {
    if (button && button.parentNode) {
      button.parentNode.removeChild(button);
    }
  });

  const passwordFields = modalElement.querySelectorAll(
    'input[type="password"], input[name="password"]'
  );
  passwordFields.forEach((field) => {
    field.classList.remove('is-valid', 'is-invalid');
    field.setCustomValidity('');
    field.value = '';
  });

  const allInputFields = modalElement.querySelectorAll(
    'input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])'
  );
  allInputFields.forEach((field) => {
    field.classList.remove('is-valid', 'is-invalid');
    field.setCustomValidity('');
  });

  const forms = modalElement.querySelectorAll('form');
  forms.forEach((form) => {
    form.classList.remove('was-validated');
    form.reset();
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
