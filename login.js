/* Gaia Lake Menu — guest login (v3.1.0). Loaded by index.html after config.js.
   Verification happens in Apps Script against a private file; this page only sends name + phone + code. */
let GUEST = null;                                   // verified guest details (name, phone, room, basis, checkin, checkout, fixed …)
const GL_KEY = 'gl-guest-session';
(function(){
  const st = document.createElement('style');
  st.textContent = `
  .gl-login{position:fixed;inset:0;z-index:9999;overflow:auto;background:var(--cream,#fbf8f1);color:var(--ink,#1c2b22);display:flex;align-items:flex-start;justify-content:center;padding:max(24px,env(safe-area-inset-top)) 16px 24px}
  .gl-box{width:100%;max-width:420px;background:var(--paper,#fff);border:1px solid var(--line,#e7e0d2);border-radius:18px;padding:24px 20px;margin-top:6vh;box-shadow:0 8px 30px rgba(0,0,0,.08)}
  .gl-box h1{font:600 1.35rem 'Fraunces',serif;margin:0 0 4px;text-align:center}
  .gl-box .gl-sub{margin:0 0 18px;text-align:center;color:var(--ink-soft,#5b6b60);font-size:.9rem}
  .gl-box label{display:block;font:700 .8rem 'Manrope',sans-serif;margin:12px 0 4px}
  .gl-box input{width:100%;box-sizing:border-box;font:500 1rem 'Manrope',sans-serif;padding:11px 12px;border:1px solid var(--line,#e7e0d2);border-radius:10px;background:var(--paper,#fff);color:var(--ink,#1c2b22)}
  .gl-box input#glCode{text-transform:uppercase;letter-spacing:.25em;font-weight:700;text-align:center}
  .gl-box .gl-hint{font-size:.76rem;color:var(--ink-soft,#5b6b60);margin-top:3px}
  .gl-box button{width:100%;margin-top:18px;font:800 .95rem 'Manrope',sans-serif;padding:12px;border:0;border-radius:10px;background:var(--brand-1,#4C9D38);color:#fff;cursor:pointer}
  .gl-box button:disabled{opacity:.6;cursor:default}
  .gl-err{margin-top:14px;padding:10px 12px;border-radius:10px;background:#fbe7e4;color:#c0392b;font-size:.86rem;font-weight:600}
  .gl-foot{margin-top:16px;text-align:center;font-size:.78rem;color:var(--ink-soft,#5b6b60)}
  .gl-foot a{color:var(--ink,#1c2b22);font-weight:800;text-decoration:underline}
  .gl-bar{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:center;margin:10px 0;padding:8px 12px;border-radius:12px;background:var(--paper,#fff);border:1px solid var(--line,#e7e0d2);font-size:.85rem}
  .gl-bar button{transition:background .15s,color .15s,border-color .15s}
  .gl-bar #glMy{background:var(--brand-1,#4C9D38);border-color:var(--brand-1,#4C9D38);color:#fff}.gl-bar #glMy:hover{filter:brightness(.88)}
  .gl-bar #glOut:hover{background:#fbe7e4;border-color:#c0392b;color:#c0392b}
  .mo-back{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:max(16px,env(safe-area-inset-top)) 12px 16px}
  .mo-box{width:100%;max-width:520px;background:var(--paper,#fff);color:var(--ink,#1c2b22);border-radius:16px;padding:16px;margin:2vh 0}
  .mo-box h2{font:600 1.2rem 'Fraunces',serif;margin:0 0 4px}.mo-box .mo-x{float:right;width:auto;margin:0;padding:4px 12px;background:none;color:var(--ink-soft,#5b6b60);border:1px solid var(--line,#e7e0d2);border-radius:8px;font:700 .8rem 'Manrope',sans-serif;cursor:pointer}
  .mo-sit{border:1px solid var(--line,#e7e0d2);border-radius:12px;padding:10px 12px;margin-top:10px}.mo-h{display:flex;justify-content:space-between;gap:8px;align-items:center;font-weight:800;font-size:.9rem}
  .mo-st{font-size:.72rem;font-weight:800;padding:2px 9px;border-radius:999px;background:#fff3cd;color:#8a6d00;white-space:nowrap}.mo-st.done{background:#e3f3e2;color:#2e7031}
  .mo-ln{display:flex;gap:10px;align-items:center;padding:7px 0;border-top:1px dashed var(--line,#e7e0d2);font-size:.86rem}.mo-ln:first-of-type{border-top:0}.mo-ln img,.mo-ln .mo-ph{width:44px;height:44px;border-radius:8px;object-fit:cover;flex:none;background:var(--line,#e7e0d2);display:flex;align-items:center;justify-content:center}
  .mo-ln small{display:block;color:var(--ink-soft,#5b6b60)}.mo-meta{font-size:.76rem;color:var(--ink-soft,#5b6b60);margin-top:6px}.mo-note{margin-top:6px;padding:6px 9px;border-radius:8px;background:#fff8e1;color:#4a3b00;font-size:.82rem}
  .gl-bar button{font:700 .78rem 'Manrope',sans-serif;background:none;border:1px solid var(--line,#e7e0d2);border-radius:8px;padding:4px 10px;color:var(--ink-soft,#5b6b60);cursor:pointer}`;
  document.head.appendChild(st);
})();

