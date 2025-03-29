/**
 * Build Demo Script for EspWOL
 * Combines source files into demo version with simulated data
 */

const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const minify = require('html-minifier').minify;
const CleanCSS = require('clean-css');
const { minify: terserMinify } = require('terser');
const chalk = require('chalk');

// Paths
const SRC_DIR = path.join(__dirname, '../src');
const DEMO_DIR = path.join(__dirname, '../../demo');
const JS_DIR = path.join(SRC_DIR, 'js');

// Options
const htmlMinifyOptions = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  minifyJS: false,
  minifyCSS: false
};

// Ensure the demo directory exists
fs.ensureDirSync(DEMO_DIR);

/**
 * Combine all JS files into a single file
 */
async function combineJavaScript() {
  console.log(chalk.blue('📦 Combining JavaScript files...'));

  try {
    // Get all JS files
    const jsFiles = await glob('**/*.js', { cwd: JS_DIR });

    // Read all JS files
    let combinedJs = '';
    for (const file of jsFiles) {
      const content = await fs.readFile(path.join(JS_DIR, file), 'utf8');
      combinedJs += `// ${file}\n${content}\n\n`;
    }

    // Add data simulation code for demo
    const dataSimulationCode = `
// Data simulation for demo
let hosts = [
  {
    name: 'Server',
    mac: '76:14:22:af:23:46',
    ip: '192.168.1.101',
    periodicPing: 0,
    lastPing: -1
  },
  {
    name: 'PC',
    mac: '76:14:22:af:23:46',
    ip: '192.168.1.102',
    periodicPing: 3600,
    lastPing: 1000
  }
];

const simulatedData = {
  about: {
    version: '2.0.0',
    lastVersion: '2.1.0',
    notesLastVersion:
      'Add DNS field to network configuration and fix update functionality to the latest version. Enhance UI user experience.',
    hostname: 'demo-host'
  },
  networkSettings: {
    enable: true,
    ip: '192.168.1.100',
    networkMask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: '8.8.8.8'
  },
  authenticationSettings: {
    enable: true,
    username: 'admin',
    password: 'password123'
  }
};

// Override fetch for demo mode
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
  console.log('Demo mode: intercepting fetch to', url);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  // Handle different endpoints
  if (url === '/hosts' && options.method === 'GET') {
    return new Response(JSON.stringify(hosts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/hosts' && options.method === 'POST') {
    const body = JSON.parse(options.body);
    hosts.push({...body, lastPing: -1});
    return new Response(JSON.stringify({ success: true, message: 'Host added successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.startsWith('/hosts?id=') && options.method === 'GET') {
    const id = parseInt(url.split('=')[1]);
    return new Response(JSON.stringify(hosts[id]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.startsWith('/hosts?id=') && options.method === 'PUT') {
    const id = parseInt(url.split('=')[1]);
    const body = JSON.parse(options.body);
    hosts[id] = {...body, lastPing: hosts[id].lastPing};
    return new Response(JSON.stringify({ success: true, message: 'Host updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.startsWith('/hosts?id=') && options.method === 'DELETE') {
    const id = parseInt(url.split('=')[1]);
    hosts.splice(id, 1);
    return new Response(JSON.stringify({ success: true, message: 'Host deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.startsWith('/ping')) {
    const id = parseInt(url.split('=')[1]);
    const success = Math.random() > 0.3;
    if (success) {
      hosts[id].lastPing = Date.now();
    }
    return new Response(JSON.stringify({ 
      success, 
      message: success ? 'Ping successful' : 'Ping failed' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.startsWith('/wake')) {
    const success = Math.random() > 0.2;
    return new Response(JSON.stringify({ 
      success, 
      message: success ? 'WOL packet sent successfully' : 'Failed to send WOL packet' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/about') {
    return new Response(JSON.stringify(simulatedData.about), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/updateVersion' && options.method === 'GET') {
    return new Response(JSON.stringify({
      version: simulatedData.about.version,
      lastVersion: simulatedData.about.lastVersion,
      notesLastVersion: simulatedData.about.notesLastVersion
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/updateVersion' && options.method === 'POST') {
    const hasUpdate = simulatedData.about.version !== simulatedData.about.lastVersion;
    return new Response(JSON.stringify({
      success: hasUpdate,
      message: hasUpdate ? 'Update process will start in 1 second. Please wait for the update to complete.' : 'Nothing to upgrade. You are up to date!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/networkSettings' && options.method === 'GET') {
    return new Response(JSON.stringify(simulatedData.networkSettings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/networkSettings' && options.method === 'PUT') {
    const body = JSON.parse(options.body);
    simulatedData.networkSettings = {...body};
    return new Response(JSON.stringify({ success: true, message: 'Network settings updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/authenticationSettings' && options.method === 'GET') {
    return new Response(JSON.stringify({
      enable: simulatedData.authenticationSettings.enable,
      username: simulatedData.authenticationSettings.username
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/authenticationSettings' && options.method === 'PUT') {
    const body = JSON.parse(options.body);
    simulatedData.authenticationSettings = {...body};
    return new Response(JSON.stringify({ success: true, message: 'Authentication settings updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/resetWifi') {
    return new Response(JSON.stringify({ success: true, message: 'WiFi settings have been reset successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/import') {
    const newHosts = JSON.parse(options.body);
    hosts.push(...newHosts);
    return new Response(JSON.stringify({ 
      success: true, 
      message: \`Imported \${newHosts.length} hosts successfully.\` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fallback to original fetch for any unhandled requests
  return originalFetch(url, options);
};
`;

    // Write combined JS to output
    await fs.writeFile(
      path.join(DEMO_DIR, 'logic.js'),
      dataSimulationCode + combinedJs
    );
    console.log(chalk.green('✅ JavaScript files combined successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Error combining JavaScript files:'), error);
    process.exit(1);
  }
}

