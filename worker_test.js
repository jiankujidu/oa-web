/* 本地验证 dist/worker.js：桩掉 addEventListener，直接驱动 handle()，
 * 校验 gzip 资产能正确解压、路由（/ → login、/index.html、SPA 兜底、/vendor/ 代理目标）。
 * 用法: node worker_test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, 'dist', 'worker.js'), 'utf8');

let captured = null;
const sandbox = {
  console,
  Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  Uint8Array, Map, Set, atob, btoa,
  Response, Headers, Request, URL, URLSearchParams,
  DecompressionStream, ReadableStream, TransformStream,
  TextEncoder, TextDecoder,
  fetch: async (url) => {
    if (String(url).includes('jiankujidu.github.io')) {
      return new Response('// vendor lib stub', { status: 200, headers: { 'content-type': 'application/javascript' } });
    }
    return new Response('{"code":0,"data":[]}', { status: 200, headers: {} });
  },
  addEventListener: (type, fn) => { if (type === 'fetch') captured = fn; }
};
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext(code, ctx, { filename: 'worker.js' });

let failures = 0;
function check(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else { failures++; console.log('  ✗ FAIL: ' + msg); }
}

async function get(p) {
  const req = new Request('https://oa.jk93.qzz.io' + p, { method: 'GET' });
  let pending = null;
  const ev = { request: req, respondWith: (r) => { pending = r; } };
  captured(ev);
  return pending;
}

(async function main() {
  console.log('== worker 路由与解压 ==');
  check(typeof captured === 'function', 'fetch 监听已注册');

  let r = await get('/');
  let txt = await r.text();
  check(r.status === 200, '/ → 200');
  check(txt.indexOf('window.OA_BASE=location.origin') >= 0, '/ 注入了 OA_BASE（同域反代收拢）');
  check(txt.indexOf('page-container') >= 0, '/ 即主界面壳（未登录由启动脚本跳 login.html）');
  check(txt.indexOf('DT_HEAD') >= 0, '/ 含新版桌面设计系统');
  check((r.headers.get('content-type') || '').indexOf('text/html') === 0, '/ content-type=text/html');

  r = await get('/login.html');
  txt = await r.text();
  check(txt.indexOf('login') >= 0 && txt.indexOf('captcha') >= 0, '/login.html 是登录页');
  check(txt.indexOf('优品OA') >= 0, '登录页标题正确');

  r = await get('/index.html');
  txt = await r.text();
  check(txt.indexOf('page-container') >= 0, '/index.html 含主界面容器');
  check(txt.indexOf('var App = (function') >= 0 || txt.indexOf('App = (function') >= 0, 'app.js 已内联');
  check(txt.indexOf('优品OA 网页版 · 主逻辑') >= 0, 'app.js 网页版适配层已内联');
  check(txt.indexOf('ui-dialog-root') < 0 || txt.indexOf('ensureDialogRoot') >= 0, 'app.js 内容完整');
  check(txt.indexOf('sidebar') >= 0, '桌面侧栏已内联');
  check(txt.indexOf('OA.API') >= 0, 'API 共享层已内联');
  check(txt.indexOf('APPROVE_FORMS') >= 0, '审批表单元数据已内联');
  check(txt.indexOf('openSalesAgreement') >= 0, 'doc.js 已内联');

  r = await get('/git');
  txt = await r.text();
  check(txt.indexOf('__') < 0 || txt.indexOf('COMMIT') < 0, '/git 占位符已替换');

  r = await get('/some/unknown/path');
  txt = await r.text();
  check(txt.indexOf('login') >= 0, '未知路径 SPA 兜底回登录页');

  r = await get('/vendor/jszip.min.js');
  txt = await r.text();
  check(txt.indexOf('vendor lib stub') >= 0, '/vendor/* 代理到 GitHub Pages');

  r = await get('/home/index/index');
  txt = await r.text();
  check(txt.indexOf('code') >= 0, 'API 路径反代到 OA 源站');

  console.log('\n结果: ' + (failures ? failures + ' 项失败' : '全部通过'));
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error('worker 测试异常:', e); process.exit(1); });
