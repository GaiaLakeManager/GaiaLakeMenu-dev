/* Gaia Lake Menu — guest ordering (v2.0.4). Loaded by index.html after the menu script. */
let ORDERING = false;
const menuData = () => window.MENU || {};   // index.html stores the loaded menu in window.MENU
const OS = { cart:new Map(), amend:null, lastId:null, id:null, f:{}, text:'' };
const $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Colombo' });
const nowHM = () => new Date().toLocaleTimeString('en-GB', { timeZone:'Asia/Colombo', hour:'2-digit', minute:'2-digit', hour12:false });
function tomorrow(){ const d = new Date(today() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
function hours(){ const s = (menuData().settings || {}); return { open:s.kitchenOpen || '06:00', close:s.kitchenClose || '22:00', cutoff:s.sameDayCutoff || '19:00', last:s.lastDining || '21:00' }; }
const pastCutoff = () => nowHM() >= hours().cutoff;
const minDate = () => pastCutoff() ? tomorrow() : today();          // earliest dining date a guest may still pick
function kitchenOpenNow(){ const h = hours(), n = nowHM(); return h.open <= h.close ? (n >= h.open && n < h.close) : (n >= h.open || n < h.close); }
const dishBy = c => (menuData().dishes || []).find(d => Number(d.code) === Number(c));
const catOf = c => (menuData().categories || []).find(x => x.id === dishBy(c)?.categoryId);
const isBB = c => !!catOf(c)?.bbIncluded;
const cartHasBB = () => lines().some(l => isBB(l.c));
const code3 = c => '#' + String(c).padStart(3, '0');
const usd = n => 'USD ' + Number(n).toFixed(2);   // all order prices are in USD; LKR conversion happens at final billing
const lines = () => [...OS.cart.values()];
function unit(c, s){ const d = dishBy(c); if (!d) return 0; const o = s && (d.subOptions || []).find(x => x.name === s); return Number((o ? o.price : d.price)?.usd) || 0; }
function lineCharge(l){ return (OS.f.bb && isBB(l.c)) ? 0 : unit(l.c, l.s) * l.q; }         // 0 when waived on Bed & Breakfast
const total = () => Math.round(lines().reduce((t, l) => t + lineCharge(l), 0) * 100) / 100;
function addBtn(c, s){ return ORDERING && c && unit(c, s) > 0 ? `<button class="add-btn" data-c="${c}" data-s="${esc(s)}">+ Add</button>` : ''; }
const totalTxt = () => usd(total());
function syncBtns(){ document.querySelectorAll('.add-btn').forEach(b => { const l = OS.cart.get(b.dataset.c + '|' + b.dataset.s); b.textContent = l ? '✓ Added (' + l.q + ')' : '+ Add'; b.classList.toggle('on', !!l); }); }
function bar(){
  const n = lines().reduce((t, l) => t + l.q, 0);
  $('cartBar').classList.toggle('hidden', !n);
  $('cartSummary').textContent = `${n} item${n > 1 ? 's' : ''} · ${usd(total())}`; syncBtns();
}
function initOrdering(){
  bar();
  try{ Object.assign(OS.f, JSON.parse(localStorage.getItem('gl-guest-details') || '{}')); }catch(e){}
}
document.addEventListener('click', e => {
  const b = e.target.closest('.add-btn'); if (!b) return;
  const k = b.dataset.c + '|' + b.dataset.s, l = OS.cart.get(k) || { c:b.dataset.c, s:b.dataset.s, q:0, d:'', m:'', t:'' };
  l.q = Math.min(50, l.q + 1); OS.cart.set(k, l); bar();
});
$('openCart').onclick = () => { showForm(); $('orderModal').classList.add('open'); document.body.classList.add('o-lock'); $('orderModal').scrollTop = 0; };
const closeO = () => { $('orderModal').classList.remove('open'); document.body.classList.remove('o-lock'); };

function roomOptions(){                                              // Room Numbers + Group/bulk-order labels, merged — dropdown only, no typing
  const s = menuData().settings || {};
  return [...(s.rooms || []), ...(s.groupLabels || [])];
}
function isGroupRoom(v){ return (menuData().settings || {}).groupLabels?.some(g => g.toLowerCase() === (v || '').trim().toLowerCase()); }

const SET = () => menuData().settings || {};
const unitLbl = () => (SET().unitLabel || '').trim() || 'Room';        // what the stay field is called (Room / Villa / Cottage …) — set by admin
const phoneTxt = () => { const p = (menuData().profile || {}).phone; return p ? ' on ' + p : ''; };
const askWhen = () => true;                                          // guests are always asked for a date
const perItem = () => SET().perItemWhen !== false;                   // ONE admin switch: a date for each item (on) or one date for the whole order (off)
const fixedMeal = c => { const k = catOf(c); return !k ? '' : (k.meal !== undefined ? k.meal : (k.bfOnly !== undefined ? (k.bfOnly ? 'B' : '') : (k.bbIncluded ? 'B' : ''))); };   // category fixed to B / L / D, or '' = guest chooses
const MEALS = { B:'Breakfast', L:'Lunch', D:'Dinner' };
const mealTime = m => ({ B:SET().breakfastTime || '07:30', L:SET().lunchTime || '12:30', D:SET().dinnerTime || '19:30' })[m] || '';
const fmtDate = v => v ? new Date(v + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric', timeZone:'UTC' }) : '';
const fmtOf = (t, v, e) => (t === 'date' ? fmtDate(v) : (v ? to12h(v) : '')) || e || (t === 'date' ? 'Tap to choose a date' : 'Tap to choose a time');
function when(l){                                                    // effective date / meal / time of one cart line
  if (!askWhen()) return { d:'', m:'', t:'' };
  const own = perItem(), f = OS.f, d = (own ? l.d : f.date) || minDate(), fm = fixedMeal(l.c);
  if (fm) return { d, m:fm, t:mealTime(fm) };                        // fixed-meal category: always served at that meal
  const m = (own ? l.m : f.meal) || '';
  return { d, m, t: mealTime(m) };
}
const whenTxt = w => w && w.d ? [fmtDate(w.d), MEALS[w.m] ? 'For ' + MEALS[w.m] : ''].filter(Boolean).join(' · ') : '';   // meal name only — no clock time for B/L/D

function grab(){
  if (!$('fName')) return;
  const g = id => $(id) ? $(id).value : undefined;
  OS.f = { ...OS.f, date:g('fDate') ?? OS.f.date, meal:g('fMeal') ?? OS.f.meal, time:g('fTime') ?? OS.f.time, name:$('fName').value, room:$('fRoom') ? $('fRoom').value : (OS.f.room || ''), phone:$('fPhone').value, note:$('fNote').value, web:$('fWeb').value, bb:$('fBB') ? $('fBB').checked : (OS.f.bb || false) };
  try{ localStorage.setItem('gl-guest-details', JSON.stringify({ name:OS.f.name, room:OS.f.room, phone:OS.f.phone })); }catch(e){}
}
function notices(){
  const h = hours(); let n = '';
  if (askWhen() && pastCutoff()) n += `<div class="o-note">Same-day orders are closed for today (after ${to12h(h.cutoff)}). Please choose tomorrow or a later date.</div>`;
  if (!kitchenOpenNow()) n += `<div class="o-note">The kitchen is closed right now. Your order will still be sent and seen when we open at ${to12h(h.open)}.</div>`;
  return n;
}
function itemWhen(l){                                                // per-item date (and meal) — shown only when the admin per-item switch is on
  if (!askWhen() || !perItem()) return '';
  const w = when(l), h = hours(), grp = isGroupRoom(OS.f.room);
  const dIn = `<div class="ol-when-lbl">Please select date</div><div class="dt-row"><input type="date" class="od" min="${minDate()}" value="${w.d}"><small class="fmt">${fmtOf('date', w.d)}</small></div>`;
  if (fixedMeal(l.c)) return `<div class="ol-when">${dIn}</div>`;
  const sel = `<div class="ol-when-lbl">Serve for</div><select class="om">${l.m ? '' : '<option value="">Select…</option>'}${['B','L','D'].map(m => `<option value="${m}"${l.m === m ? ' selected' : ''}>${MEALS[m]}</option>`).join('')}</select>`;
  return `<div class="ol-when">${dIn}${sel}</div>`;
}
function whenBlock(){                                                // order-level date + meal (hidden when each item has its own date)
  if (!askWhen()) return '';
  const f = OS.f, h = hours(), ls = lines(), fx = ls.filter(l => fixedMeal(l.c)), allFx = ls.length > 0 && fx.length === ls.length, meal = f.meal || '', dv = f.date || minDate();
  const ms = [...new Set(fx.map(l => fixedMeal(l.c)))], grp = isGroupRoom(f.room);
  let top = '';
  if (!perItem()){
    const dIn = `<label class="dt">Dining date <em class="fh">(day / month / year)</em><input type="date" id="fDate" min="${minDate()}" value="${dv}"><small class="fmt">${fmtOf('date', dv)}</small></label>`;
    const sel = allFx ? '' : `<label>Serve for<select id="fMeal">${meal ? '' : '<option value="">Select…</option>'}${['B','L','D'].map(m => `<option value="${m}"${meal === m ? ' selected' : ''}>${MEALS[m]}</option>`).join('')}</select></label>`;
    const note = allFx ? `<div class="o-bf">🍽️ ${ms.length === 1 ? `For ${MEALS[ms[0]]}.` : 'Each item is served at its own meal (' + ms.map(m => MEALS[m]).join(', ') + ').'} Just choose the date.</div>` : '';
    top = note + `<div class="o-grid">${dIn}${sel}</div>` +
      (fx.length && !allFx ? `<div class="hint">Breakfast, Lunch and Dinner menu items are always served at their own meal, on the date above.</div>` : '');
  }
  return top + `<div class="hint">Need a special time (for example a late lunch on arrival or an early breakfast on check-out)? Please write it in the Note below and our staff will confirm with you.</div>`;
}
function showForm(err){
  const f = OS.f, opts = roomOptions();
  const roomIn = opts.length
    ? `<select id="fRoom">${!f.room ? `<option value="">Select ${esc(unitLbl().toLowerCase())}…</option>` : ''}${opts.map(r => `<option${r === f.room ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select>`
    : `<div class="hint">Nothing to choose from is set up yet — please contact us directly to order.</div>`;
  $('orderTitle').textContent = OS.amend ? 'Amend your order' : 'Your order';
  $('orderBody').innerHTML = notices() +
    ([...OS.cart.entries()].map(([k, l]) => `<div class="ol" data-k="${esc(k)}">
      <div class="ol-top"><b><span class="item-no">${code3(l.c)}</span> ${esc(dishBy(l.c)?.name || '')}</b>${l.s ? `<small>${esc(l.s)}</small>` : ''}</div>
      <div class="ol-ctl"><button class="q" data-d="-1">−</button><span>${l.q}</span><button class="q" data-d="1">+</button>${askWhen() && fixedMeal(l.c) ? `<span class="for-tag">For ${MEALS[fixedMeal(l.c)]}</span>` : ''}<span class="ol-p">${(OS.f.bb && isBB(l.c)) ? 'Included (BB)' : usd(unit(l.c, l.s) * l.q)}</span><button class="q rm" data-rm="1">×</button></div>
      ${itemWhen(l)}</div>`).join('') || '<p>Your order is empty.</p>') +
    (cartHasBB() ? `<label class="bb-box${f.bb ? ' on' : ''}"><input type="checkbox" id="fBB" ${f.bb ? 'checked' : ''}><span>On Bed &amp; Breakfast — this breakfast is included in my room rate.</span></label>${f.bb ? `<div class="hint">If this isn't correct, your order will be billed at the full price.</div>` : ''}` : '') +
    `<div class="o-total"><span>Total</span><b>${totalTxt()}</b></div>` + whenBlock() +
    (err ? `<div class="o-err" id="oErr">${esc(err)}</div>` : '') + `<label>Your name<input id="fName" autocomplete="name" value="${esc(f.name || '')}"></label>
    <div class="o-grid"><label>${esc(unitLbl())}${roomIn}</label><label>Phone<input id="fPhone" type="tel" autocomplete="tel" value="${esc(f.phone || '')}"></label></div>
    <label>Note (optional)<textarea id="fNote">${esc(f.note || '')}</textarea></label>
    <input class="hp" id="fWeb" tabindex="-1" autocomplete="off" aria-hidden="true" value="${esc(f.web || '')}">
    <div class="o-btns"><button class="btn-ghost danger" id="oCancel">Cancel order</button><button class="btn-ghost" id="oClose">Go back</button><button class="btn-main" id="oReview">Review order</button></div>`;
  if (err){ const e = $('oErr'); if (e) e.scrollIntoView({ block:'center', behavior:'smooth' }); }
}
function check(){
  const f = OS.f, ph = (f.phone || '').replace(/[\s\-()]/g, ''), h = hours();
  if (!OS.cart.size) return 'Please add at least one item.';
  if ((f.name || '').trim().length < 2) return 'Please enter your name.';
  if (!(f.room || '').trim()) return `Please select your ${unitLbl().toLowerCase()}.`;
  if (!/^\+?\d{7,15}$/.test(ph)) return 'Please enter a valid phone number (digits only; add the country code if outside Sri Lanka).';
  if (askWhen()) for (const l of lines()){
    const w = when(l);
    if (!w.d) return 'Please choose a dining date.';
    if (w.d < today()) return 'The dining date cannot be in the past.';
    if (w.d < minDate()) return `Same-day orders are closed for today (after ${to12h(h.cutoff)}). Please choose tomorrow or a later date.`;
    if (!w.m) return 'Please choose Breakfast, Lunch, Dinner or a specific time.';
    if (!w.t) return 'Please choose a dining time.';
  }
  if (isGroupRoom(f.room)){                                          // group orders: one item per Breakfast/Lunch/Dinner sitting
    const seen = {};
    for (const l of lines()){
      const w = when(l);
      if (!fixedMeal(l.c)) continue;
      const k = w.d + '|' + w.m, it = l.c + '|' + (l.s || '');
      if (seen[k] && seen[k] !== it) return `Group orders can include only one item for each ${MEALS[w.m]} sitting (${fmtDate(w.d)}). To order differently, please call the manager${phoneTxt()}.`;
      seen[k] = it;
    }
  }
  return '';
}
function showReview(){
  const f = OS.f;
  $('orderTitle').textContent = 'Review your order';
  $('orderBody').innerHTML = notices() +
    `<div class="rv">${lines().map(l => { const wt = whenTxt(when(l)); return `<div class="rv-l"><span>${l.q}× <span class="item-no">${code3(l.c)}</span> ${esc(dishBy(l.c)?.name || '')}${l.s ? ' – ' + esc(l.s) : ''}${wt ? `<small>${esc(wt)}</small>` : ''}</span><b>${(f.bb && isBB(l.c)) ? 'Included (BB)' : usd(unit(l.c, l.s) * l.q)}</b></div>`; }).join('')}
    <div class="rv-l tot"><span>Total</span><b>${totalTxt()}</b></div></div>
    <p class="rv-m"><b>${esc(f.name)}</b> · ${esc(f.room)} · ${esc(f.phone)}${f.note ? '<br>Note: ' + esc(f.note) : ''}${f.bb ? '<br><small>On Bed &amp; Breakfast — breakfast included</small>' : ''}</p>
    <div class="o-btns"><button class="btn-ghost" id="oEdit">Edit</button><button class="btn-main" id="oSend">Confirm &amp; send</button></div>`;
}
function payload(){
  const f = OS.f, ask = askWhen(); OS.id = OS.id || 'GL-' + Array.from({ length:6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  return { v:2, id:OS.id, amend:OS.amend || undefined, name:f.name.trim(), room:f.room.trim(), phone:f.phone.replace(/[\s\-()]/g, ''), date:ask ? (f.date || minDate()) : '', meal:ask ? (f.meal || '') : '', time:ask ? (f.time || '') : '',
    note:(f.note || '').trim() || undefined, total:total(), planIncluded:!!f.bb, website:f.web || '',
    items:lines().map(l => { const w = when(l); return { c:Number(l.c), s:l.s || undefined, q:l.q, d:w.d || undefined, m:w.m || undefined, t:w.t || undefined }; }) };
}
function orderText(o){   // human-readable order + one #GLORDER line the admin paste box can read
  const { website, ...clean } = o;
  const j = btoa(unescape(encodeURIComponent(JSON.stringify(clean)))), ck = [...j].reduce((h, ch) => (h * 33 + ch.charCodeAt(0)) >>> 0, 5381).toString(36);
  return `Gaia Lake food order ${o.id}${o.amend ? ' (amends ' + o.amend + ')' : ''}\n${o.name}, ${o.room}, ${o.phone}\n` +
    o.items.map(i => { const w = whenTxt(i); return `${i.q}x ${code3(i.c)} ${dishBy(i.c)?.name || ''}${i.s ? ' - ' + i.s : ''}${w ? ` (${w})` : ''}`; }).join('\n') +
    `\nTotal ${usd(o.total)}${o.planIncluded ? ' (Bed & Breakfast — breakfast included)' : ''}${o.note ? '\nNote: ' + o.note : ''}\n#GLORDER ${j}.${ck}`;
}
async function send(){
  const o = payload(), b = $('oSend'); b.disabled = true; b.textContent = 'Sending…';
  let why = '';
  for (let a = 0; a < 3; a++){                       // automatic retries; safe because the server ignores a repeated order ID
    let j = null;
    try{
      const c = new AbortController(), t = setTimeout(() => c.abort(), 10000);
      const r = await fetch(CONFIG.ORDER_SCRIPT_URL, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify(o), signal:c.signal });
      clearTimeout(t); j = await r.json();
    }catch(e){ why = e.name === 'AbortError' ? 'timed out' : e.message; console.error('Order send failed:', e); }
    if (j && j.ok){ OS.lastId = o.id; OS.id = null; showDone(o.id); return; }
    if (j && j.reject){ showForm(j.error); return; }
    if (j) why = j.error || 'server error';
    if (a < 2){ b.textContent = 'Retrying…'; await new Promise(r => setTimeout(r, 1500)); }
  }
  showFallback(o, why);
}
function showDone(id){
  const ph = (menuData().profile || {}).phone || '';
  $('orderTitle').textContent = 'Order sent ✓';
  $('orderBody').innerHTML = `<p>Thank you, your order <b>${id}</b> has reached the kitchen. If anything is wrong, ${ph ? `call us on <a href="tel:${esc(ph.replace(/\s+/g, ''))}">${esc(ph)}</a>` : 'please contact the reception'}.</p>
    <div class="o-btns"><button class="btn-ghost" id="oAmend">Amend this order</button><button class="btn-main" id="oFinish">Done</button></div>`;
}
function showFallback(o, why){
  const t = orderText(o), s = (menuData().settings || {}).orders || {}, p = menuData().profile || {}, q = encodeURIComponent(t);
  const em = s.email || CONFIG.GUEST_ORDER_EMAIL, wa = (s.whatsapp || p.phone || '').replace(/\D/g, ''), ph = (p.phone || '').replace(/\s+/g, ''); OS.text = t;
  $('orderTitle').textContent = 'Couldn’t send automatically';
  $('orderBody').innerHTML = `<p>Please send your order another way — the message is already written for you.</p><p class="rv-m" style="opacity:.6;font-size:.72rem">Reason: ${esc(why || 'unknown')}</p><div class="fb">
    ${wa ? `<a class="btn-main" href="https://wa.me/${wa}?text=${q}">WhatsApp</a>` : ''}${em ? `<a class="btn-secondary" href="mailto:${esc(em)}?subject=${encodeURIComponent('Food order ' + o.id)}&body=${q}">Email</a>` : ''}
    ${ph ? `<a class="btn-ghost" href="sms:${ph}?&body=${q}">SMS</a><a class="btn-ghost" href="tel:${ph}">Call</a>` : ''}<button class="btn-ghost" id="oCopy">Copy text</button></div>
    <pre class="fb-t">${esc(t)}</pre><div class="o-btns"><button class="btn-ghost" id="oBack">Back</button><button class="btn-main" id="oFinish">I’ve sent it</button></div>`;
}
function finish(){ OS.cart.clear(); OS.amend = null; OS.id = null; OS.f.date = OS.f.time = OS.f.meal = OS.f.note = ''; bar(); closeO(); }
$('orderBody').addEventListener('click', e => {
  const t = e.target, row = t.closest('.ol');
  if (t.classList.contains('q') && row){
    grab(); const l = OS.cart.get(row.dataset.k), d = Number(t.dataset.d);
    if (t.dataset.rm || l.q + d < 1) OS.cart.delete(row.dataset.k); else l.q = Math.min(50, l.q + d);
    bar(); showForm(); return;
  }
  ({ oClose:closeO, oCancel:() => { if (confirm('Cancel this order and clear all your selections?')) finish(); }, oReview:() => { grab(); const m = check(); m ? showForm(m) : showReview(); }, oEdit:() => showForm(), oSend:send,
     oBack:showReview, oFinish:finish, oAmend:() => { OS.amend = OS.lastId; showForm(); },
     oCopy:() => { navigator.clipboard?.writeText(OS.text).then(() => t.textContent = 'Copied ✓').catch(() => {}); } })[t.id]?.();
});
$('orderBody').addEventListener('change', e => {
  const t = e.target, row = t.closest('.ol');
  if (t.id === 'fBB'){ grab(); showForm(); return; }
  if (t.id === 'fMeal' || t.id === 'fRoom'){ grab(); showForm(); return; }
  if (t.matches('input[type=date],input[type=time]')){ const n = t.parentElement.querySelector('.fmt'); if (n) n.textContent = fmtOf(t.type, t.value); }
  if (!row) return; const l = OS.cart.get(row.dataset.k); if (!l) return;
  if (t.classList.contains('od')) l.d = t.value;
  if (t.classList.contains('ot')) l.t = t.value;
  if (t.classList.contains('om')){ grab(); l.m = t.value; showForm(); }
});
