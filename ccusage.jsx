// Claude Code + Codex token 消耗桌面卡片 — 液态玻璃 · 霓虹科技风
// Tab 切换 agent; 今日 / 近7天 / 累计 + 7天趋势图; Claude 另加 5小时会话(燃烧速率 + 窗口预测 + LIVE)
// 数据源: ccusage (读本地日志, 不调 API)

export const refreshFrequency = 15000; // 15s 刷新(会话/速率变化较快)

export const command = `
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
  CL=$(ccusage claude --json 2>/dev/null); [ -z "$CL" ] && CL='{"daily":[],"totals":{}}'
  CX=$(ccusage codex --json 2>/dev/null);  [ -z "$CX" ] && CX='{"daily":[],"totals":{}}'
  BK=$(ccusage blocks --active --json 2>/dev/null); [ -z "$BK" ] && BK='{"blocks":[]}'
  printf '{"claude":%s,"codex":%s,"block":%s}' "$CL" "$CX" "$BK"
`;

// 外层只做定位锚点
export const className = `
  top: 24px;
  right: 24px;
  font-family: -apple-system, "SF Pro Display", sans-serif;
`;

const NUM = 'ui-monospace, "SF Mono", Menlo, monospace';
const COLORS = { claude: "#ff7b1a", codex: "#a78bfa" }; // 热橙 / 霓虹紫
const GLOW = (c, a = 0.3) => `0 0 6px ${c}${Math.round(a * 255).toString(16).padStart(2, "0")}`;

// 动画关键帧 + 液态玻璃层
const KEYFRAMES = `
  @keyframes cc-float1 { 0%{transform:translate(0,0)} 50%{transform:translate(26px,20px)} 100%{transform:translate(0,0)} }
  @keyframes cc-float2 { 0%{transform:translate(0,0)} 50%{transform:translate(-22px,-18px)} 100%{transform:translate(0,0)} }
  @keyframes cc-hue    { to { filter: hue-rotate(360deg); } }
  @keyframes cc-pulse  { 0%,100%{opacity:1;box-shadow:0 0 6px #34e6c8} 50%{opacity:.35;box-shadow:0 0 2px #34e6c8} }
`;

// ---- 拖动 ----
const OFF_KEY = "ccusage-card-offset";
const loadOffset = () => { try { return JSON.parse(localStorage.getItem(OFF_KEY)) || { x: 0, y: 0 }; } catch (e) { return { x: 0, y: 0 }; } };
const startDrag = (e) => {
  const card = e.currentTarget;
  const o = loadOffset();
  const sx = e.clientX, sy = e.clientY;
  card.style.cursor = "grabbing";
  const move = (ev) => { card.style.transform = `translate(${o.x + ev.clientX - sx}px, ${o.y + ev.clientY - sy}px)`; };
  const up = (ev) => {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
    card.style.cursor = "grab";
    localStorage.setItem(OFF_KEY, JSON.stringify({ x: o.x + ev.clientX - sx, y: o.y + ev.clientY - sy }));
  };
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
};

// ---- Tab 切换(点击直接改 DOM 显隐) ----
const AGENT_KEY = "ccusage-agent";
const getAgent = () => { try { return localStorage.getItem(AGENT_KEY) || "claude"; } catch (e) { return "claude"; } };
const switchAgent = (a) => (e) => {
  e.stopPropagation();
  try { localStorage.setItem(AGENT_KEY, a); } catch (err) {}
  document.querySelectorAll("[data-ccagent]").forEach((el) => { el.style.display = el.getAttribute("data-ccagent") === a ? "block" : "none"; });
  document.querySelectorAll("[data-cctab]").forEach((el) => {
    const on = el.getAttribute("data-cctab") === a;
    el.style.background = on ? COLORS[a] : "transparent";
    el.style.color = on ? "#08111a" : "rgba(255,255,255,0.65)";
    el.style.fontWeight = on ? "700" : "500";
    el.style.boxShadow = on ? GLOW(COLORS[a], 0.35) : "none";
  });
};

