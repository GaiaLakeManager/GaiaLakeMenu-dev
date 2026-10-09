/* Gaia Lake Menu — Admin "Orders" tab (v3.0.13). Loaded by admin.html after guestcodes.js.
   Reads the private Orders folder with the admin's Google sign-in. Order files (GL-XXXXXX.json) are written by Code.gs;
   this tab lists them, refreshes by itself, changes their status (Pending → Served → Billed → Paid) and saves orders pasted from a #GLORDER message. */
const OR = { map:new Map(), next:'', loaded:false, busy:false, filter:'Pending', q:'', timer:null, tick:0, err:'', fresh:false, paste:null };
const OR_ST = ['Pending', 'Served', 'Billed', 'Paid'];
const OR_MEAL = { B:'Breakfast', L:'Lunch', D:'Dinner' };
const orEl = id => document.getElementById(id);
const orWhen = iso => iso ? new Date(iso).toLocaleString('en-GB', { timeZone:'Asia/Colombo', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:false }) : '';
const orDate = d => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', timeZone:'UTC' }) : '';
const orT12 = t => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
const orUsd = n => 'USD ' + Number(n || 0).toFixed(2);
const orVisible = () => { const v = orEl('view-orders'); return !!v && !v.classList.contains('hidden'); };

(function(){                                                       // styles for this tab only
  const st = document.createElement('style');
  st.textContent = `.nav-badge{margin-left:auto;background:#c0392b;color:#fff;border-radius:999px;font-size:.7rem;font-weight:800;padding:1px 7px;min-width:18px;text-align:center}
  .or-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}.or-bar input[type=search]{flex:1 1 180px;min-width:140px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink)}
  .or-chip{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:6px 12px;font-weight:700;font-size:.8rem;cursor:pointer}.or-chip.on{background:var(--brand-1);border-color:var(--brand-1);color:#fff}
  .or-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:12px}.or-card.is-new{border-color:var(--brand-1);box-shadow:0 0 0 2px var(--brand-1) inset}
  .or-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}.or-id{font-weight:800;font-size:1.02rem}
  .or-st{font-size:.76rem;font-weight:800;padding:3px 10px;border-radius:999px;background:#fff3cd;color:#8a6d00}.or-st.Served{background:#dff0ff;color:#175a8c}.or-st.Billed{background:#ece3ff;color:#5b3aa0}.or-st.Paid{background:#e3f3e2;color:#2e7031}
  .or-items{margin:10px 0;padding:0;list-style:none}.or-items li{padding:5px 0;border-top:1px dashed var(--line);font-size:.9rem}.or-items li:first-child{border-top:0}.or-items small{display:block;color:var(--ink-soft)}
  .or-flags{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.or-flag{font-size:.74rem;font-weight:700;padding:2px 8px;border-radius:8px;background:#eef1ee;color:#34423a}.or-flag.warn{background:#fff3cd;color:#8a6d00}.or-flag.ok{background:#e3f3e2;color:#2e7031}
  .or-note{background:#fff8e1;color:#4a3b00;border-radius:8px;padding:6px 10px;font-size:.86rem;margin:8px 0}.or-err{background:#fbe7e4;color:#c0392b;border-radius:10px;padding:10px 12px;font-weight:600;margin:10px 0}
  .or-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-top:8px}`;
  document.head.appendChild(st);
})();

