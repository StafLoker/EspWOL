/**
 * Development Server for EspWOL
 * Simulates the ESP8266 backend API for local development
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Mock data for development
let hosts = [
  {
    name: 'Main Server',
    mac: '76:14:22:af:23:46',
    ip: '192.168.1.101',
    periodicPing: 0,
    lastPing: -1
  },
  {
    name: 'Developer PC',
    mac: '76:14:22:af:23:47',
    ip: '192.168.1.102',
    periodicPing: 3600,
    lastPing: 1000
  }
];

const networkSettings = {
  enable: true,
  ip: '192.168.1.100',
  networkMask: '255.255.255.0',
  gateway: '192.168.1.1',
  dns: '8.8.8.8'
};

const authentication = {
  enable: true,
  username: 'admin',
  password: 'password123'
};

const about = {
  version: '2.3.1',
  lastVersion: '2.4.0',
  notesLastVersion: 'Added new validation features and UI improvements',
  hostname: 'espwol-dev'
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../src')));

// Serve JS and CSS directories separately
app.use('/js', express.static(path.join(__dirname, '../src/js')));
app.use('/css', express.static(path.join(__dirname, '../src/css')));

// API Routes
app.get('/hosts', (req, res) => {
  if (req.query.id !== undefined) {
    const id = parseInt(req.query.id);
    if (id >= 0 && id < hosts.length) {
      const host = { ...hosts[id] };
      if (host.lastPing !== -1) {
        host.lastPing = Math.floor((Date.now() - host.lastPing) / 1000);
      }
      return res.json(host);
    } else {
      return res.status(400).json({ success: false, message: 'Host not found' });
    }
  }
  res.json(hosts);
});

app.post('/hosts', (req, res) => {
  const { name, mac, ip, periodicPing } = req.body;
  
  // Validation
  if (!name || !mac || !ip) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  // MAC format validation
  if (!/^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
    return res.status(400).json({ success: false, message: 'Invalid MAC address' });
  }
  
  // IP format validation
  if (!/^(25[0-5]|2[0-4]\d|1\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d|[1-9]?\d)){3}$/.test(ip)) {
    return res.status(400).json({ success: false, message: 'Invalid IP address' });
  }
  
  hosts.push({
    name,
    mac,
    ip,
    periodicPing: parseInt(periodicPing || 0),
    lastPing: -1
  });
  
  res.json({ success: true, message: 'Host added successfully' });
});

app.put('/hosts', (req, res) => {
  const id = parseInt(req.query.id);
  if (id < 0 || id >= hosts.length) {
    return res.status(400).json({ success: false, message: 'Host not found' });
  }
  
  const { name, mac, ip, periodicPing } = req.body;
  
  // Validation
  if (!name || !mac || !ip) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  // MAC format validation
  if (!/^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
    return res.status(400).json({ success: false, message: 'Invalid MAC address' });
  }
  
  // IP format validation
  if (!/^(25[0-5]|2[0-4]\d|1\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d|[1-9]?\d)){3}$/.test(ip)) {
    return res.status(400).json({ success: false, message: 'Invalid IP address' });
  }
  
  hosts[id] = {
    name,
    mac,
    ip,
    periodicPing: parseInt(periodicPing || 0),
    lastPing: hosts[id].lastPing
  };
  
  res.json({ success: true, message: 'Host updated successfully' });
});

app.delete('/hosts', (req, res) => {
  const id = parseInt(req.query.id);
  if (id < 0 || id >= hosts.length) {
    return res.status(400).json({ success: false, message: 'Host not found' });
  }
  
  hosts.splice(id, 1);
  res.json({ success: true, message: 'Host deleted successfully' });
});

app.post('/wake', (req, res) => {
  const id = parseInt(req.query.id);
  if (id < 0 || id >= hosts.length) {
    return res.status(400).json({ success: false, message: 'Host not found' });
  }
  
  const success = Math.random() > 0.2; // Simulates 80% success rate
  res.json({
    success,
    message: success ? 'WOL packet sent successfully' : 'Failed to send WOL packet'
  });
});

app.post('/ping', (req, res) => {
  const id = parseInt(req.query.id);
  if (id < 0 || id >= hosts.length) {
    return res.status(400).json({ success: false, message: 'Host not found' });
  }
  
  const success = Math.random() > 0.3; // Simulates 70% success rate
  if (success) {
    hosts[id].lastPing = Date.now();
  }
  
  res.json({
    success,
    message: success ? 'Pinging' : 'Failed ping'
  });
});

app.get('/networkSettings', (req, res) => {
  res.json(networkSettings);
});

app.put('/networkSettings', (req, res) => {
  const { enable, ip, networkMask, gateway, dns } = req.body;
  
  // Validation
  if (enable === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  if (enable) {
    if (!ip || !networkMask || !gateway || !dns) {
      return res.status(400).json({ success: false, message: 'Missing required fields for static IP' });
    }
    
    // IP validation
    const ipRegex = /^(25[0-5]|2[0-4]\d|1\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d|[1-9]?\d)){3}$/;
    if (!ipRegex.test(ip) || !ipRegex.test(networkMask) || !ipRegex.test(gateway) || !ipRegex.test(dns)) {
      return res.status(400).json({ success: false, message: 'Invalid IP address format' });
    }
  }
  
  Object.assign(networkSettings, { enable, ip, networkMask, gateway, dns });
  res.json({ success: true, message: 'Network settings updated successfully' });
});

app.get('/authenticationSettings', (req, res) => {
  res.json({
    enable: authentication.enable,
    username: authentication.username
  });
});

app.put('/authenticationSettings', (req, res) => {
  const { enable, username, password } = req.body;
  
  // Validation
  if (enable === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  if (enable) {
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields for authentication' });
    }
    
    // Username validation
    if (username.length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    
    // Password validation
    const passRegex = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    if (!Object.values(passRegex).every(Boolean)) {
      return res.status(400).json({ success: false, message: 'Password does not meet requirements' });
    }
  }
  
  Object.assign(authentication, { enable, username, password });
  res.json({ success: true, message: 'Authentication settings updated successfully' });
});

app.get('/about', (req, res) => {
  res.json(about);
});

app.get('/updateVersion', (req, res) => {
  res.json({
    version: about.version,
    lastVersion: about.lastVersion,
    notesLastVersion: about.notesLastVersion
  });
});

app.post('/updateVersion', (req, res) => {
  const hasUpdate = about.version !== about.lastVersion;
  res.json({
    success: hasUpdate,
    message: hasUpdate 
      ? 'Update process will start in 1 second. Please wait for the update to complete.' 
      : 'Nothing to upgrade. You are up to date!'
  });
});

app.post('/import', (req, res) => {
  const newHosts = req.body;
  if (!Array.isArray(newHosts)) {
    return res.status(400).json({ success: false, message: 'Invalid data format' });
  }
  
  let importedCount = 0;
  let invalidCount = 0;
  
  newHosts.forEach(host => {
    if (host.name && host.mac && host.ip) {
      hosts.push({
        name: host.name,
        mac: host.mac,
        ip: host.ip,
        periodicPing: parseInt(host.periodicPing || 0),
        lastPing: -1
      });
      importedCount++;
    } else {
      invalidCount++;
    }
  });
  
  res.json({
    success: importedCount > 0,
    message: `Imported ${importedCount} hosts. ${invalidCount} hosts were invalid.`
  });
});

app.post('/resetWifi', (req, res) => {
  res.json({ success: true, message: 'WiFi settings have been reset successfully.' });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(chalk.green(`
  ┌────────────────────────────────────────────────┐
  │                                                │
  │   ${chalk.bold('EspWOL Dev Server Running!')}                  │
  │                                                │
  │   - Local:    ${chalk.cyan(`http://localhost:${PORT}`)}        │
  │                                                │
  │   ${chalk.yellow('Use Ctrl+C to stop the server')}             │
  │                                                │
  └────────────────────────────────────────────────┘
  `));
});