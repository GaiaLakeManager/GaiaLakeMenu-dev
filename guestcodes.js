/* Gaia Lake Menu — Admin "Guest Codes" tab (v3.0.2). Loaded by admin.html after config.js.
   Reads/writes the private guestlogin.json directly with the admin's Google sign-in (the guest page never reads it). */
const GC = { data:null, q:'', edit:null, hist:{} };
const GC_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';           // no 0/O, 1/I/L
const GC_CUT = '09:00', GC_PLAN = { BB:'Bed & Breakfast', HB:'Half Board', FB:'Full Board' };
const gcToday = () => new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Colombo' });
const gcNow = () => new Date().toLocaleTimeString('en-GB', { timeZone:'Asia/Colombo', hour:'2-digit', minute:'2-digit', hour12:false });
const GC_MEALS = { BB:['B'], HB:['B','D'], FB:['B','L','D'] };
const gcCatMeal = k => k.meal !== undefined ? k.meal : (k.bfOnly !== undefined ? (k.bfOnly ? 'B' : '') : (k.bbIncluded ? 'B' : ''));
function gcFixedHtml(basis, sel){                                   // categories included in this plan that can be flipped to "Fixed — no selection"
  const cats = ((window.state && state.categories) || []).filter(k => GC_MEALS[basis].includes(gcCatMeal(k)));
  return cats.length ? cats.map(k => `<label style="display:inline-flex;align-items:center;gap:6px;margin:4px 14px 4px 0;font-weight:500;"><input type="checkbox" class="gfFix" value="${esc(k.id)}" ${(sel || []).includes(k.id) ? 'checked' : ''} style="width:auto;"> ${esc(k.name)}</label>`).join('') : '<span class="hint">No categories are included in this plan.</span>';
}
const gcEl = id => document.getElementById(id);

function gcCode(taken){
  for (;;){
    let c = ''; const b = new Uint8Array(12); crypto.getRandomValues(b);
    for (const x of b){ if (x < 248 && c.length < 6) c += GC_CH[x % 31]; }          // 248 = 31 × 8, so no bias
    if (c.length === 6 && !taken.has(c)) return c;
  }
}
function gcTaken(list){ const s = new Set(); list.forEach(g => { s.add(g.code); (g.history || []).forEach(h => { if (h.old) s.add(h.old); if (h.new) s.add(h.new); }); }); return s; }
function gcStatus(g){
  if (g.revoked) return 'Revoked';
  const d = gcToday(); return (d > g.checkout || (d === g.checkout && gcNow() >= GC_CUT)) ? 'Expired' : 'Active';
}
function gcPhone(s){ let p = String(s || '').replace(/[\s\-().]/g, ''); if (p.startsWith('00')) p = '+' + p.slice(2); return /^\+\d{8,15}$/.test(p) ? p : ''; }

async function gcLoad(){
  const box = gcEl('gcBody');
  if (!CONFIG.GUESTLOGIN_FILE_ID){ box.innerHTML = '<div class="panel-box"><p class="hint">Guest login file is not connected yet. Add <code>GUESTLOGIN_FILE_ID</code> to <code>config.js</code> (the file ID shown in the Apps Script log after running <code>setupGuestLoginTest</code>).</p></div>'; return; }
  box.innerHTML = '<p class="hint">Loading guest codes…</p>';
  try{ GC.data = await downloadJsonFile(CONFIG.GUESTLOGIN_FILE_ID); if (!Array.isArray(GC.data.guests)) GC.data.guests = []; GC.data.guests.forEach(g => { if (!g.id) g.id = uid(); }); gcRender(); }
  catch(e){ box.innerHTML = `<div class="panel-box"><p class="hint">Couldn't open the guest file: ${esc(e.message)}. Check that it is shared as Editor with your account.</p></div>`; }
}
async function gcSave(mutate, okMsg){                         // re-reads the file first so two admins don't overwrite each other
  try{
    const fresh = await downloadJsonFile(CONFIG.GUESTLOGIN_FILE_ID); if (!Array.isArray(fresh.guests)) fresh.guests = [];
    fresh.guests.forEach(g => { if (!g.id) g.id = uid(); });
    const r = mutate(fresh.guests); if (r === false) return false;
    await updateJsonFile(CONFIG.GUESTLOGIN_FILE_ID, fresh); GC.data = fresh; GC.edit = null; gcRender(); if (okMsg) toast(okMsg); return true;
  }catch(e){ toast('Not saved: ' + e.message); return false; }
}
const gcLog = (g, type, extra) => { (g.history = g.history || []).push(Object.assign({ type:type, date:new Date().toISOString(), by:userEmail }, extra || {})); };

