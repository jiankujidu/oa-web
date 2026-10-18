const { chromium } = require('playwright-core');
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  for (const w of [1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 1440 ? 900 : 1080 }, isMobile: false });
    await ctx.addInitScript(() => localStorage.setItem('uping_user','1'));
    await ctx.route('**/upingbio.cn/**', r => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({code:0,data:[],total:0,msg:'ok'}) }));
    const page = await ctx.newPage();
    await page.goto('http://localhost:8123/index.html', { waitUntil:'networkidle' });
    await page.waitForTimeout(2600);

    // 首页：KPI/侧栏
    const home = await page.evaluate(() => {
      const q = s => document.querySelector(s);
      const cs = s => q(s) ? getComputedStyle(q(s)) : null;
      return {
        topbarH: cs('.topbar') ? cs('.topbar').height : null,
        sbItemH: cs('.sb-item') ? cs('.sb-item').height : null,
        sbItemW: q('.sidebar') ? q('.sidebar').getBoundingClientRect().width : null,
        kpiNum: cs('.dt-kpi-num') ? cs('.dt-kpi-num').fontSize : null,
        kpiCardPad: cs('.dt-kpi-card') ? cs('.dt-kpi-card').padding : null,
        kpiMaxW: cs('.dt-kpi') ? cs('.dt-kpi').maxWidth : null,
        kpiW: q('.dt-kpi') ? q('.dt-kpi').getBoundingClientRect().width : null,
        mainColW: q('.main-col') ? q('.main-col').getBoundingClientRect().width : null,
        pageContainerW: q('.page-container') ? q('.page-container').getBoundingClientRect().width : null,
      };
    });
    console.log('W'+w+' home '+JSON.stringify(home));
    await page.screenshot({ path: 'w'+w+'_home.png' });

    // 列表页
    await page.evaluate(() => App.switchTab('customer'));
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      let t = document.querySelector('.dt-table');
      if (!t) return;
      const tb = t.querySelector('tbody');
      if (tb && !tb.children.length) {
        const rows = [['杭州优品贸易有限公司','王磊','13800001111','VIP','合作中'],['上海生物医药科技','李娜','13900002222','A','待跟进'],['深圳前海供应链','陈强','13700003333','B','合作中'],['北京云图文化','赵敏','13600004444','VIP','已停用'],['广州南方制造','周杰','13500005555','A','待跟进'],['成都天府信息','吴桐','13400006666','B','合作中']];
        tb.innerHTML = rows.map(r => '<tr class="tr-click">'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('');
      }
    });
    await page.waitForTimeout(400);
    const list = await page.evaluate(() => {
      const q = s => document.querySelector(s);
      const cs = s => q(s) ? getComputedStyle(q(s)) : null;
      return {
        tbTh: cs('.dt-table thead th') ? cs('.dt-table thead th').fontSize : null,
        tbTd: cs('.dt-table tbody td') ? cs('.dt-table tbody td').fontSize : null,
        tbTdPad: cs('.dt-table tbody td') ? cs('.dt-table tbody td').padding : null,
        firstTdDisp: cs('.dt-table tbody td') ? cs('.dt-table tbody td').display : null,
        theadCols: q('.dt-table thead') ? q('.dt-table thead').querySelectorAll('th').length : null,
        rowCount: q('.dt-table tbody') ? q('.dt-table tbody').querySelectorAll('tr').length : null,
        tableMaxW: cs('.dt-table-wrap') ? cs('.dt-table-wrap').maxWidth : null,
        tableW: q('.dt-table-wrap') ? q('.dt-table-wrap').getBoundingClientRect().width : null,
      };
    });
    console.log('W'+w+' list '+JSON.stringify(list));
    await page.screenshot({ path: 'w'+w+'_customer.png' });
    await ctx.close();
  }
  await browser.close();
  console.log('PHASE9_DONE');
})().catch(e => { console.error(e); process.exit(1); });
