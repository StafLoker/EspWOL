import { api } from '../api.js'
import { esc, setFieldError, validateFields } from '../util.js'
import { toast } from '../components/toast'

const MAX_USERNAME_LENGTH = 20
const MAX_PASSWORD_LENGTH = 32

// Mirrors isValidPassword() in firmware/EspWOL/validation.ino: digits do not
// count as the special character there (isPunct), so keep this in sync.
const strongPassword = (p) =>
  p.length >= 8 &&
  p.length <= MAX_PASSWORD_LENGTH &&
  /[A-Z]/.test(p) &&
  /[a-z]/.test(p) &&
  /[!-/:-@[-`{-~]/.test(p)

let username = ''

export function renderAccount() {
  return `
    <h1>Account</h1>

    <div class="narrow">
      <div class="panel divide-rows">
        <div class="row">
          <p class="row-label">Signed in as</p>
          <span id="whoami" class="badge">…</span>
        </div>
      </div>

      <h2 class="section-title">Change credentials</h2>
      <form id="cred" class="panel form-panel" novalidate>
        <div class="field">
          <label class="label" for="a-user">Username</label>
          <input id="a-user" name="username" class="input" maxlength="${MAX_USERNAME_LENGTH}"
            required autocomplete="username" value="${esc(username)}"
            aria-describedby="e-username" />
          <p id="e-username" class="error field-error" role="alert"></p>
        </div>
        <div class="field">
          <label class="label" for="a-pass">New password</label>
          <input id="a-pass" name="password" type="password" class="input"
            maxlength="${MAX_PASSWORD_LENGTH}" required autocomplete="new-password"
            aria-describedby="a-pass-hint e-password" />
          <p id="a-pass-hint" class="hint">8–32 characters, with an uppercase, a lowercase and a punctuation character.</p>
          <p id="e-password" class="error field-error" role="alert"></p>
        </div>
        <div class="field">
          <label class="label" for="a-confirm">Confirm password</label>
          <input id="a-confirm" name="confirm" type="password" class="input" required
            autocomplete="new-password" aria-describedby="e-confirm" />
          <p id="e-confirm" class="error field-error" role="alert"></p>
        </div>
        <p class="err error" role="alert"></p>
        <div class="dialog-actions">
          <button type="submit" class="btn-primary">Update</button>
        </div>
      </form>

      <p class="hint note">
        New credentials apply immediately, but your browser keeps sending the old ones
        until you close every EspWOL tab and open the app again.
      </p>
    </div>`
}

async function submit(form) {
  const err = form.querySelector('.err')
  err.textContent = ''
  const u = form.username.value.trim()
  const p = form.password.value

  const ok = validateFields([
    [form.username, 'e-username', u.length >= 3 ? '' : 'Must be at least 3 characters.'],
    [
      form.password,
      'e-password',
      strongPassword(p) ? '' : 'Does not meet the requirements above.',
    ],
    [
      form.confirm,
      'e-confirm',
      p === form.confirm.value ? '' : 'Passwords do not match.',
    ],
  ])
  if (!ok) return

  try {
    await api.updateAuth({ username: u, password: p })
    username = u
    form.password.value = ''
    form.confirm.value = ''
    err.textContent = ''
    document.getElementById('whoami').textContent = u
    toast('Credentials updated')
  } catch (ex) {
    err.textContent = ex.message
  }
}

export async function mountAccount() {
  try {
    const res = await api.getAuth()
    username = res.data?.username || ''
  } catch (e) {
    toast(e.message, false)
  }

  document.getElementById('whoami').textContent = username || '—'

  const form = document.getElementById('cred')
  form.username.value = username

  // Clear a field's error as soon as it is edited.
  for (const [field, id] of [
    [form.username, 'e-username'],
    [form.password, 'e-password'],
    [form.confirm, 'e-confirm'],
  ]) {
    field.addEventListener('input', () => setFieldError(field, id, ''))
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    submit(form)
  })
}