function gcMessage(g){
  return `Welcome to ${(window.state && state.profile && state.profile.name) || 'Gaia Lake'}! To view our menu and order meals, open ${CONFIG.GUEST_MENU_URL.replace(/index\.html$/, '')} and log in with your name, phone number and this code: ${g.code}\nYour code works until ${GC_CUT} AM on ${g.checkout}.`;
}

function gcRender(){
  const box = gcEl('gcBody'), all = GC.data.guests, q = GC.q.trim().toLowerCase();
  const list = all.filter(g => !q || [g.name, g.phone, g.code, g.room, g.groupLabel].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (gcStatus(a) === 'Active' ? 0 : 1) - (gcStatus(b) === 'Active' ? 0 : 1) || String(b.checkout).localeCompare(a.checkout));
  const on = (state.settings || {}).requireGuestLogin === true;
  box.innerHTML = `<div class="panel-box"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <label class="switch"><input type="checkbox" id="gcReq" ${on ? 'checked' : ''}><span class="slider"></span></label>
      <span><strong>Require guest login</strong><br><span class="hint">On: guests must log in with name, phone and code to view the menu and order. Off: the menu stays open as before. Applies at once, no redeploy.</span></span></div></div>
    <div class="panel-box"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <button class="btn btn-primary" id="gcAdd">+ Add guest</button>
      <input id="gcSearch" placeholder="Search name, phone, code, room…" value="${esc(GC.q)}" style="flex:1;min-width:180px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);">
      <span class="hint">${list.length} of ${all.length}</span></div></div>
    ${GC.edit ? gcForm(GC.edit) : ''}
    ${list.map(gcCard).join('') || '<p class="hint">No guests yet.</p>'}`;
  gcEl('gcReq').onchange = async e => { state.settings.requireGuestLogin = e.target.checked; try{ await persist(false); toast(e.target.checked ? 'Guest login is now required' : 'Guest login is off — menu is open'); }catch(x){ toast('Not saved: ' + x.message); } };
  gcEl('gcAdd').onclick = () => { GC.edit = { id:'', group:false, basis:'BB', checkin:gcToday(), checkout:'' }; gcRender(); gcEl('gcForm').scrollIntoView({ behavior:'smooth' }); };
  gcEl('gcSearch').oninput = e => { GC.q = e.target.value; const p = e.target.selectionStart; gcRender(); const s = gcEl('gcSearch'); s.focus(); s.setSelectionRange(p, p); };
  if (GC.edit) gcWireForm();
  box.querySelectorAll('[data-gc]').forEach(b => b.onclick = () => gcAct(b.dataset.gc, b.dataset.id));
}

