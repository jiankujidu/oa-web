const { chromium } = require('playwright-core');
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FAKE = { code:0, total:6, data:[
  {id:1,name:'杭州优品贸易有限公司',type_title:'我的客户',advance_deposit:'12000.00',deduction:'5000.00',margin_deposit:'2000.00',belong_name:'王经理',c_type:1},
  {id:2,name:'上海生物医药科技',type_title:'我的客户',advance_deposit:'8000.00',deduction:'3000.00',margin_deposit:'1000.00',belong_name:'李经理',c_type:1},
  {id:3,name:'深圳前海供应链',type_title:'公海客户',advance_deposit:'15000.00',deduction:'6000.00',margin_deposit:'3000.00',belong_name:'陈总',c_type:2},
  {id:4,name:'北京云图文化',type_title:'我的客户',advance_deposit:'6000.00',deduction:'2000.00',margin_deposit:'800.00',belong_name:'赵经理',c_type:1},
  {id:5,name:'广州南方制造',type_title:'废弃客户',advance_deposit:'900.00',deduction:'0.00',margin_deposit:'0.00',belong_name:'周总',c_type:3},
  {id:6,name:'成都天府信息',type_title:'我的客户',advance_deposit:'3200.00',deduction:'1500.00',margin_deposit:'400.00',belong_name:'吴经理',c_type:1},
]};
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  for (const w of [1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 1440 ? 900 : 1080 }, isMobile: false });
    await ctx.addInitScript(() => localStorage.setItem('uping_user','1'));
    await ctx.route('**/upingbio.cn/**', r => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(FAKE) }));
    const page = await ctx.newPage();
    await page.goto('http://localhost:8123/index.html', { waitUntil:'networkidle' });
    await page.waitForTimeout(2400);
    await page.evaluate(() => App.switchTab('customer'));
    await page.waitForTimeout(2000); // 等 API.customerList 返回
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
        dtQuickBtns: document.querySelectorAll('.dt-quick-btn').length,
        mAppbar: cs('.m-appbar') ? cs('.m-appbar').display : null,
        device: document.documentElement.getAttribute('data-device'),
      };
    });
    console.log('W'+w+' customer '+JSON.stringify(a));
    await page.screenshot({ path: 'w'+w+'_customer.png' });
    await page.evaluate(() => App.switchTab('home'));
    await page.waitForTimeout(1500);
    const h = await page.evaluate(() => {
      const q=s=>document.querySelector(s); const cs=s=>q(s)?getComputedStyle(q(s)):null;
      return { kpi: document.querySelectorAll('.dt-kpi-card').length, kpiMaxW: cs('.dt-kpi')?cs('.dt-kpi').maxWidth:null, kpiNum: cs('.dt-kpi-num')?cs('.dt-kpi-num').fontSize:null, mainColW: q('.main-col')?q('.main-col').getBoundingClientRect().width:null };
    });
    console.log('W'+w+' home '+JSON.stringify(h));
    await page.screenshot({ path: 'w'+w+'_home.png' });
    await ctx.close();
  }
  await browser.close();
  console.log('PHASE9C_DONE');
})().catch(e => { console.error(e); process.exit(1); });