const glRequired = data => (CONFIG.GUEST_LOGIN_FORCE === true || (data.settings || {}).requireGuestLogin === true) && !!CONFIG.ORDER_SCRIPT_URL;
const glSaved = () => { try{ const s = JSON.parse(localStorage.getItem(GL_KEY) || 'null'); return s && s.name && s.phone && s.code ? s : null; }catch(e){ return null; } };
const glClear = () => { try{ localStorage.removeItem(GL_KEY); }catch(e){} };

function glDevice(){                                // random id of this browser, used only to slow down guessing
  try{ let v = localStorage.getItem('gl-did'); if (!v){ const b = new Uint8Array(12); crypto.getRandomValues(b); v = [...b].map(x => x.toString(36).padStart(2, '0')).join(''); localStorage.setItem('gl-did', v); } return v; }catch(e){ return ''; }
}
async function glCall(action, d){                   // -> { ok, guest | error, reason }
  const c = new AbortController(), t = setTimeout(() => c.abort(), 20000);
  try{
    const r = await fetch(CONFIG.ORDER_SCRIPT_URL, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify({ action:action, name:d.name, phone:d.phone, code:d.code, did:glDevice() }), signal:c.signal });
    return await r.json();
  }catch(e){ return { ok:false, network:true, error:'Couldn\u2019t reach the server. Please check your connection and try again.' }; }
  finally{ clearTimeout(t); }
}

function glBar(){                                   // small "signed in" strip under the header
  const old = document.getElementById('glBar'); if (old) old.remove();
  if (!GUEST) return;
  const plan = { RO:'Room Only', BB:'Bed & Breakfast', HB:'Half Board', FB:'Full Board' }[GUEST.basis] || '';
  const where = GUEST.group ? (GUEST.groupLabel || 'Group') : (GUEST.room || '');
  const d = document.createElement('div'); d.className = 'gl-bar'; d.id = 'glBar';
  d.innerHTML = `<span>👤 <strong>${esc(GUEST.name)}</strong>${GUEST.demo ? ' <span class="tag" style="background:#ffd54f;color:#4a3b00;">DEMO</span>' : ''}${where ? ' · ' + esc(where) : ''}${plan ? ' · ' + plan : ''}</span><button type="button" id="glMy">My orders</button><button type="button" id="glOut">Log out</button>${GUEST.demo ? '<span style="flex-basis:100%;text-align:center;font-weight:600;">Demo guest — you can try everything, but orders are not sent to the kitchen.</span>' : ''}${GUEST.viewOnly ? '<span style="flex-basis:100%;text-align:center;font-weight:600;">Group orders are submitted through one primary device. Feel free to browse here and pass your choices to your group leader.</span>' : ''}`;
  const title = document.querySelector('.menu-title'); if (title && title.parentNode) title.parentNode.insertBefore(d, title);
  document.getElementById('glMy').onclick = glMyOrders;
  document.getElementById('glOut').onclick = () => { glClear(); location.reload(); };
}

