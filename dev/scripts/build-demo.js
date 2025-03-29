/**
 * Build Demo Script for EspWOL
 * Copies source files and adds mock data for demo version
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Paths
const SRC_DIR = path.join(__dirname, '../src');
const DEMO_DIR = path.join(__dirname, '../../demo'); // Ruta corregida

// Ensure the demo directory exists
fs.ensureDirSync(DEMO_DIR);

/**
 * Main build function
 */
async function build() {
  console.log(chalk.bold.cyan('🔨 Building Demo Version'));

  try {
    // Clean and copy src to demo
    console.log(chalk.blue('📂 Copying source files to demo directory...'));
    await fs.emptyDir(DEMO_DIR);
    await fs.copy(SRC_DIR, DEMO_DIR);
    console.log(chalk.green('✅ Files copied successfully'));

    // Inject mock data code
    console.log(chalk.blue('💉 Injecting mock data for demo...'));
    const apiPath = path.join(DEMO_DIR, 'js/api.js');
    let apiContent = await fs.readFile(apiPath, 'utf8');

    // Add mock data at the beginning of api.js
    const mockDataCode = `// DEMO MODE - Mock data
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

// Override fetch for demo mode - must be placed before other code
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
  console.log('Demo mode: intercepting fetch to', url);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  // Handle different endpoints
  if (url === '/hosts' && (!options.method || options.method === 'GET')) {
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
  
  if (url.startsWith('/hosts?id=') && (!options.method || options.method === 'GET')) {
    const id = parseInt(url.split('=')[1]);
    if (id >= 0 && id < hosts.length) {
      const host = { ...hosts[id] };
      if (host.lastPing !== -1) {
        host.lastPing = Math.floor((Date.now() - host.lastPing) / 1000);
      }
      return new Response(JSON.stringify(host), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ success: false, message: 'Host not found' }), {
      status: 400,
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
  
  if (url === '/updateVersion' && (!options.method || options.method === 'GET')) {
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
  
  if (url === '/networkSettings' && (!options.method || options.method === 'GET')) {
    return new Response(JSON.stringify(simulatedData.networkSettings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/networkSettings' && options.method === 'PUT') {
    const body = JSON.parse(options.body);
    Object.assign(simulatedData.networkSettings, body);
    return new Response(JSON.stringify({ success: true, message: 'Network settings updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url === '/authenticationSettings' && (!options.method || options.method === 'GET')) {
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
    Object.assign(simulatedData.authenticationSettings, body);
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

  console.log('Unhandled request in demo mode:', url);
  return new Response(JSON.stringify({ success: false, message: 'Endpoint not simulated in demo mode' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
};

// End of demo mode injection
`;

    // Inject at the beginning
    apiContent = mockDataCode + apiContent;
    await fs.writeFile(apiPath, apiContent);

    console.log(chalk.bold.green('✨ Demo build completed successfully!'));
  } catch (error) {
    console.error(chalk.bold.red('💥 Build failed:'), error);
    process.exit(1);
  }
}

// Run the build
build();