import fs from 'fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CANDS = [
  ['1 中彩网老接口JSON', 'https://jc.zhcw.com/port/client_json.php?transactionType=10001001&lotteryId=ssq&issueCount=1'],
  ['2 中彩网开奖页', 'https://www.zhcw.com/kjxx/ssq/'],
  ['3 500历史(带范围)', 'https://datachart.500.com/ssq/history/newinc/history.php?limit=12&sort=0'],
  ['4 500历史(默认)', 'https://datachart.500.com/ssq/history/newinc/history.php'],
  ['5 爱彩网开奖', 'https://kaijiang.aicai.com/ssq/'],
  ['6 爱彩网主站', 'https://www.aicai.com/kaijiang/'],
  ['7 彩神争霸', 'https://www.cp2y.com/kaijiang/ssq/'],
  ['8 起零数据(公开token)', 'https://api.istero.com/resource/v1/fucai/ssq/query?token=CDAgWQhHJGzBiDLCsfdivemXqArPUNdL'],
  ['9 福彩官网(无www http)', 'http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=1'],
  ['10 福彩官网(cwl根域)', 'https://cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=1'],
  ['11 网易彩票', 'https://caipiao.163.com/award/ssq/'],
  ['12 新浪彩票首页', 'https://caipiao.sina.com.cn/'],
  ['13 腾讯彩票', 'https://caipiao.qq.com/'],
  ['14 500开奖JSON', 'https://datachart.500.com/ssq/history/newinc/history.php?start=2026115&end=2026130'],
  ['15 中彩网列表接口', 'https://www.zhcw.com/kjxx/ssq/kjlist.jsp']
];
function decode(buf) {
  let best = buf.toString('utf8');
  try {
    const g = new TextDecoder('gbk').decode(buf);
    const cn = s => (s.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (cn(g) > cn(best)) best = g;
  } catch (e) {}
  return best;
}
const out = [];
for (const [id, url] of CANDS) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 18000);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: url }, signal: ctl.signal, redirect: 'follow' });
    const buf = Buffer.from(await r.arrayBuffer());
    const body = decode(buf);
    const nums = (body.match(/2026\d{3}/g) || []).map(Number).filter(n => n > 2026000 && n < 2026999);
    const maxIssue = nums.length ? Math.max.apply(null, nums) : null;
    out.push({ id, url, status: r.status, ms: Date.now() - t0, len: buf.length, maxIssue, head: body.slice(0, 160).replace(/\s+/g, ' ') });
  } catch (e) {
    out.push({ id, url, err: String((e && e.message) || e) });
  } finally { clearTimeout(tm); }
}
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/probe2.json', JSON.stringify({ at: new Date().toISOString(), out }, null, 2));
console.log(JSON.stringify(out, null, 2));
