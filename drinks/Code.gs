/**
 * 10/28 雙語研習 飲料訂單 — Google Apps Script 後端
 * 綁定在 Google 試算表「1028雙語研習 飲料訂單」上。
 * 部署方式見同資料夾 README.md。
 */
const SHEET_NAME = '訂單';
const HEADER = ['填寫時間', '姓名', '飲料', '冷熱', '甜度/備註'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.getSheets()[0];
    sh.setName(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) sh.appendRow(HEADER);
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 老師送出訂單：同一個姓名再送一次就覆蓋舊的那一列
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const name = String(d.name || '').trim();
    const drink = String(d.drink || '').trim();
    const temp = String(d.temp || '').trim();
    const note = String(d.note || '').trim();
    if (!name || !drink || !temp) return json_({ ok: false, error: 'missing' });

    const sh = getSheet_();
    const now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'MM/dd HH:mm');
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() === name) {
        sh.getRange(i + 1, 1, 1, 5).setValues([[now, name, drink, temp, note]]);
        return json_({ ok: true, updated: true });
      }
    }
    sh.appendRow([now, name, drink, temp, note]);
    return json_({ ok: true, updated: false });
  } finally {
    lock.releaseLock();
  }
}

// 讀取全部訂單：GET ?action=list
function doGet(e) {
  const sh = getSheet_();
  const rows = sh.getDataRange().getValues().slice(1)
    .filter(r => String(r[1]).trim())
    .map(r => ({ time: r[0], name: r[1], drink: r[2], temp: r[3], note: r[4] }));
  return json_({ ok: true, rows: rows });
}
