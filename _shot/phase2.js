// Phase 2: 复用 phase1 会话 cookie，填验证码登录，双视口截图验证两套独立体验
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname;
const BASE = 'https://oa.jk93.qzz.io';
const USER = 'chenmeilong';
const PASS = 'Yp123.';
const CAPTCHA = { desktop: '31', mobile: '27' };

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', isMobile: false },
  mobile: { viewport: { width: 390, height: 844, deviceScaleFactor: 3 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', isMobile: true },
};

async function login(name, vp) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ ...vp, ignoreHTTPSErrors: true });
  const cookies = JSON.parse(fs.readFileSync(path.join(OUT, name + '_cookies.json'), 'utf8'));
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
  await page.goto(BASE + '/login.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#username', USER);
  await page.fill('#password', PASS);
  await page.fill('#captcha', CAPTCHA[name]);
  await page.click('#login-btn');
  // 等待跳转到 index.html 且应用壳渲染
  await page.waitForURL('**/index.html', { timeout: 20000 }).catch(() => logs.push('no redirect to index'));
  await page.waitForTimeout(2600);
  const state = await page.evaluate(() => ({
    url: location.href,
    device: document.documentElement.getAttribute('data-device'),
    appVisible: (document.getElementById('app-view') || {}).style ? document.getElementById('app-view').style.display : 'n/a',
    title: (document.getElementById('topbar-title') || {}).textContent,
    mTitle: (document.getElementById('m-title') || {}).textContent,
    tip: (document.getElementById('tip') || {}).textContent,
  }));
  console.log('[' + name + '] after login:', JSON.stringify(state));
  if (state.tip && /错误|失败|不正确/.test(state.tip)) { console.log('[' + name + '] LOGIN FAILED:', state.tip); await browser.close(); return; }
  await page.screenshot({ path: path.join(OUT, name + '_home.png') });

  // ---- 桌面：客户表格 + 我的 ----
  if (name === 'desktop') {
    await page.evaluate(() => App.switchTab('customer'));
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT, 'desktop_customer.png') });
    await page.evaluate(() => App.showSubPage('order-my'));
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT, 'desktop_order_my.png') });
    await page.evaluate(() => App.switchTab('mine'));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, 'desktop_mine.png') });
  }

  // ---- 手机：首页 / 我的宫格 / 列表卡片 / 消息 ----
  if (name === 'mobile') {
    await page.evaluate(() => App.switchTab('mine'));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, 'mobile_mine.png') });
    await page.evaluate(() => App.showSubPage('order-my'));
    await page.waitForTimeout(2400);
    await page.screenshot({ path: path.join(OUT, 'mobile_order_my.png') });
    const labeled = await page.evaluate(() => {
      const t = document.querySelector('.dt-table');
      if (!t) return 'no-table';
      const td = t.querySelector('tbody td');
      return td ? (td.getAttribute('data-label') || '(empty)') : 'no-td';
    });
    console.log('[' + name + '] first td data-label:', labeled);
    await page.evaluate(() => App.switchTab('home'));
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, 'mobile_home2.png') });
  }

  fs.writeFileSync(path.join(OUT, name + '_phase2.log'), logs.join('\n'));
  await browser.close();
}

(async () => {
  await login('desktop', VIEWPORTS.desktop);
  await login('mobile', VIEWPORTS.mobile);
  console.log('PHASE2_DONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
