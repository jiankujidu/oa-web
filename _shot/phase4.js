// Phase 4: 复用交互式验证码登录，对双端渲染做 DOM 断言（computed style + data-label + 宫格），
// 截图一并保存。用于在无图像能力时客观验证“两套独立体验”是否真正生效。
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname;
const BASE = 'https://oa.jk93.qzz.io';
const USER = 'chenmeilong';
const PASS = 'Yp123.';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', isMobile: false },
  mobile: { viewport: { width: 390, height: 844, deviceScaleFactor: 3 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', isMobile: true },
};

async function getCaptchaAnswer(page, name, attempt) {
  const ansFile = path.join(OUT, 'answer_' + name + '.txt');
  try { fs.unlinkSync(ansFile); } catch (e) {}
  const b64 = await page.evaluate(() => {
    const img = document.getElementById('captcha-img');
    if (!img || !img.complete || !img.naturalWidth) return null;
    const scale = 4;
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth * scale; cv.height = img.naturalHeight * scale;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/png').split(',')[1];
  });
  if (!b64) throw new Error('captcha read failed');
  fs.writeFileSync(path.join(OUT, 'captcha_' + name + '_now.png'), Buffer.from(b64, 'base64'));
  fs.writeFileSync(path.join(OUT, 'need_answer_' + name + '.txt'), String(attempt));
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

async function login(name, vp) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ ...vp, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    await page.goto(BASE + '/login.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#captcha-img', { timeout: 15000 });
    await page.fill('#username', USER);
    await page.fill('#password', PASS);
    const answer = await getCaptchaAnswer(page, name, attempt);
    await page.fill('#captcha', answer);
    await page.click('#login-btn');
    await page.waitForTimeout(2500);
    const tip = await page.evaluate(() => (document.getElementById('tip') || {}).textContent || '');
    if (/验证码不正确/.test(tip)) { console.log('[' + name + '] wrong captcha attempt ' + attempt); continue; }
    await page.waitForURL('**/index.html', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2600);
    const st = await page.evaluate(() => location.href);
    if (!/index\.html/.test(st)) { console.log('[' + name + '] login failed: ' + st); continue; }
    ok = true;

    // ---- 断言：外壳分离 ----
    const shell = await page.evaluate(() => {
      const d = document.documentElement.getAttribute('data-device');
      const disp = s => { const el = document.querySelector(s); return el ? getComputedStyle(el).display : 'none'; };
      return {
        device: d,
        sidebar: disp('.sidebar'),
        topbar: disp('.topbar'),
        mAppbar: disp('.m-appbar'),
        mTabbar: disp('.m-tabbar'),
        cmdk: disp('.cmdk-mask'),
      };
    });

    // ---- 桌面：客户表（应为 table-cell 单元格） ----
    let listDesktop = null;
    if (name === 'desktop') {
      await page.evaluate(() => App.switchTab('customer'));
      await page.waitForTimeout(4500);
      listDesktop = await page.evaluate(() => {
        const t = document.querySelector('.dt-table');
        if (!t) return { hasTable: false };
        const rows = t.querySelectorAll('tbody tr');
        const tds = t.querySelectorAll('tbody td');
        let labeled = 0; tds.forEach(td => { if (td.getAttribute('data-label')) labeled++; });
        const first = t.querySelector('tbody td');
        return {
          hasTable: true, rowCount: rows.length, tdCount: tds.length, labeledCount: labeled,
          firstTdDisplay: first ? getComputedStyle(first).display : '?',
        };
      });
    }

    // ---- 手机：我的宫格 + 订单列表卡片 ----
    let mineMobile = null, listMobile = null;
    if (name === 'mobile') {
      await page.evaluate(() => App.switchTab('mine'));
      await page.waitForTimeout(1800);
      mineMobile = await page.evaluate(() => ({
        hasGrid: !!document.querySelector('.m-grid'),
        gridItems: document.querySelectorAll('.m-grid-item').length,
        hasProfile: !!document.querySelector('.m-profile'),
        mTitle: (document.getElementById('m-title') || {}).textContent,
      }));
      await page.evaluate(() => App.showSubPage('order-my'));
      await page.waitForTimeout(5000);
      listMobile = await page.evaluate(() => {
        const t = document.querySelector('.dt-table');
        if (!t) return { hasTable: false };
        const rows = t.querySelectorAll('tbody tr');
        const tds = t.querySelectorAll('tbody td');
        let labeled = 0; tds.forEach(td => { if (td.getAttribute('data-label')) labeled++; });
        const first = t.querySelector('tbody td');
        return {
          hasTable: true, rowCount: rows.length, tdCount: tds.length, labeledCount: labeled,
          firstTdDisplay: first ? getComputedStyle(first).display : '?',
          firstTdLabel: first ? first.getAttribute('data-label') : null,
        };
      });
    }

    const result = { name, shell, listDesktop, mineMobile, listMobile };
    console.log('ASSERT ' + name + ' ' + JSON.stringify(result));
    await page.screenshot({ path: path.join(OUT, name + '_verify.png') });
    await browser.close();
    return result;
  }
  await browser.close();
  return { name, ok: false };
}

(async () => {
  const d = await login('desktop', VIEWPORTS.desktop);
  const m = await login('mobile', VIEWPORTS.mobile);
  console.log('PHASE4_DONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
