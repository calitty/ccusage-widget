#!/usr/bin/env bash
# 在 Mac 上装一个 launchd 定时任务, 每 5 分钟导出一次 ccusage 到 iCloud
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.ccusage.export.plist"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.ccusage.export</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$HERE/mac-export.sh</string>
  </array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>/tmp/ccusage-export.log</string>
  <key>StandardErrorPath</key><string>/tmp/ccusage-export.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "✅ 定时任务已加载 (每5分钟). 查看日志: tail -f /tmp/ccusage-export.log"
echo "   停止: launchctl unload \"$PLIST\""
