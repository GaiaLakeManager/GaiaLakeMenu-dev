/* Gaia Lake Menu — order receiver (Google Apps Script).
   Deploy: Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
   Script Properties (Project Settings): MENU_FILE_ID, ORDERS_FOLDER_ID, ORDER_EMAIL, TELEGRAM_TOKEN, TELEGRAM_CHAT */
function out(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function reject(msg){ return out({ ok:false, reject:true, error:msg }); }
function doGet(){ return out({ ok:true, service:'gaia-lake-orders' }); }
function doPost(e){
  try{
    const P = PropertiesService.getScriptProperties(), o = JSON.parse(e.postData.contents);
    if (o.website) return out({ ok:true, id:o.id });                       // hidden trap field filled = bot; pretend success
    if (!/^GL-[A-Z0-9]{6,10}$/.test(o.id || '')) return reject('Invalid order reference.');
    const name = String(o.name||'').trim(), room = String(o.room||'').trim(), phone = String(o.phone||'').replace(/[\s\-()]/g,'');
    if (name.length < 2 || name.length > 60) return reject('Please enter your name.');
    if (!/^[A-Za-z0-9\-\/ ]{1,24}$/.test(room)) return reject('Please enter a valid room number.');
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
    const nowSL = Utilities.formatDate(new Date(), 'Asia/Colombo', 'HH:mm'), today = Utilities.formatDate(new Date(), 'Asia/Colombo', 'yyyy-MM-dd');
    const cutoff = S.sameDayCutoff || '19:00', openT = S.kitchenOpen || '06:00', lastT = S.lastDining || '21:00';
    const minDate = nowSL >= cutoff ? Utilities.formatDate(new Date(Date.now() + 86400000), 'Asia/Colombo', 'yyyy-MM-dd') : today;
    const dt = /^\d{4}-\d{2}-\d{2}$/, tm = /^\d{2}:\d{2}$/;
    const bbCats = new Set((menu.categories || []).filter(c => c.bbIncluded).map(c => c.id));
    const planIncluded = !!o.planIncluded;
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
      const date = it.d || o.date, time = it.t || o.time;
      if (!dt.test(date || '') || !tm.test(time || '') || date < today) return reject('Please check the dining date and time.');
      if (date < minDate) return reject('Same-day orders are closed for today. Please choose tomorrow or a later date.');
      if (time < openT || time > lastT) return reject('Dining time must be between ' + openT + ' and ' + lastT + '. For any other time, please add a note.');
      const isBB = planIncluded && bbCats.has(d.categoryId), lineTotal = unit * q;
      items.push({ code:d.code, name:d.name, sub:sub ? sub.name : '', qty:q, unit:unit, date:date, time:time, bbWaived:isBB });
      if (isBB) bbValue += lineTotal; else total += lineTotal;
    }
    total = Math.round(total * 100) / 100; bbValue = Math.round(bbValue * 100) / 100;
    const outsideHours = !(openT <= (S.kitchenClose || '22:00') ? (nowSL >= openT && nowSL < (S.kitchenClose || '22:00')) : (nowSL >= openT || nowSL < (S.kitchenClose || '22:00')));
    rec = { id:o.id, amend:o.amend || '', received:new Date().toISOString(), status:'Pending', currency:'USD', name:name, room:room, phone:phone,
      date:o.date, time:o.time, note:String(o.note || '').slice(0,300), items:items, total:total, planIncluded:planIncluded, bbValue:bbValue,
      priceAdjusted:Math.round(Number(o.total) * 100) !== Math.round(total * 100), via:'web', receivedOutsideHours:outsideHours };
    folder.createFile(o.id + '.json', JSON.stringify(rec), 'application/json');
    }finally{ lock.releaseLock(); }                                        // released before the slow email/Telegram calls
    notify(rec, P);
    return out({ ok:true, id:o.id });
  }catch(err){ return out({ ok:false, error:'Server error' }); }
}
function notify(r, P){
  const text = (r.planIncluded ? '⚠ GUEST MARKED BB — VERIFY ROOM PLAN WITH MANAGER BEFORE BILLING (breakfast value USD ' + Number(r.bbValue).toFixed(2) + ' waived)\n' : '') +
    (r.receivedOutsideHours ? '⚠ Received outside kitchen hours\n' : '') +
    'NEW ORDER ' + r.id + (r.amend ? ' (AMENDS ' + r.amend + ')' : '') + '\n' + r.name + ' · Room ' + r.room + ' · ' + r.phone + '\n' +
    r.items.map(i => i.qty + 'x #' + ('00' + i.code).slice(-3) + ' ' + i.name + (i.sub ? ' – ' + i.sub : '') + (i.bbWaived ? ' (BB — included)' : '') + ' [' + i.date + ' ' + i.time + ']').join('\n') +
    '\nTotal USD ' + Number(r.total).toFixed(2) + (r.note ? '\nNote: ' + r.note : '') + (r.priceAdjusted ? '\n⚠ Price differed from guest screen — menu price used' : '');
  try{ UrlFetchApp.fetch('https://api.telegram.org/bot' + P.getProperty('TELEGRAM_TOKEN') + '/sendMessage',
        { method:'post', payload:{ chat_id:P.getProperty('TELEGRAM_CHAT'), text:text }, muteHttpExceptions:true }); }catch(e){}
  try{ MailApp.sendEmail(P.getProperty('ORDER_EMAIL'), 'Food order ' + r.id + ' – Room ' + r.room, text); }catch(e){}
}
