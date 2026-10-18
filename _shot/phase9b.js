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
    await page.evaluate(() => App.switchTab('customer'));
    await page.waitForTimeout(1800);
    // 注入客户行（假数据）让表格有内容
    await page.evaluate(() => {
      let t = document.querySelector('.dt-table');
      if (!t) return;
      const tb = t.querySelector('tbody');
      if (tb && !tb.children.length) {
        const rows = [['杭州优品贸易有限公司','我的客户','12000.00','5000.00','2000.00','王经理','详情'],['上海生物医药科技','我的客户','8000.00','3000.00','1000.00','李经理','详情'],['深圳前海供应链','公海客户','15000.00','6000.00','3000.00','陈总','详情'],['北京云图文化','我的客户','6000.00','2000.00','800.00','赵经理','详情'],['广州南方制造','废弃客户','900.00','0.00','0.00','周总','详情'],['成都天府信息','我的客户','3200.00','1500.00','400.00','吴经理','详情']];
        tb.innerHTML = rows.map(r => '<tr class="tr-click">' + r.map((c,i) => i===r.length-1 ? '<td class="td-ops"><span class="dt-link">'+c+'</span></td>' : (i===0?'<td><div class="td-strong">'+c+'</div></td>':'<td>'+c+'</td>')).join('') + '</tr>').join('');
      }
    });
    await page.waitForTimeout(500);
    const a = await page.evaluate(() => {
      const q=s=>document.querySelector(s); const cs=s=>q(s)?getComputedStyle(q(s)):null;
      return {
        tableCount: document.querySelectorAll('.dt-table').length,
        theadCols: q('.dt-table thead') ? q('.dt-table thead').querySelectorAll('th').length : null,
        rowCount: q('.dt-table tbody') ? q('.dt-table tbody').querySelectorAll('tr').length : null,
        firstTdDisp: cs('.dt-table tbody td') ? cs('.dt-table tbody td').display : null,
        tbTd: cs('.dt-table tbody td') ? cs('.dt-table tbody td').fontSize : null,
        tbTdPad: cs('.dt-table tbody td') ? cs('.dt-table tbody td').padding : null,
        colsLayout: cs('.dt-cols') ? cs('.dt-cols').gridTemplateColumns : null,
        hasMobileGrid: !!q('.m-grid'),
        hasDtQuick: !!q('.dt-quick'),
        dtQuickBtns: document.querySelectorAll('.dt-quick-btn').length,
        // 侧栏/顶栏
        sidebarDisp: cs('.sidebar') ? cs('.sidebar').display : null,
        mAppbar: cs('.m-appbar') ? cs('.m-appbar').display : null,
        device: document.documentElement.getAttribute('data-device'),
      };
    });
    console.log('W'+w+' customer '+JSON.stringify(a));
    await page.screenshot({ path: 'w'+w+'_customer.png' });
    // 也截首页
    await page.evaluate(() => App.switchTab('home'));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'w'+w+'_home.png' });
    await ctx.close();
  }
  await browser.close();
  console.log('PHASE9B_DONE');
})().catch(e => { console.error(e); process.exit(1); });
