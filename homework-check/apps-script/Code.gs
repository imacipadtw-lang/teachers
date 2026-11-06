/**
 * 作業抽查紀錄 — Google 試算表後端（Apps Script）
 * 第一次執行時會自動在雲端硬碟建立試算表「作業抽查_資料表」，資料全部存在它的「data」分頁；安裝步驟見同資料夾 README.md。
 *
 * 角色
 * - 教務組：以「登記密碼」登入（存在「指令碼屬性」EDIT_KEY），看全校、登記、管理設定、產生導師連結。
 * - 導師：在登入頁的下拉選單選自己的班級；第一台登入的裝置被綁定（取得 token），之後免密碼，只看得到自己的班；
 *   同一班其他裝置無法再登入，除非教務組在「設定」解除。
 *
 * 第一次使用：部署成網頁應用程式（執行身分：我；誰可以存取：所有人），把網址填進網站 config.js，
 * 打開網站依畫面設定教務組密碼即完成。（也可以在編輯器執行 setup，密碼會印在執行紀錄。）
 */

var SHEET_NAME = 'data';
var MAX_CELL = 49000; // 試算表單格上限 50,000 字

/* ================= 安裝與維護（在編輯器手動執行） ================= */
function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('EDIT_KEY')) props.setProperty('EDIT_KEY', rand_(8));
  setupData_();
  Logger.log('教務組密碼：' + props.getProperty('EDIT_KEY') + '\n（可在網站「設定 → 系統 → 修改教務組密碼」更改，或執行 resetKey 重設）\n資料表：' + ss_().getUrl());
}
function setupData_() {
  sheet_();
  var all = readAll_();
  if (!all.config) put_('config', defaultConfig_());
  if (!all.rounds) {
    var ids = defaultConfig_().items.map(function (i) { return i.id; });
    put_('rounds', [{ id: 'r1', name: termName_() + ' 第1次作業抽查', due: '', itemIds: ids, locked: false, createdAt: new Date().toISOString() }]);
  }
  ensureAuth_(all.config || defaultConfig_(), all.auth);
  bump_();
}
function initialized_() { return !!PropertiesService.getScriptProperties().getProperty('EDIT_KEY'); }
function showKey() { Logger.log('教務組密碼：' + PropertiesService.getScriptProperties().getProperty('EDIT_KEY')); }
function resetKey() { var k = rand_(8); PropertiesService.getScriptProperties().setProperty('EDIT_KEY', k); Logger.log('新的教務組密碼：' + k); }

function termName_() {
  var d = new Date(); var m = d.getMonth() + 1;
  var y = m >= 8 ? d.getFullYear() - 1911 : d.getFullYear() - 1912;
  var sem = (m >= 8 || m === 1) ? 1 : 2;
  return y + '學年度第' + sem + '學期';
}
function defaultConfig_() {
  var all = [1, 2, 3, 4, 5, 6];
  return {
    items: [
      { id: 'chinese', name: '國語習作', short: '國語', kind: 'hw', grades: all },
      { id: 'math', name: '數學習作', short: '數學', kind: 'hw', grades: all },
      { id: 'english', name: '英語習作', short: '英語', kind: 'hw', grades: [3, 4, 5, 6] },
      { id: 'life', name: '生活習作', short: '生活', kind: 'hw', grades: [1, 2] },
      { id: 'social', name: '社會習作', short: '社會', kind: 'hw', grades: [3, 4, 5, 6] },
      { id: 'science', name: '自然習作', short: '自然', kind: 'hw', grades: [3, 4, 5, 6] },
      { id: 'health', name: '健康習作', short: '健康', kind: 'hw', grades: all },
      { id: 'exam', name: '考卷（家長已簽名）', short: '考卷簽回', kind: 'exam', grades: all }
    ],
    classes: all.map(function (g) {
      return { id: 'g' + g, name: '一二三四五六'.charAt(g - 1) + '甲', grade: g, teacher: '', subjectTeachers: {}, students: [] };
    })
  };
}

