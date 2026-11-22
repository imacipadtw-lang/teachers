> **著作權所有 © 2026 imacipadtw-lang，保留一切權利。** 本資料夾公開可見不代表授權，見倉庫根目錄 `LICENSE`。

# Diwali Party 公開觀課（115.12.28 五甲英語，中外師協同）

入口：https://imacipadtw-lang.github.io/teachers/diwali-party/

| 檔案 | 用途 |
|---|---|
| `index.html` | 入口頁（四個連結＋學生 iPad 用的 QR code，`qr-lab.svg`） |
| `class.html` | 上課簡報（中師後 20 分鐘，10 頁）。**建置結果，不要直接改**：改 `class.src.html` 後執行 `python3 build.py` |
| `script.html` | 上課腳本（**書籤分頁、整頁不用下滑**）：14 個分頁，每一段按幾下、中師說哪一句、Ankita 做什麼；全英語 73 句，每一句可以按 ▶ 聽 ElevenLabs 語音。**建置結果**：改 `lines.json` 或 `make_script.py` 的 `STEPS` 後執行 `python3 make_script.py` |
| `lines.json` | 全英語 73 句的唯一正本：`id`（＝音檔檔名）、`en`、中文提示、固定手勢。`make_script.py` 與 `make_voice.py` 都讀這一份 |
| `voice/<id>.mp3` | 73 句的 ElevenLabs 語音（Emma - Bright Kids Educator，`eleven_multilingual_v2`）。**合成語音，不是真人錄音**，畫面與文件都要這樣寫 |
| `make_voice.py` | 語音流程：`plan` 分批並印出要錄的文字、`cut` 把錄好的批次切回每一句 |
| `kids.html` | 學生入口：只有 1 Wordwall、2 Party Menu、3 Padlet 三個大按鈕；Wordwall／Padlet 連結從網址 `#w=…&p=…` 讀（入口頁「老師設定」產生 QR） |
| `plan.html` | 教案：素養導向設計、理論基礎、課綱對應、流程、評量、觀課焦點 |

## 流程（單一事實來源，四個檔案與 Lunch Box Lab 的 `DEFAULT_PHASES` 要一致）
0–20 Ankita 簡報 1–24 頁 → 20:00 交棒與任務 → 20:45 Cool English 一句＋Spin → 22:00 自學 Wordwall（計時 3:30）→ 26:00 共學 Party Menu（3:30）→ 30:00 互學 Padlet 錄音互評（2:30）→ 33:00 Can you count it?＋Impostor → 35:00 Speed Round（中師主持）→ 38:30 自我檢核＋對 Ankita 說離場句 → 課後教材放因材網。全程不用紙本。

## 上課簡報怎麼運作
- 1920×1080 舞台等比例縮放；一直按「下一步」（點畫面右側、→、空白鍵）。每頁的步驟用 `data-s`，計時頁 `data-timer`（秒）＋`data-go`（第幾步開始倒數），要開 Lunch Box Lab 的頁面 `data-lab`（`spin`／`impostor`／`speed`）。
- Lunch Box Lab 用同網域的 iframe 直接開在簡報裡（`../lunch-box-lab/index.html#站名`），所以紀錄仍存在同一個 localStorage，「學習證據」看得到。**這個做法只在 GitHub Pages（或同一個資料夾結構）有效**，claude.ai 的預覽版不能嵌入別的網頁。
- 吉祥物 Boxy、黏土食物角色、食物照片都是建置時從 `../lunch-box-lab/`（`anime.css`、`anime.js`、`chars.js`、`index.html` 裡的照片）取用的；那邊改了角色就重新 `python3 build.py`。
- 右下角「課堂時間」從 20:00 起算（離開第 1 頁自動開始，連點兩下歸零），超過下一頁的預定時間會變粉紅色。最下面一行小字是給觀課者看的設計說明（按 O 開關）。
- `B` 鍵或右下角 👀：整個畫面換成 Eyes on me!（班級經營用，計時不停）。換頁時有一道斜向色帶掃過。
- 動畫只放在開場、遊戲與結尾；學生作業的頁面只有步驟與計時器（Mayer 的一致性原則）。尊重 `prefers-reduced-motion`。
- 不放任何學生姓名（公開倉庫），只用座號與組別。

## 腳本與語音怎麼做
- 英文句子只改 `lines.json`。改完跑 `python3 make_script.py` 重建 `script.html`；句子有變就要補錄語音，不然按 ▶ 會聽到舊句子。
- 補錄：`python3 make_voice.py plan`（可只給幾個 id，例如 `plan c01 h04`）→ 用 ElevenLabs 連接器把每一批錄成一個檔，存成 `scratch/<bid>.mp3` → `python3 make_voice.py cut` 切回 `voice/`。`scratch/` 不進倉庫。
- **一次生成最長 23.719 秒，超過就被硬切掉尾巴**（而且每個過長的檔案都剛好是 397,093 位元組）。所以每批控制在 15 秒內；`cut` 會對超過 23 秒的批次示警。
- **一定要用 `eleven_multilingual_v2`**：只有它吃 `<break time="1.5s" />`，固定 1.5 秒的靜音才能準確切檔（`eleven_v4` 會把整批連著唸完）。
- 額度是管理者付費的（每字元 1 點），錄之前先 `account_get_usage`；生成失敗不要重打同一個呼叫（會再扣一次）。115.11.22 這 73 句共 2,748＋3,211 點。

## 測試
在倉庫根目錄 `python3 -m http.server 8791 &`，再執行 `node diwali-party/tests/script.js`（上課腳本：句子與音檔對得上、各尺寸整頁看得完、播放順序）與 `node diwali-party/tests/steps.js`（要 Playwright）：核對每一頁的步數、計時、要開哪一站，並只用「下一步」鍵從第 1 頁走到最後（一般與減少動態兩種模式），按鍵總數要等於 `script.html` 寫的 36 下。**簡報增減步驟時，`tests/steps.js` 的 `EXPECT` 和 `script.html` 的「按鍵」說明要一起改。**

115.11.18 測過：10 頁在 1180×820、1366×768、1280×720、1920×1080 逐頁檢查無破版與錯誤；三個站在 iframe 內開啟並可操作；Lunch Box Lab 載不進來時 7 秒後出現說明與「再試一次／另開分頁」，恢復後可重試；計時器開始與重設；重新整理後回到原頁；`index.html`、`script.html`、`plan.html` 在 390 寬不左右捲動。**沒有在真的教室大螢幕與 iPad Safari 上測過。**

115.11.22 測過 `script.html`：1512×860、1280×800、1180×820（iPad 橫）、820×1180（iPad 直）、1024×768 五種尺寸，14 個分頁都整頁看得完、不用捲動（內容太多時自動等比例縮到最小 0.68）；390 寬不左右捲動，只有最長的四個分頁要上下捲；單句播放、整段依序播放、0.75×、跟著唸、課前打勾的記憶、`←``→` 換頁、網址 `#分頁` 都正常；73 句音檔全部對得上 `lines.json`。
