/* Gaia Lake Menu — order receiver (Google Apps Script).
   Deploy: Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
   Script Properties (Project Settings): MENU_FILE_ID, ORDERS_FOLDER_ID, ORDER_EMAIL, TELEGRAM_TOKEN, TELEGRAM_CHAT, GUESTLOGIN_FILE_ID (v3.0; set by setupGuestLoginTest) */
function out(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function reject(msg){ return out({ ok:false, reject:true, error:msg }); }
function doGet(){ return out({ ok:true, service:'gaia-lake-orders' }); }
function doPost(e){
  try{
    const P = PropertiesService.getScriptProperties(), o = JSON.parse(e.postData.contents);
    if (o.action === 'login' || o.action === 'check') return guestLogin(o, P);   // v3.0 guest login (separate from ordering)
    if (o.website) return out({ ok:true, id:o.id });                       // hidden trap field filled = bot; pretend success
    if (!/^GL-[A-Z0-9]{6,10}$/.test(o.id || '')) return reject('Invalid order reference.');
    let name = String(o.name||'').trim(), room = String(o.room||'').trim(), phone = String(o.phone||'').replace(/[\s\-()]/g,'');
    if (name.length < 2 || name.length > 60) return reject('Please enter your name.');
    if (room.length < 1 || room.length > 40 || /[<>]/.test(room)) return reject('Please choose where you are staying.');
    if (!/^\+?\d{7,15}$/.test(phone)) return reject('Please enter a valid phone number.');
    if (!Array.isArray(o.items) || !o.items.length || o.items.length > 40) return reject('The order is empty.');
    const lock = LockService.getScriptLock(); lock.waitLock(25000);       // a retry waits here until the first attempt has saved the order
    let rec;
    try{
    const folder = DriveApp.getFolderById(P.getProperty('ORDERS_FOLDER_ID'));
    if (folder.getFilesByName(o.id + '.json').hasNext()) return out({ ok:true, id:o.id });   // already received (retry)
    const cache = CacheService.getScriptCache(), rk = 'rl' + phone, n = Number(cache.get(rk) || 0);
    if (n >= 5) return reject('Too many orders in a short time — please call us.');
    cache.put(rk, String(n + 1), 600);
    const menu = JSON.parse(DriveApp.getFileById(P.getProperty('MENU_FILE_ID')).getBlob().getDataAsString());
    const S = menu.settings || {};
    if (S.acceptingOrders === false) return reject('Ordering is paused right now — please call us.');
    let G = null;                                                          // login mode — the guest's own booking record is the source of truth
    if (S.requireGuestLogin === true){
      const f = glFind(P, String(o.gc || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), glName(o.name), glPhone(o.phone));
      if (!f || !f.match) return reject('Your login is no longer valid. Please log in again.');
      const st = glState(f.rec); if (st !== 'ok') return reject(st === 'expired' ? 'Your login code has expired.' : 'Your login code is no longer active.');
      G = f.rec; name = G.name; phone = '+' + glPhone(G.phone); room = G.group ? (G.groupLabel || 'Group') : (G.room || '');
    }
    const nowSL = Utilities.formatDate(new Date(), 'Asia/Colombo', 'HH:mm'), today = Utilities.formatDate(new Date(), 'Asia/Colombo', 'yyyy-MM-dd');
    const ask = true, slot = { B:S.breakfastTime || '07:30', L:S.lunchTime || '12:30', D:S.dinnerTime || '19:30' };
    const cutoff = S.sameDayCutoff || '19:00', openT = S.kitchenOpen || '06:00', lastT = S.lastDining || '21:00';
    const minDate = nowSL >= cutoff ? Utilities.formatDate(new Date(Date.now() + 86400000), 'Asia/Colombo', 'yyyy-MM-dd') : today;
    const dt = /^\d{4}-\d{2}-\d{2}$/, tm = /^\d{2}:\d{2}$/;
    const bbCats = new Set((menu.categories || []).filter(c => c.bbIncluded).map(c => c.id));
    const isGroup = G ? !!G.group : (S.groupLabels || []).some(g => String(g).trim().toLowerCase() === room.toLowerCase()), sitting = {}, MNAME = { B:'Breakfast', L:'Lunch', D:'Dinner' };   // group orders: one item per Breakfast/Lunch/Dinner sitting
    const catMeal = {}; (menu.categories || []).forEach(c => { const m = (c.meal !== undefined ? c.meal : (c.bfOnly !== undefined ? (c.bfOnly ? 'B' : '') : (c.bbIncluded ? 'B' : ''))); if (m) catMeal[c.id] = m; });   // category -> fixed meal (B/L/D)
    const planIncluded = G ? true : !!o.planIncluded;
    let total = 0, bbValue = 0;                                            // all amounts are USD
    const items = [];
    for (const it of o.items){                                             // prices always come from the live menu, never from the guest's device
      const d = (menu.dishes || []).find(x => x.active !== false && Number(x.code) === Number(it.c));
      if (!d) return reject('An item is no longer on the menu (#' + it.c + ').');
      const sub = it.s ? (d.subOptions || []).find(x => x.name === it.s) : null;
      if ((d.subOptions || []).length && !sub) return reject('Please choose an option for ' + d.name + '.');
      const unit = Number(((sub || d).price || {}).usd) || 0, q = Math.floor(Number(it.q));
      if (!(unit > 0)) return reject('The price of ' + d.name + ' is not available.');
      if (!(q >= 1 && q <= 50)) return reject('Invalid quantity.');
      let date = '', time = '', meal = '';
      if (ask){
        date = it.d || o.date;
        meal = catMeal[d.categoryId] || String(it.m || o.meal || '');   // a fixed-meal category is always served at that meal's time
        if (['B','L','D','T'].indexOf(meal) < 0) return reject('Please choose Breakfast, Lunch, Dinner or a specific time.');
        time = meal === 'T' ? (it.t || o.time) : slot[meal];                // Specific time = the guest's clock time; otherwise the meal's reference time
        if (!dt.test(date || '') || !tm.test(time || '') || date < today) return reject('Please check the dining date and time.');
        if (date < minDate) return reject('Same-day orders are closed for today. Please choose tomorrow or a later date.');
        if (meal === 'T' && (time < openT || time > lastT)) return reject('A specific time must be between ' + openT + ' and ' + lastT + '. For any other time, please add a note.');
        if (meal === 'T' && date === today && time < nowSL) return reject('That time has already passed today. Please choose a later time or another date.');
        if (G){                                                            // login mode: stay window and set-menu rules
          if (G.checkin && date < G.checkin) return reject('Please choose a date from your check-in date (' + G.checkin + ').');
          if (date > G.checkout) return reject('Orders can only be placed up to your check-out date (' + G.checkout + ').');
          if (catMeal[d.categoryId] && today === G.checkout) return reject('Breakfast, Lunch and Dinner can no longer be ordered today (check-out day).');
          if ((G.fixed || []).indexOf(d.categoryId) >= 0) return reject('That category is a set menu for your stay — no selection needed.');
        }
      }
      if (isGroup){                                                        // group orders: one item per Breakfast/Lunch/Dinner sitting
        if (ask && catMeal[d.categoryId]){
          const sk = date + '|' + meal, ik = d.code + '|' + (sub ? sub.name : '');
          if (sitting[sk] && sitting[sk] !== ik) return reject('Group orders can include only one item for each ' + MNAME[meal] + ' sitting. To order differently, please call the manager' + ((menu.profile || {}).phone ? ' on ' + menu.profile.phone : '') + '.');
          sitting[sk] = ik;
        }
      }
      const isBB = G ? (GL_PLAN[G.basis] || []).indexOf(catMeal[d.categoryId]) >= 0 : planIncluded && bbCats.has(d.categoryId), lineTotal = unit * q;
      items.push({ code:d.code, name:d.name, sub:sub ? sub.name : '', qty:q, unit:unit, date:date, time:time, meal:meal, bbWaived:isBB });
      if (isBB) bbValue += lineTotal; else total += lineTotal;
    }
    total = Math.round(total * 100) / 100; bbValue = Math.round(bbValue * 100) / 100;
    const outsideHours = !(openT <= (S.kitchenClose || '22:00') ? (nowSL >= openT && nowSL < (S.kitchenClose || '22:00')) : (nowSL >= openT || nowSL < (S.kitchenClose || '22:00')));
    rec = { id:o.id, amend:o.amend || '', received:new Date().toISOString(), status:'Pending', currency:'USD', name:name, room:room, phone:phone,
      date:o.date || '', meal:String(o.meal || ''), time:o.time || '', note:String(o.note || '').slice(0,300), items:items, total:total, planIncluded:planIncluded, bbValue:bbValue, basis:G ? G.basis : '', verified:!!G,
      priceAdjusted:Math.round(Number(o.total) * 100) !== Math.round(total * 100), via:'web', receivedOutsideHours:outsideHours };
    folder.createFile(o.id + '.json', JSON.stringify(rec), 'application/json');
    }finally{ lock.releaseLock(); }                                        // released before the slow email/Telegram calls
    notify(rec, P);
    return out({ ok:true, id:o.id });
  }catch(err){ return out({ ok:false, error:'Server error' }); }
}
function notify(r, P){
  const MN = { B:'FOR BREAKFAST', L:'FOR LUNCH', D:'FOR DINNER' };
  const text = (r.verified ? '✔ VERIFIED GUEST LOGIN — plan ' + r.basis + (r.bbValue ? ' (plan-included value USD ' + Number(r.bbValue).toFixed(2) + ' waived)' : '') + '\n' : r.planIncluded ? '⚠ GUEST MARKED BB — VERIFY ROOM PLAN WITH MANAGER BEFORE BILLING (breakfast value USD ' + Number(r.bbValue).toFixed(2) + ' waived)\n' : '') +
    (r.receivedOutsideHours ? '⚠ Received outside kitchen hours\n' : '') +
    'NEW ORDER ' + r.id + (r.amend ? ' (AMENDS ' + r.amend + ')' : '') + '\n' + r.name + ' · ' + r.room + ' · ' + r.phone + '\n' +
    r.items.map(i => i.qty + 'x #' + ('00' + i.code).slice(-3) + ' ' + i.name + (i.sub ? ' – ' + i.sub : '') + (i.bbWaived ? ' (BB — included)' : '') + (i.date ? ' [' + i.date + ' ' + (MN[i.meal] || i.time) + ']' : '')).join('\n') +
    '\nTotal USD ' + Number(r.total).toFixed(2) + (r.note ? '\nGuest Note: ' + r.note : '') + (r.priceAdjusted ? '\n⚠ Price differed from guest screen — menu price used' : '');
  try{ UrlFetchApp.fetch('https://api.telegram.org/bot' + P.getProperty('TELEGRAM_TOKEN') + '/sendMessage',
        { method:'post', payload:{ chat_id:P.getProperty('TELEGRAM_CHAT'), text:text }, muteHttpExceptions:true }); }catch(e){}
  try{ MailApp.sendEmail(P.getProperty('ORDER_EMAIL'), 'Food order ' + r.id + ' – ' + r.room, text); }catch(e){}
}

/* ===================== Guest login (v3.0) =====================
   Records live in a PRIVATE guestlogin.json (id in Script Property GUESTLOGIN_FILE_ID); the browser never reads it.
   Record: { id, code, name, phone, checkin, checkout, basis:'RO|BB|HB|FB', group:bool, room, groupLabel, fixed:[category ids], revoked:bool } */
const GL_PLAN = { RO:[], BB:['B'], HB:['B','D'], FB:['B','L','D'] };   // meals included in each booking basis
const GL_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', GL_CUTOFF = '09:00', GL_GLOBAL_MAX = 30;
const GL_BAD = 'Name, phone number or code doesn\u2019t match our records.', GL_CONTACT = 'Too many failed attempts. Please contact Gaia Lake management for a new code.';
function glName(s){ return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); }
function glPhone(s){ return String(s || '').replace(/\D/g, '').replace(/^00/, ''); }
function glAnswer(g){ return { ok:true, guest:{ name:g.name, phone:g.phone, room:g.room || '', groupLabel:g.groupLabel || '', group:!!g.group, basis:g.basis, checkin:g.checkin || '', checkout:g.checkout, fixed:g.fixed || [], expires:g.checkout + ' ' + GL_CUTOFF } }; }
function glFind(P, code, nm, ph){                                          // -> { rec (code exists), match (all three agree) }
  const id = P.getProperty('GUESTLOGIN_FILE_ID'); if (!id) return null;
  const list = (JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString()).guests) || [];
  const rec = list.find(g => String(g.code).toUpperCase() === code) || null;
  return { rec:rec, match: !!rec && glName(rec.name) === nm && glPhone(rec.phone) === ph };
}
function glState(g){                                                       // 'ok' | 'revoked' | 'expired'
  if (g.revoked) return 'revoked';
  const now = new Date(), d = Utilities.formatDate(now, 'Asia/Colombo', 'yyyy-MM-dd'), t = Utilities.formatDate(now, 'Asia/Colombo', 'HH:mm');
  return (d > g.checkout || (d === g.checkout && t >= GL_CUTOFF)) ? 'expired' : 'ok';
}
function guestLogin(o, P){
  const quiet = o.action === 'check';                                      // quiet re-check: never counts failures
  const code = String(o.code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), nm = glName(o.name), ph = glPhone(o.phone);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    const cache = CacheService.getScriptCache(), fk = 'glf_' + (code || 'x'), now = Date.now();
    const found = glFind(P, code, nm, ph);
    if (!found) return out({ ok:false, error:'Guest login is not set up yet.' });
    if (!quiet){
      if (cache.get('glp')) return out({ ok:false, error:'Login is busy right now. Please try again in a few minutes, or contact Gaia Lake management.' });
      const st = JSON.parse(cache.get(fk) || '{"n":0,"stage":1,"until":0}');
      if (st.stage > 2 || P.getProperty('gld_' + code)) return out({ ok:false, error:GL_CONTACT });
      if (st.until > now) return out({ ok:false, error:'Too many attempts. Please try again in ' + Math.ceil((st.until - now) / 60000) + ' minutes.' });
      if (!found.match){
        let msg = GL_BAD; st.n++;
        if (st.n >= 3){
          if (st.stage === 1){ st.stage = 2; st.n = 0; st.until = now + 15 * 60000; msg = 'Too many attempts. Please try again in 15 minutes.'; }
          else { st.stage = 3; msg = GL_CONTACT; if (found.rec) P.setProperty('gld_' + code, '1'); }
        }
        cache.put(fk, JSON.stringify(st), 21600);
        const gn = Number(cache.get('glg') || 0) + 1; cache.put('glg', String(gn), 600);
        if (gn >= GL_GLOBAL_MAX){ cache.put('glp', '1', 300); cache.remove('glg'); }   // everyone pauses a few minutes
        return out({ ok:false, error:msg });
      }
      cache.remove(fk);
    } else if (!found.match) return out({ ok:false, reason:'invalid', error:GL_BAD });
    const s = glState(found.rec);
    if (s === 'expired') return out({ ok:false, reason:'expired', error:'This code has expired (valid until ' + GL_CUTOFF + ' on the check-out date).' });
    if (s === 'revoked') return out({ ok:false, reason:'revoked', error:'This code is no longer active. Please contact reception for a new code.' });
    return out(glAnswer(found.rec));
  }finally{ lock.releaseLock(); }
}
/* ONE-TIME TEST HELPER: add Script Property GUESTLOGIN_FOLDER_ID (the private folder), run once, read the code in the Execution log. */
function setupGuestLoginTest(){
  const P = PropertiesService.getScriptProperties(), folder = DriveApp.getFolderById(P.getProperty('GUESTLOGIN_FOLDER_ID'));
  let code = ''; for (let i = 0; i < 6; i++) code += GL_CODE_CHARS.charAt(Math.floor(Math.random() * GL_CODE_CHARS.length));
  const rec = { code:code, name:'Test Guest', phone:'+94771234567', checkin:'2026-10-03', checkout:'2026-10-20', basis:'BB', group:false, room:'Room 1', groupLabel:'', fixed:[], revoked:false };
  const f = folder.createFile('guestlogin.json', JSON.stringify({ guests:[rec] }), 'application/json');
  P.setProperty('GUESTLOGIN_FILE_ID', f.getId());
  Logger.log('File ID ' + f.getId() + ' | Test login: Test Guest / +94771234567 / ' + code);
}
