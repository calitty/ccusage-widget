// 把 ccusage 的三份 json 汇总成小组件需要的精简 payload
// 用法: node build-payload.js claude.json codex.json blocks.json  > ccusage.json
const fs = require("fs");
const [, , clp, cxp, bkp] = process.argv;
const rd = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return {}; } };

const cl = rd(clp), cx = rd(cxp), bk = rd(bkp);
const costOf = (e) => (e ? (e.totalCost != null ? e.totalCost : e.costUSD) || 0 : 0);
const dateOf = (e) => e.date || e.period;
const ld = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = ld(new Date());

function summarize(a) {
  const daily = (a && a.daily) || [];
  const by = {};
  daily.forEach((d) => { by[dateOf(d)] = d; });
  const series = [];
  let wt = 0, wc = 0;
  for (let i = 6; i >= 0; i--) {
    const ds = ld(new Date(Date.now() - i * 86400000));
    const e = by[ds];
    const tok = e ? e.totalTokens : 0, cost = e ? costOf(e) : 0;
    series.push({ d: ds, tok, cost });
    wt += tok; wc += cost;
  }
  const td = by[today];
  return {
    today: { tok: td ? td.totalTokens : 0, cost: costOf(td) },
    week: { tok: wt, cost: wc },
    total: { tok: (a && a.totals && a.totals.totalTokens) || 0, cost: costOf(a && a.totals) },
    series,
  };
}

const block = ((bk && bk.blocks) || [])[0];
let b = null;
if (block) {
  b = {
    tok: block.totalTokens,
    cost: block.costUSD,
    endTime: block.endTime,
    remainMin: Math.max(0, Math.round((new Date(block.endTime).getTime() - Date.now()) / 60000)),
  };
}

process.stdout.write(JSON.stringify({
  updated: Math.floor(Date.now() / 1000),
  date: today,
  claude: summarize(cl),
  codex: summarize(cx),
  block: b,
}));
