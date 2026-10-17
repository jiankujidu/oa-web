// 优品OA 网页版 · 单一 Worker（静态托管 + API 全反代）
// Service Worker 格式（addEventListener），兼容 Cloudflare 控制台粘贴与 API 上传。
// ───────────────────────────────────────────────────────────────
// 作用：把"网页前端"和"OA 接口"都收拢到你的 *.workers.dev 同域下。
//   浏览器 → https://oa-web-xxx.workers.dev（前端 + 接口同源）
//           → 本 Worker 把 /home /oa /customer /note /message /product /api /captcha.html 等
//             请求反代到 https://oa.upingbio.cn，并透传登录会话 Cookie。
//   浏览器认为同源，不会拦截任何请求；手机/电脑打开同一个网址即可登录使用。
//
// 说明：oa.upingbio.cn 是对方的第三方 OA，你无法把文件放进去，因此用本 Worker 做同域反代
//       是唯一"不改对方服务器、又能真登录"的干净方案。账号密码只经过你自己的 Worker。

const OA_ORIGIN = 'https://oa.upingbio.cn';
const STATIC_ORIGIN = 'https://jiankujidu.github.io/oa-web'; // 静态资源仍从这里拉

// 哪些路径视为 OA 业务接口（需反代到源站）
const API_RE = /^\/(home|oa|customer|note|message|product|api|file|admin|upload|attachment|public|captcha\.html|index\.php)/i;

function isApi(pathname) { return API_RE.test(pathname); }

async function proxyApi(request, url) {
  const target = OA_ORIGIN + url.pathname + url.search;
  const hdr = new Headers(request.headers);
  hdr.delete('host');
  hdr.delete('origin');
  hdr.delete('referer');
  // 同源模式下，浏览器带的是 workers.dev 的会话 Cookie，原样转发给源站（值一致即等效）
  const init = { method: request.method, headers: hdr };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }
  let resp;
  try {
    resp = await fetch(target, init);
  } catch (e) {
    return new Response('OA 接口代理失败: ' + e.message, { status: 502 });
  }

  const rh = new Headers(resp.headers);
  // 透传 Set-Cookie：去掉 Domain 限制，让浏览器把它存为 workers.dev 的 Cookie（会话保持）
  const sc = (typeof resp.headers.getSetCookie === 'function')
    ? resp.headers.getSetCookie()
    : (rh.get('set-cookie') ? [rh.get('set-cookie')] : []);
  rh.delete('set-cookie');
  for (const c of sc) rh.append('set-cookie', c.replace(/;\s*Domain=[^;]+/i, ''));
  // 同源其实不需要 CORS，但保留以防客户端带 Origin 时仍正常
  rh.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
  rh.set('Access-Control-Allow-Credentials', 'true');
  rh.set('Access-Control-Allow-Headers', 'content-type,x-requested-with,authorization');
  rh.set('Access-Control-Expose-Headers', '*');
  return new Response(resp.body, { status: resp.status, headers: rh });
}

async function proxyStatic(pathname, request) {
  const target = STATIC_ORIGIN + pathname;
  let resp;
  try {
    resp = await fetch(target, {
      method: 'GET',
      headers: { 'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0' }
    });
  } catch (e) {
    return new Response('静态资源加载失败: ' + e.message, { status: 502 });
  }
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('text/html')) {
    let html = await resp.text();
    // 注入同域标记：让前端 oa.js 的 BASE 走 location.origin（同源），API 请求发回本 Worker
    html = html.replace('</head>', '<script>window.OA_BASE=location.origin;</script></head>');
    const rh = new Headers(resp.headers);
    rh.set('content-type', 'text/html; charset=utf-8');
    return new Response(html, { status: resp.status, headers: rh });
  }
  return new Response(resp.body, { status: resp.status, headers: resp.headers });
}

async function handle(request) {
  const url = new URL(request.url);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/' || pathname === '') pathname = '/login.html';
  if (isApi(pathname)) return proxyApi(request, url);
  return proxyStatic(pathname, request);
}

addEventListener('fetch', function (event) {
  event.respondWith(handle(event.request));
});
