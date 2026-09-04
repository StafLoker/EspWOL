import './style.css'

export function toast(msg, ok = true) {
  let box = document.getElementById('toast')
  if (!box) {
    box = document.createElement('div')
    box.id = 'toast'
    box.setAttribute('role', 'status')
    box.setAttribute('aria-live', 'polite')
    document.body.appendChild(box)
  }
  const el = document.createElement('div')
  el.className = 'toast ' + (ok ? 'toast-ok' : 'toast-err')
  el.textContent = msg
  box.appendChild(el)
  setTimeout(() => el.remove(), 4000)
}
