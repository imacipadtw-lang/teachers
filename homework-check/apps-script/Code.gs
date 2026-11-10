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

// 後端版本：網站會比對這個版本，教務組畫面上會提醒「後端需要更新」（改了這個檔就要把版本一起改，並同步改 app.js 的 BACKEND_NEED）
var BACKEND_VER = '2026.11.10r';
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
function claimClosed_() { return PropertiesService.getScriptProperties().getProperty('CLAIM_CLOSED') === '1'; }
function initialized_() { return !!PropertiesService.getScriptProperties().getProperty('EDIT_KEY'); }
function showKey() { Logger.log('教務組密碼：' + PropertiesService.getScriptProperties().getProperty('EDIT_KEY')); }
function resetKey() { var k = rand_(8); PropertiesService.getScriptProperties().setProperty('EDIT_KEY', k); CacheService.getScriptCache().remove('admin_fail'); saveAdminSessions_({}); Logger.log('新的教務組密碼：' + k); }
// 教務組登入憑證：存在指令碼屬性 ADMIN_SESSIONS，180 天到期，最多保留 30 組（最新的）
var SESSION_DAYS = 180, SESSION_MAX = 30;
function adminSessions_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('ADMIN_SESSIONS') || '{}') || {}; } catch (e) { return {}; } }
function saveAdminSessions_(m) {
  var now = Date.now();
  var keys = Object.keys(m).filter(function (k) { return m[k] && m[k].exp > now; }).sort(function (a, b) { return m[b].at - m[a].at; }).slice(0, SESSION_MAX);
  var out = {}; keys.forEach(function (k) { out[k] = m[k]; });
  PropertiesService.getScriptProperties().setProperty('ADMIN_SESSIONS', JSON.stringify(out));
}
function newAdminSession_(label) {
  var m = adminSessions_(); var t = 'a' + Utilities.getUuid().replace(/-/g, '') + rand_(8);
  m[t] = { at: Date.now(), exp: Date.now() + SESSION_DAYS * 86400000, label: String(label || '').slice(0, 30) };
  saveAdminSessions_(m); return t;
}
function logoutAllAdmins() { saveAdminSessions_({}); Logger.log('已登出所有教務組裝置'); }
function unlockAdmin() { CacheService.getScriptCache().remove('admin_fail'); Logger.log('已解除教務組登入暫停'); }

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
      { id: 'chinese', name: '國語習作', short: '國語', kind: 'hw', grades: all, code: '01' },
      { id: 'math', name: '數學習作', short: '數學', kind: 'hw', grades: all, code: '02' },
      { id: 'english', name: '英語習作', short: '英語', kind: 'hw', grades: all, code: '03' },
      { id: 'life', name: '生活習作', short: '生活', kind: 'hw', grades: [1, 2], code: '04' },
      { id: 'social', name: '社會習作', short: '社會', kind: 'hw', grades: [3, 4, 5, 6], code: '05' },
      { id: 'science', name: '自然習作', short: '自然', kind: 'hw', grades: [3, 4, 5, 6], code: '06' },
      { id: 'health', name: '健康習作', short: '健康', kind: 'hw', grades: all, code: '07' },
      { id: 'exam_chinese', name: '國語考卷', short: '國語', kind: 'exam', grades: all, code: '11' },
      { id: 'exam_math', name: '數學考卷', short: '數學', kind: 'exam', grades: all, code: '12' },
      { id: 'exam_english', name: '英語考卷', short: '英語', kind: 'exam', grades: [3, 4, 5, 6], code: '13' },
      { id: 'exam_life', name: '生活考卷', short: '生活', kind: 'exam', grades: [1, 2], code: '14' },
      { id: 'exam_social', name: '社會考卷', short: '社會', kind: 'exam', grades: [3, 4, 5, 6], code: '15' },
      { id: 'exam_science', name: '自然考卷', short: '自然', kind: 'exam', grades: [3, 4, 5, 6], code: '16' }
    ],
    classes: all.map(function (g) {
      return { id: 'g' + g, name: '一二三四五六'.charAt(g - 1) + '甲', grade: g, classNo: 1, teacher: '', subjectTeachers: {}, students: [] };
    })
  };
}

