import './style.css'
import './host-card.js'
import { renderHome, mountHome, unmountHome } from './views/home.js'
import { renderSettings, mountSettings, unmountSettings } from './views/settings.js'
import { renderAccount, mountAccount } from './views/account.js'

const routes = {
  '/': { render: renderHome, mount: mountHome, unmount: unmountHome, nav: 'home' },
  '/settings': {
    render: renderSettings,
    mount: mountSettings,
    unmount: unmountSettings,
    nav: 'settings',
  },
  '/account': { render: renderAccount, mount: mountAccount, nav: 'account' },
}

function path() {
  const h = location.hash.replace(/^#/, '')
  return routes[h] ? h : '/'
}

function shell(inner, nav) {
  const tab = (href, label, key) =>
    `<a href="#${href}" class="tab ${nav === key ? 'tab-active' : ''}"
      ${nav === key ? 'aria-current="page"' : ''}>${label}</a>`

  return `
    <a href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-200
             focus:rounded-lg focus:border focus:border-border-strong focus:bg-surface
             focus:px-4 focus:py-2 focus:text-sm focus:font-medium">Skip to content</a>
    <header class="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6">
        <div class="flex items-center gap-8">
          <a href="#/" class="text-sm font-semibold tracking-tight">EspWOL</a>
          <nav class="flex gap-6" aria-label="Main">
            ${tab('/', 'Hosts', 'home')}
            ${tab('/settings', 'Settings', 'settings')}
          </nav>
        </div>
        <a href="#/account" class="icon-button ${nav === 'account' ? 'icon-button-active' : ''}"
          aria-label="Account" ${nav === 'account' ? 'aria-current="page"' : ''}>
          <i class="material-symbols-outlined text-xl" aria-hidden="true">person</i>
        </a>
      </div>
    </header>
    <main id="main" class="mx-auto max-w-5xl px-6 py-10">${inner}</main>`
}

const app = document.getElementById('app')
let active = null

async function render(moveFocus) {
  if (active?.unmount) active.unmount()

  const route = routes[path()]
  active = route
  app.innerHTML = shell(route.render(), route.nav)

  // A hash change does not move focus on its own. Send it to the new view's
  // heading - not to <main>, which would make a screen reader read the whole
  // page - and never on first paint, so the skip link stays the first tab stop.
  if (moveFocus) {
    const heading = app.querySelector('h1')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }

  try {
    await route.mount()
  } catch (e) {
    console.error(e)
  }
}

window.addEventListener('hashchange', () => render(true))
render(false)
