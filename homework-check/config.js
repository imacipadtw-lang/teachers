// 作業抽查紀錄 — 網站設定
// 只有這一個檔案需要教務組修改。
window.HC_CONFIG = {
  // ① 把 Apps Script「網頁應用程式網址」貼在引號內（以 https://script.google.com/macros/s/ 開頭，結尾 /exec）
  apiUrl: "https://script.google.com/macros/s/AKfycbw-3Zg_BkUqIobPDrBQ2egX2FtRp1aq8N0FiK-Jij_10Vab1yICvMaf53Usaz7QBycs/exec",

  // ② 以下文字會顯示在網頁抬頭與列印表頭，可依需要修改
  schoolName: "南投縣草屯鎮土城國民小學",
  unitName: "教務處",
  appName: "作業抽查紀錄",

  // ③ 自動更新間隔（秒）。老師開著網頁時，每隔這段時間向資料表確認一次最新繳交情形
  pollSeconds: 45
};
