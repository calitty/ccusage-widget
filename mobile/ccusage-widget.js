// ccusage — iOS 桌面小组件 (Scriptable)
// 数据来自 Mac 定时写入的 iCloud: Scriptable/Documents/ccusage.json
// 小组件参数(长按编辑 → Parameter)可填 "claude" 或 "codex", 默认 claude

const ORANGE = "#ff7b1a", VIOLET = "#a78bfa", GREEN = "#39ff14", AMBER = "#f0b86e";
const AGENT = ((args.widgetParameter || "claude").toLowerCase() === "codex") ? "codex" : "claude";
const ACCENT = AGENT === "codex" ? VIOLET : ORANGE;

const fmt = (n) => {
  if (!n) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
};
const usd = (n) => "$" + (n || 0).toFixed(2);
const remain = (m) => (Math.floor(m / 60) > 0 ? Math.floor(m / 60) + "h " : "") + (m % 60) + "m";
const ago = (sec) => {
  const d = Math.max(0, Math.floor(Date.now() / 1000) - sec);
  if (d < 60) return d + "s前";
  if (d < 3600) return Math.floor(d / 60) + "分前";
  return Math.floor(d / 3600) + "时前";
};

async function loadData() {
  const fm = FileManager.iCloud();
  const path = fm.joinPath(fm.documentsDirectory(), "ccusage.json");
  if (!fm.fileExists(path)) return { err: "iCloud 尚未下发\nccusage.json 到手机\n\n请在 App 里点 ▶️ 运行一次" };
  try {
    if (!fm.isFileDownloaded(path)) await fm.downloadFileFromiCloud(path);
  } catch (e) { return { err: "下载失败:\n" + e.message }; }
  try {
    return { data: JSON.parse(fm.readString(path)) };
  } catch (e) { return { err: "解析失败:\n" + e.message }; }
}

function chartImage(series, hex, wpx, hpx) {
  const dc = new DrawContext();
  dc.size = new Size(wpx, hpx);
  dc.opaque = false;
  dc.respectScreenScale = true;
  const max = Math.max(...series.map((s) => s.tok), 1);
  const n = series.length, gap = 6;
  const bw = (wpx - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const bh = Math.max(4, (series[i].tok / max) * hpx);
    const p = new Path();
    p.addRoundedRect(new Rect(i * (bw + gap), hpx - bh, bw, bh), 3, 3);
    dc.addPath(p);
    dc.setFillColor(new Color(hex, i === n - 1 ? 1 : 0.3));
    dc.fillPath();
  }
  return dc.getImage();
}

function metric(w, label, tok, cost) {
  const r = w.addStack();
  r.centerAlignContent();
  const l = r.addText(label);
  l.font = Font.systemFont(10.5); l.textColor = Color.white(); l.textOpacity = 0.55;
  r.addSpacer();
  const tk = r.addText(fmt(tok));
  tk.font = Font.boldMonospacedSystemFont(14); tk.textColor = Color.white();
  r.addSpacer(10);
  const c = r.addText(usd(cost));
  c.font = Font.boldMonospacedSystemFont(12); c.textColor = new Color(ACCENT);
}

async function build() {
  const res = await loadData();
  const w = new ListWidget();
  const bg = new LinearGradient();
  bg.colors = [new Color("#101526"), new Color("#0a0c14")];
  bg.locations = [0, 1];
  w.backgroundGradient = bg;
  w.setPadding(14, 15, 14, 15);

  if (res.err) {
    const t = w.addText("⏳ 等待数据");
    t.font = Font.boldSystemFont(13); t.textColor = new Color(ORANGE);
    w.addSpacer(4);
    const t2 = w.addText(res.err);
    t2.font = Font.systemFont(10); t2.textColor = Color.white(); t2.textOpacity = 0.6;
    return w;
  }

  const data = res.data;
  const A = data[AGENT];
  const small = config.widgetFamily === "small";

  // 标题
  const head = w.addStack();
  head.centerAlignContent();
  const title = head.addText((AGENT === "codex" ? "◆ Codex" : "◆ Claude"));
  title.font = Font.boldSystemFont(11); title.textColor = new Color(ACCENT);
  head.addSpacer();
  const upd = head.addText(ago(data.updated));
  upd.font = Font.systemFont(9); upd.textColor = Color.white(); upd.textOpacity = 0.4;
  w.addSpacer(8);

  metric(w, "今日", A.today.tok, A.today.cost);
  w.addSpacer(3);
  metric(w, "近7天", A.week.tok, A.week.cost);
  if (!small) {
    w.addSpacer(3);
    metric(w, "累计", A.total.tok, A.total.cost);
    w.addSpacer(9);
    const img = w.addImage(chartImage(A.series, ACCENT, 560, 96));
    img.imageSize = new Size(280, 48);
  }

  // 5小时会话(仅 Claude)
  if (AGENT === "claude" && data.block) {
    w.addSpacer(8);
    const line = w.addStack();
    line.centerAlignContent();
    const dot = line.addText("●");
    dot.font = Font.systemFont(9); dot.textColor = new Color(GREEN);
    line.addSpacer(5);
    const st = line.addText("5小时会话 · 剩 " + remain(data.block.remainMin));
    st.font = Font.systemFont(10); st.textColor = Color.white(); st.textOpacity = 0.55;
    line.addSpacer();
    const sc = line.addText(usd(data.block.cost));
    sc.font = Font.boldMonospacedSystemFont(12); sc.textColor = new Color(AMBER);
  }

  // 每 10 分钟建议系统刷新一次
  w.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000);
  return w;
}

const widget = await build();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
