// 請假比對 ②：備註「調課（不用請假）」的代課不列；「是調課，不用請假」按鈕會送出 fix 改備註（115.11.25）。先 cd daike-calendar && python3 -m http.server 8765 &
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({viewport:{width:1280,height:900}});
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?demo=1');
  await p.waitForSelector('#name option:not([value=""])', {state:'attached'});
  await p.selectOption('#name', '王教務'); await p.fill('#pw', 'demo'); await p.click('#loginForm button[type=submit]');
  await p.waitForTimeout(2500);
  const r = await p.evaluate(async () => {
    await ensureMeta();
    // 找兩筆不同老師請假的代課；人事資料只給「別人」一筆請假，讓日期範圍涵蓋它們
    const leaves = state.events.filter(e => e.type === "leave" && e.id && !/示範/.test(e.id) || e.type === "leave");
    const L = state.events.filter(e => e.type === "leave");
    const a = L[0], c = L.find(e => e.who !== a.who && e.date !== a.date) || L[1];
    const other = state.meta.teachers.find(n => n !== a.who && n !== c.who);
    const d0 = [a.date, c.date].sort()[0], d1 = [a.date, c.date].sort()[1];
    const roc = d => { const [y,m,dd] = d.split("-"); return `${+y-1911}-${m}-${dd}`; };
    const recs = [{who: other, form: "公假", from: roc(d0) + " 08:40", to: roc(d0) + " 09:20", applied: roc(d0) + " 07:00", status: "同意"},
                  {who: other, form: "公假", from: roc(d1) + " 08:40", to: roc(d1) + " 09:20", applied: roc(d1) + " 07:00", status: "同意"}];
    const text = hrRecsToText(recs);
    // 每筆給不同序號，好分辨
    let k = 0; state.events.forEach(e => { if((e.type === "sub" || e.type === "leave") && e.id === "示範"){ } });
    const mark = (e, note) => state.events.filter(y => y.date === e.date && String(y.period) === String(e.period) && y.cls === e.cls && (y.type === "sub" || y.type === "leave")).forEach(y => { y.id = "代-TEST" + (e === a ? "A" : "C"); y.note = note; });
    mark(a, "已核章完成"); mark(c, "已核章完成；調課（不用請假）");
    window.allEvents = async () => state.events;
    await hrRun(text, {noSave: true});
    const R = state.hr, inA = R.noHr.some(x => x.id === "代-TESTA"), inC = R.noHr.some(x => x.id === "代-TESTC"), okC = (R.swapOk || []).some(x => x.id === "代-TESTC");
    showPage && showPage("hr");
    const box = document.querySelector("#hrBox"), btns = [...box.querySelectorAll("[data-hrswap]")].length, legend = /是調課、不用請假，不列/.test(box.innerText);
    // 按鈕：攔 confirm、fixSend
    let sent = null; window.confirm = () => true; window.fixSend = async (op, ref, data) => { sent = {op, ref, data}; return {ok:true}; }; window.reload = async () => {};
    const i = R.noHr.findIndex(x => x.id === "代-TESTA");
    const btn = box.querySelector(`[data-hrswap="${i}"]`); if(btn) btn.click();
    await new Promise(r => setTimeout(r, 300));
    // 規則本身：各種寫法
    const re = HR.SWAP_OK_RE, forms = ["調課（不用請假）","調課(不用請假)","調課，不用請假","調課不用請假"].map(t => re.test(t)), neg = ["調課單","已核章完成"].map(t => re.test(t));
    return {inA, inC, okC, btns, legend, sent, forms, neg, noHr: R.noHr.length};
  });
  console.log(JSON.stringify(r, null, 1), errs.length ? errs : "no errors");
  const ok = r.inA && !r.inC && r.okC && r.btns > 0 && r.legend && r.sent && r.sent.op === "save" && r.sent.data.note === "已核章完成；調課（不用請假）" && r.forms.every(Boolean) && !r.neg.some(Boolean) && !errs.length;
  console.log(ok ? "✓ 全部通過" : "✗ 有沒通過的"); await b.close(); process.exit(ok ? 0 : 1);
})();
