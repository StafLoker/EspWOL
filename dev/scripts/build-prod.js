/**
 * Build Production Script for EspWOL
 * Optimizes and minifies code for ESP8266 production environment
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
const FIRMWARE_DIR = path.join(__dirname, '../../../firmware/EspWOL');
const JS_DIR = path.join(SRC_DIR, 'js');

// Options
const htmlMinifyOptions = {
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  minifyJS: true,
  minifyCSS: true,
  minifyURLs: true
};

// Ensure the firmware directory exists
fs.ensureDirSync(FIRMWARE_DIR);

/**
 * Function to create a C header from file content
 */
function createCHeader(content, variableName) {
  return `// HTML content
const char ${variableName}[] PROGMEM = R"rawliteral(${content})rawliteral";`;
}

/**
 * Minify and combine JavaScript
 */
async function processJavaScript() {
  console.log(chalk.blue('📦 Processing JavaScript files...'));
  
  try {
    // Get all JS files
    const jsFiles = await glob('**/*.js', { cwd: JS_DIR });
    
    // Read and combine all JS files
    let combinedJs = '';
    for (const file of jsFiles) {
      console.log(chalk.dim(`  Processing ${file}...`));
      const content = await fs.readFile(path.join(JS_DIR, file), 'utf8');
      combinedJs += `// ${file}\n${content}\n\n`;
    }
    
    // Minify the combined JS
    console.log(chalk.dim('  Minifying JavaScript...'));
    const result = await terserMinify(combinedJs, {
      compress: {
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        keep_fargs: false,
        passes: 3
      },
      mangle: true,
      output: {
        beautify: false,
        comments: false
      }
    });
    
    const minifiedJs = result.code;
    console.log(chalk.dim(`  Original size: ${formatBytes(combinedJs.length)}`));
    console.log(chalk.dim(`  Minified size: ${formatBytes(minifiedJs.length)}`));
    console.log(chalk.dim(`  Reduction: ${((1 - minifiedJs.length / combinedJs.length) * 100).toFixed(2)}%`));
    
    // Store the minified JS
    return minifiedJs;
  } catch (error) {
    console.error(chalk.red('❌ Error processing JavaScript:'), error);
    process.exit(1);
  }
}

/**
 * Minify CSS
 */
async function processCSS() {
  console.log(chalk.blue('🎨 Processing CSS files...'));
  
  try {
    const cssDir = path.join(SRC_DIR, 'css');
    const cssFiles = await glob('**/*.css', { cwd: cssDir });
    
    let combinedCss = '';
    for (const file of cssFiles) {
      console.log(chalk.dim(`  Processing ${file}...`));
      const content = await fs.readFile(path.join(cssDir, file), 'utf8');
      combinedCss += content;
    }
    
    console.log(chalk.dim('  Minifying CSS...'));
    const minifiedCss = new CleanCSS({
      level: {
        1: {
          all: true
        },
        2: {
          all: true
        }
      }
    }).minify(combinedCss).styles;
    
    console.log(chalk.dim(`  Original size: ${formatBytes(combinedCss.length)}`));
    console.log(chalk.dim(`  Minified size: ${formatBytes(minifiedCss.length)}`));
    console.log(chalk.dim(`  Reduction: ${((1 - minifiedCss.length / combinedCss.length) * 100).toFixed(2)}%`));
    
    // Store the minified CSS
    return minifiedCss;
  } catch (error) {
    console.error(chalk.red('❌ Error processing CSS:'), error);
    process.exit(1);
  }
}

/**
 * Process HTML for production
 */
async function processHTML(minifiedJS, minifiedCSS) {
  console.log(chalk.blue('🔍 Processing HTML files...'));
  
  try {
    // Process index.html
    let indexHtml = await fs.readFile(path.join(SRC_DIR, 'index.html'), 'utf8');
    
    // Replace CSS and JS links with inline content for faster loading
    indexHtml = indexHtml.replace(
      /<link rel="stylesheet" href="css\/style.css">/,
      `<style>${minifiedCSS}</style>`
    );
    
    // Replace all script tags with a single inline script
    indexHtml = indexHtml.replace(
      /<script src="js\/.*?\.js"><\/script>/g,
      ''
    );
    
    // Add the minified JS at the end of the body
    indexHtml = indexHtml.replace(
      '</body>',
      `<script>${minifiedJS}</script></body>`
    );
    
    // Minify the HTML
    console.log(chalk.dim('  Minifying HTML...'));
    const minifiedHtml = minify(indexHtml, htmlMinifyOptions);
    
    console.log(chalk.dim(`  Original size: ${formatBytes(indexHtml.length)}`));
    console.log(chalk.dim(`  Minified size: ${formatBytes(minifiedHtml.length)}`));
    console.log(chalk.dim(`  Reduction: ${((1 - minifiedHtml.length / indexHtml.length) * 100).toFixed(2)}%`));
    
    // Create index.h file
    console.log(chalk.dim('  Creating index.h...'));
    const indexHeader = createCHeader(minifiedHtml, 'indexHtmlPage');
    await fs.writeFile(path.join(FIRMWARE_DIR, 'index.h'), indexHeader);
    
    // Process 404.html
    if (await fs.pathExists(path.join(SRC_DIR, '404.html'))) {
      console.log(chalk.dim('  Processing 404.html...'));
      const notFoundHtml = await fs.readFile(path.join(SRC_DIR, '404.html'), 'utf8');
      const minifiedNotFound = minify(notFoundHtml, htmlMinifyOptions);
      
      console.log(chalk.dim(`  404 Original size: ${formatBytes(notFoundHtml.length)}`));
      console.log(chalk.dim(`  404 Minified size: ${formatBytes(minifiedNotFound.length)}`));
      
      // Create 404.h file
      const notFoundHeader = createCHeader(minifiedNotFound, 'notFoundHtmlPage');
      await fs.writeFile(path.join(FIRMWARE_DIR, '404.h'), notFoundHeader);
    }
    
    console.log(chalk.green('✅ HTML files processed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Error processing HTML:'), error);
    process.exit(1);
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Main build function
 */
async function build() {
  console.log(chalk.bold.cyan('🔨 Building Production Version for ESP8266'));
  
  try {
    // Process JS and CSS
    const minifiedJS = await processJavaScript();
    const minifiedCSS = await processCSS();
    
    // Process HTML with the minified resources
    await processHTML(minifiedJS, minifiedCSS);
    
    console.log(chalk.bold.green('✨ Production build completed successfully!'));
    console.log(chalk.yellow('📌 Files created:'));
    console.log(chalk.yellow('   - index.h'));
    console.log(chalk.yellow('   - 404.h'));
  } catch (error) {
    console.error(chalk.bold.red('💥 Build failed:'), error);
    process.exit(1);
  }
}

// Run the build
build();