/* ================= 讀取 ================= */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!initialized_()) return json_({ ok: false, error: 'not_initialized' });
  if (p.action === 'classes') return classList_();
  if (p.action === 'claim') return claim_(p);
  var all = readAll_();
  var who = whoIs_(p, all);
  if (!who) return json_({ ok: false, error: 'auth' });
  var version = version_();
  if (p.v && String(p.v) === version) return json_({ ok: true, unchanged: true, version: version });

  var config = all.config || { items: [], classes: [] };
  var rounds = (all.rounds || []).slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
  var rid = null;
  if (p.rid && rounds.some(function (r) { return r.id === p.rid; })) rid = p.rid; else if (rounds.length) rid = rounds[0].id;

  var checks = {};
  if (rid) {
    var prefix = 'checks:' + rid + ':';
    Object.keys(all).forEach(function (k) {
      if (k.indexOf(prefix) !== 0) return;
      var cid = k.slice(prefix.length);
      if (who.role === 'admin' || cid === who.classId) checks[cid] = { marks: all[k].marks || {}, updatedAt: all[k].updatedAt || '', updatedBy: all[k].updatedBy || '' };
    });
  }
  var out = { ok: true, role: who.role, version: version, rounds: rounds, rid: rid, checks: checks };
  if (who.role === 'admin') {
    out.config = config;
    var auth = all.auth || { classes: {} }; var links = {};
    Object.keys(auth.classes).forEach(function (cid) {
      var a = auth.classes[cid];
      links[cid] = { devices: (a.devices || []).map(function (d) { return { label: d.label || '', claimedAt: d.claimedAt || '' }; }) };
    });
    out.links = links;
    try { out.sheetUrl = ss_().getUrl(); } catch (err) { out.sheetUrl = ''; }
  } else {
    var mine = config.classes.filter(function (c) { return c.id === who.classId; });
    if (!mine.length) return json_({ ok: false, error: 'auth' });
    out.classId = who.classId;
    out.config = { items: config.items, classes: mine };
  }
  return json_(out);
}

// 登入頁下拉選單用：班級、導師姓名、是否已有裝置登入（不含名單）
function classList_() {
  var all = readAll_();
  var auth = all.auth || { classes: {} };
  var list = ((all.config || {}).classes || []).map(function (c) {
    var a = auth.classes[c.id] || {};
    return { id: c.id, name: c.name, teacher: c.teacher || '', claimed: !!(a.devices && a.devices.length) };
  });
  return json_({ ok: true, classes: list });
}

// 導師第一次登入：綁定此裝置；該班已有裝置登入則拒絕
function claim_(p) {
  var cid = String(p.classId || '').trim();
  if (!cid) return json_({ ok: false, error: 'invalid' });
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, error: 'busy' });
  try {
    var all = readAll_();
    var cls = ((all.config || {}).classes || []).filter(function (c) { return c.id === cid; })[0];
    if (!cls) return json_({ ok: false, error: 'invalid' });
    var auth = all.auth || { classes: {} };
    var a = auth.classes[cid] || (auth.classes[cid] = { devices: [] });
    if (a.devices && a.devices.length) return json_({ ok: false, error: 'claimed' });
    var token = Utilities.getUuid() + rand_(6);
    a.devices = [{ token: token, label: String(p.label || '').slice(0, 40), claimedAt: new Date().toISOString() }];
    delete a.invite;
    put_('auth', auth);
    bump_();
    return json_({ ok: true, token: token, classId: cid, className: cls.name });
  } finally { lock.releaseLock(); }
}