/* ================= 讀取 ================= */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!initialized_()) return json_({ ok: false, error: 'not_initialized' });
  if (p.action === 'classes') return classList_();
  if (p.action === 'claim') return claim_(p);
  return read_(p);
}

// 讀取全部資料（教務組看全校、導師只看自己班）。前端以 POST action=read 呼叫，密碼與 token 不會出現在網址
function read_(p) {
  if (p.key && adminLocked_()) return json_({ ok: false, error: 'too_many' });
  // 快速路徑：資料沒有變動就不讀試算表（每台裝置每 45 秒問一次，大多是「沒變」）。
  // 任何寫入（含解除裝置）都會改版本號，所以被解除的裝置下一次一定走完整驗證。
  var version = version_();
  if (p.v && String(p.v) === version && !p.allRounds) {
    var cache = CacheService.getScriptCache();
    if (p.atoken) { var sess = adminSessions_()[p.atoken]; if (sess && sess.exp > Date.now()) return json_({ ok: true, unchanged: true, version: version }); }
    else if (p.token && cache.get('tok:' + p.token)) return json_({ ok: true, unchanged: true, version: version });
  }
  var all = readAll_();
  var who = whoIs_(p, all);
  if (!who) return json_({ ok: false, error: 'auth' });
  if (who.role === 'teacher' && p.token) CacheService.getScriptCache().put('tok:' + p.token, who.classId, 21600);
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
      if (who.role === 'admin' || cid === who.classId) {
        checks[cid] = { marks: all[k].marks || {}, skip: all[k].skip || {}, updatedAt: all[k].updatedAt || '', updatedBy: all[k].updatedBy || '' };
        if (who.role === 'admin') { checks[cid].notes = all[k].notes || {}; checks[cid].classNote = all[k].classNote || ''; } // 備註只給教務組
      }
    });
  }
  var out = { ok: true, role: who.role, version: version, backend: BACKEND_VER, rounds: rounds, rid: rid, checks: checks };
  if (p.allRounds && who.role === 'admin') {
    // 教務組：一次取回所有抽查次別的登記（歷次趨勢、下載備份用）
    var history = {};
    Object.keys(all).forEach(function (k) {
      var m = /^checks:([^:]+):(.+)$/.exec(k); if (!m) return;
      (history[m[1]] = history[m[1]] || {})[m[2]] = { marks: all[k].marks || {}, skip: all[k].skip || {}, notes: all[k].notes || {}, classNote: all[k].classNote || '', updatedAt: all[k].updatedAt || '' };
    });
    out.history = history;
  }
  if (who.role === 'admin') {
    out.config = config;
    var auth = all.auth || { classes: {} }; var links = {};
    Object.keys(auth.classes).forEach(function (cid) {
      var a = auth.classes[cid];
      links[cid] = { devices: (a.devices || []).map(function (d) { return { label: d.label || '', claimedAt: d.claimedAt || '' }; }) };
    });
    out.links = links;
    out.claimClosed = claimClosed_();
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
    return { id: c.id, name: c.name, teacher: c.teacher || '', claimed: !!(a.devices && a.devices.length), reopen: !!a.reopen };
  });
  return json_({ ok: true, classes: list, closed: claimClosed_() });
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
    if (claimClosed_() && !a.reopen) return json_({ ok: false, error: 'closed' }); // 暫停新登入中，只有教務組剛解除的班級可以重新登入
    var token = Utilities.getUuid() + rand_(6);
    a.devices = [{ token: token, label: String(p.label || '').slice(0, 40), claimedAt: new Date().toISOString() }];
    delete a.invite; delete a.reopen;
    put_('auth', auth);
    bump_();
    log_([['導師（' + cls.name + '）', '綁定登入裝置', '', cls.name, '', '', '', String(p.label || '').slice(0, 30)]]);
    return json_({ ok: true, token: token, classId: cid, className: cls.name });
  } finally { lock.releaseLock(); }
}

