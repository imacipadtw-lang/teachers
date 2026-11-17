#!/bin/bash
# Mirror this project into the shared GitHub repo imacipadtw-lang/teachers (folder lunch-box-lab/), commit and push.
# Run it after every change that passed the tests (and, if the app changed, after publishing the Claude preview page).
#   bash sync_github.sh "short message"
# Needs a clone of the repo at $LBL_REPO (default /home/user/teachers, branch index.html) and a built app at $LBL_OUT
# (default /home/user/lunch-box-lab.html; run python3 build.py first). Repo rules: see CLAUDE.md in that repo.
SRC="$(cd "$(dirname "$0")" && pwd)"
REPO="${LBL_REPO:-/home/user/teachers}"
BUILT="${LBL_OUT:-$(dirname "$SRC")/lunch-box-lab.html}"
DEST="$REPO/lunch-box-lab"
msg="${1:-Update Lunch Box Lab}"
[ -d "$REPO/.git" ] || { echo "sync_github: no clone at $REPO (git clone --depth 1 https://github.com/imacipadtw-lang/teachers $REPO)"; exit 1; }
[ -f "$BUILT" ] || { echo "sync_github: $BUILT not found, run python3 build.py first"; exit 1; }
# 1) mirror the source (no node_modules, test screenshots, caches, old clip backups, local git data)
mkdir -p "$DEST" && find "$DEST" -mindepth 1 -delete
(cd "$SRC" && tar --exclude=.git --exclude=node_modules --exclude=__pycache__ --exclude='tests/*.png' --exclude=voice-raw/old -cf - .) | tar -xf - -C "$DEST"
python3 "$SRC/make_pages.py" "$DEST/index.html" "$BUILT" >/dev/null || exit 1
# 2) commit
cd "$REPO" || exit 1
git add -A lunch-box-lab
if git diff --cached --quiet; then echo "sync_github: nothing to commit"; else
  git commit -q -m "lunch-box-lab: $msg" -m "Co-Authored-By: Claude <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y1Z5KPr2GK2TzZ5amQzVQH" || { echo "sync_github: commit failed"; exit 1; }
  echo "sync_github: committed: $msg"
fi
# 3) rebase on the newest remote (other sessions push here too) and push; retry only on network trouble
branch=$(git rev-parse --abbrev-ref HEAD)
for wait in 0 2 4 8 16; do
  sleep "$wait"
  if git pull --rebase --autostash -q origin "$branch"; then
    if git -c push.negotiate=true push -q -u origin "$branch"; then
      echo "sync_github: pushed to GitHub ($branch) -> https://imacipadtw-lang.github.io/teachers/lunch-box-lab/"; exit 0
    fi
  fi
done
echo "sync_github: push failed after retries (commit is kept locally in $REPO)"; exit 1
