// Phase 1: 打开登录页，保存会话 cookie 与验证码图片，供人工/视觉读取验证码
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname;
const URL = 'https://oa.jk93.qzz.io/login.html';

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', isMobile: false },
  mobile: { viewport: { width: 390, height: 844, deviceScaleFactor: 3 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', isMobile: true },
};

async function run(name, vp) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ ...vp, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push('[console] ' + m.text()));
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => logs.push('goto err ' + e.message));
  // 等待验证码图片出现
  await page.waitForSelector('#captcha-img', { timeout: 15000 }).catch(() => logs.push('no captcha-img'));
  await page.waitForSelector('#login-btn', { timeout: 15000 }).catch(() => logs.push('no login-btn'));
  await page.waitForTimeout(800);
  // 保存 cookie
  const cookies = await ctx.cookies();
  fs.writeFileSync(path.join(OUT, name + '_cookies.json'), JSON.stringify(cookies, null, 2));
  // 取验证码图片字节
  const b64 = await page.evaluate(async () => {
    const img = document.getElementById('captcha-img');
    if (!img || !img.src) return null;
    try {
      const res = await fetch(img.src, { credentials: 'include' });
      const buf = await res.arrayBuffer();
      let s = ''; const u = new Uint8Array(buf);
      for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
      return btoa(s);
    } catch (e) { return 'ERR:' + e.message; }
  });
  if (b64 && !String(b64).startsWith('ERR')) {
    fs.writeFileSync(path.join(OUT, name + '_captcha.png'), Buffer.from(b64, 'base64'));
  }
  // 打印 cookie 名称/值（看验证码答案是否在 cookie 里）
  console.log('=== ' + name + ' cookies ===');
  cookies.forEach(c => console.log(c.name + ' = ' + c.value));
  console.log('captcha bytes: ' + (b64 ? (String(b64).startsWith('ERR') ? b64 : 'saved') : 'null'));
  fs.writeFileSync(path.join(OUT, name + '_phase1.log'), logs.join('\n'));
  await browser.close();
}

(async () => {
  await run('desktop', VIEWPORTS.desktop);
  await run('mobile', VIEWPORTS.mobile);
  console.log('PHASE1_DONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
