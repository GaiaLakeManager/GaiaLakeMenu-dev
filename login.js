/* Gaia Lake Menu — guest login (v3.0.6). Loaded by index.html after config.js.
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
  .gl-bar button{font:700 .78rem 'Manrope',sans-serif;background:none;border:1px solid var(--line,#e7e0d2);border-radius:8px;padding:4px 10px;color:var(--ink-soft,#5b6b60);cursor:pointer}`;
  document.head.appendChild(st);
})();

const glRequired = data => (CONFIG.GUEST_LOGIN_FORCE === true || (data.settings || {}).requireGuestLogin === true) && !!CONFIG.ORDER_SCRIPT_URL;
const glSaved = () => { try{ const s = JSON.parse(localStorage.getItem(GL_KEY) || 'null'); return s && s.name && s.phone && s.code ? s : null; }catch(e){ return null; } };
const glClear = () => { try{ localStorage.removeItem(GL_KEY); }catch(e){} };

async function glCall(action, d){                   // -> { ok, guest | error, reason }
  const c = new AbortController(), t = setTimeout(() => c.abort(), 20000);
  try{
    const r = await fetch(CONFIG.ORDER_SCRIPT_URL, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify({ action:action, name:d.name, phone:d.phone, code:d.code }), signal:c.signal });
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
  d.innerHTML = `<span>👤 <strong>${esc(GUEST.name)}</strong>${where ? ' · ' + esc(where) : ''}${plan ? ' · ' + plan : ''}</span><button type="button" id="glOut">Log out</button>`;
  const title = document.querySelector('.menu-title'); if (title && title.parentNode) title.parentNode.insertBefore(d, title);
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
