// 作業抽查紀錄 自動測試（請用 ./run.sh 執行；需要 Node 18+ 與 Playwright）
const { chromium } = require('playwright');
const fs = require('fs');
const H = __dirname;
const OFF = H + '/OFFLINE';
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function adminLogin(pg, base) {
  await pg.goto(base); await pg.waitForSelector('text=教務組登入');
  await pg.click('text=教務組登入'); await pg.fill('input[type=password]', 'test1234'); await pg.keyboard.press('Enter');
  await pg.waitForSelector('table.grid');
}
const marks = async (base) => { const r = await (await fetch(base + 'exec', { method: 'POST', body: JSON.stringify({ action: 'read', key: 'test1234' }) })).json(); return r.checks; };
const marksGet = async (base) => (await (await fetch(base + 'exec?key=test1234')).json()).checks;

(async () => {
  // 指定 UTF-8 語系：沒有語系的 Linux 下 Chromium 會把中文下載檔名換成 download（學校的 Windows／Mac／手機不會）
  const br = await chromium.launch({ env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  const errors = [];
  const newPage = async (ctx) => { const p = await ctx.newPage(); await p.addInitScript(() => { try { if (!sessionStorage.getItem('fresh')) localStorage.setItem('hc.tools', '1'); } catch (e) { } }); // 舊測試假設「更多工具」是展開的
    p.on('pageerror', e => errors.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); return p; };
  const B = 'http://localhost:8787/';
  try { fs.unlinkSync(OFF); } catch (e) { }

  console.log('1. 教務組登入與登記（密碼不進網址）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  let ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); let pg = await newPage(ctx);
  await adminLogin(pg, B);
  await pg.locator('table.grid button.chk').nth(0).click(); await pg.locator('table.grid button.chk').nth(1).click();
  await sleep(1500);
  let m = await marks(B);
  ok(m.g1 && m.g1.marks['1'] && m.g1.marks['1'].chinese && m.g1.marks['1'].math, '兩格登記已寫入資料表');
  const log = await (await fetch(B + '__log')).json();
  ok(!log.some(x => x.m === 'GET' && /key=|token=/.test(x.url)), '沒有任何 GET 網址帶密碼或 token（共 ' + log.length + ' 次請求）');

  console.log('2. 斷線時登記不遺失，恢復後自動補送');
  fs.writeFileSync(OFF, '1');
  await pg.locator('table.grid button.chk').nth(2).click(); await pg.locator('table.grid button.chk').nth(3).click();
  await sleep(8000); // apiPost 內建重試約 3.6 秒
  const syncTxt = await pg.textContent('#sync');
  ok(/2 筆待送出/.test(syncTxt), '同步列顯示「2 筆待送出」：' + syncTxt.trim());
  const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('hc.outbox') || 'null'));
  ok(saved && saved.list.length === 2, '待送出的 2 筆已存在本機');
  ok(await pg.locator('table.grid button.chk').nth(2).getAttribute('aria-checked') === 'true', '斷線時畫面仍保持已勾選（不會被還原）');
  fs.unlinkSync(OFF);
  await sleep(9000); // 第一次重試約 5 秒後
  m = await marks(B);
  ok(m.g1.marks['1'].english && m.g1.marks['1'].life, '恢復連線後自動補送成功');
  ok(await pg.evaluate(() => localStorage.getItem('hc.outbox')) === null, '補送後本機暫存已清除');
  ok(!/待送出/.test(await pg.textContent('#sync')), '同步列恢復正常');

  console.log('3. 斷線時關掉網頁，下次開啟自動補送');
  fs.writeFileSync(OFF, '1');
  await pg.locator('table.grid button.chk').nth(4).click(); await sleep(6000);
  ok(await pg.evaluate(() => JSON.parse(localStorage.getItem('hc.outbox')).list.length) === 1, '已暫存 1 筆');
  fs.unlinkSync(OFF);
  pg.on('dialog', d => d.accept());
  await pg.reload(); await pg.waitForSelector('table.grid'); await sleep(2500);
  m = await marks(B);
  ok(m.g1.marks['1'].health, '重新開啟後補送成功');
  ok(await pg.evaluate(() => localStorage.getItem('hc.outbox')) === null, '本機暫存已清除');

  console.log('4. 對話框鍵盤操作');
  const opener = pg.locator('button:has-text("未交名單")');
  await opener.click(); await sleep(150);
  for (let i = 0; i < 8; i++) await pg.keyboard.press('Tab');
  ok(await pg.evaluate(() => !!document.activeElement.closest('.modal')), 'Tab 8 次後焦點仍在對話框內');
  ok(await pg.evaluate(() => { const d = document.querySelector('[role=dialog]'); const t = document.getElementById(d.getAttribute('aria-labelledby')); return t && t.textContent.includes('未交名單'); }), '對話框有標題（aria-labelledby）');
  await pg.keyboard.press('Escape'); await sleep(100);
  ok(await pg.evaluate(() => !document.querySelector('.modal') && document.activeElement.textContent.includes('未交名單')), 'Esc 關閉後焦點回到「未交名單」按鈕');

  console.log('5. 分頁方向鍵');
  await pg.focus('nav.tabs button[aria-selected=true]'); await pg.keyboard.press('ArrowRight'); await sleep(200);
  ok(await pg.evaluate(() => document.activeElement.dataset.view === 'report'), '→ 鍵切到「給校長的報表」');
  await pg.keyboard.press('ArrowRight'); await sleep(200);
  ok(await pg.evaluate(() => document.activeElement.dataset.view === 'overview' && !!document.querySelector('table.ov')), '再按 → 切到「全校總覽」');
  ok(await pg.locator('table.ov tfoot td', { hasText: '全校合計' }).count() === 1, '總覽有「全校合計」列');
  await pg.keyboard.press('End'); await sleep(200);
  ok(await pg.evaluate(() => document.activeElement.dataset.view === 'settings'), 'End 鍵切到「設定」');

  console.log('6. 設定檢查：條碼代碼／班序重複會擋下');
  await pg.locator('table.cfgtable input[aria-label=條碼代碼]').nth(1).fill('01');
  await pg.click('text=儲存項目與班級設定'); await sleep(300);
  ok(/條碼代碼都是 01/.test(await pg.textContent('.toast')), '代碼重複被擋下：' + (await pg.textContent('.toast')));
  await pg.click('text=放棄修改'); await sleep(200);
  await pg.locator('details.classfold > summary').nth(1).click();
  await pg.locator('input[aria-label=班序]').nth(1).fill('1');
  await pg.locator('select[aria-label=年級]').nth(1).selectOption('1');
  await pg.click('text=儲存項目與班級設定'); await sleep(300);
  ok(/年級與班序相同/.test(await pg.textContent('.toast')), '班序重複被擋下：' + (await pg.textContent('.toast')));
  await pg.click('text=放棄修改'); await sleep(200);
  await pg.click('text=儲存項目與班級設定'); await sleep(1500);
  ok(/已儲存/.test(await pg.textContent('.toast') || ''), '正常設定仍可儲存');

  console.log('7. CSV 不會被 Excel 當成公式');
  await pg.click('nav.tabs >> text=班級檢核'); await pg.waitForSelector('table.grid');
  await pg.locator('input.noteinput').nth(1).fill('=HYPERLINK("http://x")'); await sleep(1800);
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('button:has-text("本班 CSV")')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  ok(csv.includes(`"'=HYPERLINK(""http://x"")"`), 'CSV 中備註前面加了單引號');
  ok(csv.split('\r\n').length === 7, '「本班 CSV」只匯出本班（6 人＋表頭）');
  ok(/^作業抽查_.+_一甲\.csv$/.test(dl.suggestedFilename()), '下載檔名為中文：' + dl.suggestedFilename());

  console.log('8. 外觀切換與列印');
  await pg.click('footer .themebtn'); await sleep(100); await pg.click('footer .themebtn'); await sleep(100);
  ok(await pg.evaluate(() => document.documentElement.dataset.theme === 'dark' && getComputedStyle(document.body).backgroundColor === 'rgb(17, 23, 34)'), '可切換為深色');
  await pg.emulateMedia({ media: 'print' });
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.tablebox')).backgroundColor) !== 'rgb(25, 33, 49)', '深色模式下列印仍是白底');
  await pg.emulateMedia({ media: 'screen' });
  await pg.click('footer .themebtn'); await sleep(100);
  await ctx.close();
  const ctxD = await br.newContext({ colorScheme: 'dark' }); const pd = await newPage(ctxD); await pd.goto(B); await sleep(500);
  ok(await pd.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(17, 23, 34)'), '系統為深色時自動深色');
  await ctxD.close();

  console.log('9. 導師（手機）');
  ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx);
  await pg.goto(B); await pg.waitForSelector('#whoSel:not([disabled])');
  await pg.selectOption('#whoSel', 'g2'); await pg.click('.gate .btn.primary.block'); await pg.click('text=開始使用'); await pg.waitForSelector('table.grid');
  await pg.locator('table.grid button.chk').nth(0).tap(); await sleep(1500);
  m = await marks(B);
  ok(m.g2 && m.g2.marks['1'] && m.g2.marks['1'].chinese, '導師登記成功（POST 讀取＋token）');
  ok(!(await pg.$('nav.tabs')), '導師看不到教務組分頁');
  ok(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), '手機版沒有水平捲動');
  await ctx.close();

  console.log('10. 密碼猜測防護');
  let last;
  for (let i = 0; i < 20; i++) last = await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'read', key: 'wrong' + i }) })).json();
  ok(last.error === 'auth', '前 20 次回「密碼錯誤」');
  last = await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'read', key: 'test1234' }) })).json();
  ok(last.error === 'too_many', '之後連正確密碼也暫停（too_many）');
  last = await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'marks', key: 'test1234', rid: 'r1', classId: 'g1', changes: [] }) })).json();
  ok(last.error === 'too_many', '暫停期間寫入也被擋');
  ctx = await br.newContext(); pg = await newPage(ctx); await pg.goto(B); await pg.click('text=教務組登入'); await pg.fill('input[type=password]', 'test1234'); await pg.keyboard.press('Enter'); await sleep(800);
  ok(/錯誤次數過多/.test(await pg.textContent('.gate')), '登入頁顯示中文說明');
  await ctx.close();
  await fetch(B + '__reset'); await fetch(B + '__seed');

  console.log('11. 新前端＋舊版後端（尚未重新部署時）仍可用');
  const L = 'http://localhost:8788/';
  await fetch(L + '__reset'); await fetch(L + '__seed');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
  await adminLogin(pg, L);
  await pg.locator('table.grid button.chk').nth(0).click(); await sleep(1500);
  m = await marksGet(L);
  ok(m.g1 && m.g1.marks['1'] && m.g1.marks['1'].chinese, '舊版後端：自動改用 GET 讀取，登記成功');
  await ctx.close();


  console.log('12. 教務組登入憑證（瀏覽器不存密碼）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
  await adminLogin(pg, B);
  let st = await pg.evaluate(() => JSON.parse(localStorage.getItem('hc.admin')));
  ok(st && st.atoken && !st.key, '本機只存登入憑證，沒有密碼');
  ok(!JSON.stringify(await pg.evaluate(() => Object.assign({}, localStorage))).includes('test1234'), '整個 localStorage 都找不到密碼');
  const tok = st.atoken;
  await pg.reload(); await pg.waitForSelector('table.grid');
  ok(true, '重新開啟仍維持登入');
  await pg.locator('table.grid button.chk').nth(0).click(); await sleep(1500);
  ok((await marks(B)).g1.marks['1'].chinese, '用憑證登記成功');
  await pg.click('footer button:has-text("登出")'); await sleep(800);
  let rr = await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'read', atoken: tok }) })).json();
  ok(rr.error === 'auth', '登出後該憑證立即失效');
  // 舊版本記住密碼的裝置：自動換成憑證
  await pg.evaluate(() => localStorage.setItem('hc.admin', JSON.stringify({ key: 'test1234' })));
  await pg.reload(); await pg.waitForSelector('table.grid'); await sleep(1200);
  st = await pg.evaluate(() => JSON.parse(localStorage.getItem('hc.admin')));
  ok(st && st.atoken && !st.key, '舊版存的密碼自動換成憑證並刪除');
  // 改密碼：其他裝置失效、本機繼續可用
  const other = await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'adminLogin', key: 'test1234' }) })).json();
  await pg.click('nav.tabs >> text=設定'); await pg.click('text=修改教務組密碼');
  await pg.fill('input[placeholder^="新密碼"]', 'newpass99'); await pg.fill('input[placeholder="再輸入一次"]', 'newpass99'); await pg.click('text=確定修改'); await sleep(1200);
  rr = await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'read', atoken: other.atoken }) })).json();
  ok(rr.error === 'auth', '改密碼後其他裝置的憑證失效');
  await pg.reload(); await pg.waitForSelector('nav.tabs'); 
  ok(true, '改密碼的這台裝置仍維持登入');
  rr = await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'adminLogin', key: 'newpass99' }) })).json();
  ok(rr.ok && rr.atoken, '新密碼可登入');
  await ctx.close();
  // 舊版後端：退回記住密碼，仍可登入
  await fetch(L + '__reset'); await fetch(L + '__seed');
  ctx = await br.newContext(); pg = await newPage(ctx); await adminLogin(pg, L);
  st = await pg.evaluate(() => JSON.parse(localStorage.getItem('hc.admin')));
  ok(st && st.key === 'test1234', '舊版後端：退回原本方式，照常登入');
  await ctx.close();
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('13. 輪詢快速路徑（資料沒變不讀試算表）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  const P = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
  const cl = await (await fetch(B + 'exec?action=claim&classId=g1&label=t')).json();
  let full = await P({ action: 'read', token: cl.token });
  ok(full.ok && full.classId === 'g1', '導師完整讀取成功');
  let r0 = +(await (await fetch(B + '__reads')).text());
  let u = await P({ action: 'read', token: cl.token, v: full.version });
  let r1 = +(await (await fetch(B + '__reads')).text());
  ok(u.unchanged && r1 === r0, '導師輪詢：回「沒變」且沒有讀試算表');
  const al = await P({ action: 'adminLogin', key: 'test1234' });
  const af = await P({ action: 'read', atoken: al.atoken });
  r0 = +(await (await fetch(B + '__reads')).text());
  u = await P({ action: 'read', atoken: al.atoken, v: af.version });
  r1 = +(await (await fetch(B + '__reads')).text());
  ok(u.unchanged && r1 === r0, '教務組輪詢：回「沒變」且沒有讀試算表');
  u = await P({ action: 'read', token: 'fake-token', v: af.version });
  ok(u.error === 'auth', '假 token 帶正確版本號也拿不到「沒變」，一樣被擋');
  await P({ action: 'revokeDevices', atoken: al.atoken, classId: 'g1' });
  u = await P({ action: 'read', token: cl.token, v: full.version });
  ok(u.error === 'auth', '解除裝置後，該導師下一次輪詢立刻失效');

  console.log('14. 暫停導師新登入');
  await P({ action: 'setClaim', atoken: al.atoken, closed: true });
  let cls = await (await fetch(B + 'exec?action=classes')).json();
  ok(cls.closed === true, '班級清單回報「暫停中」');
  let c2 = await (await fetch(B + 'exec?action=claim&classId=g2&label=t')).json();
  ok(c2.error === 'closed', '暫停時無法綁定新裝置');
  ctx = await br.newContext(); pg = await newPage(ctx); await pg.goto(B); await sleep(800);
  { await pg.waitForSelector('#whoSel option[value="g2"]', { state: 'attached' }); const os = await pg.$$eval('#whoSel option', o => o.map(x => ({ v: x.value, d: x.disabled, t: x.textContent })));
    ok(os.find(o => o.v === 'g2' && o.d && /暫停登入/.test(o.t)) && os.find(o => o.v === 'g1' && !o.d), '登入頁：沒被解除的班級顯示（暫停登入）不能選；剛解除的一甲可選'); }
  await pg.evaluate(() => 0);
  await ctx.close();
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
  await pg.click('nav.tabs >> text=設定'); await sleep(300);
  ok(await pg.isChecked('.claimbox input'), '設定頁勾選狀態正確');
  await pg.click('.claimbox input'); await sleep(1500);
  cls = await (await fetch(B + 'exec?action=classes')).json();
  ok(!cls.closed, '在設定頁取消勾選後恢復開放');
  c2 = await (await fetch(B + 'exec?action=claim&classId=g2&label=t')).json();
  ok(c2.ok, '恢復後可正常登入');
  await ctx.close();
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('15. 異動紀錄與寫入檢查');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  const Q = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
  const tc = await (await fetch(B + 'exec?action=claim&classId=g2&label=iPhone')).json();
  await Q({ action: 'marks', token: tc.token, rid: 'r1', classId: 'g2', changes: [{ no: 3, itemId: 'math', val: true }, { no: 3, itemId: 'exam_math', val: true }] });
  const ad = await Q({ action: 'adminLogin', key: 'test1234', label: 'Mac 電腦' });
  await Q({ action: 'marks', atoken: ad.atoken, rid: 'r1', classId: 'g2', changes: [{ no: 3, itemId: 'math', val: false }, { no: 3, itemId: 'exam_math', val: true }] });
  let rows = await (await fetch(B + '__sheet?name=' + encodeURIComponent('異動紀錄'))).json();
  const txt = JSON.stringify(rows);
  ok(rows && rows[0][2] === '動作', '試算表自動建立「異動紀錄」分頁');
  ok(txt.includes('"導師（二甲）","已交","115') && txt.includes('"陳大同","數學習作"'), '記錄導師登記（誰、哪班、座號姓名、項目）');
  ok(txt.includes('"導師（二甲）","已繳回"'), '考卷記為「已繳回」');
  ok(txt.includes('"教務組","取消"'), '記錄教務組取消');
  ok(rows.filter(r => r[2] === '已繳回').length === 1, '重複設成一樣的狀態不會多記一筆');
  ok(txt.includes('"導師（二甲）","綁定登入裝置"') && txt.includes('"教務組","登入"'), '記錄導師綁定與教務組登入');
  // 不合法的寫入
  await Q({ action: 'marks', atoken: ad.atoken, rid: 'r1', classId: 'g1', changes: [{ no: 1, itemId: 'social', val: true }, { no: 99, itemId: 'math', val: true }, { no: 2, itemId: 'math', val: true }] });
  const ck = (await Q({ action: 'read', atoken: ad.atoken })).checks.g1.marks;
  ok(!(ck['1'] && ck['1'].social), '一年級沒有社會習作：拒絕寫入');
  ok(!ck['99'], '名單上沒有的座號：拒絕寫入');
  ok(ck['2'] && ck['2'].math, '同一批中合法的仍正常寫入');
  await Q({ action: 'note', atoken: ad.atoken, rid: 'r1', classId: 'g2', no: 3, text: '未訂正' });
  rows = await (await fetch(B + '__sheet?name=' + encodeURIComponent('異動紀錄'))).json();
  ok(JSON.stringify(rows).includes('"學生備註","115'), '備註也記錄');
  ok(!JSON.stringify(rows).includes('test1234'), '紀錄中沒有密碼');
  await fetch(B + '__breaklog');
  const okSave = await Q({ action: 'marks', atoken: ad.atoken, rid: 'r1', classId: 'g1', changes: [{ no: 4, itemId: 'math', val: true }] });
  ok(okSave.ok && (await Q({ action: 'read', atoken: ad.atoken })).checks.g1.marks['4'].math, '紀錄寫入失敗時，登記仍成功儲存');
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('16. 備註斷線不遺失');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
  await adminLogin(pg, B);
  fs.writeFileSync(OFF, '1');
  await pg.locator('input.noteinput').nth(2).fill('家長未簽名'); await sleep(9000);
  ok(/1 筆待送出/.test(await pg.textContent('#sync')), '斷線時顯示備註待送出');
  ok(await pg.inputValue('input.noteinput >> nth=2') === '家長未簽名', '輸入框內容保留');
  fs.unlinkSync(OFF);
  await sleep(12000);
  let nt = (await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'read', key: 'test1234' }) })).json()).checks.g1.notes;
  ok(nt && nt['2'] === '家長未簽名', '恢復連線後備註自動補送成功');
  ok(!/待送出/.test(await pg.textContent('#sync')), '同步列恢復正常');
  await ctx.close();

  console.log('17. 字型伺服器卡住也不擋畫面');
  ctx = await br.newContext(); pg = await ctx.newPage(); pg.on('pageerror', e => errors.push(e.message));
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, () => { /* 永遠不回應 */ });
  const t0 = Date.now(); await pg.goto(B, { waitUntil: 'commit' }); await pg.waitForSelector('text=教務組登入', { timeout: 15000 });
  const dt = Date.now() - t0;
  ok(dt < 3000, '登入頁 ' + dt + ' ms 就出現（字型請求卡住中）');
  await ctx.close();


  console.log('18. 掃描登記（模擬條碼掃描器輸入）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
  await adminLogin(pg, B);
  await pg.click('button:has-text("掃描標籤")'); await pg.waitForSelector('#scanInput');
  const scan = async code => { await pg.fill('#scanInput', code); await pg.press('#scanInput', 'Enter'); await sleep(250); return (await pg.textContent('.scanstatus .big')).trim(); };
  ok(await scan('1010102') === '已登記', '1010102（一甲 1 號數學習作）→ 已登記');
  ok(await scan('1010102') === '已經登記過', '同一本再掃 → 已經登記過（不會取消）');
  ok(await scan('1010312') === '已登記', '1010312（一甲 3 號數學考卷）→ 已登記');
  ok(/本班沒有 9 號/.test(await scan('1010902')), '座號不存在 → 提示');
  ok(/看不懂/.test(await scan('abc')), '亂碼 → 看不懂這個條碼');
  await sleep(1500);
  let mk = (await (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify({ action: 'read', key: 'test1234' }) })).json()).checks.g1.marks;
  ok(mk['1'].math && mk['3'].exam_math, '掃描結果已寫入資料表');
  // 教務組掃到別班 → 自動切換到該班
  ok(await scan('2010202') === '已登記' && /二甲/.test(await pg.textContent('.scanmode h3')), '教務組掃到二甲的標籤 → 自動切到二甲並登記');
  ok(/二甲沒有「社會習作」/.test(await scan('2010205')), '二年級沒有社會習作 → 說明「二甲沒有社會習作」');
  await ctx.close();
  const tok2 = await (await fetch(B + 'exec?action=claim&classId=g1&label=t')).json();
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
  await pg.goto(B); await pg.evaluate(t => localStorage.setItem('hc.teacher', JSON.stringify({ token: t.token, classId: 'g1' })), tok2);
  await pg.reload(); await pg.waitForSelector('table.grid'); await pg.click('button:has-text("掃描標籤")'); await pg.waitForSelector('#scanInput');
  ok(/不是本班/.test(await scan('2010202')), '導師掃到別班 → 擋下「這不是本班的習作」');
  await ctx.close();


  console.log('19. 只更新一格的結果與整張重畫完全一致');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  const snap = () => pg.evaluate(() => { const t = document.querySelector('table.grid'); return JSON.stringify({ txt: t.innerText, on: Array.from(t.querySelectorAll('button.chk')).map(b => b.getAttribute('aria-checked') + b.getAttribute('aria-label')), allin: Array.from(t.querySelectorAll('tr.allin')).length, ring: document.querySelector('.classhead .ring').innerText }); });
  for (const who of ['admin', 'teacher']) {
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
    if (who === 'admin') await adminLogin(pg, B);
    else { const tk = await (await fetch(B + 'exec?action=claim&classId=g2&label=t')).json(); await pg.goto(B); await pg.evaluate(t => localStorage.setItem('hc.teacher', JSON.stringify({ token: t.token, classId: 'g2' })), tk); await pg.reload(); await pg.waitForSelector('table.grid'); }
    const nb = await pg.locator('table.grid button.chk').count();
    // 把第 1 位學生全部勾滿（觸發「齊」）、再勾幾格、取消一格
    const perRow = nb / 6;
    for (let i = 0; i < perRow; i++) await pg.locator('table.grid button.chk').nth(i).click();
    for (const i of [perRow + 1, perRow * 3 + 2, perRow * 3 + 2, perRow * 5]) await pg.locator('table.grid button.chk').nth(i).click();
    const patched = await snap();
    await pg.evaluate(() => { document.querySelector('#sync .link').click(); }); // 重新整理 → 整張重畫
    await sleep(2500);
    const full = await snap();
    ok(patched === full, (who === 'admin' ? '教務組' : '導師') + '：逐格更新與整張重畫結果相同');
    ok(/齊/.test(await pg.locator('table.grid tbody tr').first().innerText()) || (await pg.locator('tr.allin').count()) === 1, (who === 'admin' ? '教務組' : '導師') + '：勾滿一列即顯示「齊」');
    await ctx.close();
  }


  console.log('20. 收件模式：關閉後背後表格正確');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
  await adminLogin(pg, B);
  await pg.locator('thead button:has-text("收件")').nth(1).click(); await pg.waitForSelector('.tiles');
  await pg.locator('.tiles .tile').nth(0).click(); await pg.locator('.tiles .tile').nth(2).click(); await pg.locator('.tiles .tile').nth(4).click(); await pg.locator('.tiles .tile').nth(4).click();
  ok((await pg.textContent('.modal .counter')).includes('2'), '對話框計數即時更新（2 人）');
  await pg.click('.modal button:has-text("完成")'); await sleep(300);
  const p1 = await snap();
  ok(/2\/6/.test(await pg.locator('thead .cnt[data-item="math"]').innerText()), '關閉後表頭人數為 2/6');
  await sleep(1500); await pg.evaluate(() => document.querySelector('#sync .link').click()); await sleep(2500);
  ok(p1 === await snap(), '與重新整理後的整張表一致');
  await ctx.close();


  console.log('21. 寫入試算表總表（留檔）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const a = await R({ action: 'adminLogin', key: 'test1234' });
    await R({ action: 'marks', atoken: a.atoken, rid: 'r1', classId: 'g1', changes: [{ no: 1, itemId: 'chinese', val: true }, { no: 1, itemId: 'exam_math', val: true }] });
    await R({ action: 'note', atoken: a.atoken, rid: 'r1', classId: 'g1', no: 1, text: '補交' });
    await R({ action: 'note', atoken: a.atoken, rid: 'r1', classId: 'g1', text: '全班延後' });
    const sn = await R({ action: 'snapshot', atoken: a.atoken, rid: 'r1' });
    ok(sn.ok, 'snapshot 成功');
    const rd = await R({ action: 'read', atoken: a.atoken });
    const name = ('總表 ' + rd.rounds[0].name);
    const rows = await (await fetch(B + '__sheet?name=' + encodeURIComponent(name))).json();
    const flat = JSON.stringify(rows);
    ok(rows && rows[1][0] === '班級' && rows[1].includes('國語習作') && rows[1].includes('數學考卷'), '總表表頭含習作與考卷');
    const r1 = rows.find(r => r[0] === '一甲' && r[2] === 1);
    ok(r1 && r1.includes('✓') && r1[r1.length - 1] === '補交', '一甲 1 號：已交打 ✓、備註「補交」');
    ok(flat.includes('全班延後') && flat.includes('各班統計'), '各班統計含班級備註');
  }


  console.log('22. 總覽：導師登入狀態');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  await fetch(B + 'exec?action=claim&classId=g1&label=t');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
  await adminLogin(pg, B); await pg.click('nav.tabs >> text=全校總覽'); await sleep(400);
  ok(/導師已登入\s*1 \/ 3 班/.test(await pg.textContent('.stats')), '統計顯示「導師已登入 1 / 3 班」');
  const bn = await pg.textContent('.banner.warn');
  ok(/二甲（測試2）/.test(bn) && /三甲（測試3）/.test(bn) && !/一甲/.test(bn), '提醒列出尚未登入的二甲、三甲（含導師姓名）');
  await ctx.close();
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('23. 教務組讓導師重新登入');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const G = async q => (await fetch(B + 'exec?' + q)).json();
    const a = await R({ action: 'adminLogin', key: 'test1234' });
    const t1 = await G('action=claim&classId=g1&label=old'); const t2 = await G('action=claim&classId=g2&label=old');
    await R({ action: 'marks', token: t1.token, rid: 'r1', classId: 'g1', changes: [{ no: 1, itemId: 'math', val: true }] });
    await R({ action: 'setClaim', atoken: a.atoken, closed: true });
    // 單班解除：暫停中也能重新登入
    await R({ action: 'revokeDevices', atoken: a.atoken, classId: 'g1' });
    let cl = await G('action=classes');
    ok(cl.closed && cl.classes.find(c => c.id === 'g1').reopen, '一甲解除後標示可重新登入（仍在暫停中）');
    ok((await G('action=claim&classId=g3&label=x')).error === 'closed', '暫停中：沒被解除的三甲仍不能登入');
    ctx = await br.newContext(); pg = await newPage(ctx); await pg.goto(B); await pg.waitForSelector('#whoSel:not([disabled])');
    const opts = await pg.$$eval('#whoSel option', os => os.map(o => ({ v: o.value, d: o.disabled, t: o.textContent })));
    ok(opts.find(o => o.v === 'g1' && !o.d) && opts.find(o => o.v === 'g3' && o.d && /暫停登入/.test(o.t)), '登入頁：一甲可選、三甲顯示（暫停登入）');
    await pg.selectOption('#whoSel', 'g1'); await pg.click('.gate .btn.primary.block'); await pg.waitForSelector('text=開始使用');
    ok(true, '一甲導師用新裝置重新登入成功');
    await ctx.close();
    ok((await R({ action: 'read', token: t1.token })).error === 'auth', '一甲舊裝置已失效');
    cl = await G('action=classes');
    ok(!cl.classes.find(c => c.id === 'g1').reopen, '重新登入後不再保留「可重新登入」');
    // 全部解除
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    await pg.click('nav.tabs >> text=設定'); await sleep(300);
    const rb = pg.locator('button:has-text("全部班級解除")'); await rb.click(); await sleep(150); await pg.locator('.resetall button').click(); await sleep(1800);
    cl = await G('action=classes');
    ok(cl.classes.every(c => !c.claimed) && !cl.closed, '全部解除：所有班級都未登入、自動取消暫停');
    ok((await R({ action: 'read', token: t2.token })).error === 'auth', '原本登入的二甲裝置已失效');
    ok((await G('action=claim&classId=g3&label=n')).ok, '導師可以重新選班級登入');
    const mk = (await R({ action: 'read', atoken: a.atoken })).checks.g1.marks;
    ok(mk['1'] && mk['1'].math, '登記紀錄不受影響');
    const lg = JSON.stringify(await (await fetch(B + '__sheet?name=' + encodeURIComponent('異動紀錄'))).json());
    ok(lg.includes('全部班級解除登入'), '異動紀錄有記錄「全部班級解除」');
    await ctx.close();
  }
  // 舊版後端：全部解除改為逐班解除
  await fetch(L + '__reset'); await fetch(L + '__seed');
  await fetch(L + 'exec?action=claim&classId=g1&label=o'); await fetch(L + 'exec?action=claim&classId=g2&label=o');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, L);
  await pg.click('nav.tabs >> text=設定'); await sleep(300);
  await pg.locator('.resetall button').click(); await sleep(150); await pg.locator('.resetall button').click(); await sleep(2500);
  const lc = await (await fetch(L + 'exec?action=classes')).json();
  ok(lc.classes.every(c => !c.claimed), '舊版後端：全部解除仍有效（逐班解除）');
  await ctx.close();
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('24. Google 卡住不回應時不會一直「登入中…」');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  await fetch(B + '__hang');
  ctx = await br.newContext(); pg = await newPage(ctx);
  let t24 = Date.now(); await pg.goto(B);
  await pg.waitForSelector('button:has-text("重新載入班級"):visible', { timeout: 30000 });
  let d24 = Date.now() - t24;
  ok(d24 < 20000, Math.round(d24 / 1000) + ' 秒後出現「重新載入班級」（測試用逾時 5 秒 × 3 次），不會卡住');
  ok(/目前無法載入班級/.test(await pg.textContent('#whoSel')), '下拉顯示「目前無法載入班級」');
  await pg.click('text=教務組登入'); await pg.fill('input[type=password]', 'test1234'); t24 = Date.now(); await pg.keyboard.press('Enter');
  await pg.waitForSelector('.gate .note.err', { timeout: 30000 }); d24 = Date.now() - t24;
  const em = await pg.textContent('.gate .note.err');
  ok(/沒有回應/.test(em) && d24 < 20000, Math.round(d24 / 1000) + ' 秒後教務組登入顯示逾時訊息：' + em.slice(0, 30) + '…');
  await fetch(B + '__unhang');
  await pg.click('text=重新載入班級'); await pg.waitForSelector('#whoSel:not([disabled])', { timeout: 15000 });
  ok((await pg.$$eval('#whoSel option', o => o.length)) > 3, '恢復後按「重新載入班級」即載入成功，不必重新整理');
  await pg.fill('input[type=password]', 'test1234'); await pg.keyboard.press('Enter'); await pg.waitForSelector('nav.tabs', { timeout: 15000 });
  ok(true, '接著教務組登入成功');
  await ctx.close();


  console.log('25. 這一次、這一班不用繳某項目');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    await pg.locator('table.grid button.chk[data-no="1"][data-item="math"]').click(); await sleep(1500);
    const thBefore = await pg.locator('table.grid thead tr:nth-child(2) th').count();
    await pg.locator('button.skipbtn[aria-label="數學習作：本次不用繳"]').click(); await sleep(1500);
    ok((await pg.locator('table.grid thead tr:nth-child(2) th').count()) === thBefore - 1 && (await pg.locator('table.grid button.chk[data-item="math"]').count()) === 0, '按「不用繳」後數學習作欄消失');
    ok(/本次不用繳：.*數學習作/.test(await pg.textContent('.skipline')) && (await pg.locator('.skipline button:has-text("恢復")').count()) === 1, '顯示「本次不用繳：數學習作」與「恢復」');
    const rd = await R({ action: 'read', key: 'test1234' });
    ok(rd.checks.g1.skip && rd.checks.g1.skip.math === true && rd.checks.g1.marks['1'] && rd.checks.g1.marks['1'].math, '後端記錄 skip，原本 1 號的登記保留');
    ok((await pg.textContent('.classhead .ring')).trim() === '0%', '完成率不再把數學算進去（0%）');
    const t1 = await (await fetch(B + 'exec?action=claim&classId=g1&label=t')).json();
    await R({ action: 'marks', token: t1.token, rid: 'r1', classId: 'g1', changes: [{ no: 2, itemId: 'math', val: true }, { no: 2, itemId: 'chinese', val: true }] });
    const rd2 = await R({ action: 'read', key: 'test1234' });
    ok(!(rd2.checks.g1.marks['2'] && rd2.checks.g1.marks['2'].math) && rd2.checks.g1.marks['2'].chinese, '後端拒絕登記不用繳的項目，其他項目照常');
    await pg.click('nav.tabs >> text=全校總覽'); await sleep(400);
    ok(/不用繳/.test(await pg.locator('table.ov tbody tr').first().innerText()), '總覽一甲列顯示「不用繳」');
    await pg.click('nav.tabs >> text=報表'); await sleep(400);
    ok(/不用繳/.test(await pg.locator('.report .rtable tbody tr').first().innerText()) && /本次不用繳：數學習作/.test(await pg.textContent('.report')), '報表摘要顯示「不用繳」、各班明細標題列出');
    await pg.click('nav.tabs >> text=班級檢核'); await pg.waitForSelector('table.grid');
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('button:has-text("本班 CSV")')]);
    const csv = fs.readFileSync(await dl.path(), 'utf8');
    ok(csv.split('\r\n')[1].includes('本次不用繳'), 'CSV 該欄寫「本次不用繳」');
    await pg.click('button:has-text("掃描標籤")'); await pg.waitForSelector('#scanInput');
    await pg.fill('#scanInput', '1010202'); await pg.press('#scanInput', 'Enter'); await sleep(250);
    ok(/不用繳/.test(await pg.textContent('.scanstatus .big')), '掃描不用繳的習作 → 提示「這次不用繳」');
    await pg.click('.scanmode button:has-text("結束")'); await sleep(300);
    const tctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); const tp = await newPage(tctx);
    await tp.goto(B); await tp.evaluate(t => localStorage.setItem('hc.teacher', JSON.stringify({ token: t.token, classId: 'g1' })), t1); await tp.reload(); await tp.waitForSelector('table.grid');
    ok((await tp.locator('table.grid button.chk[data-item="math"]').count()) === 0 && /本次不用繳：數學習作/.test(await tp.textContent('.skipline')) && (await tp.locator('.skipline button').count()) === 0, '導師看不到數學欄、看到「本次不用繳」、沒有恢復鈕');
    await tctx.close();
    await pg.click('.skipline button:has-text("恢復")'); await sleep(1500);
    ok((await pg.locator('table.grid button.chk[data-item="math"]').count()) === 6 && await pg.locator('table.grid button.chk[data-no="1"][data-item="math"]').getAttribute('aria-checked') === 'true', '恢復後欄位回來，1 號原本的登記還在');
    const lg = JSON.stringify(await (await fetch(B + '__sheet?name=' + encodeURIComponent('異動紀錄'))).json());
    ok(lg.includes('"本次不用繳"') && lg.includes('"恢復要繳"'), '異動紀錄有「本次不用繳」「恢復要繳」');
    await pg.locator('button.skipbtn[aria-label="數學習作：本次不用繳"]').click(); await sleep(1200);
    await R({ action: 'snapshot', key: 'test1234', rid: 'r1' });
    const rdx = await R({ action: 'read', key: 'test1234' });
    const sheet = await (await fetch(B + '__sheet?name=' + encodeURIComponent('總表 ' + rdx.rounds[0].name))).json();
    const row1 = sheet.find(r => r[0] === '一甲' && r[2] === 1);
    ok(row1 && row1.includes('不用繳'), '試算表總表該欄寫「不用繳」');
    await ctx.close();
  }
  await fetch(L + '__reset'); await fetch(L + '__seed');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, L);
  await pg.locator('button.skipbtn[aria-label="數學習作：本次不用繳"]').click(); await sleep(1500);
  ok(/更新後端/.test(await pg.textContent('.toast')) && (await pg.locator('table.grid button.chk[data-item="math"]').count()) === 6, '舊版後端：提示需更新後端，欄位不變');
  await ctx.close();
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('26. 班級檢核：搜尋座號／姓名、只看未繳齊');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const rd0 = await R({ action: 'read', key: 'test1234' });
    const g1 = rd0.config.classes.find(c => c.id === 'g1'); const its = rd0.config.items.filter(it => (it.grades || []).includes(1)).map(it => it.id);
    await R({ action: 'marks', key: 'test1234', rid: 'r1', classId: 'g1', changes: its.map(id => ({ no: 1, itemId: id, val: true })) }); // 1 號全部繳齊
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    const vis = () => pg.$$eval('table.grid tbody tr[data-no]', trs => trs.filter(t => !t.hidden).map(t => t.dataset.no).join(','));
    await pg.fill('.searchbox', '3'); await sleep(100);
    ok(await vis() === '3' && /符合 1 \/ 6 人/.test(await pg.textContent('.fcount')), '輸入「3」只顯示 3 號（座號完全相符）、顯示「符合 1 / 6 人」');
    await pg.fill('.searchbox', '李'); await sleep(100);
    ok(await vis() === '2', '輸入「李」只顯示李小華');
    await pg.fill('.searchbox', 'zzz'); await sleep(100);
    ok(await vis() === '' && await pg.isVisible('tr.nomatch'), '找不到時顯示「沒有符合的學生」');
    await pg.press('.searchbox', 'Escape'); await sleep(100);
    ok(await vis() === '1,2,3,4,5,6' && await pg.inputValue('.searchbox') === '', 'Esc 清除搜尋，全部顯示');
    await pg.click('.filterchip'); await sleep(100);
    ok(await vis() === '2,3,4,5,6' && await pg.getAttribute('.filterchip', 'aria-pressed') === 'true', '「只看未繳齊」隱藏已繳齊的 1 號');
    ok((await pg.textContent('thead .cnt[data-item="chinese"]')).trim() === '1/6', '篩選不影響表頭人數（仍是全班 1/6）');
    await pg.locator('table.grid button.chk[data-no="2"][data-item="chinese"]').click(); await sleep(200);
    ok((await vis()).startsWith('2'), '篩選中勾選，列不會突然消失');
    await pg.emulateMedia({ media: 'print' });
    ok(await pg.$$eval('table.grid tbody tr[data-no]', trs => trs.every(t => getComputedStyle(t).display !== 'none')), '列印時仍印出全班');
    await pg.emulateMedia({ media: 'screen' });
    await pg.locator('.chip:has-text("二甲")').click(); await sleep(300);
    ok(await pg.getAttribute('.filterchip', 'aria-pressed') === 'true' && await pg.inputValue('.searchbox') === '', '切換班級：搜尋字清空、「只看未繳齊」保留');
    await ctx.close();
    const tk = await (await fetch(B + 'exec?action=claim&classId=g1&label=t')).json();
    ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx);
    await pg.goto(B); await pg.evaluate(t => localStorage.setItem('hc.teacher', JSON.stringify({ token: t.token, classId: 'g1' })), tk); await pg.reload(); await pg.waitForSelector('table.grid');
    await pg.fill('.searchbox', '5'); await sleep(100);
    ok(await pg.$$eval('table.grid tbody tr[data-no]', trs => trs.filter(t => !t.hidden).length) === 1 && await pg.evaluate(() => document.documentElement.scrollWidth <= 390), '導師手機版也能搜尋，畫面不會左右捲動');
    await ctx.close();
  }
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('27. 專業 Excel 報表（.xlsx）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    // 解開本網站產生的 xlsx（未壓縮的 zip）
    const unzip = buf => { const out = {}; let i = 0; while (i + 30 < buf.length && buf.readUInt32LE(i) === 0x04034b50) { const sz = buf.readUInt32LE(i + 18), nl = buf.readUInt16LE(i + 26), el = buf.readUInt16LE(i + 28); const name = buf.slice(i + 30, i + 30 + nl).toString('utf8'); out[name] = buf.slice(i + 30 + nl + el, i + 30 + nl + el + sz).toString('utf8'); i += 30 + nl + el + sz; } return out; };
    await R({ action: 'marks', key: 'test1234', rid: 'r1', classId: 'g1', changes: [{ no: 1, itemId: 'chinese', val: true }, { no: 1, itemId: 'exam_math', val: true }] });
    await R({ action: 'skipItem', key: 'test1234', rid: 'r1', classId: 'g2', itemId: 'math', skip: true });
    await R({ action: 'note', key: 'test1234', rid: 'r1', classId: 'g1', no: 2, text: '=HYPERLINK("x")' });
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    await pg.click('nav.tabs >> text=報表'); await sleep(400);
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('button:has-text("下載 Excel 報表")')]);
    ok(/^作業抽查報表_.+_\d{7}\.xlsx$/.test(dl.suggestedFilename()), '檔名：' + dl.suggestedFilename());
    const xpath = await dl.path(); const z = unzip(fs.readFileSync(xpath));
    ok(z['xl/styles.xml'] && z['xl/workbook.xml'] && z['[Content_Types].xml'].includes('styles+xml'), '含樣式表（styles.xml）與正確的內容類型');
    const names = [...z['xl/workbook.xml'].matchAll(/<sheet name="([^"]+)"/g)].map(m => m[1]);
    ok(names.join(',') === '全校摘要,未繳交與原因,一甲,二甲,三甲', '工作表：' + names.join('、'));
    const s1 = z['xl/worksheets/sheet1.xml'], s2 = z['xl/worksheets/sheet2.xml'], s3 = z['xl/worksheets/sheet3.xml'], s4 = z['xl/worksheets/sheet4.xml'];
    ok(s1.includes('全校完成率') && s1.includes('orientation="landscape"') && s1.includes('state="frozen"') && s1.includes('<mergeCell '), '全校摘要：KPI、橫向、凍結窗格、合併儲存格');
    ok(z['xl/workbook.xml'].includes('_xlnm.Print_Titles'), '列印時每頁重複表頭');
    ok(s4.includes('>不用繳<') || s1.includes('>不用繳<'), '「不用繳」寫入 Excel');
    ok(s3.includes('>✓<') && s3.includes('>✗<') && s3.includes('state="frozen"'), '各班明細：✓／✗、凍結座號與姓名欄');
    ok(s2.includes('=HYPERLINK') && !/<f>/.test(s2) && s2.includes('t="inlineStr"'), '以「=」開頭的備註存成文字，不會變成公式');
    ok(!/製表員|承辦人|會計主任|核章/.test(Object.values(z).join('')), '沒有核章欄（依主計室規定）');
    try {
      const xcopy = require('path').join(require('os').tmpdir(), 'hc-test-' + Date.now() + '.xlsx'); fs.copyFileSync(xpath, xcopy);
      const py = require('child_process').spawnSync('python3', ['-c', 'import sys,openpyxl; wb=openpyxl.load_workbook(sys.argv[1]); print(len(wb.sheetnames), wb["全校摘要"].freeze_panes, wb["全校摘要"]["A1"].font.b)', xcopy], { encoding: 'utf8' });
      fs.unlinkSync(xcopy);
      if (py.status === 0) ok(/^5 [A-Z]+\d+ True/.test(py.stdout.trim()), 'openpyxl 可正常開啟（' + py.stdout.trim() + '）');
      else console.log('  （略過 openpyxl 檢查：' + (py.stderr || '').split('\n').filter(Boolean).pop() + '）');
    } catch (e) { console.log('  （略過 openpyxl 檢查）'); }
    await pg.click('nav.tabs >> text=全校總覽'); await sleep(300);
    const [dl2] = await Promise.all([pg.waitForEvent('download'), pg.click('button:has-text("Excel 報表")')]);
    ok(/\.xlsx$/.test(dl2.suggestedFilename()), '全校總覽也能下載 Excel 報表');
    await ctx.close();
  }
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('28. 家長通知單');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const rd = await R({ action: 'read', key: 'test1234' });
    const its1 = rd.config.items.filter(it => (it.grades || []).includes(1)).map(it => it.id);
    await R({ action: 'marks', key: 'test1234', rid: 'r1', classId: 'g1', changes: its1.map(id => ({ no: 1, itemId: id, val: true })).concat(its1.filter(id => id !== 'math').map(id => ({ no: 2, itemId: id, val: true }))) }); // 1 號繳齊；2 號只缺數學習作
    await R({ action: 'skipItem', key: 'test1234', rid: 'r1', classId: 'g1', itemId: 'health', skip: true });
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    await pg.click('button:has-text("家長通知單")'); await pg.waitForSelector('.nprev .nslip');
    ok(/共 5 張/.test(await pg.textContent('.noticemode')), '一甲：繳齊的 1 號不印，共 5 張');
    const slips = await pg.$$eval('#noticeSheet .nslip', a => a.map(x => x.innerText));
    ok(slips.length === 5 && /2 號/.test(slips[0]) && /數學習作/.test(slips[0]) && !/國語習作/.test(slips[0]), '2 號那張只列「數學習作」');
    ok(!slips.join('').includes('健康習作'), '本次不用繳的健康習作不會出現在通知單');
    ok(slips.every(t => /家長簽名/.test(t) && /導師/.test(t)) && !/核章|承辦|會計|校長/.test(slips.join('')), '有導師與家長簽名欄、沒有核章欄');
    await pg.fill('.noticemode textarea', '請於{截止}交回。{次別}'); await sleep(150);
    ok(/請於盡快交回。115學年度/.test(await pg.textContent('.nprev .nmsg')), '可修改給家長的話（{截止}{次別} 自動替換）');
    await pg.click('.noticemode button:has-text("恢復預設文字")'); await sleep(100);
    ok(/貴子弟以下項目尚未繳交/.test(await pg.textContent('.nprev .nmsg')), '可恢復預設文字');
    await pg.click('.noticemode label:has-text("全校")'); await sleep(200);
    ok(/共 17 張/.test(await pg.textContent('.noticemode')), '範圍選「全校」：5＋6＋6＝17 張');
    await pg.click('.noticemode label:has-text("4 張")'); await sleep(200);
    ok(/約 5 頁/.test(await pg.textContent('.noticemode')) && await pg.getAttribute('#noticeSheet', 'class') === 'per4', '每頁 4 張：約 5 頁');
    await pg.emulateMedia({ media: 'print' });
    const pr = await pg.evaluate(() => ({ app: getComputedStyle(document.getElementById('app')).display, sheet: getComputedStyle(document.getElementById('noticeSheet')).display, modal: getComputedStyle(document.querySelector('.modal')).display, brk: getComputedStyle(document.querySelectorAll('#noticeSheet .nslip')[3]).breakAfter }));
    ok(pr.app === 'none' && pr.modal === 'none' && pr.sheet === 'block' && pr.brk === 'page', '列印時只印通知單，每 4 張換頁');
    await pg.emulateMedia({ media: 'screen' });
    await pg.click('.noticemode button:has-text("關閉")'); await sleep(150);
    ok(!(await pg.$('#noticeSheet')) && !(await pg.evaluate(() => document.body.classList.contains('notices-print'))), '關閉後移除列印內容，不影響一般列印');
    await ctx.close();
    const tk = await (await fetch(B + 'exec?action=claim&classId=g2&label=t')).json();
    ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx);
    await pg.goto(B); await pg.evaluate(t => localStorage.setItem('hc.teacher', JSON.stringify({ token: t.token, classId: 'g2' })), tk); await pg.reload(); await pg.waitForSelector('table.grid');
    await pg.click('button:has-text("家長通知單")'); await pg.waitForSelector('.nprev .nslip');
    const ts = await pg.$$eval('#noticeSheet .nslip', a => a.map(x => x.innerText));
    ok(ts.length === 6 && ts.every(t => /二甲/.test(t)) && !(await pg.$('.noticemode input[name="nscope"]')), '導師只能印自己班（6 張、沒有「全校」選項）');
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), '手機版對話框不會左右捲動');
    await ctx.close();
  }
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('29. 歷次抽查完成率與下載備份');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const rd = await R({ action: 'read', key: 'test1234' }); const ids = rd.config.items.map(i => i.id);
    await R({ action: 'marks', key: 'test1234', rid: 'r1', classId: 'g1', changes: [{ no: 1, itemId: 'chinese', val: true }] });
    await R({ action: 'addRound', key: 'test1234', round: { id: 'r2', name: '115學年度第1學期 第2次作業抽查', due: '', itemIds: ids, locked: false, createdAt: '2099-01-01T00:00:00Z' } });
    await R({ action: 'marks', key: 'test1234', rid: 'r2', classId: 'g1', changes: rd.config.items.filter(it => it.grades.includes(1)).map(it => ({ no: 1, itemId: it.id, val: true })) });
    await R({ action: 'note', key: 'test1234', rid: 'r1', classId: 'g1', no: 3, text: '第一次的備註' });
    const hr = await R({ action: 'read', key: 'test1234', allRounds: 1 });
    ok(hr.history && hr.history.r1 && hr.history.r2 && hr.history.r1.g1.notes['3'] === '第一次的備註', '後端 allRounds 一次回傳各次別（含備註）');
    const tk = await (await fetch(B + 'exec?action=claim&classId=g1&label=t')).json();
    ok(!(await R({ action: 'read', token: tk.token, allRounds: 1 })).history, '導師拿不到歷次資料');
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    await pg.click('nav.tabs >> text=報表'); await pg.waitForSelector('.hxfig', { timeout: 15000 });
    ok((await pg.$$('.hxchart .hxdot')).length === 2 && /第1次[\s\S]*第2次/.test(await pg.textContent('.hxtable thead')), '趨勢圖 2 個點、表頭依建立時間排序（第1次、第2次）');
    const row1 = (await pg.locator('.hxtable tbody tr').first().innerText()).replace(/\s+/g, ' ');
    ok(/^一甲 2% 17% ▲ 15/.test(row1), '一甲歷次完成率與變化：' + row1);
    ok(/全校完成率趨勢/.test(await pg.getAttribute('.hxchart', 'aria-label')), '圖表有文字說明（螢幕報讀可讀）');
    await pg.click('nav.tabs >> text=設定'); await sleep(300);
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('button:has-text("下載備份")')]);
    const bk = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    ok(/^作業抽查備份_\d{7}\.json$/.test(dl.suggestedFilename()) && bk.complete === true && bk.checks.r1 && bk.checks.r2 && bk.checks.r1.g1.notes['3'] === '第一次的備註' && bk.config.classes.length === 3 && bk.rounds.length === 2, '備份含所有次別、備註、名單與設定');
    ok(!JSON.stringify(bk).includes('test1234') && !JSON.stringify(bk).includes(tk.token), '備份不含密碼與登入憑證');
    await ctx.close();
  }
  await fetch(L + '__reset'); await fetch(L + '__seed');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, L);
  await pg.click('nav.tabs >> text=報表'); await pg.waitForSelector('.hxtable', { timeout: 15000 });
  ok(/後端程式更新/.test(await pg.textContent('.hxsec')), '舊版後端：歷次只顯示本次並說明');
  await pg.click('nav.tabs >> text=設定'); await sleep(300);
  const [dl2] = await Promise.all([pg.waitForEvent('download'), pg.click('button:has-text("下載備份")')]);
  const bk2 = JSON.parse(fs.readFileSync(await dl2.path(), 'utf8'));
  ok(bk2.complete === false && bk2.checks.r1, '舊版後端：備份仍可下載（只含本次）');
  await ctx.close();
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('30. 邊界情況');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const rd = await R({ action: 'read', key: 'test1234' }); const cfg = rd.config; const ids = cfg.items.map(i => i.id);
    cfg.classes[1].students = []; cfg.classes[2].students[1].name = 'Christopher Alexander Montgomery';
    await R({ action: 'saveConfig', key: 'test1234', config: cfg });
    await R({ action: 'addRound', key: 'test1234', round: { id: 'r2', name: '空白次別', due: '', itemIds: [], locked: false, createdAt: '2099-01-01T00:00:00Z' } });
    await R({ action: 'addRound', key: 'test1234', round: { id: 'r3', name: '已結案次別', due: '2026-10-01', itemIds: ids, locked: true, createdAt: '2099-02-01T00:00:00Z' } });
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    const lockSize = await pg.$eval('.tag.lock svg', e => { const b = e.getBoundingClientRect(); return Math.max(b.width, b.height); });
    ok(lockSize <= 14, '「已結案」鎖頭圖示大小正常（' + Math.round(lockSize) + 'px）');
    ok(/本次抽查已結案：導師不能再更動，教務組仍可更正/.test(await pg.textContent('main')), '教務組看已結案次別：顯示「導師不能再更動，教務組仍可更正」');
    await pg.selectOption('#roundSel', 'r2'); await sleep(900);
    await pg.click('nav.tabs >> text=全校總覽'); await sleep(300);
    ok(/還沒有勾選任何項目/.test(await pg.textContent('.chartpanel')), '沒有項目的次別：總覽說明「還沒有勾選任何項目」');
    await pg.click('nav.tabs >> text=報表'); await sleep(300);
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('button:has-text("下載 Excel 報表")')]);
    ok(fs.statSync(await dl.path()).size > 1000, '沒有項目的次別仍可下載 Excel');
    await pg.click('nav.tabs >> text=班級檢核'); await pg.locator('.chip', { hasText: '二甲' }).click(); await sleep(200);
    ok(/還沒有學生名單|沒有適用於本班的項目|還沒有勾選任何項目/.test(await pg.textContent('main')), '0 人的班級（或沒有項目的次別）：顯示提示而不是空白表格');
    await ctx.close();
    const tk = await (await fetch(B + 'exec?action=claim&classId=g3&label=t')).json();
    ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx);
    await pg.goto(B); await pg.evaluate(t => localStorage.setItem('hc.teacher', JSON.stringify({ token: t.token, classId: 'g3' })), tk);
    await pg.goto('about:blank'); await pg.goto(B + '#s=3010102'); await pg.waitForSelector('.toast', { timeout: 10000 });
    ok(/已結案，無法登記/.test(await pg.textContent('.toast')), '結案次別用手機相機掃 QR：提示「已結案，無法登記」');
    await pg.waitForSelector('table.grid');
    const nameW = await pg.$eval('table.grid tbody tr[data-no="2"] td.name', e => e.getBoundingClientRect().width);
    ok(nameW < 120 && await pg.evaluate(() => document.documentElement.scrollWidth <= 390), '超長姓名在手機上換行，不撐開畫面（姓名欄 ' + Math.round(nameW) + 'px）');
    await ctx.close();
  }
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('31. 離線也能開啟與登記（本機快取＋離線外殼）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const tk = await (await fetch(B + 'exec?action=claim&classId=g1&label=t')).json();
    ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx);
    await pg.goto(B); await pg.evaluate(t => localStorage.setItem('hc.teacher', JSON.stringify({ token: t.token, classId: 'g1' })), tk);
    await pg.reload(); await pg.waitForSelector('table.grid'); await sleep(1500);
    ok(await pg.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; }), '離線外殼（Service Worker）已啟用');
    await pg.reload(); await pg.waitForSelector('table.grid'); await sleep(800); // 讓外殼接管並快取檔案
    ok(await pg.evaluate(() => !!JSON.parse(localStorage.getItem('hc.cache') || 'null')), '上次的資料已存在這台裝置');
    // 模擬 Google 很慢：開網頁應立刻看到上次的表格
    await fetch(B + '__hang');
    const t0 = Date.now(); await pg.reload(); await pg.waitForSelector('table.grid', { timeout: 8000 }); const dt = Date.now() - t0;
    ok(dt < 4000 && /顯示上次的資料/.test(await pg.textContent('#sync')), 'Google 沒回應時 ' + dt + ' ms 就顯示上次的表格（同步列註明「顯示上次的資料」）');
    await fetch(B + '__unhang');
    await pg.waitForFunction(() => /已同步/.test(document.querySelector('#sync').textContent), null, { timeout: 15000 });
    ok(true, 'Google 恢復後自動更新為最新');
    // 完全斷網：重新開啟網頁仍可使用、可登記
    await ctx.setOffline(true);
    await pg.reload(); await pg.waitForSelector('table.grid', { timeout: 10000 });
    ok(!(await pg.$('.gate')), '完全斷網：網頁仍能開啟並顯示本班表格');
    await pg.locator('table.grid button.chk[data-no="4"][data-item="math"]').tap(); await sleep(9000);
    ok(/1 筆待送出/.test(await pg.textContent('#sync')), '斷網時登記先存在本機（1 筆待送出）');
    await ctx.setOffline(false); await sleep(12000);
    const mk = (await R({ action: 'read', key: 'test1234' })).checks.g1.marks;
    ok(mk['4'] && mk['4'].math, '恢復連線後自動補送成功');
    await pg.click('footer button:has-text("在此裝置登出")'); await sleep(100); await pg.click('footer button:has-text("再按一次")'); await sleep(300);
    ok(await pg.evaluate(() => localStorage.getItem('hc.cache') === null), '登出時清除本機資料');
    await ctx.close();
  }
  await fetch(B + '__reset'); await fetch(B + '__seed');


  console.log('32. 列印時不能有半透明或動畫中的內容');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
  const still = async () => pg.evaluate(() => Array.from(document.querySelectorAll('main *')).filter(e => { const cs = getComputedStyle(e); return cs.animationName !== 'none' || parseFloat(cs.opacity) < 1 && cs.display !== 'none' && !e.closest('[hidden]'); }).map(e => e.className || e.tagName).slice(0, 5));
  for (const t of ['全校總覽', '報表']) {
    await pg.click('nav.tabs >> text=' + t); await sleep(400);
    const scr = await pg.evaluate(() => Array.from(document.querySelectorAll('.tablebox, .kpi, .chartpanel')).filter(e => getComputedStyle(e).animationName !== 'none').length);
    ok(scr === 0, t + '：畫面上的表格與卡片沒有反覆播放的動畫（自動更新時不會閃）');
    await pg.emulateMedia({ media: 'print' });
    const bad = await still();
    ok(bad.length === 0, t + '：列印時沒有半透明或動畫中的元素' + (bad.length ? '（' + bad.join('、') + '）' : ''));
    await pg.emulateMedia({ media: 'screen' });
  }
  await ctx.close();


  console.log('33. 使用說明');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx);
  await pg.goto(B); await pg.waitForSelector('.gatefoot .helpbtn'); await pg.click('.gatefoot .helpbtn'); await sleep(200);
  let ht = await pg.textContent('.helpdlg');
  ok(/第一次使用/.test(ht) && /加入主畫面/.test(ht) && !/不用繳：/.test(ht), '登入頁的說明：第一次使用、加入主畫面，沒有教務組專用內容');
  await pg.click('.helpdlg button:has-text("知道了")'); await sleep(150);
  ok(!(await pg.$('.helpdlg')), '「知道了」關閉說明');
  await ctx.close();
  ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
  await pg.click('footer .helpbtn'); await sleep(200); ht = await pg.textContent('.helpdlg');
  ok(/教務組/.test(ht) && /不用繳：/.test(ht) && /結案：/.test(ht) && !/第一次使用/.test(ht), '教務組的說明含「不用繳、結案、導師登入、查核與備份」');
  await pg.keyboard.press('Escape'); await sleep(150);
  ok(await pg.evaluate(() => document.activeElement && document.activeElement.classList.contains('helpbtn')), 'Esc 關閉後焦點回到「使用說明」');
  await ctx.close();

  console.log('34. 手機設定頁排版');
  ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx); await adminLogin(pg, B);
  await pg.click('nav.tabs >> text=設定'); await sleep(400);
  const lay = await pg.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    nav: document.querySelector('.setnav').getBoundingClientRect().height,
    due: [...document.querySelectorAll('#set-rounds .duef')].map(d => { const a = d.children[0].getBoundingClientRect(), b = d.children[1].getBoundingClientRect(); return Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2) < 4; }),
    pick: [...document.querySelectorAll('#set-rounds .pickbox')].map(p => p.scrollWidth <= p.clientWidth + 1)
  }));
  ok(lay.doc <= 390, '手機設定頁沒有左右捲動（' + lay.doc + 'px）');
  ok(lay.nav < 60, '章節捷徑在手機排成一列（' + Math.round(lay.nav) + 'px 高）');
  ok(lay.due.length >= 2 && lay.due.every(Boolean), '「截止」字和日期框在同一行（' + lay.due.length + ' 處）');
  ok(lay.pick.length >= 2 && lay.pick.every(Boolean), '項目勾選表在手機上放得下，「全選／取消」不被裁切');
  await ctx.close();

  console.log('35. 習作／考卷下拉選單、自動儲存、未完成原因、只有教務組登入');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const unzip = buf => { const out = {}; let i = 0; while (i + 30 < buf.length && buf.readUInt32LE(i) === 0x04034b50) { const sz = buf.readUInt32LE(i + 18), nl = buf.readUInt16LE(i + 26), el = buf.readUInt16LE(i + 28); const name = buf.slice(i + 30, i + 30 + nl).toString('utf8'); out[name] = buf.slice(i + 30 + nl + el, i + 30 + nl + el + sz).toString('utf8'); i += 30 + nl + el + sz; } return out; };
    const stateIs = re => pg.waitForFunction(r => new RegExp(r).test((document.querySelector('#savestate') || {}).textContent || ''), re, { timeout: 25000 });
    const cols = () => pg.$$eval('table.grid thead .cnt', e => e.map(x => x.dataset.item).join(','));
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    ok(!(await pg.$('#savebar, .sb-btn')) && /自動儲存/.test(await pg.textContent('#savestate')), '沒有「儲存」按鈕，表格上方寫「點格子就會自動儲存」');
    ok(!!(await pg.$('#subj-hw')) && !!(await pg.$('#subj-exam')), '表格上方有「習作」「考卷」兩個下拉選單');
    const hwOpts = await pg.$$eval('#subj-hw option', o => o.map(x => x.textContent));
    const exOpts = await pg.$$eval('#subj-exam option', o => o.map(x => x.textContent));
    ok(/^全部習作/.test(hwOpts[0]) && hwOpts.includes('數學習作') && hwOpts[hwOpts.length - 1] === '不顯示習作', '習作選單：' + hwOpts.join('、'));
    ok(/^全部考卷/.test(exOpts[0]) && exOpts.includes('數學考卷') && exOpts[exOpts.length - 1] === '不顯示考卷', '考卷選單：' + exOpts.join('、'));
    const allCols = await cols();
    await pg.selectOption('#subj-hw', '數學'); await sleep(250);
    ok(await cols() === allCols.split(',').filter(x => x === 'math' || x.startsWith('exam_')).join(','), '選「數學習作」：習作只剩數學，考卷照常');
    await pg.selectOption('#subj-exam', '-'); await sleep(250);
    ok(await cols() === 'math', '再選「不顯示考卷」：表格只剩數學習作一欄');
    await pg.locator('table.grid button.chk[data-no="1"][data-item="math"]').click();
    ok((await pg.textContent('tr[data-no="1"] td.st')).includes('全部繳齊'), '狀態依選到的科目計算（1 號數學習作已交＝繳齊）');
    await stateIs('已自動儲存');
    let mk = (await marks(B)).g1.marks;
    ok(mk['1'] && mk['1'].math, '沒有按任何儲存鈕，資料表已有這一格（自動儲存）');
    await pg.locator('.chip', { hasText: '二甲' }).click(); await sleep(300);
    ok(await pg.inputValue('#subj-hw') === '數學' && await cols() === 'math', '換到二甲仍是「數學習作」');
    await pg.locator('.chip', { hasText: '一甲' }).click(); await sleep(300);
    await pg.selectOption('#subj-hw', '-'); await sleep(250);
    ok(await pg.inputValue('#subj-exam') === '' && (await cols()).split(',').length > 1, '兩個都選「不顯示」時，考卷自動改回「全部考卷」，不會變空表');
    await pg.selectOption('#subj-hw', ''); await sleep(250);
    ok(await cols() === allCols, '都選「全部」恢復所有欄');
    fs.writeFileSync(OFF, '1');
    await pg.locator('table.grid button.chk[data-no="4"][data-item="math"]').click();
    await stateIs('先存在這台裝置');
    ok(true, '網路斷線：顯示「n 筆先存在這台裝置，連線後自動送出」');
    try { fs.unlinkSync(OFF); } catch (e) { }
    await stateIs('已自動儲存');
    mk = (await marks(B)).g1.marks;
    ok(mk['4'] && mk['4'].math, '恢復連線後自動送出');
    // 未完成原因
    await pg.selectOption('tr[data-no="2"] select.reasonsel', '遺失');
    await pg.fill('tr[data-no="2"] td.notecol input.noteinput', '數學習作找不到'); await pg.press('tr[data-no="2"] td.notecol input.noteinput', 'Enter');
    await pg.selectOption('tr[data-no="3"] select.reasonsel', '未寫完'); await sleep(2500);
    const nt = (await R({ action: 'read', key: 'test1234' })).checks.g1.notes;
    ok(nt['2'] === '〔遺失〕數學習作找不到' && nt['3'] === '〔未寫完〕', '未完成原因＋補充說明存在備註（舊版後端也能存）');
    await pg.click('nav.tabs >> text=全校總覽'); await sleep(300); await pg.click('nav.tabs >> text=班級檢核'); await sleep(300);
    ok(await pg.inputValue('tr[data-no="2"] select.reasonsel') === '遺失' && await pg.inputValue('tr[data-no="2"] td.notecol input.noteinput') === '數學習作找不到', '重新開啟仍顯示原因與說明');
    await pg.click('nav.tabs >> text=報表'); await sleep(500);
    const rep = await pg.textContent('main');
    ok(/二、未繳交名單與未完成原因/.test(rep) && /遺失 1 人/.test(rep) && /未寫完 1 人/.test(rep) && /尚未填原因 \d+ 人/.test(rep), '報表有「未完成原因統計」（遺失 1 人、未寫完 1 人、尚未填原因…）');
    const trs = await pg.$$eval('.rtable tbody tr', t => t.map(x => x.textContent));
    ok(trs.some(t => /遺失/.test(t) && /數學習作找不到/.test(t)), '報表名單列出每位學生的原因與補充說明');
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('button:has-text("下載 Excel 報表")')]);
    const z = unzip(fs.readFileSync(await dl.path())); const s2 = z['xl/worksheets/sheet2.xml'] || '';
    ok(z['xl/workbook.xml'].includes('未繳交與原因') && s2.includes('未完成原因統計') && s2.includes('>遺失<') && s2.includes('數學習作找不到'), 'Excel「未繳交與原因」工作表有原因欄與統計');
    await ctx.close();
    // 只有教務組登入（teacherLogin: false，正式網站的設定）
    const adminOnly = async p => p.route(/config\.js/, async route => { const res = await route.fetch(); await route.fulfill({ response: res, body: (await res.text()).replace(/teacherLogin:\s*true/, 'teacherLogin: false') }); });
    // 離線外殼（Service Worker）抓的檔案不經過測試的攔截，所以這兩段先停用它
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block' }); pg = await newPage(ctx); await adminOnly(pg);
    await pg.goto(B); await pg.waitForSelector('#adminPw');
    ok(!(await pg.$('#whoSel')) && /教務組登入/.test(await pg.textContent('.gate')), '登入頁只有教務組密碼（導師不用登入）');
    await pg.fill('#adminPw', 'test1234'); await pg.keyboard.press('Enter'); await pg.waitForSelector('table.grid');
    await pg.click('nav.tabs >> text=全校總覽'); await sleep(400);
    const ov = await pg.textContent('main');
    ok(!/導師已登入|尚未登入的班級/.test(ov) && /已填未完成原因/.test(ov), '全校總覽不再提醒導師登入，改顯示「已填未完成原因」');
    await pg.click('nav.tabs >> text=設定'); await sleep(300);
    ok(!(await pg.$('#set-devices')) && !/導師登入/.test(await pg.textContent('.setnav')), '設定頁沒有「導師登入裝置」');
    await ctx.close();
    const tk = await (await fetch(B + 'exec?action=claim&classId=g2&label=t')).json();
    ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' }); pg = await newPage(ctx); await adminOnly(pg);
    await pg.goto(B); await pg.evaluate(t => localStorage.setItem('hc.teacher', JSON.stringify({ token: t.token, classId: 'g2' })), tk);
    await pg.reload(); await pg.waitForSelector('#adminPw', { timeout: 15000 });
    ok(!(await pg.$('table.grid')), '導師裝置上的舊登入不會自動進入（只有教務組能操作）');
    await ctx.close();
    // 項目沒有勾任何年級：教務組一鍵恢復
    const rd = await R({ action: 'read', key: 'test1234' }); const cfg = rd.config;
    cfg.items.forEach(it => { it.grades = it.id === 'chinese' ? [3] : []; });
    await R({ action: 'saveConfig', key: 'test1234', config: cfg });
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
    await pg.goto(B); await pg.click('text=教務組登入'); await pg.fill('input[type=password]', 'test1234'); await pg.keyboard.press('Enter');
    await pg.waitForSelector('table.grid', { timeout: 15000 });
    const c1 = await pg.$$eval('table.grid thead .cnt', e => e.map(x => x.dataset.item).join(','));
    ok(/math/.test(c1) && /life/.test(c1) && !/social/.test(c1) && !(await pg.$('.gradefix')), '項目沒勾任何年級時，照預設年級顯示（一甲有數學、生活，沒有社會），不用另外設定：' + c1);
    await pg.locator('table.grid button.chk[data-no="6"][data-item="life"]').click(); await sleep(1500);
    ok(!!(((await marks(B)).g1.marks['6'] || {}).life), '後端也照預設年級收下這一格（一甲 6 號生活習作）');
    await pg.click('nav.tabs >> text=設定'); await sleep(300);
    await pg.click('text=儲存項目與班級設定'); await sleep(1500);
    const g = Object.fromEntries((await R({ action: 'read', key: 'test1234' })).config.items.map(it => [it.id, it.grades.join('')]));
    ok(g.math === '123456' && g.life === '12' && g.social === '3456' && g.exam_english === '3456' && g.chinese === '3', '設定頁顯示預設年級，按儲存後寫回（已有年級的國語不動）');
    await ctx.close();
    // 抽查次別沒有項目：教務組一鍵加入
    await R({ action: 'addRound', key: 'test1234', round: { id: 'r9', name: '空白次別', due: '', itemIds: [], locked: false, createdAt: '2099-01-01T00:00:00Z' } });
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx);
    await pg.goto(B); await pg.click('text=教務組登入'); await pg.fill('input[type=password]', 'test1234'); await pg.keyboard.press('Enter');
    await pg.waitForSelector('#roundSel'); await pg.selectOption('#roundSel', 'r9'); await pg.waitForSelector('.noitems button:has-text("全部項目加入本次抽查")', { timeout: 15000 });
    await pg.click('.noitems button:has-text("全部項目加入本次抽查")');
    await pg.waitForSelector('table.grid button.chk', { timeout: 15000 });
    const rd9 = await R({ action: 'read', key: 'test1234' }); const r9 = rd9.rounds.find(x => x.id === 'r9');
    ok(r9 && r9.itemIds.length === rd9.config.items.length, '「全部項目加入本次抽查」：' + (r9 ? r9.itemIds.length : 0) + ' 個項目加入，班級頁出現勾選表');
    await pg.click('nav.tabs >> text=設定'); await sleep(300);
    const np = pg.locator('#set-rounds > .pickbox');
    const lbl = async () => (await np.locator('thead button').allTextContents()).join(',');
    ok(await lbl() === '全部取消,全部取消', '新增次別的項目表：全部勾選時按鈕寫「全部取消」');
    await np.locator('thead button').nth(0).click(); await np.locator('thead button').nth(1).click();
    ok(await lbl() === '全選,全選' && await np.locator('input:checked').count() === 0, '按下後全部取消勾選，按鈕變回「全選」');
    const nRounds = rd9.rounds.length;
    await pg.click('#set-rounds button:has-text("建立抽查次別")'); await sleep(300);
    ok(/至少勾選一個/.test(await pg.textContent('.toast')) && (await R({ action: 'read', key: 'test1234' })).rounds.length === nRounds, '一個項目都沒勾就不能建立次別');
    await ctx.close();
  }

  console.log('36. 拍照辨識（模擬 Google Gemini）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const setOcr = o => fetch(B + '__ocr', { method: 'POST', body: JSON.stringify(o) });
    const calls = async () => (await fetch(B + '__ocrcalls')).json();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const upload = () => pg.setInputFiles('#ocrFile', { name: 'cover.png', mimeType: 'image/png', buffer: png });
    const lastJob = () => pg.locator('.ocrjobs > li').first();
    const waitJob = re => pg.waitForFunction(r => { const li = document.querySelector('.ocrjobs > li'); return !!li && new RegExp(r).test(li.textContent); }, re, { timeout: 15000 });
    const mk = async (no, it) => !!(((await marks(B)).g1.marks[String(no)] || {})[it]);
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    await pg.click('button:has-text("拍照辨識")'); await pg.waitForSelector('.ocrmode');
    await pg.waitForFunction(() => /相機|拍照或選照片/.test(document.querySelector('.ocrcam').textContent), null, { timeout: 5000 });
    ok(true, '開啟拍照辨識（沒有相機的電腦會提示改用「拍照或選照片」）');
    await upload(); await waitJob('GEMINI_KEY');
    ok(true, '還沒設定金鑰：提示到指令碼屬性新增 GEMINI_KEY');
    await fetch(B + '__ocrkey?v=test-key');
    await setOcr({ data: { students: [{ no: 3, confidence: 'high', itemId: 'math', seen: '一甲 3號 陳大同', seenItem: '數學習作' }], text: '數學習作 一甲 3 陳大同' } });
    await upload(); await waitJob('已登記');
    await sleep(1500);
    ok(await mk(3, 'math'), '有把握（姓名、座號都對上名單）：自動登記 3 號數學習作');
    const cl = (await calls())[0] || {};
    ok(cl.key === 'test-key' && !/key=/.test(cl.url) && /陳大同/.test(cl.prompt) && /黃怡君/.test(cl.prompt) && cl.img.length > 100 && /gemini-flash-latest/.test(cl.url), '送給 AI 的內容：金鑰放在標頭（不在網址）、本班名單、照片');
    ok(/已登記\s*1\s*本/.test(await pg.textContent('.ocrctl .counter')), '計數顯示「已登記 1 本」');
    await lastJob().locator('button:has-text("取消")').click(); await sleep(1500);
    ok(!(await mk(3, 'math')), '辨識錯了可以按「取消」撤銷');
    await setOcr({ data: { students: [{ no: 4, confidence: 'medium', itemId: 'math', seen: '林美美' }], text: '' } });
    await upload(); await waitJob('請確認');
    await sleep(800);
    ok(!(await mk(4, 'math')), '沒把握（只認出姓名）：先不登記，請教務組確認');
    await lastJob().locator('.ocrbtns button:has-text("登記")').click(); await sleep(1500);
    ok(await mk(4, 'math'), '按「登記」後才寫入');
    await setOcr({ data: { students: [{ no: 4, confidence: 'high', itemId: 'math', seen: '' }, { no: 5, confidence: 'high', itemId: 'exam_math', seen: '' }, { no: 99, confidence: 'high', itemId: 'math', seen: '' }], text: '' } });
    await upload(); await waitJob('已經登記過');
    const t3 = await lastJob().textContent(); await sleep(1500);
    ok(/4 號/.test(t3) && /5 號/.test(t3) && !/99/.test(t3) && await mk(5, 'exam_math'), '一張照片拍好幾本：4 號已登記過不重複、5 號數學考卷登記、名單外的 99 號不採用');
    await pg.selectOption('#ocrItem', 'math');
    await setOcr({ data: { students: [{ no: 6, confidence: 'high', itemId: 'math', seen: '黃怡君', seenItem: '國語習作' }], text: '' } });
    await upload(); await waitJob('請確認');
    ok(/國語習作/.test(await lastJob().textContent()) && !(await mk(6, 'math')), '選了「數學習作」但封面是國語習作：不自動登記，提示確認');
    await setOcr({ data: { students: [], text: '看不清楚' } });
    await upload(); await waitJob('沒有認出學生');
    await lastJob().locator('select[aria-label="選學生"]').selectOption('1');
    await lastJob().locator('.ocrmanual button:has-text("登記")').click(); await sleep(1500);
    ok(await mk(1, 'math'), '沒認出來：直接選學生登記（項目沿用已選的數學習作）');
    await setOcr({ code429First: true, data: { students: [{ no: 6, confidence: 'high', itemId: 'math', seen: '黃怡君', seenItem: '數學習作' }], text: '' } });
    await upload(); await waitJob('已登記'); await sleep(1500);
    ok((await calls()).length === 2 && await mk(6, 'math') && !/null/.test(await lastJob().textContent()), 'AI 忙碌（429）一次：自動等一下再試，成功登記（沒讀到文字時不會顯示 null）');
    await setOcr({ code: 429 }); await upload(); await waitJob('次數有限');
    ok((await calls()).length === 3 && !!(await lastJob().locator('button:has-text("再試一次")').count()), '一直忙碌：自動重試 2 次後才提示，有「再試一次」');
    await setOcr({ data: { students: [{ no: 2, confidence: 'high', itemId: 'math', seen: '李小華', seenItem: '數學考卷' }], text: '' } });
    await upload(); await waitJob('請確認');
    ok(/數學考卷/.test(await lastJob().textContent()) && !(await mk(2, 'math')), '選了「數學習作」但封面是數學考卷：不自動登記，提示確認');
    await pg.selectOption('#ocrItem', '');
    await setOcr({ code404: true, data: { students: [{ no: 2, confidence: 'high', itemId: 'math', seen: '' }], text: '' } });
    await upload(); await waitJob('已登記');
    const cs = await calls();
    ok(cs.length === 2 && /gemini-flash-latest/.test(cs[0].url) && /gemini-2\.5-flash/.test(cs[1].url) && !!cs[1].gen.thinkingConfig, '預設模型停用（404）時自動改用 gemini-2.5-flash');
    // 英語課本書名對照年級（115.11.11 管理者提供）
    await setOcr({ data: { students: [{ no: 2, confidence: 'high', itemId: '', seen: '一年甲班 2號 李小華', seenItem: '英語', bookTitle: 'Hooray 1', grade: 1 }], text: '' } });
    await upload(); await waitJob('已登記'); await sleep(1500);
    ok(await mk(2, 'english') && /Hooray 1/.test((await calls())[0].prompt), '本班的英語課本（Hooray 1＝一年級）：自動判斷是英語習作並登記');
    await setOcr({ seq: [
      { students: [{ no: 0, confidence: 'high', itemId: '', seen: '二年甲班 4號 林美美', seenItem: '英語', bookTitle: 'Hooray 3', grade: 2 }], text: '' },
      { students: [{ no: 4, confidence: 'high', itemId: '', seen: '二年甲班 4號 林美美', seenItem: '英語', bookTitle: 'Hooray 3', grade: 2 }], text: '' }] });
    await upload();
    await pg.waitForFunction(() => /二甲 4 號/.test(document.querySelector('.ocrjobs').textContent) && /已轉到二甲/.test(document.querySelector('.ocrjobs').textContent) && !/辨識中|排隊中/.test(document.querySelector('.ocrjobs').textContent), null, { timeout: 15000 });
    await sleep(1500);
    const cs2 = await calls(); const g2 = (((await marks(B)).g2 || {}).marks || {})['4'] || {};
    ok(cs2.length === 2 && /班級：二甲/.test(cs2[1].prompt) && g2.english && !(await mk(4, 'english')), '在一甲拍到 Hooray 3（二年級）：自動轉到二甲辨識，登記在二甲 4 號，不會記到一甲');
    await setOcr({ data: { students: [{ no: 0, confidence: 'high', itemId: '', seen: '五年甲班 3號', seenItem: '英語', bookTitle: 'Here We Go 5', grade: 5 }], text: '' } });
    await upload(); await waitJob('找不到這個年級的班級');
    ok(/Here We Go 5/.test(await lastJob().textContent()) && (await calls()).length === 1, 'Here We Go 5（五年級）但沒有五年級的班：說明是別班的書，不會亂登記');
    await pg.click('.ocrmode button:has-text("完成")'); await sleep(500);
    ok(await pg.getAttribute('table.grid button.chk[data-no="5"][data-item="exam_math"]', 'aria-checked') === 'true', '關閉後表格顯示辨識登記的結果');
    await ctx.close();
    const L = 'http://localhost:8788/'; await fetch(L + '__reset'); await fetch(L + '__seed');
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, L);
    await pg.click('button:has-text("拍照辨識")'); await pg.waitForSelector('.ocrmode');
    await upload(); await waitJob('更新後端');
    ok(!!(await lastJob().locator('button:has-text("複製新版程式碼")').count()) && /testOcrKey/.test(await lastJob().textContent()), '舊版後端：拍照辨識直接顯示更新步驟與「複製新版程式碼」');
    await ctx.close();
  }

  console.log('37. 後端版本提醒與一鍵複製新版程式碼');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B); await sleep(300);
    ok(!(await pg.$('.updbanner')), '後端是新版：不顯示更新提醒');
    await ctx.close();
    const L = 'http://localhost:8788/'; await fetch(L + '__reset'); await fetch(L + '__seed');
    ctx = await br.newContext({ viewport: { width: 1280, height: 860 }, permissions: ['clipboard-read', 'clipboard-write'] }); pg = await newPage(ctx); await adminLogin(pg, L);
    ok(!(await pg.$('.updbanner')), '勾選畫面不放「後端需要更新」提醒（避免擋住）');
    await pg.click('nav.tabs >> text=設定'); await pg.waitForSelector('.updbanner', { timeout: 10000 });
    ok(/後端程式需要更新/.test(await pg.textContent('.updbanner')), '後端是舊版：設定頁上方提醒「後端程式需要更新」');
    await pg.click('.updbanner button:has-text("怎麼更新？")');
    ok(await pg.isVisible('.updsteps') && /新版本/.test(await pg.textContent('.updsteps')), '「怎麼更新？」展開 4 個步驟');
    await pg.click('.updbanner button:has-text("複製新版程式碼")'); await sleep(600);
    const clip = await pg.evaluate(() => navigator.clipboard.readText());
    ok(/function doPost\(/.test(clip) && /已複製新版程式碼/.test(await pg.textContent('.toast')), '「複製新版程式碼」把 Code.gs 放進剪貼簿（' + clip.split('\n').length + ' 行）');
    ok((await pg.getAttribute('.updbanner a:has-text("開啟 Apps Script")', 'href')) === 'https://script.google.com/home', '「開啟 Apps Script」連到 Apps Script 專案列表');
    ok(/部署 ID「AKfycb/.test(await pg.textContent('.updsteps')) || /部署 ID/.test(await pg.textContent('.updsteps')) || /原本那一個/.test(await pg.textContent('.updsteps')), '步驟寫明要編輯哪一個部署、不要按「新增部署作業」');
    await pg.click('.updbanner button:has-text("我更新好了，重新檢查")'); await pg.waitForSelector('.modal h3:has-text("後端還是舊版")', { timeout: 15000 });
    ok(/存檔不等於部署/.test(await pg.textContent('.modal')) && /新增部署作業/.test(await pg.textContent('.modal')), '還沒更新就按「我更新好了」：說明最常見的原因（只存檔沒部署、按成新增部署作業…）');
    await pg.click('.modal button:has-text("知道了")'); await sleep(200);
    await pg.click('.updbanner button:has-text("這次先不要")'); await sleep(200);
    ok(!(await pg.$('.updbanner')), '「這次先不要」：本次不再顯示');
    await ctx.close();
  }

  console.log('38. 填未完成原因（只列沒繳齊的學生、一次設定）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { const R = async b => (await fetch(B + 'exec', { method: 'POST', body: JSON.stringify(b) })).json();
    const rd = await R({ action: 'read', key: 'test1234' }); const ids = rd.config.items.filter(it => (it.grades || []).includes(1)).map(it => it.id);
    await R({ action: 'marks', key: 'test1234', rid: rd.rid, classId: 'g1', changes: [1, 2].flatMap(no => ids.map(id => ({ no, itemId: id, val: true }))) }); // 1、2 號全部繳齊
    ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx); await adminLogin(pg, B);
    ok(/填未完成原因（4）/.test(await pg.textContent('.classhead')), '按鈕顯示還沒填原因的人數（4）');
    await pg.click('button:has-text("填未完成原因")'); await pg.waitForSelector('.rsnmode');
    const who = await pg.$$eval('.rsnlist .rsnwho b', b => b.map(x => x.textContent));
    ok(who.length === 4 && !who.some(t => /^1 號|^2 號/.test(t)), '只列出沒繳齊的 4 位（1、2 號已繳齊不列）：' + who.join('、'));
    ok(/缺：/.test(await pg.textContent('.rsnlist li')), '每位標出缺哪幾項');
    await pg.locator('.rsnlist li').nth(0).locator('select.reasonsel').selectOption('遺失'); await sleep(200);
    await pg.selectOption('.rsnbulk select', '未寫完'); await pg.click('.rsnbulk button:has-text("套用")'); await sleep(2500);
    const nt = (await R({ action: 'read', key: 'test1234' })).checks.g1.notes || {};
    ok(nt['3'] === '〔遺失〕' && nt['4'] === '〔未寫完〕' && nt['5'] === '〔未寫完〕' && nt['6'] === '〔未寫完〕' && !nt['1'], '個別選的保留（3 號遺失），其他還沒填的一次設為「未寫完」');
    ok(/還沒填原因的 0 位/.test(await pg.textContent('.rsnbulk')), '套用後「還沒填原因的 0 位」');
    await pg.click('.rsnmode button:has-text("完成")'); await sleep(400);
    ok(!/填未完成原因（/.test(await pg.textContent('.classhead')), '關閉後按鈕上的待填人數消失');
    ok(await pg.evaluate(() => document.documentElement.scrollWidth) <= 390, '手機上不左右捲動');
    await ctx.close();
  }

  console.log('39. 簡化的班級頁（三步驟、給校長的報表、更多工具收合）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); pg = await newPage(ctx);
    await pg.addInitScript(() => { try { sessionStorage.setItem('fresh', '1'); localStorage.removeItem('hc.tools'); } catch (e) { } });
    await adminLogin(pg, B);
    ok(await pg.isVisible('.mainacts button:has-text("給校長的報表")') && await pg.isVisible('.steps3'), '班級頁一打開就看到三步驟和「給校長的報表」');
    ok(!(await pg.isVisible('button:has-text("掃描標籤")')) && await pg.isVisible('.moretools summary'), '其他工具收在「更多工具」裡');
    ok(await pg.locator('table.grid button.chk').count() > 0 && await pg.isVisible('table.grid button.chk >> nth=0'), '勾選格子就在畫面上');
    await pg.click('.mainacts button:has-text("給校長的報表")'); await sleep(400);
    ok(/作業抽查結果/.test(await pg.textContent('main')) && await pg.isVisible('button:has-text("列印報表")'), '按「給校長的報表」直接到報表，可列印');
    await ctx.close();
  }

  console.log('40. 全選（每一欄、整張表）');
  await fetch(B + '__reset'); await fetch(B + '__seed');
  { ctx = await br.newContext({ viewport: { width: 1280, height: 860 } }); pg = await newPage(ctx); await adminLogin(pg, B);
    const col = it => pg.locator('table.grid thead .cnt[data-item="' + it + '"]').locator('xpath=..').locator('.colall');
    const m = async () => (((await marks(B)).g1 || {}).marks || {});
    await col('math').click();
    ok(/再按一次/.test(await col('math').textContent()) && !Object.values(await m()).some(x => x.math), '數學「全選」按第一下只提示「再按一次」，還沒勾');
    await col('math').click(); await sleep(1800);
    let mk = await m();
    ok([1, 2, 3, 4, 5, 6].every(no => mk[no] && mk[no].math) && /6\/6/.test(await pg.textContent('table.grid thead .cnt[data-item="math"]')), '再按一次：全班 6 人的數學都打勾（6/6）');
    ok(await col('math').textContent() === '全取消', '全勾之後這一欄的按鈕變成「全取消」');
    await pg.locator('table.grid button.chk[data-no="3"][data-item="math"]').click(); await sleep(1500);
    ok(!((await m())['3'] || {}).math && await col('math').textContent() === '全選', '沒交的再點一下取消（3 號），按鈕變回「全選」');
    await pg.selectOption('#subj-hw', '英語'); await pg.selectOption('#subj-exam', '-'); await sleep(300);
    await pg.click('.gridtools .allbtn'); await pg.click('.gridtools .allbtn'); await sleep(1800);
    mk = await m();
    ok([1, 2, 3, 4, 5, 6].every(no => mk[no] && mk[no].english) && !Object.values(mk).some(x => x.chinese), '表格上方「全部全選」只勾目前顯示的科目（英語），國語沒被勾');
    ok(/全部取消/.test(await pg.textContent('.gridtools .allbtn')), '全部勾完後上方按鈕變「全部取消」');
    await pg.click('.gridtools .allbtn'); await pg.click('.gridtools .allbtn'); await sleep(1800);
    ok(!Object.values(await m()).some(x => x.english), '「全部取消」清掉英語');
    await ctx.close();
  }

  await br.close();
  console.log('\n頁面錯誤：' + (errors.length ? errors.join(' | ') : '無'));
  console.log(`結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
