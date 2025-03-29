/**
 * Infinite Top Loading Bar Implementation
 * A continuous loading animation at the top of the page
 */

// Create and inject the CSS for the infinite top loading bar
(function createInfiniteLoadingBarStyles() {
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
    `;
    document.head.appendChild(style);
  })();
  
  /**
   * Shows the infinite top loading bar and disables specified buttons
   * @param {Array} buttonSelectors - Array of selectors for buttons to disable
   * @return {Object} Loading elements for cleanup
   */
  function showTopLoadingBar(buttonSelectors = []) {
    // Create the loading bar container
    let loadingContainer = document.getElementById('top-loading-container');
    if (!loadingContainer) {
      loadingContainer = document.createElement('div');
      loadingContainer.id = 'top-loading-container';
      loadingContainer.className = 'top-loading-container';
      
      // Create the actual loading bar
      const loadingBar = document.createElement('div');
      loadingBar.id = 'top-loading-bar';
      loadingBar.className = 'top-loading-bar';
      
      loadingContainer.appendChild(loadingBar);
      document.body.appendChild(loadingContainer);
    }
  
    // Disable specified buttons
    const disabledButtons = [];
    buttonSelectors.forEach(selector => {
      const button = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
        
      if (button) {
        button.classList.add('fetch-disabled');
        button.setAttribute('data-original-html', button.innerHTML);
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        disabledButtons.push(button);
      }
    });
  
    return { 
      loadingContainer,
      disabledButtons 
    };
  }
  
  /**
   * Hides the infinite top loading bar and re-enables buttons
   * @param {Object} loadingElements - Object returned by showTopLoadingBar
   */
  function hideTopLoadingBar(loadingElements) {
    if (!loadingElements) return;
    
    const { loadingContainer, disabledButtons } = loadingElements;
    
    // Remove the loading container with a fade out effect
    if (loadingContainer) {
      loadingContainer.style.transition = 'opacity 0.3s ease';
      loadingContainer.style.opacity = '0';
      
      setTimeout(() => {
        if (loadingContainer.parentNode) {
          loadingContainer.parentNode.removeChild(loadingContainer);
        }
      }, 300);
    }
    
    // Re-enable all buttons
    disabledButtons.forEach(button => {
      button.classList.remove('fetch-disabled');
      const originalHTML = button.getAttribute('data-original-html');
      if (originalHTML) {
        button.innerHTML = originalHTML;
      }
    });
  }
  
  // Patch the existing functions to add loading bars
  document.addEventListener('DOMContentLoaded', function() {
    // Store original functions
    const originalFunctions = {
      getSettings: window.getSettings,
      pingHost: window.pingHost,
      editHost: window.editHost,
      wakeHost: window.wakeHost,
      confirmDelete: window.confirmDelete,
      updateNetworkSettings: window.updateNetworkSettings,
      updateAuthentication: window.updateAuthentication,
      resetWiFiSettings: window.resetWiFiSettings,
      addHost: window.addHost,
      saveEditHost: window.saveEditHost
    };
  
    // Override getSettings
    window.getSettings = function() {
      const loadingElements = showTopLoadingBar(['#settings-button']);
      
      if (originalFunctions.getSettings) {
        originalFunctions.getSettings();
      }
      
      setTimeout(() => {
        hideTopLoadingBar(loadingElements);
      }, 1000);
    };
  
    // Override pingHost
    window.pingHost = function(index) {
      const loadingElements = showTopLoadingBar([`#ping-button-${index}`]);
      
      if (originalFunctions.pingHost) {
        originalFunctions.pingHost(index);
      }
      
      setTimeout(() => {
        hideTopLoadingBar(loadingElements);
      }, 2000);
    };
  
    // Override editHost
    window.editHost = function(index) {
      const loadingElements = showTopLoadingBar([`#edit-button-${index}`]);
      
      if (originalFunctions.editHost) {
        originalFunctions.editHost(index);
      }
      
      setTimeout(() => {
        hideTopLoadingBar(loadingElements);
      }, 1000);
    };
  
    // Override wakeHost
    window.wakeHost = function(index) {
      const loadingElements = showTopLoadingBar([`#wake-button-${index}`]);
      
      if (originalFunctions.wakeHost) {
        originalFunctions.wakeHost(index);
      }
      
      setTimeout(() => {
        hideTopLoadingBar(loadingElements);
      }, 500);
    };
    
    // Override addHost
    window.addHost = async function() {
      const loadingElements = showTopLoadingBar(['#add-button']);
      
      if (originalFunctions.addHost) {
        await originalFunctions.addHost();
      }
      
      setTimeout(() => {
        hideTopLoadingBar(loadingElements);
      }, 1000);
    };
    
    // Override saveEditHost
    window.saveEditHost = async function() {
      const loadingElements = showTopLoadingBar(['#save-button']);
      
      if (originalFunctions.saveEditHost) {
        await originalFunctions.saveEditHost();
      }
      
      setTimeout(() => {
        hideTopLoadingBar(loadingElements);
      }, 1000);
    };
  });
  
  /**
   * Utility function to wrap fetch calls with loading bar
   * @param {Function} fetchFn - The function that performs the fetch operation
   * @param {Array} buttonSelectors - Buttons to disable during fetch
   * @param {Number} minDuration - Minimum duration to show loading (ms)
   * @return {Promise} Result of the fetch operation
   */
  async function withTopLoading(fetchFn, buttonSelectors = [], minDuration = 500) {
    const loadingElements = showTopLoadingBar(buttonSelectors);
    const startTime = Date.now();
    
    try {
      const result = await fetchFn();
      
      // Ensure loading shows for at least minDuration
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      return result;
    } finally {
      hideTopLoadingBar(loadingElements);
    }
  }
  
  // Export functions for use in other scripts
  window.showTopLoadingBar = showTopLoadingBar;
  window.hideTopLoadingBar = hideTopLoadingBar;
  window.withTopLoading = withTopLoading;