// ---- 格式化 ----
const fmt = (n) => {
  if (!n) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
};
const usd = (n) => "$" + (n || 0).toFixed(2);
const usd0 = (n) => "$" + Math.round(n || 0);
const costOf = (e) => (e ? (e.totalCost != null ? e.totalCost : e.costUSD) || 0 : 0);
const dateOf = (e) => e.date || e.period;
const localDate = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// 近7天趋势图
const Chart = ({ series, color }) => {
  const max = Math.max(...series.map((d) => d.tok), 1);
  return (
    <div>
      <div style={{ fontSize: 9, opacity: 0.4, letterSpacing: 2, marginBottom: 5 }}>近7天趋势</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 38 }}>
        {series.map((d, i) => {
          const h = Math.max(3, (d.tok / max) * 38);
          const isToday = i === series.length - 1;
          return (
            <div key={d.date} title={`${d.date}: ${fmt(d.tok)} / ${usd(d.cost)}`}
              style={{
                flex: 1, height: h, borderRadius: 3,
                background: isToday ? color : `linear-gradient(${color}55, ${color}18)`,
                boxShadow: isToday ? GLOW(color, 0.4) : "none",
              }} />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 3 }}>
        {series.map((d) => (
          <span key={d.date} style={{ flex: 1, textAlign: "center", fontSize: 8, opacity: 0.32, fontFamily: NUM }}>{d.date.slice(8)}</span>
        ))}
      </div>
    </div>
  );
};

// 指标行
const Metric = ({ label, sub, tokens, cost, color }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "5px 0" }}>
    <span style={{ fontSize: 11, opacity: 0.55, minWidth: 84 }}>
      {label}{sub ? <span style={{ opacity: 0.6, marginLeft: 6 }}>{sub}</span> : null}
    </span>
    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: NUM }}>{tokens}</span>
    <span style={{ fontSize: 12.5, fontWeight: 600, color, minWidth: 66, textAlign: "right", fontFamily: NUM }}>{cost}</span>
  </div>
);

