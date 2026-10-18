// phase5.js —— 双端外壳彻底分离验证（无验证码 / 无真实登录）
// 让 app.js 正常加载（定义 OA，boot 调用 OA.isLoggedIn），但：
//   1) addInitScript 置 localStorage.uping_user='1' → OA.isLoggedIn()=true，boot 不跳 login.html
//   2) 拦截 OA 业务接口请求并 abort，使其抛网络错误（而非“请先登录”响应）→ 不会触发 onSessionExpired 重定向
//   外壳为登录前即存在的静态 DOM，data-device 由 app.js 按视口/UA 锁定；
//   据此断言：桌面必须隐藏 .m-appbar/.m-tabbar/.m-search-sheet，手机必须隐藏 .sidebar/.topbar。
const { chromium } = require('playwright-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.BASE_URL || 'http://localhost:8123/index.html';

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const API_RE = /^\/(home|oa|customer|note|message|product|api|file|admin|upload|attachment|public|finance|article|contract|captcha\.html|index\.php)/i;

function probe() {
  const dev = document.documentElement.getAttribute('data-device');
  const ds = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return 'MISSING';
    return getComputedStyle(el).display;
  };
  return {
    device: dev,
    sidebar: ds('.sidebar'),
    topbar: ds('.topbar'),
    cmdk: ds('.cmdk-mask'),
    userMenu: ds('.user-menu'),
    mAppbar: ds('.m-appbar'),
    mTabbar: ds('.m-tabbar'),
    mSearchSheet: ds('.m-search-sheet'),
    mTitle: !!document.getElementById('m-title'),
    mBack: !!document.getElementById('m-back'),
  };
}

async function evalAt(page) {
  await page.waitForSelector('.sidebar, .m-appbar', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
  return await page.evaluate(probe);
}

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });

  // ---------- 桌面视口 ----------
  const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: DESKTOP_UA });
  await dCtx.addInitScript(() => { try { localStorage.setItem('uping_user', '1'); } catch (e) {} });
  const dPage = await dCtx.newPage();
  await dPage.route('**/*', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (API_RE.test(p)) return route.abort();
    return route.continue();
  });
  await dPage.goto(BASE, { waitUntil: 'load' });
  const desktop = await evalAt(dPage);
  console.log('ASSERT desktop ' + JSON.stringify(desktop));

  // ---------- 手机视口 ----------
  const mCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: MOBILE_UA,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await mCtx.addInitScript(() => { try { localStorage.setItem('uping_user', '1'); } catch (e) {} });
  const mPage = await mCtx.newPage();
  await mPage.route('**/*', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (API_RE.test(p)) return route.abort();
    return route.continue();
  });
  await mPage.goto(BASE, { waitUntil: 'load' });
  const mobile = await evalAt(mPage);
  console.log('ASSERT mobile ' + JSON.stringify(mobile));

  // ---------- 判定 ----------
  const dOk = desktop.device === 'desktop'
    && desktop.mAppbar === 'none' && desktop.mTabbar === 'none' && desktop.mSearchSheet === 'none'
    && desktop.sidebar !== 'none' && desktop.topbar !== 'none'
    && desktop.mTitle === true && desktop.mBack === true;
  const mOk = mobile.device === 'mobile'
    && mobile.sidebar === 'none' && mobile.topbar === 'none'
    && mobile.mAppbar !== 'none' && mobile.mTabbar !== 'none'
    && mobile.mTitle === true && mobile.mBack === true;
  console.log('RESULT desktop_ok=' + dOk + ' mobile_ok=' + mOk + ' ALL=' + (dOk && mOk));

  await browser.close();
  process.exit(dOk && mOk ? 0 : 1);
}

run().catch((e) => { console.error('ERR', e); process.exit(2); });