/* ================= 寫入 ================= */
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, error: 'busy' });
  try {
    if (body.action === 'init') {
      // 第一次使用：設定教務組密碼並建立資料表；只能做一次
      if (initialized_()) return json_({ ok: false, error: 'already_initialized' });
      var k0 = String(body.newKey || '');
      if (k0.length < 6) return json_({ ok: false, error: 'weak_key' });
      PropertiesService.getScriptProperties().setProperty('EDIT_KEY', k0);
      setupData_();
      return json_({ ok: true, version: version_() });
    }
    if (!initialized_()) return json_({ ok: false, error: 'not_initialized' });
    var all = readAll_();
    var who = whoIs_(body, all);
    if (!who) return json_({ ok: false, error: 'auth' });
    var config = all.config || { items: [], classes: [] };
    var rounds = all.rounds || [];
    var admin = who.role === 'admin';
    var r;

    switch (body.action) {
      case 'marks': {
        var rid = String(body.rid || ''), cid = String(body.classId || '');
        if (!admin && cid !== who.classId) return json_({ ok: false, error: 'auth' });
        var round = rounds.filter(function (x) { return x.id === rid; })[0];
        if (!round) return json_({ ok: false, error: 'no_round' });
        if (round.locked && !admin) return json_({ ok: false, error: 'locked' });
        var cls = config.classes.filter(function (c) { return c.id === cid; })[0];
        if (!cls) return json_({ ok: false, error: 'bad_request' });
        var itemIds = {}; config.items.forEach(function (it) { itemIds[it.id] = true; });
        var key = 'checks:' + rid + ':' + cid;
        var doc = all[key] || { marks: {} };
        doc.marks = doc.marks || {};
        (body.changes || []).forEach(function (c) {
          var no = String(parseInt(c.no, 10)); if (no === 'NaN' || !itemIds[c.itemId]) return;
          doc.marks[no] = doc.marks[no] || {};
          if (c.val) doc.marks[no][c.itemId] = true; else delete doc.marks[no][c.itemId];
          if (!Object.keys(doc.marks[no]).length) delete doc.marks[no];
        });
        doc.updatedAt = new Date().toISOString();
        doc.updatedBy = admin ? '教務組' : '導師';
        put_(key, doc);
        break;
      }
      case 'saveConfig':
        if (!admin) return json_({ ok: false, error: 'auth' });
        var cfg = sanitizeConfig_(body.config);
        if (!cfg) return json_({ ok: false, error: 'bad_request' });
        put_('config', cfg);
        ensureAuth_(cfg, all.auth);
        break;
      case 'addRound':
        if (!admin) return json_({ ok: false, error: 'auth' });
        r = sanitizeRound_(body.round); if (!r) return json_({ ok: false, error: 'bad_request' });
        if (rounds.some(function (x) { return x.id === r.id; })) return json_({ ok: false, error: 'bad_request' });
        rounds.push(r); put_('rounds', rounds);
        break;
      case 'updateRound':
        if (!admin) return json_({ ok: false, error: 'auth' });
        r = sanitizeRound_(body.round); if (!r) return json_({ ok: false, error: 'bad_request' });
        var idx = -1; rounds.forEach(function (x, i) { if (x.id === r.id) idx = i; });
        if (idx < 0) return json_({ ok: false, error: 'no_round' });
        r.createdAt = rounds[idx].createdAt || r.createdAt;
        rounds[idx] = r; put_('rounds', rounds);
        break;
      case 'delRound':
        if (!admin) return json_({ ok: false, error: 'auth' });
        put_('rounds', rounds.filter(function (x) { return x.id !== body.rid; }));
        delPrefix_('checks:' + body.rid + ':');
        break;
      case 'revokeDevices': {
        if (!admin) return json_({ ok: false, error: 'auth' });
        var auth2 = all.auth || { classes: {} };
        auth2.classes[body.classId] = { devices: [] };
        put_('auth', auth2);
        break;
      }
      case 'snapshot':
        if (!admin) return json_({ ok: false, error: 'auth' });
        var rr = rounds.filter(function (x) { return x.id === body.rid; })[0];
        if (!rr) return json_({ ok: false, error: 'no_round' });
        writeSummary_(rr, config, all);
        return json_({ ok: true, version: version_() });
      case 'changeKey':
        if (!admin) return json_({ ok: false, error: 'auth' });
        var nk = String(body.newKey || '');
        if (nk.length < 6) return json_({ ok: false, error: 'weak_key' });
        PropertiesService.getScriptProperties().setProperty('EDIT_KEY', nk);
        return json_({ ok: true, version: version_() });
      default:
        return json_({ ok: false, error: 'unknown_action' });
    }
    var v = bump_();
    return json_({ ok: true, version: v });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err).indexOf('too_large') >= 0 ? 'too_large' : 'server_error', detail: String(err && err.message || err) });
  } finally { lock.releaseLock(); }
}

