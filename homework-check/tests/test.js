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
  const newPage = async (ctx) => { const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); return p; };
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
  ok(await pg.evaluate(() => document.activeElement.dataset.view === 'overview' && !!document.querySelector('table.ov')), '→ 鍵切到「全校總覽」');
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
  await pg.locator('.noteinput').nth(1).fill('=HYPERLINK("http://x")'); await sleep(1800);
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
  await pg.locator('.noteinput').nth(2).fill('家長未簽名'); await sleep(9000);
  ok(/1 筆待送出/.test(await pg.textContent('#sync')), '斷線時顯示備註待送出');
  ok(await pg.inputValue('.noteinput >> nth=2') === '家長未簽名', '輸入框內容保留');
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
  await pg.click('button:has-text("掃描登記")'); await pg.waitForSelector('#scanInput');
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
  await pg.reload(); await pg.waitForSelector('table.grid'); await pg.click('button:has-text("掃描登記")'); await pg.waitForSelector('#scanInput');
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
    await pg.click('button:has-text("掃描登記")'); await pg.waitForSelector('#scanInput');
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
    ok(names.join(',') === '全校摘要,未繳交與備註,一甲,二甲,三甲', '工作表：' + names.join('、'));
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

  await br.close();
  console.log('\n頁面錯誤：' + (errors.length ? errors.join(' | ') : '無'));
  console.log(`結果：${pass} 通過，${fail} 失敗`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
