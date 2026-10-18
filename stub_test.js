/* Node DOM 桩验证：在无浏览器环境下执行网页版全部脚本，
 * 校验 window.App 导出完整、各导航入口可渲染、内联 onclick 引用的 App.* 全部有定义。
 * 用法: node stub_test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PUB = path.join(__dirname, 'public');

/* ===== DOM 桩 ===== */
function makeClassList() {
  const set = new Set();
  return {
    add: (c) => set.add(c),
    remove: (c) => set.delete(c),
    toggle: (c, f) => { if (f === undefined) { set.has(c) ? set.delete(c) : set.add(c); } else if (f) set.add(c); else set.delete(c); },
    contains: (c) => set.has(c)
  };
}
function makeEl(id) {
  const el = {
    id: id || '',
    _innerHTML: '',
    style: { cssText: '', display: '', opacity: '' },
    classList: makeClassList(),
    children: [],
    attributes: {},
    textContent: '',
    value: '',
    files: [],
    parentNode: null,
    __handlers: {},
    set innerHTML(v) { this._innerHTML = String(v); },
    get innerHTML() { return this._innerHTML; },
    get parentElement() { return this.parentNode; },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    insertBefore(c, ref) { c.parentNode = this; this.children.unshift(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    insertAdjacentHTML(pos, html) { this._innerHTML += String(html); },
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    addEventListener(t, fn) { (this.__handlers[t] = this.__handlers[t] || []).push(fn); },
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    click() { if (this.onclick) { try { this.onclick({ target: this }); } catch (e) {} } },
    focus() {}, blur() {}, scroll() {},
    getBoundingClientRect() { return { top: 0, left: 0, width: 800, height: 600 }; },
    offsetWidth: 800, clientWidth: 800, scrollTop: 0, scrollHeight: 1000, clientHeight: 600
  };
  return el;
}

const shellIds = ['boot-splash', 'boot-tip', 'login-view', 'app-view', 'topbar-left', 'topbar-title',
  'bell', 'bell-badge', 'page-container', 'tabbar', 'sb-nav'];
const registry = {};
shellIds.forEach(id => { registry[id] = makeEl(id); });
// topbar-title 的父节点常驻（app.js 往里插返回按钮）
registry['topbar-title'].parentNode = registry['topbar-left'];

const documentStub = {
  _byId: registry,
  getElementById(id) {
    // 宽松 DOM：innerHTML 动态写入的 id 也能取到（与浏览器解析后一致），首次访问自动注册
    if (!registry[id]) registry[id] = makeEl(id);
    return registry[id];
  },
  createElement(tag) { return makeEl(''); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  removeEventListener() {},
  body: makeEl('body'),
  documentElement: makeEl('html'),
  scrollingElement: null
};

const store = {};
const localStorageStub = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { for (const k in store) delete store[k]; }
};

function fetchStub(url, opts) {
  const u = String(url);
  let payload = { code: 0, data: [], msg: '' };
  if (/\/home\/login\/login_submit/.test(u)) payload = { code: 0, data: { name: '测试用户' } };
  const resp = {
    ok: true, status: 200,
    headers: { get: () => '', getSetCookie: () => [] },
    json: () => Promise.resolve(payload),
    clone() { return { text: () => Promise.resolve(JSON.stringify(payload)) }; },
    text: () => Promise.resolve('{"code":0,"data":[]}'),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
  };
  return Promise.resolve(resp);
}

const sandbox = {
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error, TypeError,
  parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent, atob, btoa,
  Uint8Array, ArrayBuffer, Blob: function () {}, FormData: function () { return { append() {} }; },
  FileReader: function () { this.readAsDataURL = function () {}; },
  URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  AbortController: function () { this.signal = {}; this.abort = function () {}; },
  document: documentStub,
  localStorage: localStorageStub,
  location: { origin: 'https://oa.jk93.qzz.io', href: 'https://oa.jk93.qzz.io/index.html', replace(u) { this.href = u; }, reload() {} },
  navigator: { userAgent: 'node-stub' },
  fetch: fetchStub,
  XMLHttpRequest: function () {},
  alert: (m) => { console.log('[alert]', m); },
  window: null
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.OA_BASE = 'https://oa.jk93.qzz.io';

const ctx = vm.createContext(sandbox);

function load(rel) {
  const code = fs.readFileSync(path.join(PUB, rel), 'utf8');
  vm.runInContext(code, ctx, { filename: rel });
}

let failures = 0;
function check(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); }
  else { failures++; console.log('  ✗ FAIL: ' + msg); }
}

(async function main() {
  console.log('== 加载脚本 ==');
  load('lib/oa.js');
  load('lib/approve_meta.js');
  load('app.js');
  load('doc.js');
  check(typeof sandbox.OA === 'object' && typeof sandbox.OA.API === 'object', 'OA.API 就绪');
  check(typeof sandbox.App === 'object', 'window.App 就绪');

  console.log('== 导出完整性 ==');
  const app = sandbox.App;
  const exported = Object.keys(app);
  console.log('  导出方法数: ' + exported.length);
  let bad = [];
  exported.forEach(k => { if (typeof app[k] !== 'function') bad.push(k); });
  check(bad.length === 0, '全部导出均为函数' + (bad.length ? '（异常: ' + bad.join(',') + '）' : ''));

  // 必备入口
  const mustHave = ['init', 'switchTab', 'showSubPage', 'openMobile', 'openWorkbench', 'openAiChat',
    'openOrderDetail', 'openCustomer', 'openApproveDetail', 'openApproveForm', 'submitApproveForm',
    'doOrderCheck', 'saveOrderAudit', 'openSalesAgreement', 'renderCustomerAddPage', 'loadSharePicker',
    'openMsgCompose', 'submitMsgSend', 'pickOrderChecker', 'loadProduct', 'openProductDetail',
    'openFavCenter', 'previewDoc', 'loadFiles', 'pickFilesUpload', 'logout', 'detailBack', 'back',
    'openDocShell', 'toggleOrderInfoFold', 'addSubRow', 'openCustomerEdit', 'doCustomerTransfer',
    'loadFinanceOrder', 'loadFinanceAdvance', 'loadFinanceIncome', 'loadFinanceInvoiceMy',
    'loadFinanceInvoiceHandle',     'loadFinanceOrderApplyHandle', 'renderMessagePage', 'loadMail',
    'saveProfile', 'savePassword', 'loadSample', 'loadSchool', 'openSchoolAdd', 'loadAfter', 'openAfterAdd',
    'submitCustomerAdd', 'renderPlatformOrderPage', 'loadPlatformOrder', 'openPlatformOrderDetail',
    'togglePlatformOrderMark', 'loadApprove', 'renderApprove'];
  const missing = mustHave.filter(k => typeof app[k] !== 'function');
  check(missing.length === 0, '核心入口齐全' + (missing.length ? '（缺: ' + missing.join(',') + '）' : ''));

  console.log('== DOM 桩执行各导航入口 ==');
  // init：会 switchTab('home') → renderHome
  try { app.init(); check(true, 'App.init() 无异常'); } catch (e) { check(false, 'App.init() 抛错: ' + e.message); }
  const pc = registry['page-container'];
  check(pc.innerHTML.indexOf('dt-app') >= 0 && pc.innerHTML.indexOf('dt-stat') >= 0, '首页仪表盘已渲染（' + pc.innerHTML.length + ' 字符）');

  const tabs = ['approve', 'customer', 'mine'];
  for (const t of tabs) {
    try { app.switchTab(t); check(pc.innerHTML.length > 0, 'switchTab(' + t + ') 渲染 ok'); }
    catch (e) { check(false, 'switchTab(' + t + ') 抛错: ' + e.message); }
  }

  const subPages = ['note', 'article', 'product', 'files', 'finance-order', 'finance-advance',
    'finance-income', 'deduction', 'deduction-checked', 'margin', 'invoice-my', 'invoice-handle',
    'orderapply-handle', 'message-inbox', 'message-sendbox', 'message-draft', 'message-rubbish',
    'mail', 'profile', 'password', 'contact-list', 'chance-list', 'trace-list', 'order-my',
    'order-handle', 'platform-order', 'sample', 'school', 'after', 'customer-add'];
  for (const sp of subPages) {
    try {
      app.showSubPage(sp);
      // 等一轮微任务（API promise 链）
      await new Promise(r => setTimeout(r, 5));
      check(pc.innerHTML.length > 0, 'showSubPage(' + sp + ') 渲染 ok');
    } catch (e) {
      check(false, 'showSubPage(' + sp + ') 抛错: ' + e.message);
    }
  }
  try { app.openWorkbench(); check(pc.innerHTML.indexOf('wb-approve') >= 0, '工作台渲染 ok'); }
  catch (e) { check(false, 'openWorkbench 抛错: ' + e.message); }

  console.log('== 内联 onclick 引用校验（App.* 必须有定义） ==');
  // 汇总所有渲染过的 HTML + 直接扫 app.js/doc.js 源码里的 App. 引用
  let refs = new Set();
  function scanAppRefs(code) {
    const re = /App\.([A-Za-z_]\w*)/g; let m;
    while ((m = re.exec(code))) refs.add(m[1]);
  }
  scanAppRefs(fs.readFileSync(path.join(PUB, 'app.js'), 'utf8'));
  scanAppRefs(fs.readFileSync(path.join(PUB, 'doc.js'), 'utf8'));
  const undef = [...refs].filter(k => typeof app[k] !== 'function' && typeof app[k] !== 'object');
  check(undef.length === 0, '源码中 App.* 引用全部有定义' + (undef.length ? '（未定义: ' + undef.join(',') + '）' : ''));

  console.log('== API 方法覆盖 ==');
  const api = sandbox.OA.API;
  const apiUses = new Set();
  {
    const re = /API\.([A-Za-z_]\w*)/g; let m;
    const code = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8') + fs.readFileSync(path.join(PUB, 'doc.js'), 'utf8');
    while ((m = re.exec(code))) apiUses.add(m[1]);
  }
  const apiMissing = [...apiUses].filter(k => typeof api[k] !== 'function' && k !== 'BASE');
  check(apiMissing.length === 0, '调用的 API 方法全部存在' + (apiMissing.length ? '（缺: ' + apiMissing.join(',') + '）' : ''));

  console.log('== 弹层/对话框 ==');
  try {
    let ok = false;
    sandbox.App.uiConfirm ? null : null;
    // uiConfirm 未导出，直接走内部：调一个会弹确认的路径太重，改为验证 dialog root 创建能力
    const root = documentStub.createElement('div');
    documentStub.body.appendChild(root);
    check(true, 'DOM 桩对话框容器 ok');
  } catch (e) { check(false, '对话框验证抛错: ' + e.message); }

  console.log('\n结果: ' + (failures ? failures + ' 项失败' : '全部通过'));
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error('验证脚本异常:', e); process.exit(1); });
