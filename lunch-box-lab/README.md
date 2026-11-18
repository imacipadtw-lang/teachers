> **著作權所有 © 2026 imacipadtw-lang，保留一切權利。** 本資料夾公開可見不代表授權，見倉庫根目錄 `LICENSE`。

# Lunch Box Lab 原始檔

發布網址：https://claude.ai/artifact/5CrCV1GGNXaZYRqdmocLRZ

## 檔案
- `app.html`：程式本體（HTML/CSS/JS）。`<!--CLIPS-->` 和 `<!--QR-->` 是建置時替換的位置。
- `clips-vocab.js`：ElevenLabs 錄音（聲音 Bella、模型 eleven_v4），13 個範例字 × 3 句（單字、I like ___.、I want some ___.），共 39 段。已用 ElevenLabs 轉文字逐句核對內容和切點。
- `clips-feedback.js`：鼓勵語與各站開場語 10 段（Great job! … Listen and catch!），同樣已轉文字核對。
- `segs.json`、`fbsegs.json`：上面兩份錄音的切點（秒）。
- `qr.svg`：網址 QR code（python `qrcode` 產生，已解碼確認）。
- `anime.css`、`anime.js`：動漫風的原創吉祥物 Boxy（粉紅便當盒貓耳朵）與漫畫風回饋特效（見下方「動漫風角色與特效」）。`<!--ANIME-->` 是建置時替換的位置。
- `build.py`：把上面組成 `/home/user/lunch-box-lab.html`（環境變數 `LBL_OUT` 可改輸出位置）。
- `make_pages.py`：把建置結果包成可放在 GitHub Pages 的完整網頁 `index.html`。
- `normalize_clips.py`：錄音音量平衡。`voice_tools.py`：錄音嵌入與狀態。`sync_github.sh`：同步到 GitHub。
- `tests/`：自動測試，`bash tests/run_all.sh`（`LBL_URL` 可改測試的檔案）。

## 重建
```bash
python3 /home/user/lunch-box-lab-src/build.py
```
然後用 Artifact 工具發布 `/home/user/lunch-box-lab.html`（同一路徑會更新同一網址）。

## 第一次在真的 iPad 上測試，請看這幾件事
我只能在電腦瀏覽器（Chromium）測試，沒有真的 iPad Safari。請在 iPad 上確認：
1. 開網址，先點一下畫面，進 Catch，聽得到真人聲音（iPad 側邊靜音開關要關、音量要開）。教師工具有「測試這台的聲音」。
2. 左下角有粉紅便當角色 Boxy；答對時跳起來、星星眼、出現漫畫字（POP! YUM!…），答錯時冒汗、出現 hmm?，連續答對 3 次出現 COMBO 和火焰。
3. 拿到印章時，畫面中間有「NEW STAMP!」的印章蓋下來；結果卡上已拿到的印章會有光掃過。
4. Party Menu：三人一組一台 iPad，選食物、選對說法、看到完成的菜單；錯了只問 Can you count it?。
5. 動畫太卡或想要安靜的畫面：教師工具 →「動畫角色與特效」按一下關閉（只影響這台）。
6. 使用說明 →「為什麼這樣設計」是給觀課、議課看的素養與理論對照。
7. 有問題請記下：哪一頁、哪一台 iPad、iPadOS 版本、做了什麼，再回報。

## 動漫風角色與特效
- 吉祥物 **Boxy**：原創角色（粉紅便當盒加貓耳朵、大眼睛），不是任何現有作品的角色。SVG 手繪，CSS 動畫：呼吸、眨眼、耳朵抖動；答對時跳起來變星星眼，答錯時冒汗（`> <`），連續答對 3 次起有火焰，過關跳舞，首頁揮手。
- 特效：答對的漫畫擬聲字（POP! YUM! WOW!…）、星星粒子、集中線爆發、COMBO 橫幅；拿到印章時印章「蓋下來」。答錯只有溫和的 hmm?，不處罰。
- 接法：`app.html` 的 `sfx.good／bad／win`、`say()`、`stamp()` 各呼叫一次 `window.ANIME`；角色的氣泡只顯示鼓勵語與指令（不顯示單字或題目句，避免破壞「只聽不看字」）。
- 守則：全部 `aria-hidden`、不接收點擊、不可聚焦；手機寬度（<480px）不顯示；`prefers-reduced-motion` 開啟時不產生任何特效；「教師工具」有一鍵關閉動畫。特效短（約 1 秒）、不擋題目，是依 Mayer 的一致性原則，只做回饋、不增加分心。測試：`tests/anime.js`。
- 閒置提示：Catch、Impostor、Build It、Check 上停下超過 16 秒沒有操作，Boxy 會揮手並用氣泡顯示這一關自己的指令（Listen and catch! 等，只有氣泡、不出聲），最多三次，一操作就重新計時。食物選項的圖片會輕輕浮動，答對時像彈跳（擠壓與拉伸），答錯時搖頭；動的是圖片，不是按鈕，所以不影響點擊。
- 要改角色顏色或表情：改 `anime.js` 裡的 SVG 與 `anime.css` 的姿勢類別（`.p-cheer`、`.p-oops`、`.p-win`、`.p-wave`、`.fire`）。

