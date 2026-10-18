<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="format-detection" content="telephone=no">
<title>优品OA · 登录</title>
<style>
:root{--blue:#1E6FFF;--blue2:#4A9BFF;--ink:#1f2329;--sub:#8a8f99;--line:#e8ecf2;--err:#e64340}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
  background:#eef4ff;color:var(--ink);display:flex;align-items:center;justify-content:center;
  min-height:100dvh;padding:16px;overflow-x:hidden}
.backdrop{position:fixed;inset:0;z-index:0;overflow:hidden;
  background:linear-gradient(160deg,#1E6FFF 0%,#4A9BFF 48%,#EAF2FF 100%)}
.backdrop .blob{position:absolute;border-radius:50%;filter:blur(2px);opacity:.5}
.backdrop .b1{width:280px;height:280px;background:rgba(255,255,255,.35);top:-60px;right:-40px}
.backdrop .b2{width:220px;height:220px;background:rgba(74,155,255,.5);bottom:-50px;left:-30px}
.backdrop .ring{position:absolute;width:150px;height:150px;border:2px solid rgba(255,255,255,.25);border-radius:50%;top:60%;left:12%}
.card{position:relative;z-index:1;width:100%;max-width:420px;background:#fff;border-radius:20px;
  padding:30px 24px 26px;box-shadow:0 14px 48px rgba(30,111,255,.28);animation:pop .35s ease}
@keyframes pop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
.logo{display:flex;align-items:center;justify-content:center;margin-bottom:6px}
.logo .mark{font-size:34px;font-weight:800;color:#fff;background:var(--blue);width:58px;height:58px;
  border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(30,111,255,.35)}
.logo .word{font-size:30px;font-weight:800;color:var(--blue);letter-spacing:2px;margin-left:12px}
.logo .word span{font-size:20px;font-weight:700;background:var(--blue);color:#fff;border-radius:7px;padding:2px 9px;margin-left:6px}
.sub{text-align:center;color:var(--sub);font-size:13px;margin-bottom:22px}
.field{display:flex;align-items:center;border:1px solid var(--line);border-radius:11px;
  padding:11px 13px;margin-bottom:12px;background:#fafcff;transition:.15s}
.field:focus-within{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(30,111,255,.10)}
.field .ico{width:24px;font-size:17px;text-align:center;margin-right:9px;color:var(--blue)}
.field input{flex:1;border:none;outline:none;font-size:15.5px;background:transparent;color:var(--ink)}
.field input::placeholder{color:#aab0ba}
.captcha-row{display:flex;align-items:center;gap:10px;margin:-2px 2px 10px}
.captcha-field{flex:1;min-width:0;display:flex;align-items:center;border:1px solid var(--line);border-radius:11px;padding:10px 12px;background:#fafcff;transition:.15s}
.captcha-field:focus-within{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(30,111,255,.10)}
.captcha-field input{flex:1;border:none;outline:none;font-size:15px;background:transparent;min-width:0}
/* 宽度用百分比自适应窄屏：绝不超出所在行（旧版固定 160px 在手机上会被挤出卡片） */
.captcha-img{height:44px;width:40%;max-width:160px;min-width:104px;object-fit:contain;background:#f2f6ff;border:1px solid #dbe7ff;border-radius:7px;cursor:pointer;flex:none;user-select:none}
.captcha-hint{font-size:12px;color:#9aa0aa;line-height:1.45}
.remember{display:flex;align-items:center;gap:7px;font-size:13px;color:#666;cursor:pointer;user-select:none;margin:2px 2px 0}
.remember input{width:16px;height:16px;accent-color:var(--blue);cursor:pointer}
.btn{width:100%;margin-top:20px;padding:14px 0;border:none;border-radius:12px;
  background:linear-gradient(90deg,var(--blue),var(--blue2));color:#fff;font-size:17px;font-weight:700;
  letter-spacing:4px;cursor:pointer;transition:.15s}
.btn:active{transform:scale(.99);opacity:.94}
.btn:disabled{opacity:.6;cursor:not-allowed}
.tip{color:var(--err);font-size:13px;margin-top:12px;text-align:center;min-height:18px}
.foot{color:#9aa0aa;font-size:12px;margin-top:22px;text-align:center;line-height:1.6}
.diag{margin-top:14px;font-size:12px;color:#8a8f99;border:1px dashed #d7e0ee;border-radius:10px;padding:8px 10px;background:#f7faff;text-align:left}
.diag summary{cursor:pointer;color:#5b6b85;user-select:none}
.diag-out{margin-top:8px;white-space:normal;line-height:1.7;word-break:break-all;color:#41506b}
.diag-btn{margin-top:8px;border:none;background:var(--blue);color:#fff;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer}
@media (min-width:860px){
  body{background:#eaf1ff}
  .card{max-width:960px;padding:0;display:flex;overflow:hidden;box-shadow:0 18px 60px rgba(30,111,255,.22)}
  .side{width:44%;background:linear-gradient(160deg,#1E6FFF 0%,#4A9BFF 60%,#7DB8FF 100%);color:#fff;
    padding:44px 40px;display:flex;flex-direction:column;position:relative;overflow:hidden}
  .side .blob{position:absolute;border-radius:50%;background:rgba(255,255,255,.16)}
  .side .b1{width:220px;height:220px;top:-50px;right:-40px}
  .side .b2{width:160px;height:160px;bottom:-30px;left:-20px}
  .side .brand{display:flex;align-items:center;position:relative;z-index:1}
  .side .brand .m{width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;margin-right:14px}
  .side .brand .n{font-size:26px;font-weight:800;letter-spacing:1px}
  .side .slogan{position:relative;z-index:1;margin-top:auto;font-size:22px;font-weight:700;line-height:1.6}
  .side .slogan em{font-style:normal;color:#BEE3FF}
  .side .feats{position:relative;z-index:1;margin-top:28px}
  .side .feats li{list-style:none;display:flex;align-items:center;font-size:14px;margin:12px 0;color:rgba(255,255,255,.92)}
  .side .feats li b{margin-right:10px;font-weight:400}
  .pane{flex:1;display:flex;align-items:center;justify-content:center;padding:48px 44px;background:#fff}
  .pane .inner{width:100%;max-width:380px}
  .pane .sub{margin-bottom:24px}
}
</style>
<script>window.OA_BASE=location.origin;</script></head>
<body>
<div class="backdrop"><div class="blob b1"></div><div class="blob b2"></div><div class="ring"></div></div>
<div class="card">
  <div class="side" style="display:none">
    <div class="blob b1"></div><div class="blob b2"></div>
    <div class="brand"><div class="m">优</div><div class="n">优品OA</div></div>
    <div class="slogan">让管理<br><em>更轻松一点</em></div>
    <ul class="feats">
      <li><b>✓</b>审批 · 客户 · 财务 · 订单一站直达</li>
      <li><b>✓</b>手机电脑同源，随时随地处理</li>
      <li><b>✓</b>算式验证码，简单几步完成登录</li>
    </ul>
  </div>
  <div class="pane">
    <div class="inner">
      <div class="logo"><div class="mark">优</div><div class="word">优品<span>OA</span></div></div>
      <div class="sub">企业办公 · 登录你的账号</div>
      <div class="field"><span class="ico">👤</span><input id="username" type="text" autocomplete="username" placeholder="账号 / 手机号" autofocus></div>
      <div class="field"><span class="ico">🔒</span><input id="password" type="password" autocomplete="current-password" placeholder="密码"></div>
      <div class="captcha-row">
        <div class="captcha-field"><span class="ico">🔢</span><input id="captcha" type="text" inputmode="numeric" placeholder="算式结果" autocomplete="off"></div>
        <img id="captcha-img" class="captcha-img" alt="验证码" title="点我换一张" draggable="false">
      </div>
      <div class="captcha-hint">💡 看右侧算式填结果，例如 2+6 填 8；点图刷新</div>
      <label class="remember" style="margin-top:14px"><input type="checkbox" id="remember"><span>记住账号密码</span></label>
      <button class="btn" id="login-btn">登 录</button>
      <div class="tip" id="tip"></div>
      <div class="foot" id="foot"></div>
      <details class="diag" id="diag-box">
        <summary>🔧 连接诊断（登录不了时点开运行）</summary>
        <div id="diag-out" class="diag-out">点击下方按钮，在你当前网络里实测登录链路三步。</div>
        <button type="button" id="diag-run" class="diag-btn">运行诊断</button>
      </details>
    </div>
  </div>
</div>

<script>
/* 优品OA 网页版 · 共享层（接口 1:1 对齐 App 源码 www/js/api.js）
 * 网页端无 AndroidBridge，全部走 fetch；credentials:'include' 携带会话 Cookie。
 * 通过 Cloudflare Worker 同域反代（window.OA_BASE = location.origin），无跨域问题。
 * 方法名/参数/路径与 App api.js 完全一致，app.js 可 1:1 移植。
 */
(function (g) {
  "use strict";

  var BASE = g.OA_BASE || 'https://oa.upingbio.cn';

  function qs(p) {
    p = p || {};
    var parts = [];
    for (var k in p) {
      if (p[k] === undefined || p[k] === null || p[k] === '') continue;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(p[k]));
    }
    return parts.length ? '?' + parts.join('&') : '';
  }
  function encBody(d) {
    d = d || {};
    var parts = [];
    for (var k in d) {
      var v = d[k];
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        // 同名参数重复发送（支持后端 [] 字段，对齐 App encodeBody）
        for (var i = 0; i < v.length; i++) {
          if (v[i] === undefined || v[i] === null || v[i] === '') continue;
          parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v[i]));
        }
        continue;
      }
      if (v === '') continue;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
    return parts.join('&');
  }
  function fullUrl(path, q) { return BASE + path + (q || ''); }
  function safeParse(s) {
    if (s === null || s === undefined) return null;
    if (typeof s === 'object') return s;
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  // 会话守卫：业务接口返回"请先登录"等 → 触发 onSessionExpired（页面层回登录页）
  function sessionExpiredFromText(t) {
    if (!t) return false;
    return /请先登录|请重新登录|未登录|登录已失效|无权限|会话已(过期|失效)/.test(t);
  }
  function guardSession(v) {
    if (v && v.code === 404) {
      var msg = String(v.msg || '');
      if (sessionExpiredFromText(msg) || /登录/.test(msg)) {
        if (g.OA && g.OA._onSessionExpired) g.OA._onSessionExpired(msg);
      }
    }
    return v;
  }

  // fetch 超时包装（默认 12s，避免弱网无限 pending）
  function fetchTimeout(url, opts, ms) {
    ms = ms || 12000;
    return new Promise(function (resolve, reject) {
      var done = false;
      var ctl = ('AbortController' in g) ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        if (ctl) ctl.abort();
        reject(new Error('timeout'));
      }, ms);
      var o = opts || {};
      if (ctl) o.signal = ctl.signal;
      g.fetch(url, o).then(function (r) {
        done = true; clearTimeout(timer); resolve(r);
      }, function (e) {
        done = true; clearTimeout(timer); reject(e);
      });
    });
  }

  // 通用 GET JSON（带 XHR 头）
  function apiGet(path, params) {
    return fetchTimeout(fullUrl(path, qs(params)), {
      method: 'GET', credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function (r) { return r.json(); })
      .then(function (v) { return guardSession(v); });
  }

  // 通用 GET 纯文本（页面型接口，不带 XHR 头）
  function apiGetPlain(path, params) {
    return fetchTimeout(fullUrl(path, qs(params)), { method: 'GET', credentials: 'include' })
      .then(function (r) { return r.text(); })
      .then(function (raw) {
        if (sessionExpiredFromText(raw) && g.OA && g.OA._onSessionExpired) {
          g.OA._onSessionExpired('页面接口返回未登录提示');
        }
        return raw;
      });
  }

  // POST 响应统一解析：服务端可能回 JSON，也可能回 HTML 兜底页
  function parseResp(r) {
    return r.clone().text().then(function (raw) {
      var v = safeParse(raw);
      if (v === null) {
        var m = raw.match(/\{[^\{]*"code"\s*:[^\}]*\}/);
        v = m ? safeParse(m[0]) : { code: 1, msg: '响应异常(HTTP ' + r.status + ')' };
      }
      return guardSession(v);
    });
  }

  // 通用 POST 表单（带 XHR 头）
  function apiPost(path, data) {
    return fetchTimeout(fullUrl(path, ''), {
      method: 'POST', credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: encBody(data)
    }).then(parseResp);
  }

  // 无 XHR 头 POST（审批提交 /oa/approve/add 必须不带）
  function apiPostPlain(path, data) {
    return fetchTimeout(fullUrl(path, ''), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: encBody(data)
    }).then(parseResp);
  }

  function fmtTime(t) {
    if (!t) return '';
    t = String(t);
    if (/^\d{10}$/.test(t)) t = new Date(parseInt(t, 10) * 1000).toLocaleString('zh-CN');
    else if (/^\d{13}$/.test(t)) t = new Date(parseInt(t, 10)).toLocaleString('zh-CN');
    else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(t)) { /* keep */ }
    else {
      var d = new Date(t);
      if (!isNaN(d)) t = d.toLocaleString('zh-CN');
    }
    return t;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function absUrl(u) {
    if (!u) return '';
    if (u.indexOf('http') === 0) return u;
    if (u.indexOf('//') === 0) return 'https:' + u;
    return BASE + (u.charAt(0) === '/' ? '' : '/') + u;
  }

  var API = {
    BASE: BASE,
    absUrl: absUrl,

    // ===== 登录 / 验证码 =====
    login: function (username, password, captcha) {
      return apiPost('/home/login/login_submit', { username: username, password: password, captcha: captcha });
    },
    captchaUrl: function () { return BASE + '/captcha.html?t=' + Date.now(); },

    // ===== 首页信息（msg_num / 用户信息）=====
    indexInfo: function () { return apiPost('/home/index/index', {}); },
    homePageHtml: function () { return apiGetPlain('/home/index/index', {}); },

    // ===== 审批 =====
    approveList: function (page, limit, status) {
      var p = { page: page, limit: limit };
      if (status) p.status = status;
      return apiGet('/oa/approve/index', p);
    },
    approveCheck: function (id, status, remark) {
      return apiPost('/oa/approve/check', { id: id, status: status, remark: remark || '' });
    },
    approveSubmit: function (data) { return apiPostPlain('/oa/approve/add', data); },
    flowUsers: function (flowId) { return apiGet('/api/index/get_flow_users', { id: flowId }); },
    flowNodes: function (actionId) { return apiGet('/api/index/get_flow_nodes', { id: actionId }); },

    // ===== 客户 =====
    customerList: function (page, limit, type, keyword) {
      var path = '/customer/index/index';
      if (type === 2) path = '/customer/index/sea';
      if (type === 3) path = '/customer/index/trash';
      var p = { page: page, limit: limit };
      if (keyword) p.keywords = keyword;
      return apiGet(path, p);
    },
    customerContact: function (cid) { return apiGet('/customer/api/get_contact', { customer_id: cid }); },
    customerTrace: function (cid) { return apiGet('/customer/api/get_trace', { customer_id: cid }); },
    customerChance: function (cid) { return apiGet('/customer/api/get_chance', { customer_id: cid }); },
    customerView: function (id) { return apiGet('/customer/index/view', { id: id }); },
    customerAdd: function (data) { return apiPost('/customer/index/add', data); },
    customerToSea: function (id) { return apiPost('/customer/index/to_sea', { id: id }); },
    customerTransfer: function (data) { return apiPost('/customer/index/transfer', data); },
    customerAddDefaults: function () {
      return apiGetPlain('/customer/index/add.html').then(function (html) {
        function val(name) { var m = html.match(new RegExp('name="' + name + '"[^>]*value="([^"]*)"')); return m ? m[1] : ''; }
        function selVal(name) { var m = html.match(new RegExp('name="' + name + '"[\\s\\S]*?<option value="([^"]*)"[^>]*selected')); return m ? m[1] : ''; }
        return {
          belong_name: val('belong_name'),
          belong_uid: val('belong_uid'),
          belong_did: val('belong_did'),
          belong_department: selVal('belong_department') || val('belong_department')
        };
      });
    },

    // ===== 公告 / 问答 / 产品 / 附件 / 通讯录 / 消息 =====
    noteList: function (page, limit, cateId) {
      var p = { page: page, limit: limit };
      if (cateId) p.cate_id = cateId;
      return apiGet('/note/index/index', p);
    },
    articleList: function (page, limit, cateId) {
      var p = { page: page, limit: limit };
      if (cateId) p.cate_id = cateId;
      return apiGet('/article/index/index', p);
    },
    productList: function (page, limit, keyword, filters) {
      var p = { page: page, limit: limit };
      if (keyword) p.keywords = keyword;
      for (var k in (filters || {})) {
        var v = filters[k];
        if (v === undefined || v === null || v === '') continue;
        p[k] = v;
      }
      return apiGet('/product/index/list', p);
    },
    productCateTree: function () {
      return apiGetPlain('/product/index/list').then(function (html) {
        var start = html.indexOf('encodedJsonString');
        if (start < 0) return [];
        var seg = html.slice(start, start + 400000);
        var quote = seg.indexOf("'");
        var end = seg.indexOf("';", quote + 1);
        if (quote < 0 || end < 0) return [];
        var enc = seg.slice(quote + 1, end);
        var json = enc.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        try { return JSON.parse(json) || []; } catch (e) { return []; }
      });
    },
    fileList: function (page, limit, keyword) {
      var p = { page: page, limit: limit };
      if (keyword) p.name = keyword;
      return apiGet('/home/files/index', p);
    },
    mailList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/home/index/mail_list', p);
    },
    messageList: function (tab, page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/message/index/' + tab, p);
    },
    messageRead: function (id) { return apiGetPlain('/message/index/read', { id: id }); },
    messageSend: function (data) { return apiPost('/message/index/send', data); },
    messageSave: function (data) { return apiPost('/message/index/save', data); },
    messageCheck: function (ids, type, source) {
      return apiPost('/message/index/check', { ids: ids, type: type, source: source || 0 });
    },

    // ===== 客户子功能：联系人 / 商机 / 跟进 =====
    contactList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/contact/index', p);
    },
    contactAdd: function (data) { return apiPost('/customer/contact/contact_add', data); },
    contactDel: function (id) { return apiPost('/customer/contact/contact_del', { id: id }); },
    chanceList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/chance/index', p);
    },
    chanceAdd: function (data) { return apiPost('/customer/chance/chance_add', data); },
    chanceDel: function (id) { return apiPost('/customer/chance/chance_del', { id: id }); },
    traceList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/trace/index', p);
    },
    traceAdd: function (data) { return apiPost('/customer/api/add_trace', data); },
    traceDel: function (id) { return apiPost('/customer/api/del_trace', { id: id }); },

    // ===== 订单 =====
    orderList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/order/index', p);
    },
    orderHandleList: function (page, limit, kw, extra) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      if (extra) { for (var k in extra) p[k] = extra[k]; }
      return apiGet('/customer/order/list', p);
    },
    orderView: function (id) { return apiGet('/customer/order/view', { id: id }); },
    orderViewHtml: function (id) { return apiGetPlain('/customer/order/view', { id: id }); },
    orderDelete: function (id) { return apiPost('/customer/order/delete', { id: id }); },
    orderProductData: function (order_id, product_ids, code, origin_product) {
      return apiPost('/customer/api/get_product_data', {
        product_ids: product_ids || '',
        order_id: order_id,
        code: code || '',
        origin_product: origin_product || '[]'
      });
    },
    orderModifyInfo: function (order_id, field, value) {
      var data = { order_id: order_id };
      data[field] = value;
      return apiPost('/customer/api/modify_order_info', data);
    },
    orderModifyProduct: function (order_id, product_info, file_ids, product_ids) {
      return apiPost('/customer/api/modify_product_data', {
        product_info: product_info,
        order_id: order_id,
        file_ids: file_ids || '',
        product_ids: product_ids || ''
      });
    },
    orderFlowCheck: function (id, check, content, check_node, check_admin_ids) {
      return apiPost('/api/index/flow_check', {
        id: id, type: 5,
        check_node: check_node || 0,
        check_admin_ids: check_admin_ids || '',
        check: check,
        content: content || ''
      });
    },
    orderFlowNodes: function (id) { return apiGet('/api/index/get_flow_nodes', { id: id, type: 5 }); },
    getContractList: function (params) {
      return apiGet('/contract/api/get_contract', {
        keywords: (params && params.keywords) || '',
        page: (params && params.page) || 1,
        limit: (params && params.limit) || 20
      });
    },
    customerCompanyInfo: function (customer_id) {
      return apiPost('/customer/api/get_customer_company_info', { customer_id: customer_id || 0 });
    },
    regionCitys: function (provinceid) { return apiPost('/api/index/region_citys', { provinceid: provinceid || 0 }); },
    regionDists: function (cityid) { return apiPost('/api/index/region_dists', { cityid: cityid || 0 }); },

    // ===== 平台订单 =====
    platformOrderList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/platformorder/index', p);
    },
    platformOrderView: function (id) { return apiGet('/customer/platformorder/view', { id: id }); },
    platformOrderViewHtml: function (id) { return apiGetPlain('/customer/platformorder/view', { id: id }); },
    platformOrderMark: function (id, isMark) {
      return apiPost('/customer/platformorder/custodian_deal', { id: id, is_mark: isMark });
    },

    // ===== 样本 / 校展 / 售后 =====
    sampleList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/sample/index', p);
    },
    schoolList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/schoolexhibition/index', p);
    },
    schoolHandleList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/schoolexhibition/list', p);
    },
    schoolAdd: function (data) { return apiPost('/customer/schoolexhibition/add', data); },
    schoolDelete: function (id) { return apiPost('/customer/schoolexhibition/delete', { id: id }); },
    afterList: function (page, limit, kw) {
      var p = { page: page, limit: limit };
      if (kw) p.keywords = kw;
      return apiGet('/customer/aftersalesservice/index', p);
    },
    afterAdd: function (data) { return apiPost('/customer/aftersalesservice/add', data); },
    afterDelete: function (id) { return apiPost('/customer/aftersalesservice/delete', { id: id }); },

    // ===== 财务 =====
    financeAdvance: function (page, limit) { return apiGet('/finance/advancedepositlog/index', { page: page, limit: limit }); },
    financeOrderApply: function (page, limit) { return apiGet('/finance/orderapply/index', { page: page, limit: limit }); },
    financeIncome: function (page, limit) { return apiGet('/finance/income/index', { page: page, limit: limit }); },
    deductionList: function (page, limit) { return apiGet('/finance/deductionlog/index', { page: page, limit: limit }); },
    deductionCheckedList: function (page, limit) { return apiGet('/finance/deductionlog/checkedlist', { page: page, limit: limit }); },
    marginList: function (page, limit) { return apiGet('/finance/margindepositlog/index', { page: page, limit: limit }); },
    invoiceList: function (page, limit) { return apiGet('/finance/invoice/index', { page: page, limit: limit }); },
    invoiceHandleList: function (page, limit) { return apiGet('/finance/invoice/list', { page: page, limit: limit }); },
    orderApplyHandleList: function (page, limit) { return apiGet('/finance/orderapply/list', { page: page, limit: limit }); },

    // ===== 个人资料 / 密码 =====
    editPersonal: function (data) { return apiPost('/home/index/edit_personal', data); },
    editPassword: function (data) { return apiPost('/home/index/edit_password', data); },

    // ===== 附件上传 =====
    // multipart 上传（浏览器原生 File）：POST /api/index/upload，字段 file
    uploadFile: function (file) {
      var fd = new FormData();
      fd.append('file', file);
      fd.append('name', file.name || 'file');
      return fetchTimeout(fullUrl('/api/index/upload', ''), { method: 'POST', credentials: 'include', body: fd })
        .then(function (r) { return r.json(); });
    },
    // base64 上传（对齐 App uploadFileBase64 契约：b64 为去前缀的纯 base64）
    uploadFileBase64: function (b64, fileName, apiPath, field) {
      return new Promise(function (resolve, reject) {
        var bin, bytes;
        try {
          bin = atob(b64);
          bytes = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        } catch (e) { reject(new Error('文件数据异常')); return; }
        var blob = new Blob([bytes]);
        var fd = new FormData();
        fd.append(field || 'file', blob, fileName || 'file');
        fd.append('name', fileName || 'file');
        fetchTimeout(fullUrl(apiPath || '/api/index/upload', ''), { method: 'POST', credentials: 'include', body: fd })
          .then(function (r) { return r.json(); })
          .then(resolve, reject);
      });
    },

    // ===== 原生选文件（App 桥专用；网页版走 app.js 的 <input type=file> 兜底，此处仅占位） =====
    pickFilesNative: function () {
      return Promise.reject(new Error('web: use input file'));
    },
    pickCameraNative: function () {
      return Promise.reject(new Error('web: use input file capture'));
    }
  };

  // localStorage 键（与 App 一致）
  var K = { USER: 'uping_user', ME: 'uping_me', SAVED: 'uping_saved_user', MSG_NAME: 'uping_me_name' };
  function isLoggedIn() { try { return g.localStorage.getItem(K.USER) === '1'; } catch (e) { return false; } }
  function logout() {
    try {
      g.localStorage.removeItem(K.USER);
      g.localStorage.removeItem(K.ME);
    } catch (e) {}
  }
  function myName() {
    try { return g.localStorage.getItem(K.MSG_NAME) || ''; } catch (e) { return ''; }
  }

  g.OA = {
    BASE: BASE,
    API: API,
    fmtTime: fmtTime,
    esc: esc,
    absUrl: absUrl,
    isLoggedIn: isLoggedIn,
    logout: logout,
    myName: myName,
    _onSessionExpired: null
  };
  g.OA._setSessionHook = function (fn) { g.OA._onSessionExpired = fn; };
})(window);

</script>
<script>
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var uEl=$('username'), pEl=$('password'), cEl=$('captcha'), capImg=$('captcha-img'),
      btn=$('login-btn'), tip=$('tip'), remember=$('remember');
  var mq=window.matchMedia('(min-width:860px)');
  function syncSide(){ document.querySelector('.side').style.display = mq.matches ? '' : 'none'; }
  syncSide(); if(mq.addEventListener) mq.addEventListener('change',syncSide);

  function refreshCaptcha(){ capImg.src = OA.API.captchaUrl(); }
  capImg.addEventListener('click', refreshCaptcha);

  function fillSaved(){
    try{ var raw=localStorage.getItem('uping_saved_user'); if(!raw) return;
      var o=JSON.parse(raw); if(o&&o.u){ uEl.value=o.u; pEl.value=o.p||''; remember.checked=true; } }catch(e){}
  }
  function saveRemembered(){
    if(remember.checked){ try{ localStorage.setItem('uping_saved_user', JSON.stringify({u:uEl.value.trim(), p:pEl.value})); }catch(e){} }
    else { try{ localStorage.removeItem('uping_saved_user'); }catch(e){} }
  }

  // 登录成功 → 进网页版主界面（index.html）
  function doLogin(){
    var u=uEl.value.trim(), p=pEl.value, c=cEl.value.trim();
    tip.textContent=''; tip.style.color='';
    if(!u||!p||!c){ tip.textContent='请填写账号、密码和验证码（验证码看右侧算式，如 2+6 填 8）'; return; }
    btn.disabled=true; btn.textContent='登录中…';
    OA.API.login(u,p,c).then(function(res){
      if(res && (res.code===0 || res.code==='0')){
        saveRemembered();
        try{ localStorage.setItem('uping_user','1'); localStorage.setItem('uping_me', JSON.stringify((res&&res.data)||{})); }catch(e){}
        tip.style.color='#1a9c52';
        tip.textContent='✓ 登录成功，正在进入…';
        setTimeout(function(){ location.replace('index.html'); }, 400);
      }else{
        tip.textContent='❌ 未通过：' + ((res && res.msg) || '服务端无返回内容') + '（验证码已刷新，请重新填写）';
        refreshCaptcha(); cEl.value='';
      }
    }).catch(function(err){
      tip.textContent='❌ 网络请求失败：' + (err && err.message ? err.message : '未知') +
        '。可点下方「连接诊断」定位；若反复出现请截图反馈';
      refreshCaptcha();
    }).finally(function(){ btn.disabled=false; btn.textContent='登 录'; });
  }

  btn.addEventListener('click', doLogin);
  [uEl,pEl,cEl].forEach(function(el){ el.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); doLogin(); } }); });

  $('foot').textContent = '网页版 · ' + OA.BASE.replace('https://','');

  // 诊断：被自动退回登录页时（90 秒内），红条显示服务端/启动的真实原因
  (function checkKickReasons(){
    try {
      var msgs = [];
      var lostAt = parseInt(localStorage.getItem('uping_session_lost') || '0', 10);
      if (lostAt && Date.now() - lostAt < 90000) {
        var lostMsg = localStorage.getItem('uping_session_lost_msg') || '';
        localStorage.removeItem('uping_session_lost');
        localStorage.removeItem('uping_session_lost_msg');
        msgs.push('登录后会话未保持，服务端提示：' + (lostMsg || '（无）') +
          '。常见原因：① 账号在别处登录被顶下线 ② 浏览器限制 Cookie');
      }
      var beRaw = localStorage.getItem('uping_boot_err');
      if (beRaw) {
        localStorage.removeItem('uping_boot_err');
        var be = JSON.parse(beRaw);
        if (be && be.t && Date.now() - be.t < 90000) {
          msgs.push('主界面异常退回[' + (be.tag || '?') + ']：' + (be.m || '') +
            (be.s ? ' ｜ ' + be.s.split('\n')[0] : ''));
        }
      }
      if (msgs.length) {
        tip.innerHTML = '⚠️ ' + msgs.map(OA.esc).join('<br>⚠️ ') +
          '<br>请截图此红色提示反馈，可一击定位';
        tip.style.whiteSpace = 'normal';
        tip.style.lineHeight = '1.6';
      }
    } catch (e) {}
  })();

  // 一键连接诊断：在用户当前网络实测三步链路，结果直接显示
  (function bindDiag(){
    var run=document.getElementById('diag-run'), out=document.getElementById('diag-out');
    if(!run||!out) return;
    run.addEventListener('click', function(){
      run.disabled=true; out.textContent='诊断中…';
      var lines=[];
      var p1 = fetch(OA.BASE + '/home/login', {method:'GET', credentials:'include'})
        .then(function(r){ lines.push('① 登录页接口: HTTP '+r.status+(r.ok?' ✓':' ✗')); })
        .catch(function(e){ lines.push('① 登录页接口: 请求失败 '+(e&&e.message||e)+' ✗'); });
      var p2 = fetch(OA.BASE + '/captcha.html?t=' + Date.now(), {method:'GET', credentials:'include'})
        .then(function(r){ var ct=r.headers.get('content-type')||'?';
          return r.arrayBuffer().then(function(b){ lines.push('② 验证码接口: HTTP '+r.status+' '+ct.split(';')[0]+' '+b.byteLength+'B'+(r.ok?' ✓':' ✗')); }); })
        .catch(function(e){ lines.push('② 验证码接口: 请求失败 '+(e&&e.message||e)+' ✗'); });
      var p3 = p2.then(function(){
        return fetch(OA.BASE + '/home/login/login_submit', {method:'POST', credentials:'include',
          headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','X-Requested-With':'XMLHttpRequest'},
          body:'username=diag_probe&password=diag&captcha=0'})
          .then(function(r){ return r.text().then(function(t){
            var v=null; try{ v=JSON.parse(t); }catch(e){}
            lines.push('③ 登录接口探测: HTTP '+r.status+' → 服务端返回「'+(v?(v.msg||'空'):(t.slice(0,60)||'空'))+'」');
            if(v && String(v.msg||'').indexOf('验证码')>=0) lines.push('✔ 结论：链路完全正常。登录失败只可能是账号/密码/验证码输入问题');
            else if(v) lines.push('✔ 结论：链路正常，服务端已正常应答');
          }); })
          .catch(function(e){ lines.push('③ 登录接口探测: 请求失败 '+(e&&e.message||e)+' —— 你当前网络到服务器的 POST 被拦截'); });
      });
      Promise.all([p1,p3]).catch(function(){}).then(function(){
        out.innerHTML = lines.map(function(l){ return '<div>'+OA.esc(l)+'</div>'; }).join('');
        run.disabled=false;
        refreshCaptcha(); // 探测会消耗当前会话验证码，刷一张新的
      });
    });
  })();

  fillSaved(); refreshCaptcha();
})();
</script>
</body>
</html>
