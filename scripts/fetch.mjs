import fs from 'fs';
const info = { ok: false, step: '', err: '', httpStatus: '', body: '' };
try {
  info.step = 'fetch';
  const CWL = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=1';
  const url = CWL + '&callback=cb&_=' + Date.now();
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.cwl.gov.cn/' } });
  info.httpStatus = String(r.status);
  const t = await r.text();
  info.body = t.slice(0, 300);
  info.step = 'parse';
  const j = JSON.parse(t.replace(/^cb\(/, '').replace(/\)$/, ''));
  const it = j && j.result && j.result[0];
  if (!it) throw new Error('官网返回无数据');
  const reds = String(it.red).split(',').map(Number);
  const blue = Number(it.blue);
  if (reds.length !== 6 || !(blue >= 1 && blue <= 16)) throw new Error('官网数据异常');
  const dateStr = String(it.date || '');
  const out = {
    issue: String(it.code), date: dateStr.replace(/\(.*\)/, '').trim(),
    weekday: (dateStr.match(/\((.)\)/) || [])[1] || '',
    reds: reds.slice().sort((a, b) => a - b), blue: blue,
    source: 'cwl.gov.cn 福彩官网开奖接口', fetchedAt: new Date().toISOString()
  };
  fs.mkdirSync('data', { recursive: true });
  const cur = fs.existsSync('data/latest.json') ? JSON.parse(fs.readFileSync('data/latest.json', 'utf8')) : null;
  if (cur && cur.issue === out.issue) { info.ok = true; info.step = 'no-update ' + out.issue; }
  else { fs.writeFileSync('data/latest.json', JSON.stringify(out, null, 2)); info.ok = true; info.step = 'updated ' + out.issue; }
} catch (e) {
  info.err = String((e && e.message) || e);
}
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/last_error.txt', JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2));
