#!/usr/bin/env sh
# afterFileEdit: react-doctor on changed lines after src TS/TSX edits.
# Advisory: return immediately; run scan in background with a wall-clock cap.
. "$(dirname "$0")/lib/extract-file-path.sh"

file=$(extract_file_path) || exit 0

[ -z "$file" ] && exit 0
[ ! -f "$file" ] && exit 0

case "$file" in
  src/* | */src/*)
    case "$file" in
      *.ts | *.tsx) ;;
      *) exit 0 ;;
    esac
    ;;
  *) exit 0 ;;
esac

HOOK_TIMEOUT_SEC=60
HOOK_KILL_GRACE_SEC=5

SETSID_CMD=
if command -v setsid >/dev/null 2>&1; then
  SETSID_CMD=setsid
fi

# Process group id of a pid (empty if it cannot be read).
pgid_of() {
  ps -o pgid= -p "$1" 2>/dev/null | tr -d ' '
}

# Run the scan under a wall-clock cap. Children run in their own sessions
# (setsid; `set -m` for bash-based /bin/sh) so the watchdog can signal the
# whole pnpm/node tree by process group. Group-kill only when the child
# actually leads its own group, so we never signal this hook's own group.
run_scan() {
  [ -z "$SETSID_CMD" ] && set -m 2>/dev/null

  $SETSID_CMD pnpm run doctor \
    --verbose --scope lines --base HEAD --yes --no-score --blocking none \
    </dev/null 9>&- &
  doctor_pid=$!
  doctor_grp=
  [ "$(pgid_of "$doctor_pid")" = "$doctor_pid" ] && doctor_grp=$doctor_pid

  $SETSID_CMD sh -c '
    sleep "$1"
    [ -n "$3" ] && kill -TERM -"$3" 2>/dev/null
    kill -TERM "$4" 2>/dev/null
    sleep "$2"
    [ -n "$3" ] && kill -KILL -"$3" 2>/dev/null
    kill -KILL "$4" 2>/dev/null
  ' watchdog "$HOOK_TIMEOUT_SEC" "$HOOK_KILL_GRACE_SEC" "$doctor_grp" "$doctor_pid" </dev/null 9>&- &
  killer_pid=$!
  killer_grp=
  [ "$(pgid_of "$killer_pid")" = "$killer_pid" ] && killer_grp=$killer_pid

  wait "$doctor_pid" 2>/dev/null

  if [ -n "$killer_grp" ]; then
    kill -TERM -"$killer_grp" 2>/dev/null || kill -TERM "$killer_pid" 2>/dev/null
  else
    kill -TERM "$killer_pid" 2>/dev/null
  fi
  wait "$killer_pid" 2>/dev/null
}

LOCK_FILE="${TMPDIR:-/tmp}/json-editor-react-doctor-hook.lock"

if command -v flock >/dev/null 2>&1; then
  # flock is atomic and auto-releases on exit: no stale locks, no pid/token.
  (
    flock -n 9 || exit 0
    run_scan
  ) 9>"$LOCK_FILE" >/dev/null 2>&1 &
  exit 0
fi

# Portable fallback (no flock, e.g. stock macOS): atomic mkdir lock with
# stale reclaim via atomic rename so concurrent runs cannot delete each
# other's fresh lock.
LOCK_DIR="$LOCK_FILE.d"
LOCK_TOKEN=$$

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  lock_pid=$(cat "$LOCK_DIR/pid" 2>/dev/null) || lock_pid=
  if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
    exit 0
  fi
  stale="$LOCK_DIR.stale.$$"
  if mv "$LOCK_DIR" "$stale" 2>/dev/null; then
    rm -rf "$stale"
  fi
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    exit 0
  fi
fi

# Complete the lock synchronously so a crash before the scan starts leaves a
# dead PID the next run reclaims, not an incomplete lock that wedges the hook.
printf '%s\n' "$$" > "$LOCK_DIR/pid"
printf '%s\n' "$LOCK_TOKEN" > "$LOCK_DIR/token"

(
  trap 'if [ -f "$LOCK_DIR/token" ] && [ "$(cat "$LOCK_DIR/token" 2>/dev/null)" = "$LOCK_TOKEN" ]; then rm -rf "$LOCK_DIR"; fi' EXIT
  run_scan
) >/dev/null 2>&1 &
scan_pid=$!
current_token=$(cat "$LOCK_DIR/token" 2>/dev/null) || current_token=
if [ "$current_token" = "$LOCK_TOKEN" ]; then
  printf '%s\n' "$scan_pid" > "$LOCK_DIR/pid"
fi
exit 0