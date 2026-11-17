#!/bin/bash
# Runs every regression suite against the built file (default /home/user/lunch-box-lab.html; set LBL_URL=file:///path/to/file.html to test another build). Exit code 1 if anything fails.
cd "$(dirname "$0")"
fail=0
for t in classes leaks axe nostore voice review3 full pack speed wheel soak stamps review4; do
  out=$(node $t.js 2>&1)
  if echo "$out" | grep -qE "FAIL|Error:|TimeoutError|ERR \[ '|ERRORS \[ '|^overflow"; then
    echo "== $t FAILED"; echo "$out" | tail -15; fail=1
  else
    echo "== $t ok"
  fi
done
exit $fail
