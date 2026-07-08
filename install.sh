#!/usr/bin/env bash
# ccusage 桌面卡片 —— 一键安装 (macOS)
# 用法: bash install.sh
set -e

echo "==> 1/4 检查 Homebrew"
if ! command -v brew >/dev/null 2>&1; then
  echo "未装 Homebrew, 正在安装…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "==> 2/4 安装 Übersicht + node"
brew list --cask ubersicht >/dev/null 2>&1 || brew install --cask ubersicht
command -v node >/dev/null 2>&1 || brew install node

echo "==> 3/4 全局安装 ccusage"
command -v ccusage >/dev/null 2>&1 || npm i -g ccusage

echo "==> 4/4 部署 widget"
DIR="$HOME/Library/Application Support/Übersicht/widgets"
mkdir -p "$DIR"
cp "$(dirname "$0")/ccusage.jsx" "$DIR/ccusage.jsx"

open -a "Übersicht"
echo "✅ 完成! 若看不到卡片: 点菜单栏 Übersicht 图标 → Refresh All Widgets"