/* ================= 寫入 ================= */
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  if (!body || typeof body !== 'object') return json_({ ok: false, error: 'bad_request' });
  if (body.action === 'read') { // 只讀，不需排隊鎖定
    if (!initialized_()) return json_({ ok: false, error: 'not_initialized' });
    return read_(body);
  }
  if (body.action === 'ocr') { // 拍照辨識：只讀＋呼叫 AI（要幾秒），不佔用寫入的排隊鎖定
    if (!initialized_()) return json_({ ok: false, error: 'not_initialized' });
    if (body.key && adminLocked_()) return json_({ ok: false, error: 'too_many' });
    return ocr_(body);
  }
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
    if (body.key && adminLocked_()) return json_({ ok: false, error: 'too_many' });
    if (body.action === 'adminLogin') {
      // 教務組登入：驗證密碼後發一組登入憑證，瀏覽器只存憑證、不存密碼
      if (!isAdmin_(body.key)) return json_({ ok: false, error: 'auth' });
      log_([['教務組', '登入', '', '', '', '', '', String(body.label || '').slice(0, 30)]]);
      return json_({ ok: true, atoken: newAdminSession_(body.label) });
    }
    if (body.action === 'adminLogout') {
      var ss0 = adminSessions_(); if (body.atoken && ss0[body.atoken]) { delete ss0[body.atoken]; saveAdminSessions_(ss0); }
      return json_({ ok: true });
    }
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
        // 只接受「本次抽查有、且本班適用」的項目，以及名單上有的座號
        var inRound = {}; (round.itemIds || []).forEach(function (id) { inRound[id] = true; });
        var itemById = {}; config.items.forEach(function (it) { if (inRound[it.id] && classHasItem_(cls, it)) itemById[it.id] = it; });
        var studentByNo = {}; (cls.students || []).forEach(function (st) { studentByNo[String(st.no)] = st; });
        var key = 'checks:' + rid + ':' + cid;
        var doc = all[key] || { marks: {} };
        doc.marks = doc.marks || {};
        var logRows = [];
        (body.changes || []).forEach(function (c) {
          var no = String(parseInt(c.no, 10)); if (!studentByNo[no] || !itemById[c.itemId] || (doc.skip && doc.skip[c.itemId])) return; // 名單外、非本班項目、本次不用繳：不收
          var before = !!(doc.marks[no] && doc.marks[no][c.itemId]);
          doc.marks[no] = doc.marks[no] || {};
          if (c.val) doc.marks[no][c.itemId] = true; else delete doc.marks[no][c.itemId];
          if (!Object.keys(doc.marks[no]).length) delete doc.marks[no];
          if (before !== !!c.val) { var it = itemById[c.itemId]; logRows.push([whoLabel_(who, cls), c.val ? (it.kind === 'exam' ? '已繳回' : '已交') : '取消', round.name, cls.name, Number(no), studentByNo[no].name || '', it.name, '']); }
        });
        log_(logRows);
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
        log_([['教務組', '修改設定', '', '', '', '', '', cfg.items.length + ' 個項目、' + cfg.classes.length + ' 個班級']]);
        break;
      case 'addRound':
        if (!admin) return json_({ ok: false, error: 'auth' });
        r = sanitizeRound_(body.round); if (!r) return json_({ ok: false, error: 'bad_request' });
        if (rounds.some(function (x) { return x.id === r.id; })) return json_({ ok: false, error: 'bad_request' });
        rounds.push(r); put_('rounds', rounds);
        log_([['教務組', '建立抽查次別', r.name, '', '', '', '', r.due ? '截止 ' + r.due : '']]);
        break;
      case 'updateRound':
        if (!admin) return json_({ ok: false, error: 'auth' });
        r = sanitizeRound_(body.round); if (!r) return json_({ ok: false, error: 'bad_request' });
        var idx = -1; rounds.forEach(function (x, i) { if (x.id === r.id) idx = i; });
        if (idx < 0) return json_({ ok: false, error: 'no_round' });
        r.createdAt = rounds[idx].createdAt || r.createdAt;
        var wasLocked = !!rounds[idx].locked;
        rounds[idx] = r; put_('rounds', rounds);
        log_([['教務組', r.locked && !wasLocked ? '結案' : (!r.locked && wasLocked ? '取消結案' : '修改抽查次別'), r.name, '', '', '', '', r.due ? '截止 ' + r.due : '']]);
        break;
      case 'delRound':
        if (!admin) return json_({ ok: false, error: 'auth' });
        var dr = rounds.filter(function (x) { return x.id === body.rid; })[0];
        put_('rounds', rounds.filter(function (x) { return x.id !== body.rid; }));
        delPrefix_('checks:' + body.rid + ':');
        if (dr) log_([['教務組', '刪除抽查次別（含紀錄）', dr.name, '', '', '', '', '']]);
        break;
      case 'skipItem': {
        // 教務組：這一次抽查、這一班「不用繳」某項目（或恢復）。既有登記保留但不顯示、不計算
        if (!admin) return json_({ ok: false, error: 'auth' });
        var srid = String(body.rid || ''), scid = String(body.classId || ''), sitem = String(body.itemId || '');
        var sround = rounds.filter(function (x) { return x.id === srid; })[0]; if (!sround) return json_({ ok: false, error: 'no_round' });
        var scls = config.classes.filter(function (c) { return c.id === scid; })[0];
        var sit = config.items.filter(function (it) { return it.id === sitem; })[0];
        if (!scls || !sit) return json_({ ok: false, error: 'bad_request' });
        var skey = 'checks:' + srid + ':' + scid;
        var sdoc = all[skey] || { marks: {} };
        sdoc.skip = sdoc.skip || {};
        if (body.skip) sdoc.skip[sitem] = true; else delete sdoc.skip[sitem];
        if (!Object.keys(sdoc.skip).length) delete sdoc.skip;
        put_(skey, sdoc);
        log_([['教務組', body.skip ? '本次不用繳' : '恢復要繳', sround.name, scls.name, '', '', sit.name, '']]);
        break;
      }
      case 'note': {
        // 教務組備註：每位學生一則（給主任、校長看的說明），或整班一則
        if (!admin) return json_({ ok: false, error: 'auth' });
        var nrid = String(body.rid || ''), ncid = String(body.classId || '');
        if (!rounds.some(function (x) { return x.id === nrid; })) return json_({ ok: false, error: 'no_round' });
        if (!config.classes.some(function (c) { return c.id === ncid; })) return json_({ ok: false, error: 'bad_request' });
        var nkey = 'checks:' + nrid + ':' + ncid;
        var ndoc = all[nkey] || { marks: {} };
        var text = String(body.text || '').trim().slice(0, 200);
        if (body.no === undefined || body.no === null || body.no === '') { ndoc.classNote = text; }
        else { ndoc.notes = ndoc.notes || {}; var nno = String(parseInt(body.no, 10)); if (nno === 'NaN') return json_({ ok: false, error: 'bad_request' }); if (text) ndoc.notes[nno] = text; else delete ndoc.notes[nno]; }
        put_(nkey, ndoc);
        var ncls = config.classes.filter(function (c) { return c.id === ncid; })[0];
        var nst = (body.no === undefined || body.no === null || body.no === '') ? null : (ncls.students || []).filter(function (x) { return String(x.no) === String(parseInt(body.no, 10)); })[0];
        log_([['教務組', nst ? '學生備註' : '班級備註', (rounds.filter(function (x) { return x.id === nrid; })[0] || {}).name || '', ncls.name, nst ? nst.no : '', nst ? (nst.name || '') : '', '', text || '（清除）']]);
        break;
      }
      case 'setClaim':
        // 教務組可暫停導師新登入（已登入的裝置不受影響），避免學生或他人搶先選班級登入
        if (!admin) return json_({ ok: false, error: 'auth' });
        PropertiesService.getScriptProperties().setProperty('CLAIM_CLOSED', body.closed ? '1' : '');
        log_([['教務組', body.closed ? '暫停導師新登入' : '開放導師登入', '', '', '', '', '', '']]);
        break;
      case 'revokeAll': {
        // 全部重新來過：解除所有班級的登入裝置，並開放導師重新登入
        if (!admin) return json_({ ok: false, error: 'auth' });
        var auth3 = { classes: {} };
        config.classes.forEach(function (c) { auth3.classes[c.id] = { devices: [], reopen: true }; });
        put_('auth', auth3);
        PropertiesService.getScriptProperties().setProperty('CLAIM_CLOSED', '');
        log_([['教務組', '全部班級解除登入（導師重新登入）', '', '', '', '', '', config.classes.length + ' 班']]);
        break;
      }
      case 'revokeDevices': {
        if (!admin) return json_({ ok: false, error: 'auth' });
        if (!config.classes.some(function (c) { return c.id === body.classId; })) return json_({ ok: false, error: 'bad_request' });
        var auth2 = all.auth || { classes: {} };
        auth2.classes[body.classId] = { devices: [], reopen: true }; // 解除後該班可重新登入一次（即使目前暫停新登入）
        put_('auth', auth2);
        log_([['教務組', '解除導師裝置', '', config.classes.filter(function (c) { return c.id === body.classId; })[0].name, '', '', '', '']]);
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
        saveAdminSessions_({}); // 改密碼後，其他裝置的登入全部失效
        log_([['教務組', '修改教務組密碼', '', '', '', '', '', '其他裝置已登出']]);
        return json_({ ok: true, version: version_(), atoken: newAdminSession_(body.label) });
      default:
        return json_({ ok: false, error: 'unknown_action' });
    }
    var v = bump_();
    return json_({ ok: true, version: v });
  } catch (err) {
    var msg = String(err && err.message || err);
    console.error('doPost ' + (body && body.action) + ': ' + msg);
    return json_({ ok: false, error: msg.indexOf('too_large') >= 0 ? 'too_large' : 'server_error' });
  } finally { lock.releaseLock(); }
}

