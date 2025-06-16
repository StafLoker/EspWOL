import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development'
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue(),
      // Only include dev tools in development
      ...(isDevelopment ? [vueDevTools()] : []),
      tailwindcss(),
      svgLoader
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    define: {
      // Remove console logs in production
      __DEV__: isDevelopment,
    },
    build: {
      // Optimize for ESP8266 - minimize bundle size
      ...(isProduction && {
        minify: 'terser',
        terserOptions: {
          compress: {
            // Remove console logs in production
            drop_console: true,
            drop_debugger: true,
            // Remove dead code
            dead_code: true,
            // Remove unused variables
            unused: true,
            // Optimize comparisons
            comparisons: true,
            // Optimize conditionals
            conditionals: true,
            // Optimize evaluated expressions
            evaluate: true,
            // Optimize if-return statements
            if_return: true,
            // Join consecutive var statements
            join_vars: true,
            // Optimize loops
            loops: true,
            // Remove unreachable code
            pure_getters: true,
            // Remove unused function arguments
            keep_fargs: false,
            // Remove function names
            keep_fnames: false,
          },
          mangle: {
            // Mangle all names except for specific ones
            reserved: ['Vue', 'App'],
            // Mangle property names (be careful with this)
            properties: false,
          },
          format: {
            // Remove comments
            comments: false,
          }
        },
        rollupOptions: {
          output: {
            // Single chunk for minimal files
            manualChunks: undefined,
            // Shorter file names
            entryFileNames: 'app.js',
            chunkFileNames: 'chunk.js',
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'style.css'
              }
              return '[name].[ext]'
            },
          },
          external: [
            // Externalize large dependencies if hosted elsewhere
            // 'vue' // Only if you're loading Vue from CDN
          ]
        },
        // Disable source maps in production to save space
        sourcemap: false,
        // Enable CSS code splitting
        cssCodeSplit: false,
        // Target modern browsers to use smaller polyfills
        target: 'es2015',
        // Reduce chunk size warnings (ESP8266 has limited space)
        chunkSizeWarningLimit: 100, // 100KB warning
        // Optimize assets
        assetsInlineLimit: 2048, // Inline assets smaller than 2KB
      }),
      // Development specific settings
      ...(isDevelopment && {
        sourcemap: true,
        minify: false,
      })
    },
    // Server settings for development
    server: {
      host: true,
      port: 3000
    },
    // Preview settings
    preview: {
      host: true,
      port: 3000,
    },
    // Environment variables
    envPrefix: 'VITE_',
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'vue-i18n',
        'pinia'
      ],
      exclude: [
        // Exclude dev-only dependencies
        ...(isProduction ? ['vite-plugin-vue-devtools'] : [])
      ]
    }
  }
})
