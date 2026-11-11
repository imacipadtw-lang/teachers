# 作業抽查紀錄：自動測試

```bash
cd homework-check/tests
npm i axe-core     # 第一次（無障礙檢查用，可省略）
./run.sh
```

- `server.js`：在 Node 中執行 `apps-script/Code.gs`，模擬 Google 試算表、指令碼屬性、快取、鎖定等服務，並提供網站檔案。不會連到真正的 Google，也不會動到學校資料。
- `test.js`：用 Playwright 開瀏覽器實際操作（教務組、導師手機、斷線、掃描、列印前檢查等），目前 38 組、254 項。
- `axe.js`：axe-core 無障礙檢查（WCAG 2.1 AA＋最佳實務），淺色與深色模式各跑一次。
- `fixtures/Code.legacy.gs`：115.11.8 以前的後端，用來確認「網站已更新、後端還沒重新部署」時仍可正常使用。

測試資料是假的（密碼 `test1234`、學生「王小明」等），不含任何真實姓名。
