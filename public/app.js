/* 优品OA 网页版 · 主界面逻辑（首页/审批/客户/我的）
 * 数据字段对齐 App 源码 app.js。所有接口经 OA.API（lib/oa.js）。 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var API = OA.API;
  var APP_VERSION = '1.0';
  var currentTab = 'home';
  var listState = {};

  // 会话失效 → 回登录页
  OA._setSessionHook(function () {
    try { localStorage.removeItem('uping_user'); localStorage.removeItem('uping_me'); } catch (e) {}
    location.replace('login.html');
  });

  // ===== 首页 =====
  function renderHome() {
    var c = $('page-container');
    var quick = [
      { icon: '📝', name: '请假', type: 1 },
      { icon: '🚗', name: '用车', type: 2 },
      { icon: '💰', name: '报销', type: 3 },
      { icon: '🛒', name: '采购', type: 4 },
      { icon: '🏠', name: '用章', type: 5 },
      { icon: '📦', name: '出入库', type: 6 },
      { icon: '💳', name: '预付', type: 7 },
      { icon: '✅', name: '更多', more: true }
    ];
    var html = '<div class="section-title">快捷审批</div><div class="grid">';
    for (var i = 0; i < quick.length; i++) {
      var q = quick[i];
      html += '<div class="grid-item" onclick="App.onQuick(' + i + ')"><span class="gi-icon">' + q.icon + '</span><span class="gi-text">' + q.name + '</span></div>';
    }
    html += '</div>';
    html += '<div class="section-title">办公入口</div><div class="grid">';
    var entries = [
      { m: 'note', icon: '📢', name: '企业公告' },
      { m: 'article', icon: '💬', name: '问答知识' },
      { m: 'product', icon: '🧪', name: '产品管理' },
      { m: 'files', icon: '📁', name: '附件管理' },
      { m: 'message-inbox', icon: '✉️', name: '消息中心' },
      { m: 'mail', icon: '📇', name: '通讯录' },
      { tab: 'customer', icon: '👥', name: '客户列表' }
    ];
    for (var j = 0; j < entries.length; j++) {
      var e = entries[j];
      if (e.tab) html += '<div class="grid-item" onclick="App.switchTab(\'' + e.tab + '\')"><span class="gi-icon">' + e.icon + '</span><span class="gi-text">' + e.name + '</span></div>';
      else html += '<div class="grid-item" onclick="App.openSub(\'' + e.m + '\')"><span class="gi-icon">' + e.icon + '</span><span class="gi-text">' + e.name + '</span></div>';
    }
    html += '</div>';
    html += '<div class="section-title">我的待办</div>';
    html += '<div class="card" onclick="App.switchTab(\'approve\')"><div class="card-title">待审审批</div><div class="card-line">点击查看我发起的与待我处理的审批</div></div>';
    html += '<div class="card" onclick="App.switchTab(\'customer\')"><div class="card-title">客户跟进</div><div class="card-line">客户列表 · 公海 · 联系人 · 订单 · 样本</div></div>';
    c.innerHTML = html;
    // 预热名字 + 未读消息数
    preloadName();
    pollMsgNum();
  }

  // ===== 审批 =====
  function renderApprove() {
    var c = $('page-container');
    c.innerHTML =
      '<div class="card launch-card" onclick="App.openApproveType()"><span class="lc-left">＋ 发起新的审批</span><span class="lc-right">选择类型 ›</span></div>' +
      '<div class="seg">' +
      '<div class="seg-item active" data-s="0" onclick="App.loadApprove(0)">全部</div>' +
      '<div class="seg-item" data-s="1" onclick="App.loadApprove(1)">待审批</div>' +
      '<div class="seg-item" data-s="2" onclick="App.loadApprove(2)">已通过</div>' +
      '<div class="seg-item" data-s="3" onclick="App.loadApprove(3)">已拒绝</div>' +
      '</div><div id="approve-list"><div class="loading">加载中…</div></div>';
    listState.approve = { page: 1, status: 0, loading: false, done: false, rows: {} };
    loadApprove(0);
  }

  // ===== 客户 =====
  function renderCustomer() {
    var c = $('page-container');
    c.innerHTML =
      '<div class="seg">' +
      '<div class="seg-item active" data-t="1" onclick="App.loadCustomer(1)">我的客户</div>' +
      '<div class="seg-item" data-t="2" onclick="App.loadCustomer(2)">公海</div>' +
      '<div class="seg-item" data-t="3" onclick="App.loadCustomer(3)">废弃</div>' +
      '</div>' +
      '<div class="search-bar"><input id="cust-kw" type="text" placeholder="搜索客户名称"><span class="search-btn" onclick="App.searchCustomer()">搜索</span></div>' +
      '<div id="customer-list"><div class="loading">加载中…</div></div>' +
      '<div class="section-title">客户功能</div><div class="grid">' +
      '<div class="grid-item" onclick="App.openSub(\'contact-list\')"><span class="gi-icon">👤</span><span class="gi-text">联系人</span></div>' +
      '<div class="grid-item" onclick="App.openSub(\'chance-list\')"><span class="gi-icon">🎯</span><span class="gi-text">销售机会</span></div>' +
      '<div class="grid-item" onclick="App.openSub(\'trace-list\')"><span class="gi-icon">📝</span><span class="gi-text">跟进记录</span></div>' +
      '<div class="grid-item" onclick="App.openSub(\'order-my\')"><span class="gi-icon">📦</span><span class="gi-text">我的订单</span></div>' +
      '<div class="grid-item" onclick="App.openSub(\'order-handle\')"><span class="gi-icon">⚙️</span><span class="gi-text">订单处理</span></div>' +
      '<div class="grid-item" onclick="App.openSub(\'sample\')"><span class="gi-icon">🧫</span><span class="gi-text">样本管理</span></div>' +
      '</div>';
    listState.customer = { page: 1, type: 1, kw: '', loading: false, done: false, rows: {} };
    loadCustomer(1);
  }

  // ===== 我的 =====
  function renderMine() {
    var c = $('page-container');
    var savedU = null;
    try { savedU = JSON.parse(localStorage.getItem('uping_saved_user') || 'null'); } catch (e) {}
    var myName = OA.myName() || (savedU && savedU.u) || '未登录';
    var myUid = (savedU && savedU.u) ? ('优品OA · 账号 ' + savedU.u) : '';
    c.innerHTML =
      '<div class="mine-head"><div class="name">' + OA.esc(myName) + '</div><div class="uid">' + OA.esc(myUid) + '</div></div>' +
      '<div class="section-title">账号</div>' +
      '<div class="menu-item" onclick="App.openSub(\'profile\')"><span class="mi-left">基本资料</span><span class="mi-right">›</span></div>' +
      '<div class="menu-item" onclick="App.openSub(\'password\')"><span class="mi-left">修改密码</span><span class="mi-right">›</span></div>' +
      '<div class="menu-item" onclick="App.openSub(\'message-inbox\')"><span class="mi-left">消息中心</span><span class="mi-right">›</span></div>' +
      '<div class="menu-item" onclick="App.openSub(\'mail\')"><span class="mi-left">通讯录</span><span class="mi-right">›</span></div>' +
      '<div class="section-title">系统</div>' +
      '<div class="menu-item" onclick="App.openDesktop()"><span class="mi-left">系统桌面版</span><span class="mi-right">›</span></div>' +
      '<div class="menu-item" onclick="App.logout()"><span class="mi-left" style="color:#ff4d4f">退出登录</span><span class="mi-right">›</span></div>' +
      '<div class="app-ver">优品OA 网页版 ' + APP_VERSION + '</div>';
    preloadName();
  }

  // 占位，后续用 Edit 补全 loadApprove / loadCustomer / 子页 / 消息 等
  window.APP_STUB = true;

  window.App = {
    init: init,
    switchTab: switchTab,
    onQuick: function (i) { App.openApproveType(); },
    loadApprove: loadApprove,
    openApproveDetail: openApproveDetail,
    doCheck: doCheck,
    openApproveType: openApproveType,
    openApproveForm: openApproveForm,
    onFlowChange: onFlowChange,
    toggleCheck: toggleCheck,
    submitApproveForm: submitApproveForm,
    retryApproveFile: retryApproveFile,
    loadCustomer: loadCustomer,
    openCustomer: openCustomer,
    searchCustomer: searchCustomer,
    openSub: openSub,
    loadSubList: loadSubList,
    saveProfile: saveProfile,
    savePassword: savePassword,
    openMsg: openMsg,
    openArticle: openArticle,
    openOrder: openOrder,
    openDesktop: openDesktop,
    logout: logout,
    closePanel: closePanel,
    toast: toast
  };

  // 铃铛 → 收件箱
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('bell');
    if (b) b.addEventListener('click', function () { openSub('message-inbox'); });
  });

  // ===== 通用 =====
  function init() {
    $('app-view').style.display = 'flex';
    switchTab('home');
  }
  function switchTab(tab) {
    currentTab = tab;
    var items = document.querySelectorAll('.tab-item');
    for (var i = 0; i < items.length; i++) items[i].className = 'tab-item' + (items[i].getAttribute('data-tab') === tab ? ' active' : '');
    var titles = { home: '首页', approve: '审批', customer: '客户', mine: '我的' };
    $('top-title').textContent = titles[tab] || '优品OA';
    if (tab === 'home') renderHome();
    else if (tab === 'approve') renderApprove();
    else if (tab === 'customer') renderCustomer();
    else if (tab === 'mine') renderMine();
    window.scrollTo(0, 0);
  }
  function toast(msg) {
    var t = $('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast'; t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.style.display = 'none'; }, 2200);
  }
  function logout() {
    OA.logout();
    location.replace('login.html');
  }
  function openDesktop() { window.open(OA.BASE + '/'); }

  // ===== 发起审批（接口对齐 App 源码：/oa/approve/add + get_flow_users）=====
  var APPROVE_TYPES = [
    { type: 1, name: '请假', icon: '🏖' },
    { type: 2, name: '出差', icon: '✈' },
    { type: 3, name: '外出', icon: '🏃' },
    { type: 4, name: '加班', icon: '⏰' },
    { type: 15, name: '采购', icon: '🛒' },
    { type: 7, name: '维修', icon: '🔧' },
    { type: 9, name: '用章', icon: '🔏' },
    { type: 10, name: '用车', icon: '🚗' }
  ];
  var formState = null;
  function openApproveType() {
    var c = $('page-container');
    var html = '<div class="section-title">选择审批类型</div><div class="type-grid">';
    for (var i = 0; i < APPROVE_TYPES.length; i++) {
      var t = APPROVE_TYPES[i];
      html += '<div class="type-item" onclick="App.openApproveForm(' + t.type + ')"><span class="ti-icon">' + t.icon + '</span><span class="ti-text">' + t.name + '</span></div>';
    }
    html += '</div>';
    c.innerHTML = html;
    $('top-title').textContent = '发起审批';
  }
  function formFieldHtml(f) {
    if (f.type === 'textarea') return '<div class="form-row"><label class="form-label' + (f.req ? ' req' : '') + '">' + OA.esc(f.label) + '</label><textarea class="form-input" data-key="' + f.key + '" placeholder="' + OA.esc(f.label) + '" rows="3"></textarea></div>';
    if (f.type === 'select') {
      var ops = '<option value="">请选择</option>';
      for (var i = 0; i < (f.options || []).length; i++) ops += '<option value="' + OA.esc(f.options[i].v) + '">' + OA.esc(f.options[i].t) + '</option>';
      return '<div class="form-row"><label class="form-label' + (f.req ? ' req' : '') + '">' + OA.esc(f.label) + '</label><select class="form-input" data-key="' + f.key + '">' + ops + '</select></div>';
    }
    var inpType = (f.type === 'datetime') ? 'datetime-local' : 'text';
    return '<div class="form-row"><label class="form-label' + (f.req ? ' req' : '') + '">' + OA.esc(f.label) + '</label><input class="form-input" data-key="' + f.key + (f.type === 'datetime' ? '" data-half="datetime' : '') + '" type="' + inpType + '" placeholder="' + OA.esc(f.label) + '"></div>';
  }
  function openApproveForm(type) {
    var meta = (typeof APPROVE_FORMS !== 'undefined') ? APPROVE_FORMS[type] : null;
    if (!meta) { toast('该审批类型暂不支持'); return; }
    var c = $('page-container');
    var html = '<div class="detail-head"><div class="dh-title">' + OA.esc(meta.title || ('审批' + type)) + '</div><div class="dh-sub">请填写申请信息</div></div>';
    html += '<div class="form-card">';
    for (var j = 0; j < meta.fields.length; j++) {
      var f = meta.fields[j];
      if (f.type === 'hidden' || f.key === 'file_ids' || f.key === 'flow_id' || f.key.indexOf('check_admin') === 0 || f.key.indexOf('copy_') === 0 || f.key.indexOf('_span') > 0) continue;
      html += formFieldHtml(f);
    }
    html += '</div>';
    var hasFile = false;
    for (var k = 0; k < meta.fields.length; k++) if (meta.fields[k].key === 'file_ids') hasFile = true;
    if (hasFile) {
      html += '<div class="form-card"><div class="form-row"><label class="form-label">附件</label><input type="file" id="ap-file" multiple style="flex:1;font-size:13px"></div><div id="ap-attach-list"></div></div>';
    }
    var flowSel = '';
    for (var m = 0; m < meta.fields.length; m++) {
      if (meta.fields[m].key === 'flow_id' && meta.fields[m].type === 'select') {
        var opts = meta.fields[m].options || [];
        flowSel = '<div class="form-card"><div class="form-row"><label class="form-label req">审批流程</label><select class="form-input" id="ap-flow" onchange="App.onFlowChange()"><option value="">请选择</option>';
        for (var n = 0; n < opts.length; n++) flowSel += '<option value="' + OA.esc(opts[n].v) + '">' + OA.esc(opts[n].t) + '</option>';
        flowSel += '</select></div></div>';
      }
    }
    html += flowSel;
    html += '<div class="form-card" id="ap-people"><div class="form-flow-box"><div class="form-flow-line">选择审批流程后加载审核人</div></div></div>';
    html += '<button class="form-submit" onclick="App.submitApproveForm(' + type + ')">提 交 申 请</button>';
    c.innerHTML = html;
    $('top-title').textContent = meta.title || '发起审批';
    formState = { type: type, flowId: '', checkIds: [], checkNames: [], copyIds: [], copyNames: [], files: [] };
    if (hasFile) bindApproveFile();
  }
  function bindApproveFile() {
    var inp = $('ap-file'); if (!inp) return;
    inp.addEventListener('change', function () {
      var fs = inp.files; if (!fs || !fs.length) return;
      for (var i = 0; i < fs.length; i++) uploadApproveFile(fs[i]);
      inp.value = '';
    });
  }
  function uploadApproveFile(file) {
    var item = { id: 0, name: file.name, size: file.size, uploading: true, err: '' };
    formState.files.push(item); renderAttachList();
    OA.API.uploadFile(file).then(function (res) {
      item.uploading = false;
      var id = (res && res.data && (res.data.id || res.data)) || (res && res.id);
      if (res && res.code === 0 && id) item.id = id; else item.err = (res && res.msg) || '上传失败';
      renderAttachList();
    }).catch(function () { item.uploading = false; item.err = '网络异常'; renderAttachList(); });
  }
  function renderAttachList() {
    var box = $('ap-attach-list'); if (!box) return;
    var h = '';
    for (var i = 0; i < formState.files.length; i++) {
      var f = formState.files[i];
      var st = f.uploading ? '上传中…' : (f.err ? ('失败：' + f.err) : '已上传');
      var cls = f.uploading ? 'att-up' : (f.err ? 'att-err' : 'att-ok');
      h += '<div class="attach-item ' + cls + '"><span>' + OA.esc(f.name) + '</span><span>' + st + (f.err ? ' · 删除重选' : '') + '</span></div>';
    }
    box.innerHTML = h;
  }
  function onFlowChange() {
    var sel = $('ap-flow'); if (!sel) return;
    var flowId = sel.value; formState.flowId = flowId;
    var box = $('ap-people');
    if (!flowId) { box.innerHTML = '<div class="form-flow-box"><div class="form-flow-line">选择审批流程后加载审核人</div></div>'; return; }
    box.innerHTML = '<div class="form-flow-box"><div class="loading">加载审批人…</div></div>';
    OA.API.flowUsers(flowId).then(function (res) {
      if (!res || res.code !== 0 || !res.data) { box.innerHTML = '<div class="form-flow-box"><div class="form-flow-line">审批人加载失败</div></div>'; return; }
      var d = res.data;
      var copyIds = String(d.copy_uids == null ? '' : d.copy_uids).split(',').filter(function (x) { return x; }).map(Number);
      var copyNames = String(d.copy_unames == null ? '' : d.copy_unames).split(',').filter(function (x) { return x; });
      formState.copyIds = copyIds; formState.copyNames = copyNames;
      var html = '';
      if (copyIds.length) html += '<div class="chip-label">抄送人</div><div class="form-flow-line">' + OA.esc(copyNames.join('、')) + '</div>';
      var steps = d.flow_data || d.step_data || [];
      for (var i = 0; i < steps.length; i++) {
        var st = steps[i];
        var stepName = st.flow_name || ('第' + (i + 1) + '级审核');
        var stepType = parseInt(st.flow_type, 10);
        if (stepType === 1 || stepType === 2) { html += '<div class="chip-label">' + OA.esc(stepName) + '</div><div class="form-flow-line">' + (stepType === 1 ? '当前部门负责人(系统指定)' : '上级部门负责人(系统指定)') + '</div>'; continue; }
        var users = st.user_id_info || [];
        if (typeof users === 'string') users = [];
        html += '<div class="chip-label">' + OA.esc(stepName) + '</div><div class="person-grid" data-step="' + i + '">';
        if (!users.length) html += '<div class="form-flow-line">未配置可选人员</div>';
        for (var u = 0; u < users.length; u++) {
          var uid = Number(users[u].id), uname = users[u].name || users[u].user_name || ('用户' + uid);
          html += '<div class="person-chip" data-uid="' + uid + '" data-name="' + OA.esc(uname) + '" onclick="App.toggleCheck(this,' + uid + ')">' + OA.esc(uname) + '</div>';
        }
        html += '</div>';
      }
      box.innerHTML = '<div class="form-flow-box">' + html + '</div>';
      var first = box.querySelector('.person-chip');
      if (first) App.toggleCheck(first, Number(first.getAttribute('data-uid')));
    }).catch(function () { box.innerHTML = '<div class="form-flow-box"><div class="form-flow-line">审批人加载失败</div></div>'; });
  }
  function toggleCheck(chip, uid) {
    if (!chip) return;
    var on = chip.className.indexOf(' sel') >= 0;
    var box = chip.parentNode;
    var chips = box.querySelectorAll('.person-chip');
    for (var i = 0; i < chips.length; i++) chips[i].className = chips[i].className.replace(' sel', '');
    if (!on) chip.className += ' sel';
    refreshCheckState();
  }
  function refreshCheckState() {
    var ids = [], names = [];
    var chips = document.querySelectorAll('.person-chip.sel');
    for (var i = 0; i < chips.length; i++) { ids.push(Number(chips[i].getAttribute('data-uid'))); names.push(chips[i].getAttribute('data-name')); }
    formState.checkIds = ids; formState.checkNames = names;
  }
  function submitApproveForm(type) {
    var meta = (typeof APPROVE_FORMS !== 'undefined') ? APPROVE_FORMS[type] : null;
    if (!meta) return;
    var data = { type: type, id: 0 };
    var fields = document.querySelectorAll('#page-container [data-key]');
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i], key = el.getAttribute('data-key');
      if (el.getAttribute('data-half') === 'datetime') data[key] = el.value ? el.value.replace('T', ' ') : '';
      else data[key] = el.value;
    }
    var keyFields = {};
    for (var j = 0; j < meta.fields.length; j++) {
      var f = meta.fields[j];
      if (f.type !== 'hidden' && f.key !== 'file_ids' && f.key !== 'flow_id' && f.key.indexOf('check_admin') !== 0 && f.key.indexOf('copy_') !== 0 && f.key !== 'duration' && f.key !== 'remark' && f.key.indexOf('_span') === -1) keyFields[f.key] = f.label;
    }
    for (var kk in keyFields) {
      var v = data[kk];
      if (v === undefined || v === null || v === '') { toast('请填写' + keyFields[kk]); return; }
    }
    if (!formState.flowId) { toast('请选择审批流程'); return; }
    data.flow_id = formState.flowId;
    if (!formState.checkIds.length) { toast('请选择审核人'); return; }
    data.check_admin_ids = formState.checkIds.join(',');
    data.check_admin_name = formState.checkNames.join(',');
    if (formState.copyIds.length) { data.copy_uids = formState.copyIds.join(','); data.copy_names = formState.copyNames.join(','); }
    var okIds = [], upCnt = 0, failCnt = 0;
    for (var ai = 0; ai < formState.files.length; ai++) {
      var af = formState.files[ai];
      if (af.uploading) upCnt++; else if (af.err) failCnt++; else if (af.id) okIds.push(af.id);
    }
    if (upCnt) { toast('附件上传中，请稍候'); return; }
    if (failCnt) { toast('有附件上传失败，请删除后重选或去掉附件再提交'); return; }
    if (okIds.length) data.file_ids = okIds.join(',');
    var btn = document.querySelector('.form-submit');
    if (btn) { btn.disabled = true; btn.textContent = '提交中…'; }
    OA.API.approveSubmit(data).then(function (res) {
      if (res && res.code === 0) { toast('提交成功'); App.switchTab('approve'); }
      else { toast((res && res.msg) || '提交失败'); if (btn) { btn.disabled = false; btn.textContent = '提 交 申 请'; } }
    }).catch(function () { toast('网络异常，提交失败'); if (btn) { btn.disabled = false; btn.textContent = '提 交 申 请'; } });
  }
  // ===== 通用子页（公告/问答/产品/消息/通讯录/财务等）=====
  // 每个子页 = 一个接口 + 行渲染器；进页顶栏可返回，支持"加载更多"
  var SUB_DEFS = {
    'note': { title: '企业公告', api: function (p, l, kw) { return API.noteList ? API.noteList(p, l) : OA.API._missing; }, row: noteRow },
    'article': { title: '问答知识', api: null, row: articleRow },
    'product': { title: '产品管理', api: null, row: productRow },
    'files': { title: '附件管理', api: null, row: fileRow },
    'mail': { title: '通讯录', api: null, row: mailRow },
    'message-inbox': { title: '收件箱', api: null, row: msgRow, tab: 'inbox' },
    'message-sendbox': { title: '发件箱', api: null, row: msgRow, tab: 'sendbox' },
    'message-draft': { title: '草稿箱', api: null, row: msgRow, tab: 'draft' },
    'contact-list': { title: '客户联系人', api: null, row: contactRow },
    'chance-list': { title: '销售机会', api: null, row: chanceRow },
    'trace-list': { title: '跟进记录', api: null, row: traceRow },
    'order-my': { title: '我的订单', api: null, row: orderRow },
    'order-handle': { title: '订单处理', api: null, row: orderRow },
    'sample': { title: '样本管理', api: null, row: plainRow },
    'finance-advance': { title: '预存款', api: null, row: plainRow },
    'deduction': { title: '抵扣券', api: null, row: plainRow },
    'margin': { title: '保证金', api: null, row: plainRow },
    'profile': { title: '基本资料', api: null, row: null },
    'password': { title: '修改密码', api: null, row: null }
  };
  var subState = { page: 1, done: false, loading: false, def: null, customerId: 0 };

  function openSub(m, customerId) {
    var def = SUB_DEFS[m];
    if (!def) { toast('「' + m + '」暂未开放'); return; }
    subState = { page: 1, done: false, loading: false, def: def, customerId: customerId || 0 };
    showSubShell(def.title, m);
    loadSubList();
  }

  function showSubShell(title, key) {
    var c = $('page-container');
    c.innerHTML = '<div id="sub-list"><div class="loading">加载中…</div></div>';
    // 顶部返回：暂时复用 toast 占位（后续接 showDetailShell）
    subState.key = key;
  }

  // 通用子页数据拉取（字段尽量容错）
  function loadSubList() {
    var s = subState;
    if (s.loading || s.done) return;
    s.loading = true;
    var box = $('sub-list');
    if (box) box.insertAdjacentHTML('beforeend', '<div class="loading" id="sub-loading">加载中…</div>');
    var api = OA.API;
    var p = s.page, l = 20, cid = s.customerId;
    var m = s.key;
    var req;
    if (m === 'note') req = api.noteList ? api.noteList(p, l) : api._missing();
    else if (m === 'article') req = api.articleList(p, l);
    else if (m === 'product') req = api.productList(p, l, '');
    else if (m === 'files') req = api.fileList(p, l, '');
    else if (m === 'mail') req = api.mailList(p, l, '');
    else if (m.indexOf('message') === 0) { var tb = m.replace('message-', '') || 'inbox'; req = api.messageList(tb, p, l); }
    else if (m === 'contact-list') req = api.contactList(p, l, '');
    else if (m === 'chance-list') req = api.chanceList(p, l, '');
    else if (m === 'trace-list') req = api.traceList(p, l, '');
    else if (m === 'order-my') req = api.orderList(p, l, '');
    else if (m === 'order-handle') req = api.orderHandleList(p, l, '');
    else if (m === 'sample') req = api.sampleList(p, l, '');
    else if (m === 'finance-advance') req = api.financeAdvance(p, l);
    else if (m === 'deduction') req = api.deductionList(p, l);
    else if (m === 'margin') req = api.marginList(p, l);
    else if (m === 'profile') { showProfile(); s.loading = false; return; }
    else if (m === 'password') { showPassword(); s.loading = false; return; }
    else { toast('「' + m + '」数据接口未映射'); s.loading = false; return; }

    req.then(function (res) {
      var el = $('sub-loading'); if (el) el.remove();
      if (!res || res.code !== 0) { box.innerHTML = '<div class="empty retry" onclick="App.loadSubList()">' + OA.esc((res && res.msg) || '加载失败') + '，点击重试</div>'; s.loading = false; return; }
      var rows = res.data || [];
      if (s.page === 1 && !rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; s.done = true; s.loading = false; return; }
      var html = '';
      for (var i = 0; i < rows.length; i++) html += s.def.row(rows[i], cid);
      box.innerHTML = s.page === 1 ? html : box.innerHTML;
      s.page++; s.loading = false; s.done = rows.length < 20;
      if (!s.done) box.insertAdjacentHTML('beforeend', '<div class="load-more" onclick="App.loadSubList()">加载更多</div>');
    }).catch(function () {
      var el2 = $('sub-loading'); if (el2) el2.remove();
      box.innerHTML = '<div class="empty retry" onclick="App.loadSubList()">网络异常，点击重试</div>';
      s.loading = false;
    });
  }

  // ===== 行渲染器（字段容错）=====
  function noteRow(r) {
    return '<div class="card"><div class="card-title">' + OA.esc(r.title || r.name || '公告') + '</div>' +
      '<div class="card-line"><b>时间：</b>' + OA.fmtTime(r.create_time || r.addtime || r.pubtime) + '</div>' +
      '<div class="card-line">' + OA.esc((r.content || r.summary || '').replace(/<[^>]+>/g, '').slice(0, 60)) + '</div></div>';
  }
  function articleRow(r) {
    return '<div class="card" onclick="App.openArticle(' + r.id + ')"><div class="card-title">' + OA.esc(r.title || '问答') + '</div><div class="card-line"><b>分类：</b>' + OA.esc(r.cate_name || r.category || '-') + ' · <b>时间：</b>' + OA.fmtTime(r.create_time || r.addtime) + '</div></div>';
  }
  function productRow(r) {
    return '<div class="card"><div class="card-title">' + OA.esc(r.product_name || r.name || '产品') + '</div><div class="card-line">别名：' + OA.esc(r.other_name || '-') + ' · 类别：' + OA.esc(r.cate_name || '-') + '</div></div>';
  }
  function fileRow(r) {
    return '<div class="card"><div class="card-title">' + OA.esc(r.name || r.filename || '文件') + '</div><div class="card-line"><b>大小：</b>' + OA.esc(r.filesize || r.size || '-') + ' · <b>时间：</b>' + OA.fmtTime(r.create_time || r.addtime) + '</div></div>';
  }
  function mailRow(r) {
    return '<div class="card"><div class="card-title">' + OA.esc(r.name || r.real_name || r.username || '联系人') + '</div><div class="card-line">部门：' + OA.esc(r.department || r.dept || '-') + '</div></div>';
  }
  function msgRow(r) {
    return '<div class="card" onclick="App.openMsg(' + r.id + ')"><div class="card-title">' + OA.esc(r.title || '消息') + '</div><div class="card-line"><b>来自：</b>' + OA.esc(r.from_name || r.sender || '-') + ' · <b>时间：</b>' + OA.fmtTime(r.create_time || r.addtime) + '</div></div>';
  }
  function contactRow(r) {
    return '<div class="card"><div class="card-title">' + OA.esc(r.name || r.real_name || '联系人') + '</div><div class="card-line">电话：' + OA.esc(r.phone || r.mobile || '-') + ' · 职位：' + OA.esc(r.position || '-') + '</div></div>';
  }
  function chanceRow(r) {
    return '<div class="card"><div class="card-title">' + OA.esc(r.name || r.title || '销售机会') + '</div><div class="card-line">阶段：' + OA.esc(r.stage || '-') + ' · 金额：' + OA.esc(r.amount || '-') + '</div></div>';
  }
  function traceRow(r) {
    return '<div class="card"><div class="card-title">跟进 · ' + OA.fmtTime(r.create_time || r.addtime) + '</div><div class="card-line">' + OA.esc(r.content || r.remark || r.trace || '') + '</div></div>';
  }
  function orderRow(r) {
    return '<div class="card" onclick="App.openOrder(' + r.id + ')"><div class="card-title">' + OA.esc(r.title || r.order_no || '订单') + '</div><div class="card-line">客户：' + OA.esc(r.customer_name || '-') + ' · 金额：' + OA.esc(r.total || r.amount || '-') + '</div></div>';
  }
  function plainRow(r) {
    return '<div class="card"><div class="card-title">' + OA.esc(r.name || r.title || r.code || '条目') + '</div><div class="card-line">金额：' + OA.esc(r.amount || r.money || r.total || '-') + ' · 时间：' + OA.fmtTime(r.create_time || r.addtime) + '</div></div>';
  }

  // 基本资料
  function showProfile() {
    var c = $('page-container');
    c.innerHTML = '<div class="detail-head"><div class="dh-title">基本资料</div><div class="dh-sub">编辑个人信息</div></div>' +
      '<div class="form-card">' +
      '<div class="form-row"><label class="form-label req">姓名</label><input class="form-input" id="pf-name" placeholder="请输入姓名"></div>' +
      '<div class="form-row"><label class="form-label">电话</label><input class="form-input" id="pf-phone" placeholder="请输入电话"></div>' +
      '<div class="form-row"><label class="form-label">部门</label><input class="form-input" id="pf-dept" placeholder="请输入部门"></div>' +
      '</div><button class="form-submit" onclick="App.saveProfile()">保存</button>';
  }
  function saveProfile() {
    var data = { name: $('pf-name').value, phone: $('pf-phone').value, department: $('pf-dept').value };
    OA.API.editPersonal(data).then(function (res) {
      if (res && res.code === 0) { toast('保存成功'); } else { toast((res && res.msg) || '保存失败'); }
    }).catch(function () { toast('网络异常'); });
  }
  // 修改密码
  function showPassword() {
    var c = $('page-container');
    c.innerHTML = '<div class="detail-head"><div class="dh-title">修改密码</div></div>' +
      '<div class="form-card">' +
      '<div class="form-row"><label class="form-label req">原密码</label><input type="password" class="form-input" id="pw-old" placeholder="原密码"></div>' +
      '<div class="form-row"><label class="form-label req">新密码</label><input type="password" class="form-input" id="pw-new" placeholder="新密码"></div>' +
      '<div class="form-row"><label class="form-label req">确认新密码</label><input type="password" class="form-input" id="pw-confirm" placeholder="确认新密码"></div>' +
      '</div><button class="form-submit" onclick="App.savePassword()">保存</button>';
  }
  function savePassword() {
    var o = $('pw-old').value, n = $('pw-new').value, cf = $('pw-confirm').value;
    if (!o || !n) { toast('请填写完整'); return; }
    if (n !== cf) { toast('两次密码不一致'); return; }
    OA.API.editPassword({ old_password: o, new_password: n }).then(function (res) {
      if (res && res.code === 0) { toast('密码已修改'); setTimeout(function () { App.logout(); }, 800); }
      else toast((res && res.msg) || '修改失败');
    }).catch(function () { toast('网络异常'); });
  }

  // 消息详情
  function openMsg(id) {
    OA.API.messageList('inbox', 1, 1).then(function () {});
    // 简化：直接提示
    toast('打开消息 ' + id + '（详情接口后续补全）');
  }
  function openArticle(id) { toast('打开问答 ' + id); }
  function openOrder(id) {
    OA.API.orderView(id).then(function (res) {
      if (res && res.code === 0 && res.data) {
        var r = res.data;
        openPanel('<div class="detail-head"><div class="dh-title">' + OA.esc(r.title || r.order_no || '订单') + '</div><div class="dh-sub">客户：' + OA.esc(r.customer_name || '-') + '</div></div>' +
          '<div class="detail-card"><div class="detail-row"><div class="dl">金额</div><div class="dv">' + OA.esc(r.total || r.amount || '-') + '</div></div>' +
          '<div class="detail-row"><div class="dl">时间</div><div class="dv">' + OA.fmtTime(r.create_time) + '</div></div></div>');
      }
    }).catch(function () { toast('网络异常'); });
  }
  function searchCustomer() {
    var kw = ($('cust-kw') || {}).value || '';
    if (listState.customer) { listState.customer.kw = kw; listState.customer.page = 1; listState.customer.done = false; listState.customer.rows = {}; }
    loadCustomer(listState.customer ? listState.customer.type : 1);
  }
  function preloadName() {
    // 从首页信息里解析中文名缓存
    OA.API.indexInfo().then(function (res) {
      if (res && res.code === 0 && res.data) {
        var d = Array.isArray(res.data) ? res.data[0] : res.data;
        var name = (d && (d.name || d.real_name || d.nickname)) || '';
        if (name) { try { localStorage.setItem('uping_me_name', name); } catch (e) {} }
      }
    }).catch(function () {});
  }
  function pollMsgNum() {
    // 轮询未读消息数，更新铃铛徽标
    API.indexInfo().then(function (res) {
      if (res && res.code === 0 && res.data) {
        var d = Array.isArray(res.data) ? res.data[0] : res.data;
        var num = (d && d.msg_num != null) ? parseInt(d.msg_num, 10) : 0;
        var badge = $('bell-badge');
        if (badge) {
          if (num > 0) { badge.style.display = ''; badge.textContent = num > 99 ? '99+' : num; }
          else badge.style.display = 'none';
        }
      }
    }).catch(function () {});
  }

  // ===== 数据加载：审批列表 =====
  function loadApprove(status) {
    if (status !== listState.approve.status) {
      listState.approve = { page: 1, status: status, loading: false, done: false, rows: {} };
      var segs = document.querySelectorAll('#page-container .seg-item');
      for (var i = 0; i < segs.length; i++) segs[i].className = 'seg-item' + (parseInt(segs[i].getAttribute('data-s')) === status ? ' active' : '');
      $('approve-list').innerHTML = '';
    }
    var st = listState.approve;
    if (st.loading || st.done) return;
    st.loading = true;
    var box = $('approve-list');
    if (box) box.insertAdjacentHTML('beforeend', '<div class="loading" id="ap-loading">加载中…</div>');
    API.approveList(st.page, 20, st.status === 0 ? '' : st.status).then(function (res) {
      var el = $('ap-loading'); if (el) el.remove();
      if (!res || res.code !== 0) { box.insertAdjacentHTML('beforeend', '<div class="empty retry" onclick="App.loadApprove(' + st.status + ')">' + OA.esc((res && res.msg) || '加载失败') + '，点击重试</div>'); st.loading = false; return; }
      var rows = res.data || [];
      if (!rows.length) { box.insertAdjacentHTML('beforeend', '<div class="empty">暂无数据</div>'); st.done = true; st.loading = false; return; }
      for (var a = 0; a < rows.length; a++) st.rows[rows[a].id] = rows[a];
      var html = '';
      var keys = Object.keys(st.rows);
      for (var k = 0; k < keys.length; k++) {
        var r = st.rows[keys[k]];
        var s = parseInt(r.check_status != null ? r.check_status : r.status);
        var stText = '未知状态', stCls = 'tag-pending';
        if (s === 0 || s === 1) { stText = '待审批'; stCls = 'tag-pending'; }
        else if (s === 2) { stText = '已通过'; stCls = 'tag-pass'; }
        else if (s === 3 || s === 4) { stText = '已拒绝'; stCls = 'tag-reject'; }
        var canCheck = (s === 0 || s === 1);
        html += '<div class="card">' +
          '<div class="card-title">' + OA.esc(r.content || '审批') + '<span class="tag ' + stCls + '">' + stText + '</span></div>' +
          '<div class="card-line"><b>主题：</b>' + OA.esc(r.name || '') + '</div>' +
          '<div class="card-line"><b>申请人：</b>' + OA.esc(r.admin_name || r.name || '') + '</div>' +
          '<div class="card-line"><b>时间：</b>' + OA.fmtTime(r.create_time || r.detail_time || r.start_time) + '</div>' +
          (r.amount ? '<div class="card-line"><b>金额：</b>' + OA.esc(r.amount) + '</div>' : '') +
          '<div class="card-line" style="margin-top:6px"><span style="color:#1E6FFF" onclick="App.openApproveDetail(' + r.id + ')">查看详情 ›</span></div>' +
          (canCheck ? '<div class="approve-actions"><button class="btn btn-ok" onclick="App.doCheck(' + r.id + ',2)">通过</button><button class="btn btn-no" onclick="App.doCheck(' + r.id + ',3)">拒绝</button></div>' : '') +
          '</div>';
      }
      box.innerHTML = html;
      st.page++; st.loading = false; st.done = rows.length < 20;
      if (!st.done) box.insertAdjacentHTML('beforeend', '<div class="load-more" onclick="App.loadApprove(' + st.status + ')">加载更多</div>');
    }).catch(function () {
      var el2 = $('ap-loading'); if (el2) el2.remove();
      box.insertAdjacentHTML('beforeend', '<div class="empty retry" onclick="App.loadApprove(' + st.status + ')">网络异常，点击重试</div>');
      st.loading = false;
    });
  }

  // 审批详情弹层
  function openApproveDetail(id) {
    var r = listState.approve.rows[id];
    if (!r) { toast('详情未加载，请返回列表刷新'); return; }
    var s = parseInt(r.check_status != null ? r.check_status : r.status);
    var stText = '待审批';
    if (s === 2) stText = '已通过'; else if (s === 3 || s === 4) stText = '已拒绝';
    var head = '<div class="detail-head"><div class="dh-title">' + OA.esc(r.content || '审批') + '</div><div class="dh-sub">' + stText + ' · ' + OA.fmtTime(r.create_time) + '</div></div>';
    var body = '<div class="detail-card">' +
      '<div class="detail-row"><div class="dl">主题</div><div class="dv">' + OA.esc(r.name || '-') + '</div></div>' +
      '<div class="detail-row"><div class="dl">申请人</div><div class="dv">' + OA.esc(r.admin_name || r.name || '-') + '</div></div>' +
      '<div class="detail-row"><div class="dl">申请时间</div><div class="dv">' + OA.fmtTime(r.create_time || r.detail_time || r.start_time) + '</div></div>' +
      (r.amount ? '<div class="detail-row"><div class="dl">金额</div><div class="dv">' + OA.esc(r.amount) + '</div></div>' : '') +
      (r.remark ? '<div class="detail-row"><div class="dl">说明</div><div class="dv">' + OA.esc(r.remark) + '</div></div>' : '') +
      '</div>';
    var actions = '';
    if (s === 0 || s === 1) {
      actions = '<div class="approve-detail-actions"><button class="btn btn-ok" onclick="App.doCheck(' + id + ',2)">通过</button><button class="btn btn-no" onclick="App.doCheck(' + id + ',3)">拒绝</button></div>';
    }
    openPanel(head + body + actions);
  }

  // 审批通过/拒绝（status: 2 通过 3 拒绝）
  function doCheck(id, status) {
    var remark = prompt(status === 2 ? '通过备注（可留空）' : '拒绝原因：');
    if (remark === null) return;
    API.approveCheck(id, status, remark).then(function (res) {
      if (res && res.code === 0) {
        toast('操作成功');
        closePanel();
        loadApprove(listState.approve.status);
      } else {
        toast((res && res.msg) || '操作失败');
      }
    }).catch(function () { toast('网络异常，请重试'); });
  }
  // ===== 数据加载：客户列表 =====
  function loadCustomer(type) {
    if (!listState.customer || type !== listState.customer.type) {
      listState.customer = { page: 1, type: type, kw: '', loading: false, done: false, rows: {} };
      var segs = document.querySelectorAll('#page-container .seg-item');
      for (var i = 0; i < segs.length; i++) segs[i].className = 'seg-item' + (parseInt(segs[i].getAttribute('data-t')) === type ? ' active' : '');
      $('customer-list').innerHTML = '';
    }
    var st = listState.customer;
    if (st.loading || st.done) return;
    st.loading = true;
    var kw = ($('cust-kw') || {}).value || '';
    st.kw = kw;
    var box = $('customer-list');
    box.insertAdjacentHTML('beforeend', '<div class="loading" id="cu-loading">加载中…</div>');
    API.customerList(st.page, 20, st.type, kw).then(function (res) {
      var el = $('cu-loading'); if (el) el.remove();
      if (!res || res.code !== 0) { box.innerHTML = '<div class="empty retry" onclick="App.loadCustomer(' + st.type + ')">' + OA.esc((res && res.msg) || '加载失败') + '</div>'; st.loading = false; return; }
      var rows = res.data || [];
      if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; st.loading = false; return; }
      for (var a = 0; a < rows.length; a++) st.rows[rows[a].id] = rows[a];
      var html = '';
      var keys = Object.keys(st.rows);
      for (var k = 0; k < keys.length; k++) {
        var r = st.rows[keys[k]];
        html += '<div class="card" onclick="App.openCustomer(' + r.id + ')">' +
          '<div class="card-title">' + OA.esc(r.name || '未命名') + '</div>' +
          '<div class="card-line">预存款：<b>' + OA.esc(r.advance_deposit || '0.00') + '</b> · 抵扣券：<b>' + OA.esc(r.deduction || '0.00') + '</b></div>' +
          '<div class="card-line">保证金：' + OA.esc(r.margin_deposit || '0.00') + ' · 负责人：' + OA.esc(r.belong_name || '') + '</div>' +
          '</div>';
      }
      box.innerHTML = html;
      st.page++; st.loading = false; st.done = rows.length < 20;
      if (!st.done) box.insertAdjacentHTML('beforeend', '<div class="load-more" onclick="App.loadCustomer(' + st.type + ')">加载更多</div>');
    }).catch(function () {
      var el2 = $('cu-loading'); if (el2) el2.remove();
      box.innerHTML = '<div class="empty retry" onclick="App.loadCustomer(' + st.type + ')">网络异常，点击重试</div>';
      st.loading = false;
    });
  }

  // 客户详情弹层
  function openCustomer(id) {
    var r = listState.customer.rows[id];
    if (!r) { toast('未加载到该客户'); return; }
    var head = '<div class="detail-head"><div class="dh-title">' + OA.esc(r.name || '客户详情') + '</div><div class="dh-sub">负责人：' + OA.esc(r.belong_name || '-') + '</div></div>';
    var body = '<div class="detail-card">' +
      '<div class="detail-row"><div class="dl">预存款</div><div class="dv">' + OA.esc(r.advance_deposit || '0.00') + '</div></div>' +
      '<div class="detail-row"><div class="dl">抵扣券</div><div class="dv">' + OA.esc(r.deduction || '0.00') + '</div></div>' +
      '<div class="detail-row"><div class="dl">保证金</div><div class="dv">' + OA.esc(r.margin_deposit || '0.00') + '</div></div>' +
      '</div>' +
      '<div class="detail-actions">' +
      '<button class="dbtn" onclick="App.openSub(\'contact-list\', ' + id + ')">联系人</button>' +
      '<button class="dbtn" onclick="App.openSub(\'trace-list\', ' + id + ')">跟进记录</button>' +
      '</div>';
    openPanel(head + body);
    API.customerContact(id).then(function (res) {
      if (res && res.code === 0 && res.data && res.data.length) {
        var h = '<div class="sec-title">联系人</div><div class="detail-card">';
        for (var i = 0; i < Math.min(res.data.length, 10); i++) {
          var ct = res.data[i];
          h += '<div class="detail-row"><div class="dl">' + OA.esc(ct.name || ct.real_name || '') + '</div><div class="dv">' + OA.esc(ct.phone || ct.mobile || '') + '</div></div>';
        }
        h += '</div>';
        var anchor = document.querySelector('.detail-actions');
        if (anchor) anchor.insertAdjacentHTML('beforebegin', h);
      }
    }).catch(function () {});
  }

  // ===== 弹层（详情/消息通用）=====
  function openPanel(innerHtml) {
    closePanel();
    var mask = document.createElement('div');
    mask.className = 'mask-overlay';
    var panel = document.createElement('div');
    panel.className = 'mask-panel';
    panel.innerHTML = '<div class="y-panel-head" style="position:sticky;top:0;background:#fff;z-index:2"><div>详情</div><span class="y-panel-close" onclick="App.closePanel()">×</span></div><div style="padding:8px">' + innerHtml + '</div>';
    mask.appendChild(panel);
    mask.addEventListener('click', function (e) { if (e.target === mask) closePanel(); });
    document.body.appendChild(mask);
  }
  function closePanel() {
    var m = document.querySelector('.mask-overlay');
    if (m) m.remove();
  }

})();
