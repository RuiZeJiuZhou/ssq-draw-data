// 抓取双色球最新开奖 → data/latest.json
// 主源：中国福彩网官方接口（境外 IP 常被网宿 WAF 拦截，实测 403）
// 备用源：500.com 历史表（境外可达，但当前返回为页面外壳，能解析出数据行时才采用）
import fs from 'fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CWL = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?' +
  new URLSearchParams({ name: 'ssq', issueCount: '3' });
const W500 = 'https://datachart.500.com/ssq/history/newinc/history.php?limit=12';

function norm(c, date, reds, blue) {
  if (!c) return null;
  const rs = String(reds).split(',').map(Number).filter(n => n >= 1 && n <= 33);
  const b = Number(blue);
  if (rs.length !== 6 || !(b >= 1 && b <= 16)) return null;
  return {
    issue: String(c), date: String(date || ''), reds: rs.slice().sort((a, b2) => a - b2), blue: b,
    source: 'cwl.gov.cn / 500.com（GitHub Actions 抓取）', fetchedAt: new Date().toISOString()
  };
}

async function fromCwl() {
  const r = await fetch(CWL, { headers: { 'User-Agent': UA, Referer: 'https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/' } });
  if (!r.ok) throw new Error('cwl HTTP ' + r.status);
  const j = JSON.parse(await r.text());
  const it = (j.result || [])[0];
  if (!it) throw new Error('cwl 无数据');
  return norm(it.code, String(it.date || '').replace(/\s*\(.*?\)\s*/g, ''), it.red, it.blue);
}

async function from500() {
  const r = await fetch(W500, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('500 HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  let body = buf.toString('utf8');
  try {
    const g = new TextDecoder('gbk').decode(buf);
    const cn = s => (s.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (cn(g) > cn(body)) body = g;
  } catch (e) {}
  const rows = [];
  for (const tr of body.match(/<tr class="t_tr1">[\s\S]*?<\/tr>/g) || []) {
    const tds = (tr.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [])
      .map(t => t.replace(/<[^>]+>/g, '').trim());
    if (tds.length < 10) continue;
    if (!/^20\d{6}$/.test(tds[1])) continue;
    rows.push(norm(tds[1], tds[tds.length - 1], tds.slice(2, 8).join(','), tds[8]));
  }
  rows.sort((a, b) => Number(b.issue) - Number(a.issue));
  if (!rows.length) throw new Error('500 未解析出数据行');
  return rows[0];
}

const log = [];
let got = null;
for (const [name, fn] of [['cwl', fromCwl], ['500', from500]]) {
  try { got = await fn(); log.push(name + ': ok ' + (got && got.issue)); break; }
  catch (e) { log.push(name + ': 失败 ' + e.message); }
}
console.log(log.join(' | '));
if (!got) { console.log('无可用数据，本次不更新'); process.exit(0); }

fs.mkdirSync('data', { recursive: true });
const cur = fs.existsSync('data/latest.json') ? JSON.parse(fs.readFileSync('data/latest.json', 'utf8')) : null;
if (cur && cur.issue === got.issue) { console.log('期号未变 ' + got.issue + '，跳过'); process.exit(0); }
fs.writeFileSync('data/latest.json', JSON.stringify(got, null, 2));
console.log('已更新为 ' + got.issue);
