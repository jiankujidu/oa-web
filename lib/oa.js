/* 优品OA 网页版 · 共享层
 * 接口完全对齐 App 源码 www/js/api.js（BASE = https://oa.upingbio.cn）
 * 网页端无 AndroidBridge，全部走 fetch；credentials:'include' 携带会话 Cookie。
 *
 * 跨域说明：本地双击打开(file://)时跨域请求会被浏览器拦。
 * 推荐部署到 oa.upingbio.cn 同域下（如 /web/），即彻底无跨域。
 * 若仅本地预览，可开启 CORS 代理开关（window.OA.CORS_PROXY）临时绕过。
 */
(function (g) {
  "use strict";

  // 部署时可改这里；默认走源站 .cn
  var BASE = g.OA_BASE || 'https://oa.upingbio.cn';
  // 若跨域不通，填一个 CORS 代理前缀，如 https://你的代理.example.com/api/
  // 之后所有请求会变成  代理前缀 + encodeURIComponent(BASE+path)
  var CORS_PROXY = g.OA_CORS_PROXY || '';

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
      if (d[k] === undefined || d[k] === null) continue;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(d[k]));
    }
    return parts.join('&');
  }
  function fullUrl(path, q) {
    var u = BASE + path + (q || '');
    if (CORS_PROXY) return CORS_PROXY + encodeURIComponent(u);
    return u;
  }
  function safeParse(s) {
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  // 会话守卫：业务接口 404 + msg 含"请先登录/登录"等 → 触发 onSessionExpired
  function sessionExpiredFromText(t) {
    if (!t) return null;
    if (/请先登录|请重新登录|未登录|登录已失效|无权限|会话已(过期|失效)/.test(t)) return true;
    return false;
  }

  function guardSession(v) {
    if (v && v.code === 404) {
      var msg = String(v.msg || '');
      if (sessionExpiredFromText(msg) || /登录/.test(msg)) {
        if (g.OA && g.OA._onSessionExpired) g.OA._onSessionExpired();
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
    var u = fullUrl(path, qs(params));
    return fetchTimeout(u, {
      method: 'GET', credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function (r) { return r.json(); })
      .then(function (v) { return guardSession(v); });
  }

  // 通用 GET 纯文本（页面型接口，不带 XHR 头）
  function apiGetPlain(path, params) {
    var u = fullUrl(path, qs(params));
    return fetchTimeout(u, { method: 'GET', credentials: 'include' })
      .then(function (r) {
        var txt = r.text();
        return txt.then(function (raw) {
          var se = sessionExpiredFromText(raw);
          if (se) { if (g.OA && g.OA._onSessionExpired) g.OA._onSessionExpired(); }
          return raw;
        });
      });
  }

  // 通用 POST 表单（带 XHR 头）
  function apiPost(path, data) {
    var u = fullUrl(path, '');
    var body = encBody(data);
    return fetchTimeout(u, {
      method: 'POST', credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body
    }).then(function (r) {
      // 服务端可能直接回 JSON，也可能回 HTML（登录失败兜底页）
      return r.clone().text().then(function (raw) {
        var v = safeParse(raw);
        if (v === null) {
          // 非 JSON：尝试从 HTML 里提取 {"code"
          var m = raw.match(/\{[^\{]*"code"\s*:[^\}]*\}/);
          v = m ? safeParse(m[0]) : { code: 1, msg: '响应异常(HTTP ' + r.status + ')' };
        }
        return guardSession(v);
      });
    });
  }

  // 无 XHR 头 POST（审批提交 /oa/approve/add 必须不带）
  function apiPostPlain(path, data) {
    var u = fullUrl(path, '');
    var body = encBody(data);
    return fetchTimeout(u, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body
    }).then(function (r) {
      return r.clone().text().then(function (raw) {
        var v = safeParse(raw);
        if (v === null) {
          var m = raw.match(/\{[^\{]*"code"\s*:[^\}]*\}/);
          v = m ? safeParse(m[0]) : { code: 1, msg: '响应异常(HTTP ' + r.status + ')' };
        }
        return guardSession(v);
      });
    });
  }

  function fmtTime(t) {
    if (!t) return '';
    t = String(t);
    if (/^\d{10}$/.test(t)) t = new Date(parseInt(t, 10) * 1000).toLocaleString('zh-CN');
    else if (/^\d{13}$/.test(t)) t = new Date(parseInt(t, 10)).toLocaleString('zh-CN');
    else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(t)) { /* keep */ }
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

  // ===== 对齐 App api.js 的接口封装 =====
  var API = {
    // 登录 / 验证码
    login: function (username, password, captcha) {
      return apiPost('/home/login/login_submit', { username: username, password: password, captcha: captcha });
    },
    captchaUrl: function () { return BASE + '/captcha.html?t=' + Date.now(); },

    // 首页信息（含 msg_num、用户信息）
    indexInfo: function () { return apiPost('/home/index/index', {}); },

    // 审批
    approveList: function (page, limit, status) {
      var p = { page: page, limit: limit };
      if (status) p.status = status;
      return apiGet('/oa/approve/index', p);
    },
    approveCheck: function (id, status, remark) {
      return apiPost('/oa/approve/check', { id: id, status: status, remark: remark || '' });
    },

    // 客户
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

    // 子页：公告/问答/产品/附件/通讯录/消息/客户子功能
    noteList: function (page, limit) { return apiGet('/note/index/index', { page: page, limit: limit }); },
    articleList: function (page, limit) { return apiGet('/article/index/index', { page: page, limit: limit }); },
    productList: function (page, limit, keyword) {
      var p = { page: page, limit: limit }; if (keyword) p.keywords = keyword; return apiGet('/product/index/list', p);
    },
    fileList: function (page, limit, keyword) {
      var p = { page: page, limit: limit }; if (keyword) p.name = keyword; return apiGet('/home/files/index', p);
    },
    mailList: function (page, limit, kw) {
      var p = { page: page, limit: limit }; if (kw) p.keywords = kw; return apiGet('/home/index/mail_list', p);
    },
    messageList: function (tab, page, limit, kw) {
      var p = { page: page, limit: limit }; if (kw) p.keywords = kw; return apiGet('/message/index/' + tab, p);
    },
    contactList: function (page, limit, kw) {
      var p = { page: page, limit: limit }; if (kw) p.keywords = kw; return apiGet('/customer/contact/index', p);
    },
    chanceList: function (page, limit, kw) {
      var p = { page: page, limit: limit }; if (kw) p.keywords = kw; return apiGet('/customer/chance/index', p);
    },
    traceList: function (page, limit, kw) {
      var p = { page: page, limit: limit }; if (kw) p.keywords = kw; return apiGet('/customer/trace/index', p);
    },
    orderList: function (page, limit, kw) {
      var p = { page: page, limit: limit }; if (kw) p.keywords = kw; return apiGet('/customer/order/index', p);
    },
    orderHandleList: function (page, limit, kw, extra) {
      var p = { page: page, limit: limit }; if (kw) p.keywords = kw;
      if (extra) for (var k in extra) p[k] = extra[k];
      return apiGet('/customer/order/list', p);
    },
    orderView: function (id) { return apiGet('/customer/order/view', { id: id }); },
    sampleList: function (page, limit, kw) {
      var p = { page: page, limit: limit }; if (kw) p.keywords = kw; return apiGet('/customer/sample/index', p);
    },

    // 财务
    financeAdvance: function (page, limit) { return apiGet('/finance/advancedepositlog/index', { page: page, limit: limit }); },
    deductionList: function (page, limit) { return apiGet('/finance/deductionlog/index', { page: page, limit: limit }); },
    marginList: function (page, limit) { return apiGet('/finance/margindepositlog/index', { page: page, limit: limit }); },

    // 个人资料 / 密码
    editPersonal: function (data) { return apiPost('/home/index/edit_personal', data); },
    editPassword: function (data) { return apiPost('/home/index/edit_password', data); }
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
    isLoggedIn: isLoggedIn,
    logout: logout,
    myName: myName,
    // 会话失效时调用（由页面注入处理逻辑）
    _onSessionExpired: null
  };

  // 供 fetch 层回调
  g.OA._setSessionHook = function (fn) { g.OA._onSessionExpired = fn; };
  // 让 guardSession 在 fetch 调用点能找到
  // （已通过 g.OA._onSessionExpired 暴露）
})(window);