function glForm(data, go, msg){
  const p = data.profile || {}, box = document.createElement('div');
  box.className = 'gl-login';
  box.innerHTML = `<form class="gl-box" id="glForm" autocomplete="off" novalidate>
    <h1>${esc(p.name || CONFIG.RESTAURANT_NAME_FALLBACK)}</h1>
    <p class="gl-sub">Guest login — please sign in to view the menu and place your order.</p>
    <label for="glName">Guest name</label><input id="glName" type="text" autocomplete="name" placeholder="As given at booking / check-in">
    <label for="glPhone">Phone number</label><input id="glPhone" type="tel" autocomplete="tel" placeholder="With country code, e.g. +44 7700 900123">
    <label for="glCode">Login code</label><input id="glCode" type="text" maxlength="8" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="6 characters">
    <div class="gl-hint">Your code was sent to you by Gaia Lake.</div>
    <div class="gl-err" id="glErr" style="display:none"></div>
    <button type="submit" id="glGo">Log in</button>
    <div class="gl-foot">Need help? Please contact reception${p.phone ? ' on <a href="tel:' + esc(p.phone.replace(/\s+/g, '')) + '">' + esc(p.phone) + '</a>' : ''}.</div></form>`;
  document.body.appendChild(box);
  const err = t => { const e = document.getElementById('glErr'); e.textContent = t || ''; e.style.display = t ? 'block' : 'none'; };
  if (msg) err(msg);
  document.getElementById('glForm').onsubmit = async ev => {
    ev.preventDefault();
    const d = { name:glName.value.trim(), phone:glPhone.value.trim(), code:glCode.value.trim().toUpperCase() };
    if (!d.name || !d.phone || !d.code){ err('Please enter your name, phone number and code.'); return; }
    if (!/^\+?[\d\s\-()]{7,20}$/.test(d.phone)){ err('Please enter your phone number with the country code.'); return; }
    err(''); glGo.disabled = true; glGo.textContent = 'Checking…';
    const r = await glCall('login', d);
    glGo.disabled = false; glGo.textContent = 'Log in';
    if (!r.ok){ err(r.error || 'Login failed. Please try again.'); return; }
    try{ localStorage.setItem(GL_KEY, JSON.stringify(d)); }catch(e){}
    GUEST = r.guest; box.remove(); glBar(); go();
  };
}

async function glGate(data, go){                    // called by index.html with the loaded menu
  if (!glRequired(data)){ go(); return; }
  const s = glSaved();
  if (s){                                           // quiet re-check of a stored session
    const r = await glCall('check', s);
    if (r.ok){ GUEST = r.guest; glBar(); go(); return; }
    if (r.network){ glForm(data, go, r.error); return; }
    glClear(); glForm(data, go, r.reason === 'invalid' ? 'Your saved login is no longer valid. Please sign in again.' : r.error); return;
  }
  glForm(data, go);
}

