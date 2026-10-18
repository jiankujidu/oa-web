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
