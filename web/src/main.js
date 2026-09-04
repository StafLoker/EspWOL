import './style.css'
import { icon } from './util.js'
import './components/host-card'
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

function route() {
  const hash = location.hash.replace(/^#/, '')

  if (hash.startsWith('/') && !routes[hash]) {
    location.replace(hash)
    return null
  }
  return routes[hash.startsWith('/') ? hash : '/']
}

function shell(inner, nav) {
  const tab = (href, label, key) =>
    `<a href="#${href}" class="tab ${nav === key ? 'tab-active' : ''}"
      ${nav === key ? 'aria-current="page"' : ''}>${label}</a>`

  return `
    <a href="#main" class="skip-link">Skip to content</a>
    <header class="site-header">
      <div class="header-inner">
        <div class="brand-nav">
          <a href="#/" class="brand">EspWOL</a>
          <nav class="tabs" aria-label="Main">
            ${tab('/', 'Hosts', 'home')}
            ${tab('/settings', 'Settings', 'settings')}
          </nav>
        </div>
        <a href="#/account" class="icon-button ${nav === 'account' ? 'icon-button-active' : ''}"
          aria-label="Account" ${nav === 'account' ? 'aria-current="page"' : ''}>
          ${icon('person')}
        </a>
      </div>
    </header>
    <main id="main">${inner}</main>`
}

const app = document.getElementById('app')
let active = null

async function render(moveFocus) {
  if (active?.unmount) active.unmount()

  const current = route()
  if (!current) return // redirecting to /404.html
  active = current
  app.innerHTML = shell(current.render(), current.nav)

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
    await current.mount()
  } catch (e) {
    console.error(e)
  }
}

window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#/') || location.hash === '') render(true)
})
render(false)
