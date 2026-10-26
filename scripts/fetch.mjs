import fs from 'fs';
const CWL = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=1';
const url = CWL + '&callback=cb&_=' + Date.now();
const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.cwl.gov.cn/' } });
const t = await r.text();
const j = JSON.parse(t.replace(/^cb\(/, '').replace(/\)$/, ''));
const it = j && j.result && j.result[0];
if (!it) throw new Error('官网返回无数据');
const reds = String(it.red).split(',').map(Number);
const blue = Number(it.blue);
if (reds.length !== 6 || !(blue >= 1 && blue <= 16)) throw new Error('官网数据异常');
const dateStr = String(it.date || '');
const out = {
  issue: String(it.code),
  date: dateStr.replace(/\(.*\)/, '').trim(),
  weekday: (dateStr.match(/\((.)\)/) || [])[1] || '',
  reds: reds.slice().sort((a, b) => a - b),
  blue: blue,
  source: 'cwl.gov.cn 福彩官网开奖接口',
  fetchedAt: new Date().toISOString()
};
fs.mkdirSync('data', { recursive: true });
const cur = fs.existsSync('data/latest.json') ? JSON.parse(fs.readFileSync('data/latest.json', 'utf8')) : null;
if (cur && cur.issue === out.issue) { console.log('无更新，仍为 ' + out.issue); process.exit(0); }
fs.writeFileSync('data/latest.json', JSON.stringify(out, null, 2));
console.log('已写入 ' + out.issue + ' ' + out.date + '  ' + out.reds.join(' ') + ' + ' + out.blue);