function gcCard(g){
  const st = gcStatus(g), col = st === 'Active' ? '#2e7d32' : st === 'Expired' ? '#8a6d00' : '#c0392b';
  const where = g.group ? '👥 ' + esc(g.groupLabel || 'Group') : '🛏 ' + esc(g.room || '—');
  const h = (g.history || []).slice().reverse();
  return `<div class="panel-box" style="padding:14px 16px;">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
      <div><strong>${esc(g.name)}</strong> <span class="hint">${esc(g.phone)}</span><br><span class="hint">${where} · ${GC_PLAN[g.basis] || esc(g.basis)} · ${esc(g.checkin || '—')} → ${esc(g.checkout)}</span></div>
      <div style="text-align:right;"><code style="font-size:1.2rem;letter-spacing:.2em;font-weight:800;">${esc(g.code)}</code><br><span style="font-size:.78rem;font-weight:800;color:${col};">${st}</span>${g.device ? ' <span class="hint">· device locked</span>' : ''}</div></div>
    <div class="btn-row" style="margin-top:10px;flex-wrap:wrap;">
      <button class="btn btn-sm" data-gc="copy" data-id="${g.id}">Copy message</button>
      <button class="btn btn-sm" data-gc="wa" data-id="${g.id}">WhatsApp</button>
      <button class="btn btn-sm" data-gc="edit" data-id="${g.id}">Edit</button>
      <button class="btn btn-sm" data-gc="regen" data-id="${g.id}">New code</button>
      ${g.device ? `<button class="btn btn-sm" data-gc="unlock" data-id="${g.id}">Clear device lock</button>` : ''}
      <button class="btn btn-sm ${g.revoked ? '' : 'btn-danger'}" data-gc="revoke" data-id="${g.id}">${g.revoked ? 'Reactivate' : 'Revoke'}</button>
      <button class="btn btn-sm" data-gc="hist" data-id="${g.id}">History (${h.length})</button></div>
    ${GC.hist[g.id] ? `<div class="hint" style="margin-top:10px;">${h.map(x => `${esc(new Date(x.date).toLocaleString('en-GB', { timeZone:'Asia/Colombo' }))} — ${esc(x.type)}${x.old ? ': ' + esc(x.old) + ' → ' + esc(x.new) : ''} · ${esc(x.by || '')}`).join('<br>') || 'No history yet.'}</div>` : ''}</div>`;
}

function gcForm(e){
  const rooms = ((state.settings || {}).rooms || []), isNew = !e.id;
  return `<div class="panel-box" id="gcForm"><h3>${isNew ? 'Add guest' : 'Edit guest'}</h3>
    <div class="field-row"><div class="field"><label>Guest name</label><input id="gfName" value="${esc(e.name || '')}"></div>
      <div class="field"><label>Phone (with country code)</label><input id="gfPhone" placeholder="+94771234567" value="${esc(e.phone || '')}"></div></div>
    <div class="field-row"><div class="field"><label>Check-in date</label><input type="date" id="gfIn" value="${esc(e.checkin || '')}"></div>
      <div class="field"><label>Check-out date</label><input type="date" id="gfOut" value="${esc(e.checkout || '')}"></div></div>
    <div class="field-row"><div class="field"><label>Booking basis</label><select id="gfBasis">${Object.keys(GC_PLAN).map(k => `<option value="${k}" ${e.basis === k ? 'selected' : ''}>${k} — ${GC_PLAN[k]}</option>`).join('')}</select></div>
      <div class="field"><label>Booking type</label><select id="gfType"><option value="0" ${e.group ? '' : 'selected'}>Individual</option><option value="1" ${e.group ? 'selected' : ''}>Group</option></select></div></div>
    <div class="field" id="gfRoomF" style="${e.group ? 'display:none' : ''}"><label>Room / villa</label><input id="gfRoom" list="gfRooms" value="${esc(e.room || '')}"><datalist id="gfRooms">${rooms.map(r => `<option value="${esc(r)}">`).join('')}</datalist></div>
    <div class="field" id="gfGroupF" style="${e.group ? '' : 'display:none'}"><label>Group name</label><input id="gfGroup" placeholder="e.g. Hodgson Group" value="${esc(e.groupLabel || '')}"></div>
    <div class="field"><label>Fixed — no selection <span class="hint">(tick only if the kitchen is serving a set meal for this guest; the category is then hidden from ordering)</span></label><div id="gfFixed">${gcFixedHtml(e.basis || 'BB', e.fixed)}</div></div>
    <p class="hint" id="gfErr" style="color:var(--danger);display:none;"></p>
    <div class="btn-row" style="margin-top:12px;"><button class="btn btn-primary" id="gfSave">${isNew ? 'Save & generate code' : 'Save changes'}</button><button class="btn" id="gfCancel">Cancel</button></div></div>`;
}
function gcWireForm(){
  const e = GC.edit, err = t => { const x = gcEl('gfErr'); x.textContent = t; x.style.display = t ? 'block' : 'none'; };
  gcEl('gfType').onchange = ev => { gcEl('gfRoomF').style.display = ev.target.value === '1' ? 'none' : ''; gcEl('gfGroupF').style.display = ev.target.value === '1' ? '' : 'none'; };
  gcEl('gfBasis').onchange = ev => { gcEl('gfFixed').innerHTML = gcFixedHtml(ev.target.value, []); };
  gcEl('gfCancel').onclick = () => { GC.edit = null; gcRender(); };
  gcEl('gfSave').onclick = async () => {
    const d = { name:gcEl('gfName').value.trim().replace(/\s+/g, ' '), phone:gcPhone(gcEl('gfPhone').value), checkin:gcEl('gfIn').value, checkout:gcEl('gfOut').value,
      basis:gcEl('gfBasis').value, group:gcEl('gfType').value === '1', room:gcEl('gfRoom').value.trim(), groupLabel:gcEl('gfGroup').value.trim() };
    d.fixed = [...document.querySelectorAll('.gfFix:checked')].map(x => x.value);
    if (d.name.length < 2 || d.name.length > 60) return err('Please enter the guest name.');
    if (!d.phone) return err('Phone must include the country code, e.g. +94771234567 (8 to 15 digits).');
    if (!d.checkin || !d.checkout) return err('Please set the check-in and check-out dates.');
    if (d.checkout < d.checkin) return err('Check-out cannot be before check-in.');
    if (!e.id && d.checkout < gcToday()) return err('Check-out date is already in the past.');
    if (d.group ? !d.groupLabel : !d.room) return err(d.group ? 'Please enter the group name.' : 'Please choose the room / villa.');
    if (d.group) d.room = ''; else d.groupLabel = '';
    err(''); gcEl('gfSave').disabled = true;
    let made = '';
    const ok = await gcSave(list => {
      if (e.id){ const g = list.find(x => x.id === e.id); if (!g) { toast('That guest no longer exists.'); return false; } Object.assign(g, d); gcLog(g, 'edited'); }
      else { const g = Object.assign({ id:uid(), code:gcCode(gcTaken(list)), revoked:false, history:[] }, d); gcLog(g, 'created'); list.push(g); made = g.code; }
    }, e.id ? 'Guest updated' : 'Saved');
    if (ok && made) alert('Guest code: ' + made + '\n\nUse "Copy message" or "WhatsApp" on the guest card to send it.'); else if (!ok) gcEl('gfSave') && (gcEl('gfSave').disabled = false);
  };
}

