/* 作業抽查紀錄 — 前端程式
   資料來源：Google 試算表（Apps Script 網頁應用程式）。
   角色：教務組（密碼登入，看全校、管理設定）／導師（班級專屬連結綁定裝置，只看自己班）。 */
(function () {
  'use strict';

  const APP_VERSION = '2026.11.05';
  const CFG = Object.assign({ apiUrl: '', schoolName: '', unitName: '教務處', appName: '作業抽查紀錄', pollSeconds: 45 }, window.HC_CONFIG || {});
  const LS = { admin: 'hc.admin', teacher: 'hc.teacher', api: 'hc.api', cls: 'hc.class' };
  const GRADE = ['', '一', '二', '三', '四', '五', '六'];
  const WD = '日一二三四五六';

  /* ---------- 狀態 ---------- */
  const S = {
    apiUrl: '', role: null, key: null, token: null, classId: null,
    config: null, rounds: [], rid: null, loadedRid: null, checks: {}, links: {}, version: null,
    lastSync: null, sync: 'busy', syncMsg: '',
    screen: 'boot', gateMsg: '', welcomeClass: '',
    view: 'class', selClass: null, draft: null,
    pending: new Map(), outbox: new Map(), flushTimer: null, flushing: false,
    modal: null, justStamped: null, narrow: false
  };
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
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
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
  function authParams() { return S.role === 'admin' && S.key ? { key: S.key } : (S.token ? { token: S.token } : {}); }
  async function apiGet(params) {
    if (!S.apiUrl) throw new Error('尚未設定資料表網址');
    const u = new URL(S.apiUrl);
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') u.searchParams.set(k, v); });
    for (let i = 0; ; i++) {
      u.searchParams.set('_', Date.now());
      let r = null;
      try { r = await fetch(u, { redirect: 'follow' }); } catch (e) { if (i >= 2) throw new Error(netErr()); }
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
      try { r = await fetch(S.apiUrl, { method: 'POST', body: payload, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow' }); } catch (e) { if (i >= 2) throw new Error(netErr()); }
      if (r && r.ok) return parseJson(r);
      if (r && !(r.status === 404 || r.status === 429 || r.status >= 500)) throw new Error('連不到資料表（' + r.status + '）');
      if (i >= 2) throw new Error('Google 暫時沒有回應');
      await new Promise(ok => setTimeout(ok, 1200 * (i + 1)));
    }
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
      const params = Object.assign({ rid: S.rid || '' }, authParams());
      if (!opts.force && S.version && S.loadedRid === S.rid) params.v = S.version;
      const r = await apiGet(params);
      if (!r.ok) { if (r.error === 'auth') return authLost(); throw new Error('讀取失敗：' + (r.error || '')); }
      S.version = r.version;
      if (r.unchanged) { S.lastSync = new Date(); setSync('ok'); return; }
      S.role = r.role; S.config = r.config || { items: [], classes: [] }; S.rounds = r.rounds || []; S.links = r.links || {};
      if (r.role === 'teacher') S.classId = r.classId;
      S.rid = r.rid || null; S.loadedRid = S.rid;
      applyServer(r.checks || {}, startedAt);
      S.lastSync = new Date(); setSync('ok');
      if (S.role === 'teacher') S.selClass = S.classId;
      if (opts.full) render(); else renderSoft();
    } catch (e) {
      setSync('err', e.message);
      if (opts.full) { S.screen = 'error'; S.gateMsg = e.message; render(); }
    }
  }
  function applyServer(checks, startedAt) {
    const next = {};
    Object.keys(checks).forEach(cid => { next[cid] = { marks: Object.assign({}, checks[cid].marks || {}), updatedAt: checks[cid].updatedAt || '', updatedBy: checks[cid].updatedBy || '' }; });
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
  window.addEventListener('online', () => { if (S.screen === 'app') load(); });
  function authLost() {
    S.pending.clear(); S.outbox.clear();
    if (S.role === 'teacher') { lsSet(LS.teacher, null); S.token = null; S.screen = 'auth-lost'; }
    else { lsSet(LS.admin, null); S.key = null; S.screen = 'login'; S.gateMsg = '登入已失效，請重新輸入密碼。'; }
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
    const boxKey = rid + '|' + cid;
    const box = S.outbox.get(boxKey) || S.outbox.set(boxKey, new Map()).get(boxKey);
    box.set(no + '|' + itemId, { no, itemId, val });
    clearTimeout(S.flushTimer); S.flushTimer = setTimeout(flush, 450);
    if (!(opts && opts.quiet)) renderSoft();
  }
  async function flush() {
    if (S.flushing) return; S.flushing = true;
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
          continue;
        }
        changes.forEach(c => S.pending.delete(markKey(rid, cid, c.no, c.itemId)));
        if (r && r.error === 'auth') { authLost(); return; }
        if (r && r.error === 'locked') toast('本次抽查已結案，無法變更；如需更正請洽教務組。', 3200);
        else toast('儲存失敗（' + (err ? err.message : (r && r.error) || '未知錯誤') + '），已還原為資料表內容。', 3600);
      }
    } finally {
      S.flushing = false;
      setTimeout(() => load({ force: true }), 250);
    }
  }

  /* ---------- 資料工具 ---------- */
  const round = () => S.rounds.find(r => r.id === S.rid) || null;
  const classes = () => (S.config && S.config.classes) || [];
  const allItems = () => (S.config && S.config.items) || [];
  function classHasItem(cls, it) { if (Array.isArray(cls.itemIds)) return cls.itemIds.includes(it.id); return (it.grades || []).map(Number).includes(Number(cls.grade)); }
  function itemsFor(cls, r) { r = r || round(); if (!r || !cls) return []; const ids = new Set(r.itemIds || []); return allItems().filter(it => ids.has(it.id) && classHasItem(cls, it)); }
  function roundItems(r) { r = r || round(); if (!r) return []; const ids = new Set(r.itemIds || []); return allItems().filter(it => ids.has(it.id)); }
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
    app.append(renderMasthead(), renderRoundbar(), S.role === 'admin' ? renderTabs() : '', h('main', { id: 'main' }), renderFoot());
    renderMain();
  }
  function renderSoft() {
    if (S.screen !== 'app') return;
    const rb = $('#roundbar'); if (rb) rb.replaceWith(renderRoundbar());
    const mh = $('#masthead'); if (mh) mh.replaceWith(renderMasthead());
    if (S.view === 'settings' && S.draft) { if (S.modal && S.modal.refresh) S.modal.refresh(); return; }
    renderMain();
    if (S.modal && S.modal.refresh) S.modal.refresh();
  }
  function renderMain() {
    const m = $('#main'); if (!m) return;
    m.replaceChildren();
    if (S.role === 'admin' && S.view === 'overview') return m.append(renderOverview());
    if (S.role === 'admin' && S.view === 'settings') return m.append(renderSettings());
    m.append(renderClassView());
    if (S.justStamped) setTimeout(() => { S.justStamped = null; }, 300);
  }
  function renderSync() {
    const el = h('span', { id: 'sync', class: 'sync ' + (S.sync === 'ok' ? '' : S.sync) }, h('i', { class: 'dot' }));
    if (S.sync === 'busy') el.append('同步中…');
    else if (S.sync === 'err') el.append('無法連線' + (S.lastSync ? '，顯示 ' + fmtTime(S.lastSync) + ' 的資料' : ''));
    else el.append('已同步 ' + fmtTime(S.lastSync));
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
    const bar = h('div', { id: 'roundbar', class: 'roundbar' });
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
    const tabs = [['class', '班級檢核'], ['overview', '全校總覽'], ['settings', '設定']];
    return h('nav', { class: 'tabs', role: 'tablist' }, tabs.map(([id, label]) => h('button', { role: 'tab', 'aria-selected': String(S.view === id), onclick: () => { S.view = id; if (id !== 'settings') S.draft = null; renderMain(); document.querySelectorAll('nav.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.textContent === label))); } }, label)));
  }
  function renderFoot() {
    const f = h('footer', { class: 'foot' }, h('span', { text: CFG.appName + '　版本 ' + APP_VERSION + '　資料存於 Google 試算表，開啟網頁即為最新。' }));
    if (S.role === 'teacher') f.append(armed(h('button', { class: 'link' }), '在此裝置登出', '再按一次確認登出（之後需請教務組解除才能重新登入）', () => { lsSet(LS.teacher, null); S.token = null; S.screen = 'login'; S.gateMsg = '已在此裝置登出。'; render(); }, 4000));
    else f.append(h('button', { class: 'link', onclick: () => { lsSet(LS.admin, null); S.key = null; S.screen = 'login'; S.gateMsg = ''; render(); } }, '登出'));
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
    const prog = classProgress(cls, r); const pct = prog.total ? Math.round(prog.got / prog.total * 100) : 0;
    const ed = canEditClass(cls.id);
    const d = S.checks[cls.id];

    const sub = h('div', { class: 'sub' }, h('span', { text: '全班 ' + n + ' 人' }));
    if (cls.teacher) sub.prepend(h('span', { text: '導師 ' + cls.teacher }));
    if (d && d.updatedAt) sub.append(h('span', { text: '最後登記 ' + fmtStamp(d.updatedAt) + (d.updatedBy ? '（' + d.updatedBy + '）' : '') }));
    const actions = h('div', { class: 'row' },
      h('button', { class: 'btn ghost small', onclick: () => openMissing([cls]) }, svg('list'), '未交名單'),
      h('button', { class: 'btn ghost small', onclick: () => exportCSV(S.role === 'admin' ? classes() : [cls]) }, svg('down'), 'CSV'),
      h('button', { class: 'btn ghost small', onclick: () => window.print() }, svg('print'), '列印'));
    box.append(h('div', { class: 'classhead' },
      h('div', { class: 'row' }, ring(pct), h('div', null, h('h2', { text: cls.name }), sub)),
      actions));
    box.append(h('div', { class: 'print-meta', text: (CFG.schoolName || '') + '　' + (r ? r.name : '') + '　' + cls.name + '　列印時間 ' + new Date().toLocaleString('zh-TW') }));

    if (!items.length) { box.append(h('div', { class: 'empty', text: '這次抽查沒有適用於本班的項目。' + (S.role === 'admin' ? '請到「設定」檢查本次抽查項目與本班的習作項目。' : '') })); return box; }
    if (!n) { box.append(h('div', { class: 'empty', text: S.role === 'admin' ? '這個班級還沒有學生名單，請到「設定」貼上名單。' : '這個班級還沒有學生名單，請洽教務組。' })); return box; }

    // 項目卡：名稱、科任、進度；可點開快速收件
    box.append(h('div', { class: 'items' }, items.map(it => {
      const c = countItem(cls, it); const p = n ? Math.round(c / n * 100) : 0;
      const who = (cls.subjectTeachers || {})[it.id];
      const card = h(ed ? 'button' : 'div', { class: 'item' + (it.kind === 'exam' ? ' exam' : '') + (c === n ? ' done' : ''), type: ed ? 'button' : null, onclick: ed ? () => openQuick(cls, it) : null },
        h('div', { class: 'nm' }, h('span', { text: it.name }), h('b', { text: c + '/' + n })),
        h('div', { class: 'who', text: who ? (it.kind === 'exam' ? who : '科任 ' + who) : (it.kind === 'exam' ? '家長簽名後繳回' : '') }),
        h('div', { class: 'bar' + (it.kind === 'exam' ? ' exam' : '') }, h('i', { style: 'width:' + p + '%' })));
      if (ed) card.append(h('div', { class: 'act', text: it.kind === 'exam' ? '逐號登記繳回 ›' : '快速收件 ›' }));
      return card;
    })));
    if (!ed) box.append(h('div', { class: 'banner info', text: r && r.locked && S.role === 'teacher' ? '本次抽查已結案，紀錄僅供查看；如需更正請洽教務組。' : '目前為查看模式。' }));

    box.append(h('div', { class: 'legend' },
      h('span', null, h('i', { style: 'background:var(--accent)' }), '習作已交'),
      h('span', null, h('i', { style: 'background:var(--seal)' }), '考卷（家長已簽名）已繳回'),
      h('span', null, h('i', { style: 'background:var(--off)' }), '尚未繳交')));

    box.append(S.narrow ? renderCards(cls, items, studs, ed) : renderTable(cls, items, studs, ed));
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
    const key = markKey(S.rid, cls.id, s.no, it.id);
    const b = h('button', { type: 'button', class: it.kind === 'exam' ? 'seal' + (S.justStamped === key ? ' pop' : '') : 'sw', role: 'switch', 'aria-checked': String(on), 'aria-label': s.no + '號 ' + (s.name || '') + ' ' + it.name + (on ? '（已交）' : '（未交）'), title: it.name, disabled: !ed,
      onclick: () => { const nv = !isOn(cls.id, s.no, it.id); S.justStamped = (it.kind === 'exam' && nv) ? key : null; setMark(cls.id, s.no, it.id, nv); } });
    if (it.kind === 'exam') b.textContent = '簽';
    return b;
  }
  function renderTable(cls, items, studs, ed) {
    const n = studs.length;
    const thead = h('tr', null, h('th', { text: '座號' }), h('th', { style: 'text-align:left', text: '姓名' }),
      items.map(it => { const c = countItem(cls, it); const th = h('th', { class: it.kind === 'exam' ? 'exam' : null }, h('div', { text: it.short || it.name }), h('span', { class: 'cnt', text: c + '/' + n })); if (ed) th.append(h('button', { class: 'link', onclick: () => openQuick(cls, it) }, '收件')); return th; }),
      h('th', { text: '狀態' }));
    const rows = studs.map(s => {
      const miss = items.filter(it => !isOn(cls.id, s.no, it.id)).length;
      return h('tr', { class: miss === 0 ? 'allin' : null },
        h('td', { class: 'no', text: String(s.no) }), h('td', { class: 'name', text: s.name || '—' }),
        items.map(it => h('td', null, toggleBtn(cls, s, it, ed))),
        h('td', { class: 'st', text: miss === 0 ? '全部繳齊' : '缺 ' + miss + ' 項' }));
    });
    const foot = h('tr', { class: 'tfoot' }, h('td', { colspan: 2, style: 'text-align:left', text: '已交人數' }), items.map(it => h('td', { text: countItem(cls, it) + ' / ' + n })), h('td', { text: studs.filter(s => items.every(it => isOn(cls.id, s.no, it.id))).length + ' 人繳齊' }));
    return h('div', { class: 'tablebox' }, h('table', null, h('thead', null, thead), h('tbody', null, rows), h('tfoot', null, foot)));
  }
  function renderCards(cls, items, studs, ed) {
    const hw = items.filter(it => it.kind !== 'exam'); const ex = items.filter(it => it.kind === 'exam');
    return h('div', { class: 'cards' }, studs.map(s => {
      const miss = items.filter(it => !isOn(cls.id, s.no, it.id)).length;
      const top = h('div', { class: 'top' }, h('span', { class: 'no', text: String(s.no) }), h('span', { class: 'nm', text: s.name || '—' }), ex.map(it => toggleBtn(cls, s, it, ed)));
      const subs = h('div', { class: 'subs' }, hw.map(it => h('button', { type: 'button', class: 'subj', role: 'switch', 'aria-checked': String(isOn(cls.id, s.no, it.id)), disabled: !ed, onclick: () => setMark(cls.id, s.no, it.id, !isOn(cls.id, s.no, it.id)) }, it.short || it.name)));
      return h('div', { class: 'card' + (miss === 0 ? ' allin' : '') }, top, subs);
    }));
  }

  /* ---------- 快速收件（依項目逐號登記） ---------- */
  function openModal(build) {
    closeModal();
    const inner = h('div', { class: 'inner', role: 'dialog', 'aria-modal': 'true' });
    const ov = h('div', { class: 'modal', onclick: e => { if (e.target === ov) closeModal(); } }, inner);
    const onKey = e => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    S.modal = { el: ov, refresh: () => { inner.replaceChildren(); build(inner); }, onKey };
    build(inner); document.body.append(ov);
    return S.modal;
  }
  function closeModal() { if (S.modal) { S.modal.el.remove(); document.removeEventListener('keydown', S.modal.onKey); S.modal = null; } }
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
          ed ? armed(h('button', { class: 'btn small ghost' }), '全部' + (it.kind === 'exam' ? '繳回' : '已交'), '確定全部勾選？', () => { studs.forEach(s => { if (!isOn(c.id, s.no, it.id)) setMark(c.id, s.no, it.id, true, { quiet: true }); }); renderSoft(); }) : null,
          ed ? armed(h('button', { class: 'btn small ghost' }), '全部清除', '確定全部取消？', () => { studs.forEach(s => { if (isOn(c.id, s.no, it.id)) setMark(c.id, s.no, it.id, false, { quiet: true }); }); renderSoft(); }) : null)));
      inner.append(h('div', { class: 'tiles' + (it.kind === 'exam' ? ' exam' : '') }, studs.map(s => h('button', { type: 'button', class: 'tile', role: 'switch', 'aria-checked': String(isOn(c.id, s.no, it.id)), disabled: !ed, onclick: () => setMark(c.id, s.no, it.id, !isOn(c.id, s.no, it.id)) }, h('b', { text: String(s.no) }), h('small', { text: s.name || '' })))));
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

  /* ---------- 匯出 CSV ---------- */
  function exportCSV(list) {
    const r = round(); if (!r) return;
    const items = roundItems(r);
    const rows = [['班級', '導師', '座號', '姓名', ...items.map(i => i.name), '已交項目', '應交項目', '狀態']];
    list.forEach(cls => {
      const its = itemsFor(cls, r); const set = new Set(its.map(i => i.id));
      (cls.students || []).slice().sort((a, b) => a.no - b.no).forEach(s => {
        const got = its.filter(it => isOn(cls.id, s.no, it.id)).length;
        rows.push([cls.name, cls.teacher || '', s.no, s.name || '', ...items.map(it => !set.has(it.id) ? '不適用' : (isOn(cls.id, s.no, it.id) ? (it.kind === 'exam' ? '已繳回' : '已交') : (it.kind === 'exam' ? '未繳回' : '未交'))), got, its.length, got === its.length ? '繳齊' : '缺 ' + (its.length - got) + ' 項']);
      });
    });
    const csv = '﻿' + rows.map(row => row.map(v => { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\r\n');
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
        items.map(it => {
          if (!classHasItem(cls, it)) return h('td', { class: 'mini', text: '—' });
          const c = countItem(cls, it); const q = n ? Math.round(c / n * 100) : 0;
          return h('td', null, h('div', { text: c + '/' + n }), h('div', { class: 'bar' + (it.kind === 'exam' ? ' exam' : '') }, h('i', { style: 'width:' + q + '%' })));
        }),
        h('td', { class: 'pct' + (p.total && pct === 100 ? ' full' : ''), text: p.total ? pct + '%' : '—' }),
        h('td', { class: 'mini', text: d && d.updatedAt ? fmtStamp(d.updatedAt) : '尚未登記' }));
    });
    const pct = total ? Math.round(got / total * 100) : 0;
    box.append(h('div', { class: 'row between' },
      h('div', { class: 'stats' },
        h('div', { class: 'stat' + (pct === 100 && total ? ' ok' : '') }, '全校完成率', h('b', { text: pct + '%' })),
        h('div', { class: 'stat' }, '已交／應交', h('b', { text: got + ' / ' + total })),
        h('div', { class: 'stat' }, '全班繳齊', h('b', { text: full + ' / ' + cl.length + ' 班' }))),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost small', onclick: () => openMissing(cl) }, svg('list'), '全校未交名單'),
        h('button', { class: 'btn ghost small', onclick: () => exportCSV(cl) }, svg('down'), '匯出 CSV'),
        h('button', { class: 'btn ghost small', onclick: () => window.print() }, svg('print'), '列印'))));
    box.append(h('div', { class: 'print-meta', text: (CFG.schoolName || '') + '　' + r.name + '　全校總覽　列印時間 ' + new Date().toLocaleString('zh-TW') }));
    box.append(h('div', { class: 'tablebox' }, h('table', { class: 'ov' },
      h('thead', null, h('tr', null, h('th', { style: 'text-align:left', text: '班級' }), items.map(it => h('th', { class: it.kind === 'exam' ? 'exam' : null, text: it.short || it.name })), h('th', { text: '完成率' }), h('th', { text: '最後登記' }))),
      h('tbody', null, rows))));
    box.append(h('div', { class: 'note', text: '點班級名稱可進入該班登記；導師在自己的裝置登記後，這裡會自動更新。' }));
    return box;
  }

  /* ---------- 設定（教務組） ---------- */
  function renderSettings() {
    if (!S.draft) S.draft = JSON.parse(JSON.stringify(S.config || { items: [], classes: [] }));
    const D = S.draft;
    const box = h('div', { class: 'stack' });

    /* 抽查次別 */
    const rp = h('div', { class: 'panel' }, h('h3', null, '抽查次別', h('small', { text: '每次抽查建立一筆；結案後導師不能再更動' })));
    S.rounds.forEach(r => rp.append(roundEditor(r)));
    const term = rocTerm();
    const nName = h('input', { type: 'text', class: 'grow', 'aria-label': '次別名稱', value: term.year + '學年度第' + term.sem + '學期 第' + (S.rounds.length + 1) + '次作業抽查' });
    const nDue = h('input', { type: 'date', 'aria-label': '繳交截止日' });
    const picks = allItems().map(it => { const cb = h('input', { type: 'checkbox', checked: true }); return { it, cb, el: h('label', { class: 'ck' }, cb, it.name) }; });
    rp.append(h('div', { class: 'divider' }), h('div', { class: 'note', text: '建立新的抽查次別' }),
      h('div', { class: 'row' }, nName, h('span', { class: 'note', text: '截止' }), nDue),
      h('div', { class: 'row' }, picks.map(p => p.el)),
      h('div', null, h('button', { class: 'btn primary', onclick: async () => {
        const name = nName.value.trim(); if (!name) return toast('請填寫次別名稱');
        const rd = { id: 'r' + Date.now().toString(36), name, due: nDue.value || '', itemIds: picks.filter(p => p.cb.checked).map(p => p.it.id), locked: false, createdAt: new Date().toISOString() };
        await adminPost({ action: 'addRound', round: rd }, '已建立「' + name + '」'); S.rid = rd.id; S.version = null; await load({ force: true, full: true });
      } }, '建立抽查次別')));
    box.append(rp);

    /* 檢查項目 */
    const ip = h('div', { class: 'panel' }, h('h3', null, '檢查項目', h('small', { text: '習作以開關呈現；「考卷」類以印章呈現，代表家長簽名後已繳回' })));
    D.items.forEach((it, i) => {
      const gs = [1, 2, 3, 4, 5, 6].map(g => h('label', { class: 'ck' }, h('input', { type: 'checkbox', checked: (it.grades || []).map(Number).includes(g), onchange: e => { it.grades = (it.grades || []).map(Number).filter(x => x !== g); if (e.target.checked) it.grades.push(g); it.grades.sort(); } }), GRADE[g]));
      ip.append(h('div', { class: 'classcard' },
        h('div', { class: 'row' },
          h('input', { type: 'text', class: 'grow', value: it.name, 'aria-label': '項目名稱', oninput: e => { it.name = e.target.value; } }),
          h('input', { type: 'text', value: it.short || '', placeholder: '簡稱', style: 'width:90px', 'aria-label': '簡稱', oninput: e => { it.short = e.target.value; } }),
          h('select', { 'aria-label': '類型', onchange: e => { it.kind = e.target.value; } }, h('option', { value: 'hw', text: '習作', selected: it.kind !== 'exam' }), h('option', { value: 'exam', text: '考卷（家長簽名）', selected: it.kind === 'exam' })),
          h('button', { class: 'btn small ghost', disabled: i === 0, onclick: () => { D.items.splice(i - 1, 0, D.items.splice(i, 1)[0]); renderMain(); } }, '↑'),
          h('button', { class: 'btn small danger', onclick: () => { D.items.splice(i, 1); renderMain(); } }, '移除')),
        h('div', { class: 'row' }, h('span', { class: 'note', text: '預設適用年級' }), gs)));
    });
    ip.append(h('div', null, h('button', { class: 'btn ghost', onclick: () => { D.items.push({ id: uid('i'), name: '新項目', short: '', kind: 'hw', grades: [1, 2, 3, 4, 5, 6] }); renderMain(); } }, '＋ 新增項目')));
    box.append(ip);

    /* 班級 */
    const cp = h('div', { class: 'panel' }, h('h3', null, '班級與學生名單', h('small', { text: '名單每行一位：「座號 姓名」，例如「1 王小明」；也可從 Excel 直接貼上兩欄' })));
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
    const lp = h('div', { class: 'panel' }, h('h3', null, '導師登入裝置', h('small', { text: '導師在登入頁選自己的班級，第一台登入的裝置即綁定；之後該班不能再從別的裝置登入' })));
    lp.append(h('div', { class: 'note', text: '導師換手機、或誤用別人的手機登入時，在這裡「解除」後，導師再用新裝置選班級登入即可。' }));
    classes().forEach(cls => lp.append(deviceEditor(cls)));
    box.append(lp);

    /* 系統 */
    const sp = h('div', { class: 'panel' }, h('h3', { text: '系統' }));
    sp.append(h('div', { class: 'row' },
      h('button', { class: 'btn ghost', onclick: openChangeKey }, '修改教務組密碼'),
      h('button', { class: 'btn ghost', onclick: async () => { if (!round()) return toast('尚未建立抽查次別'); await adminPost({ action: 'snapshot', rid: S.rid }, '已在試算表建立本次抽查的「總表」分頁'); } }, '將本次抽查寫入試算表總表'),
      h('button', { class: 'btn ghost', onclick: () => exportCSV(classes()) }, svg('down'), '匯出全校 CSV')));
    sp.append(h('div', { class: 'note', text: '資料表網址：' + S.apiUrl }));
    box.append(sp);
    return box;
  }
  function validateDraft(D) {
    if (!D.items.length) return '至少要有一個檢查項目';
    for (const it of D.items) if (!it.name.trim()) return '有項目沒有名稱';
    for (const c of D.classes) {
      if (!c.name.trim()) return '有班級沒有名稱';
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
    const picks = allItems().map(it => { const cb = h('input', { type: 'checkbox', checked: (e.itemIds || []).includes(it.id) }); return { it, cb, el: h('label', { class: 'ck' }, cb, it.name) }; });
    const save = h('button', { class: 'btn small primary', onclick: async () => { e.itemIds = picks.filter(p => p.cb.checked).map(p => p.it.id); await adminPost({ action: 'updateRound', round: e }, '已更新'); S.version = null; await load({ force: true, full: true }); } }, '儲存');
    const del = armed(h('button', { class: 'btn small danger' }), '刪除', '再按一次確認刪除（紀錄一併刪除）', async () => { await adminPost({ action: 'delRound', rid: e.id }, '已刪除'); S.version = null; if (S.rid === e.id) S.rid = null; await load({ force: true, full: true }); }, 3500);
    return h('div', { class: 'classcard' }, h('div', { class: 'row' }, name, h('span', { class: 'note', text: '截止' }), due, lock, save, del), h('div', { class: 'row' }, h('span', { class: 'note', text: '本次項目' }), picks.map(p => p.el)));
  }
  function classEditor(c, i) {
    const D = S.draft;
    const ta = h('textarea', { 'aria-label': c.name + ' 學生名單', oninput: e => { c.students = parseRoster(e.target.value); cnt.textContent = '目前 ' + c.students.length + ' 人'; } });
    ta.value = (c.students || []).map(s => (s.no + ' ' + (s.name || '')).trim()).join('\n');
    const cnt = h('span', { class: 'note', text: '目前 ' + (c.students || []).length + ' 人' });
    const num = h('input', { type: 'number', min: '1', max: '60', placeholder: '人數', style: 'width:84px', 'aria-label': '人數' });
    const gen = h('button', { class: 'btn small ghost', onclick: () => { const k = +num.value; if (!(k > 0)) return toast('請先填人數'); const old = c.students || []; c.students = Array.from({ length: k }, (_, j) => ({ no: j + 1, name: (old.find(s => s.no === j + 1) || {}).name || '' })); renderMain(); } }, '只用座號，產生 1～N 號');
    const rm = armed(h('button', { class: 'btn small danger' }), '移除班級', '再按一次確認移除', () => { D.classes.splice(i, 1); renderMain(); });
    // 本班習作項目（預設依年級），與各科任老師
    const useDefault = !Array.isArray(c.itemIds);
    const itemBox = h('div', { class: 'subgrid' });
    const rebuildItems = () => {
      itemBox.replaceChildren();
      D.items.forEach(it => {
        const on = useDefaultNow() ? (it.grades || []).map(Number).includes(Number(c.grade)) : c.itemIds.includes(it.id);
        const cb = h('input', { type: 'checkbox', checked: on, onchange: e => { if (useDefaultNow()) c.itemIds = D.items.filter(x => (x.grades || []).map(Number).includes(Number(c.grade))).map(x => x.id); c.itemIds = c.itemIds.filter(x => x !== it.id); if (e.target.checked) c.itemIds.push(it.id); } });
        const who = h('input', { type: 'text', placeholder: it.kind === 'exam' ? '備註（可留白）' : '科任老師（可留白）', value: (c.subjectTeachers || {})[it.id] || '', oninput: e => { c.subjectTeachers = c.subjectTeachers || {}; c.subjectTeachers[it.id] = e.target.value.trim(); } });
        itemBox.append(h('label', null, cb, h('span', { text: it.short || it.name }), who));
      });
    };
    const useDefaultNow = () => !Array.isArray(c.itemIds);
    rebuildItems();
    return h('div', { class: 'classcard' },
      h('div', { class: 'row' },
        h('input', { type: 'text', value: c.name, style: 'width:120px', 'aria-label': '班級名稱', oninput: e => { c.name = e.target.value; } }),
        h('select', { 'aria-label': '年級', onchange: e => { c.grade = +e.target.value; if (useDefaultNow()) rebuildItems(); } }, [1, 2, 3, 4, 5, 6].map(g => h('option', { value: g, text: GRADE[g] + '年級', selected: Number(c.grade) === g }))),
        h('input', { type: 'text', value: c.teacher || '', placeholder: '導師姓名', style: 'width:130px', 'aria-label': '導師姓名', oninput: e => { c.teacher = e.target.value.trim(); } }),
        rm),
      h('div', { class: 'row' }, h('span', { class: 'note', text: '本班習作項目與科任老師' }), useDefault ? h('span', { class: 'tag', text: '依年級預設' }) : h('button', { class: 'link', style: 'font-size:12px', onclick: () => { delete c.itemIds; renderMain(); } }, '恢復依年級預設')),
      itemBox,
      ta,
      h('div', { class: 'row' }, cnt, num, gen));
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
      dev ? armed(h('button', { class: 'btn small danger' }), '解除', '再按一次確認解除', async () => { await adminPost({ action: 'revokeDevices', classId: cls.id }, cls.name + ' 已解除，導師可重新登入'); S.version = null; await load({ force: true }); renderMain(); }) : null));
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
  function errText(code) { return { busy: '資料表忙碌中，請稍後再試', locked: '本次抽查已結案', no_round: '找不到這次抽查', too_large: '資料量超過單格上限，請分班減少名單', bad_request: '資料格式不正確', weak_key: '密碼至少 6 個字' }[code] || (code || '未知錯誤'); }
  function openChangeKey() {
    openModal(inner => {
      const a = h('input', { type: 'password', placeholder: '新密碼（至少 6 個字）', autocomplete: 'new-password' }); const b = h('input', { type: 'password', placeholder: '再輸入一次', autocomplete: 'new-password' });
      inner.append(h('h3', { text: '修改教務組密碼' }), h('div', { class: 'note', text: '修改後，其他已登入的裝置需重新輸入新密碼。' }), a, b,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => {
          if (a.value.length < 6) return toast('密碼至少 6 個字'); if (a.value !== b.value) return toast('兩次輸入不一致');
          await adminPost({ action: 'changeKey', newKey: a.value }, '密碼已更新'); S.key = a.value; lsSet(LS.admin, { key: S.key }); closeModal();
        } }, '確定修改'), h('button', { class: 'btn ghost', onclick: closeModal }, '取消')));
    });
  }

  /* ---------- 登入／綁定畫面 ---------- */
  function renderGate() {
    const g = h('div', { class: 'gate' });
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
            msg.textContent = r.error === 'claimed' ? '這個班級已經有其他裝置登入過了。若您換了手機，請教務組在「設定」中解除後再登入。' : '登入失敗：' + errText(r.error);
            btn.disabled = false; return;
          }
          S.token = r.token; S.classId = r.classId; S.role = 'teacher'; lsSet(LS.teacher, { token: r.token, classId: r.classId });
          S.welcomeClass = r.className || ''; S.screen = 'welcome'; render();
        } catch (e) { msg.textContent = e.message; msg.className = 'note err'; btn.disabled = false; }
      };
      const btn = h('button', { class: 'btn primary block', onclick: go }, '登入');
      p.append(h('h2', { text: '導師登入' }), h('p', { text: '請選擇自己的班級。只有第一次登入的那一台手機或電腦會被綁定，之後開啟網頁直接進入，不需要密碼。如果換了手機、或需要重新登入，請跟教務組聯繫。' }), sel, btn, msg);
      apiGet({ action: 'classes' }).then(r => {
        sel.replaceChildren(h('option', { value: '', text: '請選擇班級／導師' }));
        if (!r.ok || !r.classes || !r.classes.length) { sel.append(h('option', { value: '', text: '尚未建立班級，請洽教務組' })); return; }
        r.classes.forEach(c => sel.append(h('option', { value: c.id, text: c.name + (c.teacher ? '　' + c.teacher : '') + (c.claimed ? '（已登入）' : ''), disabled: !!c.claimed })));
        sel.disabled = false;
      }).catch(e => {                                   // 導師頁不顯示技術錯誤；原因（例如部署權限）只給教務組看
        sel.replaceChildren(h('option', { value: '', text: '目前無法載入班級，請稍後再試' }));
        msg.textContent = '目前連不到資料表。只有第一次登入的那一台手機或電腦會被綁定；如果需要重新登入，請跟教務組聯繫。'; msg.className = 'note';
        S.gateErr = e.message;
      });
      // 教務組
      const ap = h('div', { class: 'panel' });
      const inp = h('input', { type: 'password', placeholder: '教務組密碼', autocomplete: 'current-password', hidden: true, onkeydown: e => { if (e.key === 'Enter') goAdmin(); } });
      const amsg = h('p', { class: 'note', text: '' });
      const abtn = h('button', { class: 'btn ghost block', hidden: true, onclick: () => goAdmin() }, '以教務組身分登入');
      const goAdmin = async () => {
        const k = inp.value.trim(); if (!k) return;
        abtn.disabled = true; amsg.textContent = '登入中…'; amsg.className = 'note';
        try {
          const r = await apiGet({ key: k });
          if (r.ok && r.role === 'admin') { S.key = k; S.role = 'admin'; lsSet(LS.admin, { key: k }); S.screen = 'app'; S.view = 'class'; S.gateMsg = ''; render(); startPolling(); await load({ force: true, full: true }); return; }
          amsg.textContent = r.error === 'auth' ? '密碼不正確。' : '登入失敗：' + errText(r.error); amsg.className = 'note err';
        } catch (e) { amsg.textContent = e.message; amsg.className = 'note err'; }
        abtn.disabled = false;
      };
      ap.append(h('button', { class: 'link', style: 'font-size:13px;align-self:flex-start', onclick: () => { inp.hidden = false; abtn.hidden = false; inp.focus(); if (S.gateErr) { amsg.textContent = '教務組請看：' + S.gateErr; amsg.className = 'note err'; } } }, '教務組登入'), inp, abtn, amsg);
      g.append(ap);
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
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    S.apiUrl = (CFG.apiUrl || '').trim() || hash.get('api') || lsGet(LS.api) || '';
    if (hash.get('api') && !CFG.apiUrl) lsSet(LS.api, hash.get('api'));
    const teacher = lsGet(LS.teacher), admin = lsGet(LS.admin);
    if (!S.apiUrl) { S.screen = 'setup'; render(); return; }
    S.screen = 'boot'; render();
    if (teacher && teacher.token) { S.token = teacher.token; S.classId = teacher.classId; S.role = 'teacher'; S.screen = 'app'; render(); startPolling(); await load({ force: true, full: true }); return; }
    if (admin && admin.key) { S.key = admin.key; S.role = 'admin'; S.screen = 'app'; S.view = 'class'; render(); startPolling(); await load({ force: true, full: true }); return; }
    S.screen = 'login'; render();
  }
  boot();
})();