export const render = ({ output, error }) => {
  if (error) return <div style={{ fontSize: 12, opacity: 0.7 }}>加载失败: {String(error)}</div>;
  let data;
  try { data = JSON.parse(output); } catch (e) { return <div style={{ fontSize: 12, opacity: 0.7 }}>等待 ccusage 数据…</div>; }

  const t = localDate(new Date());
  const summarize = (a) => {
    const daily = (a && a.daily) || [];
    const byDate = {};
    daily.forEach((d) => { byDate[dateOf(d)] = d; });
    const today = byDate[t];
    let wTok = 0, wCost = 0;
    const series = [];
    for (let i = 6; i >= 0; i--) {
      const ds = localDate(new Date(Date.now() - i * 86400000));
      const e = byDate[ds];
      const tok = e ? e.totalTokens : 0, cost = e ? costOf(e) : 0;
      series.push({ date: ds, tok, cost });
      wTok += tok; wCost += cost;
    }
    return {
      today: { tok: today ? today.totalTokens : 0, cost: costOf(today) },
      week: { tok: wTok, cost: wCost },
      total: { tok: (a && a.totals && a.totals.totalTokens) || 0, cost: costOf(a && a.totals) },
      series,
    };
  };

  const cl = summarize(data.claude);
  const cx = summarize(data.codex);
  const block = ((data.block && data.block.blocks) || [])[0];

  let remainTxt = "无活动会话", burn = null, proj = null;
  if (block) {
    const mins = Math.max(0, Math.round((new Date(block.endTime).getTime() - Date.now()) / 60000));
    remainTxt = "剩 " + (Math.floor(mins / 60) > 0 ? Math.floor(mins / 60) + "h " : "") + (mins % 60) + "m";
    if (block.burnRate) burn = { ch: block.burnRate.costPerHour, tpm: block.burnRate.tokensPerMinute };
    if (block.projection) proj = { cost: block.projection.totalCost, tok: block.projection.totalTokens };
  }

  const cur = getAgent();
  const off = loadOffset();
  const tabStyle = (a) => ({
    flex: 1, textAlign: "center", fontSize: 12, padding: "5px 0", borderRadius: 8, cursor: "pointer",
    background: cur === a ? COLORS[a] : "transparent",
    color: cur === a ? "#08111a" : "rgba(255,255,255,0.65)",
    fontWeight: cur === a ? 700 : 500,
    boxShadow: cur === a ? GLOW(COLORS[a], 0.35) : "none",
  });

  const rootStyle = {
    position: "relative", overflow: "hidden", width: 272, borderRadius: 20,
    color: "#fff", cursor: "grab", userSelect: "none",
    background: "linear-gradient(145deg, rgba(16,20,34,0.82), rgba(10,12,20,0.78))",
    backdropFilter: "blur(30px) saturate(180%) brightness(1.05)",
    WebkitBackdropFilter: "blur(30px) saturate(180%) brightness(1.05)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
  };
  const blob = (c, pos, anim) => ({
    position: "absolute", width: 150, height: 150, borderRadius: "50%",
    background: `radial-gradient(circle, ${c}, transparent 70%)`,
    filter: "blur(46px)", opacity: 0.26, pointerEvents: "none", animation: `${anim} 16s ease-in-out infinite`, ...pos,
  });

  return (
    <div onMouseDown={startDrag} style={{ ...rootStyle, transform: `translate(${off.x}px, ${off.y}px)` }}>
      <style>{KEYFRAMES}</style>

      {/* 液态玻璃: 漂浮霓虹光斑 */}
      <div style={blob(COLORS.claude, { top: -50, right: -40 }, "cc-float1")} />
      <div style={blob(COLORS.codex, { bottom: -60, left: -50 }, "cc-float2")} />
      {/* 顶部高光 */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(rgba(255,255,255,0.14), transparent)", pointerEvents: "none" }} />
      {/* 旋转变色的霓虹描边 */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 20, padding: 1.2, pointerEvents: "none",
        background: "conic-gradient(from 0deg, #ff7b1a, #a78bfa, #ec4899, #ff7b1a)",
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor", maskComposite: "exclude",
        opacity: 0.5, animation: "cc-hue 9s linear infinite",
      }} />

      {/* 内容 */}
      <div style={{ position: "relative", zIndex: 2, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, opacity: 0.9 }}>⛁ 用量总览</span>
          <span style={{ fontSize: 9, opacity: 0.4, fontFamily: NUM }}>{t}</span>
        </div>

        {/* Tab */}
        <div onMouseDown={(e) => e.stopPropagation()} style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 3 }}>
          <div data-cctab="claude" onClick={switchAgent("claude")} style={tabStyle("claude")}>Claude</div>
          <div data-cctab="codex" onClick={switchAgent("codex")} style={tabStyle("codex")}>Codex</div>
        </div>

        {/* Claude 面板 */}
        <div data-ccagent="claude" style={{ display: cur === "claude" ? "block" : "none", marginTop: 8 }}>
          <Metric label="今日" tokens={fmt(cl.today.tok)} cost={usd(cl.today.cost)} color={COLORS.claude} />
          <Metric label="近7天" tokens={fmt(cl.week.tok)} cost={usd(cl.week.cost)} color={COLORS.claude} />
          <Metric label="累计" tokens={fmt(cl.total.tok)} cost={usd(cl.total.cost)} color={COLORS.claude} />
          <div style={{ margin: "8px 0 6px" }}><Chart series={cl.series} color={COLORS.claude} /></div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "8px 0 6px" }} />

          {/* 5小时会话 + LIVE */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, letterSpacing: 1, opacity: 0.5, display: "flex", alignItems: "center" }}>
              {block ? <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: "#34e6c8", marginRight: 7, animation: "cc-pulse 1.6s ease-in-out infinite" }} /> : null}
              5小时会话 · {remainTxt}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: NUM, color: "#f0b86e" }}>
              {block ? usd(block.costUSD) : "$0.00"}
            </span>
          </div>
        </div>

        {/* Codex 面板 */}
        <div data-ccagent="codex" style={{ display: cur === "codex" ? "block" : "none", marginTop: 8 }}>
          <Metric label="今日" tokens={fmt(cx.today.tok)} cost={usd(cx.today.cost)} color={COLORS.codex} />
          <Metric label="近7天" tokens={fmt(cx.week.tok)} cost={usd(cx.week.cost)} color={COLORS.codex} />
          <Metric label="累计" tokens={fmt(cx.total.tok)} cost={usd(cx.total.cost)} color={COLORS.codex} />
          <div style={{ margin: "8px 0 6px" }}><Chart series={cx.series} color={COLORS.codex} /></div>
          <div style={{ fontSize: 9, opacity: 0.35, marginTop: 2 }}>Codex 无 5 小时会话窗口</div>
        </div>
      </div>
    </div>
  );
};
