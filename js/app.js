/* ── Shared state ─────────────────────────────────────────────────────────── */
const API = 'https://quantity-measurement-app-backend.azurewebsites.net/api/v1';

const state = {
  token: localStorage.getItem('qm_token') || null,
  user:  JSON.parse(localStorage.getItem('qm_user') || 'null'),
};

function isAuthed() { return !!state.token; }

function authHeaders(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  if (state.token) h['Authorization'] = 'Bearer ' + state.token;
  return h;
}

async function api(method, path, body) {
  const opts = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, data };
  return data;
}

/* ── Logout ─────────────────────────────────────────────────────────────── */
function doLogout() {
  state.token = null;
  state.user  = null;
  localStorage.removeItem('qm_token');
  localStorage.removeItem('qm_user');
  updateNavUser();
  toast('Signed out', 'info');
  setTimeout(() => location.href = 'index.html', 800);
}

/* ── Nav user ───────────────────────────────────────────────────────────── */
function updateNavUser() {
  const nr = document.getElementById('nav-right');
  if (!nr) return;
  if (isAuthed() && state.user) {
    const initials = state.user.email.substring(0, 2).toUpperCase();
    nr.innerHTML = `
      <div class="nav-user">
        <div class="nav-avatar">${initials}</div>
        <span>${state.user.email}</span>
      </div>
      <button class="btn" onclick="doLogout()">Sign out</button>`;
  } else {
    nr.innerHTML = `
      <a class="btn" href="login.html">Sign in</a>
      <a class="btn btn-solid" href="register.html">Get started</a>`;
  }
}

/* ── Active nav tab ─────────────────────────────────────────────────────── */
function setActiveTab() {
  const page = location.pathname.split('/').pop().replace('.html', '') || 'index';
  const map  = { '': 'home', index: 'home', home: 'home', login: 'login', register: 'register', operations: 'ops', dashboard: 'dashboard', profile: 'profile' };
  const name = map[page] || page;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.page === name);
  });
}

/* ── Toast ──────────────────────────────────────────────────────────────── */
function toast(msg, type = 'info') {
  if (typeof gsap === 'undefined') { console.log('[' + type + '] ' + msg); return; }
  const icons = { success: '✓', error: '✕', info: '◎' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span class="toast-icon">' + (icons[type] || '◎') + '</span>' + msg;
  let tc = document.getElementById('toast-container');
  if (!tc) { tc = document.createElement('div'); tc.id = 'toast-container'; tc.className = 'toast-container'; document.body.appendChild(tc); }
  tc.appendChild(el);
  gsap.to(el, { x: 0, duration: .4, ease: 'expo' });
  setTimeout(() => gsap.to(el, { x: '120%', duration: .3, onComplete: () => el.remove() }), 3000);
}

/* ── Cursor — event delegation so dynamically-inserted elements work ─────── */
// querySelectorAll() at init only captures elements already in the DOM.
// Pages like Operations/Dashboard/Profile inject most interactive content
// (history rows, dashboard cards, auth-gate buttons) after DOMContentLoaded,
// so those elements never received hover listeners and the cursor stayed static.
// Event delegation on document catches every hover regardless of when the
// element was inserted — fixing cursor on all pages.
function initCursor() {
  if (typeof gsap === 'undefined') return;
  const cur  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cur || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(cur, { x: mx, y: my, duration: .05 });
  });

  gsap.ticker.add(() => {
    rx += (mx - rx) * .12;
    ry += (my - ry) * .12;
    gsap.set(ring, { x: rx, y: ry });
  });

  // Covers static and dynamically-injected interactive elements
  const HOVER = [
    'button', 'a', 'select', 'input', 'textarea',
    '.feat-card', '.unit-card', '.dash-card', '.recent-item',
    '.op-btn', '.type-btn', '.google-btn', '.run-btn',
    '.auth-submit', '.hfilter', '.bar', '.op-badge',
    '.history-table tr', '.history-table td',
  ].join(', ');

  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER)) {
      gsap.to(cur,  { scale: 2.5, duration: .2 });
      gsap.to(ring, { scale: 1.5, opacity: .5, duration: .2 });
    }
  });

  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER)) {
      gsap.to(cur,  { scale: 1, duration: .2 });
      gsap.to(ring, { scale: 1, opacity: 1, duration: .2 });
    }
  });
}

/* ── Navbar shrink on scroll ─────────────────────────────────────────────── */
function initNavScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  ScrollTrigger.create({
    start: 'top -60',
    onEnter:     () => gsap.to('nav', { padding: '12px 40px', duration: .3 }),
    onLeaveBack: () => gsap.to('nav', { padding: '20px 40px', duration: .3 }),
  });
}

/* ── Init shared on every page ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined') {
    const plugins = [ScrollTrigger, CustomEase];
    if (typeof TextPlugin !== 'undefined') plugins.push(TextPlugin);
    gsap.registerPlugin(...plugins);
    CustomEase.create('expo', 'M0,0 C0.16,1 0.3,1 1,1');
  }
  updateNavUser();
  setActiveTab();
  initCursor();
  initNavScroll();
});
