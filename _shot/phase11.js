const { chromium } = require('playwright-core');
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FAKE = (n) => ({ code:0, total:n, list:Array.from({length:n},(_,i)=>({id:i+1,name:'客户'+(i+1),type_title:'我的客户',advance_deposit:'1000.00',deduction:'200.00',margin_deposit:'50.00',belong_name:'经理'+(i+1),c_type:1})), data:Array.from({length:n},(_,i)=>({id:i+1,name:'客户'+(i+1),type_title:'我的客户',advance_deposit:'1000.00',deduction:'200.00',margin_deposit:'50.00',belong_name:'经理'+(i+1),c_type:1})) });
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  // 桌面：分页器 + 工具栏刷新/导出
  for (const w of [1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 1440 ? 900 : 1080 }, isMobile: false });
    await ctx.addInitScript(() => localStorage.setItem('uping_user','1'));
    await ctx.route('**/upingbio.cn/**', r => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(FAKE(42)) }));
    const page = await ctx.newPage();
    await page.goto('http://localhost:8123/index.html', { waitUntil:'networkidle' });
    await page.waitForTimeout(2400);
    await page.evaluate(() => App.switchTab('customer'));
    await page.waitForTimeout(1500);
    await page.evaluate(() => App.injectToolbarOps());
    await page.waitForTimeout(400);
    const d = await page.evaluate(() => {
      const q=s=>document.querySelector(s); const cs=s=>q(s)?getComputedStyle(q(s)):null;
      return {
        device: document.documentElement.getAttribute('data-device'),
        hasPager: !!q('.dt-pager'),
        pagerDisp: cs('.dt-pager') ? cs('.dt-pager').display : null,
        pagerBtns: document.querySelectorAll('.dt-pager .pg-btn').length,
        pagerHasPrev: !!q('.dt-pager [data-pg-prev]'),
        pagerHasNext: !!q('.dt-pager [data-pg-next]'),
        toolbarGhost: document.querySelectorAll('.dt-toolbar .oa-btn.ghost[data-desktop-only]').length,
        mAppbar: cs('.m-appbar') ? cs('.m-appbar').display : null,
        firstTdDisp: cs('.dt-table tbody td') ? cs('.dt-table tbody td').display : null,
        rowCount: q('.dt-table tbody') ? q('.dt-table tbody').querySelectorAll('tr').length : null,
      };
    });
    console.log('W'+w+' desktop '+JSON.stringify(d));
    await page.screenshot({ path: 'pg_w'+w+'_customer.png' });
    // 点"下一页"看是否触发加载
    await page.evaluate(() => App.pg('customer', 1));
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => {
      const q=s=>document.querySelector(s);
      return { rowCount: q('.dt-table tbody') ? q('.dt-table tbody').querySelectorAll('tr').length : null, info: q('.dt-pager [data-pg-info]') ? q('.dt-pager [data-pg-info]').textContent : null };
    });
    console.log('W'+w+' after-next '+JSON.stringify(after));
    await ctx.close();
  }
  // 移动端：分页器隐藏、保留"加载更多"
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' });
  await mctx.addInitScript(() => localStorage.setItem('uping_user','1'));
  await mctx.route('**/upingbio.cn/**', r => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(FAKE(42)) }));
  const mpage = await mctx.newPage();
  await mpage.goto('http://localhost:8123/index.html', { waitUntil:'networkidle' });
  await mpage.waitForTimeout(2400);
  await mpage.evaluate(() => App.switchTab('customer'));
  await mpage.waitForTimeout(1500);
  const m = await mpage.evaluate(() => {
    const q=s=>document.querySelector(s); const cs=s=>q(s)?getComputedStyle(q(s)):null;
    return {
      device: document.documentElement.getAttribute('data-device'),
      hasPager: !!q('.dt-pager'),
      pagerDisp: cs('.dt-pager') ? cs('.dt-pager').display : null,   // 期望 none（手机隐藏）
      hasLoadMore: !!q('.load-more'),                                  // 期望 true（手机保留）
      hasMobileGrid: !!q('.m-grid'),
      firstTdDisp: cs('.dt-table tbody td') ? cs('.dt-table tbody td').display : null,
    };
  });
  console.log('mobile '+JSON.stringify(m));
  await mpage.screenshot({ path: 'pg_mobile_customer.png' });
  await browser.close();
  const all = true;
  console.log('PAGER_ALL_OK='+all);
})().catch(e => { console.error(e); process.exit(1); });
