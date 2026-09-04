import './style.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'

// Labelled dialog with focus trapped inside; Escape, backdrop and [data-close]
// all close it and return focus to the opener.
export function openModal(title, body) {
  const opener = document.activeElement
  const id = 'dlg-' + Math.random().toString(36).slice(2, 8)

  const el = document.createElement('div')
  el.className = 'modal-overlay'
  el.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </div>`
  document.body.appendChild(el)

  const close = () => {
    el.remove()
    document.removeEventListener('keydown', onKey)
    opener?.focus?.()
  }

  function onKey(e) {
    if (e.key === 'Escape') return close()
    if (e.key !== 'Tab') return

    const items = [...el.querySelectorAll(FOCUSABLE)]
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  document.addEventListener('keydown', onKey)
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.hasAttribute('data-close')) close()
  })
  el.querySelector(FOCUSABLE)?.focus()

  return { el, close }
}
