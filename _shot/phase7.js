// Phase 7: 修复后桌面端真实登录渲染 + 结构断言 + 截图（供用户肉眼判断"电脑版像不像电脑"）
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname;
const BASE = 'https://oa.jk93.qzz.io';
const USER = 'chenmeilong';
const PASS = 'Yp123.';
const VP = { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', isMobile: false };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function solveCaptchaInteractive(page, name, attempt) {
  const ansFile = path.join(OUT, 'answer_' + name + '.txt');
  try { fs.unlinkSync(ansFile); } catch (e) {}
  const b64 = await page.evaluate(() => {
    const img = document.getElementById('captcha-img');
    if (!img || !img.complete || !img.naturalWidth) return null;
    try {
      const scale = 4;
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth * scale; cv.height = img.naturalHeight * scale;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/png').split(',')[1];
    } catch (e) { return 'ERR:' + e.message; }
  });
  if (!b64 || String(b64).indexOf('ERR:') === 0) throw new Error('captcha read failed: ' + b64);
  fs.writeFileSync(path.join(OUT, 'captcha_' + name + '_now.png'), Buffer.from(b64, 'base64'));
  fs.writeFileSync(path.join(OUT, 'need_answer_' + name + '.txt'), String(attempt));
  console.log('[' + name + '] captcha saved -> captcha_' + name + '_now.png ; waiting for answer_' + name + '.txt');
  for (let i = 0; i < 240; i++) {
    if (fs.existsSync(ansFile)) {
      const a = fs.readFileSync(ansFile, 'utf8').trim();
      try { fs.unlinkSync(ansFile); } catch (e) {}
      return a;
    }
    await sleep(1000);
  }
  throw new Error('timeout waiting for answer');
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ ...VP, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
  const name = 'desktop';
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    await page.goto(BASE + '/login.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#captcha-img', { timeout: 15000 });
    await page.fill('#username', USER);
    await page.fill('#password', PASS);
    const answer = await solveCaptchaInteractive(page, name, attempt);
    console.log('[' + name + '] answer: ' + answer);
    await page.fill('#captcha', answer);
    await page.click('#login-btn');
    await page.waitForTimeout(2500);
    const tip = await page.evaluate(() => (document.getElementById('tip') || {}).textContent || '');
    console.log('[' + name + '] attempt ' + attempt + ' tip: ' + tip);
    if (/验证码不正确/.test(tip)) { console.log('[' + name + '] captcha wrong, retry'); continue; }
    await page.waitForURL('**/index.html', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2800);
    const st = await page.evaluate(() => ({ url: location.href, device: document.documentElement.getAttribute('data-device'), title: (document.getElementById('topbar-title') || {}).textContent }));
    console.log('[' + name + '] after login:', JSON.stringify(st));
    if (!/index\.html/.test(st.url)) { console.log('[' + name + '] login failed tip=' + st.title); continue; }
    ok = true;

    // === 桌面结构断言（证明电脑版是真后台，不是拉伸的手机版）===
    const audit = await page.evaluate(() => {
      const navItems = document.querySelectorAll('.sb-item').length;
      const groups = document.querySelectorAll('.sb-group').length;
      const kpi = document.querySelectorAll('.dt-kpi-card').length;
      const panels = document.querySelectorAll('.dt-panel').length;
      const quick = document.querySelectorAll('.dt-quick-btn').length;
      const sidebarDisp = getComputedStyle(document.querySelector('.sidebar')).display;
      const topbarDisp = getComputedStyle(document.querySelector('.topbar')).display;
      const mAppbarDisp = getComputedStyle(document.querySelector('.m-appbar')).display;
      const mTabbarDisp = getComputedStyle(document.querySelector('.m-tabbar')).display;
      return { navItems, groups, kpi, panels, quick, sidebarDisp, topbarDisp, mAppbarDisp, mTabbarDisp };
    });
    console.log('DESKTOP_AUDIT ' + JSON.stringify(audit));
    await page.screenshot({ path: path.join(OUT, 'desktop_home_fix.png'), fullPage: false });
    console.log('saved desktop_home_fix.png');

    // 客户列表（应渲染为真表格）
    await page.evaluate(() => App.switchTab('customer'));
    await page.waitForTimeout(2600);
    const custAudit = await page.evaluate(() => {
      const t = document.querySelector('.dt-table');
      const firstTd = t ? t.querySelector('tbody td') : null;
      const ths = t ? t.querySelectorAll('thead th').length : 0;
      const rows = t ? t.querySelectorAll('tbody tr').length : 0;
      return {
        hasTable: !!t,
        theadCols: ths,
        rowCount: rows,
        firstTdDisplay: firstTd ? getComputedStyle(firstTd).display : null,
        mAppbar: getComputedStyle(document.querySelector('.m-appbar')).display,
      };
    });
    console.log('CUSTOMER_AUDIT ' + JSON.stringify(custAudit));
    await page.screenshot({ path: path.join(OUT, 'desktop_customer_fix.png') });

    // 我的（桌面 renderMine，应为资料卡 + 链接列表，而非手机宫格）
    await page.evaluate(() => App.switchTab('mine'));
    await page.waitForTimeout(2000);
    const mineAudit = await page.evaluate(() => ({
      hasProfile: !!document.querySelector('.m-profile'),
      hasMGrid: !!document.querySelector('.m-grid'),
      sidebarDisp: getComputedStyle(document.querySelector('.sidebar')).display,
    }));
    console.log('MINE_AUDIT ' + JSON.stringify(mineAudit));
    await page.screenshot({ path: path.join(OUT, 'desktop_mine_fix.png') });

    const allTrue =
      audit.device === 'desktop' && audit.sidebarDisp === 'flex' && audit.topbarDisp === 'flex' &&
      audit.mAppbarDisp === 'none' && audit.mTabbarDisp === 'none' &&
      audit.navItems >= 8 && audit.kpi === 4 && audit.panels >= 3 &&
      custAudit.hasTable && custAudit.firstTdDisplay === 'table-cell' && custAudit.theadCols >= 3;
    console.log('DESKTOP_ALL_OK=' + allTrue);
  }
  fs.writeFileSync(path.join(OUT, name + '_phase7.log'), logs.join('\n'));
  await browser.close();
  console.log('PHASE7_DONE ok=' + ok);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
