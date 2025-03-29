/**
 * Core functionality and initialization for EspWOL
 * Base functionality for the application.
 */

// Document Ready Handler
document.addEventListener('DOMContentLoaded', async function() {
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
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = localStorage.getItem('bsTheme') || (prefersDarkScheme ? 'dark' : 'light');

  htmlElement.setAttribute('data-bs-theme', currentTheme);
  updateThemeIcon(currentTheme);

  // Store in global state
  if (window.EspWOL) {
    window.EspWOL.state.isDarkMode = currentTheme === 'dark';
  }

  darkModeToggle.addEventListener('click', function() {
    const newTheme = htmlElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('bsTheme', newTheme);
    updateThemeIcon(newTheme);
    
    // Update global state
    if (window.EspWOL) {
      window.EspWOL.state.isDarkMode = newTheme === 'dark';
      window.EspWOL.events.emit(window.EspWOL.events.THEME_CHANGED, { theme: newTheme });
    }
  });
}

function updateThemeIcon(theme) {
  const darkModeIcon = document.getElementById('darkModeIcon');
  if (darkModeIcon) {
    darkModeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
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
    modal.addEventListener('hidden.bs.modal', function() {
      resetModalState(this);
    });
  });
}

function resetModalState(modalElement) {
  const requirementsContainers = modalElement.querySelectorAll('.password-requirements-container');
  requirementsContainers.forEach((container) => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const errorMessages = modalElement.querySelectorAll('.validation-error-message');
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

  const passwordFields = modalElement.querySelectorAll('input[type="password"], input[name="password"]');
  passwordFields.forEach((field) => {
    field.classList.remove('is-valid', 'is-invalid');
    field.setCustomValidity('');
    field.value = '';
  });

  const allInputFields = modalElement.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])');
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

// Initial Data Loading with Bootstrap placeholders instead of blur effect
async function loadInitialData() {
  try {
    // Show placeholders while loading
    showPlaceholders();
    
    // Load all hosts
    await getAllHost();
    
    // Hide placeholders
    hidePlaceholders();
  } catch (error) {
    console.error('Error loading initial data:', error);
    
    // Show error message
    showNotification('Failed to load application data. Please refresh the page.', 'danger', 'Error');
    
    // Hide placeholders even in case of error
    hidePlaceholders();
  }
}

// Show placeholder content during loading
function showPlaceholders() {
  const hostList = document.getElementById('host-list');
  if (!hostList) return;
  
  // Clear the list first
  hostList.innerHTML = '';
  
  // Add placeholder items
  for (let i = 0; i < 3; i++) {
    const placeholderItem = document.createElement('li');
    placeholderItem.className = 'list-group-item d-flex justify-content-between align-items-center placeholder-glow';
    
    placeholderItem.innerHTML = `
      <div class="d-flex align-items-center">
        <span class="placeholder rounded-circle me-2" style="width: 15px; height: 15px;"></span>
        <span class="placeholder col-4"></span>
        <span class="placeholder col-4 ms-2"></span>
      </div>
      <div>
        <span class="placeholder btn btn-info btn-sm me-2" style="width: 40px;"></span>
        <span class="placeholder btn btn-warning btn-sm me-2" style="width: 40px;"></span>
        <span class="placeholder btn btn-primary btn-sm" style="width: 40px;"></span>
      </div>
    `;
    
    hostList.appendChild(placeholderItem);
  }
}

// Hide placeholders when content is loaded
function hidePlaceholders() {
  const placeholders = document.querySelectorAll('.placeholder-glow');
  placeholders.forEach(placeholder => {
    // Fade out effect
    placeholder.style.opacity = '0';
    setTimeout(() => {
      // Remove if still in the DOM
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    }, 300);
  });
}