/* ================= 身分 ================= */
// 密碼錯誤 20 次（15 分鐘內）就暫停教務組登入 15 分鐘，防止有人用程式猜密碼；導師不受影響
var FAIL_MAX = 20, FAIL_WINDOW = 900;
function adminLocked_() { return Number(CacheService.getScriptCache().get('admin_fail') || 0) >= FAIL_MAX; }
function isAdmin_(key) {
  if (!key) return false;
  if (adminLocked_()) return false;
  var ok = String(key) === String(PropertiesService.getScriptProperties().getProperty('EDIT_KEY') || '');
  if (!ok) { var c = CacheService.getScriptCache(); c.put('admin_fail', String(Number(c.get('admin_fail') || 0) + 1), FAIL_WINDOW); }
  return ok;
}
function whoIs_(p, all) {
  if (p.atoken) { var sess = adminSessions_()[p.atoken]; if (sess && sess.exp > Date.now()) return { role: 'admin' }; }
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
    var o = { id: String(it.id || rand_(6)), name: String(it.name || '').trim().slice(0, 40), short: String(it.short || '').trim().slice(0, 12), kind: it.kind === 'exam' ? 'exam' : 'hw', grades: (it.grades || []).map(Number).filter(function (g) { return g >= 1 && g <= 6; }) };
    var code = String(it.code || '').replace(/\D/g, '').slice(0, 2); if (code) o.code = code; // 條碼科目代碼
    return o;
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
    var cn = parseInt(cl.classNo, 10); if (cn > 0) out.classNo = cn; // 條碼班序（甲=1）
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
  var head = ['班級', '導師', '座號', '姓名'].concat(items.map(function (i) { return i.name; })).concat(['已交項目', '應交項目', '狀態', '備註']);
  var rows = [head];
  var stat = [['班級', '導師', '人數'].concat(items.map(function (i) { return i.name; })).concat(['完成率', '班級備註'])];
  config.classes.forEach(function (cls) {
    var doc = all['checks:' + round.id + ':' + cls.id] || { marks: {} };
    var skipSet = doc.skip || {};
    var mine = items.filter(function (it) { return !skipSet[it.id] && (Array.isArray(cls.itemIds) ? cls.itemIds.indexOf(it.id) >= 0 : (it.grades || []).indexOf(Number(cls.grade)) >= 0); });
    var mineSet = {}; mine.forEach(function (i) { mineSet[i.id] = true; });
    var counts = {}; var got = 0;
    (cls.students || []).forEach(function (s) {
      var m = (doc.marks || {})[String(s.no)] || {};
      var g = 0;
      var cells = items.map(function (it) {
        if (skipSet[it.id]) return '不用繳';
        if (!mineSet[it.id]) return '—';
        if (m[it.id]) { g++; counts[it.id] = (counts[it.id] || 0) + 1; return '✓'; }
        return '';
      });
      got += g;
      rows.push([cls.name, cls.teacher || '', s.no, s.name || ''].concat(cells).concat([g, mine.length, g === mine.length ? '繳齊' : '缺 ' + (mine.length - g) + ' 項', (doc.notes || {})[String(s.no)] || '']));
    });
    var n = (cls.students || []).length; var total = n * mine.length;
    stat.push([cls.name, cls.teacher || '', n].concat(items.map(function (it) { return skipSet[it.id] ? '不用繳' : mineSet[it.id] ? (counts[it.id] || 0) + '/' + n : '—'; })).concat([total ? Math.round(got / total * 100) + '%' : '—', doc.classNote || '']));
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

/* ================= 異動紀錄（只增不改，供查核） ================= */
var LOG_SHEET = '異動紀錄';
function whoLabel_(who, cls) { return who.role === 'admin' ? '教務組' : '導師（' + (cls ? cls.name : who.classId) + '）'; }
function classHasItem_(cls, it) { return Array.isArray(cls.itemIds) ? cls.itemIds.indexOf(it.id) >= 0 : (it.grades || []).map(Number).indexOf(Number(cls.grade)) >= 0; }
// rows：[身分, 動作, 抽查次別, 班級, 座號, 姓名, 項目, 說明]；寫入失敗不影響存檔
function log_(rows) {
  if (!rows || !rows.length) return;
  try {
    var ss = ss_(); var sh = ss.getSheetByName(LOG_SHEET);
    if (!sh) { sh = ss.insertSheet(LOG_SHEET); sh.getRange(1, 1, 1, 9).setValues([['時間', '身分', '動作', '抽查次別', '班級', '座號', '姓名', '項目', '說明']]); sh.setFrozenRows(1); }
    var t = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 9).setValues(rows.map(function (r) { return [t].concat(r); }));
  } catch (err) { console.error('log_: ' + err); }
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
/* ---------- 拍照辨識：手機拍習作／考卷封面 → AI 讀出班級、座號、姓名，對照本班名單判斷是哪位學生 ----------
   金鑰：Apps Script「專案設定 → 指令碼屬性」新增 GEMINI_KEY（Google AI Studio 建立的 API 金鑰）；不寫進網站、試算表或倉庫。
   模型：預設 gemini-flash-latest（Google 維護的「最新 Flash」別名），找不到時改用 gemini-2.5-flash；
         要固定某個模型，在指令碼屬性加 OCR_MODEL。
   送出的資料：照片、本班座號與姓名、本次項目名稱。辨識結果不寫入任何資料；登記一律走原本的 marks（會記在異動紀錄）。 */
var OCR_MODELS_DEFAULT = ['gemini-flash-latest', 'gemini-2.5-flash'];
function ocr_(p) {
  var all = readAll_();
  var who = whoIs_(p, all);
  if (!who) return json_({ ok: false, error: 'auth' });
  var config = all.config || { items: [], classes: [] };
  var cls = (config.classes || []).filter(function (c) { return c.id === String(p.classId || ''); })[0];
  if (!cls) return json_({ ok: false, error: 'bad_request' });
  if (who.role !== 'admin' && who.classId !== cls.id) return json_({ ok: false, error: 'auth' });
  var round = (all.rounds || []).filter(function (x) { return x.id === String(p.rid || ''); })[0];
  if (!round) return json_({ ok: false, error: 'no_round' });
  var img = String(p.image || '').replace(/^data:image\/[a-z+]+;base64,/, '');
  if (!img || !/^[A-Za-z0-9+\/=]+$/.test(img.slice(0, 200))) return json_({ ok: false, error: 'bad_request' });
  if (img.length > 8000000) return json_({ ok: false, error: 'too_large' });
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!key) return json_({ ok: false, error: 'no_ocr_key' });
  var doc = all['checks:' + round.id + ':' + cls.id] || {};
  var inRound = {}; (round.itemIds || []).forEach(function (id) { inRound[id] = true; });
  var items = (config.items || []).filter(function (it) { return inRound[it.id] && classHasItem_(cls, it) && !(doc.skip && doc.skip[it.id]); });
  var itemById = {}; items.forEach(function (it) { itemById[it.id] = it; });
  var fixed = p.itemId && itemById[p.itemId] ? String(p.itemId) : '';
  var studs = (cls.students || []).slice().sort(function (a, b) { return a.no - b.no; });
  if (!studs.length) return json_({ ok: false, error: 'no_students' });
  var byNo = {}; studs.forEach(function (st) { byNo[String(st.no)] = st; });
  var prompt = [
    '你是國小教務處的作業登記助理。照片裡是學生繳交的習作或考卷（可能一本，也可能好幾本攤開排在一起）。',
    '請找出每一本封面或卷頭上寫的班級、座號、姓名（多半是小朋友手寫），對照下面的「本班名單」，判斷是哪一位學生。',
    '班級：' + cls.name + '（' + cls.grade + ' 年級）',
    '本班名單（座號 姓名）：',
    studs.map(function (st) { return st.no + ' ' + (st.name || '（無姓名）'); }).join('\n'),
    fixed ? '這次登記的項目已經指定：' + itemById[fixed].name + '（itemId=' + fixed + '）。每一筆 itemId 都填 ' + fixed + '；若封面明顯是別的科目，seenItem 寫出你看到的科目。'
      : '本次可能的項目（itemId：名稱）：\n' + items.map(function (it) { return it.id + '：' + it.name + (it.kind === 'exam' ? '（考卷，家長簽名繳回）' : ''); }).join('\n'),
    '規則：',
    '1. no 只能是名單上的座號；看不清楚、或名單上找不到，就不要列出，絕對不要猜。',
    '2. confidence：姓名和座號都對得上名單＝high；只看得清其中一個（例如只有姓名、或只有座號）但和名單一致＝medium；字跡模糊、只能部分辨認＝low。',
    '3. 每一本各回傳一筆；同一位學生只回傳一次。',
    '4. itemId：依封面上的科目字樣（例如「數學 習作」「國語 考卷」）從上面的清單挑一個；判斷不出來就填空字串。',
    '5. seen：照抄你在這一本上看到的班級、座號、姓名文字（例如「三年甲班 5號 張家豪」）。seenItem：照抄看到的科目字樣，沒有就空字串。',
    '6. text：整張照片上主要文字的簡短摘要（50 字以內）。'
  ].join('\n');
  var out = callGemini_(key, prompt, img);
  if (!out.ok) return json_(out);
  var res = out.data || {};
  var seen = {}, matches = [];
  (res.students || []).forEach(function (m) {
    var no = String(parseInt(m && m.no, 10)); if (!byNo[no] || seen[no]) return; seen[no] = true;
    var conf = { high: 'high', medium: 'medium', low: 'low' }[String(m.confidence || '').toLowerCase()] || 'low';
    var guess = itemById[m.itemId] ? String(m.itemId) : '';
    matches.push({ no: Number(no), name: byNo[no].name || '', itemId: fixed || guess, confidence: conf,
      seen: String(m.seen || '').slice(0, 60), seenItem: String(m.seenItem || '').slice(0, 30) });
  });
  return json_({ ok: true, matches: matches.slice(0, 40), text: String(res.text || '').slice(0, 200), model: out.model });
}
function callGemini_(key, prompt, img, mime) {
  var schema = { type: 'OBJECT', properties: {
    students: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      no: { type: 'INTEGER' }, confidence: { type: 'STRING' }, itemId: { type: 'STRING' }, seen: { type: 'STRING' }, seenItem: { type: 'STRING' } },
      required: ['no', 'confidence', 'itemId', 'seen'] } },
    text: { type: 'STRING' } }, required: ['students', 'text'] };
  var own = PropertiesService.getScriptProperties().getProperty('OCR_MODEL');
  var models = own ? [own].concat(OCR_MODELS_DEFAULT.filter(function (m) { return m !== own; })) : OCR_MODELS_DEFAULT.slice();
  for (var i = 0; i < models.length; i++) {
    var gen = { temperature: 0, responseMimeType: 'application/json', responseSchema: schema };
    if (/^gemini-2\.5-flash/.test(models[i])) gen.thinkingConfig = { thinkingBudget: 0 }; // 2.5 Flash 關掉思考，回應較快
    var resp;
    try {
      resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(models[i]) + ':generateContent', {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-goog-api-key': key },
        payload: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: mime || 'image/jpeg', data: img } }] }], generationConfig: gen })
      });
    } catch (err) { return { ok: false, error: 'ocr_failed', detail: String((err && err.message) || err).slice(0, 120) }; }
    var code = resp.getResponseCode(), body = resp.getContentText() || '';
    if (code === 404 && i < models.length - 1) continue; // 這個模型名稱已停用：換下一個
    if (code === 429 || code === 503) return { ok: false, error: 'ocr_busy' };
    if ((code === 400 || code === 401 || code === 403) && /API[ _]?key|API_KEY_INVALID|PERMISSION_DENIED|unregistered callers/i.test(body)) return { ok: false, error: 'ocr_key_bad' };
    if (code !== 200) return { ok: false, error: 'ocr_failed', detail: 'HTTP ' + code };
    try {
      var j = JSON.parse(body);
      var txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(function (x) { return x.text || ''; }).join('');
      return { ok: true, data: JSON.parse(txt), model: models[i] };
    } catch (err2) { return { ok: false, error: 'ocr_failed', detail: 'parse' }; }
  }
  return { ok: false, error: 'ocr_failed', detail: 'no_model' };
}
// 在 Apps Script 編輯器執行，確認 GEMINI_KEY 能用（結果在「執行紀錄」，不印出金鑰）
function testOcrKey() {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!key) { Logger.log('還沒有設定 GEMINI_KEY：專案設定 → 指令碼屬性 → 新增 GEMINI_KEY'); return; }
  var px = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  var out = callGemini_(key, '這是一張測試圖片，請回傳 students 空陣列、text 寫「測試成功」。', px, 'image/png');
  Logger.log(out.ok ? '金鑰可以使用（模型：' + out.model + '）' : '無法使用：' + out.error + (out.detail ? '（' + out.detail + '）' : ''));
}
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function rand_(n) {
  var chars = 'abcdefghjkmnpqrstuvwxyz23456789'; var s = '';
  for (var i = 0; i < n; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}
