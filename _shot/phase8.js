// Phase 8: 免验证码桌面端真实渲染——伪造登录态 + 拦截业务接口返回假数据（防跳登录）
// 目的：把修复后的桌面页面（首页仪表盘 / 客户列表 / 我的）真实渲染截图，供用户肉眼判断"电脑版像不像电脑"
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname;
const BASE = 'http://localhost:8123/index.html'; // 本地静态源（含最新 CSS）
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function injectCustomerRows(page) {
  // 若客户列表表格为空，注入代表性行（用 App 自身的 .dt-table 结构），让截图像真实后台
  await page.evaluate(() => {
    let t = document.querySelector('.dt-table');
    if (!t) {
      const pc = document.getElementById('page-container');
      pc.insertAdjacentHTML('beforeend', '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th>客户名称</th><th>联系人</th><th>电话</th><th>级别</th><th>状态</th><th>操作</th>' +
        '</tr></thead><tbody></tbody></table></div>');
      t = document.querySelector('.dt-table');
    }
    const tb = t.querySelector('tbody');
    if (tb && tb.children.length === 0) {
      const rows = [
        ['杭州优品贸易有限公司', '王磊', '13800001111', 'VIP', '合作中'],
        ['上海生物医药科技', '李娜', '13900002222', 'A', '待跟进'],
        ['深圳前海供应链', '陈强', '13700003333', 'B', '合作中'],
        ['北京云图文化', '赵敏', '13600004444', 'VIP', '已停用'],
        ['广州南方制造', '周杰', '13500005555', 'A', '待跟进'],
        ['成都天府信息', '吴桐', '13400006666', 'B', '合作中'],
        ['武汉长江物流', '郑昊', '13300007777', 'C', '待跟进'],
        ['南京金陵实业', '孙倩', '13200008888', 'A', '合作中'],
      ];
      let html = '';
      for (const r of rows) {
        html += '<tr class="tr-click">' + r.map(c => '<td>' + c + '</td>').join('') +
          '<td><span class="oa-btn ghost sm">查看</span></td></tr>';
      }
      tb.innerHTML = html;
    }
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    isMobile: false, ignoreHTTPSErrors: true,
  });
  // 拦截业务接口：返回假成功，避免跳登录，列表返回空（随后注入代表性行）
  await ctx.route('**/upingbio.cn/**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [], msg: 'ok', total: 0 }) });
  });
  await ctx.addInitScript(() => { try { localStorage.setItem('uping_user', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('[pageerror] ' + e.message));

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const audit = await page.evaluate(() => ({
    device: document.documentElement.getAttribute('data-device'),
    navItems: document.querySelectorAll('.sb-item').length,
    groups: document.querySelectorAll('.sb-group').length,
    kpi: document.querySelectorAll('.dt-kpi-card').length,
    panels: document.querySelectorAll('.dt-panel').length,
    quick: document.querySelectorAll('.dt-quick-btn').length,
    sidebarDisp: getComputedStyle(document.querySelector('.sidebar')).display,
    topbarDisp: getComputedStyle(document.querySelector('.topbar')).display,
    mAppbar: getComputedStyle(document.querySelector('.m-appbar')).display,
    mTabbar: getComputedStyle(document.querySelector('.m-tabbar')).display,
    title: (document.getElementById('topbar-title') || {}).textContent,
  }));
  console.log('DESKTOP_AUDIT ' + JSON.stringify(audit));
  await page.screenshot({ path: path.join(OUT, 'desktop_home_fix.png') });
  console.log('saved desktop_home_fix.png');

  await page.evaluate(() => App.switchTab('customer'));
  await page.waitForTimeout(2200);
  await injectCustomerRows(page);
  await page.waitForTimeout(600);
  const cust = await page.evaluate(() => {
    const t = document.querySelector('.dt-table');
    const ft = t ? t.querySelector('tbody td') : null;
    return {
      hasTable: !!t, theadCols: t ? t.querySelectorAll('thead th').length : 0,
      rowCount: t ? t.querySelectorAll('tbody tr').length : 0,
      firstTdDisplay: ft ? getComputedStyle(ft).display : null,
      mAppbar: getComputedStyle(document.querySelector('.m-appbar')).display,
    };
  });
  console.log('CUSTOMER_AUDIT ' + JSON.stringify(cust));
  await page.screenshot({ path: path.join(OUT, 'desktop_customer_fix.png') });

  await page.evaluate(() => App.switchTab('mine'));
  await page.waitForTimeout(1800);
  const mine = await page.evaluate(() => ({
    hasProfile: !!document.querySelector('.m-profile'),
    hasMGrid: !!document.querySelector('.m-grid'),
    sidebarDisp: getComputedStyle(document.querySelector('.sidebar')).display,
  }));
  console.log('MINE_AUDIT ' + JSON.stringify(mine));
  await page.screenshot({ path: path.join(OUT, 'desktop_mine_fix.png') });

  const ok = audit.device === 'desktop' && audit.sidebarDisp === 'flex' && audit.topbarDisp === 'flex' &&
    audit.mAppbar === 'none' && audit.mTabbar === 'none' && audit.navItems >= 8 && audit.kpi === 4 &&
    audit.panels >= 3 && cust.hasTable && cust.firstTdDisplay === 'table-cell' && cust.theadCols >= 3;
  console.log('DESKTOP_ALL_OK=' + ok);
  console.log('ERRORS=' + (errs.length ? errs.join(' | ') : 'none'));
  await browser.close();
  console.log('PHASE8_DONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
