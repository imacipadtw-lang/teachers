/* 作業抽查紀錄 — 前端程式
   資料來源：Google 試算表（Apps Script 網頁應用程式）。
   角色：教務組（密碼登入，看全校、管理設定）／導師（班級專屬連結綁定裝置，只看自己班）。 */
(function () {
  'use strict';

  const APP_VERSION = '2026.11.09n';
  const CFG = Object.assign({ apiUrl: '', schoolName: '', unitName: '教務處', appName: '作業抽查紀錄', pollSeconds: 45 }, window.HC_CONFIG || {});
  const LS = { admin: 'hc.admin', teacher: 'hc.teacher', api: 'hc.api', cls: 'hc.class', outbox: 'hc.outbox', theme: 'hc.theme' };
  const GRADE = ['', '一', '二', '三', '四', '五', '六'];
  const WD = '日一二三四五六';

  /* ---------- 狀態 ---------- */
  const S = {
    apiUrl: '', sheetUrl: '', role: null, key: null, token: null, classId: null,
    config: null, rounds: [], rid: null, loadedRid: null, checks: {}, links: {}, version: null,
    lastSync: null, sync: 'busy', syncMsg: '',
    screen: 'boot', gateMsg: '', welcomeClass: '',
    view: 'class', selClass: null, draft: null,
    pending: new Map(), outbox: new Map(), flushTimer: null, flushing: false, pendingNotes: new Map(), noteTimers: {},
    modal: null, justStamped: null, narrow: false, openClass: null
  };
  /* ---------- 外觀（自動跟隨系統／淺色／深色） ---------- */
  const THEMES = [['auto', '自動'], ['light', '淺色'], ['dark', '深色']];
  const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const t = lsGet(LS.theme) || 'auto';
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    const dark = t === 'dark' || (t === 'auto' && darkMq.matches);
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', dark ? '#111722' : '#fbf6e3');
  }
  darkMq.addEventListener('change', applyTheme);
  const nar = window.matchMedia('(max-width: 719px)');
  S.narrow = nar.matches;
  nar.addEventListener('change', e => { S.narrow = e.matches; if (S.screen === 'app') renderMain(); });

  /* ---------- 小工具 ---------- */
  const $ = s => document.querySelector(s);
  function h(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(x => { if (x != null && x !== false) e.append(x.nodeType ? x : document.createTextNode(String(x))); });
      else e.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  }
  const ICON = {
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M6 15h12v6H6z"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>'
  };
  const svg = name => { const s = document.createElement('span'); s.innerHTML = ICON[name]; s.style.display = 'inline-flex'; return s.firstChild; };
  function toast(msg, ms) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = h('div', { class: 'toast', role: 'status', text: msg });
    document.body.append(t); setTimeout(() => t.remove(), ms || 2200);
  }
  function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 私密視窗等情況忽略 */ } }
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtDate(s) { if (!s) return ''; const d = new Date(s + 'T00:00:00'); if (isNaN(d)) return s; return (d.getMonth() + 1) + '/' + d.getDate() + '（' + WD[d.getDay()] + '）'; }
  function daysUntil(s) { if (!s) return null; const d = new Date(s + 'T00:00:00'); const t = new Date(todayStr() + 'T00:00:00'); return Math.round((d - t) / 86400000); }
  function fmtTime(d) { if (!d) return ''; return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function fmtStamp(iso) { if (!iso) return ''; const d = new Date(iso); if (isNaN(d)) return ''; return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + fmtTime(d); }
  function rocTerm() { const d = new Date(); const m = d.getMonth() + 1; const y = m >= 8 ? d.getFullYear() - 1911 : d.getFullYear() - 1912; const sem = (m >= 8 || m === 1) ? 1 : 2; return { year: y, sem }; }
  function uid(p) { return (p || '') + Math.random().toString(36).slice(2, 8); }
  function deviceLabel() { const u = navigator.userAgent; if (/iPad/.test(u)) return 'iPad'; if (/iPhone/.test(u)) return 'iPhone'; if (/Android/.test(u)) return 'Android 裝置'; if (/Windows/.test(u)) return 'Windows 電腦'; if (/Macintosh/.test(u)) return 'Mac 電腦'; return '其他裝置'; }
  async function copyText(text) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { try { const ta = h('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e2) { return false; } } }
  function armed(btn, label, confirmLabel, fn, ms) {
    let on = false, timer = null;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (!on) { on = true; btn.textContent = confirmLabel; timer = setTimeout(() => { on = false; btn.textContent = label; }, ms || 3000); return; }
      clearTimeout(timer); on = false; btn.textContent = label; fn();
    });
    return btn;
  }

  /* ---------- API ---------- */
  // 連不上時分辨原因：手機有網路卻連不到，幾乎都是 Apps Script 部署的「誰可以存取」沒有選「所有人」，Google 會轉到登入頁而被瀏覽器擋下
  function netErr() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return '網路連不上，請確認網路後再試';
    return '連不到資料表。請教務組確認 Apps Script 的部署：「誰可以存取」要選「所有人」，而且網址是「網頁應用程式網址」（結尾 /exec）；改完要「管理部署作業 → 編輯 → 新版本 → 部署」。';
  }
  // Google 偶爾會卡住不回應；沒有時限的話畫面會一直停在「登入中…」。每次最多等 FETCH_TIMEOUT 毫秒，超過就中止並重試
  const FETCH_TIMEOUT = Math.max(5000, Number(CFG.timeoutMs) || 20000);
  function fetchT(url, opts) {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT);
    return fetch(url, Object.assign({}, opts, { signal: ac.signal })).finally(() => clearTimeout(t));
  }
  function timeoutMsg(tries) { return 'Google 超過 ' + Math.round(FETCH_TIMEOUT / 1000) + ' 秒沒有回應，已自動重試 ' + tries + ' 次。請確認網路後再試一次；若一直如此，可能是 Google 暫時忙碌，稍等幾分鐘再試。'; }
  function authParams() {
    if (S.role === 'admin') { if (S.atoken) return { atoken: S.atoken }; if (S.key) return { key: S.key }; }
    return S.token ? { token: S.token } : {};
  }
  // 教務組登入：向後端換一組登入憑證，瀏覽器只存憑證、不存密碼；後端是舊版時才退回記住密碼
  async function adminSignIn(key) {
    const r = await apiPost({ action: 'adminLogin', key, label: deviceLabel() });
    if (r.ok && r.atoken) { S.atoken = r.atoken; S.key = null; lsSet(LS.admin, { atoken: r.atoken }); return { ok: true }; }
    if (r.error !== 'unknown_action') return r;
    const v = await apiRead({ key }); // 舊版後端
    if (v.ok && v.role === 'admin') { S.atoken = null; S.key = key; lsSet(LS.admin, { key }); return { ok: true }; }
    return v;
  }
  function adminSignOut() {
    const t = S.atoken;
    if (t) apiPost({ action: 'adminLogout', atoken: t }).catch(() => { });
    lsSet(LS.admin, null); S.key = null; S.atoken = null;
  }
  async function apiGet(params) {
    if (!S.apiUrl) throw new Error('尚未設定資料表網址');
    const u = new URL(S.apiUrl);
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') u.searchParams.set(k, v); });
    for (let i = 0; ; i++) {
      u.searchParams.set('_', Date.now());
      let r = null;
      try { r = await fetchT(u, { redirect: 'follow' }); } catch (e) { if (i >= 2) throw new Error(e && e.name === 'AbortError' ? timeoutMsg(3) : netErr()); }
      if (r && r.ok) return parseJson(r);
      if (r && !(r.status === 404 || r.status === 429 || r.status >= 500)) throw new Error('連不到資料表（' + r.status + '）');
      if (i >= 2) throw new Error('Google 暫時沒有回應，已自動重試 3 次，請稍後再試');
      await new Promise(ok => setTimeout(ok, 1000 * (i + 1)));
    }
  }
  async function apiPost(body) {
    if (!S.apiUrl) throw new Error('尚未設定資料表網址');
    const payload = JSON.stringify(Object.assign({}, authParams(), body));
    for (let i = 0; ; i++) {
      let r = null;
      // 以純文字送 JSON：瀏覽器不做跨網域預檢，Apps Script 由 e.postData.contents 接收
      try { r = await fetchT(S.apiUrl, { method: 'POST', body: payload, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow' }); } catch (e) { if (i >= 2) throw new Error(e && e.name === 'AbortError' ? timeoutMsg(3) : netErr()); }
      if (r && r.ok) return parseJson(r);
      if (r && !(r.status === 404 || r.status === 429 || r.status >= 500)) throw new Error('連不到資料表（' + r.status + '）');
      if (i >= 2) throw new Error('Google 暫時沒有回應');
      await new Promise(ok => setTimeout(ok, 1200 * (i + 1)));
    }
  }
  // 讀取資料：用 POST 送出，密碼與 token 不會出現在網址與伺服器紀錄；後端還是舊版（不認得 read）時自動改用 GET
  async function apiRead(params) {
    if (!S.legacyRead) {
      const r = await apiPost(Object.assign({ action: 'read' }, params));
      if (!(r && r.ok === false && r.error === 'unknown_action')) return r;
      S.legacyRead = true;
    }
    return apiGet(Object.assign(authParams(), params));
  }
  async function parseJson(r) {
    const t = await r.text();
    try { return JSON.parse(t); } catch (e) { throw new Error('資料表回傳的不是資料。請確認 Apps Script 部署時「誰可以存取」選擇「所有人」，且網址以 /exec 結尾。'); }
  }

  /* ---------- 讀取與同步 ---------- */
  let pollTimer = null, hiddenAt = 0;
  function setSync(state, msg) { S.sync = state; S.syncMsg = msg || ''; const el = $('#sync'); if (el) el.replaceWith(renderSync()); }
  async function load(opts) {
    opts = opts || {};
    if (!S.apiUrl || S.screen !== 'app') return;
    const startedAt = Date.now();
    setSync('busy');
    try {
      const params = { rid: S.rid || '' };
      if (!opts.force && S.version && S.loadedRid === S.rid) params.v = S.version;
      const r = await apiRead(params);
      if (!r.ok) { if (r.error === 'auth') return authLost(); if (r.error === 'not_initialized') { S.screen = 'init'; render(); return; } throw new Error(r.error === 'too_many' ? errText('too_many') : '讀取失敗：' + errText(r.error)); }
      S.version = r.version; S.sheetUrl = r.sheetUrl || S.sheetUrl || '';
      if (r.unchanged) { S.lastSync = new Date(); setSync('ok'); return; }
      S.role = r.role; S.config = r.config || { items: [], classes: [] }; S.rounds = r.rounds || []; S.links = r.links || {}; S.claimClosed = !!r.claimClosed;
      if (r.role === 'teacher') S.classId = r.classId;
      S.rid = r.rid || null; S.loadedRid = S.rid;
      applyServer(r.checks || {}, startedAt);
      S.lastSync = new Date(); setSync('ok');
      if (S.role === 'teacher') S.selClass = S.classId;
      if (!S.restored) { S.restored = true; restoreOutbox(); applyServer(r.checks || {}, startedAt); }
      if (opts.full) render(); else renderSoft();
      if (S.pendingScan && opts.full) { const code = S.pendingScan; S.pendingScan = null; const p = parseScan(code); const c = p && classes().find(x => x.id === p.classId); if (c && canEditClass(c.id)) { if (S.role === 'admin') { S.selClass = c.id; renderMain(); } openScan(c); setTimeout(() => S.scan && S.scan.feed(code), 300); } }
    } catch (e) {
      setSync('err', e.message);
      if (opts.full) { S.screen = 'error'; S.gateMsg = e.message; render(); }
    }
  }
  function applyServer(checks, startedAt) {
    const next = {};
    Object.keys(checks).forEach(cid => { next[cid] = { marks: Object.assign({}, checks[cid].marks || {}), notes: Object.assign({}, checks[cid].notes || {}), classNote: checks[cid].classNote || '', updatedAt: checks[cid].updatedAt || '', updatedBy: checks[cid].updatedBy || '' }; });
    S.pendingNotes.forEach((p, key) => {
      if (p.ackAt && p.ackAt < startedAt) { S.pendingNotes.delete(key); return; }
      const [rid, cid, no] = key.split('|');
      if (rid !== S.rid) return;
      const d = next[cid] || (next[cid] = { marks: {}, notes: {}, classNote: '', updatedAt: '', updatedBy: '' });
      if (no === '') d.classNote = p.text; else d.notes[no] = p.text;
    });
    S.pending.forEach((p, key) => {
      if (p.ackAt && p.ackAt < startedAt) { S.pending.delete(key); return; }
      const [rid, cid, no, itemId] = key.split('|');
      if (rid !== S.rid) return;
      const d = next[cid] || (next[cid] = { marks: {}, updatedAt: '', updatedBy: '' });
      d.marks[no] = Object.assign({}, d.marks[no] || {}); d.marks[no][itemId] = p.val;
    });
    S.checks = next;
  }
  function startPolling() {
    clearInterval(pollTimer);
    const sec = Math.max(15, Number(CFG.pollSeconds) || 45);
    pollTimer = setInterval(() => { if (document.visibilityState === 'visible' && S.screen === 'app') load(); }, sec * 1000);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hiddenAt = Date.now();
    else if (S.screen === 'app' && Date.now() - hiddenAt > 8000) load();
  });
  window.addEventListener('online', () => { if (S.screen !== 'app') return; if (outboxCount()) { retryDelay = 0; flush(); } else load(); });
  function authLost() {
    S.pending.clear(); S.outbox.clear(); lsSet(LS.outbox, null);
    if (S.role === 'teacher') { lsSet(LS.teacher, null); S.token = null; S.screen = 'auth-lost'; }
    else { lsSet(LS.admin, null); S.key = null; S.atoken = null; S.screen = 'login'; S.gateMsg = '登入已失效，請重新輸入密碼。'; }
    render();
  }

  /* ---------- 寫入（樂觀更新＋合併送出） ---------- */
  function markKey(rid, cid, no, itemId) { return rid + '|' + cid + '|' + no + '|' + itemId; }
  function isOn(cid, no, itemId) { const d = S.checks[cid]; return !!(d && d.marks && d.marks[String(no)] && d.marks[String(no)][itemId]); }
  function setMark(cid, no, itemId, val, opts) {
    const rid = S.rid; if (!rid) return;
    no = String(no);
    const d = S.checks[cid] || (S.checks[cid] = { marks: {}, updatedAt: '', updatedBy: '' });
    d.marks[no] = Object.assign({}, d.marks[no] || {}); d.marks[no][itemId] = val;
    S.pending.set(markKey(rid, cid, no, itemId), { val, ackAt: null });
    queueChange(rid, cid, { no, itemId, val });
    saveOutbox();
    clearTimeout(S.flushTimer); S.flushTimer = setTimeout(flush, 450);
    if (!(opts && opts.quiet)) { if (!patchCell(cid, no, itemId)) renderSoft(); }
  }
  // 待送出的登記存在這台裝置；網路斷線或關掉網頁也不會遺失，下次開啟（同一身分）自動補送
  function outboxCount() { let n = 0; S.outbox.forEach(b => { n += b.size; }); S.pendingNotes.forEach(p => { if (p.retry) n++; }); return n; }
  function notesUnsent() { let n = 0; S.pendingNotes.forEach(p => { if (!p.ackAt) n++; }); return n; }
  function outboxOwner() { return S.role === 'teacher' ? 't:' + S.classId : S.role === 'admin' ? 'a' : ''; }
  function saveOutbox() {
    const list = []; S.outbox.forEach((box, boxKey) => { const [rid, cid] = boxKey.split('|'); box.forEach(c => list.push({ rid, cid, no: c.no, itemId: c.itemId, val: c.val })); });
    lsSet(LS.outbox, list.length ? { owner: outboxOwner(), list } : null);
  }
  function queueChange(rid, cid, c, keepNewer) {
    const boxKey = rid + '|' + cid; const k = c.no + '|' + c.itemId;
    const box = S.outbox.get(boxKey) || S.outbox.set(boxKey, new Map()).get(boxKey);
    if (keepNewer && box.has(k)) return; // 送出途中又改過，以最新的為準
    box.set(k, { no: String(c.no), itemId: c.itemId, val: !!c.val });
  }
  function restoreOutbox() {
    const saved = lsGet(LS.outbox);
    if (!saved || !Array.isArray(saved.list) || !saved.list.length) return;
    if (saved.owner !== outboxOwner()) { lsSet(LS.outbox, null); return; }
    saved.list.forEach(c => { queueChange(c.rid, c.cid, c, true); S.pending.set(markKey(c.rid, c.cid, c.no, c.itemId), { val: !!c.val, ackAt: null }); });
    toast('發現上次尚未送出的 ' + saved.list.length + ' 筆登記，正在補送…', 3200);
    clearTimeout(S.flushTimer); S.flushTimer = setTimeout(flush, 300);
  }
  let retryTimer = null, retryDelay = 0;
  function scheduleRetry() {
    clearTimeout(retryTimer);
    retryDelay = Math.min(60000, retryDelay ? retryDelay * 2 : 5000);
    retryTimer = setTimeout(flush, retryDelay);
  }
  async function flush() {
    if (S.flushing) return; S.flushing = true;
    clearTimeout(retryTimer);
    let offline = false;
    try {
      while (S.outbox.size) {
        const [boxKey, box] = S.outbox.entries().next().value;
        S.outbox.delete(boxKey);
        const [rid, cid] = boxKey.split('|');
        const changes = Array.from(box.values());
        setSync('busy');
        let r = null, err = null;
        try { r = await apiPost({ action: 'marks', rid, classId: cid, changes }); } catch (e) { err = e; }
        if (r && r.ok) {
          const t = Date.now(); changes.forEach(c => { const p = S.pending.get(markKey(rid, cid, c.no, c.itemId)); if (p) p.ackAt = t; });
          S.version = null; // 強制下次完整讀取
          saveOutbox(); retryDelay = 0;
          continue;
        }
        if (err || (r && r.error === 'busy')) { // 網路斷線或資料表忙碌：保留，稍後自動重送（登記是「設成已交／未交」，重送不會重複計算）
          changes.forEach(c => queueChange(rid, cid, c, true));
          saveOutbox(); offline = true; break;
        }
        changes.forEach(c => S.pending.delete(markKey(rid, cid, c.no, c.itemId)));
        saveOutbox();
        if (r && r.error === 'auth') { authLost(); return; }
        if (r && r.error === 'locked') toast('本次抽查已結案，無法變更；如需更正請洽教務組。', 3200);
        else toast('儲存失敗（' + errText(r && r.error) + '），已還原為資料表內容。', 3600);
      }
    } finally {
      S.flushing = false;
      if (offline) { setSync('err', '網路不穩'); renderSoft(); scheduleRetry(); }
      else setTimeout(() => load({ force: true }), 250);
    }
  }
  window.addEventListener('beforeunload', e => { if (outboxCount() || S.flushing || notesUnsent()) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- 資料工具 ---------- */
  const round = () => S.rounds.find(r => r.id === S.rid) || null;
  const classes = () => (S.config && S.config.classes) || [];
  const allItems = () => (S.config && S.config.items) || [];
  function classHasItem(cls, it) { if (Array.isArray(cls.itemIds)) return cls.itemIds.includes(it.id); return (it.grades || []).map(Number).includes(Number(cls.grade)); }
  const grouped = list => list.filter(it => it.kind !== 'exam').concat(list.filter(it => it.kind === 'exam')); // 習作在前、考卷在後
  function itemsFor(cls, r) { r = r || round(); if (!r || !cls) return []; const ids = new Set(r.itemIds || []); return grouped(allItems().filter(it => ids.has(it.id) && classHasItem(cls, it))); }
  function roundItems(r) { r = r || round(); if (!r) return []; const ids = new Set(r.itemIds || []); return grouped(allItems().filter(it => ids.has(it.id))); }
  // 兩層表頭：習作｜考卷（家長簽名）
  function groupHeaderRow(items, leftCols, rightCols) {
    const hw = items.filter(it => it.kind !== 'exam').length, ex = items.length - hw;
    const tr = h('tr', { class: 'grprow' });
    for (let i = 0; i < leftCols; i++) tr.append(h('td', { class: 'grpblank' }));
    if (hw) tr.append(h('th', { class: 'grp hw', colspan: hw, text: '習作' }));
    if (ex) tr.append(h('th', { class: 'grp exam grpstart', colspan: ex, text: '考卷（家長簽名繳回）' }));
    for (let i = 0; i < rightCols; i++) tr.append(h('td', { class: 'grpblank' }));
    return tr;
  }
  const examStart = (items, i) => items[i].kind === 'exam' && (i === 0 || items[i - 1].kind !== 'exam') ? ' grpstart' : '';
  function countItem(cls, it) { let n = 0; (cls.students || []).forEach(s => { if (isOn(cls.id, s.no, it.id)) n++; }); return n; }
  function classProgress(cls, r) { const its = itemsFor(cls, r); const n = (cls.students || []).length; let got = 0; its.forEach(it => { got += countItem(cls, it); }); return { got, total: n * its.length }; }
  function canEditClass(cid) {
    const r = round(); if (!r) return false;
    if (S.role === 'admin') return true;
    return S.role === 'teacher' && S.classId === cid && !r.locked;
  }
  function dueTag(r) {
    if (!r || !r.due) return null;
    const n = daysUntil(r.due);
    if (n === null) return null;
    if (n > 1) return h('span', { class: 'tag', text: '還有 ' + n + ' 天' });
    if (n === 1) return h('span', { class: 'tag warn', text: '明天截止' });
    if (n === 0) return h('span', { class: 'tag warn', text: '今天截止' });
    return h('span', { class: 'tag seal', text: '已逾期 ' + (-n) + ' 天' });
  }

  /* ---------- 畫面骨架 ---------- */
  function render() {
    const app = $('#app');
    app.replaceChildren();
    if (S.screen !== 'app') { app.append(renderGate()); return; }
    app.append(renderMasthead(), renderRoundbar(), S.role === 'admin' ? renderTabs() : '', h('main', { id: 'main', tabindex: '-1' }), renderFoot());
    renderMain();
  }
  function renderSoft() {
    if (S.screen !== 'app') return;
    const rb = $('#roundbar'); if (rb) rb.replaceWith(renderRoundbar());
    const mh = $('#masthead'); if (mh) mh.replaceWith(renderMasthead());
    if (S.view === 'settings' && S.draft) { if (S.modal && S.modal.refresh) S.modal.refresh(); return; }
    const ae = document.activeElement;
    if (ae && ae.classList && ae.classList.contains('noteinput')) { S.rerenderAfterBlur = true; return; } // 正在打備註，先不重畫
    renderMain();
    if (S.modal && S.modal.refresh) S.modal.refresh();
  }
  /* ---------- 備註（教務組） ---------- */
  function noteValue(cid, no) { const d = S.checks[cid]; if (!d) return ''; return no == null ? (d.classNote || '') : ((d.notes || {})[String(no)] || ''); }
  function setNote(cid, no, text) {
    const rid = S.rid; if (!rid) return;
    text = String(text || '').trim().slice(0, 200);
    const d = S.checks[cid] || (S.checks[cid] = { marks: {}, notes: {}, classNote: '', updatedAt: '', updatedBy: '' });
    if (no == null) d.classNote = text; else { d.notes = d.notes || {}; if (text) d.notes[String(no)] = text; else delete d.notes[String(no)]; }
    const key = rid + '|' + cid + '|' + (no == null ? '' : no);
    S.pendingNotes.set(key, { text, ackAt: null });
    clearTimeout(S.noteTimers[key]);
    const send = async (attempt) => {
      const mine = S.pendingNotes.get(key); if (!mine || mine.text !== text) return; // 之後又改過，交給新的那次送
      setSync('busy');
      let r = null, err = null;
      try { r = await apiPost({ action: 'note', rid, classId: cid, no: no == null ? '' : no, text }); } catch (e) { err = e; }
      if (r && r.ok) { const p = S.pendingNotes.get(key); if (p && p.text === text) { p.ackAt = Date.now(); p.retry = false; } S.version = null; setSync('ok'); return; }
      if (err || (r && r.error === 'busy')) { // 斷線：保留備註，稍後自動重送
        const p = S.pendingNotes.get(key); if (p && p.text === text) p.retry = true;
        setSync('err', '網路不穩'); S.noteTimers[key] = setTimeout(() => send(attempt + 1), Math.min(60000, 5000 * Math.pow(2, attempt))); return;
      }
      if (r.error === 'auth') return authLost();
      S.pendingNotes.delete(key); setSync('err', errText(r.error)); toast('備註儲存失敗：' + errText(r.error), 3200);
    };
    S.noteTimers[key] = setTimeout(() => send(0), 700);
  }
  function noteInput(cid, no, placeholder) {
    const inp = h('input', { type: 'text', class: 'noteinput', value: noteValue(cid, no), placeholder: placeholder || '備註', maxlength: '200', 'aria-label': placeholder || '備註',
      oninput: e => setNote(cid, no, e.target.value),
      onblur: () => { if (S.rerenderAfterBlur) { S.rerenderAfterBlur = false; setTimeout(() => renderSoft(), 50); } },
      onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } });
    return inp;
  }
  function renderMain() {
    const m = $('#main'); if (!m) return;
    document.body.classList.toggle('labels-view', S.role === 'admin' && S.view === 'labels');
    document.body.classList.toggle('report-view', S.role === 'admin' && S.view === 'report');
    m.replaceChildren();
    if (S.role === 'admin' && S.view === 'overview') return m.append(renderOverview());
    if (S.role === 'admin' && S.view === 'settings') return m.append(renderSettings());
    if (S.role === 'admin' && S.view === 'labels') return m.append(renderLabels());
    if (S.role === 'admin' && S.view === 'report') return m.append(renderReport());
    m.append(renderClassView());
    if (S.justStamped) setTimeout(() => { S.justStamped = null; }, 300);
  }
  function renderSync() {
    const el = h('span', { id: 'sync', class: 'sync ' + (S.sync === 'ok' ? '' : S.sync) }, h('i', { class: 'dot' }));
    const waiting = outboxCount();
    if (S.sync === 'busy') el.append('同步中…');
    else if (S.sync === 'err') el.append('無法連線' + (S.lastSync ? '，顯示 ' + fmtTime(S.lastSync) + ' 的資料' : ''));
    else el.append('已同步 ' + fmtTime(S.lastSync));
    if (waiting) { el.classList.add('err'); el.append(h('b', { class: 'waiting', text: '　' + waiting + ' 筆待送出，連線後自動補送' })); }
    el.append(h('button', { class: 'link', 'aria-label': '重新整理', title: '重新整理', onclick: () => load({ force: true }) }, svg('refresh')));
    return el;
  }
  function renderMasthead() {
    const who = h('div', { class: 'who' });
    if (S.role === 'admin') who.append(h('b', { text: CFG.unitName || '教務處' }), '管理者');
    else { const c = classes().find(x => x.id === S.classId); who.append(h('b', { text: c ? c.name : '' }), c && c.teacher ? '導師 ' + c.teacher : '導師'); }
    who.append(renderSync());
    return h('header', { id: 'masthead', class: 'masthead' },
      h('div', null, h('div', { class: 'org', text: [CFG.schoolName, CFG.unitName].filter(Boolean).join('　') }), h('h1', { text: CFG.appName })),
      who);
  }
  function renderRoundbar() {
    const bar = h('section', { id: 'roundbar', class: 'roundbar', 'aria-label': '抽查次別' });
    const sel = h('select', { id: 'roundSel', 'aria-label': '抽查次別', onchange: e => { S.rid = e.target.value; S.version = null; load({ force: true }); renderSoft(); } });
    if (!S.rounds.length) { sel.append(h('option', { text: '尚未建立抽查次別' })); sel.disabled = true; }
    else S.rounds.forEach(r => sel.append(h('option', { value: r.id, text: r.name + (r.locked ? '（已結案）' : ''), selected: r.id === S.rid })));
    bar.append(sel);
    const r = round();
    if (r) {
      const due = h('span', { class: 'due' });
      if (r.due) due.append('繳交截止 ', h('b', { text: fmtDate(r.due) }), dueTag(r));
      else due.append(h('span', { class: 'note', text: '未設定截止日' }));
      if (r.locked) due.append(h('span', { class: 'tag lock' }, svg('lock'), ' 已結案'));
      bar.append(due);
    }
    return bar;
  }
  function renderTabs() {
    const tabs = [['class', '班級檢核'], ['overview', '全校總覽'], ['report', '報表'], ['settings', '設定']];
    const go = id => { S.view = id; if (id !== 'settings') S.draft = null; renderMain(); document.querySelectorAll('nav.tabs button').forEach(b => { const on = b.dataset.view === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }); };
    return h('nav', { class: 'tabs', 'aria-label': '功能分頁' }, h('div', { class: 'tablist', role: 'tablist', 'aria-label': '功能分頁',
      onkeydown: e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return; e.preventDefault(); const i = tabs.findIndex(t => t[0] === S.view); const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; go(tabs[n][0]); const b = document.querySelector('nav.tabs button[data-view="' + tabs[n][0] + '"]'); if (b) b.focus(); } },
      tabs.map(([id, label]) => h('button', { role: 'tab', 'data-view': id, 'aria-controls': 'main', 'aria-selected': String(S.view === id), tabindex: S.view === id ? '0' : '-1', onclick: () => go(id) }, label))));
  }
  function renderFoot() {
    const f = h('footer', { class: 'foot' }, h('span', { text: CFG.appName + '　版本 ' + APP_VERSION + '　資料存於 Google 試算表，開啟網頁即為最新。' }));
    const cur = lsGet(LS.theme) || 'auto';
    const curName = (THEMES.find(t => t[0] === cur) || THEMES[0])[1];
    f.append(h('button', { class: 'link', 'aria-label': '切換外觀，目前為' + curName, onclick: () => { const i = THEMES.findIndex(t => t[0] === (lsGet(LS.theme) || 'auto')); const next = THEMES[(i + 1) % THEMES.length]; lsSet(LS.theme, next[0] === 'auto' ? null : next[0]); applyTheme(); toast('外觀：' + next[1] + (next[0] === 'auto' ? '（跟隨系統）' : '')); const of = document.querySelector('footer.foot'); if (of) { of.replaceWith(renderFoot()); const nb = document.querySelector('footer.foot .themebtn'); if (nb) nb.focus(); } }, class: 'link themebtn' }, '外觀：' + curName));
    if (S.role === 'teacher') f.append(armed(h('button', { class: 'link' }), '在此裝置登出', '再按一次確認登出（之後需請教務組解除才能重新登入）', () => { lsSet(LS.teacher, null); S.token = null; S.screen = 'login'; S.gateMsg = '已在此裝置登出。'; render(); }, 4000));
    else f.append(h('button', { class: 'link', onclick: () => { adminSignOut(); S.screen = 'login'; S.gateMsg = ''; render(); } }, '登出'));
    return f;
  }

  /* ---------- 班級頁 ---------- */
  function renderClassView() {
    const box = h('div', { class: 'stack' });
    const cl = classes();
    if (!S.config || !cl.length) return h('div', { class: 'empty', text: S.role === 'admin' ? '尚未建立班級，請到「設定」新增班級與學生名單。' : '尚未建立班級資料，請洽教務組。' });
    if (!S.rounds.length) return h('div', { class: 'empty', text: S.role === 'admin' ? '尚未建立抽查次別，請到「設定」建立第一次抽查。' : '目前沒有進行中的作業抽查。' });
    let cls;
    if (S.role === 'admin') {
      const saved = S.selClass || lsGet(LS.cls);
      cls = cl.find(c => c.id === saved) || cl[0]; S.selClass = cls.id;
      box.append(h('div', { class: 'chips' }, cl.map(c => h('button', { class: 'chip', 'aria-pressed': String(c.id === cls.id), onclick: () => { S.selClass = c.id; lsSet(LS.cls, c.id); renderMain(); } }, c.name))));
    } else {
      cls = cl.find(c => c.id === S.classId) || cl[0];
    }
    const r = round(); const items = itemsFor(cls, r); const studs = (cls.students || []).slice().sort((a, b) => a.no - b.no); const n = studs.length;
    const ed = canEditClass(cls.id);
    const admin = S.role === 'admin';
    const d = S.checks[cls.id];

    const sub = h('div', { class: 'sub' }, h('span', { text: '全班 ' + n + ' 人' }));
    if (cls.teacher) sub.prepend(h('span', { text: '導師 ' + cls.teacher }));
    if (admin && d && d.updatedAt) sub.append(h('span', { text: '最後登記 ' + fmtStamp(d.updatedAt) + (d.updatedBy ? '（' + d.updatedBy + '）' : '') }));
    const actions = h('div', { class: 'row' });
    if (ed) actions.append(h('button', { class: 'btn primary small', onclick: () => openScan(cls) }, svg('scan'), '掃描登記'));
    actions.append(h('button', { class: 'btn ghost small', onclick: () => openMissing([cls]) }, svg('list'), '未交名單'));
    if (admin) actions.append(
      h('button', { class: 'btn ghost small', title: '匯出本班 CSV（全校請到「全校總覽」）', onclick: () => exportCSV([cls]) }, svg('down'), '本班 CSV'),
      h('button', { class: 'btn ghost small', onclick: () => window.print() }, svg('print'), '列印'));
    const headLeft = h('div', { class: 'row' });
    { const prog = classProgress(cls, r); headLeft.append(ring(prog.total ? Math.round(prog.got / prog.total * 100) : 0)); }
    headLeft.append(h('div', null, h('h2', { text: cls.name }), sub));
    box.append(h('div', { class: 'classhead' }, headLeft, actions));
    box.append(h('div', { class: 'print-meta', text: (CFG.schoolName || '') + '　' + (r ? r.name : '') + '　' + cls.name + '　列印時間 ' + new Date().toLocaleString('zh-TW') }));

    if (!items.length) { box.append(h('div', { class: 'empty', text: '這次抽查沒有適用於本班的項目。' + (admin ? '請到「設定」檢查本次抽查項目與本班的習作項目。' : '') })); return box; }
    if (!n) { box.append(h('div', { class: 'empty', text: admin ? '這個班級還沒有學生名單，請到「設定」貼上名單。' : '這個班級還沒有學生名單，請洽教務組。' })); return box; }

    if (!ed) box.append(h('div', { class: 'banner info', text: r && r.locked && S.role === 'teacher' ? '本次抽查已結案，紀錄僅供查看；如需更正請洽教務組。' : '目前為查看模式。' }));
    else box.append(h('div', { class: 'note', text: '收到該生的習作或家長簽名考卷，就點一下對應的格子；再點一次可取消。畫面會自動儲存。' }));

    box.append(renderTable(cls, items, studs, ed, admin));
    return box;
  }
  function ring(pct) {
    const r = 26, c = 2 * Math.PI * r;
    const el = h('div', { class: 'ring', title: '本班完成率' });
    el.innerHTML = '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--accent-soft)" stroke-width="6"/><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + (pct === 100 ? 'var(--ok)' : 'var(--accent)') + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct / 100)) + '"/></svg>';
    el.append(h('span', { text: pct + '%' }));
    return el;
  }
  function toggleBtn(cls, s, it, ed) {
    const on = isOn(cls.id, s.no, it.id);
    return h('button', { type: 'button', class: 'chk' + (it.kind === 'exam' ? ' exam' : ''), 'data-no': String(s.no), 'data-item': it.id, role: 'switch', 'aria-checked': String(on), 'aria-label': s.no + '號 ' + (s.name || '') + ' ' + it.name + (on ? (it.kind === 'exam' ? '（已繳回）' : '（已交）') : '（未交）'), title: it.name, disabled: !ed,
      onclick: () => setMark(cls.id, s.no, it.id, !isOn(cls.id, s.no, it.id)) });
  }
  // 一張表：列＝學生，欄＝各科習作＋考卷簽回；教務組多看到每欄人數與「收件」快捷
  function renderTable(cls, items, studs, ed, admin) {
    const n = studs.length;
    const thead = h('tr', null, h('th', { class: 'no', text: '座號' }), h('th', { class: 'name', text: '姓名' }),
      items.map((it, i) => {
        const th = h('th', { class: (it.kind === 'exam' ? 'exam' : '') + examStart(items, i) }, h('div', { text: it.short || it.name }));
        const who = (cls.subjectTeachers || {})[it.id];
        if (who) th.append(h('span', { class: 'who', text: who }));
        { th.append(h('span', { class: 'cnt', 'data-item': it.id, text: countItem(cls, it) + '/' + n })); if (ed) th.append(h('button', { class: 'link', onclick: () => openQuick(cls, it) }, '收件')); }
        return th;
      }),
      admin ? h('th', { text: '狀態' }) : null, admin ? h('th', { class: 'notecol', text: '備註（給主任、校長看）' }) : null);
    const rows = studs.map(s => {
      const miss = items.filter(it => !isOn(cls.id, s.no, it.id)).length;
      return h('tr', { class: miss === 0 ? 'allin' : null, 'data-no': String(s.no) },
        h('td', { class: 'no', text: String(s.no) }), h('td', { class: 'name', text: s.name || '—' }),
        items.map((it, i) => h('td', { class: 'cell' + examStart(items, i) }, toggleBtn(cls, s, it, ed))),
        admin ? h('td', { class: 'st', text: miss === 0 ? '全部繳齊' : '缺 ' + miss + ' 項' }) : null, admin ? h('td', { class: 'notecol' }, noteInput(cls.id, s.no, '例如：未訂正、補交、家長未簽名')) : null);
    });
    const table = h('table', { class: 'grid', 'data-cid': cls.id }, h('thead', null, groupHeaderRow(items, 2, admin ? 2 : 0), thead), h('tbody', null, rows));
    const allIn = studs.filter(s => items.every(it => isOn(cls.id, s.no, it.id))).length;
    table.append(h('tfoot', null, h('tr', { class: 'tfoot' }, h('td', { colspan: 2, class: 'flabel', text: admin ? '已交人數' : '已交（' + allIn + ' 人繳齊）' }), items.map((it, i) => h('td', { class: examStart(items, i).trim() || null, 'data-item': it.id, text: countItem(cls, it) + ' / ' + n })), admin ? h('td', { class: 'allincnt', text: allIn + ' 人繳齊' }) : null, admin ? h('td') : null)));
    const legend = h('div', { class: 'legend' },
      h('span', null, h('i', { style: 'background:var(--accent)' }), '習作已交'),
      h('span', null, h('i', { style: 'background:var(--seal)' }), '考卷已由家長簽名並繳回'),
      h('span', null, h('i', { style: 'background:var(--sheet);border:1.5px solid var(--line-strong)' }), '尚未繳交'));
    const out = h('div', { class: 'stack' });
    if (admin) out.append(h('div', { class: 'row' }, h('span', { class: 'note', text: '本班備註' }), h('div', { class: 'grow' }, noteInput(cls.id, null, '整班的說明，例如：11/10 全班補交完成'))));
    out.append(h('div', { class: 'tablebox' }, table), legend);
    return out;
  }

  // 點一格只更新這一格與相關數字（30 人 × 13 項時，整張表重畫在中低階手機約 150 ms，只改一格幾乎即時）
  function patchCell(cid, no, itemId) {
    try {
      if (S.screen !== 'app' || S.view !== 'class' || S.modal) return false;
      const table = document.querySelector('table.grid[data-cid="' + cid + '"]'); if (!table) return false;
      const cls = classes().find(c => c.id === cid); const it = allItems().find(x => x.id === itemId); if (!cls || !it) return false;
      const s = (cls.students || []).find(x => String(x.no) === String(no)); if (!s) return false;
      const btn = table.querySelector('button.chk[data-no="' + no + '"][data-item="' + itemId + '"]'); if (!btn) return false;
      const on = isOn(cid, no, itemId);
      btn.setAttribute('aria-checked', String(on));
      btn.setAttribute('aria-label', s.no + '號 ' + (s.name || '') + ' ' + it.name + (on ? (it.kind === 'exam' ? '（已繳回）' : '（已交）') : '（未交）'));
      const items = itemsFor(cls); const studs = cls.students || []; const n = studs.length;
      const tr = table.querySelector('tbody tr[data-no="' + no + '"]');
      if (tr) { const miss = items.filter(x => !isOn(cid, s.no, x.id)).length; tr.classList.toggle('allin', miss === 0); const st = tr.querySelector('td.st'); if (st) st.textContent = miss === 0 ? '全部繳齊' : '缺 ' + miss + ' 項'; }
      const c = countItem(cls, it);
      const cnt = table.querySelector('thead .cnt[data-item="' + itemId + '"]'); if (cnt) cnt.textContent = c + '/' + n;
      const ft = table.querySelector('tfoot td[data-item="' + itemId + '"]'); if (ft) ft.textContent = c + ' / ' + n;
      const allIn = studs.filter(x => items.every(y => isOn(cid, x.no, y.id))).length;
      const ac = table.querySelector('tfoot td.allincnt'); if (ac) ac.textContent = allIn + ' 人繳齊';
      if (S.role !== 'admin') { const fl = table.querySelector('tfoot td.flabel'); if (fl) fl.textContent = '已交（' + allIn + ' 人繳齊）'; }
      const oldRing = document.querySelector('#main .classhead .ring');
      if (oldRing) { const p = classProgress(cls); oldRing.replaceWith(ring(p.total ? Math.round(p.got / p.total * 100) : 0)); }
      return true;
    } catch (e) { return false; }
  }

  /* ---------- 快速收件（依項目逐號登記） ---------- */
  const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function openModal(build) {
    const opener = S.modal ? S.modal.opener : document.activeElement;
    closeModal(true);
    const inner = h('div', { class: 'inner', role: 'dialog', 'aria-modal': 'true', tabindex: '-1' });
    const ov = h('div', { class: 'modal', onclick: e => { if (e.target === ov) closeModal(); } }, inner);
    const label = () => { const t = inner.querySelector('h3'); if (t) { t.id = t.id || 'dlgTitle'; inner.setAttribute('aria-labelledby', t.id); } };
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
      if (e.key !== 'Tab') return;
      const f = Array.from(inner.querySelectorAll(FOCUSABLE)).filter(x => x.offsetParent !== null);
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !inner.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !inner.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    S.modal = { el: ov, opener, refresh: () => { const keep = document.activeElement && inner.contains(document.activeElement) ? Array.from(inner.querySelectorAll(FOCUSABLE)).indexOf(document.activeElement) : -1; inner.replaceChildren(); build(inner); label(); if (keep >= 0) { const f = inner.querySelectorAll(FOCUSABLE)[keep]; if (f) f.focus({ preventScroll: true }); } }, onKey };
    build(inner); label(); document.body.append(ov);
    document.body.classList.add('modal-open');
    setTimeout(() => { if (S.modal && S.modal.el === ov && !inner.contains(document.activeElement)) inner.focus({ preventScroll: true }); }, 60);
    return S.modal;
  }
  function closeModal(silent) {
    if (!S.modal) return;
    const m = S.modal; S.modal = null;
    if (m.onClose) { try { m.onClose(); } catch (e) { } }
    m.el.remove(); document.removeEventListener('keydown', m.onKey);
    document.body.classList.remove('modal-open');
    if (S.mainDirty) { S.mainDirty = false; renderSoft(); }
    if (!silent && m.opener && m.opener.isConnected && m.opener.focus) m.opener.focus({ preventScroll: true });
  }
  function openQuick(cls, it) {
    openModal(inner => {
      const c = classes().find(x => x.id === cls.id) || cls;
      const studs = (c.students || []).slice().sort((a, b) => a.no - b.no); const n = studs.length;
      const ed = canEditClass(c.id);
      const got = studs.filter(s => isOn(c.id, s.no, it.id));
      const miss = studs.filter(s => !isOn(c.id, s.no, it.id));
      inner.append(h('h3', null, (it.kind === 'exam' ? '登記繳回' : '收件登記'), h('small', { text: c.name + ' · ' + it.name })));
      inner.append(h('div', { class: 'note', text: it.kind === 'exam' ? '點選已將家長簽名考卷繳回的座號；再點一次可取消。' : '依收到的習作點選座號；再點一次可取消。' }));
      inner.append(h('div', { class: 'row between' },
        h('div', { class: 'counter' }, h('b', { text: String(got.length) }), '／' + n + ' 人' + (it.kind === 'exam' ? '已繳回' : '已交')),
        h('div', { class: 'row' },
          ed ? armed(h('button', { class: 'btn small ghost' }), '全部' + (it.kind === 'exam' ? '繳回' : '已交'), '確定全部勾選？', () => { studs.forEach(s => { if (!isOn(c.id, s.no, it.id)) setMark(c.id, s.no, it.id, true, { quiet: true }); }); S.mainDirty = true; if (S.modal && S.modal.refresh) S.modal.refresh(); }) : null,
          ed ? armed(h('button', { class: 'btn small ghost' }), '全部清除', '確定全部取消？', () => { studs.forEach(s => { if (isOn(c.id, s.no, it.id)) setMark(c.id, s.no, it.id, false, { quiet: true }); }); S.mainDirty = true; if (S.modal && S.modal.refresh) S.modal.refresh(); }) : null)));
      inner.append(h('div', { class: 'tiles' + (it.kind === 'exam' ? ' exam' : '') }, studs.map(s => h('button', { type: 'button', class: 'tile', role: 'switch', 'aria-checked': String(isOn(c.id, s.no, it.id)), 'aria-label': s.no + '號 ' + (s.name || ''), disabled: !ed, onclick: () => { setMark(c.id, s.no, it.id, !isOn(c.id, s.no, it.id), { quiet: true }); S.mainDirty = true; if (S.modal && S.modal.refresh) S.modal.refresh(); } }, h('b', { text: String(s.no) }), h('small', { text: s.name || '' })))));
      inner.append(h('div', { class: 'miss', text: miss.length ? '尚未' + (it.kind === 'exam' ? '繳回' : '交') + '：' + miss.map(s => s.no + '號').join('、') : '全班皆已' + (it.kind === 'exam' ? '繳回' : '繳交') + '。' }));
      inner.append(h('div', { class: 'row', style: 'justify-content:flex-end' }, h('button', { class: 'btn primary', onclick: closeModal }, '完成')));
    });
  }

  /* ---------- 未交名單（可複製貼 LINE） ---------- */
  function missingText(list) {
    const r = round(); const out = [];
    list.forEach(cls => {
      const items = itemsFor(cls, r); const studs = (cls.students || []).slice().sort((a, b) => a.no - b.no);
      const lines = []; let any = false;
      items.forEach(it => {
        const miss = studs.filter(s => !isOn(cls.id, s.no, it.id)).map(s => s.no + '號' + (s.name ? ' ' + s.name : ''));
        if (miss.length) { any = true; lines.push((it.kind === 'exam' ? it.name + ' 未繳回' : it.name + ' 未交') + ' ' + miss.length + ' 人：' + miss.join('、')); }
      });
      if (!items.length || !studs.length) return;
      out.push({ cls, any, lines });
    });
    const head = ['【作業抽查未交提醒】' + (r ? r.name : '')];
    if (r && r.due) head.push('繳交截止：' + fmtDate(r.due));
    const body = out.map(o => [o.cls.name + (o.cls.teacher ? '（導師 ' + o.cls.teacher + '）' : ''), ...(o.any ? o.lines : ['全班皆已繳交，謝謝。'])].join('\n'));
    const tail = out.some(o => o.any) ? '請於截止日前將習作與家長簽名考卷送至教務組，謝謝。' : '';
    return [head.join('\n'), ...body, tail].filter(Boolean).join('\n\n');
  }
  function openMissing(list) {
    openModal(inner => {
      const text = missingText(list);
      const ta = h('textarea', { readonly: true, 'aria-label': '未交名單文字' }); ta.value = text;
      inner.append(h('h3', null, '未交名單', h('small', { text: list.length > 1 ? '全校' : list[0].name })), ta,
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', onclick: async () => { toast((await copyText(text)) ? '已複製，可直接貼到 LINE 群組' : '無法自動複製，請長按文字選取後複製'); } }, svg('copy'), '複製文字'),
          h('button', { class: 'btn ghost', onclick: closeModal }, '關閉')));
    });
  }

  /* ---------- 掃描登記（相機或條碼掃描器） ---------- */
  // 條碼編號：年級(1碼)＋班序(2碼)＋座號(2碼)，例如 10101＝一年甲班 1 號；含科目再加 2 碼科目代碼，例如 1010102＝一甲 1 號 數學
  const ITEM_CODE_DEFAULT = { chinese: '01', math: '02', english: '03', life: '04', social: '05', science: '06', health: '07', exam: '09', exam_chinese: '11', exam_math: '12', exam_english: '13', exam_life: '14', exam_social: '15', exam_science: '16' };
  const pad2 = n => String(n).padStart(2, '0');
  function itemCode(it) {
    if (!it) return '';
    if (it.code && /^\d{1,2}$/.test(String(it.code))) return pad2(it.code);
    if (ITEM_CODE_DEFAULT[it.id]) return ITEM_CODE_DEFAULT[it.id];
    const used = new Set(allItems().map(x => x.code ? pad2(x.code) : ITEM_CODE_DEFAULT[x.id]).filter(Boolean));
    let n = 10; const idx = allItems().findIndex(x => x.id === it.id);
    for (let i = 0; i <= idx; i++) { const x = allItems()[i]; if (x.code || ITEM_CODE_DEFAULT[x.id]) continue; while (used.has(pad2(n))) n++; if (x.id === it.id) return pad2(n); used.add(pad2(n)); n++; }
    return pad2(n);
  }
  function classNo(cls) { if (cls.classNo > 0) return Number(cls.classNo); const m = String(cls.name || '').match(/[甲乙丙丁戊己]/); return m ? '甲乙丙丁戊己'.indexOf(m[0]) + 1 : 1; }
  function studentCode(cls, s) { return String(Number(cls.grade) || 0) + pad2(classNo(cls)) + pad2(s.no); }
  function scanPayload(cls, s, it) { return studentCode(cls, s) + (it ? itemCode(it) : ''); }
  function parseScan(text) {
    text = String(text || '').trim();
    if (!text) return null;
    const m1 = text.match(/[#?&]s=([A-Za-z0-9_.\-]+)/); if (m1) text = m1[1];
    text = text.replace(/^HW\./i, '');
    let m = text.match(/^(\d)(\d{2})(\d{2})(\d{2})?$/);
    if (m) {
      const cls = classes().find(c => Number(c.grade) === Number(m[1]) && classNo(c) === Number(m[2]));
      let itemId = null;
      if (m[4]) { const it = allItems().find(x => itemCode(x) === m[4]); itemId = it ? it.id : '?' + m[4]; }
      return { classId: cls ? cls.id : 'G' + m[1] + m[2], no: parseInt(m[3], 10), itemId, code: text };
    }
    m = text.match(/^([A-Za-z0-9_\-]+)\.(\d+)(?:\.([A-Za-z0-9_\-]+))?$/); // 舊格式 g3.5.math
    if (m) return { classId: m[1], no: parseInt(m[2], 10), itemId: m[3] || null, code: text };
    return null;
  }
  let audioCtx = null;
  function beep(kind) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = kind === 'ok' ? 1046 : kind === 'dup' ? 660 : 220; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (kind === 'err' ? 0.35 : 0.12));
      o.start(); o.stop(audioCtx.currentTime + 0.4);
    } catch (e) { }
    try { if (navigator.vibrate) navigator.vibrate(kind === 'err' ? [60, 40, 60] : 40); } catch (e) { }
  }
  function openScan(cls0) {
    const sc = { itemId: null, log: [], count: 0, lastCode: '', lastAt: 0, stream: null, timer: null, cam: false, kb: false };
    S.scan = sc;
    let statusEl, logEl, counterEl, input, video, canvas, camBtn, itemSel;
    const cls = () => classes().find(c => c.id === cls0.id) || cls0;
    const show = (kind, title, sub) => {
      statusEl.className = 'scanstatus ' + kind;
      statusEl.replaceChildren(h('div', { class: 'big', text: title }), h('div', { class: 'small', text: sub || '' }));
      beep(kind === 'ok' ? 'ok' : kind === 'dup' ? 'dup' : 'err');
    };
    const handle = (raw, fromCam) => {
      const now = Date.now();
      if (fromCam && raw === sc.lastCode && now - sc.lastAt < 2500) return; // 相機連續讀到同一張
      sc.lastCode = raw; sc.lastAt = now;
      const p = parseScan(raw);
      if (!p) return show('err', '看不懂這個條碼', raw.slice(0, 40));
      const c = cls();
      if (p.classId !== c.id) {
        const other = classes().find(x => x.id === p.classId);
        if (S.role === 'admin' && other) { closeScan(); S.selClass = other.id; lsSet(LS.cls, other.id); renderMain(); openScan(other); setTimeout(() => S.scan && S.scan.feed(raw), 50); return; }
        return show('err', S.role === 'teacher' ? '這不是本班的習作' : (other ? '這是 ' + other.name + ' 的，不是本班' : '找不到這個班級（編號 ' + (p.code || raw) + '）'), raw);
      }
      const st = (c.students || []).find(x => x.no === p.no);
      if (!st) return show('err', '本班沒有 ' + p.no + ' 號', raw);
      const items = itemsFor(c);
      let it = p.itemId ? items.find(x => x.id === p.itemId) : items.find(x => x.id === sc.itemId);
      if (p.itemId && !it) {
        if (String(p.itemId).startsWith('?')) return show('err', '沒有代碼 ' + p.itemId.slice(1) + ' 的項目', raw);
        const anyIt = allItems().find(x => x.id === p.itemId); const rr = round();
        const inRound = anyIt && rr && (rr.itemIds || []).includes(anyIt.id);
        return show('err', inRound ? c.name + '沒有「' + anyIt.name + '」' : '「' + (anyIt ? anyIt.name : p.itemId) + '」不在本次抽查', inRound ? '這個項目不適用本班（可在「設定 → 班級」調整）' : raw);
      }
      if (!it) return show('err', '請先在上方選擇要登記的項目', '這張標籤沒有科目');
      const label = st.no + '號 ' + (st.name || '') + '　' + it.name;
      if (isOn(c.id, st.no, it.id)) { show('dup', '已經登記過', label); return; }
      setMark(c.id, st.no, it.id, true, { quiet: true }); S.mainDirty = true;
      sc.count++; counterEl.textContent = String(sc.count);
      sc.log.unshift(label); if (sc.log.length > 8) sc.log.pop();
      logEl.replaceChildren(...sc.log.map((t, i) => h('li', { class: i === 0 ? 'new' : null, text: t })));
      show('ok', '已登記', label);
    };
    sc.feed = handle;
    const stopCam = () => { sc.cam = false; clearInterval(sc.timer); if (sc.stream) { sc.stream.getTracks().forEach(t => t.stop()); sc.stream = null; } if (video) { video.srcObject = null; video.hidden = true; } if (camBtn) camBtn.textContent = '開啟相機掃描'; };
    const startCam = async () => {
      if (sc.cam) return stopCam();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return toast('這個瀏覽器無法使用相機，請改用掃描器或手動輸入');
      try { sc.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
      catch (e) { return toast('無法開啟相機：' + (e.name === 'NotAllowedError' ? '請允許網站使用相機' : e.message), 3600); }
      video.hidden = false; video.srcObject = sc.stream; await video.play().catch(() => { });
      sc.cam = true; camBtn.textContent = '關閉相機';
      let detector = null;
      if ('BarcodeDetector' in window) { try { detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'] }); } catch (e) { detector = null; } }
      if (!detector && !window.jsQR) await new Promise(res => { const el = h('script', { src: 'assets/vendor/jsQR.js', onload: res, onerror: res }); document.head.append(el); });
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let busy = false;
      sc.timer = setInterval(async () => {
        if (busy || !sc.cam || video.readyState < 2) return; busy = true;
        try {
          if (detector) { const codes = await detector.detect(video); if (codes.length) handle(codes[0].rawValue, true); }
          else if (window.jsQR) {
            const w = 480, hgt = Math.round(w * video.videoHeight / (video.videoWidth || 1)) || 360;
            canvas.width = w; canvas.height = hgt; ctx.drawImage(video, 0, 0, w, hgt);
            const img = ctx.getImageData(0, 0, w, hgt); const code = window.jsQR(img.data, w, hgt, { inversionAttempts: 'dontInvert' });
            if (code && code.data) handle(code.data, true);
          }
        } catch (e) { } finally { busy = false; }
      }, 180);
    };
    const c = cls(); const items = itemsFor(c);
    openModal(inner => {
      inner.classList.add('scanmode');
      itemSel = h('select', { 'aria-label': '登記項目', onchange: e => { sc.itemId = e.target.value || null; } }, h('option', { value: '', text: '標籤上有科目就不用選' }),
        h('optgroup', { label: '習作' }, items.filter(it => it.kind !== 'exam').map(it => h('option', { value: it.id, text: it.name, selected: sc.itemId === it.id }))),
        h('optgroup', { label: '考卷（家長簽名繳回）' }, items.filter(it => it.kind === 'exam').map(it => h('option', { value: it.id, text: it.name, selected: sc.itemId === it.id }))));
      statusEl = h('div', { class: 'scanstatus idle' }, h('div', { class: 'big', text: '請掃描習作上的標籤' }), h('div', { class: 'small', text: '相機對準 QR Code，或用掃描器直接掃' }));
      counterEl = h('b', { text: String(sc.count) });
      logEl = h('ul', { class: 'scanlog' });
      input = h('input', { type: 'text', id: 'scanInput', class: 'scaninput', inputmode: 'none', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: '掃描器會自動輸入到這裡', 'aria-label': '掃描器輸入',
        onkeydown: e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); const v = input.value; input.value = ''; if (v.trim()) handle(v); } },
        onblur: () => { if (S.scan === sc && !sc.cam) setTimeout(() => { if (S.scan === sc && document.activeElement !== input && !sc.kb) input.focus({ preventScroll: true }); }, 400); } });
      video = h('video', { playsinline: true, muted: true, autoplay: true, hidden: true, class: 'scanvideo' });
      canvas = h('canvas', { hidden: true });
      camBtn = h('button', { class: 'btn ghost', onclick: startCam }, '開啟相機掃描');
      const kbBtn = h('button', { class: 'btn ghost small', onclick: () => { sc.kb = !sc.kb; input.setAttribute('inputmode', sc.kb ? 'text' : 'none'); input.placeholder = sc.kb ? '輸入編號後按 Enter，例如 ' + studentCode(c, { no: 1 }) + '（1 號）' : '掃描器會自動輸入到這裡'; input.focus(); } }, '手動輸入');
      inner.append(
        h('div', { class: 'row between' }, h('h3', null, '掃描登記', h('small', { text: c.name })), h('button', { class: 'btn ghost small', onclick: closeScan }, '結束')),
        h('div', { class: 'row' }, h('span', { class: 'note', text: '登記項目' }), itemSel),
        statusEl, video, canvas,
        h('div', { class: 'row between' }, h('div', { class: 'counter' }, '本次已掃 ', counterEl, ' 本'), h('div', { class: 'row' }, camBtn, kbBtn)),
        input, logEl,
        h('div', { class: 'note', text: '同一本重複掃不會取消，只會提示「已經登記過」。掃描器請設定為掃完自動送出 Enter。' }));
      setTimeout(() => { if (!S.narrow) input.focus({ preventScroll: true }); }, 50);
    });
    sc.close = () => { stopCam(); S.scan = null; };
    function closeScan() { closeModal(); renderMain(); }
    S.modal.onClose = sc.close;
    S.modal.refresh = () => { }; // 掃描中不重繪，避免相機與輸入框被重置
  }

  /* ---------- 最小 .xlsx 產生器（給 NIIMBOT 等標籤機 App 匯入；全部存成文字，座號不會掉 0） ---------- */
  const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipStore(files) {
    const enc = new TextEncoder(); const parts = []; const cd = []; let off = 0;
    const d = new Date(); const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1); const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; const u16 = v => [v & 255, (v >>> 8) & 255];
    Object.keys(files).forEach(name => {
      const nm = enc.encode(name), data = enc.encode(files[name]), crc = crc32(data);
      const lh = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0)]);
      parts.push(lh, nm, data);
      cd.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nm);
      off += lh.length + nm.length + data.length;
    });
    const cdLen = cd.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(Object.keys(files).length), ...u16(Object.keys(files).length), ...u32(cdLen), ...u32(off), ...u16(0)]);
    return new Blob([...parts, ...cd, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xlsxBlob(rows, sheetName) {
    const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const colName = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    const ncol = Math.max(...rows.map(r => r.length));
    let sh = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="' + ncol + '" width="16" customWidth="1"/></cols><sheetData>';
    rows.forEach((r, ri) => { sh += '<row r="' + (ri + 1) + '">'; r.forEach((v, ci) => { sh += '<c r="' + colName(ci) + (ri + 1) + '" t="inlineStr"><is><t xml:space="preserve">' + esc(v) + '</t></is></c>'; }); sh += '</row>'; });
    sh += '</sheetData></worksheet>';
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return zipStore({
      '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      '_rels/.rels': X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + esc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/worksheets/sheet1.xml': sh
    });
  }
  function downloadBlob(blob, filename) { const a = h('a', { href: URL.createObjectURL(blob), download: filename }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  // 標籤資料列（與列印用同一套內容）
  function labelRows() {
    const cl = classes(); const r = round(); const base = location.href.split('#')[0].split('?')[0];
    const rows = [['班級', '座號', '姓名', '科目', '班級座號', '條碼內容', '學生編號', '編號科目', '標籤文字']];
    cl.filter(c => (LB.classIds || []).includes(c.id)).forEach(c => {
      const its = LB.mode === 'book' ? itemsFor(c, r).filter(it => LB.exams || it.kind !== 'exam') : [null];
      (c.students || []).slice().sort((a, b) => a.no - b.no).forEach(s => its.forEach(it => {
        const payload = scanPayload(c, s, it);
        rows.push([c.name, pad2(s.no), s.name || '', it ? it.name : '作業抽查', c.name + ' ' + pad2(s.no) + '號', LB.url ? base + '#s=' + payload : payload, studentCode(c, s), studentCode(c, s) + (it ? it.name : ''), studentCode(c, s) + (it ? it.name : '') + '\n' + (s.name || '') + ' ' + c.name + pad2(s.no) + '號']);
      }));
    });
    return rows;
  }

  /* ---------- 標籤列印（教務組） ---------- */
  const LABEL_SIZES = [
    { id: 'a4-44x25', name: 'A4 貼紙（每格 44×25 mm，4 欄）', w: 44, h: 25, sheet: 'A4' },
    { id: 'a4-63x38', name: 'A4 貼紙（每格 63.5×38.1 mm，3 欄 7 列）', w: 63.5, h: 38.1, sheet: 'A4' },
    { id: 'a4-70x37', name: 'A4 貼紙（每格 70×37 mm，2 欄）', w: 70, h: 37, sheet: 'A4' },
    { id: 'tape-62x29', name: '標籤機 62×29 mm（Brother QL）', w: 62, h: 29 },
    { id: 'tape-50x30', name: '標籤機 50×30 mm', w: 50, h: 30 },
    { id: 'tape-40x30', name: '標籤機 40×30 mm', w: 40, h: 30 },
    { id: 'tape-36x24', name: '標籤機 36×24 mm（小標籤）', w: 36, h: 24 }
  ];
  const LB = { classIds: null, mode: 'book', code: 'qr', size: 'a4-44x25', url: false, exams: false };
  function loadLib(src, ready) { return new Promise(res => { if (ready()) return res(true); const el = h('script', { src, onload: () => res(ready()), onerror: () => res(false) }); document.head.append(el); }); }
  function renderLabels() {
    const box = h('div', { class: 'stack' });
    const cl = classes(); if (!LB.classIds) LB.classIds = cl.map(c => c.id);
    const r = round();
    box.append(h('div', { class: 'row between' }, h('h2', { style: 'font-family:var(--f-display);margin:0;font-size:20px', text: '習作標籤' }), h('button', { class: 'btn ghost small', onclick: () => { S.view = 'settings'; renderMain(); } }, '← 回設定')));
    const opt = h('div', { class: 'panel no-print' });
    opt.append(h('div', { class: 'row' }, h('span', { class: 'note', text: '班級' }), cl.map(c => h('label', { class: 'ck' }, h('input', { type: 'checkbox', checked: LB.classIds.includes(c.id), onchange: e => { LB.classIds = cl.map(x => x.id).filter(id => id === c.id ? e.target.checked : LB.classIds.includes(id)); redraw(); } }), c.name))));
    opt.append(h('div', { class: 'row' }, h('span', { class: 'note', text: '一張標籤代表' }),
      h('label', { class: 'ck' }, h('input', { type: 'radio', name: 'lbmode', checked: LB.mode === 'book', onchange: () => { LB.mode = 'book'; redraw(); } }), '一本習作（含科目；每生每科一張，掃了直接登記）'),
      h('label', { class: 'ck' }, h('input', { type: 'radio', name: 'lbmode', checked: LB.mode === 'student', onchange: () => { LB.mode = 'student'; redraw(); } }), '一位學生（不含科目；掃描時先選科目）'),
      h('label', { class: 'ck' }, h('input', { type: 'checkbox', checked: LB.exams, onchange: e => { LB.exams = e.target.checked; redraw(); } }), '也印考卷標籤（各科考卷一張，貼在考卷上）')));
    opt.append(h('div', { class: 'row' }, h('span', { class: 'note', text: '條碼種類' }),
      h('label', { class: 'ck' }, h('input', { type: 'radio', name: 'lbcode', checked: LB.code === 'qr', onchange: () => { LB.code = 'qr'; redraw(); } }), 'QR Code（手機相機、二維掃描器）'),
      h('label', { class: 'ck' }, h('input', { type: 'radio', name: 'lbcode', checked: LB.code === 'bar', onchange: () => { LB.code = 'bar'; redraw(); } }), 'Code 128 條碼（一維雷射掃描器）'),
      h('label', { class: 'ck' }, h('input', { type: 'radio', name: 'lbcode', checked: LB.code === 'both', onchange: () => { LB.code = 'both'; redraw(); } }), '兩種都印')));
    opt.append(h('div', { class: 'row' }, h('span', { class: 'note', text: '標籤尺寸' }), h('select', { onchange: e => { LB.size = e.target.value; redraw(); } }, LABEL_SIZES.map(z => h('option', { value: z.id, text: z.name, selected: z.id === LB.size }))),
      h('label', { class: 'ck' }, h('input', { type: 'checkbox', checked: LB.url, onchange: e => { LB.url = e.target.checked; redraw(); } }), 'QR 內含網址（用手機內建相機掃也能登記，但圖會較密）')));
    opt.append(h('div', { class: 'note', text: '編號規則：年級 1 碼＋班序 2 碼＋座號 2 碼，例如 10101＝一年甲班 1 號；含科目再加 2 碼（習作：01 國語、02 數學、03 英語、04 生活、05 社會、06 自然、07 健康；考卷：11 國語、12 數學、13 英語、14 生活、15 社會、16 自然），例如 1010102＝一甲 1 號數學習作、1010112＝一甲 1 號數學考卷。科目代碼可在「設定 → 檢查項目」修改。' }));
    opt.append(h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => window.print() }, svg('print'), '列印'),
      h('button', { class: 'btn', onclick: () => { const rows = labelRows(); if (rows.length < 2) return toast('沒有可匯出的標籤'); downloadBlob(xlsxBlob(rows, '標籤'), '習作標籤_NIIMBOT_' + (LB.mode === 'book' ? '含科目' : '每位學生') + '.xlsx'); toast('已下載 Excel，共 ' + (rows.length - 1) + ' 列'); } }, svg('down'), '下載 NIIMBOT 用 Excel'),
      h('span', { class: 'note', id: 'lbcount' })),
      h('div', { class: 'note', text: '列印時請選「實際大小」、不要縮放；標籤機請在印表機設定選對應的標籤規格。標籤貼在習作封面右上角。' }),
      h('div', { class: 'note', text: 'NIIMBOT（精臣）等標籤機 App：下載 Excel 後，在 App 新增標籤 → 匯入 Excel／資料來源 → 把文字框綁定「姓名」「班級座號」「科目」欄，QR Code 或條碼綁定「QR條碼內容」欄，即可整批列印。每列一張標籤。' }));
    box.append(opt);
    const sheet = h('div', { class: 'labelsheet' }); box.append(sheet);
    const styleEl = h('style', { id: 'labelPrintStyle' }); box.append(styleEl);
    const redraw = async () => {
      const z = LABEL_SIZES.find(x => x.id === LB.size) || LABEL_SIZES[0];
      sheet.style.setProperty('--lw', z.w + 'mm'); sheet.style.setProperty('--lh', z.h + 'mm');
      styleEl.textContent = z.sheet ? '@media print { @page { size: A4; margin: 6mm } }' : '@media print { @page { size: ' + z.w + 'mm ' + z.h + 'mm; margin: 0 } .labelsheet { gap: 0 } .label { page-break-after: always; break-after: page; border: 0 } }';
      sheet.replaceChildren();
      const list = [];
      cl.filter(c => LB.classIds.includes(c.id)).forEach(c => {
        const its = LB.mode === 'book' ? itemsFor(c, r).filter(it => LB.exams || it.kind !== 'exam') : [null];
        (c.students || []).slice().sort((a, b) => a.no - b.no).forEach(s => its.forEach(it => list.push({ c, s, it })));
      });
      const base = location.href.split('#')[0].split('?')[0];
      const okQR = LB.code !== 'bar' ? await loadLib('assets/vendor/qrcode.min.js', () => !!window.QRCode) : true;
      const okBar = LB.code !== 'qr' ? await loadLib('assets/vendor/JsBarcode.all.min.js', () => !!window.JsBarcode) : true;
      list.forEach(({ c, s, it }) => {
        const payload = scanPayload(c, s, it);
        const qrText = LB.url ? base + '#s=' + payload : payload;
        const lab = h('div', { class: 'label ' + (LB.code === 'both' ? 'both' : LB.code) });
        if (LB.code !== 'bar') { const q = h('div', { class: 'qr' }); lab.append(q); if (okQR) { try { new window.QRCode(q, { text: qrText, width: 256, height: 256, correctLevel: window.QRCode.CorrectLevel.M }); } catch (e) { } } else q.textContent = 'QR 元件載入失敗'; }
        const txt = h('div', { class: 'txt' },
          h('div', { class: 'l1', text: studentCode(c, s) + (it ? it.name : '') }),
          h('div', { class: 'l3', text: s.name || (s.no + ' 號') }),
          h('div', { class: 'l2', text: c.name + ' ' + pad2(s.no) + ' 號' }));
        lab.append(txt);
        if (LB.code !== 'qr') { const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svgEl.setAttribute('class', 'bar'); lab.append(svgEl); if (okBar) { try { window.JsBarcode(svgEl, payload, { format: 'CODE128', displayValue: false, margin: 0, height: 40, width: 1.6 }); const bw = svgEl.getAttribute('width'), bh = svgEl.getAttribute('height'); if (bw && bh) { svgEl.setAttribute('viewBox', '0 0 ' + parseFloat(bw) + ' ' + parseFloat(bh)); svgEl.setAttribute('preserveAspectRatio', 'none'); svgEl.removeAttribute('width'); svgEl.removeAttribute('height'); } } catch (e) { } } }
        sheet.append(lab);
      });
      const cnt = $('#lbcount'); if (cnt) cnt.textContent = '共 ' + list.length + ' 張';
    };
    redraw();
    return box;
  }

  /* ---------- 報表（給主任、校長） ---------- */
  function renderReport() {
    const r = round(); const cl = classes();
    if (!r) return h('div', { class: 'empty', text: '尚未建立抽查次別。' });
    const items = roundItems(r);
    const box = h('div', { class: 'stack report' });
    const today = new Date();
    const roc = (today.getFullYear() - 1911) + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';
    box.append(h('div', { class: 'row between no-print' },
      h('div', { class: 'note', text: '這一頁就是給主管看的報告：先在「班級檢核」填好備註，再回來列印或匯出。' }),
      h('div', { class: 'row' }, h('button', { class: 'btn primary small', onclick: () => window.print() }, svg('print'), '列印報表'), h('button', { class: 'btn ghost small', onclick: () => exportCSV(cl) }, svg('down'), '匯出 CSV'))));
    box.append(h('div', { class: 'rhead' },
      h('div', { class: 'rorg', text: (CFG.schoolName || '') + '　' + (CFG.unitName || '') }),
      h('h2', { text: r.name + '　作業抽查結果' }),
      h('div', { class: 'rmeta' }, h('span', { text: '繳交截止：' + (r.due ? fmtDate(r.due) : '未設定') }), h('span', { text: '製表日期：' + roc }), h('span', { text: r.locked ? '狀態：已結案' : '狀態：進行中' }))));
    // 全校摘要
    let got = 0, total = 0;
    const sumRows = cl.map(cls => {
      const n = (cls.students || []).length; const p = classProgress(cls, r); got += p.got; total += p.total;
      const pct = p.total ? Math.round(p.got / p.total * 100) : null;
      return h('tr', null, h('td', { class: 'rname', text: cls.name }), h('td', { text: cls.teacher || '' }), h('td', { text: String(n) }),
        items.map((it, i) => h('td', { class: examStart(items, i).trim() || null, text: classHasItem(cls, it) ? countItem(cls, it) + '/' + n : '—' })),
        h('td', { class: pct === 100 ? 'okcell' : null, text: pct == null ? '—' : pct + '%' }), h('td', { class: 'left rnote', text: noteValue(cls.id, null) }));
    });
    const pctAll = total ? Math.round(got / total * 100) : 0;
    box.append(h('div', { class: 'rsec' }, h('h3', { text: '一、全校摘要' }),
      h('div', { class: 'rkpi' }, h('div', null, '全校完成率', h('b', { text: pctAll + '%' })), h('div', null, '已交／應交', h('b', { text: got + ' / ' + total })), h('div', null, '全班繳齊', h('b', { text: cl.filter(c => { const p = classProgress(c, r); return p.total && p.got === p.total; }).length + ' / ' + cl.length + ' 班' }))),
      classChart(cl, r),
      h('div', { class: 'tablebox' }, h('table', { class: 'rtable' },
        h('thead', null, groupHeaderRow(items, 3, 2), h('tr', null, h('th', { text: '班級' }), h('th', { text: '導師' }), h('th', { text: '人數' }), items.map((it, i) => h('th', { class: (it.kind === 'exam' ? 'exam' : '') + examStart(items, i), text: it.short || it.name })), h('th', { text: '完成率' }), h('th', { text: '班級備註' }))),
        h('tbody', null, sumRows),
        h('tfoot', null, h('tr', { class: 'tfoot' }, h('td', { colspan: 3, class: 'left', text: '全校' }), items.map(it => { let c = 0, t = 0; cl.forEach(cls => { if (classHasItem(cls, it)) { c += countItem(cls, it); t += (cls.students || []).length; } }); return h('td', { text: t ? c + '/' + t : '—' }); }), h('td', { text: pctAll + '%' }), h('td')))))));
    // 未交與備註名單
    const missing = [];
    cl.forEach(cls => { const its = itemsFor(cls, r); (cls.students || []).slice().sort((a, b) => a.no - b.no).forEach(s => { const miss = its.filter(it => !isOn(cls.id, s.no, it.id)); const note = noteValue(cls.id, s.no); if (miss.length || note) missing.push({ cls, s, miss, note }); }); });
    box.append(h('div', { class: 'rsec' }, h('h3', { text: '二、未繳交與備註' }),
      missing.length ? h('div', { class: 'tablebox' }, h('table', { class: 'rtable' },
        h('thead', null, h('tr', null, h('th', { text: '班級' }), h('th', { text: '座號' }), h('th', { text: '姓名' }), h('th', { text: '未繳交項目' }), h('th', { text: '備註' }))),
        h('tbody', null, missing.map(m => h('tr', null, h('td', { text: m.cls.name }), h('td', { text: String(m.s.no) }), h('td', { text: m.s.name || '' }), h('td', { class: 'left', text: m.miss.map(it => it.kind === 'exam' ? it.name + '（未繳回）' : it.name).join('、') || '—' }), h('td', { class: 'left', text: m.note }))))))
        : h('div', { class: 'note', text: '全校皆已繳交，無備註。' })));
    // 各班明細
    const detail = h('div', { class: 'rsec' }, h('h3', { text: '三、各班明細' }));
    cl.forEach(cls => {
      const its = itemsFor(cls, r); const studs = (cls.students || []).slice().sort((a, b) => a.no - b.no);
      if (!studs.length) return;
      detail.append(h('div', { class: 'rclass' }, h('h4', { text: cls.name + (cls.teacher ? '　導師 ' + cls.teacher : '') + '　' + studs.length + ' 人' + (noteValue(cls.id, null) ? '　備註：' + noteValue(cls.id, null) : '') }),
        h('div', { class: 'tablebox' }, h('table', { class: 'rtable' },
          h('thead', null, groupHeaderRow(its, 2, 1), h('tr', null, h('th', { text: '座號' }), h('th', { text: '姓名' }), its.map((it, i) => h('th', { class: (it.kind === 'exam' ? 'exam' : '') + examStart(its, i), text: it.short || it.name })), h('th', { text: '備註' }))),
          h('tbody', null, studs.map(s => h('tr', null, h('td', { text: String(s.no) }), h('td', { class: 'rname', text: s.name || '' }), its.map((it, i) => h('td', { class: (isOn(cls.id, s.no, it.id) ? 'okcell' : 'nocell') + examStart(its, i), text: isOn(cls.id, s.no, it.id) ? '✓' : '✗' })), h('td', { class: 'left', text: noteValue(cls.id, s.no) }))))))));
    });
    box.append(detail);
    box.append(h('div', { class: 'note', text: '✓ 已繳交　✗ 未繳交　— 本班無此項目。「考卷」各欄表示該科考卷已由家長簽名並繳回。' }));
    return box;
  }

  /* ---------- 各班完成率長條圖 ---------- */
  function classChart(cl, r) {
    const n = daysUntil(r && r.due); const overdue = n !== null && n < 0;
    const list = h('ul', { class: 'cchart', 'aria-label': '各班完成率' });
    cl.forEach(cls => {
      const p = classProgress(cls, r); if (!p.total) return;
      const pct = Math.round(p.got / p.total * 100);
      const late = overdue && pct < 100;
      list.append(h('li', { class: pct === 100 ? 'full' : late ? 'late' : null },
        h('span', { class: 'cn', text: cls.name }),
        h('span', { class: 'track', 'aria-hidden': 'true' }, h('i', { style: 'width:' + pct + '%' })),
        h('span', { class: 'cv' }, h('b', { text: pct + '%' }), h('small', { text: ' ' + p.got + '/' + p.total }), late ? h('span', { class: 'tag seal', text: '逾期未齊' }) : (pct === 100 ? h('span', { class: 'tag ok', text: '繳齊' }) : null))));
    });
    return list;
  }

  /* ---------- 匯出 CSV ---------- */
  function exportCSV(list) {
    const r = round(); if (!r) return;
    const items = roundItems(r);
    const rows = [['班級', '導師', '座號', '姓名', ...items.map(i => i.name), '已交項目', '應交項目', '狀態', '備註']];
    list.forEach(cls => {
      const its = itemsFor(cls, r); const set = new Set(its.map(i => i.id));
      (cls.students || []).slice().sort((a, b) => a.no - b.no).forEach(s => {
        const got = its.filter(it => isOn(cls.id, s.no, it.id)).length;
        rows.push([cls.name, cls.teacher || '', s.no, s.name || '', ...items.map(it => !set.has(it.id) ? '不適用' : (isOn(cls.id, s.no, it.id) ? (it.kind === 'exam' ? '已繳回' : '已交') : (it.kind === 'exam' ? '未繳回' : '未交'))), got, its.length, got === its.length ? '繳齊' : '缺 ' + (its.length - got) + ' 項', noteValue(cls.id, s.no)]);
      });
    });
    const csv = '﻿' + rows.map(row => row.map(v => { v = String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\r\n');
    const a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: '作業抽查_' + r.name.replace(/[\\/:*?"<>|\s]+/g, '_') + (list.length === 1 ? '_' + list[0].name : '') + '.csv' });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ---------- 全校總覽（教務組） ---------- */
  function renderOverview() {
    const box = h('div', { class: 'stack' });
    const r = round(); const cl = classes();
    if (!r) return h('div', { class: 'empty', text: '尚未建立抽查次別，請到「設定」建立。' });
    if (!cl.length) return h('div', { class: 'empty', text: '尚未建立班級，請到「設定」新增。' });
    const items = roundItems(r);
    let got = 0, total = 0, full = 0;
    const rows = cl.map(cls => {
      const n = (cls.students || []).length; const p = classProgress(cls, r); got += p.got; total += p.total;
      const pct = p.total ? Math.round(p.got / p.total * 100) : 0; if (p.total && pct === 100) full++;
      const d = S.checks[cls.id];
      return h('tr', null,
        h('td', { class: 'cname' }, h('button', { class: 'link', onclick: () => { S.selClass = cls.id; lsSet(LS.cls, cls.id); S.view = 'class'; render(); } }, cls.name), h('div', { class: 'mini', text: (cls.teacher ? '導師 ' + cls.teacher + ' · ' : '') + n + ' 人' })),
        items.map((it, i) => {
          if (!classHasItem(cls, it)) return h('td', { class: 'mini' + examStart(items, i), text: '—' });
          const c = countItem(cls, it); const q = n ? Math.round(c / n * 100) : 0;
          return h('td', { class: examStart(items, i).trim() || null }, h('div', { text: c + '/' + n }), h('div', { class: 'bar' + (it.kind === 'exam' ? ' exam' : '') }, h('i', { style: 'width:' + q + '%' })));
        }),
        h('td', { class: 'pct' + (p.total && pct === 100 ? ' full' : ''), text: p.total ? pct + '%' : '—' }),
        h('td', { class: 'mini', text: d && d.updatedAt ? fmtStamp(d.updatedAt) : '尚未登記' }));
    });
    const pct = total ? Math.round(got / total * 100) : 0;
    const notLogged = cl.filter(c => !((S.links[c.id] || {}).devices || []).length);
    box.append(h('div', { class: 'row between' },
      h('div', { class: 'stats' },
        h('div', { class: 'stat' + (pct === 100 && total ? ' ok' : '') }, '全校完成率', h('b', { text: pct + '%' })),
        h('div', { class: 'stat' }, '已交／應交', h('b', { text: got + ' / ' + total })),
        h('div', { class: 'stat' }, '全班繳齊', h('b', { text: full + ' / ' + cl.length + ' 班' })),
        h('div', { class: 'stat' + (notLogged.length ? ' warnstat' : '') }, '導師已登入', h('b', { text: (cl.length - notLogged.length) + ' / ' + cl.length + ' 班' }))),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost small', onclick: () => openMissing(cl) }, svg('list'), '全校未交名單'),
        h('button', { class: 'btn ghost small', onclick: () => exportCSV(cl) }, svg('down'), '匯出 CSV'),
        h('button', { class: 'btn ghost small', onclick: () => window.print() }, svg('print'), '列印'))));
    box.append(h('div', { class: 'print-meta', text: (CFG.schoolName || '') + '　' + r.name + '　全校總覽　列印時間 ' + new Date().toLocaleString('zh-TW') }));
    if (notLogged.length) box.append(h('div', { class: 'banner warn no-print' }, h('span', { text: '尚未登入的班級：' + notLogged.map(c => c.name + (c.teacher ? '（' + c.teacher + '）' : '')).join('、') + '。這些班級的導師還不能登記，請提醒導師開啟網址、選擇自己的班級登入' + (S.claimClosed ? '（目前「暫停新的導師登入」中，需先到設定取消勾選）' : '') + '。' })));
    box.append(h('section', { class: 'panel chartpanel', 'aria-label': '各班完成率' }, h('h2', { text: '各班完成率' }), classChart(cl, r)));
    box.append(h('div', { class: 'tablebox' }, h('table', { class: 'ov' },
      h('thead', null, groupHeaderRow(items, 1, 2), h('tr', null, h('th', { style: 'text-align:left', text: '班級' }), items.map((it, i) => h('th', { class: (it.kind === 'exam' ? 'exam' : '') + examStart(items, i), text: it.short || it.name })), h('th', { text: '完成率' }), h('th', { text: '最後登記' }))),
      h('tbody', null, rows),
      h('tfoot', null, h('tr', { class: 'tfoot' }, h('td', { class: 'cname', text: '全校合計' }),
        items.map((it, i) => { let c = 0, t = 0; cl.forEach(cls => { if (classHasItem(cls, it)) { c += countItem(cls, it); t += (cls.students || []).length; } }); const q = t ? Math.round(c / t * 100) : 0; return h('td', { class: examStart(items, i).trim() || null }, t ? [h('div', { text: q + '%' }), h('div', { class: 'mini', text: c + '/' + t })] : '—'); }),
        h('td', { class: 'pct' + (pct === 100 && total ? ' full' : ''), text: total ? pct + '%' : '—' }), h('td'))))));
    box.append(h('div', { class: 'note', text: '點班級名稱可進入該班登記；導師在自己的裝置登記後，這裡會自動更新。' }));
    return box;
  }

  /* ---------- 設定頁用：依科目分列、習作／考卷分欄 ---------- */
  const subjectKey = it => (it.short || it.name || '').replace(/習作|考卷|（.*?）/g, '').trim() || it.name;
  function subjectRows(items) {
    const map = new Map();
    items.forEach(it => { const k = subjectKey(it); if (!map.has(k)) map.set(k, { key: k, hw: null, exam: null }); const r = map.get(k); if (it.kind === 'exam') { if (!r.exam) r.exam = it; else map.set(k + '#' + it.id, { key: k, hw: null, exam: it }); } else { if (!r.hw) r.hw = it; else map.set(k + '#' + it.id, { key: k, hw: it, exam: null }); } });
    return Array.from(map.values());
  }
  // 勾選表：列＝科目，欄＝習作／考卷；回傳 { el, selected() }
  function itemPicker(items, isChecked, onChange) {
    const rows = subjectRows(items); const boxes = new Map();
    const cell = it => { if (!it) return h('td', { class: 'na', text: '—' }); const cb = h('input', { type: 'checkbox', checked: !!isChecked(it), 'aria-label': it.name, onchange: () => onChange && onChange(it, cb.checked) }); boxes.set(it.id, cb); return h('td', null, h('label', { class: 'pick' }, cb)); };
    const colToggle = kind => h('button', { class: 'link', style: 'font-size:12px', onclick: () => { const list = items.filter(it => (it.kind === 'exam') === (kind === 'exam')); const all = list.every(it => boxes.get(it.id).checked); list.forEach(it => { const cb = boxes.get(it.id); if (cb.checked === all) { cb.checked = !all; onChange && onChange(it, cb.checked); } }); } }, '全選／取消');
    const table = h('table', { class: 'picktable' },
      h('thead', null, h('tr', null, h('th', { class: 'left', text: '科目' }), h('th', { class: 'hwcol' }, '習作 ', colToggle('hw')), h('th', { class: 'examcol' }, '考卷（家長簽名） ', colToggle('exam')))),
      h('tbody', null, rows.map(r => h('tr', null, h('td', { class: 'left', text: r.key }), cell(r.hw), cell(r.exam)))));
    return { el: h('div', { class: 'tablebox pickbox' }, table), selected: () => items.filter(it => boxes.get(it.id) && boxes.get(it.id).checked).map(it => it.id) };
  }

  /* ---------- 設定（教務組） ---------- */
  function renderSettings() {
    if (!S.draft) S.draft = JSON.parse(JSON.stringify(S.config || { items: [], classes: [] }));
    const D = S.draft;
    const box = h('div', { class: 'stack' });

    /* 抽查次別 */
    const rp = h('div', { class: 'panel' }, h('h2', null, '抽查次別', h('small', { text: '每次抽查建立一筆；結案後導師不能再更動' })));
    S.rounds.forEach(r => rp.append(roundEditor(r)));
    const term = rocTerm();
    const nName = h('input', { type: 'text', class: 'grow', 'aria-label': '次別名稱', value: term.year + '學年度第' + term.sem + '學期 第' + (S.rounds.length + 1) + '次作業抽查' });
    const nDue = h('input', { type: 'date', 'aria-label': '繳交截止日' });
    const newPick = itemPicker(allItems(), () => true);
    rp.append(h('div', { class: 'divider' }), h('div', { class: 'note', text: '建立新的抽查次別' }),
      h('div', { class: 'row' }, nName, h('span', { class: 'note', text: '截止' }), nDue),
      h('div', { class: 'note', text: '本次要檢查的項目' }), newPick.el,
      h('div', null, h('button', { class: 'btn primary', onclick: async () => {
        const name = nName.value.trim(); if (!name) return toast('請填寫次別名稱');
        const rd = { id: 'r' + Date.now().toString(36), name, due: nDue.value || '', itemIds: newPick.selected(), locked: false, createdAt: new Date().toISOString() };
        await adminPost({ action: 'addRound', round: rd }, '已建立「' + name + '」'); S.rid = rd.id; S.version = null; await load({ force: true, full: true });
      } }, '建立抽查次別')));
    box.append(rp);

    /* 檢查項目：表格，習作一組、考卷一組 */
    const ip = h('div', { class: 'panel' }, h('h2', null, '檢查項目', h('small', { text: '每列一個項目；勾選預設適用的年級，個別班級可在下方「班級」再調整' })));
    const itemRow = (it) => {
      const i = D.items.indexOf(it);
      return h('tr', null,
        h('td', { class: 'left' }, h('input', { type: 'text', value: it.name, 'aria-label': '項目名稱', style: 'width:120px', oninput: e => { it.name = e.target.value; } })),
        h('td', null, h('input', { type: 'text', value: it.short || '', placeholder: '簡稱', style: 'width:64px', 'aria-label': '簡稱', oninput: e => { it.short = e.target.value; } })),
        h('td', null, h('input', { type: 'text', value: itemCode(it), style: 'width:48px;text-align:center', maxlength: '2', 'aria-label': '條碼代碼', oninput: e => { it.code = e.target.value.replace(/\D/g, '').slice(0, 2); } })),
        [1, 2, 3, 4, 5, 6].map(g => h('td', null, h('input', { type: 'checkbox', 'aria-label': GRADE[g] + '年級', checked: (it.grades || []).map(Number).includes(g), onchange: e => { it.grades = (it.grades || []).map(Number).filter(x => x !== g); if (e.target.checked) it.grades.push(g); it.grades.sort(); } }))),
        h('td', { class: 'ops' }, h('button', { class: 'btn small ghost', title: '上移', disabled: i === 0, onclick: () => { D.items.splice(i - 1, 0, D.items.splice(i, 1)[0]); renderMain(); } }, '↑'), h('button', { class: 'btn small ghost', title: it.kind === 'exam' ? '改為習作' : '改為考卷', onclick: () => { it.kind = it.kind === 'exam' ? 'hw' : 'exam'; renderMain(); } }, it.kind === 'exam' ? '→習作' : '→考卷'), h('button', { class: 'btn small danger', onclick: () => { D.items.splice(i, 1); renderMain(); } }, '移除')));
    };
    const head = h('thead', null, h('tr', null, h('th', { class: 'left', text: '名稱' }), h('th', { text: '簡稱' }), h('th', { text: '代碼' }), [1, 2, 3, 4, 5, 6].map(g => h('th', { text: GRADE[g] })), h('th', null, h('span', { class: 'sr-only', text: '操作' }))));
    const hwItems = D.items.filter(it => it.kind !== 'exam'), exItems = D.items.filter(it => it.kind === 'exam');
    const tbody = h('tbody', null,
      h('tr', { class: 'secrow hw' }, h('td', { colspan: 10, text: '習作' })), hwItems.map(itemRow),
      h('tr', { class: 'addrow' }, h('td', { colspan: 10 }, h('button', { class: 'link', onclick: () => { D.items.push({ id: uid('i'), name: '新習作', short: '', kind: 'hw', grades: [1, 2, 3, 4, 5, 6] }); renderMain(); } }, '＋ 新增習作項目'))),
      h('tr', { class: 'secrow exam' }, h('td', { colspan: 10, text: '考卷（家長簽名繳回）' })), exItems.map(itemRow),
      h('tr', { class: 'addrow' }, h('td', { colspan: 10 }, h('button', { class: 'link', onclick: () => { D.items.push({ id: uid('i'), name: '新考卷', short: '', kind: 'exam', grades: [1, 2, 3, 4, 5, 6] }); renderMain(); } }, '＋ 新增考卷項目'))));
    ip.append(h('div', { class: 'tablebox' }, h('table', { class: 'cfgtable' }, head, tbody)));
    ip.append(h('div', { class: 'note', text: '「代碼」是條碼的 2 碼科目代碼（習作 01–07、考卷 11–16），改了之後要重印標籤。' }));
    box.append(ip);

    /* 班級 */
    const cp = h('div', { class: 'panel' }, h('h2', null, '班級與學生名單', h('small', { text: '名單每行一位：「座號 姓名」，例如「1 王小明」；也可從 Excel 直接貼上兩欄' })));
    D.classes.forEach((c, i) => cp.append(classEditor(c, i)));
    cp.append(h('div', null, h('button', { class: 'btn ghost', onclick: () => { D.classes.push({ id: uid('c'), name: '新班級', grade: 1, teacher: '', subjectTeachers: {}, students: [] }); renderMain(); } }, '＋ 新增班級')));
    box.append(cp);

    box.append(h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: async () => {
        const err = validateDraft(D); if (err) return toast(err, 3200);
        await adminPost({ action: 'saveConfig', config: D }, '項目與班級設定已儲存'); S.draft = null; S.version = null; await load({ force: true, full: true });
      } }, '儲存項目與班級設定'),
      h('button', { class: 'btn ghost', onclick: () => { S.draft = null; renderMain(); } }, '放棄修改'),
      h('span', { class: 'note', text: '上方各區塊修改後，按這裡一次儲存。' })));

    /* 導師登入狀態 */
    const lp = h('div', { class: 'panel' }, h('h2', null, '導師登入裝置', h('small', { text: '導師在登入頁選自己的班級，第一台登入的裝置即綁定；之後該班不能再從別的裝置登入' })));
    lp.append(h('div', { class: 'note', text: '導師換手機、或誤用別人的手機登入時，在這裡「解除」後，導師再用新裝置選班級登入即可。' }));
    const nLogged = classes().filter(c => ((S.links[c.id] || {}).devices || []).length).length;
    lp.append(h('div', { class: 'claimbox' + (S.claimClosed ? ' closed' : '') },
      h('label', { class: 'ck' }, h('input', { type: 'checkbox', checked: S.claimClosed, onchange: async e => { const v = e.target.checked; e.target.disabled = true; try { await adminPost({ action: 'setClaim', closed: v }, v ? '已暫停新的導師登入' : '已開放導師登入'); S.version = null; await load({ force: true }); renderMain(); } catch (err) { e.target.checked = !v; e.target.disabled = false; } } }), '暫停新的導師登入'),
      h('span', { class: 'note', text: '已登入 ' + nLogged + ' / ' + classes().length + ' 班。全部導師都登入後建議勾選，避免學生或他人在登入頁搶先選班級；已登入的裝置不受影響。導師要換新裝置時，按該班「解除」即可重新登入，不必取消勾選。' })));
    classes().forEach(cls => lp.append(deviceEditor(cls)));
    // 全部重新來過：所有班級解除，導師全部重新選班級登入
    lp.append(h('div', { class: 'row resetall' },
      armed(h('button', { class: 'btn small danger' }), '全部班級解除，讓導師重新登入', '再按一次確認：所有導師都要重新登入', async () => {
        try {
          const r = await apiPost({ action: 'revokeAll' });
          if (r.ok) toast('已全部解除，所有導師可以重新選班級登入');
          else if (r.error === 'unknown_action') { for (const c of classes()) await adminPost({ action: 'revokeDevices', classId: c.id }); toast('已全部解除，所有導師可以重新選班級登入'); } // 後端尚未更新
          else if (r.error === 'auth') return authLost();
          else throw new Error(errText(r.error));
        } catch (e) { toast('操作失敗：' + e.message, 3600); }
        S.version = null; await load({ force: true }); renderMain();
      }, 4000),
      h('span', { class: 'note', text: '例如新學年、換導師或想全部重來時使用。按下後所有已登入的導師裝置都會登出，導師打開網址重新選自己的班級即可；也會自動取消「暫停新的導師登入」。登記紀錄不受影響。' })));
    box.append(lp);

    /* 系統 */
    const sp = h('div', { class: 'panel' }, h('h2', { text: '系統' }));
    sp.append(h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: () => { S.view = 'labels'; renderMain(); } }, svg('tag'), '列印習作標籤（條碼／QR Code）'),
      h('button', { class: 'btn ghost', onclick: openChangeKey }, '修改教務組密碼'),
      h('button', { class: 'btn ghost', onclick: async () => { if (!round()) return toast('尚未建立抽查次別'); await adminPost({ action: 'snapshot', rid: S.rid }, '已在試算表建立本次抽查的「總表」分頁'); } }, '將本次抽查寫入試算表總表'),
      h('button', { class: 'btn ghost', onclick: () => exportCSV(classes()) }, svg('down'), '匯出全校 CSV')));
    if (S.sheetUrl) sp.append(h('div', { class: 'note' }, '資料存放在 Google 試算表：', h('a', { href: S.sheetUrl, target: '_blank', rel: 'noopener', text: '開啟試算表' }), '（請勿改動 data 分頁）。「異動紀錄」分頁記錄每一次登記、取消、備註與設定變更（時間、誰、哪一班、哪位學生），可供查核。'));
    sp.append(h('div', { class: 'note', text: '後端網址：' + S.apiUrl }));
    box.append(sp);
    return box;
  }
  function validateDraft(D) {
    if (!D.items.length) return '至少要有一個檢查項目';
    for (const it of D.items) if (!String(it.name || '').trim()) return '有項目沒有名稱';
    const codes = new Map();
    for (const it of D.items) {
      const code = it.code ? pad2(it.code) : (ITEM_CODE_DEFAULT[it.id] || '');
      if (!code) continue;
      if (codes.has(code)) return '「' + codes.get(code) + '」和「' + it.name + '」的條碼代碼都是 ' + code + '，掃描時會分不出來，請改成不同代碼';
      codes.set(code, it.name);
    }
    const seq = new Map();
    for (const c of D.classes) {
      const k = Number(c.grade) + '-' + classNo(c);
      if (seq.has(k)) return '「' + seq.get(k) + '」和「' + c.name + '」的年級與班序相同，條碼編號會重複，請調整其中一班的「班序」';
      seq.set(k, c.name);
    }
    for (const c of D.classes) {
      if (!String(c.name || '').trim()) return '有班級沒有名稱';
      const seen = new Set();
      for (const s of c.students || []) { if (!(s.no > 0)) return c.name + ' 有座號不正確'; if (seen.has(s.no)) return c.name + ' 座號 ' + s.no + ' 重複'; seen.add(s.no); }
    }
    return '';
  }
  function roundEditor(r) {
    const e = Object.assign({}, r);
    const name = h('input', { type: 'text', class: 'grow', value: e.name, 'aria-label': '次別名稱', oninput: ev => { e.name = ev.target.value; } });
    const due = h('input', { type: 'date', value: e.due || '', 'aria-label': '截止日', onchange: ev => { e.due = ev.target.value; } });
    const lock = h('label', { class: 'ck' }, h('input', { type: 'checkbox', checked: !!e.locked, onchange: ev => { e.locked = ev.target.checked; } }), '結案（導師不可再更動）');
    const pick = itemPicker(allItems(), it => (e.itemIds || []).includes(it.id));
    const save = h('button', { class: 'btn small primary', onclick: async () => { e.itemIds = pick.selected(); await adminPost({ action: 'updateRound', round: e }, '已更新'); S.version = null; await load({ force: true, full: true }); } }, '儲存');
    const del = armed(h('button', { class: 'btn small danger' }), '刪除', '再按一次確認刪除（紀錄一併刪除）', async () => { await adminPost({ action: 'delRound', rid: e.id }, '已刪除'); S.version = null; if (S.rid === e.id) S.rid = null; await load({ force: true, full: true }); }, 3500);
    const open = h('details', { class: 'fold' }, h('summary', { text: '本次項目（' + (e.itemIds || []).length + ' 項）' }), pick.el);
    return h('div', { class: 'classcard' }, h('div', { class: 'row' }, name, h('span', { class: 'note', text: '截止' }), due, lock, save, del), open);
  }
  function classEditor(c, i) {
    const D = S.draft;
    const ta = h('textarea', { 'aria-label': c.name + ' 學生名單', oninput: e => { c.students = parseRoster(e.target.value); cnt.textContent = '目前 ' + c.students.length + ' 人'; } });
    ta.value = (c.students || []).map(s => (s.no + ' ' + (s.name || '')).trim()).join('\n');
    const cnt = h('span', { class: 'note', text: '目前 ' + (c.students || []).length + ' 人' });
    const num = h('input', { type: 'number', min: '1', max: '60', placeholder: '人數', style: 'width:84px', 'aria-label': '人數' });
    const gen = h('button', { class: 'btn small ghost', onclick: () => { const k = +num.value; if (!(k > 0)) return toast('請先填人數'); const old = c.students || []; c.students = Array.from({ length: k }, (_, j) => ({ no: j + 1, name: (old.find(s => s.no === j + 1) || {}).name || '' })); renderMain(); } }, '只用座號，產生 1～N 號');
    const rm = armed(h('button', { class: 'btn small danger' }), '移除班級', '再按一次確認移除', () => { D.classes.splice(i, 1); renderMain(); });
    // 本班項目：表格，列＝科目，欄＝習作（＋科任老師）／考卷
    const useDefault = !Array.isArray(c.itemIds);
    const itemBox = h('div', { class: 'tablebox pickbox' });
    const rebuildItems = () => {
      itemBox.replaceChildren();
      const on = it => useDefaultNow() ? (it.grades || []).map(Number).includes(Number(c.grade)) : c.itemIds.includes(it.id);
      const toggle = (it, v) => { if (useDefaultNow()) c.itemIds = D.items.filter(x => (x.grades || []).map(Number).includes(Number(c.grade))).map(x => x.id); c.itemIds = c.itemIds.filter(x => x !== it.id); if (v) c.itemIds.push(it.id); };
      const cell = (it, withTeacher) => {
        if (!it) return h('td', { class: 'na', text: '—' });
        const cb = h('input', { type: 'checkbox', checked: on(it), 'aria-label': it.name, onchange: e => toggle(it, e.target.checked) });
        const td = h('td', null, h('label', { class: 'pick' }, cb));
        if (withTeacher) td.append(h('input', { type: 'text', class: 'tinput', placeholder: '科任老師', value: (c.subjectTeachers || {})[it.id] || '', 'aria-label': it.name + ' 科任老師', oninput: e => { c.subjectTeachers = c.subjectTeachers || {}; c.subjectTeachers[it.id] = e.target.value.trim(); } }));
        return td;
      };
      itemBox.append(h('table', { class: 'picktable' },
        h('thead', null, h('tr', null, h('th', { class: 'left', text: '科目' }), h('th', { class: 'hwcol', text: '習作（科任老師）' }), h('th', { class: 'examcol', text: '考卷' }))),
        h('tbody', null, subjectRows(D.items).map(r => h('tr', null, h('td', { class: 'left', text: r.key }), cell(r.hw, true), cell(r.exam, false))))));
    };
    const useDefaultNow = () => !Array.isArray(c.itemIds);
    rebuildItems();
    const summary = h('summary', null, h('b', { text: c.name || '（未命名）' }), h('span', { class: 'note', text: GRADE[Number(c.grade)] + '年級　' + (c.teacher ? '導師 ' + c.teacher : '未填導師') + '　' + (c.students || []).length + ' 人' }));
    return h('details', { class: 'fold classfold', open: S.openClass === c.id ? true : null, ontoggle: e => { if (e.target.open) S.openClass = c.id; else if (S.openClass === c.id) S.openClass = null; } }, summary, h('div', { class: 'classcard' },
      h('div', { class: 'row' },
        h('input', { type: 'text', value: c.name, style: 'width:120px', 'aria-label': '班級名稱', oninput: e => { c.name = e.target.value; } }),
        h('select', { 'aria-label': '年級', onchange: e => { c.grade = +e.target.value; if (useDefaultNow()) rebuildItems(); } }, [1, 2, 3, 4, 5, 6].map(g => h('option', { value: g, text: GRADE[g] + '年級', selected: Number(c.grade) === g }))),
        h('input', { type: 'text', value: c.teacher || '', placeholder: '導師姓名', style: 'width:130px', 'aria-label': '導師姓名', oninput: e => { c.teacher = e.target.value.trim(); } }),
        h('label', { class: 'ck', title: '條碼編號裡的班序：甲＝1、乙＝2' }, '班序', h('input', { type: 'number', min: '1', max: '20', value: classNo(c), style: 'width:56px;padding:3px 6px', 'aria-label': '班序', onchange: e => { c.classNo = parseInt(e.target.value, 10) || 1; } })),
        rm),
      h('details', { class: 'fold' }, h('summary', null, '本班項目與科任老師　', useDefault ? h('span', { class: 'tag', text: '依年級預設' }) : h('span', { class: 'tag warn', text: '已個別調整' })),
        useDefault ? null : h('div', { class: 'row' }, h('button', { class: 'link', style: 'font-size:12px', onclick: () => { delete c.itemIds; renderMain(); } }, '恢復依年級預設')),
        itemBox),
      h('div', { class: 'note', text: '學生名單（每行一位：座號 姓名）' }),
      ta,
      h('div', { class: 'row' }, cnt, num, gen)));
  }
  function parseRoster(text) {
    const out = []; let auto = 1;
    text.split(/\r?\n/).forEach(raw => {
      const line = raw.trim(); if (!line) return;
      const m = line.match(/^(\d+)[\s.、,，號\t]*(.*)$/);
      if (m) { out.push({ no: +m[1], name: m[2].trim() }); auto = +m[1] + 1; }
      else out.push({ no: auto++, name: line });
    });
    return out;
  }
  function deviceEditor(cls) {
    const info = S.links[cls.id] || { devices: [] };
    const dev = (info.devices || [])[0];
    const status = dev
      ? h('span', { class: 'tag ok', text: '已登入　' + (dev.label || '裝置') + '　' + fmtStamp(dev.claimedAt) })
      : h('span', { class: 'tag', text: '尚未登入' });
    return h('div', { class: 'classcard' }, h('div', { class: 'row between' },
      h('div', { class: 'row' }, h('b', { text: cls.name }), cls.teacher ? h('span', { class: 'note', text: '導師 ' + cls.teacher }) : h('span', { class: 'note warn', text: '未填導師姓名' }), status),
      dev ? armed(h('button', { class: 'btn small danger' }), '解除', '再按一次確認解除', async () => { await adminPost({ action: 'revokeDevices', classId: cls.id }, cls.name + ' 已解除，導師可以用新裝置重新登入（暫停新登入時也可以）'); S.version = null; await load({ force: true }); renderMain(); }) : null));
  }
  async function adminPost(body, okMsg) {
    setSync('busy');
    try {
      const r = await apiPost(body);
      if (!r.ok) { if (r.error === 'auth') { authLost(); throw new Error('auth'); } throw new Error(errText(r.error)); }
      if (okMsg) toast(okMsg); setSync('ok');
      return r;
    } catch (e) { setSync('err', e.message); if (e.message !== 'auth') toast('操作失敗：' + e.message, 3600); throw e; }
  }
  function errText(code) { return { busy: '資料表忙碌中，請稍後再試', locked: '本次抽查已結案', no_round: '找不到這次抽查', too_large: '資料量超過單格上限，請分班減少名單', bad_request: '資料格式不正確', weak_key: '密碼至少 6 個字', too_many: '密碼錯誤次數過多，教務組登入暫停 15 分鐘；如需立即解除，請在 Apps Script 執行 unlockAdmin', server_error: '資料表發生錯誤，請稍後再試', unknown_action: '後端版本較舊，請教務組重新部署 Apps Script' }[code] || (code || '未知錯誤'); }
  function openChangeKey() {
    openModal(inner => {
      const a = h('input', { type: 'password', placeholder: '新密碼（至少 6 個字）', autocomplete: 'new-password' }); const b = h('input', { type: 'password', placeholder: '再輸入一次', autocomplete: 'new-password' });
      inner.append(h('h3', { text: '修改教務組密碼' }), h('div', { class: 'note', text: '修改後，其他已登入的裝置需重新輸入新密碼。' }), a, b,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => {
          if (a.value.length < 6) return toast('密碼至少 6 個字'); if (a.value !== b.value) return toast('兩次輸入不一致');
          const r = await adminPost({ action: 'changeKey', newKey: a.value, label: deviceLabel() }, '密碼已更新，其他裝置需重新登入');
          if (r.atoken) { S.atoken = r.atoken; S.key = null; lsSet(LS.admin, { atoken: r.atoken }); } else { S.key = a.value; lsSet(LS.admin, { key: S.key }); }
          closeModal();
        } }, '確定修改'), h('button', { class: 'btn ghost', onclick: closeModal }, '取消')));
    });
  }

  /* ---------- 登入／綁定畫面 ---------- */
  function renderGate() {
    const g = h('main', { class: 'gate' });
    g.append(h('div', null, h('div', { class: 'org', style: 'font-size:12px;letter-spacing:.14em;color:var(--muted)', text: [CFG.schoolName, CFG.unitName].filter(Boolean).join('　') }), h('h1', { style: 'font-family:var(--f-display);font-size:26px;letter-spacing:.08em;margin:2px 0 0', text: CFG.appName })));
    const p = h('div', { class: 'panel' });
    g.append(p);
    if (S.screen === 'boot') { p.append(h('h2', { text: '載入中…' }), h('p', { text: '正在連線到資料表，請稍候。' })); return g; }
    if (S.screen === 'setup') {
      const inp = h('input', { type: 'url', placeholder: 'https://script.google.com/macros/s/…/exec', value: S.apiUrl || '' });
      p.append(h('h2', { text: '尚未連接資料表' }), h('p', { text: '請教務組依 README 完成 Apps Script 部署後，把「網頁應用程式網址」填入 config.js；也可以先在這裡貼上網址試用（只會記在這台裝置）。' }), inp,
        h('button', { class: 'btn primary block', onclick: () => { const v = inp.value.trim(); if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(v)) return toast('網址格式不正確，應以 https://script.google.com/ 開頭、/exec 結尾'); lsSet(LS.api, v); S.apiUrl = v; boot(); } }, '連線'));
      return g;
    }
    if (S.screen === 'login') {
      const msg = h('p', { class: S.gateMsg ? 'note err' : 'note', text: S.gateMsg || '' });
      const sel = h('select', { id: 'whoSel', 'aria-label': '我是', style: 'width:100%' }, h('option', { value: '', text: '載入班級中…' }));
      sel.disabled = true;
      const go = async () => {
        const cid = sel.value; if (!cid) return toast('請先選擇班級');
        btn.disabled = true; msg.textContent = '登入中…'; msg.className = 'note';
        try {
          const r = await apiGet({ action: 'claim', classId: cid, label: deviceLabel() });
          if (!r.ok) {
            msg.className = 'note err';
            msg.textContent = r.error === 'claimed' ? '這個班級已經有其他裝置登入過了。若您換了手機，請教務組在「設定」中解除後再登入。' : r.error === 'closed' ? '教務組目前暫停新的裝置登入，請洽教務組開放。' : '登入失敗：' + errText(r.error);
            btn.disabled = false; return;
          }
          S.token = r.token; S.classId = r.classId; S.role = 'teacher'; lsSet(LS.teacher, { token: r.token, classId: r.classId });
          S.welcomeClass = r.className || ''; S.screen = 'welcome'; render();
        } catch (e) { msg.textContent = e.message; msg.className = 'note err'; btn.disabled = false; }
      };
      const btn = h('button', { class: 'btn primary block', onclick: go }, '登入');
      const retryBtn = h('button', { class: 'btn ghost block', hidden: true, onclick: () => loadClasses() }, '重新載入班級');
      p.append(h('h2', { text: '導師登入' }), h('p', { text: '請選擇自己的班級。只有第一次登入的那一台手機或電腦會被綁定，之後開啟網頁直接進入，不需要密碼。如果換了手機、或需要重新登入，請跟教務組聯繫。' }), sel, btn, retryBtn, msg);
      const loadClasses = () => { sel.disabled = true; retryBtn.hidden = true; sel.replaceChildren(h('option', { value: '', text: '載入班級中…' })); msg.textContent = ''; msg.className = 'note';
      apiGet({ action: 'classes' }).then(r => {
        sel.replaceChildren(h('option', { value: '', text: '請選擇班級／導師' }));
        if (!r.ok && r.error === 'not_initialized') { S.screen = 'init'; render(); return; }
        if (!r.ok || !r.classes || !r.classes.length) { sel.append(h('option', { value: '', text: '尚未建立班級，請洽教務組' })); return; }
        // 暫停新登入時，只有教務組剛「解除」的班級可以重新登入
        if (r.closed && !r.classes.some(c => c.reopen && !c.claimed)) { sel.replaceChildren(h('option', { value: '', text: '目前暫停新的導師登入' })); btn.disabled = true; msg.textContent = '教務組目前暫停新的裝置登入。若您是導師、需要登入，請洽教務組在「設定」按「解除」。'; msg.className = 'note'; return; }
        r.classes.forEach(c => { const blocked = c.claimed || (r.closed && !c.reopen); sel.append(h('option', { value: c.id, text: c.name + (c.teacher ? '　' + c.teacher : '') + (c.claimed ? '（已登入）' : blocked ? '（暫停登入）' : ''), disabled: blocked })); });
        sel.disabled = false;
      }).catch(e => {                                   // 導師頁不顯示技術錯誤；原因（例如部署權限）只給教務組看
        sel.replaceChildren(h('option', { value: '', text: '目前無法載入班級，請稍後再試' }));
        msg.textContent = '目前連不到資料表，請稍後按「重新載入班級」。只有第一次登入的那一台手機或電腦會被綁定；如果需要重新登入，請跟教務組聯繫。'; msg.className = 'note';
        S.gateErr = e.message; retryBtn.hidden = false;
      }); };
      loadClasses();
      // 教務組
      const ap = h('div', { class: 'panel' });
      const inp = h('input', { type: 'password', placeholder: '教務組密碼', autocomplete: 'current-password', hidden: true, onkeydown: e => { if (e.key === 'Enter') goAdmin(); } });
      const amsg = h('p', { class: 'note', text: '' });
      const abtn = h('button', { class: 'btn ghost block', hidden: true, onclick: () => goAdmin() }, '以教務組身分登入');
      const goAdmin = async () => {
        const k = inp.value.trim(); if (!k) return;
        abtn.disabled = true; amsg.textContent = '登入中…'; amsg.className = 'note';
        try {
          const r = await adminSignIn(k);
          if (r.ok) { S.role = 'admin'; S.screen = 'app'; S.view = 'class'; S.gateMsg = ''; render(); startPolling(); await load({ force: true, full: true }); return; }
          amsg.textContent = r.error === 'auth' ? '密碼不正確。' : (r.error === 'too_many' ? errText('too_many') : '登入失敗：' + errText(r.error)); amsg.className = 'note err';
        } catch (e) { amsg.textContent = e.message; amsg.className = 'note err'; }
        abtn.disabled = false;
      };
      ap.append(h('button', { class: 'link', style: 'font-size:13px;align-self:flex-start', onclick: () => { inp.hidden = false; abtn.hidden = false; inp.focus(); if (S.gateErr) { amsg.textContent = '教務組請看：' + S.gateErr; amsg.className = 'note err'; } } }, '教務組登入'), inp, abtn, amsg);
      g.append(ap);
      return g;
    }
    if (S.screen === 'init') {
      const a = h('input', { type: 'password', placeholder: '設定教務組密碼（至少 6 個字）', autocomplete: 'new-password' });
      const b = h('input', { type: 'password', placeholder: '再輸入一次', autocomplete: 'new-password', onkeydown: e => { if (e.key === 'Enter') go(); } });
      const msg = h('p', { class: 'note', text: '' });
      const go = async () => {
        if (a.value.length < 6) return toast('密碼至少 6 個字'); if (a.value !== b.value) return toast('兩次輸入不一致');
        btn.disabled = true; msg.textContent = '正在建立資料表，約需 10 秒…'; msg.className = 'note';
        try {
          const r = await apiPost({ action: 'init', newKey: a.value });
          if (!r.ok) { msg.className = 'note err'; msg.textContent = r.error === 'already_initialized' ? '已經設定過了，請直接以教務組密碼登入。' : '設定失敗：' + errText(r.error); btn.disabled = false; if (r.error === 'already_initialized') setTimeout(() => { S.screen = 'login'; render(); }, 1500); return; }
          await adminSignIn(a.value); S.role = 'admin'; S.screen = 'app'; S.view = 'settings'; S.gateMsg = ''; render(); startPolling(); await load({ force: true, full: true });
          toast('設定完成。請先填導師姓名與學生名單。', 4000);
        } catch (e) { msg.textContent = e.message; msg.className = 'note err'; btn.disabled = false; }
      };
      const btn = h('button', { class: 'btn primary block', onclick: go }, '完成設定');
      p.append(h('h2', { text: '第一次使用' }), h('p', { text: '資料表已連接。請為教務組設定一組登入密碼，之後用它登入管理全校資料；導師不需要密碼。' }), a, b, btn, msg);
      return g;
    }
    if (S.screen === 'welcome') {
      p.append(h('div', { class: 'welcome' }, h('p', { text: '此裝置已登入為' }), h('div', { class: 'big', text: S.welcomeClass + ' 導師' }), h('p', { text: '之後直接開啟這個網頁即可，不需要再選擇或輸入任何東西；建議在手機瀏覽器選擇「加入主畫面」，像 App 一樣使用。' })),
        h('button', { class: 'btn primary block', onclick: async () => { S.screen = 'app'; render(); startPolling(); await load({ force: true, full: true }); } }, '開始使用'));
      return g;
    }
    if (S.screen === 'auth-lost') { p.append(h('h2', { text: '此裝置的登入已被解除' }), h('p', { text: '教務組已解除此裝置的登入。請重新在登入頁選擇班級登入；若無法登入，請洽教務組。' }), h('button', { class: 'btn primary block', onclick: () => { S.screen = 'login'; S.gateMsg = ''; render(); } }, '回到登入頁')); return g; }
    if (S.screen === 'error') { p.append(h('h2', { text: '無法讀取資料表' }), h('p', { class: 'note err', text: S.gateMsg }), h('button', { class: 'btn primary block', onclick: boot }, '重試')); return g; }
    return g;
  }

  /* ---------- 啟動 ---------- */
  async function boot() {
    applyTheme();
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    S.apiUrl = (CFG.apiUrl || '').trim() || hash.get('api') || lsGet(LS.api) || '';
    if (hash.get('api') && !CFG.apiUrl) lsSet(LS.api, hash.get('api'));
    const teacher = lsGet(LS.teacher), admin = lsGet(LS.admin);
    if (hash.get('s')) { S.pendingScan = 'HW.' + hash.get('s').replace(/^HW\./, ''); history.replaceState(null, '', location.pathname + location.search); }
    if (!S.apiUrl) { S.screen = 'setup'; render(); return; }
    S.screen = 'boot'; render();
    if (teacher && teacher.token) { S.token = teacher.token; S.classId = teacher.classId; S.role = 'teacher'; S.screen = 'app'; render(); startPolling(); await load({ force: true, full: true }); return; }
    if (admin && (admin.atoken || admin.key)) {
      S.atoken = admin.atoken || null; S.key = admin.atoken ? null : admin.key; S.role = 'admin'; S.screen = 'app'; S.view = 'class'; render(); startPolling(); await load({ force: true, full: true });
      // 舊版本記住的是密碼：換成登入憑證後刪掉密碼（後端尚未更新時維持原狀）
      if (S.key && S.screen === 'app') { try { const r = await apiPost({ action: 'adminLogin', key: S.key, label: deviceLabel() }); if (r.ok && r.atoken) { S.atoken = r.atoken; S.key = null; lsSet(LS.admin, { atoken: r.atoken }); } } catch (e) { } }
      return;
    }
    S.screen = 'login'; render();
  }
  boot();
})();