/* ================= 身分 ================= */
function isAdmin_(key) {
  if (!key) return false;
  return String(key) === String(PropertiesService.getScriptProperties().getProperty('EDIT_KEY') || '');
}
function whoIs_(p, all) {
  if (isAdmin_(p.key)) return { role: 'admin' };
  if (!p.token) return null;
  var auth = all.auth || { classes: {} };
  var found = null;
  Object.keys(auth.classes).forEach(function (cid) {
    (auth.classes[cid].devices || []).forEach(function (d) { if (d.token === p.token) found = { role: 'teacher', classId: cid }; });
  });
  return found;
}
function ensureAuth_(config, auth) {
  auth = auth || { classes: {} };
  var next = { classes: {} };
  (config.classes || []).forEach(function (c) {
    next.classes[c.id] = auth.classes[c.id] || { devices: [] };
  });
  put_('auth', next);
}

/* ================= 資料檢查 ================= */
function sanitizeConfig_(c) {
  if (!c || !Array.isArray(c.items) || !Array.isArray(c.classes)) return null;
  var items = c.items.map(function (it) {
    return { id: String(it.id || rand_(6)), name: String(it.name || '').trim().slice(0, 40), short: String(it.short || '').trim().slice(0, 12), kind: it.kind === 'exam' ? 'exam' : 'hw', grades: (it.grades || []).map(Number).filter(function (g) { return g >= 1 && g <= 6; }) };
  }).filter(function (it) { return it.name; });
  var ids = {}; items.forEach(function (it) { ids[it.id] = true; });
  var classes = c.classes.map(function (cl) {
    var seen = {};
    var students = (cl.students || []).map(function (s) { return { no: parseInt(s.no, 10), name: String(s.name || '').trim().slice(0, 30) }; })
      .filter(function (s) { if (!(s.no > 0) || seen[s.no]) return false; seen[s.no] = true; return true; })
      .sort(function (a, b) { return a.no - b.no; });
    var st = {}; Object.keys(cl.subjectTeachers || {}).forEach(function (k) { if (ids[k] && cl.subjectTeachers[k]) st[k] = String(cl.subjectTeachers[k]).trim().slice(0, 20); });
    var out = { id: String(cl.id || rand_(6)), name: String(cl.name || '').trim().slice(0, 20), grade: Math.min(6, Math.max(1, parseInt(cl.grade, 10) || 1)), teacher: String(cl.teacher || '').trim().slice(0, 20), subjectTeachers: st, students: students };
    if (Array.isArray(cl.itemIds)) out.itemIds = cl.itemIds.filter(function (k) { return ids[k]; });
    return out;
  }).filter(function (cl) { return cl.name; });
  return { items: items, classes: classes };
}
function sanitizeRound_(r) {
  if (!r || !r.id || !String(r.name || '').trim()) return null;
  return { id: String(r.id), name: String(r.name).trim().slice(0, 60), due: /^\d{4}-\d{2}-\d{2}$/.test(r.due || '') ? r.due : '', itemIds: (r.itemIds || []).map(String), locked: !!r.locked, createdAt: r.createdAt || new Date().toISOString() };
}

