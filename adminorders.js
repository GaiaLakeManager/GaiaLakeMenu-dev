/* Gaia Lake Menu — Admin "Orders" tab (v3.0.14). Loaded by admin.html after guestcodes.js.
   Reads the private Orders folder with the admin's Google sign-in. Order files (GL-XXXXXX.json) are written by Code.gs;
   this tab lists them, refreshes by itself, changes their status (Pending → Served → Billed → Paid) and saves orders pasted from a #GLORDER message. */
const OR = { map:new Map(), next:'', loaded:false, busy:false, filter:'Pending', q:'', timer:null, tick:0, err:'', fresh:false, paste:null, drafts:{}, open:{}, dirty:false, lastErr:'' };
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
  .or-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:12px}.or-reply{margin:10px 0;padding:8px 10px;border:1px solid #ffd54f;border-radius:10px;background:#fffdf3;color:#2b2b2b}.or-reply summary{cursor:pointer;font-weight:800;font-size:.86rem}.or-reply textarea{width:100%;box-sizing:border-box;margin-top:8px;font:500 .9rem 'Manrope',sans-serif;padding:8px;border:1px solid #d8d2bd;border-radius:8px}.or-warn{margin-top:8px;padding:6px 10px;border-radius:8px;background:#fbe7e4;color:#a02d20;font-weight:700;font-size:.84rem}
  mark{background:#ffd54f;color:#1c1c1c;border-radius:3px;padding:0 2px;font-weight:700}mark.m-diet{background:#ffb4a8}.or-clean{background:#fff3cd;color:#4a3b00;border:1px solid #ffd54f;border-radius:14px;padding:12px 14px;margin-bottom:12px}
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
  const n = [...OR.map.values()].filter(e => !e.rec.archived && (e.rec.status || 'Pending') === 'Pending').length, b = orEl('ordBadge');
  if (b){ b.textContent = n; b.style.display = n ? '' : 'none'; }
}

/* ---------------- list ---------------- */
function orServe(i){ const m = OR_MEAL[i.meal]; return [orDate(i.date), m ? 'for ' + m : (i.time ? 'at ' + orT12(i.time) : '')].filter(Boolean).join(' · '); }

/* Notes that need a reply from you: dietary / allergy, special time, special preparation. Matched words are highlighted. */
const OR_DIET = /\b(allerg\w*|intoleran\w*|gluten|coeliac|celiac|lactose|dairy|milk|nuts?|peanuts?|almonds?|cashews?|eggs?|shell\s?fish|prawns?|seafood|fish|soy\w*|sesame|vegan|vegetarian|halal|pork|beef|chill?(?:i|y|ies|is)\w*|spic(?:y|e|es)|mild|onions?|garlic|sugar|salt|diabet\w*|jain|pregnan\w*|baby|toddler|child\w*|no\s+\w+|without\s+\w+|not\s+\w+|less\s+\w+|extra\s+\w+)\b/gi;
const OR_TIME = /\b(\d{1,2}[:.]\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|early|earlier|late|later|before|after|arriv\w*|check[\s-]?out|midnight|noon|o'?clock|asap|urgent)\b/gi;
const OR_PREP = /\b(separate\w*|birthday|anniversary|cake|candles?|surprise|celebrat\w*|pack\w*|take\s?away|picnic|deliver\w*|serve\w*|well[\s-]?done|special)\b/gi;
function orHits(text){
  const hits = [];
  [['diet', OR_DIET], ['time', OR_TIME], ['prep', OR_PREP]].forEach(([k, re]) => { for (const m of text.matchAll(re)) hits.push({ s:m.index, e:m.index + m[0].length, k:k }); });
  hits.sort((a, b) => a.s - b.s || b.e - a.e);
  const out = []; let end = -1; hits.forEach(h => { if (h.s >= end){ out.push(h); end = h.e; } });
  return out;
}
function orMark(text, hits){ let o = '', p = 0; hits.forEach(h => { o += esc(text.slice(p, h.s)) + `<mark class="m-${h.k}">${esc(text.slice(h.s, h.e))}</mark>`; p = h.e; }); return o + esc(text.slice(p)); }
function orFlags(r){
  const f = [], note = String(r.note || ''), hits = note ? orHits(note) : [], k = new Set(hits.map(h => h.k));
  if (k.has('diet')) f.push({ k:'diet', t:'⚠ Dietary / allergy request' });
  if (k.has('time')) f.push({ k:'time', t:'⏰ Special time request' });
  if (k.has('prep')) f.push({ k:'prep', t:'📝 Special preparation request' });
  if (note.trim() && !k.size) f.push({ k:'note', t:'📝 Guest note' });
  if (r.via === 'pasted') f.push({ k:'pasted', t:'📋 Pasted by ' + (r.pastedBy || 'admin') + ' — the guest saw no on-screen confirmation' });
  const big = (r.items || []).find(i => i.qty > 10); if (big) f.push({ k:'qty', t:`🔢 Large quantity (${big.qty}× ${big.name})` });
  if (r.receivedOutsideHours) f.push({ k:'hours', t:'🕒 Received outside kitchen hours' });
  if (r.priceAdjusted) f.push({ k:'price', t:'💲 Price differed from the guest screen — menu price used' });
  return { list:f, hits:hits, note:note };
}
const orIsFlagged = r => !r.archived && (r.status || 'Pending') === 'Pending' && orFlags(r).list.length > 0;   // stays flagged until the order is marked Served

function orDraft(r, F){                                              // suggested reply — you edit it, then send it yourself
  const items = (r.items || []).map(i => `• ${i.qty}× ${i.name}${i.sub ? ' (' + i.sub + ')' : ''} — ${orServe(i).replace(' · for ', ', ').replace(' · at ', ' at ')}`).join('\n');
  const k = new Set(F.list.map(x => x.k)), q = F.note.trim(); let mid;
  if (k.has('diet')) mid = `We have noted your request: "${q}".\nWe will check this with our chef and confirm with you shortly.` + (k.has('time') ? '\nWe will also confirm the timing with you.' : '');
  else if (k.has('time')) mid = `We have noted your request: "${q}".\nWe will confirm the timing with you shortly.`;
  else if (q) mid = `We have noted your message: "${q}".\nWe will confirm with you shortly.`;
  else if (k.has('pasted')) mid = 'Your order was sent to us by message and we have entered it into our system.';
  else mid = 'We will confirm the details with our kitchen and come back to you shortly.';
  if (k.has('qty') && q) mid += '\nAs this is a large order, we will also confirm the quantities with our kitchen.';
  return `Hello ${String(r.name || '').trim().split(/\s+/)[0] || 'there'}, thank you for your order ${r.id} at Gaia Lake Kandalama.\n\n${items}\n\n${mid}\n\nThank you,\nGaia Lake Kandalama`;
}
function orReplyBox(r, F){
  const id = esc(r.id), rep = r.reply, txt = OR.drafts[r.id] !== undefined ? OR.drafts[r.id] : orDraft(r, F), open = OR.open[r.id] !== undefined ? OR.open[r.id] : !rep;
  return `<details class="or-reply" data-id="${id}" ${open ? 'open' : ''}><summary>${rep ? '✔ Replied by ' + esc(rep.by) + ' · ' + esc(orWhen(rep.at)) + ' — tap to open the message again' : '💬 Suggested reply to the guest — edit it, then send'}</summary>
    ${F.list.some(x => x.k === 'diet') ? '<div class="or-warn">⚠ Dietary / allergy request — confirm with the chef before you reply, before the meal is prepared and before it is served.</div>' : ''}
    <textarea class="or-draft" data-id="${id}" rows="9">${esc(txt)}</textarea>
    <div class="btn-row" style="gap:6px;margin-top:6px;"><button class="btn btn-sm btn-primary" data-or="wa" data-id="${id}">WhatsApp guest</button><button class="btn btn-sm" data-or="copy" data-id="${id}">Copy</button>
      ${rep ? `<button class="btn btn-sm" data-or="unreply" data-id="${id}">Undo “replied”</button>` : `<button class="btn btn-sm" data-or="reply" data-id="${id}">Mark as replied (no message sent)</button>`}</div></details>`;
}
function orCard(r, amendedBy){
  const st = r.status || 'Pending', fl = [], last = (r.history || []).slice(-1)[0], F = orFlags(r), flagged = orIsFlagged(r);
  if (r.verified) fl.push(['✔ Verified login' + (r.basis ? ' · ' + r.basis : '') + (r.bbValue ? ' · plan-included ' + orUsd(r.bbValue) + ' waived' : ''), 'ok']);
  else if (r.planIncluded) fl.push(['⚠ Marked BB — verify the room plan before billing (' + orUsd(r.bbValue) + ' waived)', 'warn']);
  F.list.forEach(x => fl.push([x.t, 'warn']));
  if (r.amend) fl.push(['✎ Amends ' + r.amend, '']);
  if (amendedBy && amendedBy.length) fl.push(['Later amended by ' + amendedBy.join(', '), '']);
  return `<div class="or-card">
    <div class="or-head"><div><span class="or-id">${esc(r.id)}</span> <span class="or-st ${esc(st)}">${esc(st)}</span>${flagged ? (r.reply ? ' <span class="or-st Paid">Replied ✔</span>' : ' <span class="or-st" style="background:#ffd54f;color:#4a3b00;">Needs reply</span>') : ''}<br>
      <strong>${esc(r.name)}</strong> · ${esc(r.room)} · <a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></div>
      <div style="text-align:right;"><strong>${orUsd(r.total)}</strong><br><span class="hint">Received ${esc(orWhen(r.received))}</span></div></div>
    ${fl.length ? `<div class="or-flags">${fl.map(f => `<span class="or-flag ${f[1]}">${esc(f[0])}</span>`).join('')}</div>` : ''}
    <ul class="or-items">${(r.items || []).map(i => `<li>${i.qty}× <strong>#${String(i.code).padStart(3, '0')}</strong> ${esc(i.name)}${i.sub ? ' – ' + esc(i.sub) : ''}${i.bbWaived ? ' <em>(included in plan)</em>' : ''}<small>${esc(orServe(i))}</small></li>`).join('')}</ul>
    ${F.note ? `<div class="or-note"><strong>Guest Note:</strong> ${orMark(F.note, F.hits)}</div>` : ''}
    ${flagged ? orReplyBox(r, F) : ''}
    <div class="or-foot"><div class="btn-row" style="gap:6px;">${OR_ST.map(s => `<button class="btn btn-sm ${s === st ? 'btn-primary' : ''}" data-or="st" data-id="${esc(r.id)}" data-s="${s}" ${s === st ? 'disabled' : ''}>${s}</button>`).join('')}
        ${r.archived ? `<button class="btn btn-sm" data-or="unarch" data-id="${esc(r.id)}">Restore</button>` : `<button class="btn btn-sm" data-or="arch" data-id="${esc(r.id)}">Archive</button>`}</div>
      <span class="hint">${r.archived ? 'Archived ' + esc(orWhen(r.archived.at)) + ' · ' : ''}${last ? esc(last.status) + ' · ' + esc(orWhen(last.at)) + ' · ' + esc(last.by || '') : ''}</span></div></div>`;
}
const orPaidAt = r => { const h = (r.history || []).filter(x => x.status === 'Paid').pop(); return h ? h.at : ((r.archived || {}).at || ''); };
const orDue = r => !!r.archived && Date.now() - new Date(orPaidAt(r)).getTime() >= 30 * 864e5 && !(r.keepUntil && new Date(r.keepUntil).getTime() > Date.now());   // archived, paid over a month ago, not snoozed
function orList_render(){
  const box = orEl('ordList'); if (!box) return;
  const a = document.activeElement; if (a && a.classList && a.classList.contains('or-draft')){ OR.dirty = true; return; }   // never redraw while you are typing a reply
  const all = [...OR.map.values()].map(e => e.rec).sort((a, b) => String(b.received).localeCompare(String(a.received)));
  const live = all.filter(r => !r.archived), arch = all.filter(r => r.archived), stOf = r => r.status || 'Pending';
  const by = {}; all.forEach(r => { if (r.amend){ (by[r.amend] = by[r.amend] || []).push(r.id); } });
  const q = OR.q.trim().toLowerCase();
  const hit = r => !q || [r.id, r.name, r.room, r.phone, r.note, ...(r.items || []).map(i => i.name + ' #' + i.code)].join(' ').toLowerCase().includes(q);
  const cnt = { Flagged:live.filter(orIsFlagged).length, Archived:arch.length }; OR_ST.forEach(s => { cnt[s] = live.filter(r => stOf(r) === s).length; });
  orEl('ordChips').innerHTML = [...OR_ST.slice(0, 1), 'Flagged', ...OR_ST.slice(1), 'All', 'Archived'].map(s => `<button class="or-chip ${OR.filter === s ? 'on' : ''}" data-or="chip" data-s="${s}">${s === 'Flagged' ? '⚠ Flagged' : s}${cnt[s] !== undefined ? ' (' + cnt[s] + ')' : ''}</button>`).join('');
  let pool = OR.filter === 'Archived' ? arch : OR.filter === 'All' ? live : OR.filter === 'Flagged' ? live.filter(orIsFlagged) : live.filter(r => stOf(r) === OR.filter);
  const rows = pool.filter(hit);
  if (OR.filter === 'Flagged') rows.sort((a, b) => (!!a.reply - !!b.reply) || String(b.received).localeCompare(String(a.received)));   // waiting for your reply first
  const due = arch.filter(orDue);
  box.innerHTML = (OR.err ? `<div class="or-err">${esc(OR.err)}</div>` : '') +
    (due.length ? `<div class="or-clean"><strong>🗑 ${due.length} archived order${due.length > 1 ? 's were' : ' was'} paid more than a month ago.</strong> Delete ${due.length > 1 ? 'them' : 'it'}?
      <div class="btn-row" style="gap:6px;margin:8px 0 4px;"><button class="btn btn-sm" style="background:#c0392b;color:#fff;border-color:#c0392b;" data-or="cleandel">Yes, delete</button><button class="btn btn-sm" data-or="cleankeep">No, keep for now</button><button class="btn btn-sm" data-or="chip" data-s="Archived">View them</button></div>
      <span class="hint">Deleted orders go to Google Drive's Trash, where they stay for 30 days. “Keep” asks again in a month.</span></div>` : '') +
    (rows.length ? rows.map(r => orCard(r, by[r.id])).join('') : `<div class="panel-box"><p class="hint">${!OR.loaded ? 'Loading orders…' : all.length ? 'No orders match this filter.' : 'No orders yet.'}</p></div>`);
  const ab = orEl('ordArch'); if (ab){ const can = ['Served', 'Billed', 'Paid'].includes(OR.filter) && rows.length; ab.style.display = can ? '' : 'none'; ab.textContent = `Archive all shown (${rows.length})`; }
  orEl('ordMore').style.display = OR.next ? '' : 'none';
  orEl('ordStamp').textContent = OR.loaded ? 'Updated ' + new Date().toLocaleTimeString('en-GB', { timeZone:'Asia/Colombo', hour:'2-digit', minute:'2-digit' }) + ' · refreshes by itself' : '';
}
async function orEdit(id, fn){                                       // read the order file again, change it, save it (never overwrites a newer copy)
  const e = OR.map.get(id + '.json'); if (!e) throw new Error('Order not found');
  const rec = await downloadJsonFile(e.fileId); fn(rec); await updateJsonFile(e.fileId, rec); e.rec = rec; e.mod = ''; return rec;
}
async function orEach(ids, fn){ const q = ids.slice(); let n = 0; await Promise.all(Array.from({ length:Math.min(4, q.length) }, async () => { while (q.length){ const id = q.shift(); try{ await fn(id); n++; }catch(e){ console.warn(id, e); OR.lastErr = e.message; } } })); return n; }
async function orReply(id, on){
  OR.open[id] = !on;
  try{ await orEdit(id, r => { if (on) r.reply = { at:new Date().toISOString(), by:userEmail }; else delete r.reply; }); orBadge(); orList_render(); }
  catch(e){ toast('Could not save: ' + e.message); }
}
async function orArchive(ids, on){
  OR.lastErr = ''; const n = await orEach(ids, id => orEdit(id, r => { if (on) r.archived = { at:new Date().toISOString(), by:userEmail }; else { delete r.archived; delete r.keepUntil; } }));
  toast(n + (on ? ' archived' : ' restored') + (n < ids.length ? ' — some failed: ' + OR.lastErr : '')); orBadge(); orList_render();
}
async function orClean(del){
  const due = [...OR.map.values()].filter(e => orDue(e.rec)); if (!due.length) return;
  OR.lastErr = '';
  const n = await orEach(due.map(e => e.rec.id), async id => {
    const e = OR.map.get(id + '.json');
    if (del){ await trashFile(e.fileId); OR.map.delete(id + '.json'); }
    else await orEdit(id, r => { r.keepUntil = new Date(Date.now() + 30 * 864e5).toISOString(); });
  });
  toast(del ? n + ' deleted (in Drive Trash for 30 days)' + (n < due.length ? ' — ' + (due.length - n) + ' could not be deleted: ' + OR.lastErr + ' (sign in with the account that owns the orders)' : '') : n + ' kept — I will ask again in a month');
  orBadge(); orList_render();
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
    <div class="or-bar"><span id="ordChips" style="display:contents;"></span><input type="search" id="ordQ" placeholder="Search name, room, order no, dish…"><button class="btn btn-sm" data-or="refresh">⟳ Refresh</button><button class="btn btn-sm" id="ordArch" data-or="archall" style="display:none;">Archive all shown</button></div>
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
      else if (a === 'wa'){ const id = b.dataset.id, e = OR.map.get(id + '.json'), ta = box.querySelector('textarea[data-id="' + id + '"]'); if (!e || !ta) return;
        const num = String(e.rec.phone || '').replace(/\D/g, '').replace(/^00/, ''); window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(ta.value), '_blank', 'noopener'); orReply(id, true); }
      else if (a === 'copy'){ const ta = box.querySelector('textarea[data-id="' + b.dataset.id + '"]'); if (ta && navigator.clipboard) navigator.clipboard.writeText(ta.value).then(() => toast('Message copied'), () => toast('Could not copy')); }
      else if (a === 'reply') orReply(b.dataset.id, true);
      else if (a === 'unreply') orReply(b.dataset.id, false);
      else if (a === 'arch'){ const r = (OR.map.get(b.dataset.id + '.json') || {}).rec; if (r && (r.status || 'Pending') !== 'Paid' && !confirm('This order is not marked Paid yet. Archive it anyway?')) return; orArchive([b.dataset.id], true); }
      else if (a === 'unarch') orArchive([b.dataset.id], false);
      else if (a === 'archall'){ const ids = [...OR.map.values()].map(e => e.rec).filter(r => !r.archived && (r.status || 'Pending') === OR.filter).map(r => r.id); if (!ids.length) return;
        if (confirm('Archive all ' + ids.length + ' ' + OR.filter + ' order(s)? They move out of this list into the Archived tab (nothing is deleted).')) orArchive(ids, true); }
      else if (a === 'cleandel') orClean(true);
      else if (a === 'cleankeep') orClean(false);
      else if (a === 'clear'){ orEl('ordPaste').value = ''; orEl('ordPastePreview').innerHTML = ''; OR.paste = null; }
    });
    box.addEventListener('input', ev => { if (ev.target.classList.contains('or-draft')) OR.drafts[ev.target.dataset.id] = ev.target.value; });
    box.addEventListener('toggle', ev => { if (ev.target.classList && ev.target.classList.contains('or-reply')) OR.open[ev.target.dataset.id] = ev.target.open; }, true);
    box.addEventListener('focusout', ev => { if (ev.target.classList && ev.target.classList.contains('or-draft')) setTimeout(() => { const a = document.activeElement; if (OR.dirty && !(a && a.classList && a.classList.contains('or-draft'))){ OR.dirty = false; orList_render(); } }, 250); });
    orEl('ordQ').oninput = ev => { OR.q = ev.target.value; orList_render(); };
  }
  orList_render(); orStart(); orRefresh();
}
