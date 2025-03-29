/**
 * Infinite Top Loading Bar Implementation
 * A continuous loading animation at the top of the page
 * Replaces circular loading animation and properly resets buttons
 */

// Create and inject the CSS
(function createLoadingStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Top loading bar container */
    .top-loading-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 10000;
      overflow: hidden;
      background-color: #222;
    }

    /* The animated loading bar */
    .top-loading-bar {
      position: absolute;
      width: 50%;
      height: 100%;
      background-color: white;
      animation: loading-animation 1.5s infinite ease-in-out;
    }

    /* The loading animation */
    @keyframes loading-animation {
      0% {
        left: -50%;
      }
      100% {
        left: 100%;
      }
    }

    /* Button disabled state */
    .fetch-disabled {
      pointer-events: none;
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    /* Hide original loader when our top loader is active */
    body.top-loading l-bouncy {
      display: none !important;
    }
    
    /* Prevent blur effect when our top loader is active */
    body.top-loading.blurred main {
      filter: none !important;
    }
  `;
  document.head.appendChild(style);
})();

// Global tracking variables
let activeLoadingCount = 0;
let loadingBarContainer = null;
let buttonStates = new Map(); // Store original button states

/**
 * Shows the top loading bar and disables buttons
 * @param {Array} buttonSelectors - Array of selectors for buttons to disable
 * @return {Object} Loading elements for cleanup
 */
function showTopLoadingBar(buttonSelectors = []) {
  activeLoadingCount++;
  
  // Create loading bar if needed
  if (!loadingBarContainer) {
    loadingBarContainer = document.createElement('div');
    loadingBarContainer.id = 'top-loading-container';
    loadingBarContainer.className = 'top-loading-container';
    
    const loadingBar = document.createElement('div');
    loadingBar.id = 'top-loading-bar';
    loadingBar.className = 'top-loading-bar';
    
    loadingBarContainer.appendChild(loadingBar);
    document.body.appendChild(loadingBarContainer);
    document.body.classList.add('top-loading');
  }

  // Process and disable buttons
  const disabledButtons = [];
  buttonSelectors.forEach(selector => {
    let button;
    if (typeof selector === 'string') {
      button = document.querySelector(selector);
    } else {
      button = selector;
    }
    
    if (button) {
      // Save original state if not already saved
      if (!buttonStates.has(button)) {
        buttonStates.set(button, {
          html: button.innerHTML,
          disabled: button.hasAttribute('disabled')
        });
      }
      
      // Disable and add spinner
      button.classList.add('fetch-disabled');
      button.setAttribute('disabled', '');
      button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
      disabledButtons.push(button);
    }
  });

  return {
    buttons: disabledButtons,
    id: activeLoadingCount
  };
}

/**
 * Hides the top loading bar and re-enables buttons
 * @param {Object} loadingElements - Object returned by showTopLoadingBar
 */
function hideTopLoadingBar(loadingElements) {
  if (!loadingElements) return;
  
  const { buttons, id } = loadingElements;
  
  // Always restore buttons to original state
  buttons.forEach(button => {
    if (buttonStates.has(button)) {
      const originalState = buttonStates.get(button);
      button.innerHTML = originalState.html;
      
      if (!originalState.disabled) {
        button.removeAttribute('disabled');
      }
      
      button.classList.remove('fetch-disabled');
      buttonStates.delete(button); // Clean up the stored state
    }
  });
  
  // Decrement active count
  activeLoadingCount--;
  
  // Only remove loading bar if all operations finished
  if (activeLoadingCount <= 0) {
    activeLoadingCount = 0;
    
    if (loadingBarContainer) {
      loadingBarContainer.style.transition = 'opacity 0.3s ease';
      loadingBarContainer.style.opacity = '0';
      
      setTimeout(() => {
        if (loadingBarContainer && loadingBarContainer.parentNode) {
          loadingBarContainer.parentNode.removeChild(loadingBarContainer);
          loadingBarContainer = null;
        }
        document.body.classList.remove('top-loading');
      }, 300);
    }
  }
}

// Store references to the original functions
const originalFunctions = {};

// Helper to safely override a function
function overrideFunction(name, newFn) {
  if (typeof window[name] === 'function') {
    originalFunctions[name] = window[name];
    window[name] = newFn;
    return true;
  }
  return false;
}

// Override the existing loader functions
document.addEventListener('DOMContentLoaded', function() {
  
  // Override enableLoaderWithBlur
  overrideFunction('enableLoaderWithBlur', function() {
    showTopLoadingBar([]);
    document.body.classList.add('blurred');
  });
  
  // Override disabledLoaderWithBlur
  overrideFunction('disabledLoaderWithBlur', function(loader) {
    hideTopLoadingBar({buttons: [], id: activeLoadingCount});
    
    setTimeout(() => {
      document.body.classList.remove('blurred');
      if (loader) loader.remove();
    }, 300);
  });
  
  // Override enableLoaderButton
  overrideFunction('enableLoaderButton', function(button) {
    if (!buttonStates.has(button)) {
      buttonStates.set(button, {
        html: button.innerHTML,
        disabled: button.hasAttribute('disabled')
      });
    }
    
    button.setAttribute('disabled', '');
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
    button.classList.add('fetch-disabled');
  });
  
  // Override disabledLoaderButton
  overrideFunction('disabledLoaderButton', function(button, html) {
    if (buttonStates.has(button)) {
      const originalState = buttonStates.get(button);
      button.innerHTML = html || originalState.html;
      
      if (!originalState.disabled) {
        button.removeAttribute('disabled');
      }
      
      button.classList.remove('fetch-disabled');
      buttonStates.delete(button);
    } else {
      button.innerHTML = html;
      button.removeAttribute('disabled');
      button.classList.remove('fetch-disabled');
    }
  });
  
  // -------------------------------------------
  // Override main functions that use loading
  // -------------------------------------------
  
  // Override getSettings
  if (typeof window.getSettings === 'function') {
    originalFunctions.getSettings = window.getSettings;
    
    window.getSettings = function() {
      const button = document.querySelector('#settings-button');
      const loadingElements = showTopLoadingBar([button]);
      
      try {
        return originalFunctions.getSettings.apply(this, arguments);
      } finally {
        setTimeout(() => {
          hideTopLoadingBar(loadingElements);
        }, 1000);
      }
    };
  }
  
  // Override pingHost
  if (typeof window.pingHost === 'function') {
    originalFunctions.pingHost = window.pingHost;
    
    window.pingHost = function(index) {
      const button = document.querySelector(`#ping-button-${index}`);
      const loadingElements = showTopLoadingBar([button]);
      
      try {
        return originalFunctions.pingHost.apply(this, arguments);
      } finally {
        setTimeout(() => {
          hideTopLoadingBar(loadingElements);
        }, 2000);
      }
    };
  }
  
  // Override editHost
  if (typeof window.editHost === 'function') {
    originalFunctions.editHost = window.editHost;
    
    window.editHost = function(index) {
      const button = document.querySelector(`#edit-button-${index}`);
      const loadingElements = showTopLoadingBar([button]);
      
      try {
        return originalFunctions.editHost.apply(this, arguments);
      } finally {
        setTimeout(() => {
          hideTopLoadingBar(loadingElements);
        }, 1000);
      }
    };
  }
  
  // Override wakeHost
  if (typeof window.wakeHost === 'function') {
    originalFunctions.wakeHost = window.wakeHost;
    
    window.wakeHost = function(index) {
      const button = document.querySelector(`#wake-button-${index}`);
      const loadingElements = showTopLoadingBar([button]);
      
      try {
        return originalFunctions.wakeHost.apply(this, arguments);
      } finally {
        setTimeout(() => {
          hideTopLoadingBar(loadingElements);
        }, 500);
      }
    };
  }
  
  // Override addHost
  if (typeof window.addHost === 'function') {
    originalFunctions.addHost = window.addHost;
    
    window.addHost = async function() {
      const button = document.querySelector('#add-button');
      const loadingElements = showTopLoadingBar([button]);
      
      try {
        return await originalFunctions.addHost.apply(this, arguments);
      } finally {
        setTimeout(() => {
          hideTopLoadingBar(loadingElements);
        }, 1000);
      }
    };
  }
  
  // Override saveEditHost
  if (typeof window.saveEditHost === 'function') {
    originalFunctions.saveEditHost = window.saveEditHost;
    
    window.saveEditHost = async function() {
      const button = document.querySelector('#save-button');
      const loadingElements = showTopLoadingBar([button]);
      
      try {
        return await originalFunctions.saveEditHost.apply(this, arguments);
      } finally {
        setTimeout(() => {
          hideTopLoadingBar(loadingElements);
        }, 1000);
      }
    };
  }
});

// Utility function for wrapping async operations
async function withTopLoading(fetchFn, buttonSelectors = [], minDuration = 500) {
  const loadingElements = showTopLoadingBar(buttonSelectors);
  const startTime = Date.now();
  
  try {
    const result = await fetchFn();
    
    // Ensure minimum duration
    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) {
      await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
    }
    
    return result;
  } finally {
    hideTopLoadingBar(loadingElements);
  }
}

// Export functions to global scope
window.showTopLoadingBar = showTopLoadingBar;
window.hideTopLoadingBar = hideTopLoadingBar;
window.withTopLoading = withTopLoading;

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  if (loadingBarContainer && loadingBarContainer.parentNode) {
    loadingBarContainer.parentNode.removeChild(loadingBarContainer);
  }
  document.body.classList.remove('top-loading');
  buttonStates.clear();
});