/* ---------------- loading ---------------- */
async function orList(token){
  const q = encodeURIComponent(`'${CONFIG.ORDERS_FOLDER_ID}' in parents and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime%20desc&pageSize=40&fields=nextPageToken,files(id,name,modifiedTime)` + (token ? '&pageToken=' + encodeURIComponent(token) : '');
  return (await driveFetch(url)).json();
}
async function orPull(files){                                       // downloads only orders that are new or changed since last time
  const todo = files.filter(f => /^GL-[A-Z0-9]+\.json$/.test(f.name) && (OR.map.get(f.name) || {}).mod !== f.modifiedTime), fresh = [];
  for (let i = 0; i < todo.length; i += 6){
    await Promise.all(todo.slice(i, i + 6).map(async f => {
      try{ const rec = await downloadJsonFile(f.id), had = OR.map.has(f.name); OR.map.set(f.name, { fileId:f.id, mod:f.modifiedTime, rec:rec }); if (!had) fresh.push(rec); }
      catch(e){ console.warn('Could not read order file', f.name, e); }
    }));
  }
  return fresh;
}
async function orRefresh(manual){
  if (OR.busy || !CONFIG.ORDERS_FOLDER_ID || !accessToken) return;
  OR.busy = true;
  try{
    const j = await orList(), fresh = await orPull(j.files || []);
    if (!OR.loaded){ OR.loaded = true; OR.next = j.nextPageToken || ''; }
    const fp = fresh.filter(r => (r.status || 'Pending') === 'Pending');
    if (OR.fresh && fp.length) toast(fp.length === 1 ? `New order ${fp[0].id} · ${fp[0].room}` : `${fp.length} new orders`);
    OR.fresh = true; OR.err = '';
  }catch(e){
    OR.err = /\b401\b/.test(e.message) ? 'Your sign-in has expired. Please reload this page and sign in again.' : 'Could not load orders: ' + e.message;
    if (/\b401\b/.test(e.message) && OR.timer){ clearInterval(OR.timer); OR.timer = null; }
  }
  finally{ OR.busy = false; orBadge(); if (orVisible()) orList_render(); }
}
async function orMore(){
  if (!OR.next) return;
  try{ const j = await orList(OR.next); await orPull(j.files || []); OR.next = j.nextPageToken || ''; }catch(e){ toast('Could not load older orders: ' + e.message); }
  orBadge(); orList_render();
}
function orStart(){                                                  // called once after sign-in; checks every 30 s on the Orders tab, every 60 s elsewhere
  if (OR.timer || !CONFIG.ORDERS_FOLDER_ID) return;
  orRefresh();
  OR.timer = setInterval(() => { OR.tick++; if (document.hidden) return; if (orVisible() || OR.tick % 2 === 0) orRefresh(); }, 30000);
}
function orBadge(){
  const n = [...OR.map.values()].filter(e => (e.rec.status || 'Pending') === 'Pending').length, b = orEl('ordBadge');
  if (b){ b.textContent = n; b.style.display = n ? '' : 'none'; }
}

/* ---------------- list ---------------- */
function orServe(i){ const m = OR_MEAL[i.meal]; return [orDate(i.date), m ? 'for ' + m : (i.time ? 'at ' + orT12(i.time) : '')].filter(Boolean).join(' · '); }
function orCard(r, amendedBy){
  const st = r.status || 'Pending', fl = [], last = (r.history || []).slice(-1)[0];
  if (r.verified) fl.push(['✔ Verified login' + (r.basis ? ' · ' + r.basis : '') + (r.bbValue ? ' · plan-included ' + orUsd(r.bbValue) + ' waived' : ''), 'ok']);
  else if (r.planIncluded) fl.push(['⚠ Marked BB — verify the room plan before billing (' + orUsd(r.bbValue) + ' waived)', 'warn']);
  if (r.via === 'pasted') fl.push(['📋 Pasted by ' + (r.pastedBy || 'admin'), '']);
  if (r.priceAdjusted) fl.push(['⚠ Price differed from the guest screen — menu price used', 'warn']);
  if (r.receivedOutsideHours) fl.push(['⚠ Received outside kitchen hours', 'warn']);
  if (r.amend) fl.push(['✎ Amends ' + r.amend, '']);
  if (amendedBy && amendedBy.length) fl.push(['Later amended by ' + amendedBy.join(', '), '']);
  return `<div class="or-card${r.__new ? ' is-new' : ''}">
    <div class="or-head"><div><span class="or-id">${esc(r.id)}</span> <span class="or-st ${esc(st)}">${esc(st)}</span><br>
      <strong>${esc(r.name)}</strong> · ${esc(r.room)} · <a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></div>
      <div style="text-align:right;"><strong>${orUsd(r.total)}</strong><br><span class="hint">Received ${esc(orWhen(r.received))}</span></div></div>
    ${fl.length ? `<div class="or-flags">${fl.map(f => `<span class="or-flag ${f[1]}">${esc(f[0])}</span>`).join('')}</div>` : ''}
    <ul class="or-items">${(r.items || []).map(i => `<li>${i.qty}× <strong>#${String(i.code).padStart(3, '0')}</strong> ${esc(i.name)}${i.sub ? ' – ' + esc(i.sub) : ''}${i.bbWaived ? ' <em>(included in plan)</em>' : ''}<small>${esc(orServe(i))}</small></li>`).join('')}</ul>
    ${r.note ? `<div class="or-note"><strong>Guest Note:</strong> ${esc(r.note)}</div>` : ''}
    <div class="or-foot"><div class="btn-row" style="gap:6px;">${OR_ST.map(s => `<button class="btn btn-sm ${s === st ? 'btn-primary' : ''}" data-or="st" data-id="${esc(r.id)}" data-s="${s}" ${s === st ? 'disabled' : ''}>${s}</button>`).join('')}</div>
      ${last ? `<span class="hint">${esc(last.status)} · ${esc(orWhen(last.at))} · ${esc(last.by || '')}</span>` : ''}</div></div>`;
}
function orList_render(){
  const box = orEl('ordList'); if (!box) return;
  const all = [...OR.map.values()].map(e => e.rec).sort((a, b) => String(b.received).localeCompare(String(a.received)));
  const by = {}; all.forEach(r => { if (r.amend){ (by[r.amend] = by[r.amend] || []).push(r.id); } });
  const q = OR.q.trim().toLowerCase();
  const hit = r => !q || [r.id, r.name, r.room, r.phone, r.note, ...(r.items || []).map(i => i.name + ' #' + i.code)].join(' ').toLowerCase().includes(q);
  const cnt = s => all.filter(r => (r.status || 'Pending') === s).length;
  orEl('ordChips').innerHTML = [...OR_ST, 'All'].map(s => `<button class="or-chip ${OR.filter === s ? 'on' : ''}" data-or="chip" data-s="${s}">${s}${s === 'All' ? '' : ' (' + cnt(s) + ')'}</button>`).join('');
  const rows = all.filter(r => (OR.filter === 'All' || (r.status || 'Pending') === OR.filter) && hit(r));
  box.innerHTML = (OR.err ? `<div class="or-err">${esc(OR.err)}</div>` : '') +
    (rows.length ? rows.map(r => orCard(r, by[r.id])).join('') : `<div class="panel-box"><p class="hint">${!OR.loaded ? 'Loading orders…' : all.length ? 'No orders match this filter.' : 'No orders yet.'}</p></div>`);
  orEl('ordMore').style.display = OR.next ? '' : 'none';
  orEl('ordStamp').textContent = OR.loaded ? 'Updated ' + new Date().toLocaleTimeString('en-GB', { timeZone:'Asia/Colombo', hour:'2-digit', minute:'2-digit' }) + ' · refreshes by itself' : '';
}
async function orSetStatus(id, s){
  const e = OR.map.get(id + '.json'); if (!e) return;
  try{
    const rec = await downloadJsonFile(e.fileId);                    // re-read first so a newer copy is never overwritten
    if ((rec.status || 'Pending') !== s){
      rec.status = s; (rec.history = rec.history || []).push({ status:s, at:new Date().toISOString(), by:userEmail });
      await updateJsonFile(e.fileId, rec);
    }
    e.rec = rec; e.mod = ''; toast(id + ' → ' + s); orBadge(); orList_render();
  }catch(err){ toast('Could not change the status: ' + err.message); }
}

/* ---------------- #GLORDER paste box ---------------- */
const orCk = j => [...j].reduce((h, ch) => (h * 33 + ch.charCodeAt(0)) >>> 0, 5381).toString(36);   // same checksum as the guest page
function orParse(text){
  const m = text.indexOf('#GLORDER'); if (m < 0) throw new Error('No #GLORDER line found. Please paste the guest\u2019s whole message.');
  const s = text.slice(m + 8).replace(/\s+/g, ''), dot = s.indexOf('.');
  if (dot < 1) throw new Error('The #GLORDER line looks cut off. Please paste the whole message.');
  const j = s.slice(0, dot);
  if (!/^[A-Za-z0-9+/=]+$/.test(j) || !s.slice(dot + 1).startsWith(orCk(j))) throw new Error('The #GLORDER code is incomplete or damaged. Ask the guest to send the message again.');
  try{ return JSON.parse(decodeURIComponent(escape(atob(j)))); }catch(e){ throw new Error('The #GLORDER code could not be read.'); }
}
async function orBuild(o){                                           // mirrors the checks in Code.gs; prices always come from the live menu
  const errs = [], S = state.settings || {}, slot = { B:S.breakfastTime || '07:30', L:S.lunchTime || '12:30', D:S.dinnerTime || '19:30' };
  if (!/^GL-[A-Z0-9]{6,10}$/.test(o.id || '')) errs.push('Invalid order reference.');
  let name = String(o.name || '').trim(), room = String(o.room || '').trim(), phone = String(o.phone || '').replace(/[\s\-()]/g, '');
  if (name.length < 2) errs.push('Missing guest name.'); if (!room) errs.push('Missing room.'); if (!/^\+?\d{7,15}$/.test(phone)) errs.push('Invalid phone number.');
  if (!Array.isArray(o.items) || !o.items.length || o.items.length > 40) errs.push('The order has no items.');
  let G = null;                                                      // logged-in guest: confirm the code, name and phone against the private guest file
  if (o.gc && CONFIG.GUESTLOGIN_FILE_ID){
    try{
      const nm = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''), ph = s => String(s || '').replace(/\D/g, '').replace(/^00/, ''), code = String(o.gc).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const g = ((await downloadJsonFile(CONFIG.GUESTLOGIN_FILE_ID)).guests || []).find(x => String(x.code).toUpperCase() === code);
      if (g && nm(g.name) === nm(o.name) && ph(g.phone) === ph(o.phone)) G = g;
    }catch(e){}
  }
  if (G){ name = G.name; phone = '+' + String(G.phone).replace(/\D/g, '').replace(/^00/, ''); room = G.group ? (G.groupLabel || 'Group') : (G.room || ''); }
  const PLAN = { RO:[], BB:['B'], HB:['B','D'], FB:['B','L','D'] }, cats = state.categories || [], catMeal = {};
  cats.forEach(c => { const m = c.meal !== undefined ? c.meal : (c.bfOnly !== undefined ? (c.bfOnly ? 'B' : '') : (c.bbIncluded ? 'B' : '')); if (m) catMeal[c.id] = m; });
  const bbCats = new Set(cats.filter(c => c.bbIncluded).map(c => c.id)), planIncluded = G ? (PLAN[G.basis] || []).length > 0 : !!o.planIncluded;
  let total = 0, bbValue = 0; const items = [];
  (Array.isArray(o.items) ? o.items : []).forEach(it => {
    const d = (state.dishes || []).find(x => x.active !== false && Number(x.code) === Number(it.c));
    if (!d){ errs.push('Item #' + it.c + ' is no longer on the menu.'); return; }
    const sub = it.s ? (d.subOptions || []).find(x => x.name === it.s) : null;
    if ((d.subOptions || []).length && !sub){ errs.push('Please check the option for ' + d.name + '.'); return; }
    const unit = Number(((sub || d).price || {}).usd) || 0, q = Math.floor(Number(it.q));
    if (!(unit > 0)){ errs.push('No USD price for ' + d.name + '.'); return; } if (!(q >= 1 && q <= 50)){ errs.push('Invalid quantity for ' + d.name + '.'); return; }
    const date = it.d || o.date || '', meal = catMeal[d.categoryId] || String(it.m || o.meal || ''), time = meal === 'T' ? (it.t || o.time || '') : (slot[meal] || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !time || ['B','L','D','T'].indexOf(meal) < 0) errs.push('Dining date or meal is missing for ' + d.name + '.');
    const bb = G ? (PLAN[G.basis] || []).indexOf(catMeal[d.categoryId]) >= 0 : planIncluded && bbCats.has(d.categoryId);
    items.push({ code:d.code, name:d.name, sub:sub ? sub.name : '', qty:q, unit:unit, date:date, time:time, meal:meal, bbWaived:bb });
    if (bb) bbValue += unit * q; else total += unit * q;
  });
  total = Math.round(total * 100) / 100; bbValue = Math.round(bbValue * 100) / 100;
  const now = new Date().toISOString();
  return { errs:errs, rec:{ id:o.id, amend:o.amend || '', received:now, status:'Pending', currency:'USD', name:name, room:room, phone:phone, date:o.date || '', meal:String(o.meal || ''), time:o.time || '',
    note:String(o.note || '').slice(0, 300), items:items, total:total, planIncluded:planIncluded, bbValue:bbValue, basis:G ? G.basis : '', verified:!!G,
    priceAdjusted:Math.round(Number(o.total) * 100) !== Math.round(total * 100), via:'pasted', pastedBy:userEmail, receivedOutsideHours:false, history:[{ status:'Pending', at:now, by:userEmail, note:'pasted from a #GLORDER message' }] } };
}
async function orRead(){
  const out = orEl('ordPastePreview'), txt = orEl('ordPaste').value; OR.paste = null;
  if (!txt.trim()){ out.innerHTML = ''; return; }
  out.innerHTML = '<p class="hint">Reading…</p>';
  try{
    const o = orParse(txt), b = await orBuild(o); let dup = OR.map.has(b.rec.id + '.json');
    if (!dup && /^GL-/.test(b.rec.id)) dup = !!(await findChild(CONFIG.ORDERS_FOLDER_ID, b.rec.id + '.json', false));
    if (dup) b.errs.unshift('This order (' + b.rec.id + ') has already been received — it is in the list already.');
    out.innerHTML = (b.errs.length ? `<div class="or-err">${b.errs.map(esc).join('<br>')}</div>` : '') + orCard(b.rec, []) +
      `<div class="btn-row"><button class="btn btn-primary" data-or="save" ${b.errs.length ? 'disabled' : ''}>Save this order</button></div><p class="hint">Check the items and prices above against the guest's message, then save. Saving does not send a Telegram or email alert.</p>`;
    if (!b.errs.length) OR.paste = b.rec;
  }catch(e){ out.innerHTML = `<div class="or-err">${esc(e.message)}</div>`; }
}
async function orSave(){
  const r = OR.paste; if (!r) return;
  try{
    const id = await createJsonFile(CONFIG.ORDERS_FOLDER_ID, r.id + '.json', r);
    OR.map.set(r.id + '.json', { fileId:id, mod:'', rec:r }); OR.paste = null;
    orEl('ordPaste').value = ''; orEl('ordPastePreview').innerHTML = ''; OR.filter = 'Pending'; toast('Order ' + r.id + ' saved'); orBadge(); orList_render();
  }catch(e){ toast('Could not save the order: ' + e.message); }
}

