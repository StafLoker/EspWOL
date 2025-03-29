# EspWOL Project Workflow Guide

This guide explains how to work with the new project structure for EspWOL, a Wake-on-LAN solution for ESP8266.

## Project Structure Overview

The project is organized into three main parts:

1. **Development (dev/)** - For local development with a Node.js server
2. **Demo (demo/)** - A simplified version with simulated data for demonstration
3. **Production (firmware/)** - The optimized code for ESP8266 deployment

## Development Workflow

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/StafLoker/EspWOL.git
cd EspWOL

# Install development dependencies
cd dev
npm install
```

### Local Development

```bash
# Start the development server
npm start
```

This will start a local development server at http://localhost:3000 with:
- Live API endpoints that simulate ESP8266 behavior
- Local development files from the `dev/src` directory

### Building Demo and Production Versions

```bash
# Build the demo version
npm run build:demo

# Build the production version for ESP8266
npm run build:prod

# Build both demo and production
npm run build:all
```

## File Organization

### Development Files (`dev/src/`)

- **HTML Files**
  - `index.html` - Main application page
  - `404.html` - Error page

- **JavaScript Files** (`dev/src/js/`)
  - `core.js` - Core functionality and initialization
  - `ui.js` - UI components and interaction
  - `validation.js` - Form validation functions
  - `api.js` - API interaction with backend

- **CSS Files** (`dev/src/css/`)
  - `style.css` - All styles for the application

### Build Scripts (`dev/scripts/`)

- `dev-server.js` - Local development server
- `build-demo.js` - Builds the demo version
- `build-prod.js` - Builds the production version for ESP8266

## Memory Optimization for ESP8266

The build process automatically:

1. **Minifies HTML, CSS, and JavaScript** - Removes whitespace, comments, and unnecessary characters
2. **Combines files** - Reduces HTTP requests
3. **Inlines CSS and JavaScript** - Improves loading performance
4. **Converts to C header files** - For embedding in ESP8266 firmware

### Tips for Reducing Memory Usage

1. **Remove unused components** - Only include what's necessary
2. **Optimize images** - Use SVG for icons when possible
3. **Use shortened class names** - Shorter names reduce file size
4. **Avoid large libraries** - Use smaller alternatives or custom solutions
5. **Lazy-load features** - Load components only when needed

## Continuous Integration

The project includes GitHub Actions workflows:

1. **Build and Release** - Triggered on tag pushes (e.g., v2.3.1)
2. **Check Release PR** - Validates pull requests before merging
3. **Generate Demo Site** - Updates the demo files when dev files change

## Adding New Features

When adding new features:

1. Develop in the `dev/src` directory
2. Test using the local development server
3. Build the demo version to test with simulated data
4. Build the production version to test on actual ESP8266 hardware
5. Commit your changes

## Troubleshooting

### Common Issues

- **Build fails due to memory constraints**: Use the optimization tips above
- **Images not loading**: Consider using font icons instead
- **Slow performance on ESP8266**: Minimize DOM operations

### Memory Usage Analysis

You can analyze memory usage with:

```bash
# Build production version with size analysis
cd dev
npm run build:prod
```

The output will show size information for each component.