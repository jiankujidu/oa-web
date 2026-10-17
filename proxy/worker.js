// 优品OA 网页版 · CORS 代理（Cloudflare Worker）
// 作用：浏览器 → 本 Worker → 第三方 OA(oa.upingbio.cn)。
//       补齐 CORS 响应头，并透传登录 session 的 Set-Cookie，
//       解决 GitHub Pages / 本地等“异域”部署时的跨域拦截（登录 POST 被浏览器拦）。
//
// 部署（最简单，无需自己域名）：
//   1. 登录 https://dash.cloudflare.com → Workers & Pages → 创建 Worker（Hello World 模板）
//   2. 把本文件全部内容粘贴覆盖，保存并 Deploy
//   3. 得到地址 https://<你的子域>.workers.dev
//
// 使用（二选一）：
//   A. 登录页底部「跨域代理设置」里填： https://<你的子域>.workers.dev/?url=
//   B. 或直接访问： https://jiankujidu.github.io/oa-web/login.html?proxy=https://<你的子域>.workers.dev/?url=
//
// 说明：请求会被转发到 oa.upingbio.cn，凭证/会话只经过你自己的 Worker，不经过任何第三方。

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response('缺少 url 参数。用法: ?url=<编码后的目标完整地址>', { status: 400 });
    }
    let t;
    try { t = new URL(target); } catch (e) { return new Response('url 参数非法', { status: 400 }); }

    // 回显来源，允许带凭据（登录需要 cookie）
    const origin = request.headers.get('Origin') || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE,PATCH',
      'Access-Control-Allow-Headers': 'content-type,x-requested-with,authorization',
      'Access-Control-Expose-Headers': '*'
    };

    // 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // 转发请求：去掉会让源站困惑的头部
    const hdr = new Headers(request.headers);
    hdr.delete('host');
    hdr.delete('origin');
    hdr.delete('referer');

    const init = { method: request.method, headers: hdr, redirect: 'manual' };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      init.duplex = 'half';
    }

    let resp;
    try {
      resp = await fetch(t.toString(), init);
    } catch (e) {
      return new Response('代理请求失败: ' + e.message, { status: 502 });
    }

    const rh = new Headers(resp.headers);

    // 透传 Set-Cookie：去掉 Domain 限制，让浏览器把它存为“代理域”的 cookie，
    // 后续请求浏览器会自动带回到本 Worker，再由 Worker 转发给 oa.upingbio.cn（会话保持）。
    const setCookies = (typeof resp.headers.getSetCookie === 'function')
      ? resp.headers.getSetCookie()
      : (rh.get('set-cookie') ? [rh.get('set-cookie')] : []);
    rh.delete('set-cookie');
    for (const c of setCookies) {
      rh.append('set-cookie', c.replace(/;\s*Domain=[^;]+/i, ''));
    }

    // 补齐 CORS 头
    for (const k in cors) rh.set(k, cors[k]);

    return new Response(resp.body, { status: resp.status, headers: rh });
  }
};