/* ---- meal plan helpers ---- */
const glCatMeal = k => k.meal !== undefined ? k.meal : (k.bfOnly !== undefined ? (k.bfOnly ? 'B' : '') : (k.bbIncluded ? 'B' : ''));   // category fixed to B / L / D, or '' = any time
function glCatView(cat){                           // how one menu category looks for the logged-in guest
  const r = { hide:false, msg:'', inc:false };
  if (!GUEST) return r;
  const m = glCatMeal(cat), plan = { RO:[], BB:['B'], HB:['B','D'], FB:['B','L','D'] }[GUEST.basis] || [];
  if (m && new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Colombo' }) === GUEST.checkout){ r.hide = true; return r; }   // on the check-out day itself B/L/D are too late to prepare (earlier days can still pre-order them)
  if (m && plan.includes(m)){
    if ((GUEST.fixed || []).includes(cat.id)) r.msg = { BB:'Your breakfast is a set menu — no selection needed.', HB:'Your breakfast and dinner are a set menu — no selection needed.', FB:'Your breakfast, lunch and dinner are a set menu — no selection needed.' }[GUEST.basis] || 'This is a set menu — no selection needed.';
    else r.inc = true;
  }
  return r;
}

const glPreCheckin = () => !!GUEST && GUEST.checkin > new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Colombo' });   // logged in, but check-in date is still ahead

/* ---- v3.1.0 My orders: the guest's own previous orders, one card per meal (sitting) ---- */
async function glMyOrders(){
  const back = document.createElement('div'); back.className = 'mo-back';
  back.innerHTML = '<div class="mo-box"><button type="button" class="mo-x" id="moX">Close</button><h2>My orders</h2><div id="moBody" class="gl-sub" style="margin:12px 0;color:var(--ink-soft,#5b6b60)">Loading…</div></div>';
  document.body.appendChild(back);
  const close = () => back.remove(); document.getElementById('moX').onclick = close; back.onclick = ev => { if (ev.target === back) close(); };
  const body = document.getElementById('moBody'), s = glSaved();
  if (!s){ body.textContent = 'Please log in again to see your orders.'; return; }
  const r = await glCall('myorders', s);
  if (!r.ok){ body.textContent = r.error || 'Could not load your orders.'; return; }
  const rank = { B:1, L:2, D:3 }, dishes = (window.MENU || {}).dishes || [], sits = [];
  (r.orders || []).forEach(o => (o.sittings || []).forEach((st, i) => sits.push({ o:o, st:st, first:i === 0 })));
  if (!sits.length){ body.textContent = GUEST && GUEST.demo ? 'Demo guest — orders are not saved.' : 'You have no orders yet.'; return; }
  sits.sort((a, b) => (a.st.date + (a.st.time || '')).localeCompare(b.st.date + (b.st.time || '')) || (rank[a.st.meal] || 9) - (rank[b.st.meal] || 9));
  const fmtD = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', timeZone:'UTC' });
  const when = iso => iso ? new Date(iso).toLocaleString('en-GB', { timeZone:'Asia/Colombo', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:false }) : '';
  const notes = [...new Set((r.orders || []).map(o => (o.note || '').trim()).filter(Boolean))];   // notes apply to the whole order, so they sit outside the meal cards
  const notesBlock = notes.length ? '<div class="mo-note" style="margin-top:14px;"><strong>Your notes</strong>' + notes.map(n => `<div style="margin-top:4px;">${esc(n)}</div>`).join('') + '</div>' : '';
  const tot = (r.orders || []).reduce((s, o) => s + (Number(o.total) || 0), 0), paid = (r.orders || []).reduce((s, o) => s + (o.paid ? Number(o.total) || 0 : 0), 0);
  const totBlock = `<div class="mo-sit" style="background:var(--cream,#fbf8f1);"><div class="mo-h"><span>Total of all orders</span><span>${money(tot, 'USD')}</span></div>` + (paid > 0 ? `<div class="mo-h" style="margin-top:6px;"><span>Paid</span><span style="color:#2e7031;">− ${money(paid, 'USD')}</span></div>` : '') + `<div class="mo-h" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line,#e7e0d2);font-size:1rem;"><span>${tot - paid > 0.005 ? 'Balance to pay' : 'Nothing to pay'}</span><span>${money(Math.max(0, tot - paid), 'USD')}</span></div></div>`;
  body.className = ''; body.style.margin = '0';
  body.innerHTML = sits.map(x => {
    const st = x.st, label = { B:'Breakfast', L:'Lunch', D:'Dinner' }[st.meal] || ('at ' + to12h(st.time));
    return `<div class="mo-sit"><div class="mo-h"><span>${esc(fmtD(st.date))} · ${esc(label)}</span><span><span class="mo-st ${st.done ? 'done' : ''}">${st.done ? 'Completed' : 'Pending'}</span>${x.o.paid ? ' <span class="mo-st done">Paid</span>' : ''}</span></div>` +
      st.items.map(i => { const d = dishes.find(k => Number(k.code) === Number(i.code)), img = d && d.imageFileId ? `<img src="${driveImageUrl(d.imageFileId, 120)}" alt="" loading="lazy">` : '<div class="mo-ph">🍽️</div>';
        return `<div class="mo-ln">${img}<div style="flex:1;min-width:0;"><strong>${esc((d && d.name) || i.name)}</strong>${i.sub ? '<small>' + esc(i.sub) + '</small>' : ''}</div><div style="text-align:right;white-space:nowrap;">${Number(i.qty)} × ${i.bbWaived ? 'included' : money(i.unit, 'USD')}</div></div>`; }).join('') +
      `<div class="mo-meta">Order ${esc(x.o.id)} · placed ${esc(when(x.o.received))}</div>` + '</div>';
  }).join('') + notesBlock + totBlock;
}
