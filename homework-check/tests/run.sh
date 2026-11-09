#!/usr/bin/env bash
# 作業抽查紀錄：一鍵自動測試
# 會在本機 8787（新版後端）與 8788（舊版後端，測向下相容）各開一個模擬伺服器，跑完自動關閉。
# 需要：Node 18+、Playwright（含 Chromium）；無障礙檢查另需 `npm i axe-core`。
set -euo pipefail
cd "$(dirname "$0")"
HC="$(cd .. && pwd)"
for port in 8787 8788; do
  if (exec 3<>/dev/tcp/127.0.0.1/$port) 2>/dev/null; then echo "連接埠 $port 已被使用，請先關閉佔用的程式再測試"; exit 1; fi
done
LEG="$(mktemp -d)"
mkdir -p "$LEG/apps-script"
cp -r "$HC/index.html" "$HC/config.js" "$HC/assets" "$LEG/"
cp fixtures/Code.legacy.gs "$LEG/apps-script/Code.gs"
rm -f OFFLINE
node server.js "$HC" 8787 >/dev/null 2>&1 & P1=$!
node server.js "$LEG" 8788 >/dev/null 2>&1 & P2=$!
trap 'kill $P1 $P2 2>/dev/null; rm -rf "$LEG" OFFLINE' EXIT
sleep 1
node test.js
if [ -f node_modules/axe-core/axe.min.js ]; then node axe.js light; node axe.js dark; fi
