/* ── Google OAuth ─────────────────────────────────────────────────────────── */
function loginWithGoogle() {
  // Spring Security handles the full OAuth2 flow; backend redirects to
  // oauth2-callback.html with ?token=<jwt> on success.
  window.location.href = API.replace('/api/v1', '') + '/oauth2/authorization/google?frontend=legacy';
}

/* ── Login ───────────────────────────────────────────────────────────────── */
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  clearErrors();
  if (!email) { showError('login-email-err', 'Email is required'); return; }
  if (!pass)  { showError('login-pass-err',  'Password is required'); return; }

  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<span class="loader"></span>';
  btn.disabled = true;

  try {
    const json = await api('POST', '/auth/login', { email, password: pass });

    state.token = json.token;
    state.user  = { email: json.email, role: json.role };
    localStorage.setItem('qm_token', json.token);
    localStorage.setItem('qm_user',  JSON.stringify(state.user));

    toast('Welcome back!', 'success');
    setTimeout(() => location.href = 'operations.html', 700);
  } catch (e) {
    const msg = (e.data && (e.data.message || e.data.error)) || e.message || 'Invalid email or password';
    toast(msg, 'error');
    showError('login-pass-err', msg);
  }

  btn.innerHTML = 'Sign in';
  btn.disabled = false;
}

/* ── Register ────────────────────────────────────────────────────────────── */
async function doRegister() {
  const firstName = document.getElementById('reg-first').value.trim();
  const lastName  = document.getElementById('reg-last').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  clearErrors();

  if (!firstName) { showError('reg-first-err', 'Required'); return; }
  if (!lastName)  { showError('reg-last-err',  'Required'); return; }
  if (!email)     { showError('reg-email-err', 'Email is required'); return; }
  if (!password)  { showError('reg-pass-err',  'Password is required'); return; }

  const btn = document.getElementById('reg-btn');
  btn.innerHTML = '<span class="loader"></span>';
  btn.disabled = true;

  try {
    const json = await api('POST', '/auth/register', { firstName, lastName, email, password });

    state.token = json.token;
    state.user  = { email: json.email, role: json.role };
    localStorage.setItem('qm_token', json.token);
    localStorage.setItem('qm_user',  JSON.stringify(state.user));

    toast('Account created!', 'success');
    setTimeout(() => location.href = 'operations.html', 700);
  } catch (e) {
    const msg = (e.data && (e.data.message || (e.data.errors && Object.values(e.data.errors).join('. '))))
      || e.message
      || 'Registration failed';
    toast(msg, 'error');
    showError('reg-pass-err', msg);
  }

  btn.innerHTML = 'Create account';
  btn.disabled = false;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(e => {
    e.textContent = '';
    e.classList.remove('show');
  });
}

/* ── Enter key support ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const lp = document.getElementById('login-password');
  if (lp) lp.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  const rp = document.getElementById('reg-password');
  if (rp) rp.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
});
