/**
 * Global configuration for EspWOL
 * Centralized configuration and shared state for the entire application
 */

// Global namespace for the application
window.EspWOL = {
  // Application state
  state: {
    hosts: [],
    settings: {
      network: {},
      authentication: {},
      about: {}
    },
    isDarkMode: false,
    isLoading: false
  },
  
  // Configuration constants
  config: {
    apiEndpoints: {
      hosts: '/hosts',
      ping: '/ping',
      wake: '/wake',
      about: '/about',
      networkSettings: '/networkSettings',
      authenticationSettings: '/authenticationSettings',
      updateVersion: '/updateVersion',
      resetWifi: '/resetWifi',
      import: '/import'
    },
    
    // UI configuration
    ui: {
      loaderMinTime: 500,
      toastDuration: 5000,
      pingAnimationDuration: 10000
    },
    
    // Debug configuration
    debug: {
      enabled: true,
      logApiCalls: true,
      logStateChanges: true
    }
  },
  
  // Custom events for inter-module communication
  events: {
    // Emit custom event
    emit: function(eventName, detail = {}) {
      if (window.EspWOL.config.debug.enabled) {
        console.log(`Event emitted: ${eventName}`, detail);
      }
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
    },
    
    // Subscribe to custom event
    on: function(eventName, callback) {
      document.addEventListener(eventName, callback);
    },
    
    // Remove event listener
    off: function(eventName, callback) {
      document.removeEventListener(eventName, callback);
    },
    
    // Event name constants
    HOSTS_UPDATED: 'espwol:hosts-updated',
    HOST_ADDED: 'espwol:host-added',
    HOST_UPDATED: 'espwol:host-updated',
    HOST_DELETED: 'espwol:host-deleted',
    THEME_CHANGED: 'espwol:theme-changed',
    LOADING_STARTED: 'espwol:loading-started',
    LOADING_FINISHED: 'espwol:loading-finished'
  },
  
  // Global utility functions
  utils: {
    // Format time 
    formatTime: function(seconds) {
      if (seconds < 60) return `${seconds} sec`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
      return `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} min`;
    },
    
    // Validate MAC address
    isValidMac: function(mac) {
      if (!mac || typeof mac !== 'string') return false;
      mac = mac.trim();
      return /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(mac);
    },
    
    // Validate IP address
    isValidIp: function(ip) {
      if (!ip || typeof ip !== 'string') return false;
      ip = ip.trim();
      return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
    },
    
    // Sleep function for async operations
    sleep: function(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Debug logging function
    log: function(message, data) {
      if (window.EspWOL.config.debug.enabled) {
        console.log(`[EspWOL] ${message}`, data || '');
      }
    }
  },
  
  // Version information
  version: {
    current: window.ESP_VERSION || '2.3.1',
    buildDate: window.ESP_BUILD_DATE || new Date().toISOString().split('T')[0]
  }
};

// Global variables for quick access (for backward compatibility)
const state = window.EspWOL.state;
const config = window.EspWOL.config;
const events = window.EspWOL.events;
const utils = window.EspWOL.utils;

// Print information message in console
console.log('%c EspWOL %c v' + window.EspWOL.version.current + ' ',
  'background: #007bff; color: white; font-weight: bold; border-radius: 3px 0 0 3px; padding: 2px 6px;',
  'background: #6c757d; color: white; font-weight: bold; border-radius: 0 3px 3px 0; padding: 2px 6px;'
);