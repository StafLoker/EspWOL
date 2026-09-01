import { api } from '../api.js'
import { esc, toast } from '../util.js'

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
    <h1 class="text-xl font-semibold tracking-tight">Account</h1>

    <div class="mt-8 max-w-md">
      <div class="panel divide-rows">
        <div class="row">
          <p class="text-sm font-medium">Signed in as</p>
          <span id="whoami" class="badge">…</span>
        </div>
      </div>

      <p class="section-title mt-8">Change credentials</p>
      <form id="cred" class="panel space-y-4 p-4" novalidate>
        <div class="field">
          <label class="label" for="a-user">Username</label>
          <input id="a-user" name="username" class="input" maxlength="${MAX_USERNAME_LENGTH}"
            required autocomplete="username" value="${esc(username)}" />
        </div>
        <div class="field">
          <label class="label" for="a-pass">New password</label>
          <input id="a-pass" name="password" type="password" class="input"
            maxlength="${MAX_PASSWORD_LENGTH}" required autocomplete="new-password"
            aria-describedby="a-pass-hint" />
          <p id="a-pass-hint" class="hint">8–32 characters, with an uppercase, a lowercase and a punctuation character.</p>
        </div>
        <div class="field">
          <label class="label" for="a-confirm">Confirm password</label>
          <input id="a-confirm" name="confirm" type="password" class="input" required
            autocomplete="new-password" />
        </div>
        <p class="err error" role="alert"></p>
        <div class="flex justify-end">
          <button type="submit" class="btn-primary">Update</button>
        </div>
      </form>

      <p class="hint mt-3">
        New credentials apply immediately, but your browser keeps sending the old ones
        until you close every EspWOL tab and open the app again.
      </p>
    </div>`
}

async function submit(form) {
  const err = form.querySelector('.err')
  const u = form.username.value.trim()
  const p = form.password.value

  if (u.length < 3) return (err.textContent = 'Username must be at least 3 characters.')
  if (!strongPassword(p))
    return (err.textContent = 'Password does not meet the requirements.')
  if (p !== form.confirm.value) return (err.textContent = 'Passwords do not match.')

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
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    submit(form)
  })
}
