/**
 * TopLoading - Minimal top bar loading animation
 * Lightweight, efficient loading indicator for web applications
 * 
 * Features:
 * - Animated top loading bar
 * - Button state management
 * - Compatible with existing loading logic
 * - No dependencies
 */

(function() {
  // Configuration
  const config = {
    barHeight: '3px',
    barColor: 'white',
    barBackground: '#222',
    animationDuration: '1.5s',
    transitionDuration: '0.3s',
    minDisplayTime: 500
  };

  // State tracking
  let activeLoading = 0;
  let loadingBar = null;
  let loadingBarContainer = null;
  const buttonOriginalStates = new Map();
  const timeouts = new Set();

  // Create and inject CSS
  (function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .top-loading-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: ${config.barHeight};
        z-index: 10000;
        overflow: hidden;
        background-color: ${config.barBackground};
        opacity: 1;
        transition: opacity ${config.transitionDuration} ease;
      }

      .top-loading-bar {
        position: absolute;
        width: 50%;
        height: 100%;
        background-color: ${config.barColor};
        animation: top-loading-animation ${config.animationDuration} infinite ease-in-out;
      }

      @keyframes top-loading-animation {
        0% { left: -50%; }
        100% { left: 100%; }
      }

      .top-loading-disabled {
        pointer-events: none;
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      body.top-loading l-bouncy {
        display: none !important;
      }
      
      body.top-loading.blurred main {
        filter: none !important;
      }
    `;
    document.head.appendChild(style);
  })();

  /**
   * Creates and shows the loading bar
   * @private
   */
  function createLoadingBar() {
    if (loadingBarContainer) return;
    
    loadingBarContainer = document.createElement('div');
    loadingBarContainer.className = 'top-loading-container';
    
    loadingBar = document.createElement('div');
    loadingBar.className = 'top-loading-bar';
    
    loadingBarContainer.appendChild(loadingBar);
    document.body.appendChild(loadingBarContainer);
    document.body.classList.add('top-loading');
  }

  /**
   * Removes the loading bar with a transition
   * @private
   */
  function removeLoadingBar() {
    if (!loadingBarContainer) return;
    
    loadingBarContainer.style.opacity = '0';
    
    const timeout = setTimeout(() => {
      if (loadingBarContainer && loadingBarContainer.parentNode) {
        loadingBarContainer.parentNode.removeChild(loadingBarContainer);
        loadingBarContainer = null;
        loadingBar = null;
      }
      document.body.classList.remove('top-loading');
      timeouts.delete(timeout);
    }, parseInt(config.transitionDuration) * 1000);
    
    timeouts.add(timeout);
  }

  /**
   * Saves the original state of a button before modification
   * @private
   * @param {HTMLElement} button - The button element
   */
  function saveButtonState(button) {
    if (!button || buttonOriginalStates.has(button)) return;
    
    buttonOriginalStates.set(button, {
      html: button.innerHTML,
      disabled: button.hasAttribute('disabled'),
      classes: [...button.classList]
    });
  }

  /**
   * Sets a button to loading state
   * @private
   * @param {HTMLElement} button - The button element
   */
  function setButtonLoading(button) {
    if (!button) return;
    
    saveButtonState(button);
    button.classList.add('top-loading-disabled');
    button.setAttribute('disabled', '');
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
  }

  /**
   * Restores a button to its original state
   * @private
   * @param {HTMLElement} button - The button element
   * @param {string} [newHtml] - Optional new HTML content
   */
  function restoreButton(button, newHtml) {
    if (!button) return;
    
    if (buttonOriginalStates.has(button)) {
      const originalState = buttonOriginalStates.get(button);
      
      // Restore classes
      button.className = originalState.classes.join(' ');
      
      // Restore HTML or set new HTML
      button.innerHTML = newHtml || originalState.html;
      
      // Restore disabled state
      if (!originalState.disabled) {
        button.removeAttribute('disabled');
      }
      
      buttonOriginalStates.delete(button);
    } else {
      // Fallback if state wasn't saved
      button.innerHTML = newHtml || button.innerHTML;
      button.removeAttribute('disabled');
      button.classList.remove('top-loading-disabled');
    }
  }

  /**
   * Gets a button element from a selector
   * @private
   * @param {string|HTMLElement} selector - Button selector or element
   * @returns {HTMLElement|null} - The button element or null
   */
  function getButton(selector) {
    if (!selector) return null;
    return typeof selector === 'string' ? document.querySelector(selector) : selector;
  }

  /**
   * Shows the loading bar and sets buttons to loading state
   * @param {Array} buttonSelectors - Selectors or elements of buttons to disable
   * @returns {Object} Loading context
   */
  function showLoading(buttonSelectors = []) {
    activeLoading++;
    createLoadingBar();
    
    const buttons = [];
    
    // Process all button selectors
    buttonSelectors.forEach(selector => {
      const button = getButton(selector);
      if (button) {
        setButtonLoading(button);
        buttons.push(button);
      }
    });
    
    return { buttons, id: activeLoading };
  }

  /**
   * Hides loading and restores buttons
   * @param {Object} loadingContext - Context returned from showLoading
   */
  function hideLoading(loadingContext) {
    if (!loadingContext) return;
    
    const { buttons } = loadingContext;
    
    // Always restore buttons
    buttons.forEach(button => restoreButton(button));
    
    // Decrease active loading counter
    activeLoading--;
    
    // Only remove loading bar if all operations finished
    if (activeLoading <= 0) {
      activeLoading = 0;
      removeLoadingBar();
    }
  }

  /**
   * Overrides an existing function
   * @private
   * @param {string} name - Function name
   * @param {Function} newFunction - New implementation
   * @returns {boolean} Success
   */
  function overrideFunction(name, newFunction) {
    if (typeof window[name] !== 'function') return false;
    
    // Store original function
    const original = window[name];
    
    // Replace with new function
    window[name] = newFunction;
    
    // Store reference to original for calling
    window[name].original = original;
    
    return true;
  }

  /**
   * Wraps a function with loading indicator
   * @private
   * @param {Function} fn - Function to wrap
   * @param {Function} buttonSelector - Function that returns button selector
   * @param {number} delay - Minimum delay before hiding loading
   * @returns {Function} Wrapped function
   */
  function wrapWithLoading(fn, buttonSelector, delay = 0) {
    return function() {
      const button = getButton(buttonSelector(arguments));
      const loadingContext = showLoading([button]);
      
      try {
        const result = fn.apply(this, arguments);
        
        if (result instanceof Promise) {
          return result.finally(() => {
            setTimeout(() => hideLoading(loadingContext), delay);
          });
        } else {
          setTimeout(() => hideLoading(loadingContext), delay);
          return result;
        }
      } catch (error) {
        hideLoading(loadingContext);
        throw error;
      }
    };
  }

  /**
   * Wraps an async operation with loading indicator
   * @param {Function} asyncFn - Async function to execute
   * @param {Array} buttonSelectors - Button selectors to disable
   * @param {number} minDuration - Minimum loading duration in ms
   * @returns {Promise} Result of the async function
   */
  async function withLoading(asyncFn, buttonSelectors = [], minDuration = config.minDisplayTime) {
    const loadingContext = showLoading(buttonSelectors);
    const startTime = Date.now();
    
    try {
      const result = await asyncFn();
      
      // Ensure minimum duration
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      return result;
    } finally {
      hideLoading(loadingContext);
    }
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Override loader functions
    overrideFunction('enableLoaderWithBlur', function() {
      showLoading([]);
      document.body.classList.add('blurred');
    });
    
    overrideFunction('disabledLoaderWithBlur', function(loader) {
      hideLoading({ buttons: [] });
      
      setTimeout(() => {
        document.body.classList.remove('blurred');
        if (loader) loader.remove();
      }, parseInt(config.transitionDuration) * 1000);
    });
    
    overrideFunction('enableLoaderButton', function(button) {
      setButtonLoading(button);
    });
    
    overrideFunction('disabledLoaderButton', function(button, html) {
      restoreButton(button, html);
    });
    
    // Override action functions
    const functionsToWrap = [
      { 
        name: 'getSettings', 
        buttonFn: () => '#settings-button', 
        delay: 1000 
      },
      { 
        name: 'pingHost', 
        buttonFn: (args) => `#ping-button-${args[0]}`, 
        delay: 2000 
      },
      { 
        name: 'editHost', 
        buttonFn: (args) => `#edit-button-${args[0]}`, 
        delay: 1000 
      },
      { 
        name: 'wakeHost', 
        buttonFn: (args) => `#wake-button-${args[0]}`, 
        delay: 500 
      },
      { 
        name: 'addHost', 
        buttonFn: () => '#add-button', 
        delay: 1000 
      },
      { 
        name: 'saveEditHost', 
        buttonFn: () => '#save-button', 
        delay: 1000 
      },
      { 
        name: 'confirmDelete', 
        buttonFn: () => '#delete-button', 
        delay: 1000 
      }
    ];
    
    functionsToWrap.forEach(({ name, buttonFn, delay }) => {
      if (typeof window[name] === 'function') {
        window[name] = wrapWithLoading(window[name], buttonFn, delay);
      }
    });
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', function() {
    if (loadingBarContainer && loadingBarContainer.parentNode) {
      loadingBarContainer.parentNode.removeChild(loadingBarContainer);
    }
    
    timeouts.forEach(timeout => clearTimeout(timeout));
    timeouts.clear();
    buttonOriginalStates.clear();
    
    document.body.classList.remove('top-loading', 'blurred');
  });

  // Export public API
  window.TopLoading = {
    show: showLoading,
    hide: hideLoading,
    withLoading: withLoading,
    config: config
  };
})();