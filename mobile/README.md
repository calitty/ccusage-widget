# iOS 桌面小组件 (Scriptable + iCloud)

在 iPhone 桌面显示 Claude Code / Codex 用量。原理:Mac 定时把 `ccusage` 结果写进 Scriptable 的 iCloud 文件夹,手机小组件读取渲染。**无需服务器、无需上架、免签名。**

```
Mac (有日志) ──launchd每5分钟──▶ iCloud/Scriptable/ccusage.json ──▶ iPhone 小组件
```

## 安装步骤

### 1. iPhone 装 Scriptable
App Store 搜 **Scriptable**(免费),装好**打开一次**让它创建 iCloud 文件夹,并确保 iPhone 已登录 iCloud、开启 iCloud Drive。

### 2. Mac 启动定时导出
Mac 与 iPhone 需登录**同一 Apple ID**。然后:

```bash
bash ~/ccusage-widget/mobile/setup-mac.sh
```

这会装一个 launchd 任务,每 5 分钟跑一次 `mac-export.sh`,把精简 JSON 写进
`~/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/ccusage.json`。

验证:`tail -f /tmp/ccusage-export.log` 应看到 `✅ 写入 …`。

### 3. iPhone 导入小组件脚本
- 把 `ccusage-widget.js` 内容拷进 Scriptable(新建脚本粘贴,或用「文件」App 放进 Scriptable 文件夹)
- 命名为 **ccusage**

### 4. 加到桌面
- 桌面长按 → 加小组件 → 选 **Scriptable** → 选中/大号
- 长按该小组件 → 编辑小组件 → **Script** 选 `ccusage`
- **Parameter** 填 `claude` 或 `codex`(留空默认 claude)

## 说明

- **两端同一 Apple ID + 开 iCloud Drive** 是硬前提,靠 iCloud 同步那个 json。
- **刷新频率**:Mac 每 5 分钟导出;iOS 小组件刷新由系统调度(通常几分钟~十几分钟一次),脚本里建议了 10 分钟。手机上的数字会略滞后,属正常。
- **数据仍是本地的**:只统计**这台 Mac** 的用量,不含手机、不含其他电脑。
- **想要动画呼吸灯?** iOS 小组件是静态快照,不支持动画,所以是常亮绿点。
- **改样式**:颜色在 `ccusage-widget.js` 顶部常量。
