> **著作權所有 © 2026 imacipadtw-lang，保留一切權利。** 本資料夾公開可見不代表授權，見倉庫根目錄 `LICENSE`。

# Lunch Box Lab 原始檔

發布網址：https://claude.ai/artifact/5CrCV1GGNXaZYRqdmocLRZ

## 檔案
- `app.html`：程式本體（HTML/CSS/JS）。`<!--CLIPS-->` 和 `<!--QR-->` 是建置時替換的位置。
- `clips-vocab.js`：ElevenLabs 錄音（聲音 Bella、模型 eleven_v4），13 個範例字 × 3 句（單字、I like ___.、I want some ___.），共 39 段。已用 ElevenLabs 轉文字逐句核對內容和切點。
- `clips-feedback.js`：鼓勵語與各站開場語 10 段（Great job! … Listen and catch!），同樣已轉文字核對。
- `segs.json`、`fbsegs.json`：上面兩份錄音的切點（秒）。
- `qr.svg`：網址 QR code（python `qrcode` 產生，已解碼確認）。
- `build.py`：把上面組成 `/home/user/lunch-box-lab.html`。

## 重建
```bash
python3 /home/user/lunch-box-lab-src/build.py
```
然後用 Artifact 工具發布 `/home/user/lunch-box-lab.html`（同一路徑會更新同一網址）。

## 補錄新單字（例如英語護照 512–523）
1. 用 ElevenLabs 同一個聲音（voice_id `hpp4J3VqNfWAUOO0d1Us`）錄「Word. / I like forms. / I want some forms.」，每句空一行。
2. ffmpeg silencedetect 找出最大的停頓切段，再用轉文字的字詞時間點核對切點。
3. 存成新的 `clips-xxx.js`（`Object.assign(window.LBL_CLIPS,{...})`，key 是完整句子含句點，例如 `"I like apples."`），重建、發布。
4. 同時把 `DEFAULT_WORDS` 換成新字，或在網頁「單字設定」→「一次貼上整份單字表」貼上。

注意：2026-11-09 測試時 ElevenLabs 帳戶只剩約 38 點，補錄前需要額度。


## 真人發音（ElevenLabs）
- 目前 39 個必要片段（13 個預設單字各自的單字、複數句子與兩個句型）、7 句固定指令與鼓勵語，全部都是 ElevenLabs 真人錄音（Bella，eleven_v4），沒有拼接，也不用裝置語音。2026-11-17 使用者升級 ElevenLabs Starter 後補錄最後 15 句（cream、hamburger、cake、fish、chicken），逐字轉錄核對與切點對時全部正確。
- 只有使用者自己在「單字設定」新加的字沒有錄音，會用裝置語音。要預錄新字：`python3 voice_tools.py plan` 看要錄的文字，用 ElevenLabs 錄好後 `python3 voice_tools.py ingest <mp3> <tag> "<第1句>" "<第2句>" ...`（空一行分句，會自動切句、嵌入、並做音量平衡），再 `python3 build.py`。
- `normalize_clips.py`：把所有錄音的說話音量平衡到同一水準（目標 -21 dB，差距 0.8 dB 以內，峰值不超過 -1 dB）；原檔備份在 `voice-raw/old/`；可重複執行，已平衡的不會再動。
- 補錄排程「Lunch Box Lab 自動補錄真人發音」已不需要，已停用。

## 圖片（實物照片）
- 預設是實物照片（`photos-src/*.png` → `make_photos.py` → `photos.js`，建置時嵌入）。16 張：13 個課程字＋tangyuan、diya、box。
- 來源：Canva `generate-image`（AI 生成的食物照片）＋ `remove-background`（透明底），原圖 200×200，轉成 256px WebP。
- 「單字設定」可切換：實物照片／黏土角色（`chars.js`）／Emoji。自己新加的字沒有照片時，用黏土角色或 emoji。
- 重新生成某張：用 Canva generate-image 產生、remove-background 去背，存成 `photos-src/<key>.png`，執行 `python3 make_photos.py && python3 build.py`。
- 注意：Canva 同時去背太多張會回 HTTP 409，一次一張就行。
- 文字外漏防護：`tests/leaks.js` 檢查每個畫面（桌機、iPad 直式／橫式、iPad mini）沒有露出 `${…}`、undefined、NaN、[object …]，卡片不需要左右捲動，單字表的字沒有被截斷。
- 撞名防護：`tests/classes.js` 檢查按鈕、Build It 區塊、圖片容器沒有被新 CSS 蓋掉（曾發生 `.ghost`、`.slot`、`.ph` 撞名）。

## 交付檔案（都在 /home/user，來源腳本在本資料夾與 /home/user/b1-en）
- `B1_Digital_Learning_Open_Class_Lesson_Plan_Tucheng_ES_Grade5A_English_Ankitas_Lunch_Box.docx`：縣府 B1 格式、全英文、16 頁（`python3 /home/user/b1-en/fill_en.py` 重建）。
- `Lunch_Box_Lab_Cards_printable.pdf`：可列印字卡／圖卡（`python3 make_cards.py <輸出路徑>`）。
- `Ankita_Lesson_Cheat_Sheet_1page.pdf`：講師一頁速查卡（`python3 make_cheatsheet.py <輸出路徑>`）。
- Claude Docs 中文簡化教案與腳本：https://claude.ai/artifact/KackNxrrDEiALuSsy1EDsc
- 測試：`bash tests/run_all.sh`（classes、leaks、axe、nostore、voice、review3、full、pack、speed、wheel、soak、stamps、review4，共 13 組，全部 ok 才可發布）。
- 無障礙：`tests/axe.js` 用 axe-core 掃每個畫面（iPad 橫式／直式、手機、淺色／深色），需要先 `cd tests && npm install axe-core --no-save`（沒裝會略過）。skip-link 規則關閉，因為 App 用 #hash 路由。

## GitHub 同步
- 程式碼放在 git，之後每次改完（build → `bash tests/run_all.sh` 全過 → 發布同一網址）都執行 `bash sync_github.sh "這次改了什麼"`，它會 commit 並推到 GitHub；沒有變更或還沒設定遠端時不會做事。
- 設定遠端：`git remote add origin <GitHub 網址>`，之後 `sync_github.sh` 會自動推送。
- 網站本身不放在 GitHub，仍由原本的發布網址提供；`build.py` 會把 `app.html` 加上圖片、錄音、QR code 組成單一檔案。

## 版本紀錄（重要）
- 2026-11-16 另一個工作階段發布了教案 v2（Ankita 簡報 20 分、中師四學 15 分、Ankita 遊戲 5 分；新增 Party Menu 站、首頁依上課順序排列、6 個印章、排燈節主題）。那一次只改了 `app.html`，沒有改圖片或錄音。
- 2026-11-17 本資料夾的 `app.html` 已改為那個版本的原始碼（由線上檔反推，重建後與線上檔逐字相同），再加上本次的真人錄音、音量平衡與說明文字更新，發布為 v27（線上版本號）。測試也已跟著更新（`soak.js` 改為 7 個階段，`voice.js` 加入 Party Menu）。
- 對方那一次的測試檔不在這個資料夾。之後改動前先用 Artifact 工具讀線上最新版，確認沒有別人更新，避免覆蓋。
