import fs from 'fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const B = 'https://jc.zhcw.com/port/client_json.php';
const out = [];
for (const issue of ['2026122', '2026123']) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 20000);
  const t0 = Date.now();
  try {
    const r = await fetch(B + '?transactionType=10001002&lotteryId=1&issue=' + issue, {
      headers: { 'User-Agent': UA, Referer: 'https://www.zhcw.com/kjxx/ssq/' }, signal: ctl.signal
    });
    const t = await r.text();
    out.push({ issue, status: r.status, ms: Date.now() - t0, len: t.length, body: t.slice(0, 600) });
  } catch (e) {
    out.push({ issue, err: String((e && e.message) || e), ms: Date.now() - t0 });
  } finally { clearTimeout(tm); }
}
// 同时确认 raw.githubusercontent 在 runner 上可读（用于自检）
try {
  const r = await fetch('https://raw.githubusercontent.com/RuiZeJiuZhou/ssq-draw-data/main/data/latest.json');
  out.push({ raw: r.status });
} catch (e) { out.push({ rawErr: String(e.message || e) }); }
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/probe3.json', JSON.stringify({ at: new Date().toISOString(), out }, null, 2));
console.log(JSON.stringify(out, null, 2));