/**
 * Process CSS files
 */
async function processCSS() {
  console.log(chalk.blue('🎨 Processing CSS...'));

  try {
    const cssDir = path.join(SRC_DIR, 'css');
    const cssFiles = await glob('**/*.css', { cwd: cssDir });

    let combinedCss = '';
    for (const file of cssFiles) {
      const content = await fs.readFile(path.join(cssDir, file), 'utf8');
      combinedCss += `/* ${file} */\n${content}\n\n`;
    }

    await fs.writeFile(path.join(DEMO_DIR, 'style.css'), combinedCss);
    console.log(chalk.green('✅ CSS files processed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Error processing CSS:'), error);
    process.exit(1);
  }
}

/**
 * Process HTML files
 */
async function processHTML() {
  console.log(chalk.blue('🔍 Processing HTML files...'));

  try {
    // Process index.html
    let indexHtml = await fs.readFile(path.join(SRC_DIR, 'index.html'), 'utf8');

    // Replace external JS/CSS references with inline ones
    indexHtml = indexHtml.replace(
      /<link rel="stylesheet" href="css\/style.css">/,
      '<link rel="stylesheet" href="style.css">'
    );

    indexHtml = indexHtml.replace(
      /<script src="js\/.*?\.js"><\/script>/g,
      '<script src="logic.js"></script>'
    );

    // Write processed HTML
    await fs.writeFile(path.join(DEMO_DIR, 'index.html'), indexHtml);

    // Process 404.html
    if (await fs.pathExists(path.join(SRC_DIR, '404.html'))) {
      const notFoundHtml = await fs.readFile(
        path.join(SRC_DIR, '404.html'),
        'utf8'
      );
      await fs.writeFile(path.join(DEMO_DIR, '404.html'), notFoundHtml);
    }

    console.log(chalk.green('✅ HTML files processed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Error processing HTML:'), error);
    process.exit(1);
  }
}

/**
 * Generate Top Loading Effect Script
 */