/* ---------------- tab ---------------- */
function orOpen(){
  const box = orEl('ordBody');
  if (!CONFIG.ORDERS_FOLDER_ID){ box.innerHTML = '<div class="panel-box"><p class="hint">The Orders folder is not connected yet. Add <code>ORDERS_FOLDER_ID</code> to <code>config.js</code>.</p></div>'; return; }
  if (!orEl('ordList')){
    box.innerHTML = `<div class="panel-box"><details id="ordPasteBox"><summary style="cursor:pointer;font-weight:800;">📋 Paste an order sent by WhatsApp / email / SMS (#GLORDER)</summary>
      <p class="hint" style="margin:10px 0;">When a guest could not send an order online, they send a message with a line starting <code>#GLORDER</code>. Paste the whole message here.</p>
      <textarea id="ordPaste" rows="5" style="width:100%;box-sizing:border-box;" placeholder="Paste the guest's message here"></textarea>
      <div class="btn-row" style="margin-top:8px;"><button class="btn btn-sm btn-primary" data-or="read">Read order</button><button class="btn btn-sm" data-or="clear">Clear</button></div>
      <div id="ordPastePreview" style="margin-top:12px;"></div></details></div>
    <div class="or-bar"><span id="ordChips" style="display:contents;"></span><input type="search" id="ordQ" placeholder="Search name, room, order no, dish…"><button class="btn btn-sm" data-or="refresh">⟳ Refresh</button></div>
    <div class="hint" id="ordStamp" style="margin-bottom:10px;"></div><div id="ordList"></div>
    <div class="btn-row" style="justify-content:center;"><button class="btn btn-sm" id="ordMore" data-or="more" style="display:none;">Load older orders</button></div>`;
    box.addEventListener('click', ev => {
      const b = ev.target.closest('[data-or]'); if (!b) return; const a = b.dataset.or;
      if (a === 'st') orSetStatus(b.dataset.id, b.dataset.s);
      else if (a === 'chip'){ OR.filter = b.dataset.s; orList_render(); }
      else if (a === 'refresh'){ orRefresh(true); }
      else if (a === 'more') orMore();
      else if (a === 'read') orRead();
      else if (a === 'save') orSave();
      else if (a === 'clear'){ orEl('ordPaste').value = ''; orEl('ordPastePreview').innerHTML = ''; OR.paste = null; }
    });
    orEl('ordQ').oninput = ev => { OR.q = ev.target.value; orList_render(); };
  }
  orList_render(); orStart(); orRefresh();
}
