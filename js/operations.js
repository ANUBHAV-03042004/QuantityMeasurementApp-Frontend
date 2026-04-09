const UNITS = {
  LengthUnit:      ['FEET','INCHES','YARDS','CENTIMETERS'],
  WeightUnit:      ['MILLIGRAM','GRAM','KILOGRAM','POUND','TONNE'],
  VolumeUnit:      ['LITRE','MILLILITRE','GALLON'],
  TemperatureUnit: ['CELSIUS','FAHRENHEIT','KELVIN'],
};

const OP_META = {
  COMPARE:  { title:'Compare',  desc:'Check if two quantities are equal',          symbol:'=?', endpoint:'/compare' },
  CONVERT:  { title:'Convert',  desc:'Convert a quantity to a different unit',      symbol:'→',  endpoint:'/convert' },
  ADD:      { title:'Add',      desc:'Sum two quantities',                          symbol:'+',  endpoint:'/add' },
  SUBTRACT: { title:'Subtract', desc:'Subtract one quantity from another',          symbol:'−',  endpoint:'/subtract' },
  DIVIDE:   { title:'Divide',   desc:'Get the dimensionless ratio between two quantities', symbol:'÷', endpoint:'/divide' },
};

let currentOp     = 'COMPARE';
let historyFilter = 'ALL';

/* ── Init ──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateUnits();
  renderHistorySection();   // show auth gate or load history
});

/* ── Operation selection ─────────────────────────────────────────────────── */
function selectOp(el, op) {
  document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentOp = op;
  const meta = OP_META[op];
  document.getElementById('op-title').textContent  = meta.title;
  document.getElementById('op-desc').textContent   = meta.desc;
  document.getElementById('op-symbol').textContent = meta.symbol;
  document.getElementById('result-card').classList.remove('show');
  // Hide second operand for CONVERT — only need target unit
  const secondOp = document.getElementById('second-operand');
  if (secondOp) secondOp.style.display = op === 'CONVERT' ? 'none' : '';
  const opSymbol = document.getElementById('op-symbol');
  if (opSymbol) opSymbol.style.display = op === 'CONVERT' ? 'none' : '';
  if (typeof gsap !== 'undefined')
    gsap.fromTo('#op-title', { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: .3, ease: 'power2.out' });
}

function selectFilter(el, filter) {
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  historyFilter = filter;
  if (isAuthed()) loadHistory();
}

function updateUnits() {
  const type  = document.getElementById('mtype').value;
  const units = UNITS[type] || [];
  ['unit1', 'unit2'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
  });
}

/* ── Run operation ───────────────────────────────────────────────────────── */
async function runOperation() {
  const val1  = parseFloat(document.getElementById('val1').value);
  const val2  = parseFloat(document.getElementById('val2').value);
  const unit1 = document.getElementById('unit1').value;
  const unit2 = document.getElementById('unit2').value;
  const mtype = document.getElementById('mtype').value;

  if (isNaN(val1)) { toast('Enter a valid number', 'error'); return; }
  if (currentOp !== 'CONVERT' && isNaN(val2)) { toast('Enter valid numbers', 'error'); return; }

  const btn = document.getElementById('run-btn');
  btn.innerHTML = '<span class="loader"></span>';
  btn.disabled  = true;

  const body = {
    thisQuantityDTO: { value: val1, unit: unit1, measurementType: mtype },
    thatQuantityDTO: { value: val2, unit: unit2, measurementType: mtype },
  };

  try {
    const endpoint = OP_META[currentOp].endpoint;
    // Operation endpoints are public — no auth required.
    // If the user is logged in their token is sent automatically by api(),
    // which keeps the history consistent (same DB, same records).
    const data = await api('POST', '/quantities' + endpoint, body);
    showResult(data);
    if (isAuthed()) loadHistory();    // refresh history only for logged-in users
    toast('Operation complete', 'success');
  } catch (e) {
    const msg = e.data?.message || e.data?.error || 'Operation failed';
    toast(msg, 'error');
    const rc = document.getElementById('result-card');
    rc.classList.add('show');
    document.getElementById('result-value').innerHTML = `<span class="result-error">Error</span>`;
    document.getElementById('result-unit').textContent = msg;
    document.getElementById('result-meta').innerHTML = '';
    if (typeof gsap !== 'undefined')
      gsap.fromTo(rc, { x: -10 }, { x: 0, duration: .4, ease: 'elastic.out(1,0.4)' });
  }

  btn.innerHTML = 'Run operation';
  btn.disabled  = false;
}