async function generateTopLoadingScript() {
  console.log(chalk.blue('🚀 Generating top-loading.js...'));

  try {
    const topLoadingJs = `/**
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
    style.textContent = \`
      .top-loading-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: \${config.barHeight};
        z-index: 10000;
        overflow: hidden;
        background-color: \${config.barBackground};
        opacity: 1;
        transition: opacity \${config.transitionDuration} ease;
      }

      .top-loading-bar {
        position: absolute;
        width: 50%;
        height: 100%;
        background-color: \${config.barColor};
        animation: top-loading-animation \${config.animationDuration} infinite ease-in-out;
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
    \`;
    document.head.appendChild(style);
  })();

  // Creates and shows the loading bar
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

  // Removes the loading bar with a transition
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

  // Saves the original state of a button before modification
  function saveButtonState(button) {
    if (!button || buttonOriginalStates.has(button)) return;
    
    buttonOriginalStates.set(button, {
      html: button.innerHTML,
      disabled: button.hasAttribute('disabled'),
      classes: [...button.classList]
    });
  }

  // Sets a button to loading state
  function setButtonLoading(button) {
    if (!button) return;
    
    saveButtonState(button);
    button.classList.add('top-loading-disabled');
    button.setAttribute('disabled', '');
    
    if (button.classList.contains('dropdown-item')) {
      const icon = button.querySelector('i');
      if (icon) {
        const iconHtml = icon.outerHTML;
        button.innerHTML = \`\${iconHtml} <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>\`;
      } else {
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
      }
    } else {
      button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    }
  }

  // Restores a button to its original state
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

  // Gets a button element from a selector
  function getButton(selector) {
    if (!selector) return null;
    return typeof selector === 'string' ? document.querySelector(selector) : selector;
  }

  // Find dropdown buttons related to an action
  function findRelatedDropdownButtons(action) {
    return Array.from(
      document.querySelectorAll(\`.dropdown-item[onclick*="\${action}"]\`)
    );
  }

  // Shows the loading bar and sets buttons to loading state
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
        
        const dropdownMenu = button.closest('.dropdown-menu');
        if (dropdownMenu) {
          const dropdownToggle = document.querySelector('[data-bs-toggle="dropdown"][aria-expanded="true"]');
          if (dropdownToggle) {
            const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownToggle);
            if (dropdownInstance) {
              dropdownInstance.hide();
            }
          }
        }
      }
    });
    
    return { buttons, id: activeLoading };
  }

  // Hides loading and restores buttons
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

  // Overrides an existing function
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

  // Wraps a function with loading indicator
  function wrapWithLoading(fn, buttonSelector, delay = 0) {
    return function() {
      const mainButton = getButton(buttonSelector(arguments));
      
      const dropdownButtons = findRelatedDropdownButtons(fn.name);
      
      const allButtons = [mainButton, ...dropdownButtons].filter(Boolean);
      
      const loadingContext = showLoading(allButtons);
      
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

  // Wraps an async operation with loading indicator
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
        buttonFn: (args) => \`#ping-button-\${args[0]}\`, 
        delay: 2000 
      },
      { 
        name: 'editHost', 
        buttonFn: (args) => \`#edit-button-\${args[0]}\`, 
        delay: 1000 
      },
      { 
        name: 'wakeHost', 
        buttonFn: (args) => \`#wake-button-\${args[0]}\`, 
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
      },
      { 
        name: 'updateNetworkSettings', 
        buttonFn: () => '#updateNetworkSettingsButton', 
        delay: 500 
      },
      { 
        name: 'updateAuthentication', 
        buttonFn: () => '#updateAuthenticationButton', 
        delay: 500 
      },
      { 
        name: 'resetWiFiSettings', 
        buttonFn: () => '#reset-wifi-button', 
        delay: 500 
      },
      { 
        name: 'exportDatabase2CSV', 
        buttonFn: () => '#exportButton', 
        delay: 500 
      },
      { 
        name: 'importDatabaseFromCSV', 
        buttonFn: () => '#importButton', 
        delay: 1000 
      },
      { 
        name: 'updateToLastVersion', 
        buttonFn: () => '#button-update-version', 
        delay: 1000 
      },
      { 
        name: 'getUpdateVersion', 
        buttonFn: () => '#version', 
        delay: 500 
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
})();`;

    await fs.writeFile(path.join(DEMO_DIR, 'top-loading.js'), topLoadingJs);
    console.log(chalk.green('✅ top-loading.js generated successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Error generating top-loading.js:'), error);
    process.exit(1);
  }
}

/**
 * Main build function
 */
async function build() {
  console.log(chalk.bold.cyan('🔨 Building Demo Version'));

  try {
    // Clean demo directory
    await fs.emptyDir(DEMO_DIR);

    // Process all file types in parallel
    await Promise.all([
      combineJavaScript(),
      processCSS(),
      processHTML(),
      generateTopLoadingScript()
    ]);

    console.log(chalk.bold.green('✨ Demo build completed successfully!'));
  } catch (error) {
    console.error(chalk.bold.red('💥 Build failed:'), error);
    process.exit(1);
  }
}

// Run the build
build();