async function gcAct(act, id){
  const g = GC.data.guests.find(x => x.id === id); if (!g) return;
  if (act === 'copy'){ try{ await navigator.clipboard.writeText(gcMessage(g)); toast('Message copied'); }catch(e){ prompt('Copy this message:', gcMessage(g)); } }
  else if (act === 'wa'){ window.open('https://wa.me/' + g.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(gcMessage(g)), '_blank'); }
  else if (act === 'edit'){ GC.edit = Object.assign({}, g); gcRender(); gcEl('gcForm').scrollIntoView({ behavior:'smooth' }); }
  else if (act === 'hist'){ GC.hist[id] = !GC.hist[id]; gcRender(); }
  else if (act === 'regen'){
    if (!confirm('Create a new code for ' + g.name + '? The old code stops working immediately.')) return;
    let n = ''; await gcSave(list => { const x = list.find(r => r.id === id); if (!x) return false; const old = x.code; n = gcCode(gcTaken(list)); x.code = n; delete x.device; gcLog(x, 'regenerated', { old:old, new:n }); }, 'New code created');
    if (n) alert('New code for ' + g.name + ': ' + n);
  }
  else if (act === 'revoke'){
    if (!g.revoked && !confirm('Revoke the code for ' + g.name + '? Login stops working immediately.')) return;
    await gcSave(list => { const x = list.find(r => r.id === id); if (!x) return false; x.revoked = !x.revoked; gcLog(x, x.revoked ? 'revoked' : 'reactivated'); }, g.revoked ? 'Reactivated' : 'Revoked');
  }
  else if (act === 'unlock'){ await gcSave(list => { const x = list.find(r => r.id === id); if (!x) return false; delete x.device; gcLog(x, 'device lock cleared'); }, 'Device lock cleared'); }
}
function gcOpen(){ gcLoad(); }
