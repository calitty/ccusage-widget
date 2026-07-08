#!/usr/bin/env bash
# Mac 端: 跑 ccusage, 生成精简 json, 写进 Scriptable 的 iCloud 文件夹
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
HERE="$(cd "$(dirname "$0")" && pwd)"

# Scriptable 的 iCloud Documents 目录(装了 Scriptable 并同步后才会出现)
DEST_DIR="$HOME/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents"
if [ ! -d "$DEST_DIR" ]; then
  echo "找不到 Scriptable iCloud 目录:" >&2
  echo "  $DEST_DIR" >&2
  echo "请先在 iPhone 安装 Scriptable 并打开一次, 等 iCloud 同步后再运行。" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ccusage claude --json 2>/dev/null > "$TMP/cl.json" || true
ccusage codex  --json 2>/dev/null > "$TMP/cx.json" || true
ccusage blocks --active --json 2>/dev/null > "$TMP/bk.json" || true
[ -s "$TMP/cl.json" ] || echo '{"daily":[],"totals":{}}' > "$TMP/cl.json"
[ -s "$TMP/cx.json" ] || echo '{"daily":[],"totals":{}}' > "$TMP/cx.json"
[ -s "$TMP/bk.json" ] || echo '{"blocks":[]}'            > "$TMP/bk.json"

node "$HERE/build-payload.js" "$TMP/cl.json" "$TMP/cx.json" "$TMP/bk.json" > "$DEST_DIR/ccusage.json"
echo "$(date '+%H:%M:%S') ✅ 写入 $DEST_DIR/ccusage.json ($(wc -c < "$DEST_DIR/ccusage.json") bytes)"
