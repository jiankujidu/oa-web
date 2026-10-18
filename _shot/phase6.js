// phase6.js —— 移动端「手机原生」渲染原语验证（免验证码 / 免真实登录）
// 在真实手机视口下，向 #page-container 注入代表性 DOM：
//   1) 列表表格：验证 injectTableLabels 自动注入 data-label + CSS 卡片化（tbody tr/td -> display:block + td::before 显示列名）
//   2) 「我的」功能宫格：验证 .m-grid -> display:grid、.m-grid-ic 品牌蓝底
// 借此客观证明「手机版本像手机」的渲染管线在真机视口下生效。
const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.BASE_URL || 'http://localhost:8123/index.html';
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const API_RE = /^\/(home|oa|customer|note|message|product|api|file|admin|upload|attachment|public|finance|article|contract|captcha\.html|index\.php)/i;

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: MOBILE_UA, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('uping_user', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  await page.route('**/*', (route) => { const p = new URL(route.request().url()).pathname; if (API_RE.test(p)) return route.abort(); return route.continue(); });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('.m-appbar', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);

  const res = await page.evaluate(async () => {
    const out = {};
    out.device = document.documentElement.getAttribute('data-device');

    // ---- 1) 注入代表性列表表格 ----
    const pc = document.getElementById('page-container');
    pc.innerHTML =
      '<table class="dt-table"><thead><tr>' +
      '<th>单号</th><th>客户</th><th>金额</th><th>状态</th>' +
      '</tr></thead><tbody><tr>' +
      '<td>NO-2026-001</td><td>张三科技</td><td>￥1,280.00</td><td>待审批</td>' +
      '</tr></tbody></table>' +
      '<div class="m-grid"><div class="m-grid-item"><div class="m-grid-ic">A</div><div class="m-grid-name">预存款</div></div>' +
      '<div class="m-grid-item"><div class="m-grid-ic">B</div><div class="m-grid-name">抵扣券</div></div>' +
      '<div class="m-grid-item"><div class="m-grid-ic">C</div><div class="m-grid-name">保证金</div></div>' +
      '<div class="m-grid-item"><div class="m-grid-ic">D</div><div class="m-grid-name">发票</div></div></div>';

    // 等 MutationObserver（injectTableLabels, ~80ms debounce）注入 data-label
    await new Promise(r => setTimeout(r, 400));

    const table = pc.querySelector('.dt-table');
    const tr = table.querySelector('tbody tr');
    const tds = tr.querySelectorAll('td');
    out.list = {
      rowCount: table.querySelectorAll('tbody tr').length,
      firstLabel: tds[0].getAttribute('data-label'),
      allLabeled: Array.from(tds).every(td => !!td.getAttribute('data-label')),
      trDisplay: getComputedStyle(tr).display,                       // 期望 block（整行成卡片）
      tdDisplay: getComputedStyle(tds[0]).display,                   // 期望 flex（label 左 / 值 右）
      tdBeforeContent: getComputedStyle(tds[1], '::before').content, // 第2格应显示列名 "客户"（首格为卡片标题，故意无 label）
    };

    // ---- 2) 我的页宫格 ----
    const grid = pc.querySelector('.m-grid');
    const ic = grid.querySelector('.m-grid-ic');
    out.grid = {
      display: getComputedStyle(grid).display,          // 期望 grid
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, // 期望 4
      icBg: getComputedStyle(ic).backgroundColor,       // 期望品牌浅蓝（非 transparent/rgba(0,0,0,0)）
      icColor: getComputedStyle(ic).color,
    };
    return out;
  });

  console.log('ASSERT mobile_render ' + JSON.stringify(res, null, 0));

  const ok =
    res.device === 'mobile' &&
    res.list.rowCount === 1 && res.list.allLabeled === true && res.list.firstLabel === '单号' &&
    res.list.trDisplay === 'block' && res.list.tdDisplay === 'flex' && res.list.tdBeforeContent.indexOf('客户') >= 0 &&
    res.grid.display === 'grid' && res.grid.columns === 4 &&
    res.grid.icBg !== 'rgba(0, 0, 0, 0)' && res.grid.icBg !== 'transparent';
  console.log('RESULT mobile_render_ok=' + ok);

  await browser.close();
  process.exit(ok ? 0 : 1);
}
run().catch(e => { console.error('ERR', e); process.exit(2); });
