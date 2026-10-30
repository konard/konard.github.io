#!/usr/bin/env bash
# Run existing browser contracts sequentially; keep evidence outside old case studies.
set -u
engines=("$@")
if (( ${#engines[@]} == 0 )); then engines=(chromium firefox); fi
log_dir=docs/case-studies/issue-41/logs
mkdir -p "$log_dir"
failed=0
for ENGINE in "${engines[@]}"; do
  export ENGINE
  for suite in browser issue19 issue21 issue23 issue25 issue27 issue29 issue35 issue37; do
    export CAPTURE_DIR="browser-results/local/$ENGINE/$suite/screenshots"
    export RESULT_DIR="browser-results/local/$ENGINE/$suite/data"
    log="$log_dir/legacy-$ENGINE-$suite.log"
    mkdir -p "$CAPTURE_DIR" "$RESULT_DIR"
    if [[ "$suite" == issue23 ]]; then
      export XWD_FILE="$PWD/browser-results/local/$ENGINE/$suite/display/Xvfb_screen0"
      mkdir -p "$(dirname "$XWD_FILE")"
      xvfb-run -a -s "-screen 0 1600x1200x24 -fbdir $(dirname "$XWD_FILE")" npm run "test:network:$suite" > "$log" 2>&1
      status=$?
      unset XWD_FILE
    else
      npm run "test:network:$suite" > "$log" 2>&1
      status=$?
    fi
    printf '%s %s: exit %s\n' "$ENGINE" "$suite" "$status"
    if (( status != 0 )); then failed=1; fi
  done
done
exit "$failed"
