// 10. 线上双宽屏实测（1440 + 1920）：宽屏 CSS + 双栏客户页 + 字号收紧
const { chromium } = require('playwright-core');
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  for (const w of [1440, 1920]) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: w === 1440 ? 900 : 1080 }, isMobile: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    });
    // 线上：不拦截任何请求，用真实账号登录态 + 真实数据
    await ctx.addInitScript(() => { try { localStorage.setItem('uping_user','1'); } catch(e){} });
    const page = await ctx.newPage();
    await page.goto('https://oa.jk93.qzz.io/index.html', { waitUntil:'networkidle', timeout: 30000 });
    await page.waitForTimeout(2600);
    // 首页：宽屏 KPI / 侧栏 / 内容区居中
    const h = await page.evaluate(() => {
      const q=s=>document.querySelector(s); const cs=s=>q(s)?getComputedStyle(q(s)):null;
      return {
        device: document.documentElement.getAttribute('data-device'),
        kpi: document.querySelectorAll('.dt-kpi-card').length,
        kpiMaxW: cs('.dt-kpi')?cs('.dt-kpi').maxWidth:null,
        kpiNum: cs('.dt-kpi-num')?cs('.dt-kpi-num').fontSize:null,
        topbarH: cs('.topbar')?cs('.topbar').height:null,
        sbItemH: cs('.sb-item')?cs('.sb-item').height:null,
        mainColW: q('.main-col')?q('.main-col').getBoundingClientRect().width:null,
        mAppbar: cs('.m-appbar')?cs('.m-appbar').display:null,
        mTabbar: cs('.m-tabbar')?cs('.m-tabbar').display:null,
      };
    });
    console.log('W'+w+' home '+JSON.stringify(h));
    await page.screenshot({ path: 'live_w'+w+'_home.png' });
    // 客户页：双栏后台
    await page.evaluate(() => App.switchTab('customer'));
    await page.waitForTimeout(2200);
    const c = await page.evaluate(() => {
      const q=s=>document.querySelector(s); const cs=s=>q(s)?getComputedStyle(q(s)):null;
      return {
        tableCount: document.querySelectorAll('.dt-table').length,
        theadCols: q('.dt-table thead')?q('.dt-table thead').querySelectorAll('th').length:null,
        rowCount: q('.dt-table tbody')?q('.dt-table tbody').querySelectorAll('tr').length:null,
        firstTdDisp: cs('.dt-table tbody td')?cs('.dt-table tbody td').display:null,
        colsLayout: cs('.dt-cols')?cs('.dt-cols').gridTemplateColumns:null,
        hasMobileGrid: !!q('.m-grid'),
        hasOldGrid: !!q('.grid'),
        dtQuickBtns: document.querySelectorAll('.dt-quick-btn').length,
        mAppbar: cs('.m-appbar')?cs('.m-appbar').display:null,
      };
    });
    console.log('W'+w+' customer '+JSON.stringify(c));
    await page.screenshot({ path: 'live_w'+w+'_customer.png' });
    await ctx.close();
  }
  await browser.close();
  console.log('PHASE10_DONE');
})().catch(e => { console.error(e); process.exit(1); });