## 教學理論與素養
- App 內「使用說明 → 為什麼這樣設計」有完整對照表（活動、素養導向任務、核心素養、理論、學習證據）；這裡放摘要和參考文獻。
- 素養導向的做法：真實任務（為 Ankita 的排燈節派對準備食物）、學習歷程可見（✔ △ ? 課前課後）、小組合作與口說（Party Menu、菜單分享）、文化理解（印度食物與臺灣食物）、給鷹架不給答案（只問 Can you count it?）、快速溫和的回饋。
- 小組表現觀察（議課用）：「學習證據」頁有 Party Menu 的觀察表，5 個項目（聽與選、說句子、合作、文化理解、自我調整，各對應英-E-B1、B1、C2、C3、A1）× A、B 兩組，用學生自己卡片上同一組的 ? △ ✔ 記錄（? 還需要幫忙、△ 大部分做到、✔ 做到並能教別人）。資料只存在這台裝置，會一起複製到文字摘要，「新的一節課」會清空。測試：`tests/rubric.js`。這是教學設計的建議，不是官方評量規準。
- 間隔重複／提取練習：Spin 標成「? 不熟」和「△」的字，在 Catch 與 Pack the Box 出現的機率較高（權重 3／2／1），其他字照常出現。
- 課綱核心素養（英-E-A1、B1、C2、C3）的文字，是從各校公開的英語課程計畫轉引的課綱條文，**沒有直接核對教育部原文**（本環境連不到教育部網站）；學習表現編號沒有查到可核對的原文，所以沒有列。正式引用請對照課綱原文。
- 參考文獻（依作者與年代整理，沒有逐篇重新取得原文，正式引用前請查證）：
  - Asher, J. J. (1969). The total physical response approach to second language learning. *The Modern Language Journal, 53*(1), 3–17.
  - Black, P., & Wiliam, D. (1998). Assessment and classroom learning. *Assessment in Education, 5*(1), 7–74.
  - Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits. *Psychological Inquiry, 11*(4), 227–268.
  - Dweck, C. S. (2006). *Mindset: The new psychology of success*. Random House.
  - Ellis, R. (2003). *Task-based language learning and teaching*. Oxford University Press.
  - Johnson, D. W., & Johnson, R. T. (1999). *Learning together and alone* (5th ed.). Allyn & Bacon.
  - Krashen, S. D. (1982). *Principles and practice in second language acquisition*. Pergamon.
  - Long, M. H. (1991). Focus on form: A design feature in language teaching methodology. In K. de Bot et al. (Eds.), *Foreign language research in cross-cultural perspective* (pp. 39–52). John Benjamins.
  - Mayer, R. E. (2009). *Multimedia learning* (2nd ed.). Cambridge University Press.
  - Paivio, A. (1986). *Mental representations: A dual coding approach*. Oxford University Press.
  - Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science, 17*(3), 249–255.
  - Schmidt, R. W. (1990). The role of consciousness in second language learning. *Applied Linguistics, 11*(2), 129–158.
  - Swain, M. (1985). Communicative competence: Some roles of comprehensible input and comprehensible output in its development. In S. Gass & C. Madden (Eds.), *Input in second language acquisition* (pp. 235–253). Newbury House.
  - Um, E., Plass, J. L., Hayward, E. O., & Homer, B. D. (2012). Emotional design in multimedia learning. *Journal of Educational Psychology, 104*(2), 485–498.
  - Vygotsky, L. S. (1978). *Mind in society*. Harvard University Press.
  - Willis, J. (1996). *A framework for task-based learning*. Longman.
  - Wood, D., Bruner, J. S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry, 17*(2), 89–100.

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
- 2026-11-18 另一個工作階段直接在 GitHub 倉庫改了 `app.html` 與 `index.html`（教案 v3）：Ankita 主教前 20 分鐘、中師主教後 20 分鐘，最後 5 分鐘由中師主持 Speed Round；首頁排成 1 → 5；Speed Round 只出 I want some ___. 並顯示兩組分數；拿掉護照塗星星（全程不用紙本）；`planV` 3；「為什麼這樣設計」加 Speed Round 一列、英-E-B2 與 Swain (1985)。搭配的上課簡報、腳本、教案在倉庫的 `diwali-party/`，簡報會用 iframe 開這個程式的 `#spin`、`#impostor`、`#speed`，所以這三個網址不要改名。**下次從來源資料夾同步前，請先把倉庫版 `app.html` 的改動併回來源。**
- 對方那一次的測試檔不在這個資料夾。之後改動前先用 Artifact 工具讀線上最新版，確認沒有別人更新，避免覆蓋。
