document.addEventListener('DOMContentLoaded', initProfile);

async function initProfile() {
  if (!isAuthed()) {
    document.getElementById('profile-gate').style.display  = 'flex';
    document.getElementById('profile-content').style.display = 'none';
    return;
  }
  document.getElementById('profile-gate').style.display    = 'none';
  document.getElementById('profile-content').style.display = 'block';

  try {
    const user = await api('GET', '/users/me');
    const initials = ((user.firstName || '?')[0] + (user.lastName || '?')[0]).toUpperCase();

    document.getElementById('p-avatar').textContent   = initials;
    document.getElementById('p-name').textContent     = `${user.firstName} ${user.lastName}`;
    document.getElementById('p-email').textContent    = user.email;
    document.getElementById('p-email2').textContent   = user.email;
    document.getElementById('p-first').textContent    = user.firstName;
    document.getElementById('p-last').textContent     = user.lastName;
    document.getElementById('p-role').textContent     = user.role;
    document.getElementById('p-provider').textContent = user.authProvider;
    document.getElementById('p-prov2').textContent    = user.authProvider;

    const [counts, errored] = await Promise.all([
      Promise.all(['COMPARE','CONVERT','ADD','SUBTRACT','DIVIDE']
        .map(op => api('GET', `/quantities/count/${op}`).catch(() => 0)))
        .then(arr => arr.reduce((a, b) => a + b, 0)),
      api('GET', '/quantities/history/errored').then(r => r.length).catch(() => 0),
    ]);

    animCount('ps-total',   counts);
    animCount('ps-success', counts - errored);
    animCount('ps-errors',  errored);

  } catch (e) {
    if (e.status === 401 || e.status === 403) {
      // Token expired — clear and show gate
      localStorage.removeItem('qm_token');
      localStorage.removeItem('qm_user');
      document.getElementById('profile-gate').style.display    = 'flex';
      document.getElementById('profile-content').style.display = 'none';
    } else {
      console.warn('Profile load error', e);
    }
  }
}

function animCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  if (typeof gsap === 'undefined') { el.textContent = target; return; }
  gsap.to({ val: 0 }, {
    val: target, duration: 1.2, ease: 'power2.out',
    onUpdate: function () { el.textContent = Math.round(this.targets()[0].val); },
  });
}
