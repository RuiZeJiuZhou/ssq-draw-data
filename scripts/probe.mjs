import fs from 'fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CANDS = [
  { id: 'A 福彩官网JSON', url: 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=3', headers: { 'User-Agent': UA, Referer: 'https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/' } },
  { id: 'B 福彩官网JSON(无Referer)', url: 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=3', headers: { 'User-Agent': UA } },
  { id: 'C 500历史表', url: 'https://datachart.500.com/ssq/history/newinc/history.php?limit=3', headers: { 'User-Agent': UA } },
  { id: 'D 500开奖页', url: 'https://kaijiang.500.com/ssq.shtml', headers: { 'User-Agent': UA } },
  { id: 'E 中彩网开奖', url: 'https://www.zhcw.com/kjxx/ssq/', headers: { 'User-Agent': UA } },
  { id: 'F 网易彩票', url: 'https://caipiao.163.com/award/ssq/', headers: { 'User-Agent': UA } },
  { id: 'G 福彩官网HTML', url: 'https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/', headers: { 'User-Agent': UA } },
  { id: 'H 新浪彩票', url: 'https://match.lottery.sina.com.cn/lotto/pc_zst/getTrendPage?lottoType=ssq', headers: { 'User-Agent': UA } }
];
function decode(buf) {
  for (const enc of ['utf-8', 'gbk']) {
    try {
      const t = new TextDecoder(enc, { fatal: false }).decode(buf);
      if (/[\u4e00-\u9fa5]/.test(t)) return t;
    } catch (e) {}
  }
  return buf.toString('utf8');
}
const out = [];
for (const c of CANDS) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 20000);
  const t0 = Date.now();
  try {
    const r = await fetch(c.url, { headers: c.headers, signal: ctl.signal, redirect: 'follow' });
    const buf = Buffer.from(await r.arrayBuffer());
    const body = decode(buf);
    const issues = (body.match(/20\d{6}/g) || []).slice(0, 3);
    out.push({ id: c.id, status: r.status, ms: Date.now() - t0, len: buf.length, issues, head: body.slice(0, 150).replace(/\s+/g, ' ') });
  } catch (e) {
    out.push({ id: c.id, err: String((e && e.message) || e) });
  } finally { clearTimeout(tm); }
}
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/probe.json', JSON.stringify({ at: new Date().toISOString(), out }, null, 2));
console.log(JSON.stringify(out, null, 2));