/* ── Show result ─────────────────────────────────────────────────────────── */
function showResult(data) {
  const rc = document.getElementById('result-card');
  rc.classList.add('show');
  const rv = document.getElementById('result-value');
  const ru = document.getElementById('result-unit');
  const rm = document.getElementById('result-meta');
  rc.style.borderColor = 'var(--border2)';
  rv.style.color       = 'var(--accent)';

  if (data.error) {
    rv.innerHTML = `<span class="result-error">Error</span>`;
    ru.textContent = data.errorMessage || 'Unknown error';
    rm.innerHTML   = '';
    rc.style.borderColor = 'rgba(255,107,107,.3)';
  } else if (currentOp === 'COMPARE') {
    const eq = data.resultString === 'true';
    rv.textContent = eq ? 'Equal' : 'Not equal';
    rv.style.color = eq ? 'var(--accent2)' : 'var(--accent3)';
    ru.textContent = `${data.thisValue} ${data.thisUnit} ${eq ? '=' : '≠'} ${data.thatValue} ${data.thatUnit}`;
    rm.innerHTML = `
      <div class="result-meta-item"><div class="result-meta-key">TYPE</div><div class="result-meta-val">${data.thisMeasurementType || '—'}</div></div>
      <div class="result-meta-item"><div class="result-meta-key">RESULT</div><div class="result-meta-val">${data.resultString}</div></div>`;
  } else {
    const val = Number.isInteger(data.resultValue) ? data.resultValue : parseFloat(data.resultValue.toFixed(6));
    rv.textContent = val;
    ru.textContent = data.resultUnit || '';
    rm.innerHTML = `
      <div class="result-meta-item"><div class="result-meta-key">OPERATION</div><div class="result-meta-val">${data.operation || '—'}</div></div>
      <div class="result-meta-item"><div class="result-meta-key">FROM</div><div class="result-meta-val">${data.thisValue} ${data.thisUnit}</div></div>
      <div class="result-meta-item"><div class="result-meta-key">TO</div><div class="result-meta-val">${data.thatValue != null ? data.thatValue + ' ' + (data.thatUnit || '') : '—'}</div></div>
      <div class="result-meta-item"><div class="result-meta-key">MEASUREMENT TYPE</div><div class="result-meta-val">${(data.thisMeasurementType || '—').replace('Unit','')}</div></div>`;
  }

  if (typeof gsap !== 'undefined')
    gsap.fromTo(rc, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'expo' });
}

/* ── History section ─────────────────────────────────────────────────────── */
function renderHistorySection() {
  const wrap = document.getElementById('history-wrap');
  if (!wrap) return;

  if (!isAuthed()) {
    wrap.innerHTML = `
      <div class="history-auth-gate">
        <h3>Sign in to view history</h3>
        <p>Your calculation history is saved when you are logged in. Operations are still available to everyone.</p>
        <div class="btns">
          <a class="btn btn-solid" href="login.html">Sign in</a>
          <a class="btn" href="register.html">Create account</a>
        </div>
      </div>`;
    return;
  }

  loadHistory();
}

async function loadHistory() {
  if (!isAuthed()) { renderHistorySection(); return; }
  const wrap = document.getElementById('history-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<div class="history-empty">Loading…</div>';

  try {
    let data;
    const f = historyFilter;
    if (f === 'ALL') {
      const results = await Promise.all(
        ['COMPARE','CONVERT','ADD','SUBTRACT','DIVIDE'].map(op =>
          api('GET', `/quantities/history/operation/${op}`).catch(() => [])
        )
      );
      data = results.flat().sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (f === 'ERRORED') {
      data = await api('GET', '/quantities/history/errored');
    } else {
      data = await api('GET', `/quantities/history/operation/${f}`);
    }
    renderHistory(data);
  } catch (e) {
    if (e.status === 401 || e.status === 403) {
      wrap.innerHTML = `
        <div class="history-auth-gate">
          <h3>Session expired</h3>
          <p>Please sign in again to view your history.</p>
          <div class="btns"><a class="btn btn-solid" href="login.html">Sign in</a></div>
        </div>`;
    } else {
      wrap.innerHTML = '<div class="history-empty">Could not load history</div>';
    }
  }
}

function renderHistory(data) {
  const wrap = document.getElementById('history-wrap');
  if (!data || !data.length) {
    wrap.innerHTML = '<div class="history-empty">No records found</div>';
    return;
  }
  wrap.innerHTML = `
    <table class="history-table">
      <thead><tr>
        <th>OPERATION</th><th>FIRST</th><th>SECOND</th><th>RESULT</th><th>TYPE</th><th>STATUS</th>
      </tr></thead>
      <tbody>${data.slice(0, 50).map(r => `
        <tr>
          <td><span class="op-badge ${r.operation || ''}">${r.operation || '—'}</span></td>
          <td style="font-family:var(--font-mono)">${r.thisValue} ${r.thisUnit || ''}</td>
          <td style="font-family:var(--font-mono)">${r.thatValue != null ? r.thatValue + ' ' + (r.thatUnit || '') : '—'}</td>
          <td style="font-family:var(--font-mono);color:var(--accent)">${r.resultString || (r.resultValue !== 0 ? parseFloat((r.resultValue || 0).toFixed(4)) + ' ' + (r.resultUnit || '') : (r.resultValue === 0 && !r.error ? '0' : '—'))}</td>
          <td style="font-size:11px;color:var(--text2)">${r.thisMeasurementType || '—'}</td>
          <td>${r.error ? '<span class="err-badge">error</span>' : '<span style="color:var(--accent2);font-size:11px;font-family:var(--font-mono)">✓ ok</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  if (typeof gsap !== 'undefined')
    gsap.from('.history-table tbody tr', { opacity: 0, y: 6, stagger: .025, duration: .3, ease: 'power2.out' });
}