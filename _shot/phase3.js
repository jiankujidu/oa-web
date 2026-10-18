// Phase 3: 同一会话内解决验证码——加载登录页→导出当前验证码图片→等待 answer_<name>.txt
// （由外部写入答案）→提交登录；失败自动刷新验证码重来，最多 3 次。登录后双视口截图。
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname;
const BASE = 'https://oa.jk93.qzz.io';
const USER = 'chenmeilong';
const PASS = 'Yp123.';

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', isMobile: false },
  mobile: { viewport: { width: 390, height: 844, deviceScaleFactor: 3 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', isMobile: true },
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function solveCaptchaInteractive(page, name, attempt) {
  const ansFile = path.join(OUT, 'answer_' + name + '.txt');
  try { fs.unlinkSync(ansFile); } catch (e) {}
  const b64 = await page.evaluate(() => {
    const img = document.getElementById('captcha-img');
    if (!img || !img.complete || !img.naturalWidth) return null;
    try {
      // 直接读“页面上正在显示”的验证码（canvas 重绘，不发任何网络请求，
      // 服务端会话里期待的验证码就是这张显示中的图）
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
  console.log('[' + name + '] attempt ' + attempt + ': captcha saved, waiting for answer file...');
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
  const logs = [];
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));

  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    await page.goto(BASE + '/login.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#captcha-img', { timeout: 15000 });
    await page.fill('#username', USER);
    await page.fill('#password', PASS);
    const answer = await solveCaptchaInteractive(page, name, attempt);
    console.log('[' + name + '] got answer: ' + answer);
    await page.fill('#captcha', answer);
    await page.click('#login-btn');
    await page.waitForTimeout(2500);
    const tip = await page.evaluate(() => (document.getElementById('tip') || {}).textContent || '');
    console.log('[' + name + '] attempt ' + attempt + ' tip: ' + tip);
    if (/验证码不正确/.test(tip)) { console.log('[' + name + '] captcha wrong (' + attempt + '), retrying'); continue; }
    await page.waitForURL('**/index.html', { timeout: 20000 }).catch(() => logs.push('no redirect'));
    await page.waitForTimeout(2600);
    const st = await page.evaluate(() => ({
      url: location.href,
      device: document.documentElement.getAttribute('data-device'),
      title: (document.getElementById('topbar-title') || {}).textContent,
      mTitle: (document.getElementById('m-title') || {}).textContent,
      tip: (document.getElementById('tip') || {}).textContent,
    }));
    console.log('[' + name + '] after login:', JSON.stringify(st));
    if (!/index\.html/.test(st.url)) { console.log('[' + name + '] login failed, tip=' + st.tip); continue; }
    ok = true;
    await page.screenshot({ path: path.join(OUT, name + '_home.png') });

    if (name === 'desktop') {
      await page.evaluate(() => App.switchTab('customer'));
      await page.waitForTimeout(2400);
      await page.screenshot({ path: path.join(OUT, 'desktop_customer.png') });
      await page.evaluate(() => App.showSubPage('order-my'));
      await page.waitForTimeout(2400);
      await page.screenshot({ path: path.join(OUT, 'desktop_order_my.png') });
      await page.evaluate(() => App.switchTab('mine'));
      await page.waitForTimeout(1800);
      await page.screenshot({ path: path.join(OUT, 'desktop_mine.png') });
    }
    if (name === 'mobile') {
      await page.evaluate(() => App.switchTab('mine'));
      await page.waitForTimeout(1800);
      await page.screenshot({ path: path.join(OUT, 'mobile_mine.png') });
      await page.evaluate(() => App.showSubPage('order-my'));
      await page.waitForTimeout(2600);
      await page.screenshot({ path: path.join(OUT, 'mobile_order_my.png') });
      const labeled = await page.evaluate(() => {
        const t = document.querySelector('.dt-table');
        if (!t) return 'no-table';
        const td = t.querySelector('tbody td');
        return td ? (td.getAttribute('data-label') || '(empty)') : 'no-td';
      });
      console.log('[' + name + '] first td data-label: ' + labeled);
      await page.evaluate(() => App.switchTab('home'));
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT, 'mobile_home2.png') });
    }
  }
  fs.writeFileSync(path.join(OUT, name + '_phase3.log'), logs.join('\n'));
  await browser.close();
  return ok;
}

(async () => {
  const d = await login('desktop', VIEWPORTS.desktop);
  const m = await login('mobile', VIEWPORTS.mobile);
  console.log('PHASE3_DONE desktop=' + d + ' mobile=' + m);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
