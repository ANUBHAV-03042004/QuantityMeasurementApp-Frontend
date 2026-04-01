const OP_SYMBOLS = { COMPARE:'=?', CONVERT:'→', ADD:'+', SUBTRACT:'−', DIVIDE:'÷' };

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
  const header = document.getElementById('dash-welcome');

  if (!isAuthed()) {
    // Show auth gate in place of stats/charts/history panels
    showDashGate();
    return;
  }

  if (header && state.user)
    header.textContent = `Signed in as ${state.user.email}`;

  try {
    const [cmp, cnv, add, sub, div, errored] = await Promise.all([
      api('GET', '/quantities/count/COMPARE'),
      api('GET', '/quantities/count/CONVERT'),
      api('GET', '/quantities/count/ADD'),
      api('GET', '/quantities/count/SUBTRACT'),
      api('GET', '/quantities/count/DIVIDE'),
      api('GET', '/quantities/history/errored'),
    ]);

    const total = cmp + cnv + add + sub + div;
    animCount('d-total',   total);
    animCount('d-compare', cmp);
    animCount('d-convert', cnv);
    animCount('d-errors',  errored.length);

    renderBarChart([
      { label: 'CMP', val: cmp, color: 'var(--accent)' },
      { label: 'CNV', val: cnv, color: 'var(--accent2)' },
      { label: 'ADD', val: add, color: '#ffc800' },
      { label: 'SUB', val: sub, color: '#c864ff' },
      { label: 'DIV', val: div, color: 'var(--accent3)' },
    ]);

    // Type distribution — fetch history for each type
    const [len, wgt, vol, tmp] = await Promise.all([
      api('GET', '/quantities/history/type/LengthUnit').catch(() => []),
      api('GET', '/quantities/history/type/WeightUnit').catch(() => []),
      api('GET', '/quantities/history/type/VolumeUnit').catch(() => []),
      api('GET', '/quantities/history/type/TemperatureUnit').catch(() => []),
    ]);
    renderDonut([len.length, wgt.length, vol.length, tmp.length]);

    // Recent operations
    const allRecent = await Promise.all(
      ['COMPARE', 'ADD', 'CONVERT'].map(op =>
        api('GET', `/quantities/history/operation/${op}`).catch(() => [])
      )
    );
    const recent = allRecent.flat().sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 6);
    renderRecent(recent);

  } catch (e) {
    if (e.status === 401 || e.status === 403) {
      showDashGate();
    } else {
      console.warn('Dashboard error', e);
    }
  }
}

function showDashGate() {
  document.querySelectorAll('.dash-auth-required').forEach(el => {
    el.innerHTML = `
      <div class="dash-gate-inline">
        <h3>Sign in to see your stats</h3>
        <p>History, counts and charts are available once you are logged in.</p>
        <div class="btns">
          <a class="btn btn-solid" href="login.html">Sign in</a>
          <a class="btn" href="register.html">Create account</a>
        </div>
      </div>`;
  });
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

function renderBarChart(ops) {
  const chart = document.getElementById('bar-chart');
  if (!chart) return;
  const max = Math.max(...ops.map(o => o.val), 1);
  chart.innerHTML = ops.map(o => `
    <div class="bar-wrap">
      <div class="bar" data-val="${o.val}" style="background:${o.color};height:4px" title="${o.label}: ${o.val}"></div>
      <span class="bar-lbl">${o.label}</span>
    </div>`).join('');

  setTimeout(() => {
    chart.querySelectorAll('.bar').forEach(b => {
      const v = parseInt(b.dataset.val);
      if (typeof gsap !== 'undefined')
        gsap.to(b, { height: `${Math.max((v / max) * 100, 4)}px`, duration: .8, ease: 'expo', delay: Math.random() * .2 });
      else
        b.style.height = `${Math.max((v / max) * 100, 4)}px`;
    });
  }, 100);
}

function renderDonut([len, wgt, vol, tmp]) {
  const total = len + wgt + vol + tmp || 1;
  const circ  = 276; // 2 * π * 44 ≈ 276
  const colors = ['arc-length', 'arc-weight', 'arc-volume', 'arc-temp'];
  const vals   = [len, wgt, vol, tmp];
  let offset   = 0;

  colors.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const frac = vals[i] / total;
    const dash = circ * frac;
    el.setAttribute('stroke-dasharray', `${dash} ${circ - dash}`);
    el.setAttribute('stroke-dashoffset', -offset);
    offset += dash;
  });
}

function renderRecent(data) {
  const el = document.getElementById('recent-list');
  if (!el) return;
  if (!data.length) { el.innerHTML = '<div class="history-empty">No operations yet</div>'; return; }
  el.innerHTML = data.map(r => `
    <div class="recent-item">
      <div class="recent-left">
        <span class="op-badge ${r.operation || ''}">${r.operation || '—'}</span>
        <span class="recent-expr">${r.thisValue} ${r.thisUnit || ''} ${OP_SYMBOLS[r.operation] || ''} ${r.thatValue != null ? r.thatValue + ' ' + (r.thatUnit || '') : ''}</span>
      </div>
      <span class="recent-time">#${r.id || '—'}</span>
    </div>`).join('');

  if (typeof gsap !== 'undefined')
    gsap.from('.recent-item', { x: -16, opacity: 0, stagger: .06, duration: .4, ease: 'power2.out' });
}