/* ================= 可閱讀的總表分頁 ================= */
function writeSummary_(round, config, all) {
  var ss = ss_();
  var name = ('總表 ' + round.name).replace(/[\[\]\*\?\/\\:]/g, ' ').slice(0, 95);
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  var items = config.items.filter(function (it) { return (round.itemIds || []).indexOf(it.id) >= 0; });
  var head = ['班級', '導師', '座號', '姓名'].concat(items.map(function (i) { return i.name; })).concat(['已交項目', '應交項目', '狀態']);
  var rows = [head];
  var stat = [['班級', '導師', '人數'].concat(items.map(function (i) { return i.name; })).concat(['完成率'])];
  config.classes.forEach(function (cls) {
    var doc = all['checks:' + round.id + ':' + cls.id] || { marks: {} };
    var mine = items.filter(function (it) { return Array.isArray(cls.itemIds) ? cls.itemIds.indexOf(it.id) >= 0 : (it.grades || []).indexOf(Number(cls.grade)) >= 0; });
    var mineSet = {}; mine.forEach(function (i) { mineSet[i.id] = true; });
    var counts = {}; var got = 0;
    (cls.students || []).forEach(function (s) {
      var m = (doc.marks || {})[String(s.no)] || {};
      var g = 0;
      var cells = items.map(function (it) {
        if (!mineSet[it.id]) return '—';
        if (m[it.id]) { g++; counts[it.id] = (counts[it.id] || 0) + 1; return '✓'; }
        return '';
      });
      got += g;
      rows.push([cls.name, cls.teacher || '', s.no, s.name || ''].concat(cells).concat([g, mine.length, g === mine.length ? '繳齊' : '缺 ' + (mine.length - g) + ' 項']));
    });
    var n = (cls.students || []).length; var total = n * mine.length;
    stat.push([cls.name, cls.teacher || '', n].concat(items.map(function (it) { return mineSet[it.id] ? (counts[it.id] || 0) + '/' + n : '—'; })).concat([total ? Math.round(got / total * 100) + '%' : '—']));
  });
  var w = head.length;
  sh.getRange(1, 1, 1, w).setValues([['作業抽查紀錄　' + round.name + (round.due ? '　繳交截止 ' + round.due : '') + '　製表 ' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm')].concat(new Array(w - 1).fill(''))]);
  sh.getRange(2, 1, rows.length, w).setValues(rows);
  sh.getRange(2, 1, 1, w).setFontWeight('bold').setBackground('#e8edf5');
  var start = rows.length + 4;
  sh.getRange(start, 1, 1, 1).setValue('各班統計').setFontWeight('bold');
  sh.getRange(start + 1, 1, stat.length, stat[0].length).setValues(stat);
  sh.getRange(start + 1, 1, 1, stat[0].length).setFontWeight('bold').setBackground('#e8edf5');
  sh.setFrozenRows(2);
  sh.getRange(3, 5, Math.max(1, rows.length - 1), items.length).setHorizontalAlignment('center');
  sh.autoResizeColumns(1, w);
}

/* ================= 試算表存取 ================= */
// 取得資料表：優先用指令碼屬性記住的試算表；沒有就用綁定的試算表；都沒有就自動建立一張
function ss_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (err) { } }
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (err) { }
  if (!ss) ss = SpreadsheetApp.create('作業抽查_資料表');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}
function sheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME, 0);
    sh.getRange(1, 1, 1, 3).setValues([['key', 'json', 'updatedAt']]);
    sh.setFrozenRows(1);
  }
  return sh;
}
function readAll_() {
  var sh = sheet_(); var last = sh.getLastRow(); var out = {};
  if (last < 2) return out;
  sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
    if (r[0]) { try { out[r[0]] = JSON.parse(r[1]); } catch (e) { } }
  });
  return out;
}
function findRow_(sh, key) {
  var last = sh.getLastRow(); if (last < 2) return -1;
  var keys = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) if (keys[i][0] === key) return i + 2;
  return -1;
}
function put_(key, obj) {
  var sh = sheet_(); var text = JSON.stringify(obj);
  if (text.length > MAX_CELL) throw new Error('too_large:' + key);
  var row = findRow_(sh, key); var vals = [[key, text, new Date().toISOString()]];
  if (row > 0) sh.getRange(row, 1, 1, 3).setValues(vals); else sh.appendRow(vals[0]);
}
function delPrefix_(prefix) {
  var sh = sheet_(); var last = sh.getLastRow(); if (last < 2) return;
  var keys = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = keys.length - 1; i >= 0; i--) if (String(keys[i][0]).indexOf(prefix) === 0) sh.deleteRow(i + 2);
}
function version_() { return PropertiesService.getScriptProperties().getProperty('VERSION') || '0'; }
function bump_() { var v = String(Date.now()); PropertiesService.getScriptProperties().setProperty('VERSION', v); return v; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function rand_(n) {
  var chars = 'abcdefghjkmnpqrstuvwxyz23456789'; var s = '';
  for (var i = 0; i < n; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}
