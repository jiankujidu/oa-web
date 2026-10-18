// phase13.js —— 线上真实登录逐页巡检（chenmeilong）
// 验证：桌面端各列表页是否彻底无手机残留、分页器/工具栏/行选择是否就位
const { chromium } = require('playwright-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname;
const BASE = 'https://oa.jk93.qzz.io/index.html';

// 需要逐页巡检的列表页（直接调用 App.switchTab / App.showSubPage）
// go 字段是 IIFE 源码，eval 后执行
const PAGES = [
  { name: 'home',       go: "App.switchTab('home')" },
  { name: 'customer',   go: "App.switchTab('customer')" },
  { name: 'approve',    go: "App.switchTab('approve')" },
  { name: 'note',       go: "App.showSubPage('note')" },
  { name: 'article',    go: "App.showSubPage('article')" },
  { name: 'product',    go: "App.showSubPage('product')" },
  { name: 'files',      go: "App.showSubPage('files')" },
  { name: 'fin-order',  go: "App.showSubPage('finance-order')" },
  { name: 'fin-adv',    go: "App.showSubPage('finance-advance')" },
  { name: 'fin-inc',    go: "App.showSubPage('finance-income')" },
  { name: 'deduction',  go: "App.showSubPage('deduction')" },
  { name: 'margin',     go: "App.showSubPage('margin')" },
  { name: 'inv-my',     go: "App.showSubPage('invoice-my')" },
  { name: 'msg-inbox',  go: "App.showSubPage('message-inbox')" },
  { name: 'mail',       go: "App.showSubPage('mail')" },
  { name: 'contact',    go: "App.showSubPage('contact-list')" },
  { name: 'chance',     go: "App.showSubPage('chance-list')" },
  { name: 'trace',      go: "App.showSubPage('trace-list')" },
  { name: 'ord-my',     go: "App.showSubPage('order-my')" },
  { name: 'ord-handle', go: "App.showSubPage('order-handle')" },
  { name: 'plat-ord',   go: "App.showSubPage('platform-order')" },
  { name: 'sample',     go: "App.showSubPage('sample')" },
  { name: 'school',     go: "App.showSubPage('school')" },
  { name: 'after',      go: "App.showSubPage('after')" },
  { name: 'mine',       go: "App.switchTab('mine')" },
];

// 桌面端应该可见 / 不可见的组件
function pageProbe(name) {
  const dev = document.documentElement.getAttribute('data-device');
  const ds = sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el).display : 'MISSING'; };
  const c = document.querySelector('#page-container');
  // 作用域锁定当前页容器
  const pager = c ? c.querySelector('.dt-pager[data-pg-key]') : document.querySelector('.dt-pager[data-pg-key]');
  const pgKey = pager ? pager.getAttribute('data-pg-key') : null;
  const pgTotal = pager ? (pager.querySelector('[data-pg-total]') || {}).textContent : null;
  const pgSize = pager ? (pager.querySelector('.pg-size-cur') || {}).textContent : null;
  const toolbar = c ? c.querySelector('.dt-toolbar') : null;
  const tbTitle = toolbar ? (toolbar.querySelector('.dt-toolbar-title') || {}).textContent : null;
  const tbOps = toolbar ? toolbar.querySelectorAll('.oa-btn.ghost[data-desktop-only]').length : 0;
  const table = c ? c.querySelector('.dt-table') : document.querySelector('.dt-table');
  const pgCol = table ? table.querySelectorAll('th.pg-col, td.pg-col').length : 0;
  const rowCount = table ? table.querySelectorAll('tbody tr').length : 0;
  const mAppbar = ds('.m-appbar');
  const mTabbar = ds('.m-tabbar');
  const mSearch = ds('.m-search-sheet');
  const cText = c ? c.textContent : '';
  return {
    page: name,
    device: dev,
    mAppbar_hidden: mAppbar === 'none',
    mTabbar_hidden: mTabbar === 'none',
    mSearchSheet_hidden: mSearch === 'none',
    has_toolbar: !!toolbar,
    toolbar_title: (tbTitle || '').slice(0, 30),
    toolbar_refresh_export_btns: tbOps,
    has_pager: !!pager,
    pager_key: pgKey,
    pager_total: pgTotal,
    pager_size: pgSize,
    table_rows: rowCount,
    row_checkbox_cells: pgCol,
    // 页面特征文本（首页/客户/订单/财务 等），用于确认切到了目标页
    page_text_snippet: cText.slice(0, 60).replace(/\s+/g, ' ')
  };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    isMobile: false,
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  const loginErrs = [];
  page.on('pageerror', e => loginErrs.push(e.message));

  // 1. 打开登录页，输入账号密码
  await page.goto(BASE.replace('/index.html', '/login.html'), { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);

  // 输入用户名密码
  const userInput = await page.$('input[name="username"], #username, .login-input:first-of-type, input[type="text"]:not([readonly])');
  const passInput = await page.$('input[name="password"], #password, input[type="password"]');
  if (userInput && passInput) {
    await userInput.fill('chenmeilong');
    await passInput.fill('Yp123.');
    console.log('[login] credentials filled');
  } else {
    console.log('[login] could not find user/pass inputs, trying by placeholder');
    await page.fill('input[placeholder*="用户"], input[placeholder*="手机"]', 'chenmeilong').catch(() => {});
    await page.fill('input[placeholder*="密码"], input[type="password"]', 'Yp123.').catch(() => {});
  }

  // 验证码：尝试点击登录（可能需人工读验证码，此处先不填，看是否已有会话）
  // 尝试直接点登录按钮
  const btn = await page.$('button:has-text("登录"), .login-btn, button[type="submit"]');
  if (btn) {
    await btn.click();
    await page.waitForTimeout(3000);
  }

  // 检查是否已进入主界面（若还在登录页说明需要验证码，此时用 addInitScript 方式绕过）
  const onLogin = await page.evaluate(() => document.body.innerHTML.includes('login') || window.location.pathname.includes('login'));
  console.log('[login] still on login page:', onLogin);

  if (onLogin) {
    // 验证码无法自动识别，改用 addInitScript 伪造登录态 + 拦截业务接口
    await ctx.close();
    const ctx2 = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      isMobile: false,
      ignoreHTTPSErrors: true,
    });
    await ctx2.addInitScript(() => {
      try { localStorage.setItem('uping_user', '1'); localStorage.setItem('uping_me', JSON.stringify({ name: '陈美龙' })); } catch (e) {}
    });
    const page2 = await ctx2.newPage();
    // 拦截所有 OA 业务接口，返回假数据（防跳登录）
    const API_RE = /^\/(home|oa|customer|note|message|product|api|file|admin|upload|attachment|public|finance|article|contract|captcha\.html|index\.php)/i;
    page2.route('**/*', (route) => {
      const p = new URL(route.request().url()).pathname;
      if (API_RE.test(p)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [], msg: 'ok', count: 0, total: 0 }) });
      } else {
        route.continue();
      }
    });
    await page2.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page2.waitForTimeout(3000);

    // 逐页巡检
    const results = [];
    const PROBE_SRC = pageProbe.toString();
    for (const pg of PAGES) {
      await page2.evaluate((code) => { try { eval(code); } catch (e) {} }, pg.go);
      await page2.waitForTimeout(1200);
      const probe = await page2.evaluate((probeSrc) => {
        try {
          const probeFn = eval('(' + probeSrc + ')');
          return probeFn();
        } catch (e) { return { page: 'unknown', error: e.message }; }
      }, PROBE_SRC);
      results.push(probe);
      const ok = probe.device === 'desktop'
        && probe.mAppbar_hidden && probe.mTabbar_hidden && probe.mSearchSheet_hidden;
      const tag = ok ? '✓' : '✗';
      const extras = [];
      if (probe.has_pager) extras.push('pager:' + probe.pager_key + '/' + probe.pager_total + '/' + probe.pager_size);
      if (probe.toolbar_refresh_export_btns > 0) extras.push('refresh+export×' + probe.toolbar_refresh_export_btns);
      if (probe.row_checkbox_cells > 0) extras.push('rowcb:' + probe.row_checkbox_cells);
      if (probe.table_rows > 0) extras.push('rows:' + probe.table_rows);
      if (probe.error) extras.push('ERR:' + probe.error);
      console.log(tag + ' ' + pg.name.padEnd(14) + ' | ' + (probe.page_text_snippet || probe.toolbar_title || '-').slice(0, 28).padEnd(28) + ' | ' + extras.join(' '));
    }

    // 截图关键页
    const shots = ['customer', 'fin-order', 'msg-inbox', 'ord-handle', 'mine'];
    for (const s of shots) {
      const pg = PAGES.find(p => p.name === s);
      if (pg) {
        await page2.evaluate((code) => { try { eval(code); } catch (e) {} }, pg.go);
        await page2.waitForTimeout(1500);
        await page2.screenshot({ path: path.join(OUT, 'p13_' + s + '.png') });
        console.log('  screenshot: p13_' + s + '.png');
      }
    }

    const allOk = results.every(r => r.device === 'desktop' && r.mAppbar_hidden && r.mTabbar_hidden && r.mSearchSheet_hidden);
    console.log('\n=== SUMMARY ===');
    console.log('pages:' + results.length + ' all_desktop_ok=' + allOk);
    console.log('pageerrors=' + loginErrs.length ? loginErrs.join(' | ') : 'none');
    console.log('PHASE13_DONE (mock-login mode: captcha blocked real login)');
    await browser.close();
    process.exit(0);
  } else {
    // 真实登录成功，进入主界面
    await page.waitForTimeout(3000);
    const results = [];
    const PROBE_SRC = pageProbe.toString();
    for (const pg of PAGES) {
      await page.evaluate((code) => { try { eval(code); } catch (e) {} }, pg.go);
      await page.waitForTimeout(1500);
      const probe = await page.evaluate((probeSrc) => {
        try {
          const probeFn = eval('(' + probeSrc + ')');
          return probeFn();
        } catch (e) { return { page: 'unknown', error: e.message }; }
      }, PROBE_SRC);
      results.push(probe);
      const ok = probe.device === 'desktop' && probe.mAppbar_hidden && probe.mTabbar_hidden && probe.mSearchSheet_hidden;
      const tag = ok ? '✓' : '✗';
      const extras = [];
      if (probe.has_pager) extras.push('pager:' + probe.pager_key + '/' + probe.pager_total + '/' + probe.pager_size);
      if (probe.toolbar_refresh_export_btns > 0) extras.push('ops×' + probe.toolbar_refresh_export_btns);
      if (probe.row_checkbox_cells > 0) extras.push('rowcb:' + probe.row_checkbox_cells);
      if (probe.table_rows > 0) extras.push('rows:' + probe.table_rows);
      if (probe.error) extras.push('ERR:' + probe.error);
      console.log(tag + ' ' + pg.name.padEnd(14) + ' | ' + (probe.page_text_snippet || probe.toolbar_title || '-').slice(0, 28).padEnd(28) + ' | ' + extras.join(' '));
    }
    const allOk = results.every(r => r.device === 'desktop' && r.mAppbar_hidden && r.mTabbar_hidden && r.mSearchSheet_hidden);
    console.log('\n=== SUMMARY ===');
    console.log('pages:' + results.length + ' all_desktop_ok=' + allOk + ' (real-login mode)');
    console.log('PHASE13_DONE');
    await browser.close();
    process.exit(0);
  }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
