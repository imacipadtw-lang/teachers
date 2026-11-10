// 代課調課網站 冒煙測試（示範模式，不碰正式資料）
// 用法（在倉庫根目錄）：
//   cd daike-calendar && python3 -m http.server 8765 &
//   node daike-calendar/tests/smoke.js            # 預設 http://localhost:8765
//   BASE=http://localhost:9000 node daike-calendar/tests/smoke.js
// 需要 Playwright（require('playwright')）。若同層有 node_modules/axe-core，會一併做無障礙檢查。
// 檢查：各頁無 JS 錯誤、手機版不左右捲、快速指令全部可執行、搜尋、更多選單、切換老師、
//       網路中斷提示、草稿保護、列印簽收單與月報表有內容、Excel 元件可載入且不會把 = 當公式。
const {chromium} = require('playwright');
const BASE = (process.env.BASE || 'http://localhost:8765') + '/index.html?demo=1';
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if(!cond) fails++; };
let AXE = null; try { AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch(e) {}

async function login(p){
  await p.goto(BASE); await p.waitForSelector('#name option[value="王教務"], #name option:not([value=""])', {state:'attached'});
  await p.selectOption('#name', '王教務'); await p.fill('#pw', 'demo'); await p.click('#loginForm button[type=submit]');
  await p.waitForFunction(() => typeof state !== 'undefined' && state.cred && document.querySelectorAll('#pageTabs [data-pg]').length > 0);
}

(async () => {
  const b = await chromium.launch();
  for (const [label, vp] of [['phone', {width:390, height:844}], ['desk', {width:1440, height:900}]]) {
    console.log(`\n[${label}]`);
    const ctx = await b.newContext({viewport: vp}); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
    await p.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; window.open = () => null; });
    await login(p);
    const pages = await p.evaluate(() => pagesFor().map(x => x.k));
    for (const k of pages) {
      await p.evaluate(k => showPage(k), k); await p.waitForTimeout(250);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(sw <= 0, `頁面「${k}」沒有左右捲動（多 ${sw}px）`);
      if (AXE && k !== 'all') {
        const v = await p.evaluate(async src => { if(!window.axe) eval(src); const r = await axe.run(document, {resultTypes:['violations']});
          return r.violations.filter(x => x.impact === 'serious' || x.impact === 'critical').map(x => x.id); }, AXE);
        ok(!v.length, `頁面「${k}」無障礙無嚴重問題 ${v.join(',')}`);
      }
    }
    // 快速指令
    const n = await p.evaluate(() => CMD_ACTIONS().length); let bad = [];
    for (let i = 0; i < n; i++) {
      const r = await p.evaluate(i => { const a = CMD_ACTIONS()[i]; if(/登出/.test(a.t)) return null; try { a.run(); return null; } catch(e) { return a.t + ':' + e.message; } }, i);
      if (r) bad.push(r);
      await p.evaluate(() => { document.querySelectorAll('.modal:not([hidden])').forEach(m => m.hidden = true); document.body.style.overflow = ''; });
    }
    ok(!bad.length, `快速指令 ${n} 個都可執行 ${bad.join('; ')}`);
    // 搜尋
    await p.evaluate(() => showPage('home')); await p.fill('#wbQ', '調-001'); await p.press('#wbQ', 'Enter'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => state.page === 'cal' && !!state.selected), '工作台搜尋序號會跳到年曆那一天');
    // 更多選單
    await p.click('#moreBtn'); ok(await p.isVisible('#moreMenu'), '「更多」選單打得開');
    await p.keyboard.press('Escape'); ok(await p.evaluate(() => document.getElementById('moreMenu').hidden), 'Esc 關閉「更多」選單');
    // 切換老師
    await p.selectOption('#viewAsTop', '甲老師'); await p.waitForTimeout(600);
    ok(await p.evaluate(() => state.viewing === '甲老師'), '頂端可切換到單一老師');
    await p.selectOption('#viewAsTop', ''); await p.waitForTimeout(600);
    // 網路中斷
    await ctx.setOffline(true); await p.waitForTimeout(200);
    ok((await p.textContent('#sysTxt')) === '網路已中斷', '斷網時狀態燈顯示「網路已中斷」');
    await ctx.setOffline(false); await p.waitForTimeout(1500);
    // 草稿保護
    await p.click('#openPlan'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => !planDirty()), '空白的排調代課不算草稿');
    await p.evaluate(() => { plan.swap.teacher = '甲老師'; }); ok(await p.evaluate(() => planDirty()), '填了資料算草稿（關分頁會先問）');
    await p.evaluate(() => { resetPlan(); closePlan(); });
    // 115.11.10 新功能：每筆刪除鈕、不出現復原、假單排代課存好回到假單、剛存好的序號、自動帶入、Ctrl＋Enter
    ok(await p.evaluate(() => { showPage('cal'); const c = document.querySelector('#year .d.has .dhit'); if(c) c.click(); return document.querySelectorAll('[data-evdel]').length > 0; }), '紀錄有「刪除」鈕');
    ok(await p.evaluate(() => { offerUndo('測試', 'U-1'); return document.getElementById('undoBar').hidden; }), '不再出現「復原」鍵');
    const back = await p.evaluate(async () => {
      await openPlan('2026-11-16'); plan.kind = 'absent'; Object.assign(plan.absent, {teacher:'丁老師', from:'2026-11-16', to:'2026-11-17', leaveType:'公假', saved:'假-測試'});
      renderPlan(); absToSub(0); plan.sub.rows.forEach(r => r.sub = '王教務'); refreshPlan(); await new Promise(r => setTimeout(r, 200));
      const can = !document.getElementById('planSave').disabled; document.getElementById('planSave').click(); await new Promise(r => setTimeout(r, 2500));
      return {can, kind: plan && plan.kind, teacher: plan && plan.absent.teacher, strip: !!(state.lastSaved && state.lastSaved.ids.length)}; });
    ok(back.can && back.kind === 'absent' && back.teacher === '丁老師', '假單「排這天的代課」存好後回到同一張假單');
    ok(back.strip, '剛存好的序號記在工作台');
    const metaOk = await p.evaluate(async () => { state.meta = null; renderWorkbench(); await openPlan(); closePlan(); await new Promise(r => setTimeout(r, 300));
      return !!state.meta && !/課表還沒讀到/.test(document.getElementById('workbench').textContent); });
    ok(metaOk, '課表重讀完會更新工作台，不會留著「課表還沒讀到」');
    const auto = await p.evaluate(async () => { resetPlan(); plan.kind = 'sub'; renderPlan(); await ensureMeta();
      const sel = document.querySelector('#planBody [data-k="u.leaver"]'); sel.value = '丁老師'; sel.dispatchEvent(new Event('change', {bubbles:true}));
      const d = document.querySelector('#planBody [data-k="u.date"]'); d.value = '2026-11-17'; d.dispatchEvent(new Event('change', {bubbles:true}));
      await new Promise(r => setTimeout(r, 200)); return plan.sub.rows.length; });
    ok(auto > 0, '選好請假老師和日期自動帶入那天的課');
    const fa = await p.evaluate(async () => { if(plan.sub.rows.length < 2) return 'few'; const s = document.getElementById('fillAll'); if(!s) return 'none';
      s.value = '王教務'; s.dispatchEvent(new Event('change', {bubbles:true})); await new Promise(r => setTimeout(r, 200)); return plan.sub.rows.every(r => r.sub === '王教務'); });
    ok(fa === true || fa === 'few', `多節代課可「全部由」同一位老師一次填好（${fa}）`);
    await p.evaluate(() => { resetPlan(); closePlan(); state.lastSaved = null; try{ localStorage.removeItem('planKind'); }catch(e){} });
    ok(await p.evaluate(() => { showPage('report'); return document.getElementById('pgTitle').textContent.trim().length > 0; }), '換頁後頁面標題（螢幕閱讀器）有內容');
    const saves = await p.evaluate(async () => { let n = 0; const o = apiPost; apiPost = async b => { if(b.action === 'save'){ n++; await new Promise(r => setTimeout(r, 600)); } return o(b); };
      await openPlan('2026-11-17'); plan.kind = 'sub'; plan.sub.leaver = '丁老師'; plan.sub.date = '2026-11-17'; fillDay(); plan.sub.rows.forEach(r => r.sub = '王教務'); renderPlan(); await new Promise(r => setTimeout(r, 200));
      document.getElementById('planSave').click(); document.getElementById('planSave').click(); await new Promise(r => setTimeout(r, 2500)); apiPost = o; return n; });
    ok(saves === 1, `連按儲存只送出一次（送了 ${saves} 次）`);
    await p.evaluate(() => { try{ resetPlan(); closePlan(); }catch(e){} state.lastSaved = null; });
    // 列印
    for (const fn of ['printSign', 'printAcct']) {
      await p.evaluate(async fn => { document.getElementById('printArea').innerHTML = ''; await window[fn](document.getElementById('mSel') ? document.getElementById('mSel').value : state.range); }, fn);
      await p.waitForTimeout(300);
      ok(await p.evaluate(() => document.getElementById('printArea').innerText.length > 200), `${fn} 有列印內容`);
      const badCells = await p.evaluate(() => [...document.querySelectorAll('#printArea td, #printArea th')].filter(c => getComputedStyle(c).display !== 'table-cell').length);
      ok(!badCells, `${fn} 表格每一格都是正常表格格子（防 CSS 類別撞名改到列印版面）${badCells ? '：' + badCells + ' 格異常' : ''}`);
    }
    // Excel
    const xl = await p.evaluate(async () => { await loadExcelJS(); const wb = new ExcelJS.Workbook(); wb.addWorksheet('t').addRow(['=1+1']);
      const wb2 = new ExcelJS.Workbook(); await wb2.xlsx.load(await wb.xlsx.writeBuffer()); return wb2.getWorksheet('t').getCell(1, 1).type; });
    ok(xl === 3, 'Excel 元件可載入，「=」開頭存成文字不是公式');
    ok(!errs.length, `沒有 JS 錯誤 ${errs.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }
  await b.close();
  console.log(fails ? `\n✗ ${fails} 項失敗` : '\n✓ 全部通過');
  process.exit(fails ? 1 : 0);
})();
