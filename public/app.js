/* 优品OA 网页版 · 主逻辑（由 App 源码 app.js 1:1 移植，仅外壳适配）
 * 适配点：API=OA.API；toast/webToast 替代 alert；absUrl 走同域 Worker；
 *          登录态由 login.html 守卫；原生桥调用全部退化为浏览器能力（新窗口/下载）。 */
var API = OA.API;

/* ===== 网页版 toast（替代 App 的 alert 兜底） ===== */
function webToast(msg) {
    var t = document.getElementById('app-web-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'app-web-toast';
        t.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);background:rgba(31,35,41,.88);color:#fff;font-size:14px;padding:10px 18px;border-radius:10px;z-index:9999;max-width:78%;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.22);opacity:0;transition:opacity .18s';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t.__timer);
    t.__timer = setTimeout(function () { t.style.opacity = '0'; }, 1800);
}

/* ===== v5：全局「点击重试」委托（App 源码的 empty retry div 无 onclick，网页版补上） ===== */
document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('retry')) {
        e.stopPropagation();
        if (window.App && typeof App.reloadPage === 'function') { App.reloadPage(); }
        else { location.reload(); }
    }
});

/* ===== v5：用户名就绪后回填首页问候语（App 源码 fetchMyName 成功后不重渲染，问候语停在"未登录"） ===== */
function webFillGreet(name) {
    if (!name) return;
    var el = document.getElementById('home-greet');
    if (el) {
        var h = new Date().getHours();
        var greet = h < 6 ? '凌晨好' : (h < 9 ? '早上好' : (h < 12 ? '上午好' : (h < 14 ? '中午好' : (h < 18 ? '下午好' : '晚上好'))));
        el.textContent = greet + '，' + name;
    }
    var sb = document.getElementById('sb-user-name');
    if (sb) sb.textContent = name;
}

/* ===== 网页版下载（替代 AndroidBridge.downloadFile / shareFile） ===== */
function webDownload(url, name) {
    try {
        var a = document.createElement('a');
        a.href = url;
        a.download = name || '';
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 900);
        return true;
    } catch (e) { return false; }
}
function webShare(url, name) { webDownload(url, name); }

/* ===== 网页版打包（替代 AndroidBridge.zipFiles / shareZip：逐个下载） ===== */
function webZipDownload(list) {
    if (!list || !list.length) return;
    var i = 0;
    function next() {
        if (i >= list.length) return;
        var it = list[i++];
        webDownload(it.url, it.name);
        setTimeout(next, 350);
    }
    next();
}

/* ===== 桌面设计系统：列表表格表头（渲染补丁把卡片行换成 <tr>，此处包裹表格） ===== */
var DT_HEAD = {
    approve: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:230px">主题</th><th>申请人</th><th>金额</th><th>申请时间</th><th>状态</th><th style="min-width:150px">操作</th>' +
        '</tr></thead><tbody>',
    customer: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:200px">客户名称</th><th>类型</th><th>预存款</th><th>抵扣券</th><th>保证金</th><th>负责人</th><th style="min-width:90px">操作</th>' +
        '</tr></thead><tbody>',
    order: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:260px">订单</th><th>成交金额</th><th>状态</th><th>成交时间</th><th style="min-width:90px">操作</th>' +
        '</tr></thead><tbody>',
    fin: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th>单号</th><th style="min-width:200px">客户</th><th>金额</th><th>状态</th><th>时间</th>' +
        '</tr></thead><tbody>',
    'fin-advance': '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th>金额</th><th>类型</th><th style="min-width:180px">客户</th><th>余额变化</th><th>时间</th>' +
        '</tr></thead><tbody>',
    'fin-income': '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th>金额</th><th style="min-width:220px">发票抬头</th><th>时间</th>' +
        '</tr></thead><tbody>',
    'fin-order': '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th>金额</th><th style="min-width:220px">关联订单</th><th>时间</th>' +
        '</tr></thead><tbody>',
    msg: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:280px">主题</th><th>联系人</th><th>时间</th><th style="min-width:80px">操作</th>' +
        '</tr></thead><tbody>',
    mail: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:150px">姓名</th><th>手机号</th><th style="min-width:140px">部门</th><th style="min-width:160px">邮箱</th>' +
        '</tr></thead><tbody>',
    note: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:320px">标题</th><th>分类</th><th>发布人</th><th>时间</th>' +
        '</tr></thead><tbody>',
    article: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:320px">标题</th><th>分类</th><th>提问人</th><th>时间</th>' +
        '</tr></thead><tbody>',
    files: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:280px">文件名</th><th>类型</th><th>大小</th><th style="min-width:140px">上传者</th><th>时间</th>' +
        '</tr></thead><tbody>',
    contact: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:120px">姓名</th><th>手机号</th><th style="min-width:160px">所属客户</th><th>部门</th><th>微信/邮箱</th><th style="min-width:60px">操作</th>' +
        '</tr></thead><tbody>',
    chance: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:220px">机会</th><th style="min-width:150px">客户</th><th>预计金额</th><th>状态</th><th>创建时间</th><th style="min-width:60px">操作</th>' +
        '</tr></thead><tbody>',
    trace: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:260px">客户 / 跟进内容</th><th>方式</th><th>跟进人</th><th>时间</th><th style="min-width:60px">操作</th>' +
        '</tr></thead><tbody>',
    sample: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:260px">样本 / 测样号</th><th>处理状态</th><th>下单时间</th><th>退回时间</th>' +
        '</tr></thead><tbody>',
    school: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:240px">标题 / 地区</th><th>状态</th><th>预算</th><th style="min-width:180px">起止时间</th><th style="min-width:60px">操作</th>' +
        '</tr></thead><tbody>',
    after: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:240px">单号 / 客户</th><th>解决状态</th><th>创建时间</th><th style="min-width:60px">操作</th>' +
        '</tr></thead><tbody>',
    platorder: '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
        '<th style="min-width:200px">平台订单号</th><th style="min-width:150px">采购单位</th><th>成交金额</th><th>处理状态</th><th>负责人</th><th>下单时间</th>' +
        '</tr></thead><tbody>'
};
var DT_TAIL = '</tbody></table></div>';

/* ===== v3 SVG 线性图标系统（ICONS 表与 index.html 同源定义于 window.ICONS） ===== */
var EMOJI_MAP = {
    '🏠': 'home', '✅': 'check-circle', '👥': 'users', '👤': 'user',
    '✉': 'mail', '📁': 'folder', '🗂': 'layers', '🎫': 'ticket',
    '🛒': 'shopping-cart', '🔧': 'wrench', '📝': 'clipboard', '⚙': 'settings',
    '✓': 'check', '📢': 'megaphone', '📇': 'book', '💰': 'wallet',
    '🛡': 'shield', '🧾': 'receipt', '📊': 'pie-chart', '📈': 'trending-up',
    '🎯': 'target', '🧫': 'droplets', '🏫': 'graduation-cap', '✕': 'x',
    '💬': 'message-circle', '🤖': 'bot', '🧪': 'flask', '🔨': 'wrench',
    '➕': 'plus-circle', '📷': 'eye', '★': 'star', '🔒': 'lock',
    '🚪': 'log-out', '🏖': 'calendar', '✈': 'send', '🏃': 'user',
    '🔏': 'lock', '🚗': 'briefcase', '📚': 'book', '☆': 'star',
    '💾': 'download', '🗑': 'trash', '✔': 'check', '✖': 'x',
    '↩': 'corner-down-left', '🖥': 'external-link', '🔔': 'bell',
    '📋': 'clipboard', '⇩': 'download', '↗': 'external-link', '📦': 'package'
};
function v3esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function ic(name, cls) {
    var tbl = (typeof window !== 'undefined' && window.ICONS) || {};
    var d = tbl[name];
    if (!d) return '';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
}
/* 动态渲染兜底：把任意 DOM 子树文本节点中的 emoji 替换为 SVG 线性图标（按码点遍历，代理对安全） */
function deEmoji(root) {
    if (!root || !root.childNodes) return;
    var texts = [];
    (function collect(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
            var ch = node.childNodes[i];
            if (ch.nodeType === 3) texts.push(ch);
            else if (ch.nodeType === 1 && ch.tagName !== 'SVG' && ch.tagName !== 'SCRIPT' && ch.tagName !== 'STYLE') collect(ch);
        }
    })(root);
    for (var j = 0; j < texts.length; j++) {
        var t = texts[j], v = t.nodeValue;
        if (!v) continue;
        var hit = false;
        for (var k = 0; k < v.length; k++) {
            var cpk = v.codePointAt(k);
            if (cpk > 0xFFFF) k++;
            if (EMOJI_MAP[String.fromCodePoint(cpk)]) { hit = true; break; }
        }
        if (!hit) continue;
        var html = '', buf = '', made = false;
        for (var p = 0; p < v.length; p++) {
            var cp = v.codePointAt(p);
            var ch2 = String.fromCodePoint(cp);
            if (cp > 0xFFFF) p++;
            var name = EMOJI_MAP[ch2];
            if (name) {
                if (buf) { html += v3esc(buf); buf = ''; }
                // v5.1 修复：包一层 .mli-ic，否则裸 SVG 无尺寸约束会按默认大小（巨大）渲染
                html += '<span class="mli-ic">' + ic(name) + '</span>';
                made = true;
            } else buf += ch2;
        }
        if (buf) html += v3esc(buf);
        if (made && t.parentNode) {
            var span = document.createElement('span');
            span.innerHTML = html;
            var frag = document.createDocumentFragment();
            while (span.firstChild) frag.appendChild(span.firstChild);
            t.parentNode.replaceChild(frag, t);
        }
    }
}


// 优品OA 移动端 主逻辑
var App = (function () {
    var currentTab = 'home';
    var listState = {}; // 各列表分页状态
    // ===== 桌面多标签并存条（tab-strip）状态 =====
    var dtTabs = [{ id: 'home', name: '工作台', icon: 'home', run: "App.switchTab('home')" }];
    var dtActiveTab = 'home';

    // ===== 工具 =====
    function $(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    // 剥离服务端高亮 HTML 标签（如 <font color="red">），再转义显示，避免源码泄露
    function plain(s) {
        return esc(String(s == null ? '' : s).replace(/<[^>]*>/g, ''));
    }
    function fmtTime(t) {
        if (!t) return '';
        // 支持 时间戳/字符串
        if (typeof t === 'number') {
            var d = new Date(t * 1000);
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        }
        return String(t);
    }
    // ===== 版本号唯一来源（P0-4）：优先取 index.html 内联声明的 window.APP_VERSION =====
    var APP_VERSION = (typeof window.APP_VERSION === 'string' && window.APP_VERSION) ? window.APP_VERSION : 'v1.1.56';

    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function toast(msg) {
        if (window.AndroidBridge) AndroidBridge.toast(msg);
        else webToast(msg);
    }

    // ===== v1.1.57 修复：自定义弹层（替代 window.confirm / window.prompt） =====
    // 说明：Android WebView（4.4+ 内核）默认不显示 confirm / prompt 对话框，尤其 prompt 被移除，
    // 导致「确认/通过/删除/选审批人/输入意见」等操作点击无反应（即反馈中的「无法修改 / 无法选择审批人」）。
    // 因此全部改用自绘弹层（异步回调），不再依赖原生 JS 对话框。
    function ensureDialogRoot() {
        var r = document.getElementById('ui-dialog-root');
        if (!r) { r = document.createElement('div'); r.id = 'ui-dialog-root'; document.body.appendChild(r); }
        return r;
    }
    // 确认弹层：message 文案；onOk 回调（取消不触发）
    function uiConfirm(message, onOk) {
        var root = ensureDialogRoot();
        var mask = document.createElement('div');
        mask.className = 'y-mask';
        mask.innerHTML = '<div class="y-card">' +
            '<div class="y-msg">' + esc(message || '') + '</div>' +
            '<div class="y-btns"><span class="y-btn y-cancel">取消</span><span class="y-btn y-ok">确定</span></div></div>';
        root.appendChild(mask);
        mask.querySelector('.y-cancel').onclick = function () { mask.remove(); };
        mask.querySelector('.y-ok').onclick = function () { mask.remove(); try { onOk && onOk(); } catch (e) {} };
        return mask;
    }
    // 输入弹层：onOk(value) 回调；取消不触发
    function uiPrompt(title, placeholder, onOk, defaultVal) {
        var root = ensureDialogRoot();
        var mask = document.createElement('div');
        mask.className = 'y-mask';
        mask.innerHTML = '<div class="y-card">' +
            '<div class="y-title">' + esc(title || '') + '</div>' +
            '<textarea class="y-input" placeholder="' + esc(placeholder || '') + '">' + esc(defaultVal || '') + '</textarea>' +
            '<div class="y-btns"><span class="y-btn y-cancel">取消</span><span class="y-btn y-ok">确定</span></div></div>';
        root.appendChild(mask);
        var ta = mask.querySelector('.y-input');
        setTimeout(function () { try { ta.focus(); } catch (e) {} }, 60);
        mask.querySelector('.y-cancel').onclick = function () { mask.remove(); };
        mask.querySelector('.y-ok').onclick = function () {
            var v = ta.value; mask.remove(); try { onOk && onOk(v); } catch (e) {}
        };
        return mask;
    }
    // 单选列表弹层（审批人选择）：list=[{id,name}]；onOk(item) 回调
    function uiSelectUsers(title, list, onOk) {
        var root = ensureDialogRoot();
        var mask = document.createElement('div');
        mask.className = 'y-mask y-bottom';
        var items = (list || []).map(function (u, i) {
            return '<div class="y-pick" data-i="' + i + '">' + esc(u.name) + '</div>';
        }).join('');
        mask.innerHTML = '<div class="y-panel">' +
            '<div class="y-panel-head"><span>' + esc(title || '请选择') + '</span><span class="y-panel-close">✕</span></div>' +
            '<div class="y-search"><input class="y-search-input" type="text" placeholder="搜索姓名"></div>' +
            '<div class="y-pick-list">' + (items || '<div class="empty">没有可选人员</div>') + '</div></div>';
        root.appendChild(mask);
        function close() { mask.remove(); }
        mask.querySelector('.y-panel-close').onclick = close;
        mask.onclick = function (e) { if (e.target === mask) close(); };
        var picks = function () { return mask.querySelectorAll('.y-pick'); };
        var si = mask.querySelector('.y-search-input');
        if (si) si.oninput = function (e) {
            var kw = (e.target.value || '').trim();
            picks().forEach(function (el) {
                el.style.display = (!kw || el.textContent.indexOf(kw) >= 0) ? '' : 'none';
            });
        };
        picks().forEach(function (el) {
            el.onclick = function () {
                var i = parseInt(el.getAttribute('data-i'), 10);
                var u = list[i]; close();
                try { onOk && onOk(u); } catch (e) {}
            };
        });
        return mask;
    }

    // ===== 加载更多统一入口 =====
    var LM = {
        'note': 'loadNote', 'article': 'loadArticle', 'product': 'loadProduct',
        'files': 'loadFiles', 'finance-order': 'loadFinanceOrder', 'finance-advance': 'loadFinanceAdvance',
        'finance-income': 'loadFinanceIncome', 'approve': 'loadApprove', 'customer': 'loadCustomer',
        'msg': 'loadMessage', 'mail': 'loadMail', 'contact': 'loadContactList', 'chance': 'loadChanceList',
        'trace': 'loadTraceList', 'order-my': 'loadOrderMy', 'order-handle': 'loadOrderHandle',
        'school': 'loadSchool', 'after': 'loadAfter',
        'platform-order': 'loadPlatformOrder', 'sample': 'loadSample',
        'invoice-my': 'loadFinanceInvoiceMy', 'invoice-handle': 'loadFinanceInvoiceHandle',
        'orderapply-handle': 'loadFinanceOrderApplyHandle',
        'deduction': 'loadFinanceDeduction', 'deduction-checked': 'loadFinanceDeductionChecked',
        'margin': 'loadFinanceMargin'
    };
    var pgPageSize = {
        'note': 15, 'article': 15, 'product': 15, 'files': 15,
        'finance-order': 15, 'finance-advance': 15, 'finance-income': 15,
        'approve': 20, 'customer': 20, 'msg': 20, 'mail': 20,
        'contact': 20, 'chance': 20, 'trace': 20, 'order-my': 20,
        'order-handle': 20, 'school': 20, 'after': 20, 'platform-order': 20,
        'sample': 20, 'invoice-my': 20, 'invoice-handle': 20, 'orderapply-handle': 20,
        'deduction': 20, 'deduction-checked': 20, 'margin': 20
    }; // key -> API limit for that list loader

    function moreBtn(key, arg) {
        // 生成"加载更多"即记录当前列表加载器，供上拉自动加载触发
        currentLoadKey = key;
        currentLoadArg = (arg == null) ? null : arg;
        var a = (arg == null) ? '' : ' data-arg="' + String(arg).replace(/"/g, '&quot;') + '"';
        var q = "'" + key + "'";
        if (arg != null) q += ",'" + String(arg).replace(/'/g, "\'") + "'";
        if (isPhone()) {
            return '<div class="load-more" data-load="' + key + '"' + a + ' onclick="this.__lmBound=1;App.lm(' + q + ')">加载更多（点击加载）</div>';
        }
        // 桌面：浏览器后台标配——真页码数字 + 每页条数 + 总数 + 行选择
        var aq = "'" + key + "'";
        if (arg != null) aq += ",'" + String(arg).replace(/'/g, "\'") + "'";
        var pg = pgState[key] || (pgState[key] = { page: 1, size: 20, total: 0, pages: 1, current: 1 });
        var sz = pgPageSize[key] || pg.size;
        return '<div class="dt-pager" data-pg-key="' + key + '" data-pg-arg="' + (arg == null ? '' : arg) + '">' +
            '<span class="pg-total" data-pg-total>共 0 条</span>' +
            '<span class="pg-pages" data-pg-pages></span>' +
            '<span class="pg-size-wrap" onclick="App.pgSize(event,\'' + key + '\')" data-pg-size><span class="pg-size-cur">' + sz + '</span> 条/页<span class="pg-size-pop" data-pg-pop><button class="pg-size-opt' + (sz === 20 ? ' active' : '') + '" data-sz="20">20</button><button class="pg-size-opt' + (sz === 50 ? ' active' : '') + '" data-sz="50">50</button><button class="pg-size-opt' + (sz === 100 ? ' active' : '') + '" data-sz="100">100</button></span></span>' +
            '</div>';
    }
    function lm(key, arg) {
        var fn = LM[key];
        if (!fn || !App[fn]) { toast('加载功能不可用'); return; }
        currentLoadKey = key;
        currentLoadArg = (arg == null) ? null : arg;
        if (arg != null) App[fn](arg); else App[fn]();
        setTimeout(function () { deEmoji($('page-container')); }, 60);
    }
    // 桌面分页器翻页（无侵入：复用现有累加式 loader；上一页回到列表顶部）
    /* 桌面分页器：严格页码跳转（1 2 3…N）+ 每页条数 20/50/100 可切 + 总数显示 */
    var pgState = {}; // key -> { page, size, total, pages, current }

    function pg(key, target) {
        var fn = LM[key];
        if (!fn || !App[fn]) return;
        // target: 'prev' | 'next' | 具体页码数字
        var st = pgState[key] || (pgState[key] = { page: 1, size: 20, total: 0, pages: 1, current: 1 });
        if (target === 'prev') st.page = Math.max(1, st.current - 1);
        else if (target === 'next') st.page = Math.min(st.pages, st.current + 1);
        else st.page = Math.max(1, Math.min(st.pages, Number(target) || 1));
        st.current = st.page;
        // 重置累加并拉某页（等效严格页码跳转：清空 rows + 重新请求第 N 页）
        App.pgJump(key, st.page, st.size);
        setTimeout(function () { deEmoji($('page-container')); updatePagerDom(key); }, 80);
    }
    function pgJump(key, page, size) {
        // 清空当前列表容器 + 累加器，强制拉第 page 页（不复用"加载更多"累加逻辑）
        var fn = LM[key];
        if (!fn || !App[fn]) return;
        // 各 loader 的 state 是闭包无法直接重置，用"切走再切回"等效手段
        // 这里通过调用对应 renderXxx 重置 + 调用 loader 实现
        App.pgReload(key, page, size);
    }
    function pgReload(key, page, size) {
        var arg = (key === 'customer') ? 1 : (key === 'msg' ? 'inbox' : null);
        var st = pgState[key] || (pgState[key] = { page: 1, size: 20, total: 0, pages: 1, current: 1 });
        st.page = page; st.size = size; st.current = page;
        // 各 key 对应的 DOM 容器 id 与状态对象
        var pgBoxId = {
            'note': 'note-list', 'article': 'article-list', 'product': 'product-list',
            'files': 'files-list', 'finance-order': 'finance-order-list',
            'finance-advance': 'finance-advance-list', 'finance-income': 'finance-income-list',
            'approve': 'approve-list', 'customer': 'customer-list', 'msg': 'msg-list',
            'mail': 'mail-list', 'contact': 'contact-list', 'chance': 'chance-list',
            'trace': 'trace-list', 'order-my': 'ord-list', 'order-handle': 'ordh-list',
            'platform-order': 'po-list', 'sample': 'sample-list', 'school': 'school-list',
            'after': 'after-list'
        };
        var pgStateMap = {
            'note': function () { return window.listState && window.listState.note; },
            'article': function () { return window.listState && window.listState.article; },
            'product': function () { return window.listState && window.listState.product; },
            'files': function () { return window.listState && window.listState.files; },
            'finance-order': function () { return window.listState && window.listState.financeOrder; },
            'finance-advance': function () { return window.listState && window.listState.financeAdv; },
            'finance-income': function () { return window.listState && window.listState.financeInc; },
            'approve': function () { return window.listState && window.listState.approve; },
            'customer': function () { return window.listState && window.listState.customer; },
            'msg': function () { return window.msgState; },
            'mail': function () { return window.mailState; },
            'contact': function () { return window.custSubState && window.custSubState['contact']; },
            'chance': function () { return window.custSubState && window.custSubState['chance']; },
            'trace': function () { return window.custSubState && window.custSubState['trace']; },
            'order-my': function () { return window.orderState && window.orderState['my']; },
            'order-handle': function () { return window.orderState && window.orderState['handle']; },
            'platform-order': function () { return window.platOrderState; },
            'sample': function () { return window.orderState && window.orderState['sample']; },
            'school': function () { return window.orderState && window.orderState['school']; },
            'after': function () { return window.orderState && window.orderState['after']; }
        };
        // 1. 重置该 key 的累加器（按各 loader 的重置语义）
        try {
            var stateGetter = pgStateMap[key];
            if (stateGetter) {
                var stObj = stateGetter();
                if (stObj) { stObj.page = page; stObj.rows = {}; stObj.done = false; stObj.loading = false; }
            }
            if (window.finState && window.finState[key]) {
                window.finState[key].page = page;
                window.finState[key].rows = {};
                window.finState[key].done = false;
                window.finState[key].loading = false;
            }
        } catch (e) {}
        // 2. 清空列表容器（让 loader 重新渲染第 page 页，而非追加）
        try {
            var boxId = pgBoxId[key] || ('fin-list-' + key);
            var listBox = document.getElementById(boxId);
            if (listBox) listBox.innerHTML = '';
        } catch (e) {}
        // 3. 调对应 loader（多数 loader 第一次调用时若 st 已重置，会拉第 page 页）
        var fn = LM[key];
        if (fn && App[fn]) {
            if (arg != null) App[fn](arg); else App[fn]();
        }
    }
    function pgSize(ev, key) {
        ev.stopPropagation();
        var pager = ev.target.closest('.dt-pager');
        if (!pager) return;
        var pop = pager.querySelector('[data-pg-pop]');
        if (!pop) return;
        var cur = pop.querySelector('.pg-size-opt.active');
        var opt = ev.target.closest('.pg-size-opt');
        if (!opt) { pop.classList.toggle('open'); return; }
        var newSz = Number(opt.getAttribute('data-sz')) || 20;
        // 切换每页条数 → 记录该 key 当前页大小（供 updatePagerDom 计算总页数），再重新拉第 1 页
        pgPageSize[key] = newSz;
        var st = pgState[key] || (pgState[key] = { page: 1, size: 20, total: 0, pages: 1, current: 1 });
        st.size = newSz;
        st.page = 1; st.current = 1;
        App.pgReload(key, 1, newSz);
        setTimeout(function () { deEmoji($('page-container')); updatePagerDom(key); }, 80);
        // 更新 UI
        if (cur) cur.classList.remove('active');
        opt.classList.add('active');
        var curEl = pager.querySelector('.pg-size-cur');
        if (curEl) curEl.textContent = String(newSz);
        pop.classList.remove('open');
    }
    // 更新分页器 DOM（页码数字 + 总数）——在 loader 返回数据后由调用方触发
    function updatePagerDom(key, total) {
        var pager = document.querySelector('.dt-pager[data-pg-key="' + key + '"]');
        if (!pager) return;
        var st = pgState[key] || (pgState[key] = { page: 1, size: 20, total: 0, pages: 1, current: 1 });
        // 总数：优先使用调用方传入的 total；否则按当前表格行数更新
        if (typeof total === 'number' && !isNaN(total)) {
            st.total = Math.max(st.total, total);
        } else {
            var n = 0;
            var table = document.querySelector('.dt-table');
            if (table && table.querySelectorAll) n = table.querySelectorAll('tbody tr').length;
            st.total = Math.max(st.total, n);
        }
        // 页大小取每页实际拉取条数（不同 loader 不一致时以 key 映射为准，缺省 20）
        var sz = pgPageSize[key] || st.size;
        st.pages = Math.max(1, Math.ceil(st.total / sz));
        // 总数显示
        var totalEl = pager.querySelector('[data-pg-total]');
        if (totalEl) totalEl.textContent = '共 ' + st.total + ' 条';
        // 页码数字（1 2 3 … N，带省略号）
        var pagesBox = pager.querySelector('[data-pg-pages]');
        if (pagesBox) {
            var html = '';
            // 上一页
            html += '<span class="pg-btn' + (st.current <= 1 ? ' disabled' : '') + '" onclick="App.pg(\'' + key + '\',\'prev\')">‹</span>';
            // 页码数字
            var start = Math.max(1, st.current - 2);
            var end = Math.min(st.pages, st.current + 2);
            if (start > 1) {
                html += '<span class="pg-num" onclick="App.pg(\'' + key + '\',1)">1</span>';
                if (start > 2) html += '<span class="pg-ellipsis">…</span>';
            }
            for (var i = start; i <= end; i++) {
                html += '<span class="pg-num' + (i === st.current ? ' active' : '') + '" onclick="App.pg(\'' + key + '\',' + i + ')">' + i + '</span>';
            }
            if (end < st.pages) {
                if (end < st.pages - 1) html += '<span class="pg-ellipsis">…</span>';
                html += '<span class="pg-num" onclick="App.pg(\'' + key + '\',' + st.pages + ')">' + st.pages + '</span>';
            }
            // 下一页
            html += '<span class="pg-btn' + (st.current >= st.pages ? ' disabled' : '') + '" onclick="App.pg(\'' + key + '\',\'next\')">›</span>';
            pagesBox.innerHTML = html;
        }
    }
    // 刷新当前列表（桌面后台标配"刷新"）
    function refreshList(key) {
        var fn = LM[key];
        if (!fn || !App[fn]) return;
        // 先清空当前列表容器与累加器，再重新拉第一页（等效"刷新"）
        try {
            var state = (window.__listState && window.__listState[key]) || null;
            if (!state) {
                // 各 loader 的 state 是闭包，无法直接重置；用"重新进入"等效手段
            }
            // 兜底：重新调用 loader（多数 loader 在 type/page 不变时会累加，
            // 因此先切走再切回更稳；这里直接重拉并去重由 st.rows 累积键保证）
            App[fn]();
        } catch (e) {}
        // 重置分页器状态（回到第 1 页、清除 total），让后续 loader 完成后 updatePagerDom 刷新
        var st = pgState[key] || (pgState[key] = { page: 1, size: 20, total: 0, pages: 1, current: 1 });
        st.page = 1; st.current = 1; st.total = 0; st.pages = 1;
        toast('已刷新');
    }
    function reloadList(key) {
        var fn = LM[key];
        if (!fn || !App[fn]) return;
        var arg = (key === 'customer') ? 1 : (key === 'msg' ? 'inbox' : null);
        App[fn](arg);
    }
    // 导出当前已加载列表为 CSV（桌面后台标配"导出"）
    function exportList(key) {
        var table = document.querySelector('.dt-table');
        if (!table) { toast('没有可导出的数据'); return; }
        var thead = table.querySelectorAll('thead th');
        var tbody = table.querySelectorAll('tbody tr');
        var head = [];
        for (var i = 0; i < thead.length; i++) head.push((thead[i].textContent || '').trim());
        var lines = [head.join(',')];
        for (var r = 0; r < tbody.length; r++) {
            var tds = tbody[r].querySelectorAll('td');
            var vals = [];
            for (var j = 0; j < tds.length; j++) {
                var t = (tds[j].textContent || '').replace(/\s+/g, ' ').trim();
                if (/[",\n]/.test(t)) t = '"' + t.replace(/"/g, '""') + '"';
                vals.push(t);
            }
            lines.push(vals.join(','));
        }
        var csv = '\ufeff' + lines.join('\n'); // BOM 让 Excel 识别 UTF-8
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = key + '_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
        toast('已导出 CSV（' + tbody.length + ' 条）');
    }

    /* 桌面后台标配工具栏按钮：给列表页的 dt-toolbar-ops 自动补"刷新 + 导出 + 列宽"（手机隐藏）
       触发条件：页面有 .dt-toolbar-ops 容器（列表页/详情页通用；空数据页也有） */
    function injectToolbarOps() {
        if (isPhone()) return;
        var root = document.getElementById('page-container');
        if (!root) return;
        // 取当前分页 key（若存在），否则从 URL hash / 当前 tab 兜底
        var pager = root.querySelector('.dt-pager[data-pg-key]');
        var key = pager ? pager.getAttribute('data-pg-key') : (currentPageType || currentTab);
        var ops = root.querySelectorAll('.dt-toolbar-ops');
        if (!ops.length) return; // 无工具栏操作区的页面（如纯表单）不注入
        for (var i = 0; i < ops.length; i++) {
            var o = ops[i];
            if (o.querySelector('.oa-btn.ghost[data-desktop-only]')) continue; // 已注入
            o.insertAdjacentHTML('beforeend',
                '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.refreshList(\'' + key + '\')">' + ic('refresh') + '刷新</span>' +
                '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.exportList(\'' + key + '\')">' + ic('download') + '导出</span>' +
                '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.toggleTableDensity()">' + ic('grid') + '列宽</span>');
        }
    }

    /* ===== 桌面多标签并存条（tab-strip）：打开模块即加 tab，点 tab 切换，点 × 关闭 =====
       v7.3：最多同时挂 6 个 tab，超出自动关掉最旧的非活跃 tab（layui 后台惯例） */
    var DTS_MAX = 6;
    function tabEnsure(id, name, icon, run) {
        for (var i = 0; i < dtTabs.length; i++) if (dtTabs[i].id === id) return dtTabs[i];
        dtTabs.push({ id: id, name: name, icon: icon, run: run });
        // 超限时关掉最旧的非活跃 tab（home 永远保留）
        while (dtTabs.length > DTS_MAX) {
            var rm = -1;
            for (var j = 0; j < dtTabs.length; j++) {
                if (dtTabs[j].id !== 'home' && dtTabs[j].id !== dtActiveTab) { rm = j; break; }
            }
            if (rm === -1) break;
            dtTabs.splice(rm, 1);
        }
        return dtTabs[dtTabs.length - 1];
    }
    var TYPE_META = {
        'message-inbox': ['消息中心', 'mail'], 'mail': ['通讯录', 'book'], 'note': ['企业公告', 'megaphone'],
        'article': ['问答知识', 'message-circle'], 'product': ['产品管理', 'flask'], 'files': ['附件管理', 'folder'],
        'finance-order': ['财务·到账（订单）', 'file-text'], 'finance-advance': ['财务·预存款', 'briefcase'],
        'finance-income': ['财务·开票收入', 'file-text'], 'deduction': ['抵扣券', 'file-text'],
        'deduction-checked': ['抵扣券（管理）', 'file-text'], 'margin': ['保证金', 'file-text'],
        'invoice-my': ['发票·我申请', 'file-text'], 'invoice-handle': ['发票·我处理', 'file-text'],
        'orderapply-handle': ['订单到账处理', 'file-text'],
        'contact-list': ['客户联系人', 'users'], 'chance-list': ['销售机会', 'target'], 'trace-list': ['跟进记录', 'clipboard-check'],
        'order-my': ['订单·我申请', 'package'], 'order-handle': ['订单·我处理', 'wrench'],
        'platform-order': ['平台订单', 'shopping-cart'], 'sample': ['样本管理', 'flask'],
        'school': ['校展管理', 'book'], 'after': ['售后管理', 'tool']
    };
    var TAB_NAME = {
        home: ['工作台', 'home'], approve: ['审批中心', 'check-circle'],
        customer: ['客户管理', 'users'], mine: ['个人中心', 'user']
    };
    function renderTabStrip() {
        if (isPhone()) return;
        var strip = document.getElementById('dt-tabstrip');
        if (!strip) return;
        // 基于当前 currentTab + currentPageType 推导
        var activeId = currentTab;
        var activeName = null, activeIcon = null;
        if (currentPageType && TYPE_META[currentPageType]) {
            activeId = currentPageType;
            activeName = TYPE_META[currentPageType][0];
            activeIcon = TYPE_META[currentPageType][1];
        } else if (TAB_NAME[currentTab]) {
            activeId = currentTab;
            activeName = TAB_NAME[currentTab][0];
            activeIcon = TAB_NAME[currentTab][1];
        }
        // 自动把当前活跃 tab 加入
        if (activeName) {
            tabEnsure(activeId, activeName, activeIcon,
                currentPageType ? "App.showSubPage('" + currentPageType + "')" : "App.switchTab('" + currentTab + "')");
            dtActiveTab = activeId;
        }
        var addBtn = document.getElementById('dts-add');
        var tabsHtml = '';
        for (var i = 0; i < dtTabs.length; i++) {
            var t = dtTabs[i];
            var closable = t.id !== 'home';
            tabsHtml += '<div class="dts-tab' + (dtActiveTab === t.id ? ' active' : '') + '" data-tabid="' + t.id + '" onclick="App.tabActivate(\'' + t.id + '\')">' +
                '<span class="dts-tab-ic">' + (window.OA_ICON ? window.OA_ICON(t.icon) : '') + '</span>' +
                '<span class="dts-tab-name">' + t.name + '</span>' +
                (closable ? '<span class="dts-tab-close" data-close="' + t.id + '" onclick="event.stopPropagation();App.tabClose(\'' + t.id + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>' : '') +
                '</div>';
        }
        Array.prototype.slice.call(strip.querySelectorAll('.dts-tab')).forEach(function (n) { n.remove(); });
        if (addBtn) addBtn.insertAdjacentHTML('beforebegin', tabsHtml);
    }
    function tabActivate(id) {
        var t = null;
        for (var i = 0; i < dtTabs.length; i++) if (dtTabs[i].id === id) { t = dtTabs[i]; break; }
        if (!t) return;
        dtActiveTab = id;
        try { eval(t.run); } catch (e) {}
        // 同步侧栏高亮（主菜单 Tab）
        var items = document.querySelectorAll('.sb-item[data-page]');
        var targetName = null;
        for (var k in TAB_NAME) if (TAB_NAME[k] && TAB_NAME[k][0] && id === k) targetName = TAB_NAME[k][0];
        for (var j = 0; j < items.length; j++) {
            items[j].classList.toggle('active', items[j].getAttribute('data-page') === targetName);
        }
        renderTabStrip();
    }
    function tabClose(id) {
        for (var i = 0; i < dtTabs.length; i++) {
            if (dtTabs[i].id === id) { dtTabs.splice(i, 1); break; }
        }
        if (dtActiveTab === id) {
            dtActiveTab = 'home';
            try { App.switchTab('home'); } catch (e) {}
        }
        renderTabStrip();
    }

    /* ===== 桌面表格密度切换（悬浮工具组"列宽设置"用）===== */
    var tableDensity = 'comfortable'; // 'comfortable' | 'compact'
    function toggleTableDensity() {
        if (isPhone()) return;
        tableDensity = (tableDensity === 'comfortable') ? 'compact' : 'comfortable';
        var root = document.getElementById('page-container');
        if (root) root.classList.toggle('table-compact', tableDensity === 'compact');
        toast(tableDensity === 'compact' ? '已切换为紧凑列宽' : '已切换为舒适列宽');
        setTimeout(function () { injectRowSelection(root); }, 50);
    }

    /* 桌面行选择：给 .dt-table 表格注入 checkbox 列（移动端 CSS 已隐藏 .pg-col） */
    function injectRowSelection(root) {
        if (isPhone()) return;
        root = root || document.getElementById('page-container');
        if (!root) return;
        var tables = root.querySelectorAll('.dt-table');
        for (var t = 0; t < tables.length; t++) {
            var table = tables[t];
            var thead = table.querySelector('thead');
            if (!thead) continue;
            // 若已有 .pg-col 则跳过（防重复）
            if (thead.querySelector('th.pg-col')) continue;
            var headRow = thead.querySelector('tr');
            if (!headRow) continue;
            // 插入表头 checkbox 列
            var th = document.createElement('th');
            th.className = 'pg-col';
            th.innerHTML = '<input type="checkbox" data-pg-head data-table="' + t + '">';
            headRow.insertBefore(th, headRow.firstChild);
            // 给所有数据行插入 checkbox 单元格
            var rows = table.querySelectorAll('tbody tr');
            for (var r = 0; r < rows.length; r++) {
                if (rows[r].querySelector('td.pg-col')) continue;
                var td = document.createElement('td');
                td.className = 'pg-col';
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'pg-row-cb';
                cb.addEventListener('change', (function (idx) {
                    return function () {
                        var row = table.querySelectorAll('tbody tr')[idx];
                        row.classList.toggle('pg-selected', cb.checked);
                    };
                })(r));
                td.appendChild(cb);
                rows[r].insertBefore(td, rows[r].firstChild);
                rows[r].classList.add('pg-selectable');
            }
        }
    }
    // 当前列表加载器（供上拉自动加载触发）
    var currentLoadKey = '';
    var currentLoadArg = null;

    function openUrl(url) {
        if (!url) return;
        if (window.AndroidBridge) AndroidBridge.openUrl(url);
        else window.open(url, '_blank');
    }
    function openOa(path) {
        // 消息内"去审批/查看详情"等 OA 路径优先路由到 App 内移动端页面；未命中再回退 WebViewActivity 打开网页版
        var m;
        if (path && (m = path.match(/^\/customer\/order\/view\/id\/(\d+)$/))) return App.openOrderFromMsg(Number(m[1]));
        if (path && (m = path.match(/^\/customer\/order\/view\?id=(\d+)$/))) return App.openOrderFromMsg(Number(m[1]));
        if (path && (m = path.match(/^\/oa\/approve\/view\/id\/(\d+)$/))) return App.openApproveFromMsg(Number(m[1]));
        if (path && (m = path.match(/^\/oa\/approve\/view\?id=(\d+)$/))) return App.openApproveFromMsg(Number(m[1]));
        // 产品管理/产品列表：一律路由到 App 移动版产品页（网页版列表加载在 WebView 中会卡死，禁止打开）
        if (path && /^\/product(?:\/index(?:\.html)?)?(?:\?.*)?$/.test(path)) return App.openMobile('product');
        openUrl(API.BASE + path);
    }
    // 从消息"去审批"直达审批详情：按 id 在审批列表中定位后渲染 App 内审批详情页（不跳网页版）
    function openApproveFromMsg(id) {
        showDetailShell('审批详情', function () {
            App.switchTab('approve');
            App.renderApprove();
            App.loadApprove(0);
        });
        var c = $('page-container');
        c.innerHTML = '<div class="loading">加载中…</div>';
        var probe = function (page) {
            if (page > 5) { c.innerHTML = '<div class="empty">未找到该审批或已无查看权限</div>'; return; }
            API.approveList(page, 20, '').then(function (res) {
                var rows = (res && res.data) || [];
                var found = null;
                for (var i = 0; i < rows.length; i++) { if (Number(rows[i].id) === Number(id)) { found = rows[i]; break; } }
                if (found) {
                    wbApproveRows[found.id] = found;
                    if (listState.approve && listState.approve.rows) listState.approve.rows[found.id] = found;
                    openApproveDetail(found.id);
                } else if (rows.length > 0) {
                    probe(page + 1);
                } else {
                    c.innerHTML = '<div class="empty">未找到该审批或已无查看权限</div>';
                }
            }).catch(function () {
                c.innerHTML = '<div class="empty">网络异常</div>';
            });
        };
        probe(1);
    }
    // 从消息"去审批"直达订单审单页：按 id 精确拉取订单后渲染 App 内审单页（不跳网页版）
    function openOrderFromMsg(id) {
        showDetailShell('订单审单', function () { App.openMobile('order-handle'); });
        var c = $('page-container');
        c.innerHTML = '<div class="loading">加载中…</div>';
        API.orderHandleList(1, 20, '', { id: id }).then(function (res) {
            var rows = (res && res.data) || [];
            var r = null;
            for (var i = 0; i < rows.length; i++) {
                if (String(rows[i].id) === String(id)) { r = rows[i]; break; }
            }
            if (r) {
                storeOrderRow(r);
                openOrderDetail(id, 'handle');
                return;
            }
            // 列表接口不支持按 id 过滤（服务端未实现），改为取网页版详情 HTML 解析主表字段，在 App 内渲染原生移动端审单页，
            // 只有当解析失败时才回退打开网页版详情，避免误显示列表首条
            c.innerHTML = '<div class="loading">加载订单详情…</div>';
            API.orderViewHtml(id).then(function (html) {
                var rv = parseOrderViewHtml(html, id);
                if (!rv) {
                    c.innerHTML = '<div class="empty">未找到该订单，正在打开网页版详情…</div>';
                    openUrl(API.BASE + '/customer/order/view?id=' + id);
                    return;
                }
                // 网页版成交/实际金额由前端脚本按产品明细计算，这里同样汇总产品明细补齐金额
                API.orderProductData(rv.id, rv.product_ids || '', rv.code || '').then(function (pr) {
                    if (pr && pr.code === 0 && pr.data && pr.data.length) {
                        var total = 0;
                        for (var k = 0; k < pr.data.length; k++) {
                            var p = pr.data[k];
                            var t = (p.total !== undefined && p.total !== null && p.total !== '')
                                ? parseFloat(p.total) : (parseFloat(p.price || 0) * parseFloat(p.num || 0));
                            if (!isNaN(t)) total += t;
                        }
                        var gift = parseFloat(rv.gift_amount || 0);
                        if (isNaN(gift)) gift = 0;
                        rv.deal_amount = total.toFixed(2);
                        rv.amount = (total - gift).toFixed(2);
                    }
                    storeOrderRow(rv);
                    openOrderDetail(id, 'handle');
                }).catch(function () {
                    storeOrderRow(rv);
                    openOrderDetail(id, 'handle');
                });
            }).catch(function () {
                c.innerHTML = '<div class="empty">网络异常</div>';
            });
        }).catch(function () {
            c.innerHTML = '<div class="empty">网络异常</div>';
        });
    }
    // 缓存订单行到审单列表状态，供审单页渲染与保存取用
    function storeOrderRow(r) {
        if (!orderState['handle']) orderState['handle'] = { page: 1, loading: false, done: false, rows: {} };
        if (!orderState['handle'].rows) orderState['handle'].rows = {};
        orderState['handle'].rows[r.id] = r;
    }
    // 解析网页版订单详情 HTML，抽取主表字段供原生移动页渲染（正则容错，字段缺失返回空串）
    // v1.1.56：电脑端详情页 HTML -> 纯文本
    function htmlToText(s) {
        return String(s == null ? '' : s).replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    }
    // v1.1.56：从电脑端详情页 HTML 提取「标签-值」表（标签格 class 含 layui-td-gray，值格紧随其后）
    function parseKvTable(html) {
        var out = [], seen = {};
        if (!html || String(html).indexOf('<') < 0) return out;
        var re = /<td[^>]*class="[^"]*layui-td-gray[^"]*"[^>]*>([\s\S]*?)<\/td>\s*<td(?![^>]*layui-td-gray)[^>]*>([\s\S]*?)<\/td>/g, m;
        while ((m = re.exec(String(html)))) {
            var k = htmlToText(m[1]).replace(/\s+/g, ' ').trim();
            var v = htmlToText(m[2]).replace(/\s+/g, ' ').trim();
            if (!k || seen[k]) continue;
            seen[k] = 1; out.push([k, v]);
        }
        return out;
    }
    function parseOrderViewHtml(html, id) {
        if (!html || String(html).indexOf('<') < 0) return null;
        var s = String(html);
        function unesc(v) {
            return String(v == null ? '' : v).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
        }
        function attr(tag, name) {
            var m = String(tag || '').match(new RegExp(name + '="([^"]*)"'));
            return m ? unesc(m[1]) : '';
        }
        function tagBy(re) { var m = s.match(re); return m ? m[0] : ''; }
        function inputByName(name) { return attr(tagBy(new RegExp('<input[^>]*name="' + name + '"[^>]*>')), 'value'); }
        function inputByMsg(msg) { return attr(tagBy(new RegExp('<input[^>]*data-val-msg="' + msg + '"[^>]*>')), 'value'); }
        function selectOld(name) { return attr(tagBy(new RegExp('<select[^>]*name="' + name + '"[^>]*>')), 'data-old-val'); }
        // 兼容 input / select / textarea 三种控件按 data-val-msg 取值
        function ctrlByMsg(msg) {
            var m = s.match(new RegExp('<input[^>]*data-val-msg="' + msg + '"[^>]*>'));
            if (m) return attr(m[0], 'value');
            m = s.match(new RegExp('<select[^>]*data-val-msg="' + msg + '"[^>]*>'));
            if (m) return attr(m[0], 'data-old-val');
            m = s.match(new RegExp('<textarea[^>]*data-val-msg="' + msg + '"[^>]*>([\\s\\S]*?)<\\/textarea>'));
            if (m) return unesc(m[1]).trim();
            return '';
        }
        // 文本值反查枚举值（用于把"未到账"等文案还原成 0/1/2 供列表卡片同款映射使用）
        function pickNum(txt, map) {
            txt = String(txt || '').replace(/\s+/g, '');
            if (!txt || txt === '-') return '';
            for (var k in map) { if (String(map[k]).replace(/\s+/g, '') === txt) return Number(k); }
            return '';
        }
        // 控件值可能是枚举数字（data-old-val）也可能是中文文案（单元格文本），两种都兼容
        function toEnum(v, map) {
            if (v === null || v === undefined || v === '') return '';
            if (/^\d+$/.test(String(v).trim())) return Number(v);
            return pickNum(v, map);
        }
        // 下拉框当前选中项名称（省/市/区县等）
        function selectText(name) {
            var m = html.match(new RegExp('<select[^>]*name="' + name + '"[^>]*>([\\s\\S]*?)</select>'));
            if (!m) return '';
            var sel = m[1].match(/<option[^>]*selected[^>]*>([^<]*)<\/option>/);
            return sel ? sel[1].trim() : '';
        }
        // 下拉框当前选中项的值（省市区 select 无 data-old-val，选中态在 option 的 selected 上）
        function selectSelVal(name) {
            var m = html.match(new RegExp('<select[^>]*name="' + name + '"[^>]*>([\\s\\S]*?)</select>'));
            if (!m) return '';
            var sel = m[1].match(/<option[^>]*selected[^>]*value="([^"]*)"/) || m[1].match(/<option[^>]*value="([^"]*)"[^>]*selected/);
            return sel ? sel[1] : '';
        }
        // 省份下拉全量选项（电脑端审单页内联渲染，供手机端省市区联动使用）
        function provinceOptions() {
            var m3 = s.match(/<select[^>]*name="provinceid"[^>]*>([\s\S]*?)<\/select>/);
            var seg3 = m3 ? m3[1] : '';
            var re3 = /<option value="(\d+)"[^>]*>([\s\S]*?)<\/option>/g, mm3, out3 = [];
            while ((mm3 = re3.exec(seg3))) {
                out3.push({ id: mm3[1], name: unesc(mm3[2].replace(/<[^>]*>/g, '')).trim() });
            }
            return out3;
        }
        // 收款选项表格（无数据返回空数组）
        function parseReceipts() {
            var i = html.indexOf('收款选项');
            if (i < 0) return [];
            var seg = html.slice(i, i + 30000);
            var tb = seg.indexOf('<tbody');
            if (tb < 0) return [];
            var body = seg.slice(tb);
            var end = body.indexOf('</tbody>');
            if (end >= 0) body = body.slice(0, end);
            var out = [], re = /<tr[^>]*>([\s\S]*?)<\/tr>/g, m2;
            while ((m2 = re.exec(body))) {
                var tds = m2[1].match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
                if (tds.length < 6) continue;
                var vals = [];
                for (var t = 0; t < tds.length; t++) {
                    vals.push(tds[t].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
                }
                out.push(vals);
            }
            return out;
        }
        // 关联附件 / 其他附件：文件名 + 大小时间
        // v1.1.67：额外解析文件卡片 id（fileItem{id}），拼出下载地址 /api/index/get_oss_file.html?id={id}
        function parseFiles(blockId) {
            var out = [];
            var m = s.match(new RegExp('id="' + blockId + '"[\\s\\S]*?</td>'));
            var seg = m ? m[0] : '';
            // 优先按 fileItem 卡片解析（卡片 id 即文件 id）
            var re = /id="fileItem(\d+)"[\s\S]*?file-title" title="([^"]*)"[\s\S]*?<div class="file-ops">([\s\S]*?)<\/div>/g;
            var mm;
            while ((mm = re.exec(seg))) {
                out.push({
                    id: mm[1],
                    name: unesc(mm[2]),
                    info: unesc(mm[3].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim(),
                    url: absUrl('/api/index/get_oss_file.html?id=' + mm[1])
                });
            }
            if (out.length) return out;
            // 兜底：老结构（无卡片 id，按 onclick 里的下载地址）
            var re2 = /<div class="file-title" title="([^"]*)"[\s\S]*?get_oss_file\.html\?id=(\d+)[\s\S]*?<div class="file-ops">([\s\S]*?)<\/div>/g;
            while ((mm = re2.exec(seg))) {
                out.push({
                    id: mm[2],
                    name: unesc(mm[1]),
                    info: unesc(mm[3].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim(),
                    url: absUrl('/api/index/get_oss_file.html?id=' + mm[2])
                });
            }
            if (out.length) return out;
            // 再兜底：只有标题与大小时间，无下载地址
            var re3 = /<div class="file-title" title="([^"]*)"[\s\S]*?<div class="file-ops">([\s\S]*?)<\/div>/g;
            while ((mm = re3.exec(seg))) {
                out.push({ id: '', name: unesc(mm[1]), info: unesc(mm[2].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim(), url: '' });
            }
            return out;
        }
        // 审批流程节点（结构化：审批人/节点名 + 状态，与电脑端 flowList 数据一致）
        function parseFlowNodes() {
            var nodes = [];
            var m = s.match(/id="flowList"[\s\S]*?<\/td>/);
            var seg = m ? m[0] : '';
            var re = /<div class="check-item-name">([\s\S]*?)<\/div>[\s\S]*?<div class="check-item-status">([\s\S]*?)<\/div>/g;
            var mm;
            while ((mm = re.exec(seg))) {
                var nm = unesc(mm[1].replace(/<[^>]*>/g, '')).trim();
                var stt = unesc(mm[2].replace(/<[^>]*>/g, '')).trim();
                if (nm) nodes.push({ name: nm, status: stt });
            }
            return nodes;
        }
        // 审批记录时间线
        function parseFlowRecords() {
            var recs = [];
            var m = s.match(/class="layui-timeline flow-record[\s\S]*?<\/ul>/);
            var seg = m ? m[0] : '';
            var re = /<p[^>]*>([\s\S]*?)<\/p>/g;
            var mm;
            while ((mm = re.exec(seg))) {
                var t = unesc(mm[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
                if (t) recs.push(t);
            }
            return recs;
        }
        // 回款公司下拉选项模板（option 模板里 id -> 名称），把 data-old-val 的 id 还原为名称
        function subjectOptions() {
            var m2 = s.match(/id="orderSubjectSelectTem"[\s\S]*?<\/div>/);
            var seg = m2 ? m2[0] : '';
            var re = /<option value="(\d+)"[^>]*>([\s\S]*?)<\/option>/g;
            var out = [], mm;
            while ((mm = re.exec(seg))) {
                out.push({ id: mm[1], name: unesc(mm[2].replace(/<[^>]*>/g, '')).trim() });
            }
            return out;
        }
        function subjectName(v) {
            if (!v) return '';
            var m2 = s.match(/id="orderSubjectSelectTem"[\s\S]*?<\/div>/);
            var seg = m2 ? m2[0] : '';
            var re = /<option value="(\d+)"[^>]*>([\s\S]*?)<\/option>/g;
            var mm;
            while ((mm = re.exec(seg))) {
                if (String(mm[1]) === String(v)) return unesc(mm[2].replace(/<[^>]*>/g, '')).trim();
            }
            return '';
        }
        function tdVal(label) {
            var m = s.match(new RegExp('>' + label + '</td>[\\s\\S]{0,200}?<td[^>]*>([\\s\\S]*?)</td>'));
            if (!m) m = s.match(new RegExp(label + '[\\s\\S]{0,200}?<td[^>]*>([\\s\\S]*?)</td>'));
            if (!m) return '';
            return unesc(m[1].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
        }
        function numOf(v) { var n = parseFloat(v); return isNaN(n) ? '' : n; }
        var giftTag = tagBy(/<textarea[^>]*name="gift"[^>]*>/);
        var gift = attr(giftTag, 'data-old-val');
        if (!gift) {
            var gm = s.match(/<textarea[^>]*name="gift"[^>]*>([\s\S]*?)<\/textarea>/);
            gift = gm ? unesc(gm[1]).trim() : '';
        }
        var amountM = s.match(/id="order_amount"[^>]*>\s*([\d.]+)/);
        var dealM = s.match(/id="deal_amount"[^>]*>\s*([\d.]+)/);
        // 回款公司下拉的选项由脚本异步填充，HTML 里只剩占位文案时置空，避免显示"请选择回款公司"
        var subject = tdVal('回款公司');
        if (/请选择/.test(subject) || !subject) subject = subjectName(selectOld('order_subject'));
        var r = {
            id: Number(inputByName('id') || id),
            code: tdVal('订单编号'),
            title: inputByName('title'),
            customer_name: tdVal('成交客户').replace(/^择-/, ''),
            deal_time: tdVal('成交时间'),
            check_status: Number(inputByName('check_status') || 0),
            // 电脑端详情页隐藏域：当前节点类型（0=指定审批人节点，通过时需选下一节点/审批人）与当前步骤
            cur_flow_type: Number(inputByName('flow_type') || 0),
            cur_check_step_sort: Number(inputByName('check_step_sort') || 0),
            recipient_name: ctrlByMsg('收件姓名'),
            recipient_phone: ctrlByMsg('收件号码'),
            recipient_address: ctrlByMsg('收件地址'),
            sender_name: ctrlByMsg('寄件姓名'),
            sender_phone: ctrlByMsg('寄件号码'),
            payment_company: ctrlByMsg('打款公司'),
            gift_amount: ctrlByMsg('礼品金额') || tdVal('礼品金额'),
            gift_order_code: tdVal('礼品订单号'),
            gift: gift,
            is_stock: selectOld('is_stock'),
            order_subject_name: subject,
            product_ids: inputByName('product_ids'),
            file_ids: inputByName('file_ids'),
            amount: numOf(amountM ? amountM[1] : ''),
            deal_amount: numOf(dealM ? dealM[1] : ''),
            // ===== v1.1.53：对齐电脑端详情页的只读字段 =====
            order_state_text: tdVal('订单状态'),
            remark_text: tdVal('备注信息'),
            province_text: selectText('provinceid'),
            city_text: selectText('cityid'),
            dist_text: selectText('distid'),
            receipts: parseReceipts(),
            is_cash: toEnum(tdVal('是否到账'), { 0: '未到账', 1: '部分到账', 2: '全部到账' }),
            is_pay: toEnum(ctrlByMsg('是否打款'), { 1: '未打款', 2: '已打款' }),
            is_invoice: toEnum(tdVal('是否开票'), { 1: '未开票', 2: '已申请，待开具', 3: '已开票' }),
            gift_status: toEnum(ctrlByMsg('礼品状态'), { 1: '未采购', 2: '已采购' }),
            customer_type: toEnum(tdVal('客户类型'), { 1: '终端', 2: '经销商' }),
            order_type: Number(selectOld('order_type')) || '',
            delivery_no: tdVal('发货单号'),
            source_text: tdVal('平台来源'),
            first_text: tdVal('是否首单'),
            director_name: tdVal('负责人'),
            assist_name: tdVal('协助人'),
            open_name: tdVal('开单人'),
            copy_name: tdVal('抄送人'),
            check_user: tdVal('当前审核人'),
            flow_nodes: parseFlowNodes(),
            flow_records: parseFlowRecords(),
            files: parseFiles('fileBox'),
            other_files: parseFiles('fileOrderBox'),
            // 回款公司：当前值(id) + 官网同款下拉选项；客户 id 供打款公司选项接口使用
            order_subject: selectOld('order_subject'),
            subject_options: subjectOptions(),
            // 省市区（电脑端可改：provinceid/cityid/distid 三级联动，提交 modify_order_info）
            provinceid: selectSelVal('provinceid'),
            cityid: selectSelVal('cityid'),
            distid: selectSelVal('distid'),
            province_options: provinceOptions(),
            customer_id: (function () {
                var cm = s.match(/var\s+cid\s*=\s*"?(\d+)"?/);
                return cm ? Number(cm[1]) : 0;
            })()
        };
        if (!r.code && !r.title && !r.customer_name) return null;
        return r;
    }

    // 服务端售后等字段为 JSON 数组包装字符串（[{id,code,title,<field>:值}]），解析取第一项同名键值；
    // 值本身为数组时用顿号连接；解析失败或非包装结构时返回原文
    function unboxField(v, key) {
        if (v === null || v === undefined || v === '') return '';
        var s = String(v).trim();
        if (s.charAt(0) === '[') {
            try {
                var arr = JSON.parse(s);
                if (Array.isArray(arr) && arr.length) {
                    var o = arr[0];
                    if (o && typeof o === 'object') {
                        var val = o[key];
                        if (Array.isArray(val)) return val.join('、');
                        if (val === null || val === undefined) return '';
                        return String(val);
                    }
                    return String(o);
                }
            } catch (e) {}
        }
        return s;
    }

    // 审批类型名称映射（列表数据 content 字段即类型名，此处用于宫格/筛选）
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

    // ===== 初始化 =====
    function getSavedUser() {
        try {
            var raw = localStorage.getItem('uping_saved_user');
            if (!raw) return null;
            var o = JSON.parse(raw);
            return (o && o.u) ? o : null;
        } catch (e) { return null; }
    }
    function fillSavedUser() {
        var saved = getSavedUser();
        if (saved) {
            $('login-username').value = saved.u;
            $('login-password').value = saved.p;
            var rb = $('login-remember');
            if (rb) rb.checked = true;
        }
    }
    function saveRemembered() {
        var rb = $('login-remember');
        var remember = !!(rb && rb.checked);
        if (remember) {
            localStorage.setItem('uping_saved_user', JSON.stringify({ u: $('login-username').value.trim(), p: $('login-password').value }));
        } else {
            localStorage.removeItem('uping_saved_user');
        }
    }
    var currentPageType = ''; // 当前子页面类型，供"点击重试"重新加载
    var inDetailShell = false; // 是否处于详情/表单壳层
    // v1.1.56：当前页面的"重放函数"。失败重试只重建当前页，
    // 不再回退到来源列表，从根上消除"一刷新就乱跳"。
    var currentReplay = null;
    var navStack = []; // 详情/表单壳层导航栈：逐级返回，避免深层页面返回跳错层级
    function regReplay(fn) { if (typeof fn === 'function') currentReplay = fn; }
    // v1.1.56：列表页统一登记——从详情/表单返回列表、或详情内操作后直接重渲染列表时，
    // 同步页面状态与重放函数，避免刷新时重放到已离开的详情页。
    function markListPage(type) {
        inDetailShell = false;
        navStack.length = 0;
        currentPageType = type || '';
        if (type) regReplay(function () { showSubPage(type); });
    }

    /* 列表表格移动端卡片化：读取 thead th（移动端 display:none 但仍在 DOM），
       按列序把列名写入各 td[data-label]，驱动 style.css 的卡片规则。
       仅给尚未标注的 td 写 data-label，故加载更多追加的行也会自动补标。 */
    function injectTableLabels(root) {
        root = root || $('page-container');
        if (!root) return;
        var tables = root.querySelectorAll('.dt-table');
        for (var ti = 0; ti < tables.length; ti++) {
            var table = tables[ti];
            var ths = table.querySelectorAll('thead th');
            var labels = [];
            for (var k = 0; k < ths.length; k++) labels.push((ths[k].textContent || '').replace(/\s+/g, ' ').trim());
            var rows = table.querySelectorAll('tbody tr');
            for (var r = 0; r < rows.length; r++) {
                var cells = rows[r].querySelectorAll('td');
                for (var ci = 0; ci < cells.length; ci++) {
                    if (cells[ci].getAttribute('data-label') != null) continue;
                    cells[ci].setAttribute('data-label', labels[ci] || '');
                }
            }
        }
    }

    function init() {
        // 加载更多统一事件委托兜底（主用内联 onclick，此处防漏）
        document.addEventListener('click', function (e) {
            var t = e.target && e.target.closest ? e.target.closest('.load-more') : null;
            if (t && !t.__lmBound) {
                App.lm(t.getAttribute('data-load') || '', t.getAttribute('data-arg'));
                return;
            }
            // 加载失败提示：点击重试 → 重进当前子页面重置加载
            var rt = e.target && e.target.closest ? e.target.closest('.empty.retry') : null;
            if (rt) {
                App.reloadPage();
                return;
            }
        }, false);
        // 网页版：登录态由 login.html 守卫，进入本页即已登录
        // v3：全局图标兜底——动态渲染（异步列表/加载更多/弹层）中的 emoji 自动替换为 SVG 线性图标
        try {
            if (window.MutationObserver && $('page-container')) {
                var __deT = null;
                new MutationObserver(function () {
                    if (__deT) return;
                    __deT = setTimeout(function () {
                        __deT = null;
                        try { deEmoji($('page-container')); } catch (e) {}
                        try { injectTableLabels($('page-container')); } catch (e) {}
                        try { injectToolbarOps(); } catch (e) {}
                        try { injectRowSelection($('page-container')); } catch (e) {}
                    }, 80);
                }).observe($('page-container'), { childList: true, subtree: true });
            }
        } catch (e) {}
        try { $('login-view').style.display = 'none'; } catch (e) {}
        $('app-view').style.display = 'flex';
        switchTab('home');
        startMsgPoll();
        checkSession();
        fetchMyName(function (n) { webFillGreet(n); }); // v5：名字就绪后回填问候语/侧栏
        bindScrollAutoLoad();
        // v6：跨断点（桌面↔手机）整体重渲染——重新检测设备、更新 window.DEVICE 与
        // html[data-device]，再整体重渲染当前页，保证两套设计彻底切换、绝不混合。
        function __detectNow() {
            var w = window.innerWidth || document.documentElement.clientWidth || 1280;
            var ua = navigator.userAgent || '';
            if (/Android|iPhone|iPod|Mobile|Windows Phone|webOS|BlackBerry/i.test(ua) && !/iPad|Tablet/i.test(ua)) return 'mobile';
            return w < 820 ? 'mobile' : 'desktop';
        }
        var __v6LastDev = __detectNow();
        window.addEventListener('resize', function () {
            var now = __detectNow();
            if (now === __v6LastDev) return;
            __v6LastDev = now;
            window.DEVICE = now;
            document.documentElement.setAttribute('data-device', now);
            try {
                if (currentPageType) showSubPage(currentPageType);
                else if (currentTab) switchTab(currentTab);
                else renderHome();
            } catch (e) {}
        });
    }

    // ===== 上拉自动加载（原 App 尾部 DOMContentLoaded 的 page-container 滚动监听，折叠进 init） =====
    // 触底：按当前列表"加载更多"按钮或产品列表对应的加载器自动加载（覆盖所有 Tab 与子页面）
    function bindScrollAutoLoad() {
        var pc = $('page-container');
        if (!pc || pc.__autoLoadBound) return;
        pc.__autoLoadBound = true;
        var pcAutoTick = 0;
        pc.addEventListener('scroll', function () {
            if (pcAutoTick) return;
            if (pc.scrollTop + pc.clientHeight < pc.scrollHeight - 40) return;
            var moreEl = pc.querySelector('.load-more');
            var prodEl = $('product-list');
            if ((!moreEl && !prodEl) || !currentLoadKey || !LM[currentLoadKey]) return;
            pcAutoTick = 1;
            setTimeout(function () { pcAutoTick = 0; }, 1200);
            if (currentLoadArg != null) App.lm(currentLoadKey, currentLoadArg);
            else App.lm(currentLoadKey);
        });
    }

    // ===== 上拉自动加载 =====
    // v1.1.59：按用户要求移除下拉刷新（页面顶部继续下拉触发重载）。
    // 仅保留滚动到底部自动加载下一页；页面刷新请用各页面的重试/重新进入。
    var autoLoadTick = 0;      // 上拉自动加载节流
    function bindPullRefresh() {
        // 上拉：滚动接近底部且存在"加载更多"或产品列表时自动触发当前列表加载下一页（window 才能可靠收到文档滚动）
        window.addEventListener('scroll', function () {
            if (autoLoadTick) return;
            if (!document.querySelector('#page-container .load-more') && !document.getElementById('product-list')) return;
            var el = document.scrollingElement || document.documentElement;
            if (!el || el.scrollHeight - el.scrollTop - el.clientHeight > 100) return;
            autoLoadTick = 1;
            setTimeout(function () { autoLoadTick = 0; }, 1200);
            if (currentLoadKey) App.lm(currentLoadKey, currentLoadArg);
        }, { passive: true });
    }

    // ===== 登录 =====
    function refreshCaptcha() {
        var info = API.captchaUrl();
        if (info.native) {
            $('captcha-img').src = info.data;
        } else {
            $('captcha-img').src = info.data;
        }
    }

    function doLogin() {
        var u = $('login-username').value.trim();
        var p = $('login-password').value;
        var c = $('login-captcha').value.trim();
        $('login-tip').textContent = '';
        if (!u || !p || !c) { $('login-tip').textContent = '请填写账号、密码和验证码'; return; }
        $('login-btn').disabled = true;
        $('login-btn').textContent = '登录中…';
        API.login(u, p, c).then(function (res) {
            if (res && res.code === 0) {
                saveRemembered();
                localStorage.setItem('uping_user', '1');
                try { localStorage.setItem('uping_me', JSON.stringify((res && res.data) || {})); } catch (e) {}
                $('login-view').style.display = 'none';
                $('app-view').style.display = 'flex';
                switchTab('home');
                startMsgPoll();
                fetchMyName(); // v1.1.62：预热中文名缓存（"我的"页显示谁的名字）
            } else {
                $('login-tip').textContent = (res && res.msg) || '登录失败';
                refreshCaptcha();
                $('login-captcha').value = '';
            }
        }).catch(function () {
            $('login-tip').textContent = '网络异常，请重试';
            refreshCaptcha();
        }).finally(function () {
            $('login-btn').disabled = false;
            $('login-btn').textContent = '登 录';
        });
    }

    // ===== 消息提示音轮询（与官方桌面端一致：轮询 /home/index/index 的 msg_num）=====
    var lastMsgNum = -1;
    var msgPollTimer = null;
    var msgViewing = false; // 正在查看消息中心/消息详情时为 true，期间轮询只更新角标不响铃
    // v1.1.61：同步"正在查看消息中心"给原生轮询器——原生发现新消息时按此决定是否响铃/震动
    function setMsgViewing(v) {
        msgViewing = !!v;
        if (window.AndroidBridge && AndroidBridge.setMsgViewing) {
            try { AndroidBridge.setMsgViewing(msgViewing); } catch (e) {}
        }
    }

    // 顶部铃铛角标：有未读显示数字，无未读隐藏
    function updateBellBadge(num) {
        var b = $('bell-badge');
        if (!b) return;
        if (num > 0) {
            b.textContent = num > 99 ? '99+' : String(num);
            b.style.display = 'inline-block';
        } else {
            b.style.display = 'none';
        }
    }

    // 立即刷新一次未读数（进入消息中心/阅读后调用，避免等下一轮询）
    function refreshMsgNow() {
        API.indexInfo().then(function (res) {
            if (!res || res.code !== 0) return;
            var num = (res.data && res.data.msg_num != null) ? res.data.msg_num : 0;
            updateBellBadge(num);
            if (lastMsgNum >= 0) lastMsgNum = num;
        }).catch(function () {});
    }

    // 启动即会话探测：Cookie 过期/被清时立即回登录页，不等用户点列表才发现"加载不出来"
    function checkSession() {
        API.indexInfo().then(function (res) {
            if (!res || res.code !== 0) return;
            var num = (res.data && res.data.msg_num != null) ? res.data.msg_num : 0;
            updateBellBadge(num);
            if (lastMsgNum < 0) lastMsgNum = num;
        }).catch(function () {});
    }

    function startMsgPoll() {
        if (msgPollTimer) return;
        lastMsgNum = -1;
        // v1.1.61：有原生桥时由原生 Handler 轮询（10s 一次，App 退后台不受 Chromium 定时器节流影响），
        // 新消息原生直接响铃+震动，再经 window.__onNativeMsg 回调更新角标；H5 不再重复轮询避免双响。
        if (window.AndroidBridge && AndroidBridge.startMsgPoll) {
            try { AndroidBridge.startMsgPoll(); } catch (e) {}
            return;
        }
        // 无原生桥（浏览器预览）：H5 轮询兜底，间隔 30s → 10s
        msgPollTimer = setInterval(pollMsgOnce, 10000);
        pollMsgOnce();
    }

    function pollMsgOnce() {
        API.indexInfo().then(function (res) {
            if (!res || res.code !== 0) return;
            var num = (res.data && res.data.msg_num != null) ? res.data.msg_num : 0;
            // 有新消息或未读未消除时响铃（首轮只记录，不打扰）
            var isNew = num > 0 && lastMsgNum >= 0 && num >= lastMsgNum;
            onMsgNum(num, isNew);
        }).catch(function () {});
    }

    // 统一未读数处理：更新角标；isNew 且不在消息页时响铃
    function onMsgNum(num, isNew) {
        updateBellBadge(num);
        if (isNew && !msgViewing && window.AndroidBridge && AndroidBridge.playMsgSound) {
            AndroidBridge.playMsgSound();
        }
        lastMsgNum = num;
    }

    // v1.1.61：原生轮询回调（声音/震动原生已按 setMsgViewing 状态负责，这里只更新角标）
    window.__onNativeMsg = function (num) {
        onMsgNum(Number(num) || 0, false);
    };

    // v1.1.61：停止原生消息轮询（退出登录/会话失效时调用）
    function stopMsgPollNative() {
        if (window.AndroidBridge && AndroidBridge.stopMsgPoll) {
            try { AndroidBridge.stopMsgPoll(); } catch (e) {}
        }
    }

    // ===== 物理返回键桥接（供原生 onKeyDown 调用，返回 true 表示已消费）=====
    function back() {
        // 子页面：点击顶部返回按钮（各子页面已绑定正确返回动作）
        var backEl = $('topbar-back-el');
        if (backEl) {
            backEl.click();
            return true;
        }
        // 详情壳：按导航栈逐级回退（栈顶=最近进入的一层）
        if (navStack.length) {
            App.detailBack();
            return true;
        }
        return false;
    }

    // ===== Tab 切换 =====
    var TITLES = { home: '首页', approve: '审批', customer: '客户', mine: '我的' };
    function switchTab(tab) {
        currentTab = tab;
        currentPageType = '';
        inDetailShell = false;
        currentReplay = null;
        navStack.length = 0;
        setMsgViewing(false); // 离开消息页恢复轮询响铃提醒
        var backEl = $('topbar-back-el');
        if (backEl) backEl.remove();
        var items = document.querySelectorAll('.tab-item');
        for (var i = 0; i < items.length; i++) {
            items[i].className = 'tab-item' + (items[i].getAttribute('data-tab') === tab ? ' active' : '');
        }
        $('topbar-title').textContent = TITLES[tab];
        var c = $('page-container');
        c.innerHTML = '';
        c.scrollTop = 0;
        if (tab === 'home') renderHome();
        else if (tab === 'approve') renderApprove();
        else if (tab === 'customer') renderCustomer();
        else if (tab === 'mine') renderMine();
        // 同步桌面多标签并存条（手机壳下 renderTabStrip 内部 isPhone() 直接 return）
        try { renderTabStrip(); } catch (e) {}
    }

    // ===== 首页 =====
    function isPhone() { return (window.DEVICE || (window.innerWidth < 820 ? 'mobile' : 'desktop')) === 'mobile'; }

    function renderHome() {
        var c = $('page-container');
        var now = new Date();
        var weekNames = ['日', '一', '二', '三', '四', '五', '六'];
        var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + weekNames[now.getDay()];
        var hour = now.getHours();
        var greet = hour < 6 ? '凌晨好' : (hour < 9 ? '早上好' : (hour < 12 ? '上午好' : (hour < 14 ? '中午好' : (hour < 18 ? '下午好' : '晚上好'))));
        var html = '';
        html += '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title" id="home-greet">' + greet + '，' + esc(myDisplayName()) + '</div>' +
            '<div class="dt-toolbar-sub">' + dateStr + ' · 优品OA ' + (isPhone() ? '手机版' : '电脑版') + '</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<span class="oa-btn primary" onclick="App.openApproveType()">' + ic('plus-circle') + '发起审批</span>' +
            '</div></div>';
        if (isPhone()) { renderHomeMobile(html); return; }
        // ===== 桌面版：仪表盘（KPI 真实统计 + 待办表格 + 紧凑侧栏，无应用抽屉） =====
        html += '<div class="dt-kpi" id="home-kpi">' +
            '<div class="dt-kpi-card" onclick="App.switchTab(\'approve\')"><div class="dt-kpi-ic" style="background:#EEF4FF;color:#1E6FFF">' + ic('check-circle') + '</div><div><div class="dt-kpi-num" id="kpi-ap">…</div><div class="dt-kpi-label">待我审批</div></div></div>' +
            '<div class="dt-kpi-card" onclick="App.showSubPage(\'order-handle\')"><div class="dt-kpi-ic" style="background:#FDF6EC;color:#E6A23C">' + ic('wrench') + '</div><div><div class="dt-kpi-num" id="kpi-ord">…</div><div class="dt-kpi-label">待处理订单</div></div></div>' +
            '<div class="dt-kpi-card" onclick="App.showSubPage(\'message-inbox\')"><div class="dt-kpi-ic" style="background:#EDF9E6;color:#52C41A">' + ic('mail') + '</div><div><div class="dt-kpi-num" id="kpi-msg">…</div><div class="dt-kpi-label">未读消息</div></div></div>' +
            '<div class="dt-kpi-card" onclick="App.switchTab(\'approve\')"><div class="dt-kpi-ic" style="background:#F9F0FF;color:#722ED1">' + ic('clipboard-check') + '</div><div><div class="dt-kpi-num" id="kpi-my">…</div><div class="dt-kpi-label">我的申请</div></div></div>' +
            '</div>';
        html += '<div class="dt-cols-wide">';
        // 左栏：真实待办（异步加载）
        html += '<div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('check-circle') + '</span>待审审批<span class="pt-count" id="todo-ap-count">…</span></div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.switchTab(\'approve\')">审批中心 ›</span></div></div>' +
            '<div id="todo-ap"><div class="loading">加载中…</div></div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('mail') + '</span>最新消息<span class="pt-count" id="todo-msg-count">…</span></div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.showSubPage(\'message-inbox\')">消息中心 ›</span></div></div>' +
            '<div id="todo-msg"><div class="loading">加载中…</div></div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('wrench') + '</span>待处理订单<span class="pt-count" id="todo-ord-count">…</span></div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.showSubPage(\'order-handle\')">订单处理 ›</span></div></div>' +
            '<div id="todo-ord"><div class="loading">加载中…</div></div></div>';
        html += '</div>';
        // 右栏：快捷审批（紧凑按钮组）+ 常用功能
        html += '<div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('clipboard-check') + '</span>快捷审批</div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.openApproveType()">全部类型 ›</span></div></div>' +
            '<div class="dt-panel-body"><div class="dt-quick">';
        for (var i = 0; i < APPROVE_TYPES.length; i++) {
            var at = APPROVE_TYPES[i];
            html += '<div class="dt-quick-btn" onclick="App.launchApprove(' + at.type + ')">' + ic(EMOJI_MAP[at.icon] || 'clipboard-check') + at.name + '</div>';
        }
        html += '</div></div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('layers') + '</span>常用功能</div></div><div class="dt-panel-body"><div class="dt-quick">';
        var quickEntries = [
            { name: '客户列表', icon: 'users', run: "App.switchTab('customer')" },
            { name: '订单处理', icon: 'wrench', run: "App.openMobile('order-handle')" },
            { name: '消息中心', icon: 'mail', run: "App.openMobile('message-inbox')" },
            { name: '通讯录', icon: 'book', run: "App.openMobile('mail')" },
            { name: '工作台', icon: 'layers', run: 'App.openWorkbench()' },
            { name: '产品管理', icon: 'flask', run: "App.openMobile('product')" }
        ];
        for (var q = 0; q < quickEntries.length; q++) {
            var e = quickEntries[q];
            html += '<div class="dt-quick-btn" onclick="' + e.run + '">' + ic(e.icon) + e.name + '</div>';
        }
        html += '</div></div></div>';
        html += '</div></div>';
        c.innerHTML = html;
        loadHomeTodos();
        loadHomeKpi();
    }

    // ===== 手机版首页：App 原生风（待办卡 + 快捷宫格 + 应用中心，宫格是手机原生 pattern） =====
    function renderHomeMobile(headHtml) {
        var c = $('page-container');
        var html = headHtml;
        html += '<div class="m-todo-grid">' +
            '<div class="m-todo-card" onclick="App.switchTab(\'approve\')"><div class="m-todo-ic" style="background:#EEF4FF;color:#1E6FFF">' + ic('check-circle') + '</div><div><div class="m-todo-num" id="kpi-ap">…</div><div class="m-todo-label">待我审批</div></div></div>' +
            '<div class="m-todo-card" onclick="App.showSubPage(\'order-handle\')"><div class="m-todo-ic" style="background:#FDF6EC;color:#E6A23C">' + ic('wrench') + '</div><div><div class="m-todo-num" id="kpi-ord">…</div><div class="m-todo-label">待处理订单</div></div></div>' +
            '<div class="m-todo-card" onclick="App.showSubPage(\'message-inbox\')"><div class="m-todo-ic" style="background:#EDF9E6;color:#52C41A">' + ic('mail') + '</div><div><div class="m-todo-num" id="kpi-msg">…</div><div class="m-todo-label">未读消息</div></div></div>' +
            '</div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('check-circle') + '</span>待审审批<span class="pt-count" id="todo-ap-count">…</span></div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.switchTab(\'approve\')">更多 ›</span></div></div>' +
            '<div id="todo-ap"><div class="loading">加载中…</div></div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('mail') + '</span>最新消息<span class="pt-count" id="todo-msg-count">…</span></div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.showSubPage(\'message-inbox\')">更多 ›</span></div></div>' +
            '<div id="todo-msg"><div class="loading">加载中…</div></div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('wrench') + '</span>待处理订单<span class="pt-count" id="todo-ord-count">…</span></div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.showSubPage(\'order-handle\')">更多 ›</span></div></div>' +
            '<div id="todo-ord"><div class="loading">加载中…</div></div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('clipboard-check') + '</span>快捷审批</div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.openApproveType()">全部 ›</span></div></div>' +
            '<div class="dt-panel-body"><div class="dt-app-grid">';
        for (var i = 0; i < APPROVE_TYPES.length; i++) {
            var at = APPROVE_TYPES[i];
            html += '<div class="dt-app" onclick="App.launchApprove(' + at.type + ')"><div class="dt-app-ico" style="background:#EEF4FF;color:#1E6FFF">' + ic(EMOJI_MAP[at.icon] || 'clipboard-check') + '</div><div class="dt-app-name">' + at.name + '</div></div>';
        }
        html += '</div></div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title"><span class="pt-ic">' + ic('layers') + '</span>应用中心</div></div><div class="dt-panel-body"><div class="dt-app-grid">';
        var entries = [
            { name: '企业公告', icon: 'megaphone', run: "App.openMobile('note')", bg: '#FDF6EC', fg: '#D9480F' },
            { name: '问答知识', icon: 'message-circle', run: "App.openMobile('article')", bg: '#EEF4FF', fg: '#1E6FFF' },
            { name: 'AI问答', icon: 'bot', run: 'App.openAiChat()', bg: '#F9F0FF', fg: '#722ED1' },
            { name: '产品管理', icon: 'flask', run: "App.openMobile('product')", bg: '#EDF9E6', fg: '#52C41A' },
            { name: '附件管理', icon: 'folder', run: "App.openMobile('files')", bg: '#FDF6EC', fg: '#E6A23C' },
            { name: '消息中心', icon: 'mail', run: "App.openMobile('message-inbox')", bg: '#EEF4FF', fg: '#1E6FFF' },
            { name: '通讯录', icon: 'book', run: "App.openMobile('mail')", bg: '#EEF4FF', fg: '#1E6FFF' },
            { name: '客户列表', icon: 'users', run: "App.switchTab('customer')", bg: '#EDF9E6', fg: '#52C41A' },
            { name: '工作台', icon: 'layers', run: 'App.openWorkbench()', bg: '#F7F8FA', fg: '#4E5969' },
            { name: '预存款', icon: 'wallet', run: "App.openMobile('finance-advance')", bg: '#F9F0FF', fg: '#722ED1' },
            { name: '抵扣券', icon: 'ticket', run: "App.openMobile('deduction')", bg: '#FFF1F0', fg: '#F53F3F' },
            { name: '保证金', icon: 'shield', run: "App.openMobile('margin')", bg: '#EDF9E6', fg: '#52C41A' },
            { name: '发票申请', icon: 'receipt', run: "App.openMobile('invoice-my')", bg: '#FDF6EC', fg: '#E6A23C' },
            { name: '发票处理', icon: 'archive', run: "App.openMobile('invoice-handle')", bg: '#F5F6F8', fg: '#4E5969' },
            { name: '到账（发票）', icon: 'file-text', run: "App.openMobile('finance-income')", bg: '#EEF4FF', fg: '#1E6FFF' },
            { name: '到账（订单）', icon: 'trending-up', run: "App.openMobile('finance-order')", bg: '#EDF9E6', fg: '#52C41A' },
            { name: '订单到账处理', icon: 'settings', run: "App.openMobile('orderapply-handle')", bg: '#F7F8FA', fg: '#4E5969' },
            { name: '客户联系人', icon: 'user-plus', run: "App.openMobile('contact-list')", bg: '#EEF4FF', fg: '#1E6FFF' },
            { name: '销售机会', icon: 'target', run: "App.openMobile('chance-list')", bg: '#FFF1F0', fg: '#F53F3F' },
            { name: '跟进记录', icon: 'clipboard', run: "App.openMobile('trace-list')", bg: '#EEF4FF', fg: '#1E6FFF' },
            { name: '我的订单', icon: 'package', run: "App.openMobile('order-my')", bg: '#FDF6EC', fg: '#E6A23C' },
            { name: '订单处理', icon: 'wrench', run: "App.openMobile('order-handle')", bg: '#F9F0FF', fg: '#722ED1' },
            { name: '平台订单', icon: 'shopping-cart', run: "App.openMobile('platform-order')", bg: '#ECFEFF', fg: '#0891B2' },
            { name: '样本管理', icon: 'droplets', run: "App.openMobile('sample')", bg: '#EEF4FF', fg: '#1E6FFF' },
            { name: '校展管理', icon: 'graduation-cap', run: "App.openMobile('school')", bg: '#F9F0FF', fg: '#722ED1' },
            { name: '售后管理', icon: 'headphones', run: "App.openMobile('after')", bg: '#FDF6EC', fg: '#D9480F' },
            { name: '新增客户', icon: 'user-plus', run: "App.openMobile('customer-add')", bg: '#EDF9E6', fg: '#52C41A' }
        ];
        for (var j2 = 0; j2 < entries.length; j2++) {
            var e = entries[j2];
            html += '<div class="dt-app" onclick="' + e.run + '"><div class="dt-app-ico" style="background:' + e.bg + ';color:' + e.fg + '">' + ic(e.icon) + '</div><div class="dt-app-name">' + e.name + '</div></div>';
        }
        html += '</div></div></div>';
        c.innerHTML = html;
        loadHomeTodos();
        loadHomeKpi();
    }

    // v5 首页 KPI：真实总数（列表接口 limit=1 取 count 字段，不造假）
    function loadHomeKpi() {
        function setNum(id, n) { var el = $(id); if (el) el.textContent = (n == null ? '—' : (n > 99 ? '99+' : String(n))); }
        API.approveList(1, 1, 1).then(function (res) { setNum('kpi-ap', res && res.code === 0 ? (res.count || 0) : null); }).catch(function () { setNum('kpi-ap', null); });
        API.orderHandleList(1, 1, '').then(function (res) { setNum('kpi-ord', res && res.code === 0 ? (res.count || 0) : null); }).catch(function () { setNum('kpi-ord', null); });
        API.messageList('inbox', 1, 1).then(function (res) { setNum('kpi-msg', res && res.code === 0 ? (res.count || 0) : null); }).catch(function () { setNum('kpi-msg', null); });
        API.approveList(1, 1, '').then(function (res) { setNum('kpi-my', res && res.code === 0 ? (res.count || 0) : null); }).catch(function () { setNum('kpi-my', null); });
    }

    // 首页待办：真实数据（待审审批/最新消息/待处理订单各取前 5 条）
    function loadHomeTodos() {
        function row(iconName, title, sub, click) {
            return '<div class="menu-item" onclick="' + click + '">' +
                '<span class="mi-left"><span class="mli-ic">' + ic(iconName) + '</span>' +
                '<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(title) + '</span></span>' +
                '<span class="mi-right">' + esc(sub || '') + '</span></div>';
        }
        function panel(boxId, countId, rows, mkRow, emptyText) {
            var box = $(boxId), cnt = $(countId);
            if (!box) return;
            if (cnt) cnt.textContent = rows.length ? (rows.length >= 5 ? '5+' : String(rows.length)) : '0';
            if (!rows.length) { box.innerHTML = '<div class="empty">' + emptyText + '</div>'; return; }
            var h = '<div class="menu-list">';
            for (var i = 0; i < rows.length; i++) h += mkRow(rows[i]);
            box.innerHTML = h + '</div>';
        }
        API.approveList(1, 5, 1).then(function (res) {
            var rows = (res && res.code === 0 && res.data) || [];
            panel('todo-ap', 'todo-ap-count', rows, function (r) {
                return row('clock', r.name || r.content || '审批', fmtTime(r.create_time || r.detail_time || r.start_time), 'App.openApproveDetail(' + r.id + ')');
            }, '暂无待审审批');
        }).catch(function () { var b = $('todo-ap'); if (b) b.innerHTML = '<div class="empty retry">加载失败，点击重试</div>'; });
        API.messageList('inbox', 1, 5).then(function (res) {
            var rows = (res && res.code === 0 && res.data) || [];
            panel('todo-msg', 'todo-msg-count', rows, function (r) {
                return row('mail', r.title || '（无主题）', fmtTime(r.send_time || r.create_time), 'App.openMsgDetail(' + r.id + ')');
            }, '暂无新消息');
        }).catch(function () { var b = $('todo-msg'); if (b) b.innerHTML = '<div class="empty retry">加载失败，点击重试</div>'; });
        API.orderHandleList(1, 5, '').then(function (res) {
            var rows = (res && res.code === 0 && res.data) || [];
            panel('todo-ord', 'todo-ord-count', rows, function (r) {
                return row('package', r.title || r.code || r.order_code || '订单', fmtTime(r.create_time || r.deal_time || r.time), 'App.openOrderDetail(' + r.id + ',' + "'handle'" + ')');
            }, '暂无待处理订单');
        }).catch(function () { var b = $('todo-ord'); if (b) b.innerHTML = '<div class="empty retry">加载失败，点击重试</div>'; });
    }

    function launchApprove(type, from) { approveFrom = (from === 'type') ? 'type' : 'home'; openApproveForm(type); }
    function openEntry(path) { openOa(path); }
    function openAiChat() { openUrl('https://oichat.upingbio.cn'); }

    // ===== 移动端子页面（公告/问答/产品/附件/财务/消息/客户子功能）=====
    var MOBILE_TITLES = {
        note: '企业公告', article: '问答知识', product: '产品管理',
        files: '附件管理', 'finance-order': '到账（订单）',
        'finance-advance': '预存款', 'finance-income': '到账（发票）',
        'deduction': '抵扣券（我申请的）', 'deduction-checked': '抵扣券（管理专用）',
        'margin': '保证金', 'invoice-my': '发票（我申请的）', 'invoice-handle': '发票（我处理的）',
        'orderapply-handle': '到账（订单·我处理的）',
        'message-inbox': '收件箱', 'message-sendbox': '发件箱', 'message-draft': '草稿箱', 'message-rubbish': '回收站',
        'mail': '通讯录', 'profile': '基本资料', 'password': '修改密码',
        'contact-list': '客户联系人', 'chance-list': '销售机会', 'trace-list': '跟进记录',
        'order-my': '订单（我申请的）', 'order-handle': '订单（我处理的）',
        'platform-order': '平台订单',
        'sample': '样本管理', 'school': '校展管理', 'after': '售后管理', 'customer-add': '新增客户'
    };
    var mobileBack = { type: 'home' }; // 返回目标

    function showSubPage(type) {
        currentPageType = type;
        inDetailShell = false;
        currentReplay = function () { showSubPage(type); }; // 刷新/重试只重放当前子页
        navStack.length = 0;
        mobileBack.type = currentTab || 'home'; // 从哪个主Tab进入，返回就回哪个Tab
        setMsgViewing(type === 'message-inbox' || type === 'message-sendbox' || type === 'message-draft' || type === 'message-rubbish');
        var c = $('page-container');
        $('topbar-title').textContent = MOBILE_TITLES[type] || '功能';
        $('topbar-title').parentElement.style.display = 'flex';
        var backBtn = document.createElement('div');
        backBtn.className = 'topbar-back';
        backBtn.textContent = '‹ 返回';
        backBtn.onclick = function () { App.switchTab(mobileBack.type); };
        var old = $('topbar-back-el');
        if (old) old.remove();
        backBtn.id = 'topbar-back-el';
        $('topbar-title').parentElement.insertBefore(backBtn, $('topbar-title'));
        c.innerHTML = '';
        if (type === 'note') renderNotePage();
        else if (type === 'article') renderArticlePage();
        else if (type === 'product') renderProductPage();
        else if (type === 'files') renderFilesPage();
        else if (type === 'finance-order') renderFinanceOrderPage();
        else if (type === 'finance-advance') renderFinanceAdvancePage();
        else if (type === 'finance-income') renderFinanceIncomePage();
        else if (type === 'deduction') renderFinanceDeductionPage();
        else if (type === 'deduction-checked') renderFinanceDeductionCheckedPage();
        else if (type === 'margin') renderFinanceMarginPage();
        else if (type === 'invoice-my') renderFinanceInvoiceMyPage();
        else if (type === 'invoice-handle') renderFinanceInvoiceHandlePage();
        else if (type === 'orderapply-handle') renderFinanceOrderApplyHandlePage();
        else if (type === 'message-inbox' || type === 'message-sendbox' || type === 'message-draft' || type === 'message-rubbish') renderMessagePage(type);
        else if (type === 'mail') renderMailPage();
        else if (type === 'profile') renderProfilePage();
        else if (type === 'password') renderPasswordPage();
        else if (type === 'contact-list') renderContactListPage();
        else if (type === 'chance-list') renderChanceListPage();
        else if (type === 'trace-list') renderTraceListPage();
        else if (type === 'order-my') renderOrderMyPage();
        else if (type === 'order-handle') renderOrderHandlePage();
        else if (type === 'platform-order') renderPlatformOrderPage();
        else if (type === 'sample') renderSamplePage();
        else if (type === 'school') renderSchoolPage();
        else if (type === 'after') renderAfterPage();
        else if (type === 'customer-add') renderCustomerAddPage();
        deEmoji(c);
        // 同步桌面多标签并存条
        try { renderTabStrip(); } catch (e) {}
    }

    function openMobile(type) { showSubPage(type); }

    // 加载失败重试：重进当前子页面/重放当前Tab，重置各 listState 重新加载
    function reloadPage() {
        // v1.1.56：只重放"当前页"——详情/表单/工作台等页面各自登记了重放函数，
        // 刷新后仍停在当前页，绝不跳回来源列表或其它子页面。
        if (typeof currentReplay === 'function') { currentReplay(); return; }
        if (currentPageType) { showSubPage(currentPageType); return; }
        App.switchTab(currentTab || 'home');
    }

    // ===== 通用详情页框架 =====
    var lastBackFn = null;
    function showDetailShell(title, backFn) {
        inDetailShell = true;
        mobileBack.type = currentTab || 'home';
        lastBackFn = backFn || function () { App.switchTab(currentTab || 'home'); };
        navStack.push(lastBackFn); // v1.1.56：入栈，返回时逐级回退（不再覆盖丢失上层）
        $('topbar-title').textContent = title || '详情';
        $('topbar-title').parentElement.style.display = 'flex';
        var backBtn = document.createElement('div');
        backBtn.className = 'topbar-back';
        backBtn.textContent = '‹ 返回';
        backBtn.onclick = function () { App.detailBack(); };
        var old = $('topbar-back-el');
        if (old) old.remove();
        backBtn.id = 'topbar-back-el';
        $('topbar-title').parentElement.insertBefore(backBtn, $('topbar-title'));
        $('page-container').innerHTML = '';
        setTimeout(function () { deEmoji($('page-container')); }, 0);
    }

    // v1.1.56：详情/表单壳层统一返回（弹栈逐级回退），返回按钮与物理返回键共用同一逻辑
    function detailBack() {
        if (navStack.length) {
            var fn = navStack.pop();
            lastBackFn = navStack.length ? navStack[navStack.length - 1] : null;
            if (typeof fn === 'function') { fn(); return; }
        }
        App.switchTab(currentTab || 'home');
    }

    // ===== 发起审批（移动端类型选择页）=====
    function openApproveType() {
        regReplay(function () { App.openApproveType(); });
        inDetailShell = false;
        navStack.length = 0;
        mobileBack.type = currentTab || 'home';
        $('topbar-title').textContent = '发起审批';
        $('topbar-title').parentElement.style.display = 'flex';
        var backBtn = document.createElement('div');
        backBtn.className = 'topbar-back';
        backBtn.textContent = '‹ 返回';
        backBtn.onclick = function () { App.switchTab('home'); };
        var old = $('topbar-back-el');
        if (old) old.remove();
        backBtn.id = 'topbar-back-el';
        $('topbar-title').parentElement.insertBefore(backBtn, $('topbar-title'));
        var c = $('page-container');
        var html = '<div class="search-bar" style="margin-bottom:4px;"><input id="approve-kw" type="text" placeholder="搜索审批类型" oninput="App.filterApproveType()"><span class="search-btn" onclick="App.filterApproveType()">搜索</span></div>';
        html += '<div id="approve-type-list">';
        for (var i = 0; i < APPROVE_TYPES.length; i++) {
            var at = APPROVE_TYPES[i];
            html += '<div class="menu-item" data-name="' + esc(at.name) + '" onclick="App.launchApprove(' + at.type + ',\'type\')"><span class="mi-left">' + at.icon + ' ' + esc(at.name) + '</span><span class="mi-right">›</span></div>';
        }
        html += '</div>';
        c.innerHTML = html;
        deEmoji(c);
    }
    function filterApproveType() {
        var kw = ($('approve-kw') || {}).value || '';
        var items = document.querySelectorAll('#approve-type-list .menu-item');
        for (var i = 0; i < items.length; i++) {
            var show = !kw || items[i].getAttribute('data-name').indexOf(kw) >= 0;
            items[i].style.display = show ? 'flex' : 'none';
        }
    }

    // ===== 发起审批（移动端动态表单）=====
    var formState = null; // 当前表单状态
    var approveFrom = 'home'; // 表单来源：home=首页直接进入 / type=类型选择页进入
    function openApproveForm(type) {
        regReplay(function () { App.openApproveForm(type); });
        inDetailShell = false;
        navStack.length = 0;
        var meta = APPROVE_FORMS && APPROVE_FORMS[type];
        if (!meta) { toast('该审批类型暂不支持手机发起'); return; }
        mobileBack.type = currentTab || 'home';
        $('topbar-title').textContent = meta.title || ('审批表单' + type);
        $('topbar-title').parentElement.style.display = 'flex';
        var backBtn = document.createElement('div');
        backBtn.className = 'topbar-back';
        backBtn.textContent = '‹ 返回';
        backBtn.onclick = function () { if (approveFrom === 'type') { App.openApproveType(); } else { App.switchTab('home'); } };
        var old = $('topbar-back-el');
        if (old) old.remove();
        backBtn.id = 'topbar-back-el';
        $('topbar-title').parentElement.insertBefore(backBtn, $('topbar-title'));
        var c = $('page-container');
        var html = '';
        // 时段映射（date 字段关联的 _span 字段）
        var spanMap = {};
        for (var si = 0; si < meta.fields.length; si++) {
            var sf = meta.fields[si];
            if (sf.type === 'select' && sf.key.indexOf('_span') > 0) {
                var baseKey = sf.key.replace('_span', '');
                spanMap[baseKey] = { spanKey: sf.key, options: sf.options };
            }
        }
        // 渲染普通字段（跳过特殊字段）
        for (var i = 0; i < meta.fields.length; i++) {
            var f = meta.fields[i];
            if (f.type === 'hidden' || f.key === 'file_ids' || f.key === 'flow_id' ||
                f.key.indexOf('check_admin') === 0 || f.key.indexOf('copy_') === 0 ||
                f.key.indexOf('_span') > 0) continue;
            html += formFieldHtml(f, spanMap);
        }
        // 附件：官网表单带 file_ids 字段的类型，手机上直接上传（选择文件 / 拍照）
        var hasFileField = false;
        for (var fi2 = 0; fi2 < meta.fields.length; fi2++) {
            if (meta.fields[fi2].key === 'file_ids') { hasFileField = true; break; }
        }
        if (hasFileField) html += approveAttachHtml();
        // 审批流程
        var flowSel = '', hasFlow = false;
        for (var j = 0; j < meta.fields.length; j++) {
            if (meta.fields[j].key === 'flow_id' && meta.fields[j].type === 'select') {
                hasFlow = true;
                var opts = meta.fields[j].options;
                flowSel = '<div class="form-card"><div class="form-row"><div class="form-label req">审批流程</div><select class="form-control" id="ff-flow" onchange="App.onFlowChange()"><option value="">请选择审批流程</option>';
                for (var k = 0; k < opts.length; k++) {
                    flowSel += '<option value="' + esc(opts[k].v) + '">' + esc(opts[k].t) + '</option>';
                }
                flowSel += '</select></div></div>';
            }
        }
        html += flowSel;
        // 审核人/抄送人占位
        html += '<div class="form-card" id="ff-people"><div class="form-flow-box"><div class="form-flow-line">选择审批流程后加载审核人与抄送人</div></div></div>';
        html += '<button class="form-submit" id="ff-submit" onclick="App.submitApproveForm(' + type + ')">提 交 申 请</button>';
        c.innerHTML = html;
        formState = { type: type, fields: {}, spanMap: spanMap, flowId: '', checkIds: [], checkNames: [], copyIds: [], copyNames: [], files: [] };
        if (hasFlow) onFlowChange();
    }

    // ===== v1.1.62 审批表单附件上传（与官网 oaTool.addFile 同契约：POST /api/index/upload，id 逗号拼接进 file_ids）=====
    var APPROVE_FILE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'pdf', 'zip', 'rar', '7z', 'txt', 'wps', 'mp4'];
    var APPROVE_FILE_MAX = 10 * 1024 * 1024; // 10MB（base64 过桥上限，取稳妥值）
    // 文件类型徽标：颜色 + 文案（对齐常见办公文件视觉习惯）
    var FILE_TYPE_MAP = {
        pdf: { c: '#F53F3F', t: 'PDF' },
        doc: { c: '#2B579A', t: 'DOC' }, docx: { c: '#2B579A', t: 'DOC' },
        xls: { c: '#217346', t: 'XLS' }, xlsx: { c: '#217346', t: 'XLS' },
        ppt: { c: '#D24726', t: 'PPT' }, pptx: { c: '#D24726', t: 'PPT' },
        png: { c: '#722ED1', t: '图片' }, jpg: { c: '#722ED1', t: '图片' }, jpeg: { c: '#722ED1', t: '图片' }, gif: { c: '#722ED1', t: '图片' },
        zip: { c: '#B4884D', t: 'ZIP' }, rar: { c: '#B4884D', t: 'RAR' }, '7z': { c: '#B4884D', t: '7Z' },
        txt: { c: '#86909C', t: 'TXT' }, wps: { c: '#1E6FFF', t: 'WPS' },
        mp4: { c: '#D91E7A', t: 'MP4' }
    };
    function fileTypeInfo(name) {
        var ext = (String(name || '').split('.').pop() || '').toLowerCase();
        return FILE_TYPE_MAP[ext] || { c: '#C9CDD4', t: (ext || 'FILE').toUpperCase().slice(0, 4) };
    }
    // 通用选文件：动态创建 input 主动 click（label+display:none 在部分 Android WebView 上点击无反应，弃用）
    function pickFile(handler, accept, multiple, capture) {
        // ===== v1.1.63：原生通道优先 =====
        // WebView 的 <input type="file"> 点击后需要宿主实现 onShowFileChooser 才会弹系统选择器；
        // 且 label+display:none 的委托点击在部分 WebView 上失效——表现为"点击无反应、无法跳转"。
        // 因此有原生桥时直接由原生跳转 ACTION_GET_CONTENT / 相机，Uri → base64 回传，完全可控。
        if (window.AndroidBridge && AndroidBridge.pickFiles) {
            var p = capture ? API.pickCameraNative() : API.pickFilesNative(accept, multiple);
            p.then(function (res) {
                if (!res) { toast('未选择文件'); return; }
                if (res.err) { toast(res.err); return; }
                var skipped = res.skipped || [];
                for (var si = 0; si < skipped.length; si++) toast('文件超过10MB：' + skipped[si]);
                var list = res.files || [];
                if (list.length) { try { handler(list); } catch (e) {} }
            }).catch(function () { toast('打开文件选择器失败'); });
            return;
        }
        // ===== 无原生桥（桌面浏览器预览）：动态创建 input 主动 click =====
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.multiple = !!multiple;
        if (accept) inp.setAttribute('accept', accept);
        if (capture) inp.setAttribute('capture', 'environment');
        // 注意：不能用 display:none（部分 WebView 会拦截程序化 click），用移出屏幕 + 透明
        inp.style.position = 'fixed';
        inp.style.left = '-9999px';
        inp.style.top = '0';
        inp.style.width = '1px';
        inp.style.height = '1px';
        inp.style.opacity = '0';
        inp.onchange = function () {
            var fs = inp.files;
            if (fs && fs.length) {
                var arr = [];
                for (var i = 0; i < fs.length; i++) arr.push(fs[i]);
                filesToRaw(arr, handler);
            }
            setTimeout(function () { if (inp.parentNode) inp.parentNode.removeChild(inp); }, 1000);
        };
        document.body.appendChild(inp);
        try { inp.click(); } catch (e) { toast('无法打开文件选择器，请检查权限'); }
    }
    // File 对象数组 → {name,b64,size} 数组（仅预览兜底路径使用）
    function filesToRaw(files, cb) {
        var out = [], left = files.length;
        if (!left) { cb([]); return; }
        for (var i = 0; i < files.length; i++) {
            (function (f) {
                var reader = new FileReader();
                reader.onload = function () {
                    var b64 = String(reader.result || '');
                    var idx = b64.indexOf(',');
                    out.push({ name: f.name, size: f.size, b64: idx >= 0 ? b64.slice(idx + 1) : '' });
                    if (--left === 0) cb(out);
                };
                reader.onerror = function () { if (--left === 0) cb(out); };
                reader.readAsDataURL(f);
            })(files[i]);
        }
    }
    function approveAttachHtml() {
        return '<div class="form-card"><div class="form-row att-row">' +
            '<div class="form-label">附件</div>' +
            '<div class="att-btns">' +
            '<div class="att-btn att-btn-main" onclick="App.pickApproveFile(false)">＋ 选择文件</div>' +
            '<div class="att-btn att-btn-ghost" onclick="App.pickApproveFile(true)">📷 拍照</div>' +
            '</div></div>' +
            '<div class="att-wrap"><div id="att-list"></div>' +
            '<div class="form-hint att-hint">支持图片 / PDF / Office / 压缩包等，单个文件请小于 10MB</div></div></div>';
    }
    function pickApproveFile(camera) {
        pickFile(onApprovePicked, camera ? 'image/*' : '*/*', camera ? false : true, camera);
    }
    // 统一入口：{name,b64,size} 数组（原生桥 / 预览兜底都汇到这里）
    function onApprovePicked(list) {
        if (!list || !list.length || !formState) return;
        for (var i = 0; i < list.length; i++) uploadApproveRaw(list[i].name, list[i].b64, list[i].size);
    }
    // 兼容旧调用：File 对象数组
    function onApproveFiles(files) {
        if (!files || !files.length || !formState) return;
        filesToRaw(files, onApprovePicked);
    }
    function uploadApproveRaw(name, b64, size) {
        name = String(name || 'file');
        var ext = (name.split('.').pop() || '').toLowerCase();
        if (APPROVE_FILE_EXTS.indexOf(ext) < 0) { toast('不支持的格式：' + name); return; }
        if (!b64) { toast('文件为空：' + name); return; }
        if (Number(size) > APPROVE_FILE_MAX) { toast('文件过大（>10MB）：' + name); return; }
        var item = { id: 0, name: name, size: Number(size) || 0, uploading: true, err: '', b64: b64 };
        formState.files.push(item);
        renderAttachList();
        API.uploadFileBase64(b64, name, '/api/index/upload', 'file').then(function (res) {
            item.uploading = false;
            if (res && res.code === 0 && res.data && res.data.id) {
                item.id = res.data.id;
                toast('已上传：' + item.name);
            } else {
                item.err = (res && res.msg) || '上传失败';
            }
            renderAttachList();
        }).catch(function () {
            item.uploading = false; item.err = '网络异常'; renderAttachList();
        });
    }
    function renderAttachList() {
        var box = $('att-list');
        if (!box || !formState) return;
        var html = '';
        for (var i = 0; i < formState.files.length; i++) {
            var f = formState.files[i];
            var ft = fileTypeInfo(f.name);
            var st = f.uploading ? '<span class="att-st att-st-up">上传中<span class="att-dot"><i></i><i></i><i></i></span></span>'
                : (f.err ? '<span class="att-st att-st-err" onclick="App.retryApproveFile(' + i + ')">' + esc(f.err) + ' · 点击重试</span>'
                    : '<span class="att-st att-st-ok">✓ 已上传 · ' + fmtSize(f.size) + '</span>');
            html += '<div class="att-item' + (f.err ? ' att-err' : '') + '">' +
                '<div class="att-ft" style="background:' + ft.c + '">' + esc(ft.t) + '</div>' +
                '<div class="att-body"><div class="att-name">' + esc(f.name) + '</div>' + st + '</div>' +
                '<div class="att-del" onclick="App.removeApproveFile(' + i + ')">✕</div></div>';
        }
        box.innerHTML = html;
    }
    function retryApproveFile(i) {
        if (!formState || !formState.files[i]) return;
        var f = formState.files[i];
        if (f.uploading) return;
        formState.files.splice(i, 1);
        renderAttachList();
        uploadApproveRaw(f.name, f.b64, f.size);
    }
    function removeApproveFile(i) {
        if (!formState || !formState.files[i]) return;
        if (formState.files[i].uploading) { toast('上传中，请稍候'); return; }
        formState.files.splice(i, 1);
        renderAttachList();
    }

    function formFieldHtml(f, spanMap) {
        var html = '<div class="form-card"><div class="form-row">';
        html += '<div class="form-label req">' + esc(f.label || f.key) + '</div>';
        if (f.type === 'select') {
            html += '<select class="form-control" data-key="' + esc(f.key) + '"><option value="">请选择</option>';
            for (var i = 0; i < f.options.length; i++) {
                html += '<option value="' + esc(f.options[i].v) + '">' + esc(f.options[i].t) + '</option>';
            }
            html += '</select>';
        } else if (f.type === 'textarea') {
            html += '<textarea class="form-textarea" data-key="' + esc(f.key) + '" placeholder="请输入' + esc(f.label) + '"></textarea>';
        } else if (f.type === 'datetime') {
            var sp = spanMap && spanMap[f.key];
            if (sp) {
                html += '<div class="datetime-inline"><input type="date" data-key="' + esc(f.key) + '" data-half="date" style="padding:14px 0;"><select data-key="' + esc(sp.spanKey) + '" data-span="1" style="flex:1;border:none;outline:none;font-size:14px;background:transparent;color:#333;padding:14px 0;"><option value="">时段</option>';
                for (var di = 0; di < sp.options.length; di++) {
                    html += '<option value="' + esc(sp.options[di].v) + '">' + esc(sp.options[di].t) + '</option>';
                }
                html += '</select></div>';
            } else {
                html += '<div class="datetime-inline"><input type="date" data-key="' + esc(f.key) + '" data-half="date" style="padding:14px 0;"><input type="time" data-key="' + esc(f.key) + '" data-half="time" style="width:90px;flex:0 0 auto;"></div>';
            }
        } else {
            html += '<input class="form-control" data-key="' + esc(f.key) + '" type="text" placeholder="请输入' + esc(f.label) + '">';
        }
        html += '</div></div>';
        return html;
    }

    function onFlowChange() {
        var sel = $('ff-flow');
        if (!sel) return;
        var flowId = sel.value;
        formState.flowId = flowId;
        var box = $('ff-people');
        if (!box) return;
        if (!flowId) {
            box.innerHTML = '<div class="form-flow-box"><div class="form-flow-line">请先选择审批流程</div></div>';
            return;
        }
        box.innerHTML = '<div class="form-flow-box"><div class="loading">加载审批人…</div></div>';
        API.flowUsers(flowId).then(function (res) {
            if (!res || res.code !== 0 || !res.data) {
                box.innerHTML = '<div class="form-flow-box"><div class="form-flow-line">审批人加载失败</div></div>';
                return;
            }
            var d = res.data;
            var html = '';
            // 抄送人：官网 get_flow_users 返回 copy_uids/copy_unames 为逗号字符串（非数组）
            var copyIds = String(d.copy_uids == null ? '' : d.copy_uids).split(',').filter(function (x) { return x !== ''; }).map(Number);
            var copyNames = String(d.copy_unames == null ? '' : d.copy_unames).split(',').filter(function (x) { return x !== ''; });
            formState.copyIds = copyIds;
            formState.copyNames = copyNames;
            if (copyIds.length) {
                html += '<div class="chip-label">抄送人</div><div class="form-flow-line">' + esc(copyNames.join('、')) + '</div>';
            }
            // 审核步骤：官网 flow_data[].user_id_info 才是审批人集合；flow_type 1=当前部门负责人 2=上级部门负责人（自动指定，无需选人）
            var steps = d.flow_data || d.step_data || [];
            if (!steps.length) {
                html += '<div class="chip-label">审核人</div><div class="form-flow-line">该流程未配置审核人，请确认</div>';
            }
            for (var i = 0; i < steps.length; i++) {
                var st = steps[i];
                var stepName = st.flow_name || ('第' + (i + 1) + '级审核');
                var stepType = parseInt(st.flow_type, 10);
                if (stepType === 1 || stepType === 2) {
                    html += '<div class="chip-label">' + esc(stepName) + '</div><div class="form-flow-line">' +
                        (stepType === 1 ? '当前部门负责人（系统自动指定）' : '上级部门负责人（系统自动指定）') + '</div>';
                    continue;
                }
                var users = st.user_id_info || [];
                if (typeof users === 'string') users = [];
                html += '<div class="chip-label">' + esc(stepName) + '</div><div class="person-grid" data-step="' + i + '">';
                if (!users.length) {
                    html += '<div class="form-flow-line">未配置可选人员</div>';
                }
                for (var u = 0; u < users.length; u++) {
                    var uid = Number(users[u].id);
                    var uname = users[u].name || users[u].user_name || ('用户' + uid);
                    html += '<div class="person-chip" data-uid="' + uid + '" data-name="' + esc(uname) + '" onclick="App.toggleCheck(this,' + uid + ')">' + esc(uname) + '</div>';
                }
                html += '</div>';
            }
            box.innerHTML = '<div class="form-flow-box">' + html + '</div>';
            // 默认选中第一个可用人
            var firstChip = box.querySelector('.person-chip');
            if (firstChip) toggleCheck(firstChip, Number(firstChip.getAttribute('data-uid')));
        }).catch(function () {
            $('ff-people').innerHTML = '<div class="form-flow-box"><div class="form-flow-line">审批人加载失败</div></div>';
        });
    }

    function toggleCheck(chip, uid) {
        if (!chip) return;
        var on = chip.className.indexOf('sel') >= 0;
        // 同级单选
        var box = chip.parentNode;
        var chips = box.querySelectorAll('.person-chip');
        for (var i = 0; i < chips.length; i++) chips[i].className = chips[i].className.replace(' sel', '');
        if (!on) {
            chip.className += ' sel';
        }
        refreshCheckState();
    }

    function refreshCheckState() {
        var ids = [], names = [];
        var chips = document.querySelectorAll('.person-chip.sel');
        for (var i = 0; i < chips.length; i++) {
            ids.push(Number(chips[i].getAttribute('data-uid')));
            names.push(chips[i].getAttribute('data-name'));
        }
        formState.checkIds = ids;
        formState.checkNames = names;
    }

    function submitApproveForm(type) {
        var meta = APPROVE_FORMS[type];
        if (!meta) return;
        // 收集字段
        var data = { type: type, id: 0 };
        var fields = document.querySelectorAll('#page-container [data-key]');
        for (var i = 0; i < fields.length; i++) {
            var el = fields[i];
            var key = el.getAttribute('data-key');
            var half = el.getAttribute('data-half');
            if (half === 'date' || half === 'time') {
                var pair = formState.fields[key] = formState.fields[key] || { date: '', time: '' };
                pair[half] = el.value;
                data[key] = '';
            } else {
                data[key] = el.value;
            }
        }
        // 合并 datetime（有时段映射的只填日期，时段单独提交）
        for (var k in formState.fields) {
            var p = formState.fields[k];
            var hasSpan = formState.spanMap && formState.spanMap[k];
            if (p.date) data[k] = hasSpan ? p.date : (p.date + (p.time ? ' ' + p.time : ''));
        }
        // 必填校验（简化：关键字段）
        var keyFields = {};
        for (var j = 0; j < meta.fields.length; j++) {
            var f = meta.fields[j];
            if (f.type !== 'hidden' && f.key !== 'file_ids' && f.key !== 'flow_id' &&
                f.key.indexOf('check_admin') !== 0 && f.key.indexOf('copy_') !== 0 &&
                f.key !== 'duration' && f.key !== 'remark') {
                keyFields[f.key] = f.label;
            }
        }
        for (var kk in keyFields) {
            var v = data[kk];
            if (v === undefined || v === null || v === '' || (String(kk).indexOf('_span') > 0 && v === '0')) {
                toast('请填写' + keyFields[kk]);
                return;
            }
        }
        if (!formState.flowId) { toast('请选择审批流程'); return; }
        data.flow_id = formState.flowId;
        if (!formState.checkIds.length) { toast('请选择审核人'); return; }
        data.check_admin_ids = formState.checkIds.join(',');
        data.check_admin_name = formState.checkNames.join(',');
        if (formState.copyIds.length) {
            data.copy_uids = formState.copyIds.join(',');
            data.copy_names = formState.copyNames.join(',');
        }
        // 时长字段自动计算
        if (data.start_time && data.end_time) {
            var sp1 = formState.spanMap && formState.spanMap['start_time'] ? data.start_time_span : null;
            var sp2 = formState.spanMap && formState.spanMap['end_time'] ? data.end_time_span : null;
            var t1 = new Date(data.start_time.replace(/-/g, '/')).getTime();
            var t2 = new Date(data.end_time.replace(/-/g, '/')).getTime();
            var hours = null;
            if (sp1 && sp2 && !isNaN(Number(sp1)) && !isNaN(Number(sp2))) {
                // 半小时档位（1=0:00, 2=0:30...）
                hours = ((Number(sp2) - Number(sp1)) / 2) + Math.round((t2 - t1) / 86400000) * 24;
            } else if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
                hours = Math.round((t2 - t1) / 3600000 * 10) / 10;
            }
            if (hours !== null && hours >= 0) data.duration = hours;
        }
        var btn = $('ff-submit');
        // v1.1.62：附件 id 汇总（仅上传成功的）；上传中/有失败项先阻止提交
        var okIds = [], failCnt = 0, upCnt = 0;
        for (var ai = 0; ai < formState.files.length; ai++) {
            var af = formState.files[ai];
            if (af.uploading) upCnt++;
            else if (af.err) failCnt++;
            else if (af.id) okIds.push(af.id);
        }
        if (upCnt) { toast('附件上传中，请稍候'); return; }
        if (failCnt) { toast('有附件上传失败，请点击重试或删除'); return; }
        if (okIds.length) data.file_ids = okIds.join(',');
        btn.disabled = true;
        btn.textContent = '提交中…';
        API.approveSubmit(data).then(function (res) {
            if (res && res.code === 0) {
                toast('提交成功');
                App.switchTab('approve');
                renderApprove();
            } else {
                toast((res && res.msg) || '提交失败');
                btn.disabled = false;
                btn.textContent = '提 交 申 请';
            }
        }).catch(function () {
            toast('网络异常，提交失败');
            btn.disabled = false;
            btn.textContent = '提 交 申 请';
        });
    }

    // ===== 工作台（移动端聚合页）=====
    var wbApproveRows = {}, wbNoteRows = {};
    function openWorkbench() {
        regReplay(function () { App.openWorkbench(); });
        inDetailShell = false;
        navStack.length = 0;
        mobileBack.type = currentTab || 'home';
        $('topbar-title').textContent = '工作台';
        $('topbar-title').parentElement.style.display = 'flex';
        var backBtn = document.createElement('div');
        backBtn.className = 'topbar-back';
        backBtn.textContent = '‹ 返回';
        backBtn.onclick = function () { App.switchTab('home'); };
        var old = $('topbar-back-el');
        if (old) old.remove();
        backBtn.id = 'topbar-back-el';
        $('topbar-title').parentElement.insertBefore(backBtn, $('topbar-title'));
        var c = $('page-container');
        c.innerHTML = '<div class="section-title">待我审批</div><div id="wb-approve"></div>' +
            '<div class="section-title">最新公告</div><div id="wb-note"></div>';
        var st = listState.wbApprove = { page: 1, loading: false, done: false };
        API.approveList(1, 10, 1).then(function (res) {
            var el = $('wb-approve');
            if (!el) return;
            if (!res || res.code !== 0 || !res.data || !res.data.length) {
                el.innerHTML = '<div class="empty">暂无待审批</div>';
                return;
            }
            var html = '';
            for (var i = 0; i < res.data.length; i++) {
                var r = res.data[i];
                wbApproveRows[r.id] = r;
                html += '<div class="card" onclick="App.openApproveDetail(' + r.id + ')">' +
                    '<div class="card-title">' + esc(r.content || '审批') + '</div>' +
                    '<div class="card-line">' + esc(r.user || '') + ' · ' + fmtTime(r.create_time) + '</div>' +
                    '</div>';
            }
            el.innerHTML = html;
        }).catch(function () {
            $('wb-approve').innerHTML = '<div class="empty retry">加载失败，点击重试</div>';
        });
        API.noteList(1, 5).then(function (res) {
            var el = $('wb-note');
            if (!el) return;
            if (!res || res.code !== 0 || !res.data || !res.data.length) {
                el.innerHTML = '<div class="empty">暂无公告</div>';
                return;
            }
            var html = '';
            for (var i = 0; i < res.data.length; i++) {
                var r = res.data[i];
                wbNoteRows[r.id] = r;
                html += '<div class="card" onclick="App.openNoteDetail(' + r.id + ')">' +
                    '<div class="card-title">' + plain(r.title || '') + '</div>' +
                    '<div class="card-line">' + fmtTime(r.create_time) + '</div>' +
                    '</div>';
            }
            el.innerHTML = html;
        }).catch(function () {
            $('wb-note').innerHTML = '<div class="empty retry">加载失败，点击重试</div>';
        });
    }

    // ===== 企业公告 =====
    function renderNotePage() {
        markListPage('note');
        var c = $('page-container');
        var shell = isPhone() ? '' :
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">企业公告</div>' +
            '<div class="dt-toolbar-sub">公司发布的通知与动态</div>' +
            '</div></div>';
        c.innerHTML = shell + '<div id="note-list"></div>';
        listState.note = { page: 1, loading: false, done: false, rows: {} };
        loadNote();
    }
    function loadNote() {
        var st = listState.note;
        if (st.loading || st.done) return;
        st.loading = true;
        var el = $('note-list');
        if (!el) return;
        if (el) el.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.noteList(st.page, 15).then(function (res) {
            var el2 = $('note-list');
            if (!el2) return;
            if (!res || res.code !== 0) { el2.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { el2.innerHTML = '<div class="empty">暂无公告</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var phone = isPhone();
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card" onclick="App.openNoteDetail(' + r.id + ')">' +
                    '<div class="card-title">' + plain(r.title || '') + '</div>' +
                    '<div class="card-line"><span class="tag tag-pass">' + esc(r.cate_title || '公告') + '</span>　' + fmtTime(r.create_time) + '</div>' +
                    '</div>';
                } else {
                    html += '<tr class="tr-click" onclick="App.openNoteDetail(' + r.id + ')">' +
                    '<td><div class="td-strong">' + plain(r.title || '') + '</div></td>' +
                    '<td>' + esc(r.cate_title || '公告') + '</td>' +
                    '<td>' + esc(r.user || '-') + '</td>' +
                    '<td>' + fmtTime(r.create_time) + '</td>' +
                    '</tr>';
                }
            }
            el2.innerHTML = phone ? html : (DT_HEAD.note + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 15;
            if (!st.done) el2.insertAdjacentHTML('beforeend', App.moreBtn('note'));
            if (!isPhone()) App.updatePagerDom('note', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            $('note-list').innerHTML = '<div class="empty retry">网络异常，点击重试</div>';
            st.loading = false;
        });
    }
    function openNoteDetail(id) {
        regReplay(function () { App.openNoteDetail(id); });
        var r = (listState.note && listState.note.rows && listState.note.rows[id]) || (wbNoteRows || {})[id];
        if (!r) { toast('详情未加载，请返回列表刷新'); return; }
        showDetailShell(r.title || '公告详情', function () { App.openMobile('note'); });
        var c = $('page-container');
        c.innerHTML = '<div class="detail-head"><div class="dh-title">' + plain(r.title || '') + '</div><div class="dh-sub"><span class="tag tag-pass">' + esc(r.cate_title || '公告') + '</span>　' + fmtTime(r.create_time) + (r.user ? '　' + esc(r.user) : '') + '</div></div>' +
            '<div class="detail-content">' + (r.content || '<div class="empty">暂无内容</div>') + '</div>';
    }

    // ===== 问答知识 =====
    function renderArticlePage() {
        markListPage('article');
        var c = $('page-container');
        var shell = isPhone() ? '' :
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">问答知识</div>' +
            '<div class="dt-toolbar-sub">产品与应用常见问题库</div>' +
            '</div></div>';
        c.innerHTML = shell + '<div id="article-list"></div>';
        listState.article = { page: 1, loading: false, done: false, rows: {} };
        loadArticle();
    }
    function loadArticle() {
        var st = listState.article;
        if (st.loading || st.done) return;
        st.loading = true;
        var el = $('article-list');
        if (!el) return;
        if (el) el.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.articleList(st.page, 15).then(function (res) {
            var el2 = $('article-list');
            if (!el2) return;
            if (!res || res.code !== 0) { el2.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { el2.innerHTML = '<div class="empty">暂无内容</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var phone = isPhone();
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                var title = (r.title || '').split('\n')[0];
                if (phone) {
                    html += '<div class="card" onclick="App.openArticleDetail(' + r.id + ')">' +
                    '<div class="card-title">' + plain(title) + '</div>' +
                    '<div class="card-line"><span class="tag tag-pass">' + esc(r.cate_title || '问答') + '</span>　' + esc(r.user || '') + '</div>' +
                    '<div class="card-line">' + fmtTime(r.create_time) + '</div>' +
                    '</div>';
                } else {
                    html += '<tr class="tr-click" onclick="App.openArticleDetail(' + r.id + ')">' +
                    '<td><div class="td-strong">' + plain(title) + '</div></td>' +
                    '<td>' + esc(r.cate_title || '问答') + '</td>' +
                    '<td>' + esc(r.user || '-') + '</td>' +
                    '<td>' + fmtTime(r.create_time) + '</td>' +
                    '</tr>';
                }
            }
            el2.innerHTML = phone ? html : (DT_HEAD.article + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 15;
            if (!st.done) el2.insertAdjacentHTML('beforeend', App.moreBtn('article'));
            if (!isPhone()) App.updatePagerDom('article', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            $('article-list').innerHTML = '<div class="empty retry">网络异常，点击重试</div>';
            st.loading = false;
        });
    }
    function openArticleDetail(id) {
        regReplay(function () { App.openArticleDetail(id); });
        var r = (listState.article && listState.article.rows && listState.article.rows[id]);
        if (!r) { toast('详情未加载，请返回列表刷新'); return; }
        var title = (r.title || '').split('\n')[0];
        showDetailShell(title || '问答详情', function () { App.openMobile('article'); });
        var c = $('page-container');
        c.innerHTML = '<div class="detail-head"><div class="dh-title">' + plain(title) + '</div><div class="dh-sub"><span class="tag tag-pass">' + esc(r.cate_title || '问答') + '</span>　' + esc(r.user || '') + '　' + fmtTime(r.create_time) + '</div></div>' +
            '<div class="detail-content">' + (r.content || '<div class="empty">暂无内容</div>') + '</div>';
    }

    // ===== 产品管理 =====
    function renderProductPage() {
        markListPage('product');
        var c = $('page-container');
        var phone = isPhone();
        var head = phone
            ? '<div class="fav-entry" onclick="App.openFavCenter()"><span class="fav-entry-icon">📚</span><span>说明书收藏夹</span><span class="mi-right">›</span></div>' +
            '<div class="search-bar"><input id="prod-kw" type="text" placeholder="搜索货号/别称/基因名/标题/代码"><span class="search-btn" onclick="App.loadProduct()">搜索</span></div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">产品管理</div>' +
            '<div class="dt-toolbar-sub">按货号 / 别称 / 基因名检索，组合筛选种属、应用与分类</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="prod-kw" type="text" placeholder="搜索货号/别称/基因名/标题/代码"><button class="dt-search-btn" onclick="App.loadProduct()">搜索</button></div>' +
            '<span class="oa-btn" onclick="App.openFavCenter()">📚 说明书收藏夹</span>' +
            '</div></div>';
        c.innerHTML = head +
            '<div class="prod-filter" id="prod-filter">' +
            '<div class="pf-title">产品筛选</div>' +
            '<div class="pf-cate-trigger" onclick="App.toggleCatePanel()"><span id="pf-cate-label">请选择产品分类</span><span class="pf-cate-arrow">▾</span></div>' +
            '<input type="hidden" id="pf-cate" value="">' +
            '<div class="cate-chips" id="cate-chips"></div>' +
            '<input id="pf-species" class="form-input" type="text" placeholder="种属（如 Mouse/Human）">' +
            '<input id="pf-application" class="form-input" type="text" placeholder="应用（如 WB/IHC）">' +
            '<select id="pf-status" class="form-input" onchange="App.loadProduct()"><option value="">状态不限</option><option value="1">有货</option><option value="0">下架</option></select>' +
            '<input id="pf-product_name" class="form-input" type="text" placeholder="产品标题">' +
            '<input id="pf-gene_name" class="form-input" type="text" placeholder="基因名称">' +
            '<input id="pf-other_name" class="form-input" type="text" placeholder="其他别称">' +
            '<div class="pf-btns">' +
            '<span class="act-btn" onclick="App.loadProduct()">筛选</span>' +
            '<span class="act-btn pf-reset" onclick="App.resetProductFilter()">清空</span>' +
            '</div>' +
            '</div>' +
            '<div id="product-list"></div>';
        listState.product = { page: 1, loading: false, done: false, kw: '', fKey: '', filters: {}, rows: {} };
        ensureCatePanel();
        loadProduct();
        // 异步加载产品分类树
        API.productCateTree().then(function (cats) {
            if (!cats || !cats.length) return;
            if (!window.__cateState) window.__cateState = { tree: [], sel: {}, exp: {} };
            var st = window.__cateState;
            st.tree = cats;
            updateCateLabel();
        }).catch(function () {});
    }
    function ensureCatePanel() {
        if ($('cate-panel')) return;
        var d = document.createElement('div');
        d.innerHTML = '<div class="cate-mask" id="cate-mask" style="display:none" onclick="App.hideCatePanel()"></div>' +
            '<div class="cate-panel" id="cate-panel" style="display:none">' +
            '<div class="cate-panel-head"><span class="cate-title">产品分类</span><span class="cate-close" onclick="App.hideCatePanel()">×</span></div>' +
            '<input id="pf-cate-search" class="form-input" placeholder="搜索分类" oninput="App.renderCateTree()">' +
            '<div class="cate-tree" id="cate-tree"></div>' +
            '<div class="cate-panel-foot">' +
            '<span class="act-btn pf-reset" onclick="App.cateClearAll()">清空</span>' +
            '<span class="act-btn cate-btn-all" onclick="App.cateSelectAll()">全选</span>' +
            '<span class="act-btn apply" id="cate-apply" onclick="App.applyCate()">确定（已选 <span id="cate-count">0</span> 项）</span>' +
            '</div>' +
            '</div>';
        document.body.appendChild(d);
    }
    function toggleCatePanel() {
        var p = $('cate-panel'), m = $('cate-mask');
        if (!p || !m) return;
        if (p.style.display === 'none') {
            p.style.display = 'flex'; m.style.display = 'block';
            renderCateTree();
            setTimeout(function () { p.classList.add('open'); }, 20);
        } else hideCatePanel();
    }
    function hideCatePanel() {
        var p = $('cate-panel'), m = $('cate-mask');
        if (p) { p.classList.remove('open'); p.style.display = 'none'; }
        if (m) m.style.display = 'none';
    }
    function applyCate() {
        hideCatePanel();
        loadProduct();
    }
    function renderCateTree() {
        var box = $('cate-tree');
        if (!box) return;
        if (!box || !window.__cateState) return;
        var st = window.__cateState;
        var kw = (($('pf-cate-search') || {}).value || '').trim().toLowerCase();
        box.innerHTML = buildCateHtml(st.tree, 0, kw);
        var inds = box.querySelectorAll('input[data-ind="1"]');
        for (var i = 0; i < inds.length; i++) inds[i].indeterminate = true;
    }
    function buildCateHtml(nodes, depth, kw) {
        var st = window.__cateState || { exp: {} };
        var html = '';
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (!n || n.id == null) continue;
            var title = n.title || '';
            var hasChild = n.children && n.children.length;
            var selfHit = kw === '' || title.toLowerCase().indexOf(kw) >= 0;
            var childHtml = '';
            if (hasChild) childHtml = buildCateHtml(n.children, depth + 1, kw);
            var childHit = kw !== '' && childHtml !== '';
            if (kw !== '' && !selfHit && !childHit) continue;
            var selState = cateSelState(n);
            var checked = selState === 'all' ? ' checked' : '';
            var ind = selState === 'some' ? ' data-ind="1"' : '';
            var expanded = kw !== '' || st.exp[n.id];
            var arrow = hasChild ? '<span class="cate-arrow' + (expanded ? ' open' : '') + '" onclick="event.stopPropagation();App.cateToggle(' + n.id + ')">' + (expanded ? '▾' : '▸') + '</span>' : '<span class="cate-arrow-placeholder"></span>';
            var kids = (hasChild && expanded) ? '<div class="cate-children">' + childHtml + '</div>' : '';
            html += '<div class="cate-row" style="padding-left:' + (depth * 16 + 4) + 'px">' + arrow +
                '<label class="cate-check"><input type="checkbox" value="' + n.id + '"' + checked + ind + ' onchange="App.cateCheck(' + n.id + ', this.checked)"><span>' + esc(title) + '</span></label></div>' + kids;
        }
        return html;
    }
    function cateToggle(id) {
        if (!window.__cateState) return;
        var st = window.__cateState;
        if (st.exp[id]) delete st.exp[id]; else st.exp[id] = 1;
        renderCateTree();
    }
    function findCateNode(nodes, id) {
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (!n || n.id == null) continue;
            if (n.id === id) return n;
            if (n.children && n.children.length) {
                var r = findCateNode(n.children, id);
                if (r) return r;
            }
        }
        return null;
    }
    function collectCateLeaves(nodes, out) {
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (!n || n.id == null) continue;
            if (n.children && n.children.length) collectCateLeaves(n.children, out);
            else out.push(n.id);
        }
    }
    function cateSelState(n) {
        var st = window.__cateState;
        var leaves = [];
        collectCateLeaves([n], leaves);
        if (!leaves.length) return 'none';
        var c = 0;
        for (var i = 0; i < leaves.length; i++) if (st.sel[leaves[i]]) c++;
        if (c === 0) return 'none';
        if (c === leaves.length) return 'all';
        return 'some';
    }
    function cateCheck(id, checked) {
        if (!window.__cateState) return;
        var st = window.__cateState;
        var node = findCateNode(st.tree, id);
        if (!node) return;
        var leaves = [];
        collectCateLeaves([node], leaves);
        for (var i = 0; i < leaves.length; i++) {
            if (checked) st.sel[leaves[i]] = 1; else delete st.sel[leaves[i]];
        }
        updateCateLabel();
        renderCateTree();
    }
    function cateSelectAll() {
        if (!window.__cateState) return;
        var st = window.__cateState;
        var leaves = [];
        collectCateLeaves(st.tree, leaves);
        for (var i = 0; i < leaves.length; i++) st.sel[leaves[i]] = 1;
        updateCateLabel();
        renderCateTree();
    }
    function cateClearAll() {
        if (!window.__cateState) return;
        var st = window.__cateState;
        st.sel = {};
        updateCateLabel();
        renderCateTree();
    }
    function collectCateIds(nodes, sel, on) {
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (!n || n.id == null) continue;
            if (on) sel[n.id] = 1;
            if (n.children && n.children.length) collectCateIds(n.children, sel, on);
        }
    }
    function updateCateLabel() {
        var lab = $('pf-cate-label'), hid = $('pf-cate'), chipsBox = $('cate-chips'), cnt = $('cate-count');
        if (!lab || !hid || !window.__cateState) return;
        var st = window.__cateState;
        var names = [];
        var ids = [];
        (function walk(nodes) {
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                if (!n || n.id == null) continue;
                if (st.sel[n.id]) { ids.push(n.id); names.push(n.title || ''); }
                if (n.children && n.children.length) walk(n.children);
            }
        })(st.tree);
        hid.value = ids.join(',');
        if (!ids.length) lab.textContent = '请选择产品分类';
        else if (names.length <= 3) lab.textContent = names.join('、');
        else lab.textContent = names.slice(0, 3).join('、') + '等' + names.length + '项';
        if (chipsBox) {
            var h = '';
            var shown = names.length > 3 ? 3 : names.length;
            for (var i = 0; i < shown; i++) {
                h += '<span class="cate-chip">' + esc(names[i]) + '<i onclick="event.stopPropagation();App.cateRemove(' + ids[i] + ')">×</i></span>';
            }
            if (names.length > 3) h += '<span class="cate-chip-more">+ ' + (names.length - 3) + '项</span>';
            chipsBox.innerHTML = h;
        }
        if (cnt) cnt.textContent = ids.length;
    }
    function cateRemove(id) {
        if (!window.__cateState) return;
        delete window.__cateState.sel[id];
        updateCateLabel();
        renderCateTree();
        loadProduct();
    }
    function flattenCates(nodes, depth, out) {
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (!n || n.id == null) continue;
            out.push({ id: n.id, title: (depth > 0 ? new Array(depth).join('　') + '└ ' : '') + (n.title || '') });
            if (n.children && n.children.length) flattenCates(n.children, depth + 1, out);
        }
    }
    function collectProductFilters() {
        var f = {};
        var v;
        v = $('pf-cate') ? $('pf-cate').value : '';
        if (v) f.cate_id = v;
        v = $('pf-type') ? $('pf-type').value : '';
        if (v) f.type = v;
        v = $('pf-status') ? $('pf-status').value : '';
        if (v !== '') f.status = v;
        v = $('pf-species') ? $('pf-species').value.trim() : '';
        if (v) f.species = v;
        v = $('pf-application') ? $('pf-application').value.trim() : '';
        if (v) f.application = v;
        v = $('pf-product_name') ? $('pf-product_name').value.trim() : '';
        if (v) f.product_name = v;
        v = $('pf-gene_name') ? $('pf-gene_name').value.trim() : '';
        if (v) f.gene_name = v;
        v = $('pf-other_name') ? $('pf-other_name').value.trim() : '';
        if (v) f.other_name = v;
        return f;
    }
    function resetProductFilter() {
        if ($('pf-cate')) $('pf-cate').value = '';
        if ($('pf-cate-label')) $('pf-cate-label').textContent = '请选择产品分类';
        if (window.__cateState) { window.__cateState.sel = {}; window.__cateState.exp = {}; }
        if ($('pf-cate-search')) $('pf-cate-search').value = '';
        if ($('cate-panel')) $('cate-panel').style.display = 'none';
        if ($('pf-type')) $('pf-type').value = '';
        if ($('pf-status')) $('pf-status').value = '';
        if ($('pf-species')) $('pf-species').value = '';
        if ($('pf-application')) $('pf-application').value = '';
        if ($('pf-product_name')) $('pf-product_name').value = '';
        if ($('pf-gene_name')) $('pf-gene_name').value = '';
        if ($('pf-other_name')) $('pf-other_name').value = '';
        App.loadProduct();
    }
    function loadProduct() {
        currentLoadKey = 'product'; currentLoadArg = null;
        var st = listState.product;
        if (!st) st = listState.product = { page: 1, loading: false, done: false, kw: '', fKey: '', filters: {}, rows: {} };
        var kw = ($('prod-kw') || {}).value || '';
        var filters = collectProductFilters();
        var fKey = JSON.stringify(filters);
        if (kw !== st.kw || fKey !== st.fKey) { st.page = 1; st.done = false; st.kw = kw; st.fKey = fKey; st.filters = filters; st.rows = {}; st.loading = false; var el0 = $('product-list'); if (el0) { el0.innerHTML = ''; el0.__renderedIds = {}; } }
        if (st.loading || st.done) return;
        st.loading = true;
        if (!listState.productSeq) listState.productSeq = 0;
        var mySeq = ++listState.productSeq;
        var el = $('product-list');
        if (!el) return;
        // v1.1.73：loading 去重，避免自动连续加载时多个“加载中”叠加
        var olds = el.querySelectorAll('.loading');
        for (var oi = 0; oi < olds.length; oi++) { if (olds[oi].parentNode) olds[oi].parentNode.removeChild(olds[oi]); }
        el.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.productList(st.page, 15, st.kw, st.filters).then(function (res) {
            if (mySeq !== listState.productSeq) return; // 已有更新的搜索请求，丢弃本次旧结果
            var el2 = $('product-list');
            if (!el2) return;
            var lds = el2.querySelectorAll('.loading');
            for (var li = 0; li < lds.length; li++) { if (lds[li].parentNode) lds[li].parentNode.removeChild(lds[li]); }
            if (!res || res.code !== 0) {
                st.done = false; st.loading = false;
                if (!el2.querySelector('.card')) {
                    el2.innerHTML = '<div class="empty retry" onclick="App.loadProduct()">' + esc((res && res.msg) || '加载失败') + '，点击重试</div>';
                } else {
                    if (el2) el2.insertAdjacentHTML('beforeend', '<div class="empty retry" onclick="App.loadProduct()">加载失败：' + esc((res && res.msg) || '网络异常') + '，点击重试</div>');
                }
                return;
            }
            var rows = res.data || [];
            if (!rows.length) {
                st.done = true; st.loading = false;
                var lm2 = el2.querySelector('.load-more'); if (lm2) lm2.parentNode.removeChild(lm2);
                if (!el2.querySelector('.card')) el2.innerHTML = '<div class="empty">暂无产品</div>';
                else el2.insertAdjacentHTML('beforeend', '<div class="empty">没有更多了</div>');
                return;
            }
            // v1.1.73：增量追加渲染——只插入新卡片，不再整页 innerHTML 重建
            // （旧逻辑每次加载都整体重建列表 DOM，自动连续加载时页面持续抖动/跳动）
            var rendered = el2.__renderedIds || (el2.__renderedIds = {});
            var addHtml = '';
            for (var i = 0; i < rows.length; i++) {
                var r0 = rows[i];
                st.rows[r0.id] = r0;
                if (rendered[r0.id]) continue;
                rendered[r0.id] = 1;
                addHtml += '<div class="card" onclick="App.openProductDetail(' + r0.id + ')">' +
                '<div class="card-title">' + plain(r0.title || '') + '</div>' +
                // v1.1.73：货号全部显示（旧逻辑 slice(0,2) 只显示前 2 个，真实产品普遍有 3~5 个货号）
                (r0.goods_no ? '<div class="card-line">货号：' + esc(String(r0.goods_no).split(';').filter(function (x) { return x.trim(); }).join('；')) + '</div>' : '') +
                (r0.price_desc ? '<div class="card-line">' + esc(r0.price_desc) + '</div>' : '') +
                (r0.application ? '<div class="card-line">应用：' + esc(String(r0.application).split(';').join('；')) + '</div>' : '') +
                '<div class="card-line">' + (r0.goods_no_list && r0.goods_no_list.length ? '<span class="tag tag-manual">含说明书</span> ' : '') + '<span class="tag tag-pass">' + esc(r0.cate_title || '') + '</span>　' + fmtTime(r0.create_time) + '</div>' +
                '</div>';
            }
            if (addHtml) el2.insertAdjacentHTML('beforeend', addHtml);
            st.page++;
            st.loading = false;
            st.done = rows.length < 15;
            // 默认直出100条：初次进入自动连续加载，直到累计满100条或没有更多数据（触底仍可继续加载）
            // v1.1.73：增量渲染后连续加载不再整页重建，页面不再抖动；加载间隔 300ms → 250ms 保持流畅
            if (!st.done && Object.keys(st.rows).length < 100 && !st.autoBulk) {
                st.autoBulk = true;
                setTimeout(function () { st.autoBulk = false; App.loadProduct(); }, 250);
            }
        }).catch(function () {
            if (mySeq !== listState.productSeq) return; // 已被更新的请求取代，丢弃
            st.loading = false;
            var el3 = $('product-list');
            if (!el3) return;
            var ld3s = el3.querySelectorAll('.loading');
            for (var l3 = 0; l3 < ld3s.length; l3++) { if (ld3s[l3].parentNode) ld3s[l3].parentNode.removeChild(ld3s[l3]); }
            if (!el3.querySelector('.card')) {
                el3.innerHTML = '<div class="empty retry" onclick="App.loadProduct()">网络异常，点击重试</div>';
            } else {
                if (el3) el3.insertAdjacentHTML('beforeend', '<div class="empty retry" onclick="App.loadProduct()">网络异常，点击重试</div>');
            }
        });
    }
    function openProductDetail(id) {
        regReplay(function () { App.openProductDetail(id); });
        var r = (listState.product && listState.product.rows && listState.product.rows[id]);
        if (!r) { toast('详情未加载，请返回列表刷新'); return; }
        showDetailShell(plain(r.title) || '产品详情', function () { App.openMobile('product'); });
        var c = $('page-container');
        var faved = App.isProductFav(id);
        var html = '<div class="detail-head"><div class="dh-title">' + plain(r.title || '') + '</div>';
        if (r.cate_title) html += '<div class="dh-sub"><span class="tag tag-pass">' + esc(r.cate_title) + '</span>　' + fmtTime(r.create_time) + '</div>';
        html += '</div>';
        html += '<div class="detail-actions"><button class="dbtn' + (faved ? ' dbtn-on' : '') + '" onclick="App.toggleProductFav(' + id + ')">' + (faved ? '★ 已收藏' : '☆ 收藏产品') + '</button></div>';
        var rows = [
            // v1.1.73：货号全量显示，分隔符统一中文分号
            ['货号', r.goods_no ? String(r.goods_no).split(';').filter(function (x) { return x.trim(); }).join('；') : ''], ['报价', r.price_desc], ['规格', r.specs], ['单位', r.unit],
            ['品种', r.species], ['应用场景', r.application], ['方法学', r.methodology], ['品牌', r.brand], ['库存', r.stock]
        ];
        for (var i = 0; i < rows.length; i++) {
            if (!rows[i][1]) continue;
            html += '<div class="detail-card"><div class="dc-label">' + rows[i][0] + '</div><div class="dc-value">' + esc(rows[i][1]) + '</div></div>';
        }
        if (r.goods_no_list && r.goods_no_list.length) {
            html += '<div class="detail-card"><div class="dc-label">说明书预览</div>';
            for (var gi = 0; gi < r.goods_no_list.length; gi++) {
                var g = r.goods_no_list[gi];
                if (!g.goods_no_url && !g.pc_goods_no_url) continue;
                html += '<div class="doc-row"><span class="doc-name">' + esc(g.goods_no) + '</span>' +
                    '<span class="doc-actions">' +
                    '<button class="mini-btn" onclick="App.previewDoc(' + gi + ',' + id + ')">预览</button>' +
                    '<button class="mini-btn mini-blue" onclick="App.showFolderPicker(' + gi + ',' + id + ')">收藏</button>' +
                    '<button class="mini-btn mini-green" onclick="App.shareDoc(' + gi + ',' + id + ')">转发</button>' +
                    '</span></div>';
            }
            html += '</div>';
        }
        if (r.content) html += '<div class="detail-card"><div class="dc-label">产品详情</div><div class="dc-value">' + r.content + '</div></div>';
        c.innerHTML = html;
    }

    // ===== 产品收藏与说明书收藏夹 =====
    function getProdFavs() {
        try { return JSON.parse(localStorage.getItem('uping_prod_favs') || '[]'); } catch (e) { return []; }
    }
    function saveProdFavs(arr) { localStorage.setItem('uping_prod_favs', JSON.stringify(arr)); }
    function isProductFav(id) { return getProdFavs().indexOf(String(id)) >= 0; }
    function toggleProductFav(id) {
        var favs = getProdFavs();
        var idx = favs.indexOf(String(id));
        if (idx >= 0) { favs.splice(idx, 1); toast('已取消收藏'); }
        else { favs.push(String(id)); toast('已收藏产品'); }
        saveProdFavs(favs);
        App.openProductDetail(id);
    }
    function getFolders() {
        try { return JSON.parse(localStorage.getItem('uping_folders') || '[]'); } catch (e) { return []; }
    }
    function saveFolders(arr) { localStorage.setItem('uping_folders', JSON.stringify(arr)); }
    function getFavDocs() {
        try { return JSON.parse(localStorage.getItem('uping_fav_docs') || '[]'); } catch (e) { return []; }
    }
    function saveFavDocs(arr) { localStorage.setItem('uping_fav_docs', JSON.stringify(arr)); }
    function absUrl(u) { return OA.absUrl(u); }
    // v1.1.75：说明书「预览」改为 App 内嵌 PDF 查看器（pdf.js 渲染，效果与原件一致）；库缺失时兜底系统应用/新标签页
    function previewDoc(gi, pid) {
        var r = (listState.product && listState.product.rows && listState.product.rows[pid]);
        if (!r || !r.goods_no_list || !r.goods_no_list[gi]) { toast('数据缺失，请刷新列表'); return; }
        var g = r.goods_no_list[gi];
        var url = absUrl(g.goods_no_url || g.pc_goods_no_url);
        var name = (g.goods_no || '说明书') + '.pdf';
        if (window.PdfView) {
            try { PdfView.open(url, { title: r.title || '产品说明书', sub: (g.goods_no || '') + ' · PDF 说明书' }); }
            catch (e) { toast('预览失败：' + e.message); }
        } else if (window.AndroidBridge && AndroidBridge.openFileWith) {
            try { AndroidBridge.openFileWith(url, name); } catch (e) { toast('预览失败：' + e.message); }
        } else {
            // 无原生桥（浏览器预览）：新标签页直接打开 PDF
            try { window.open(url, '_blank'); } catch (e) { toast('预览失败'); }
        }
    }
    function openFavCenter() {
        regReplay(function () { App.openFavCenter(); });
        showDetailShell('说明书收藏夹', function () { App.openMobile('product'); });
        renderFavCenter();
    }
    function renderFavCenter() {
        regReplay(function () { App.openFavCenter(); });
        var c = $('page-container');
        var folders = getFolders();
        var html = '<div class="fav-toolbar"><button class="mini-btn" onclick="App.newFolderInline()">＋ 新建文件夹</button><button class="mini-btn mini-blue" onclick="App.packFav(\'\',\'全部说明书合集\')">打包全部</button><button class="mini-btn mini-green" onclick="App.sharePackFav(\'\')">打包转发全部</button></div>';
        html += '<div id="fav-folder-list">';
        if (!folders.length) html += '<div class="empty">还没有文件夹，先点上方“新建文件夹”</div>';
        for (var i = 0; i < folders.length; i++) {
            var docs = getFavDocs().filter(function (d) { return d.folderId === folders[i].id; });
            html += '<div class="card" onclick="App.openFolder(\'' + folders[i].id + '\')"><div class="card-title">📁 ' + esc(folders[i].name) + '</div><div class="card-line">' + docs.length + ' 份说明书</div><div class="mi-right">›</div></div>';
        }
        html += '</div>';
        c.innerHTML = html;
    }
    function newFolderInline() {
        if ($('fav-new-row')) return;
        var row = document.createElement('div');
        row.id = 'fav-new-row';
        row.className = 'fav-new-row';
        row.innerHTML = '<input id="fav-new-name" type="text" placeholder="文件夹名称（如：血氨试剂盒）" maxlength="20"><button class="mini-btn" onclick="App.createFolder()">确定</button>';
        var c = $('page-container');
        var list = $('fav-folder-list') || $('folder-list');
        if (list) list.parentNode.insertBefore(row, list);
        else c.insertBefore(row, c.firstChild);
        var inp = $('fav-new-name');
        if (inp) inp.focus();
    }
    function createFolder() {
        var inp = $('fav-new-name');
        var name = (inp ? inp.value : '').trim();
        if (!name) { toast('请输入文件夹名称'); return; }
        var folders = getFolders();
        folders.push({ id: 'f' + Date.now(), name: name });
        saveFolders(folders);
        toast('已创建文件夹');
        var c = $('page-container');
        if ($('fav-folder-list')) { App.renderFavCenter(); }
        else { renderFolderPickerList(); }
    }
    function openFolder(folderId) {
        regReplay(function () { App.openFolder(folderId); });
        var f = null;
        var folders = getFolders();
        for (var i = 0; i < folders.length; i++) if (folders[i].id === folderId) f = folders[i];
        if (!f) { toast('文件夹不存在'); return; }
        showDetailShell('📁 ' + f.name, function () { App.openFavCenter(); });
        var c = $('page-container');
        var docs = getFavDocs().filter(function (d) { return d.folderId === folderId; });
        var html = '<div class="fav-toolbar"><button class="mini-btn" onclick="App.packFav(\'' + folderId + '\',\'文件夹打包\')">打包本文件夹</button><button class="mini-btn mini-blue" onclick="App.sharePackFav(\'' + folderId + '\')">打包转发</button><button class="mini-btn mini-green" onclick="App.shareChecked(\'' + folderId + '\')">转发勾选(<span id="chk-count">0</span>)</button><button class="mini-btn mini-danger" onclick="App.delFolder(\'' + folderId + '\')">删除文件夹</button></div>';
        html += '<div id="folder-doc-list">';
        if (!docs.length) html += '<div class="empty">文件夹是空的，去产品详情里收藏说明书进来</div>';
        for (var i = 0; i < docs.length; i++) {
            var d = docs[i];
            html += '<div class="card">' +
                '<div class="card-line"><label class="fav-chk"><input type="checkbox" class="fav-check" data-idx="' + i + '" data-folder="' + folderId + '" onchange="App.updateCheckedCount(\'' + folderId + '\')"></label><span class="doc-name">' + esc(d.goodsNo) + '</span></div>' +
                '<div class="card-line">' + plain(d.title) + '</div>' +
                '<div class="card-actions"><button class="mini-btn" onclick="App.previewFavDoc(' + i + ',\'' + folderId + '\')">预览</button>' +
                    '<button class="mini-btn mini-blue" onclick="App.shareFavDoc(' + i + ',\'' + folderId + '\')">转发</button>' +
                    '<button class="mini-btn mini-danger" onclick="App.removeDoc(' + i + ',\'' + folderId + '\')">移出</button></div></div>';
        }
        html += '</div>';
        c.innerHTML = html;
    }
    // v1.1.75：收藏夹说明书「预览」同样走内嵌 PDF 查看器
    function previewFavDoc(index, folderId) {
        var docs = getFavDocs().filter(function (d) { return d.folderId === folderId; });
        var d = docs[index];
        if (!d) { toast('数据缺失'); return; }
        var name = (d.goodsNo || '说明书') + '.pdf';
        var url = absUrl(d.url);
        if (window.PdfView) {
            try { PdfView.open(url, { title: d.title || '产品说明书', sub: (d.goodsNo || '') + ' · PDF 说明书' }); }
            catch (e) { toast('预览失败：' + e.message); }
        } else if (window.AndroidBridge && AndroidBridge.openFileWith) {
            try { AndroidBridge.openFileWith(url, name); } catch (e) { toast('预览失败：' + e.message); }
        } else {
            try { window.open(url, '_blank'); } catch (e) { toast('预览失败'); }
        }
    }
    function removeDoc(index, folderId) {
        var docs = getFavDocs().filter(function (d) { return d.folderId === folderId; });
        docs.splice(index, 1);
        var all = getFavDocs().filter(function (d) { return d.folderId !== folderId; });
        for (var i = 0; i < docs.length; i++) all.push(docs[i]);
        saveFavDocs(all);
        toast('已移出');
        App.openFolder(folderId);
    }
    function delFolder(folderId) {
        uiConfirm('删除文件夹？其中收藏的说明书会一并移除（不影响已保存到本地的文件）。', function () {
            saveFolders(getFolders().filter(function (x) { return x.id !== folderId; }));
            saveFavDocs(getFavDocs().filter(function (d) { return d.folderId !== folderId; }));
            toast('已删除文件夹');
            App.openFavCenter();
        });
    }
    function showFolderPicker(gi, pid) {
        regReplay(function () { App.showFolderPicker(gi, pid); });
        var r = (listState.product && listState.product.rows && listState.product.rows[pid]);
        if (!r || !r.goods_no_list || !r.goods_no_list[gi]) { toast('数据缺失，请刷新列表'); return; }
        var g = r.goods_no_list[gi];
        showDetailShell('收藏「' + g.goods_no + '」到', function () { App.openProductDetail(pid); });
        renderFolderPickerList();
        // 记录待收藏对象
        favPick = { pid: pid, gi: gi };
    }
    var favPick = null;
    function renderFolderPickerList() {
        var c = $('page-container');
        var folders = getFolders();
        var html = '<div class="fav-toolbar"><button class="mini-btn" onclick="App.newFolderInline()">＋ 新建文件夹</button></div>';
        html += '<div id="folder-list">';
        if (!folders.length) html += '<div class="empty">还没有文件夹，先新建一个</div>';
        for (var i = 0; i < folders.length; i++) {
            html += '<div class="menu-item" onclick="App.saveDocToFolder(\'' + folders[i].id + '\')"><span class="mi-left">📁 ' + esc(folders[i].name) + '</span><span class="mi-right">›</span></div>';
        }
        html += '</div>';
        c.innerHTML = html;
    }
    function saveDocToFolder(folderId) {
        if (!favPick) { toast('请重新选择'); return; }
        var r = (listState.product && listState.product.rows && listState.product.rows[favPick.pid]);
        if (!r || !r.goods_no_list || !r.goods_no_list[favPick.gi]) { toast('数据缺失，请刷新列表'); return; }
        var g = r.goods_no_list[favPick.gi];
        var url = absUrl(g.goods_no_url || g.pc_goods_no_url);
        var docs = getFavDocs();
        var dup = false;
        for (var i = 0; i < docs.length; i++) {
            if (docs[i].folderId === folderId && docs[i].url === url) { dup = true; break; }
        }
        if (dup) { toast('该说明书已在文件夹中'); return; }
        docs.push({ id: 'd' + Date.now(), folderId: folderId, pid: favPick.pid, goodsNo: g.goods_no, title: r.title, url: url, added: Date.now() });
        saveFavDocs(docs);
        toast('已收藏到文件夹');
        App.openFavCenter();
    }
    function packFav(folderId, zipName) {
        var docs = folderId ? getFavDocs().filter(function (d) { return d.folderId === folderId; }) : getFavDocs();
        if (!docs.length) { toast('没有可打包的说明书'); return; }
        var list = [];
        for (var i = 0; i < docs.length; i++) list.push({ url: docs[i].url, name: docs[i].goodsNo + '.pdf' });
        if (window.AndroidBridge && AndroidBridge.zipFiles) {
            try {
                AndroidBridge.zipFiles(JSON.stringify(list), zipName);
                toast('开始打包 ' + docs.length + ' 份说明书，完成后在通知栏查看');
                return;
            } catch (e) {}
        }
        webZipDownload(list);
        toast('开始下载 ' + list.length + ' 份说明书（网页版逐个下载）');
    }

    // ===== 说明书转发 =====

    // 生成可读转发文件名：货号-产品标题.pdf（清洗非法字符、限长）
    function buildDocName(goodsNo, title) {
        var g = String(goodsNo || '').trim();
        var t = String(title || '').trim();
        var name = g || '说明书';
        if (t && t.indexOf(g) === -1) name = (g ? g + '-' : '') + t;
        name = name.replace(/[\\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
        if (name.length > 60) name = name.slice(0, 60);
        return (name || '说明书') + '.pdf';
    }

    // 产品详情页：单个说明书转发
    function shareDoc(gi, pid) {
        var r = (listState.product && listState.product.rows && listState.product.rows[pid]);
        if (!r || !r.goods_no_list || !r.goods_no_list[gi]) { toast('数据缺失，请刷新列表'); return; }
        var g = r.goods_no_list[gi];
        var url = absUrl(g.goods_no_url || g.pc_goods_no_url);
        var name = buildDocName(g.goods_no, r.title);
        if (window.AndroidBridge && AndroidBridge.shareFile) {
            try { AndroidBridge.shareFile(url, name); toast('正在准备转发：' + name); return; } catch (e) {}
        }
        webShare(url, name); toast('已开始下载：' + name);
    }

    // 收藏夹文件夹内：单个说明书转发
    function shareFavDoc(index, folderId) {
        var docs = getFavDocs().filter(function (d) { return d.folderId === folderId; });
        var d = docs[index];
        if (!d) { toast('数据缺失'); return; }
        var name = buildDocName(d.goodsNo, d.title);
        if (window.AndroidBridge && AndroidBridge.shareFile) {
            try { AndroidBridge.shareFile(absUrl(d.url), name); toast('正在准备转发：' + name); return; } catch (e) {}
        }
        webShare(absUrl(d.url), name); toast('已开始下载：' + name);
    }

    // 勾选数量实时更新
    function updateCheckedCount(folderId) {
        var n = document.querySelectorAll('#folder-doc-list .fav-check:checked').length;
        var el = $('chk-count');
        if (!el) return;
        if (el) el.textContent = n;
    }

    // 转发勾选：勾选多份打包 zip 后调起分享
    function shareChecked(folderId) {
        var docs = getFavDocs().filter(function (d) { return d.folderId === folderId; });
        var checks = document.querySelectorAll('#folder-doc-list .fav-check:checked');
        var list = [];
        for (var i = 0; i < checks.length; i++) {
            var idx = parseInt(checks[i].getAttribute('data-idx'), 10);
            var d = docs[idx];
            if (d) list.push({ url: absUrl(d.url), name: (d.goodsNo || '说明书') + '.pdf' });
        }
        if (!list.length) { toast('请先勾选要转发的说明书'); return; }
        if (window.AndroidBridge && AndroidBridge.shareZip) {
            try { AndroidBridge.shareZip(JSON.stringify(list), '勾选转发'); toast('正在打包并准备转发 ' + list.length + ' 份说明书'); return; } catch (e) {}
        }
        webZipDownload(list); toast('开始下载 ' + list.length + ' 份说明书（网页版逐个下载）');
    }

    // 打包转发：文件夹内全部 / 收藏夹全部，打包 zip 后直接调起分享
    function sharePackFav(folderId) {
        var docs = folderId ? getFavDocs().filter(function (d) { return d.folderId === folderId; }) : getFavDocs();
        if (!docs.length) { toast('没有可转发的说明书'); return; }
        var list = [];
        for (var i = 0; i < docs.length; i++) list.push({ url: absUrl(docs[i].url), name: buildDocName(docs[i].goodsNo, docs[i].title) });
        if (window.AndroidBridge && AndroidBridge.shareZip) {
            try { AndroidBridge.shareZip(JSON.stringify(list), folderId ? '文件夹打包' : '全部说明书合集'); toast('正在打包并准备转发 ' + docs.length + ' 份说明书'); return; } catch (e) {}
        }
        webZipDownload(list); toast('开始下载 ' + list.length + ' 份说明书（网页版逐个下载）');
    }

    // ===== 附件管理 =====
    function renderFilesPage() {
        markListPage('files');
        var c = $('page-container');
        var phone = isPhone();
        var head = phone
            ? '<div class="search-bar"><input id="file-kw" type="text" placeholder="搜索文件名"><span class="search-btn" onclick="App.loadFiles()">搜索</span></div>' +
            '<div class="files-up">' +
            '<div class="att-btn att-btn-main" onclick="App.pickFilesUpload(false)">＋ 上传文件</div>' +
            '<div class="att-btn att-btn-ghost" onclick="App.pickFilesUpload(true)">📷 拍照上传</div>' +
            '</div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">附件管理</div>' +
            '<div class="dt-toolbar-sub">上传、检索与打开公司共享附件</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="file-kw" type="text" placeholder="搜索文件名"><button class="dt-search-btn" onclick="App.loadFiles()">搜索</button></div>' +
            '<span class="oa-btn primary" onclick="App.pickFilesUpload(false)">＋ 上传文件</span>' +
            '</div></div>';
        c.innerHTML = head + '<div id="file-list"></div>';
        listState.files = { page: 1, loading: false, done: false, kw: '', rows: {} };
        loadFiles();
    }
    function fmtSize(n) {
        n = Number(n) || 0;
        if (n < 1024) return n + 'B';
        if (n < 1048576) return (n / 1024).toFixed(1) + 'KB';
        return (n / 1048576).toFixed(1) + 'MB';
    }
    function loadFiles() {
        var st = listState.files;
        if (!st) st = listState.files = { page: 1, loading: false, done: false, kw: '', rows: {} };
        if (!st.rows) st.rows = {};
        var kw = ($('file-kw') || {}).value || '';
        if (kw !== st.kw) { st.page = 1; st.done = false; st.kw = kw; st.rows = {}; $('file-list').innerHTML = ''; }
        if (st.loading || st.done) return;
        st.loading = true;
        var el = $('file-list');
        if (!el) return;
        if (el) el.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.fileList(st.page, 15, st.kw).then(function (res) {
            var el2 = $('file-list');
            if (!el2) return;
            if (!res || res.code !== 0) { el2.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { el2.innerHTML = '<div class="empty">暂无附件</div>'; st.done = true; return; }
            var html = '';
            var phone = isPhone();
            for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                var ft = fileTypeInfo(r.name);
                if (phone) {
                    html += '<div class="card" onclick="App.openFile(' + r.id + ')">' +
                        '<div class="card-title file-card-title"><span class="att-ft file-card-ft" style="background:' + ft.c + '">' + esc(ft.t) + '</span><span class="file-card-name">' + esc(r.name || '') + '</span></div>' +
                        '<div class="card-line">' + fmtSize(r.filesize) + ' · ' + esc(r.fileext || '') + ' · ' + fmtTime(r.create_time) + '</div>' +
                        (r.admin_name ? '<div class="card-line">上传者：' + esc(r.admin_name) + (r.group_title ? '（' + esc(r.group_title) + '）' : '') + '</div>' : '') +
                        '</div>';
                } else {
                    html += '<tr class="tr-click" onclick="App.openFile(' + r.id + ')">' +
                        '<td><div class="td-strong file-card-name">' + esc(r.name || '') + '</div></td>' +
                        '<td><span class="att-ft" style="background:' + ft.c + '">' + esc(ft.t) + '</span></td>' +
                        '<td class="td-num">' + fmtSize(r.filesize) + '</td>' +
                        '<td>' + esc(r.admin_name || '-') + (r.group_title ? '（' + esc(r.group_title) + '）' : '') + '</td>' +
                        '<td>' + fmtTime(r.create_time) + '</td>' +
                        '</tr>';
                }
            }
            el2.innerHTML = phone ? html : (DT_HEAD.files + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 15;
            if (!st.done) el2.insertAdjacentHTML('beforeend', App.moreBtn('files'));
            if (!isPhone()) App.updatePagerDom('files', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            $('file-list').innerHTML = '<div class="empty retry">网络异常，点击重试</div>';
            st.loading = false;
        });
    }
    function openFile(id, retried) {
        var st = listState.files;
        var r = st && st.rows && st.rows[id];
        var raw = r && (r.filepath || r.url || '');
        if (!raw) { toast('文件链接未加载，请先刷新列表'); return; }
        // 附件地址是协议相对写法（//static.upingbio.cn/...）或已带签名的绝对地址，
        // 必须走 absUrl 统一处理，否则会被拼成 oa.upingbio.cn/static.upingbio.cn/... 双域名，必然 404
        var url = absUrl(raw);
        var nm = String(r.name || '');
        var ext = String(r.fileext || nm.split('.').pop() || '').toLowerCase().replace(/^\./, '');
        // PDF：App 内直接预览（走原生桥带 Cookie 取文件，绕开需登录的附件接口）
        if (ext === 'pdf' && window.PdfView) {
            try {
                PdfView.open(url, {
                    title: nm || 'PDF 文件',
                    sub: '附件管理 · ' + fmtSize(r.filesize),
                    // 附件是带时效的签名链接，过期后重新拉列表换新地址再试一次
                    onRetry: function () { retryFileUrl(id, retried); }
                });
                return;
            } catch (e) { toast('预览失败：' + e.message); }
        }
        // 其他格式（图片/Word/表格）：下载后交给系统应用打开（同样带会话）
        if (window.AndroidBridge && AndroidBridge.openFileWith) {
            try { AndroidBridge.openFileWith(url, nm || '附件'); return; } catch (e) { }
        }
        openUrl(url);
    }
    // 签名链接过期 -> 重新拉一次附件列表换新签名，然后自动重开
    function retryFileUrl(id, retried) {
        if (retried) { toast('刷新后仍打不开，文件可能已被删除'); return; }
        API.fileList(1, 50, '').then(function (res) {
            var rows = (res && res.code === 0 && res.data) || [];
            var st = listState.files || (listState.files = { rows: {} });
            if (!st.rows) st.rows = {};
            for (var i = 0; i < rows.length; i++) st.rows[rows[i].id] = rows[i];
            if (!st.rows[id]) { toast('文件已不在列表中，请返回后刷新'); return; }
            if (window.PdfView) PdfView.close();
            setTimeout(function () { openFile(id, true); }, 240);
        }).catch(function () { toast('刷新失败，请检查网络'); });
    }
    // v1.1.62/63：附件管理上传（与官网 /api/index/upload 同契约；v1.1.63 起走原生选文件桥）
    function pickFilesUpload(camera) {
        pickFile(onFilesUploadPicked, camera ? 'image/*' : '*/*', camera ? false : true, camera);
    }
    // 统一入口：{name,b64,size} 数组（原生桥 / 预览兜底）
    function onFilesUploadPicked(list) {
        if (!list || !list.length) return;
        for (var i = 0; i < list.length; i++) {
            (function (it) {
                var ext = (String(it.name).split('.').pop() || '').toLowerCase();
                if (APPROVE_FILE_EXTS.indexOf(ext) < 0) { toast('不支持的格式：' + it.name); return; }
                if (!it.b64) { toast('文件为空：' + it.name); return; }
                if (Number(it.size) > APPROVE_FILE_MAX) { toast('文件过大（>10MB）：' + it.name); return; }
                toast('上传中：' + it.name);
                API.uploadFileBase64(it.b64, it.name, '/api/index/upload', 'file').then(function (res) {
                    if (res && res.code === 0) { toast('已上传：' + it.name); App.loadFiles(); }
                    else toast('上传失败：' + ((res && res.msg) || it.name));
                }).catch(function () { toast('网络异常：' + it.name); });
            })(list[i]);
        }
    }
    // 兼容旧调用：File 对象数组
    function onFilesUpload(files) {
        if (!files || !files.length) return;
        filesToRaw(files, onFilesUploadPicked);
    }

    // ===== 财务 =====
    function renderFinanceOrderPage() {
        markListPage('finance-order');
        var c = $('page-container');
        var shell = isPhone() ? '' :
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">财务 · 到账（订单）</div>' +
            '<div class="dt-toolbar-sub">订单到账流水与统计</div>' +
            '</div></div>';
        c.innerHTML = shell + '<div id="finance-order-list"></div>';
        listState.financeOrder = { page: 1, loading: false, done: false, rows: {} };
        loadFinanceOrder();
    }
    function loadFinanceOrder() {
        var st = listState.financeOrder;
        if (st.loading || st.done) return;
        st.loading = true;
        var el = $('finance-order-list');
        if (!el) return;
        if (el) el.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.financeOrderApply(st.page, 15).then(function (res) {
            var el2 = $('finance-order-list');
            if (!el2) return;
            if (!res || res.code !== 0) { el2.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            var stats = res.totalRow || {};
            var html = '<div class="stat-row">';
            html += '<div class="stat-card"><div class="stat-num">' + esc(stats['到账'] || '0.00') + '</div><div class="stat-label">到账</div></div>';
            html += '<div class="stat-card"><div class="stat-num">' + esc(stats['到账/预存款抵扣'] || '0.00') + '</div><div class="stat-label">预存款抵扣</div></div>';
            html += '<div class="stat-card"><div class="stat-num">' + esc(stats['到账原路退回(含退货)'] || '0.00') + '</div><div class="stat-label">原路退回</div></div>';
            html += '</div>';
            if (!rows.length) { el2.innerHTML = html + '<div class="empty">暂无数据</div>'; st.done = true; return; }
            for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<tr>' +
                    '<td class="td-num">¥ ' + esc(r.amount || '0.00') + '</td>' +
                    '<td><div class="td-strong">' + esc(r.customer_order_ids || '-') + '</div></td>' +
                    '<td>' + fmtTime(r.create_time) + '</td>' +
                    '</tr>';
            }
            el2.innerHTML = DT_HEAD['fin-order'] + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 15;
            if (!st.done) el2.insertAdjacentHTML('beforeend', App.moreBtn('finance-order'));
            if (!isPhone()) App.updatePagerDom('finance-order', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            $('finance-order-list').innerHTML = '<div class="empty retry">网络异常，点击重试</div>';
            st.loading = false;
        });
    }
    function renderFinanceAdvancePage() {
        markListPage('finance-advance');
        var c = $('page-container');
        var shell = isPhone() ? '' :
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">财务 · 预存款</div>' +
            '<div class="dt-toolbar-sub">客户预存款存入/支出流水与统计</div>' +
            '</div></div>';
        c.innerHTML = shell + '<div id="finance-advance-list"></div>';
        listState.financeAdv = { page: 1, loading: false, done: false, rows: {} };
        loadFinanceAdvance();
    }
    function loadFinanceAdvance() {
        var st = listState.financeAdv;
        if (st.loading || st.done) return;
        st.loading = true;
        var el = $('finance-advance-list');
        if (!el) return;
        if (el) el.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.financeAdvance(st.page, 15).then(function (res) {
            var el2 = $('finance-advance-list');
            if (!el2) return;
            if (!res || res.code !== 0) { el2.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            var stats = res.totalRow || {};
            var html = '<div class="stat-row">';
            html += '<div class="stat-card"><div class="stat-num">' + esc(stats.inc_amount || '0.00') + '</div><div class="stat-label">存入</div></div>';
            html += '<div class="stat-card"><div class="stat-num">' + esc(stats.dec_amount || '0.00') + '</div><div class="stat-label">支出</div></div>';
            html += '<div class="stat-card"><div class="stat-num">' + esc(stats.difference_amount || '0.00') + '</div><div class="stat-label">差额</div></div>';
            html += '</div>';
            if (!rows.length) { el2.innerHTML = html + '<div class="empty">暂无数据</div>'; st.done = true; return; }
            for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<tr>' +
                    '<td class="td-num">¥ ' + esc(r.amount || '0.00') + '</td>' +
                    '<td><span class="tag ' + (Number(r.type) === 1 ? 'tag-pass' : 'tag-reject') + '">' + (Number(r.type) === 1 ? '存入' : '支出') + '</span></td>' +
                    '<td>' + esc(r.customer_name || '-') + '</td>' +
                    '<td class="td-num">' + esc(r.before || '0.00') + ' → ' + esc(r.after || '0.00') + '</td>' +
                    '<td>' + fmtTime(r.create_time) + '</td>' +
                    '</tr>';
            }
            el2.innerHTML = DT_HEAD['fin-advance'] + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 15;
            if (!st.done) el2.insertAdjacentHTML('beforeend', App.moreBtn('finance-advance'));
            if (!isPhone()) App.updatePagerDom('finance-advance', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            $('finance-advance-list').innerHTML = '<div class="empty retry">网络异常，点击重试</div>';
            st.loading = false;
        });
    }
    function renderFinanceIncomePage() {
        markListPage('finance-income');
        var c = $('page-container');
        var shell = isPhone() ? '' :
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">财务 · 开票收入</div>' +
            '<div class="dt-toolbar-sub">开票流水与收入统计</div>' +
            '</div></div>';
        c.innerHTML = shell + '<div id="finance-income-list"></div>';
        listState.financeInc = { page: 1, loading: false, done: false, rows: {} };
        loadFinanceIncome();
    }
    function loadFinanceIncome() {
        var st = listState.financeInc;
        if (st.loading || st.done) return;
        st.loading = true;
        var el = $('finance-income-list');
        if (!el) return;
        if (el) el.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.financeIncome(st.page, 15).then(function (res) {
            var el2 = $('finance-income-list');
            if (!el2) return;
            if (!res || res.code !== 0) { el2.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { el2.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
            var html = '';
            for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<tr>' +
                    '<td class="td-num">¥ ' + esc(r.amount || '0.00') + '</td>' +
                    '<td><div class="td-strong">' + esc(r.invoice_title || '-') + '</div></td>' +
                    '<td>' + fmtTime(r.create_time || r.open_time) + '</td>' +
                    '</tr>';
            }
            el2.innerHTML = DT_HEAD['fin-income'] + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 15;
            if (!st.done) el2.insertAdjacentHTML('beforeend', App.moreBtn('finance-income'));
            if (!isPhone()) App.updatePagerDom('finance-income', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            $('finance-income-list').innerHTML = '<div class="empty retry">网络异常，点击重试</div>';
            st.loading = false;
        });
    }

    // ===== 审批 =====
    function renderApprove() {
        var c = $('page-container');
        c.innerHTML =
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">审批中心</div>' +
            '<div class="dt-toolbar-sub">我发起的与待我处理的审批</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<span class="oa-btn primary" onclick="App.openApproveType()">＋ 发起审批</span>' +
            '</div></div>' +
            '<div class="seg">' +
            '<div class="seg-item active" data-s="0" onclick="App.loadApprove(0)">全部</div>' +
            '<div class="seg-item" data-s="1" onclick="App.loadApprove(1)">待审批</div>' +
            '<div class="seg-item" data-s="2" onclick="App.loadApprove(2)">已通过</div>' +
            '<div class="seg-item" data-s="3" onclick="App.loadApprove(3)">已拒绝</div>' +
            '</div>' +
            '<div id="approve-list"></div>';
        listState.approve = { page: 1, status: 0, loading: false, done: false, rows: {} };
        deEmoji(c);
        loadApprove(0);
    }

    function loadApprove(status) {
        // 切换状态
        if (status !== listState.approve.status) {
            listState.approve = { page: 1, status: status, loading: false, done: false, rows: {} };
            var segs = document.querySelectorAll('#page-container .seg-item');
            for (var i = 0; i < segs.length; i++) {
                segs[i].className = 'seg-item' + (parseInt(segs[i].getAttribute('data-s')) === status ? ' active' : '');
            }
            $('approve-list').innerHTML = '';
        }
        var st = listState.approve;
        if (st.loading || st.done) return;
        st.loading = true;
        var apList = $('approve-list');
        if (apList) apList.insertAdjacentHTML('beforeend', '<div class="loading" id="approve-loading">加载中…</div>');
        API.approveList(st.page, 20, st.status === 0 ? '' : st.status).then(function (res) {
            var el = $('approve-loading');
            if (!el) return;
            if (el) el.remove();
            var apList2 = $('approve-list');
            if (!res || res.code !== 0) { if (apList2) apList2.insertAdjacentHTML('beforeend', '<div class="empty retry">' + esc((res && res.msg) || '加载失败') + '，点击重试</div>'); st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { if (apList2) apList2.insertAdjacentHTML('beforeend', '<div class="empty">暂无数据</div>'); st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                var stText = '', stCls = '';
                var s = parseInt(r.check_status != null ? r.check_status : r.status);
                if (isNaN(s)) { stText = '未知状态'; stCls = 'tag-pending'; }
                else if (s === 0 || s === 1) { stText = '待审批'; stCls = 'tag-pending'; }
                else if (s === 2) { stText = '已通过'; stCls = 'tag-pass'; }
                else if (s === 3 || s === 4) { stText = (s === 4 ? '已拒绝' : '已拒绝'); stCls = 'tag-reject'; }
                else { stText = '状态' + s; stCls = 'tag-pending'; }
                var canCheck = (s === 0 || s === 1);
                html += '<tr onclick="App.openApproveDetail(' + r.id + ')">' +
                '<td><div class="td-strong">' + esc(r.name || r.content || '审批') + '</div><div class="td-sub">' + esc(r.content || '') + '</div></td>' +
                '<td>' + esc(r.admin_name || r.name || '') + '</td>' +
                '<td class="td-num">' + (r.amount ? esc(r.amount) : '-') + '</td>' +
                '<td>' + fmtTime(r.create_time || r.detail_time || r.start_time) + '</td>' +
                '<td><span class="tag ' + stCls + '">' + stText + '</span></td>' +
                '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.openApproveDetail(' + r.id + ')">详情</span>' +
                (canCheck ? '<span class="dt-link ok" onclick="event.stopPropagation();App.doApproveCheck(' + r.id + ',2,event)">通过</span><span class="dt-link no" onclick="event.stopPropagation();App.doApproveCheck(' + r.id + ',3,event)">拒绝</span>' : '') +
                '</td></tr>';
            }
            $('approve-list').innerHTML = DT_HEAD.approve + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) $('approve-list').insertAdjacentHTML('beforeend', App.moreBtn('approve', st.status));
            if (!isPhone()) App.updatePagerDom('approve', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            var el = $('approve-loading');
            if (!el) return;
            if (el) el.remove();
            $('approve-list').insertAdjacentHTML('beforeend', '<div class="empty retry">网络异常，点击重试</div>');
            st.loading = false;
        });
    }

    function openApproveDetail(id) {
        regReplay(function () { App.openApproveDetail(id); });
        var r = (listState.approve && listState.approve.rows && listState.approve.rows[id]) || (wbApproveRows || {})[id];
        if (!r) { toast('详情未加载，请返回列表刷新'); return; }
        var s = parseInt(r.check_status != null ? r.check_status : r.status);
        var stText = '', stCls = '';
        if (isNaN(s)) { stText = '未知状态'; stCls = 'tag-pending'; }
        else if (s === 0 || s === 1) { stText = '待审批'; stCls = 'tag-pending'; }
        else if (s === 2) { stText = '已通过'; stCls = 'tag-pass'; }
        else if (s === 3 || s === 4) { stText = '已拒绝'; stCls = 'tag-reject'; }
        else { stText = '状态' + s; stCls = 'tag-pending'; }
        showDetailShell(r.content || '审批详情', function () {
            var cur = (listState.approve && listState.approve.status) || 0;
            App.switchTab('approve');
            if (cur !== 0) { App.renderApprove(); App.loadApprove(cur); }
        });
        var c = $('page-container');
        var html = '<div class="dt-hero"><div class="dt-hero-top"><div class="dt-hero-title">' + esc(r.content || '审批') + '<span class="tag ' + stCls + '">' + stText + '</span></div></div></div>';
        var rows = [
            ['主题', r.name], ['申请人', r.admin_name], ['申请时间', fmtTime(r.create_time || r.detail_time || r.start_time)],
            ['金额', r.amount], ['流程', r.flow_type], ['说明', r.remark]
        ];
        for (var i = 0; i < rows.length; i++) {
            if (!rows[i][1]) continue;
            html += '<div class="detail-card"><div class="dc-label">' + rows[i][0] + '</div><div class="dc-value">' + esc(rows[i][1]) + '</div></div>';
        }
        // 按审批类型渲染表单字段
        if (APPROVE_FORMS && APPROVE_FORMS[r.type]) {
            var mf = APPROVE_FORMS[r.type].fields;
            for (var j = 0; j < mf.length; j++) {
                var f = mf[j];
                if (f.type === 'hidden' || f.key === 'type' || f.key === 'id' || f.key === 'content' || f.key === 'flow_id') continue;
                var v = r[f.key];
                if (v === undefined || v === null || v === '') continue;
                if (f.type === 'datetime' && r[f.key + '_span'] && String(r[f.key + '_span']) !== '0') {
                    v = String(v) + ' ' + (f.spanTexts && f.spanTexts[r[f.key + '_span']] || ('时段' + r[f.key + '_span']));
                }
                html += '<div class="detail-card"><div class="dc-label">' + esc(f.label || f.key) + '</div><div class="dc-value">' + esc(v) + '</div></div>';
            }
        }
        // 审批记录
        html += '<div class="section-title">审批记录</div><div id="flow-nodes"><div class="loading">加载中…</div></div>';
        c.innerHTML = html;
        API.flowNodes(id).then(function (res) {
            var box = $('flow-nodes');
            if (!box) return;
            if (!res || res.code !== 0 || !(res.data || []).length) {
                box.innerHTML = '<div class="empty">暂无审批记录</div>';
                return;
            }
            var nodes = res.data;
            var h = '';
            for (var k = 0; k < nodes.length; k++) {
                var n = nodes[k];
                h += '<div class="node-item"><div class="node-dot ' + (n.status === 2 ? 'ok' : (n.status === 3 ? 'no' : 'wait')) + '"></div>' +
                    '<div class="node-body"><div class="node-name">' + esc(n.user_name || n.admin_name || '审核人') + '</div>' +
                    '<div class="node-info">' + esc(n.status_text || statusText(n.status)) + '</div>' +
                    (n.check_content ? '<div class="node-info">' + esc(n.check_content) + '</div>' : '') +
                    '<div class="node-time">' + fmtTime(n.check_time || n.create_time) + '</div></div></div>';
            }
            box.innerHTML = h;
        }).catch(function () {
            var box = $('flow-nodes');
            if (!box) return;
            if (box) box.innerHTML = '<div class="empty retry">审批记录加载失败，点击重试</div>';
        });
    }

    function statusText(s) {
        s = parseInt(s);
        if (s === 0 || s === 1) return '待审批';
        if (s === 2) return '已通过';
        if (s === 3) return '已拒绝';
        if (s === 4) return '已撤回';
        return '状态' + s;
    }

    function doApproveCheck(id, status, ev) {
        if (ev) ev.stopPropagation();
        var label = status === 2 ? '通过' : '拒绝';
        uiConfirm('确认' + label + '该审批？', function () {
            API.approveCheck(id, status).then(function (res) {
                if (res && res.code === 0) {
                    toast(label + '成功');
                    listState.approve = { page: 1, status: listState.approve.status, loading: false, done: false, rows: {} };
                    $('approve-list').innerHTML = '';
                    loadApprove(listState.approve.status);
                } else {
                    toast((res && res.msg) || '操作失败');
                }
            }).catch(function () { toast('网络异常'); });
        });
    }

    // ===== 客户 =====
    function renderCustomer() {
        var c = $('page-container');
        if (isPhone()) { renderCustomerMobile(); return; }
        // 桌面端：标准后台布局——工具栏 + 筛选分段 + 列表(表格) + 侧边快捷链接
        var entries = [
            { name: '联系人', icon: 'users', run: "App.showSubPage('contact-list')" },
            { name: '销售机会', icon: 'target', run: "App.showSubPage('chance-list')" },
            { name: '跟进记录', icon: 'clipboard-check', run: "App.showSubPage('trace-list')" },
            { name: '我的订单', icon: 'package', run: "App.showSubPage('order-my')" },
            { name: '订单处理', icon: 'wrench', run: "App.showSubPage('order-handle')" },
            { name: '平台订单', icon: 'shopping-cart', run: "App.showSubPage('platform-order')" },
            { name: '样本管理', icon: 'flask', run: "App.showSubPage('sample')" },
            { name: '校展管理', icon: 'book', run: "App.showSubPage('school')" },
            { name: '售后管理', icon: 'tool', run: "App.showSubPage('after')" }
        ];
        var chips = entries.map(function (e) {
            return '<span class="cust-chip" onclick="' + e.run + '">' + ic(e.icon) + e.name + '</span>';
        }).join('');
        c.innerHTML =
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">客户管理</div>' +
            '<div class="dt-toolbar-sub">我的客户 · 公海 · 废弃</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="cust-kw" type="text" placeholder="搜索客户名称"><button class="dt-search-btn" onclick="App.loadCustomer(' + (listState.customer ? listState.customer.type : 1) + ')">搜索</button></div>' +
            '<span class="oa-btn primary" onclick="App.showSubPage(\'customer-add\')">＋ 新增客户</span>' +
            '</div></div>' +
            '<div class="cust-chips">' + chips + '</div>' +
            '<div class="seg">' +
            '<div class="seg-item active" data-t="1" onclick="App.loadCustomer(1)">我的客户</div>' +
            '<div class="seg-item" data-t="2" onclick="App.loadCustomer(2)">公海</div>' +
            '<div class="seg-item" data-t="3" onclick="App.loadCustomer(3)">废弃</div>' +
            '</div>' +
            '<div id="customer-list"></div>';
        listState.customer = { page: 1, type: 1, loading: false, done: false, rows: {} };
        loadCustomer(1);
        deEmoji(c);
    }

    function renderCustomerMobile() {
        var c = $('page-container');
        var entries = [
            { name: '联系人', icon: 'users', run: "App.showSubPage('contact-list')" },
            { name: '销售机会', icon: 'target', run: "App.showSubPage('chance-list')" },
            { name: '跟进记录', icon: 'clipboard-check', run: "App.showSubPage('trace-list')" },
            { name: '我的订单', icon: 'package', run: "App.showSubPage('order-my')" },
            { name: '订单处理', icon: 'wrench', run: "App.showSubPage('order-handle')" },
            { name: '平台订单', icon: 'shopping-cart', run: "App.showSubPage('platform-order')" },
            { name: '样本管理', icon: 'flask', run: "App.showSubPage('sample')" },
            { name: '校展管理', icon: 'book', run: "App.showSubPage('school')" },
            { name: '售后管理', icon: 'tool', run: "App.showSubPage('after')" }
        ];
        c.innerHTML =
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">客户管理</div>' +
            '<div class="dt-toolbar-sub">我的客户 · 公海 · 废弃</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="cust-kw" type="text" placeholder="搜索客户名称"><button class="dt-search-btn" onclick="App.loadCustomer(' + (listState.customer ? listState.customer.type : 1) + ')">搜索</button></div>' +
            '<span class="oa-btn primary" onclick="App.showSubPage(\'customer-add\')">＋ 新增客户</span>' +
            '</div></div>' +
            '<div class="seg">' +
            '<div class="seg-item active" data-t="1" onclick="App.loadCustomer(1)">我的客户</div>' +
            '<div class="seg-item" data-t="2" onclick="App.loadCustomer(2)">公海</div>' +
            '<div class="seg-item" data-t="3" onclick="App.loadCustomer(3)">废弃</div>' +
            '</div>' +
            '<div id="customer-list"></div>' +
            '<div class="section-title">客户功能</div>' +
            '<div class="m-grid">' +
            entries.map(function (e) {
                return '<div class="m-grid-item" onclick="' + e.run + '"><div class="m-grid-ic">' + ic(e.icon) + '</div>' + e.name + '</div>';
            }).join('') +
            '</div>';
        listState.customer = { page: 1, type: 1, loading: false, done: false, rows: {} };
        loadCustomer(1);
        deEmoji(c);
    }

    function loadCustomer(type) {
        if (!listState.customer || type !== listState.customer.type) {
            listState.customer = { page: 1, type: type, loading: false, done: false, rows: {} };
            var segs = document.querySelectorAll('#page-container .seg-item');
            for (var i = 0; i < segs.length; i++) {
                segs[i].className = 'seg-item' + (parseInt(segs[i].getAttribute('data-t')) === type ? ' active' : '');
            }
            $('customer-list').innerHTML = '';
        }
        var st = listState.customer;
        if (st.loading || st.done) return;
        st.loading = true;
        var kw = ($('cust-kw') || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        $('customer-list').insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.customerList(st.page, 20, st.type, kw).then(function (res) {
            $('customer-list').innerHTML = '';
            if (!res || res.code !== 0) { $('customer-list').innerHTML = '<div class="empty retry">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { $('customer-list').innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; st.loading = false; return; }
            // 追加进全量 rows 后按累积渲染，避免"加载更多"覆盖已加载列表
            for (var i = 0; i < rows.length; i++) {
                st.rows[rows[i].id] = rows[i];
            }
            var html = '';
            var keys = Object.keys(st.rows);
            for (var k = 0; k < keys.length; k++) {
                var r = st.rows[keys[k]];
                html += '<tr onclick="App.openCustomer(' + r.id + ')">' +
                    '<td><div class="td-strong">' + esc(r.name || '未命名') + '</div></td>' +
                    '<td>' + esc(r.type_title || (Number(r.c_type) === 2 ? '公海客户' : Number(r.c_type) === 3 ? '废弃客户' : '我的客户')) + '</td>' +
                    '<td class="td-num">' + esc(r.advance_deposit || '0.00') + '</td>' +
                    '<td class="td-num">' + esc(r.deduction || '0.00') + '</td>' +
                    '<td class="td-num">' + esc(r.margin_deposit || '0.00') + '</td>' +
                    '<td>' + esc(r.belong_name || '') + '</td>' +
                    '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.openCustomer(' + r.id + ')">详情</span></td></tr>';
            }
            $('customer-list').innerHTML = DT_HEAD.customer + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) $('customer-list').insertAdjacentHTML('beforeend', App.moreBtn('customer', st.type));
            if (!isPhone()) App.updatePagerDom('customer', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            $('customer-list').innerHTML = '<div class="empty retry">网络异常，点击重试</div>';
            st.loading = false;
        });
    }

    var custDetailId = 0;
    function openCustomer(id) {
        regReplay(function () { App.openCustomer(id); });
        var r = (listState.customer && listState.customer.rows && listState.customer.rows[id]);
        if (!r) { toast('详情未加载，请返回列表刷新'); return; }
        custDetailId = id;
        showDetailShell(r.name || '客户详情', function () { App.switchTab('customer'); });
        var c = $('page-container');
        var html = '<div class="dt-hero"><div class="dt-hero-top"><div>' +
            '<div class="dt-hero-title">' + esc(r.name || '未命名') + '</div>' +
            '<div class="dt-hero-sub">' + esc(r.type_title || (Number(r.c_type) === 2 ? '公海客户' : Number(r.c_type) === 3 ? '废弃客户' : '我的客户')) + ' · 负责人：' + esc(r.belong_name || '') + '</div>' +
            '</div></div>' +
            '<div class="dt-hero-fields">' +
            '<div class="dt-hero-field"><div class="dt-hero-field-label">预存款</div><div class="dt-hero-field-value" style="color:#1E6FFF">' + esc(r.advance_deposit || '0.00') + '</div></div>' +
            '<div class="dt-hero-field"><div class="dt-hero-field-label">抵扣券</div><div class="dt-hero-field-value" style="color:#52C41A">' + esc(r.deduction || '0.00') + '</div></div>' +
            '<div class="dt-hero-field"><div class="dt-hero-field-label">保证金</div><div class="dt-hero-field-value" style="color:#E6A23C">' + esc(r.margin_deposit || '0.00') + '</div></div>' +
            '<div class="dt-hero-field"><div class="dt-hero-field-label">创建时间</div><div class="dt-hero-field-value">' + fmtTime(r.create_time) + '</div></div>' +
            '</div></div>';
        html += '<div class="detail-card"><div class="dc-label">创建时间</div><div class="dc-value">' + fmtTime(r.create_time) + '</div></div>';
        if (r.remark) html += '<div class="detail-card"><div class="dc-label">备注</div><div class="dc-value">' + esc(r.remark) + '</div></div>';
        html += '<div class="seg cust-tabs">' +
            '<div class="seg-item active" data-t="trace" onclick="App.custTab(this)">跟进记录</div>' +
            '<div class="seg-item" data-t="contact" onclick="App.custTab(this)">联系人</div>' +
            '<div class="seg-item" data-t="chance" onclick="App.custTab(this)">销售机会</div>' +
            '</div><div id="cust-tab-box"><div class="loading">加载中…</div></div>';
        if (Number(r.c_type) === 1) {
            html += '<div style="display:flex;gap:8px;padding:14px">' +
                '<span class="act-btn" style="flex:1;text-align:center" onclick="App.openCustomerEdit(' + r.id + ')">编辑客户</span>' +
                '<span class="act-btn" style="flex:1;text-align:center" onclick="App.doCustomerToSea(' + r.id + ')">转公海</span>' +
                '<span class="act-btn" style="flex:1;text-align:center" onclick="App.doCustomerTransfer(' + r.id + ')">转移客户</span>' +
                '</div>';
        }
        c.innerHTML = html;
        custTab(document.querySelector('.cust-tabs .seg-item'));
    }

    function custTab(tabEl) {
        if (!custDetailId) { toast('页面状态异常，请返回重试'); return; }
        var segs = document.querySelectorAll('.cust-tabs .seg-item');
        for (var i = 0; i < segs.length; i++) segs[i].className = 'seg-item' + (segs[i] === tabEl ? ' active' : '');
        var t = tabEl.getAttribute('data-t');
        var box = $('cust-tab-box');
        if (!box) return;
        box.innerHTML = '<div class="loading">加载中…</div>';
        var p = null;
        if (t === 'trace') p = API.customerTrace(custDetailId);
        else if (t === 'contact') p = API.customerContact(custDetailId);
        else p = API.customerChance(custDetailId);
        p.then(function (res) {
            if (!box) return;
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty retry" onclick="App.custTabBy(\'' + t + '\')">' + esc((res && res.msg) || '加载失败') + '，点击重试</div>'; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; return; }
            var h = '';
            for (var i = 0; i < rows.length; i++) {
                var it = rows[i];
                if (t === 'contact') {
                    h += '<div class="card"><div class="card-title">' + esc(it.name || it.contact_name || '') + (it.mobile ? '　' + esc(it.mobile) : '') + '</div>' +
                        (it.telephone ? '<div class="card-line">电话：' + esc(it.telephone) + '</div>' : '') +
                        (it.email ? '<div class="card-line">邮箱：' + esc(it.email) + '</div>' : '') +
                        (it.position || it.dept ? '<div class="card-line">' + esc(it.position || '') + (it.dept ? ' · ' + esc(it.dept) : '') + '</div>' : '') +
                        '</div>';
                } else if (t === 'chance') {
                    h += '<div class="card"><div class="card-title">' + plain(it.title || it.name || '') + (it.amount ? '　¥ ' + esc(it.amount) : '') + '</div>' +
                        (it.cate_title ? '<div class="card-line">' + esc(it.cate_title) + '</div>' : '') +
                        '<div class="card-line">' + (it.status_text ? esc(it.status_text) : (it.status ? '状态' + esc(it.status) : '')) + ' · ' + fmtTime(it.create_time) + '</div>' +
                        '</div>';
                } else {
                    h += '<div class="card"><div class="card-title">' + esc(it.content || it.remark || '跟进记录') + '</div>' +
                        '<div class="card-line">' + esc(it.admin_name || '') + ' · ' + fmtTime(it.create_time) + '</div>' +
                        '</div>';
                }
            }
            box.innerHTML = h;
        }).catch(function () {
            if (box) box.innerHTML = '<div class="empty">网络异常</div>';
        });
    }

    // 客户详情子Tab点击重试入口
    function custTabBy(t) {
        var el = document.querySelector('.cust-tabs .seg-item[data-t="' + t + '"]');
        if (el) custTab(el);
    }

    // ===== v1.1.0 新增：财务子页 =====
    var finState = {}; // 各财务列表分页

    function renderFinanceDeductionPage() { markListPage('deduction'); finListShell('deduction', '抵扣券（我申请的）', API.deductionList, loadFinanceDeduction, 'deduction'); }
    function loadFinanceDeduction() { loadFinList('deduction', API.deductionList, finCard); }
    function renderFinanceDeductionCheckedPage() { markListPage('deduction-checked'); finListShell('deduction-checked', '抵扣券（管理专用）', API.deductionCheckedList, loadFinanceDeductionChecked, 'deduction-checked'); }
    function loadFinanceDeductionChecked() { loadFinList('deduction-checked', API.deductionCheckedList, finCard); }
    function renderFinanceMarginPage() { markListPage('margin'); finListShell('margin', '保证金', API.marginList, loadFinanceMargin, 'margin'); }
    function loadFinanceMargin() { loadFinList('margin', API.marginList, finCard); }
    function renderFinanceInvoiceMyPage() { markListPage('invoice-my'); finListShell('invoice-my', '发票（我申请的）', API.invoiceList, loadFinanceInvoiceMy, 'invoice-my'); }
    function loadFinanceInvoiceMy() { loadFinList('invoice-my', API.invoiceList, finCard); }
    function renderFinanceInvoiceHandlePage() { markListPage('invoice-handle'); finListShell('invoice-handle', '发票（我处理的）', API.invoiceHandleList, loadFinanceInvoiceHandle, 'invoice-handle'); }
    function loadFinanceInvoiceHandle() { loadFinList('invoice-handle', API.invoiceHandleList, finCard); }
    function renderFinanceOrderApplyHandlePage() { markListPage('orderapply-handle'); finListShell('orderapply-handle', '到账（订单·我处理的）', API.orderApplyHandleList, loadFinanceOrderApplyHandle, 'orderapply-handle'); }
    function loadFinanceOrderApplyHandle() { loadFinList('orderapply-handle', API.orderApplyHandleList, finCard); }

    function finListShell(key, title, apiFn, loader, label) {
        var c = $('page-container');
        c.innerHTML = '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">' + title + '</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="fin-kw-' + key + '" type="text" placeholder="搜索"><button class="dt-search-btn" onclick="App.' + loader.name + '()">搜索</button></div>' +
            '</div></div>' +
            '<div id="fin-list-' + key + '"></div>';
        finState[key] = { page: 1, loading: false, done: false, rows: {} };
        loader();
    }
    function loadFinList(key, apiFn, cardFn) {
        var st = finState[key];
        if (!st || st.loading || st.done) return;
        st.loading = true;
        var box = $('fin-list-' + key);
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('fin-kw-' + key)) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        var p = apiFn(st.page, 20);
        p.then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
            var html = '';
            for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) { html += cardFn(st.rows[__rk[k2]]); }
            box.innerHTML = DT_HEAD.fin + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn(key));
            if (!isPhone()) App.updatePagerDom(key, (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; }
        });
    }
    function finCard(r) {
        var stTxt = r.status_msg || r.status_name || (r.check_status == 1 ? '已通过' : '') || '-';
        var amt = (r.amount != null ? r.amount : (r.money != null ? r.money : ''));
        return '<tr>' +
            '<td>' + esc(r.code || r.id) + '</td>' +
            '<td><div class="td-strong">' + esc(r.customer_name || '-') + '</div>' + (r.remark ? '<div class="td-sub">' + esc(r.remark) + '</div>' : '') + '</td>' +
            '<td class="td-num">' + esc(amt || '-') + '</td>' +
            '<td>' + esc(stTxt) + '</td>' +
            '<td>' + fmtTime(r.create_time || r.enter_time) + '</td>' +
            '</tr>';
    }

    // ===== v1.1.0 新增：消息中心 =====
    var msgState = { tab: 'inbox', page: 1, loading: false, done: false, rows: {} };
    var msgRecipients = { type: 1, uids: [], dids: '', pids: '', names: [], selPage: 1, selRows: [] };

    function renderMessagePage(tab) {
        markListPage('message-' + String(tab).replace('message-', ''));
        tab = String(tab).replace('message-', '');
        setMsgViewing(true); // 进入消息中心期间不响铃
        msgState = { tab: tab, page: 1, loading: false, done: false, rows: {} };
        var t = $('topbar-title');
        if (t) t.textContent = MOBILE_TITLES['message-' + tab] || '收件箱'; // 从详情返回时恢复列表标题
        refreshMsgNow(); // 进入消息中心立即刷新未读角标
        var c = $('page-container');
        c.innerHTML =
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">消息中心</div>' +
            '<div class="dt-toolbar-sub">收件箱 · 发件箱 · 草稿箱 · 回收站</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<span class="oa-btn primary" onclick="App.openMsgCompose()">＋ 新建消息</span>' +
            '</div></div>' +
            '<div class="seg">' +
            '<div class="seg-item' + (tab === 'inbox' ? ' active' : '') + '" onclick="App.openMsgTab(\'inbox\')">收件箱</div>' +
            '<div class="seg-item' + (tab === 'sendbox' ? ' active' : '') + '" onclick="App.openMsgTab(\'sendbox\')">发件箱</div>' +
            '<div class="seg-item' + (tab === 'draft' ? ' active' : '') + '" onclick="App.openMsgTab(\'draft\')">草稿箱</div>' +
            '<div class="seg-item' + (tab === 'rubbish' ? ' active' : '') + '" onclick="App.openMsgTab(\'rubbish\')">回收站</div>' +
            '</div>' +
            '<div id="msg-list"></div>';
        loadMessage(tab);
    }
    function openMsgTab(tab) {
        // 必须走 showSubPage：同步 currentPageType/标题/返回目标，否则重试重放会命中旧的收件箱页面
        App.openMobile('message-' + tab);
    }
    function loadMessage(tab) {
        if (msgState.tab !== tab) { msgState = { tab: tab, page: 1, loading: false, done: false, rows: {} }; $('msg-list').innerHTML = ''; }
        var st = msgState;
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('msg-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        API.messageList(tab, st.page, 20).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var __rk = Object.keys(st.rows);
            __rk.sort(function (a, b) { return b - a; }); // id 降序=新消息在前（服务端按 id 倒序返回，Object.keys 数字升序会把最新消息排到列表底部）
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                var unread = (tab === 'inbox' && !r.read_time) ? ' <span class="badge">未读</span>' : '';
                html += '<tr onclick="App.openMsgDetail(' + r.id + ')">' +
                '<td><div class="td-strong">' + plain(r.title || '（无主题）') + unread + '</div></td>' +
                '<td>' + esc(r.from_name || r.to_name || '') + '</td>' +
                '<td>' + fmtTime(r.send_time || r.create_time) + '</td>' +
                '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.openMsgDetail(' + r.id + ')">查看</span></td></tr>';
            }
            box.innerHTML = DT_HEAD.msg + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('msg', tab));
            if (!isPhone()) App.updatePagerDom('msg', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () {
            if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; }
        });
    }
    function openMsgDetail(id) {
        regReplay(function () { App.openMsgDetail(id); });
        var r = msgState.rows[id];
        showDetailShell(r ? (r.title || '消息详情') : '消息详情', function () { App.openMobile('message-' + msgState.tab); });
        var c = $('page-container');
        c.innerHTML = '<div class="loading">加载中…</div>';
        API.messageRead(id).then(function (res) {
            var d = null;
            if (res && res.ok && res.html) d = parseMsgDetailHtml(res.html, r);
            if (!d) d = r;
            if (!d) { c.innerHTML = '<div class="empty">内容加载失败</div>'; return; }
            var html = '<div class="detail-card"><div class="dc-label">标题</div><div class="dc-value">' + plain(d.title || '') + '</div></div>' +
                '<div class="detail-card"><div class="dc-label">发件人</div><div class="dc-value">' + esc(d.from || d.from_name || '') + '</div></div>' +
                '<div class="detail-card"><div class="dc-label">时间</div><div class="dc-value">' + esc(d.time || d.send_time || '') + '</div></div>' +
                (d.to ? '<div class="detail-card"><div class="dc-label">收件人</div><div class="dc-value">' + esc(d.to) + '</div></div>' : '') +
                '<div class="detail-card"><div class="dc-label">内容</div><div class="dc-value" style="white-space:pre-wrap">' + (d.content || '') + '</div></div>';
            var btns = '';
            if (msgState.tab === 'inbox') btns += '<span class="act-btn" onclick="App.msgDelete(' + id + ')">删除</span>';
            if (msgState.tab === 'rubbish') btns += '<span class="act-btn" onclick="App.msgDelete(' + id + ')">彻底删除</span>';
            btns += '<span class="act-btn" onclick="App.openMsgComposeReply(' + id + ')">回复</span>';
            html += '<div style="display:flex;gap:8px;padding:14px">' + btns + '</div>';
            c.innerHTML = html;
            refreshMsgNow(); // 已读后立即刷新角标并同步 lastMsgNum，停止持续响铃
        }).catch(function () {
            c.innerHTML = '<div class="empty">网络异常</div>';
        });
    }
    // 从 /message/index/read 返回的 HTML 详情页提取字段（页面型接口，无 JSON）
    // 消息内容保留富文本（网站为 <a class="link-a" data-href="...">查看详情</a> 等），链接转为 App 内跳转
    function parseMsgDetailHtml(html, fallback) {
        function g(pat) {
            var m = html.match(pat);
            if (!m) return '';
            return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        }
        var cm = html.match(/消息内容<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/);
        var content = cm ? cm[1] : '';
        content = content.replace(/<a\s+[^>]*class="link-a"[^>]*data-href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, function (m, href, txt) {
            return '<a href="javascript:App.openOa(\'' + href.replace(/'/g, "\\'") + '\')">' + txt + '</a>';
        });
        // 其余 <a> 链接统一转 App 内打开，避免跳出单页（排除已转换的 javascript: 链接）
        content = content.replace(/<a\s+[^>]*href="((?!javascript:)[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, function (m, href, txt) {
            return '<a href="javascript:App.openOa(\'' + href.replace(/'/g, "\\'") + '\')">' + txt + '</a>';
        });
        return {
            title: g(/信息主题<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/),
            from: g(/发送人<\/td>\s*<td>([\s\S]*?)<\/td>/),
            time: g(/发送时间<\/td>\s*<td>([\s\S]*?)<\/td>/),
            to: g(/收件人<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/),
            content: content
        };
    }
    function msgDelete(id) {
        uiConfirm('确定删除该消息？', function () {
            API.messageCheck(String(id), 2, 3).then(function (res) {
                if (res && res.code === 0) { toast('已删除'); App.loadMessage(msgState.tab); }
                else toast((res && res.msg) || '删除失败');
            });
        });
    }
    function openMsgCompose() {
        regReplay(function () { App.openMsgCompose(); });
        showDetailShell('新建消息', function () { App.openMobile('message-' + msgState.tab); });
        msgRecipients = { type: 1, uids: [], dids: '', pids: '', names: [], selPage: 1, selRows: [] };
        renderMsgComposeForm(null);
    }
    function openMsgComposeReply(id) {
        regReplay(function () { App.openMsgComposeReply(id); });
        var r = msgState.rows[id];
        showDetailShell('回复消息', function () { App.openMobile('message-' + msgState.tab); });
        msgRecipients = { type: 1, uids: [], dids: '', pids: '', names: [], selPage: 1, selRows: [] };
        renderMsgComposeForm({ reply: true, toName: r ? r.from_name : '', pid: id });
    }
    function renderMsgComposeForm(opt) {
        var c = $('page-container');
        var titleVal = (opt && opt.reply) ? 'Re: ' + esc((opt.toName || '')) : '';
        var pidVal = (opt && opt.pid) ? opt.pid : '';
        c.innerHTML =
            '<div class="detail-card"><div class="dc-label">接收人类型</div><div class="dc-value">' +
            '<span class="seg"><span class="seg-item" data-rt="1" onclick="App.setMsgType(1,this)">同事</span><span class="seg-item" data-rt="2" onclick="App.setMsgType(2,this)">部门</span><span class="seg-item" data-rt="3" onclick="App.setMsgType(3,this)">岗位</span><span class="seg-item" data-rt="4" onclick="App.setMsgType(4,this)">全部</span></span></div></div>' +
            '<div class="detail-card" id="msg-rec-box"><div class="dc-label">收件人</div><div class="dc-value"><span class="act-btn" onclick="App.pickMsgRecipients()">选择收件人</span><div id="msg-rec-names" style="margin-top:6px"></div></div></div>' +
            '<div class="detail-card"><div class="dc-label">标题</div><input id="msg-title" class="form-input" type="text" value="' + titleVal + '" placeholder="消息标题"></div>' +
            '<div class="detail-card"><div class="dc-label">内容</div><textarea id="msg-content" class="form-input" rows="5" placeholder="消息内容"></textarea></div>' +
            '<input type="hidden" id="msg-reply-pid" value="' + pidVal + '">' +
            '<div style="display:flex;gap:8px;padding:14px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.submitMsgSend(true)">发送</span><span class="act-btn" style="flex:1;text-align:center" onclick="App.submitMsgSend(false)">存草稿</span></div>';
        var seg = c.querySelector('.seg');
        for (var i = 0; i < seg.children.length; i++) {
            if (seg.children[i].getAttribute('data-rt') == msgRecipients.type) seg.children[i].className = 'seg-item active';
        }
        refreshMsgRecNames();
    }
    function setMsgType(t, el) {
        msgRecipients.type = t;
        var seg = el.parentElement;
        for (var i = 0; i < seg.children.length; i++) seg.children[i].className = 'seg-item' + (seg.children[i] === el ? ' active' : '');
        if (t === 4) { msgRecipients.uids = []; msgRecipients.names = ['全部人员']; refreshMsgRecNames(); }
        else if (t === 4) { }
    }
    function refreshMsgRecNames() {
        var box = $('msg-rec-names');
        if (!box) return;
        box.innerHTML = msgRecipients.names.length ? esc(msgRecipients.names.join('、')) : '（未选择）';
    }
    function pickMsgRecipients() {
        if (msgRecipients.type === 4) { toast('已选择全部人员'); return; }
        var c = $('page-container');
        c.innerHTML = '<div class="search-bar"><input id="mail-sel-kw" type="text" placeholder="搜索姓名/手机号"><span class="search-btn" onclick="App.loadMsgRecipients(1)">搜索</span></div><div id="mail-sel-list"></div>' +
            '<div style="display:flex;gap:8px;padding:14px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.loadMsgRecipients(1)">加载更多</span><span class="act-btn" style="flex:1;text-align:center" onclick="App.confirmMsgRecipients()">确定选择</span></div>';
        loadMsgRecipients(1);
    }
    function loadMsgRecipients(page) {
        var box = $('mail-sel-list');
        if (!box) return;
        var kw = (($('mail-sel-kw')) || {}).value || '';
        API.mailList(page, 50, kw).then(function (res) {
            var rows = (res && res.code === 0 && res.data) ? res.data : [];
            if (page === 1) box.innerHTML = '';
            if (!rows.length) { if (page === 1) box.innerHTML = '<div class="empty">暂无人员</div>'; return; }
            var html = '';
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                var picked = msgRecipients.uids.indexOf(String(r.id)) >= 0;
                html += '<div class="card" style="' + (picked ? 'border:1px solid #1677ff' : '') + '" onclick="App.toggleMsgRecipient(' + r.id + ',\'' + esc(r.name || r.username || '') + '\')">' +
                    '<div class="card-title">' + esc(r.name || r.username || '') + (picked ? '　✓' : '') + '</div>' +
                    '<div class="card-line">' + esc(r.mobile || '') + (r.email ? ' · ' + esc(r.email) : '') + '</div>' +
                    '</div>';
            }
            if (box) box.insertAdjacentHTML('beforeend', html);
        }).catch(function () { if (box) box.innerHTML = '<div class="empty">网络异常</div>'; });
    }
    function toggleMsgRecipient(id, name) {
        var i = msgRecipients.uids.indexOf(String(id));
        if (i >= 0) { msgRecipients.uids.splice(i, 1); msgRecipients.names.splice(i, 1); }
        else { msgRecipients.uids.push(String(id)); msgRecipients.names.push(name); }
        loadMsgRecipients(1);
    }
    function confirmMsgRecipients() {
        renderMsgComposeForm(null);
        refreshMsgRecNames();
    }
    function submitMsgSend(isSend) {
        var title = $('msg-title').value.trim();
        var content = $('msg-content').value.trim();
        if (!title) { toast('请填写标题'); return; }
        var data = { title: title, content: content, type: msgRecipients.type, file_ids: '' };
        if (msgRecipients.type === 1) {
            if (!msgRecipients.uids.length) { toast('请选择收件人'); return; }
            data.uids = msgRecipients.uids.join(',');
            data.person_name = msgRecipients.names.join(',');
        } else if (msgRecipients.type === 2) { data.dids = msgRecipients.dids || ''; }
        else if (msgRecipients.type === 3) { data.pids = msgRecipients.pids || ''; }
        var pid = $('msg-reply-pid').value;
        if (pid) { data.pid = pid; data.fid = pid; }
        var p = isSend ? API.messageSend(data) : API.messageSave(data);
        p.then(function (res) {
            if (res && res.code === 0) { toast(isSend ? '已发送' : '已存草稿'); App.renderMessagePage(msgState.tab); }
            else toast((res && res.msg) || '提交失败');
        }).catch(function () { toast('网络异常'); });
    }

    // ===== v1.1.0 新增：通讯录 =====
    var mailState = { page: 1, loading: false, done: false, rows: {} };
    function renderMailPage() {
        markListPage('mail');
        mailState = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        var phone = isPhone();
        var shell = phone
            ? '<div class="search-bar"><input id="mail-kw" type="text" placeholder="搜索姓名/手机号/部门"><span class="search-btn" onclick="App.loadMail()">搜索</span></div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">通讯录</div>' +
            '<div class="dt-toolbar-sub">按姓名 / 手机号 / 部门检索同事联系方式</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="mail-kw" type="text" placeholder="搜索姓名/手机号/部门"><button class="dt-search-btn" onclick="App.loadMail()">搜索</button></div>' +
            '</div></div>';
        c.innerHTML = shell + '<div id="mail-list"></div>';
        loadMail();
    }
    function loadMail() {
        var st = mailState;
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('mail-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('mail-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.mailList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
            var html = '';
            var phone = isPhone();
            for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card"><div class="card-title">' + esc(r.name || r.username || '') + (r.mobile ? '　' + esc(r.mobile) : '') + '</div>' +
                        '<div class="card-line">' + esc(r.position_id || '') + (r.email ? ' · ' + esc(r.email) : '') + '</div>' +
                        (r.desc ? '<div class="card-line">' + esc(r.desc) + '</div>' : '') +
                        '</div>';
                } else {
                    html += '<tr>' +
                        '<td><div class="td-strong">' + esc(r.name || r.username || '-') + '</div>' +
                        (r.desc ? '<div class="td-sub">' + esc(r.desc) + '</div>' : '') + '</td>' +
                        '<td class="td-num">' + esc(r.mobile || '-') + '</td>' +
                        '<td>' + esc(r.position_id || '-') + '</td>' +
                        '<td>' + esc(r.email || '-') + '</td>' +
                        '</tr>';
                }
            }
            box.innerHTML = phone ? html : (DT_HEAD.mail + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('mail'));
            if (!isPhone()) App.updatePagerDom('mail', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }

    // ===== v1.1.0 新增：基本资料 / 修改密码 =====
    function renderProfilePage() {
        markListPage('profile');
        var c = $('page-container');
        c.innerHTML =
            '<div class="detail-card"><div class="dc-label">昵称</div><input id="pf-nickname" class="form-input" type="text" placeholder="昵称"></div>' +
            '<div class="detail-card"><div class="dc-label">性别</div><select id="pf-sex" class="form-input"><option value="1">男</option><option value="2">女</option></select></div>' +
            '<div class="detail-card"><div class="dc-label">个人简介</div><textarea id="pf-desc" class="form-input" rows="4" placeholder="个人简介"></textarea></div>' +
            '<div style="padding:14px"><span class="act-btn" style="display:block;text-align:center" onclick="App.saveProfile()">保存</span></div>';
        API.indexInfo().then(function (res) {
            var d = (res && res.code === 0 && res.data) ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
            if (!d) return;
            if ($('pf-nickname')) $('pf-nickname').value = d.nickname || d.name || '';
            if ($('pf-sex')) $('pf-sex').value = String(d.sex || 1);
            if ($('pf-desc')) $('pf-desc').value = d.desc || '';
        }).catch(function () { /* 资料拉取失败保持表单空，可手动填写保存 */ });
    }
    function saveProfile() {
        var data = { nickname: $('pf-nickname').value.trim(), sex: $('pf-sex').value, desc: $('pf-desc').value.trim() };
        API.editPersonal(data).then(function (res) {
            if (res && res.code === 0) toast('保存成功');
            else toast((res && res.msg) || '保存失败');
        }).catch(function () { toast('网络异常'); });
    }
    function renderPasswordPage() {
        markListPage('password');
        var c = $('page-container');
        c.innerHTML =
            '<div class="detail-card"><div class="dc-label">原密码</div><input id="pw-old" class="form-input" type="password" placeholder="原密码"></div>' +
            '<div class="detail-card"><div class="dc-label">新密码</div><input id="pw-new" class="form-input" type="password" placeholder="新密码"></div>' +
            '<div class="detail-card"><div class="dc-label">确认新密码</div><input id="pw-new2" class="form-input" type="password" placeholder="再次输入新密码"></div>' +
            '<div style="padding:14px"><span class="act-btn" style="display:block;text-align:center" onclick="App.savePassword()">修改</span></div>';
    }
    function savePassword() {
        var o = $('pw-old').value, n = $('pw-new').value, n2 = $('pw-new2').value;
        if (!o || !n) { toast('请填写完整'); return; }
        if (n !== n2) { toast('两次新密码不一致'); return; }
        API.editPassword({ old_pwd: o, pwd: n, pwd_confirm: n2 }).then(function (res) {
            if (res && res.code === 0) { toast('密码修改成功'); App.switchTab('mine'); }
            else toast((res && res.msg) || '修改失败');
        }).catch(function () { toast('网络异常'); });
    }

    // ===== v1.1.0 新增：客户子功能（联系人/商机/跟进）=====
    var custSubState = {};
    function renderContactListPage() {
        markListPage('contact-list');
        custSubState['contact'] = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        var phone = isPhone();
        var head = phone
            ? '<div class="search-bar"><input id="ct-kw" type="text" placeholder="搜索联系人"><span class="search-btn" onclick="App.loadContactList()">搜索</span></div>' +
            '<div style="display:flex;gap:8px;padding:0 14px 6px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.openContactAdd()">＋ 新增联系人</span></div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">客户联系人</div>' +
            '<div class="dt-toolbar-sub">全部客户的联系人档案</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="ct-kw" type="text" placeholder="搜索联系人"><button class="dt-search-btn" onclick="App.loadContactList()">搜索</button></div>' +
            '<span class="oa-btn primary" onclick="App.openContactAdd()">＋ 新增联系人</span>' +
            '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.refreshList('contact-list')">刷新</span>' +
            '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.exportList('contact-list')">导出</span>' +
            '</div></div>';
        c.innerHTML = head + '<div id="contact-list"></div>';
        loadContactList();
    }
    function loadContactList() {
        var st = custSubState['contact'];
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('contact-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('ct-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.contactList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty retry" onclick="App.loadContactList();event.stopPropagation()">' + esc((res && res.msg) || '加载失败') + '，点击重试</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var phone = isPhone();
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card"><div class="card-title">' + esc(r.name || '') + (r.mobile ? '　' + esc(r.mobile) : '') + '</div>' +
                    '<div class="card-line">' + esc(r.customer || '') + (r.department ? ' · ' + esc(r.department) : '') + (r.position ? ' · ' + esc(r.position) : '') + '</div>' +
                    (r.wechat ? '<div class="card-line">微信：' + esc(r.wechat) + '</div>' : '') +
                    '<div style="padding-top:6px"><span class="act-btn" onclick="App.delContact(' + r.id + ')">删除</span></div>' +
                    '</div>';
                } else {
                    html += '<tr>' +
                    '<td><div class="td-strong">' + esc(r.name || '-') + '</div>' +
                    (r.position ? '<div class="td-sub">' + esc(r.position) + '</div>' : '') + '</td>' +
                    '<td class="td-num">' + esc(r.mobile || '-') + '</td>' +
                    '<td>' + esc(r.customer || '-') + '</td>' +
                    '<td>' + esc(r.department || '-') + '</td>' +
                    '<td>' + esc(r.wechat || r.email || '-') + '</td>' +
                    '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.delContact(' + r.id + ')">删除</span></td>' +
                    '</tr>';
                }
            }
            box.innerHTML = phone ? html : (DT_HEAD.contact + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('contact'));
            if (!isPhone()) App.updatePagerDom('contact', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    function openContactAdd() {
        regReplay(function () { App.openContactAdd(); });
        showDetailShell('新增联系人', function () { App.openMobile('contact-list'); });
        var c = $('page-container');
        c.innerHTML =
            '<div class="detail-card"><div class="dc-label">姓名 *</div><input id="ct-name" class="form-input" type="text" placeholder="姓名"></div>' +
            '<div class="detail-card"><div class="dc-label">手机</div><input id="ct-mobile" class="form-input" type="text" placeholder="手机"></div>' +
            '<div class="detail-card"><div class="dc-label">QQ</div><input id="ct-qq" class="form-input" type="text" placeholder="QQ"></div>' +
            '<div class="detail-card"><div class="dc-label">微信</div><input id="ct-wechat" class="form-input" type="text" placeholder="微信"></div>' +
            '<div class="detail-card"><div class="dc-label">邮箱</div><input id="ct-email" class="form-input" type="text" placeholder="邮箱"></div>' +
            '<div class="detail-card"><div class="dc-label">部门</div><input id="ct-dept" class="form-input" type="text" placeholder="部门"></div>' +
            '<div class="detail-card"><div class="dc-label">职位</div><input id="ct-pos" class="form-input" type="text" placeholder="职位"></div>' +
            '<div class="detail-card"><div class="dc-label">所属客户ID</div><input id="ct-cid" class="form-input" type="text" placeholder="客户ID（可在客户列表查看）"></div>' +
            '<div style="padding:14px"><span class="act-btn" style="display:block;text-align:center" onclick="App.submitContactAdd()">保存</span></div>';
    }
    function submitContactAdd() {
        var name = $('ct-name').value.trim();
        var cid = $('ct-cid').value.trim();
        if (!name) { toast('请填写姓名'); return; }
        var data = { name: name, mobile: $('ct-mobile').value.trim(), qq: $('ct-qq').value.trim(), wechat: $('ct-wechat').value.trim(), email: $('ct-email').value.trim(), department: $('ct-dept').value.trim(), position: $('ct-pos').value.trim() };
        if (cid) data.cid = cid;
        API.contactAdd(data).then(function (res) {
            if (res && res.code === 0) { toast('保存成功'); App.renderContactListPage(); }
            else toast((res && res.msg) || '保存失败');
        }).catch(function () { toast('网络异常'); });
    }
    function delContact(id) {
        uiConfirm('确定删除该联系人？', function () {
            API.contactDel(id).then(function (res) {
                if (res && res.code === 0) { toast('已删除'); App.loadContactList(); }
                else toast((res && res.msg) || '删除失败');
            }).catch(function () { toast('网络异常'); });
        });
    }
    function renderChanceListPage() {
        markListPage('chance-list');
        custSubState['chance'] = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        var phone = isPhone();
        var head = phone
            ? '<div class="search-bar"><input id="ch-kw" type="text" placeholder="搜索机会"><span class="search-btn" onclick="App.loadChanceList()">搜索</span></div>' +
            '<div style="display:flex;gap:8px;padding:0 14px 6px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.openChanceAdd()">＋ 新增机会</span></div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">销售机会</div>' +
            '<div class="dt-toolbar-sub">跟进中的商机与预计金额</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="ch-kw" type="text" placeholder="搜索机会"><button class="dt-search-btn" onclick="App.loadChanceList()">搜索</button></div>' +
            '<span class="oa-btn primary" onclick="App.openChanceAdd()">＋ 新增机会</span>' +
            '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.refreshList('chance-list')">刷新</span>' +
            '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.exportList('chance-list')">导出</span>' +
            '</div></div>';
        c.innerHTML = head + '<div id="chance-list"></div>';
        loadChanceList();
    }
    function loadChanceList() {
        var st = custSubState['chance'];
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('chance-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('ch-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.chanceList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var phone = isPhone();
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card"><div class="card-title">' + esc(r.title || r.name || '') + (r.amount ? '　¥ ' + esc(r.amount) : '') + '</div>' +
                    '<div class="card-line">' + esc(r.customer || r.customer_name || '') + (r.cate_title ? ' · ' + esc(r.cate_title) : '') + '</div>' +
                    '<div class="card-line">' + esc(r.status_text || '') + ' · ' + fmtTime(r.create_time) + '</div>' +
                    '<div style="padding-top:6px"><span class="act-btn" onclick="App.delChance(' + r.id + ')">删除</span></div>' +
                    '</div>';
                } else {
                    html += '<tr>' +
                    '<td><div class="td-strong">' + esc(r.title || r.name || '-') + '</div>' +
                    (r.cate_title ? '<div class="td-sub">' + esc(r.cate_title) + '</div>' : '') + '</td>' +
                    '<td>' + esc(r.customer || r.customer_name || '-') + '</td>' +
                    '<td class="td-num">' + (r.amount ? '¥ ' + esc(r.amount) : '-') + '</td>' +
                    '<td>' + esc(r.status_text || '-') + '</td>' +
                    '<td>' + fmtTime(r.create_time) + '</td>' +
                    '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.delChance(' + r.id + ')">删除</span></td>' +
                    '</tr>';
                }
            }
            box.innerHTML = phone ? html : (DT_HEAD.chance + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('chance'));
            if (!isPhone()) App.updatePagerDom('chance', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    function openChanceAdd() {
        regReplay(function () { App.openChanceAdd(); });
        showDetailShell('新增销售机会', function () { App.openMobile('chance-list'); });
        var c = $('page-container');
        var stageOpts = [['', '请选择'], ['0', '未设置'], ['1', '立项评估'], ['2', '初期沟通'], ['3', '需求分析'], ['4', '商务谈判'], ['5', '方案制定'], ['6', '合同签订'], ['7', '失单']];
        var stageHtml = '<select id="ch-stage" class="form-input">';
        for (var i = 0; i < stageOpts.length; i++) stageHtml += '<option value="' + stageOpts[i][0] + '">' + stageOpts[i][1] + '</option>';
        stageHtml += '</select>';
        c.innerHTML =
            '<div class="detail-card"><div class="dc-label">标题 *</div><input id="ch-title" class="form-input" type="text" placeholder="机会标题"></div>' +
            '<div class="detail-card"><div class="dc-label">客户ID</div><input id="ch-cid" class="form-input" type="text" placeholder="客户ID"></div>' +
            '<div class="detail-card"><div class="dc-label">客户联系人ID</div><input id="ch-contact-id" class="form-input" type="text" placeholder="联系人ID（可选）"></div>' +
            '<div class="detail-card"><div class="dc-label">阶段</div><div class="dc-value">' + stageHtml + '</div></div>' +
            '<div class="detail-card"><div class="dc-label">预计金额</div><input id="ch-amount" class="form-input" type="text" placeholder="预计金额"></div>' +
            '<div class="detail-card"><div class="dc-label">预计成交时间</div><input id="ch-expected-time" class="form-input" type="date"></div>' +
            '<div class="detail-card"><div class="dc-label">发现时间</div><input id="ch-discovery-time" class="form-input" type="date"></div>' +
            '<div class="detail-card"><div class="dc-label">产品名称</div><input id="ch-products" class="form-input" type="text" placeholder="产品名称"></div>' +
            '<div class="detail-card"><div class="dc-label">内容</div><textarea id="ch-content" class="form-input" rows="4" placeholder="机会内容"></textarea></div>' +
            '<div style="padding:14px"><span class="act-btn" style="display:block;text-align:center" onclick="App.submitChanceAdd()">保存</span></div>';
    }
    function submitChanceAdd() {
        var title = $('ch-title').value.trim();
        if (!title) { toast('请填写标题'); return; }
        var data = { title: title };
        if ($('ch-cid').value.trim()) data.cid = $('ch-cid').value.trim();
        if ($('ch-contact-id').value.trim()) data.contact_id = $('ch-contact-id').value.trim();
        data.stage = $('ch-stage').value || '0';
        if ($('ch-amount').value.trim()) data.expected_amount = $('ch-amount').value.trim();
        if ($('ch-expected-time').value.trim()) data.expected_time = $('ch-expected-time').value.trim();
        if ($('ch-discovery-time').value.trim()) data.discovery_time = $('ch-discovery-time').value.trim();
        if ($('ch-products').value.trim()) data.product_names = $('ch-products').value.trim();
        if ($('ch-content').value.trim()) data.content = $('ch-content').value.trim();
        API.chanceAdd(data).then(function (res) {
            if (res && res.code === 0) { toast('保存成功'); App.renderChanceListPage(); }
            else toast((res && res.msg) || '保存失败');
        }).catch(function () { toast('网络异常'); });
    }
    function delChance(id) {
        uiConfirm('确定删除该销售机会？', function () {
            API.chanceDel(id).then(function (res) {
                if (res && res.code === 0) { toast('已删除'); App.loadChanceList(); }
                else toast((res && res.msg) || '删除失败');
            }).catch(function () { toast('网络异常'); });
        });
    }
    function renderTraceListPage() {
        markListPage('trace-list');
        custSubState['trace'] = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        var phone = isPhone();
        var head = phone
            ? '<div class="search-bar"><input id="tr-kw" type="text" placeholder="搜索跟进内容"><span class="search-btn" onclick="App.loadTraceList()">搜索</span></div>' +
            '<div style="display:flex;gap:8px;padding:0 14px 6px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.openTraceAdd()">＋ 新增跟进</span></div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">跟进记录</div>' +
            '<div class="dt-toolbar-sub">客户跟进动态与下次联系安排</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="tr-kw" type="text" placeholder="搜索跟进内容"><button class="dt-search-btn" onclick="App.loadTraceList()">搜索</button></div>' +
            '<span class="oa-btn primary" onclick="App.openTraceAdd()">＋ 新增跟进</span>' +
            '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.refreshList('trace-list')">刷新</span>' +
            '<span class="oa-btn ghost" data-desktop-only="1" onclick="App.exportList('trace-list')">导出</span>' +
            '</div></div>';
        c.innerHTML = head + '<div id="trace-list"></div>';
        loadTraceList();
    }
    function loadTraceList() {
        var st = custSubState['trace'];
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('trace-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('tr-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.traceList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var phone = isPhone();
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card"><div class="card-title">' + esc(r.content || r.remark || '跟进记录') + '</div>' +
                    '<div class="card-line">' + esc(r.customer || '') + (r.type_name ? ' · ' + esc(r.type_name) : '') + '</div>' +
                    '<div class="card-line">' + esc(r.admin_name || '') + ' · ' + fmtTime(r.create_time || r.follow_time) + '</div>' +
                    '<div style="padding-top:6px"><span class="act-btn" onclick="App.delTrace(' + r.id + ')">删除</span></div>' +
                    '</div>';
                } else {
                    html += '<tr>' +
                    '<td><div class="td-strong">' + esc(r.customer || '-') + '</div>' +
                    '<div class="td-sub">' + esc(r.content || r.remark || '') + '</div></td>' +
                    '<td>' + esc(r.type_name || '-') + '</td>' +
                    '<td>' + esc(r.admin_name || '-') + '</td>' +
                    '<td>' + fmtTime(r.create_time || r.follow_time) + '</td>' +
                    '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.delTrace(' + r.id + ')">删除</span></td>' +
                    '</tr>';
                }
            }
            box.innerHTML = phone ? html : (DT_HEAD.trace + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('trace'));
            if (!isPhone()) App.updatePagerDom('trace', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    function openTraceAdd() {
        regReplay(function () { App.openTraceAdd(); });
        showDetailShell('新增跟进记录', function () { App.openMobile('trace-list'); });
        var c = $('page-container');
        var typeOpts = [['', '请选择'], ['0', '其他'], ['1', '电话'], ['2', '微信'], ['3', 'QQ'], ['4', '上门']];
        var typeHtml = '<select id="tr-type" class="form-input">';
        for (var i = 0; i < typeOpts.length; i++) typeHtml += '<option value="' + typeOpts[i][0] + '">' + typeOpts[i][1] + '</option>';
        typeHtml += '</select>';
        c.innerHTML =
            '<div class="detail-card"><div class="dc-label">跟进内容 *</div><textarea id="tr-content" class="form-input" rows="5" placeholder="跟进内容"></textarea></div>' +
            '<div class="detail-card"><div class="dc-label">跟进方式</div><div class="dc-value">' + typeHtml + '</div></div>' +
            '<div class="detail-card"><div class="dc-label">客户ID</div><input id="tr-cid" class="form-input" type="text" placeholder="客户ID"></div>' +
            '<div class="detail-card"><div class="dc-label">联系人ID</div><input id="tr-contact-id" class="form-input" type="text" placeholder="联系人ID（可选）"></div>' +
            '<div class="detail-card"><div class="dc-label">跟进时间</div><input id="tr-follow-time" class="form-input" type="date"></div>' +
            '<div class="detail-card"><div class="dc-label">下次跟进时间</div><input id="tr-next-time" class="form-input" type="date"></div>' +
            '<div style="padding:14px"><span class="act-btn" style="display:block;text-align:center" onclick="App.submitTraceAdd()">保存</span></div>';
    }
    function submitTraceAdd() {
        var content = $('tr-content').value.trim();
        if (!content) { toast('请填写跟进内容'); return; }
        var data = { content: content };
        if ($('tr-type').value) data.type = $('tr-type').value;
        if ($('tr-cid').value.trim()) data.cid = $('tr-cid').value.trim();
        if ($('tr-contact-id').value.trim()) data.contact_id = $('tr-contact-id').value.trim();
        if ($('tr-follow-time').value.trim()) data.follow_time = $('tr-follow-time').value.trim();
        if ($('tr-next-time').value.trim()) data.next_time = $('tr-next-time').value.trim();
        API.traceAdd(data).then(function (res) {
            if (res && res.code === 0) { toast('保存成功'); App.renderTraceListPage(); }
            else toast((res && res.msg) || '保存失败');
        }).catch(function () { toast('网络异常'); });
    }
    function delTrace(id) {
        uiConfirm('确定删除该跟进记录？', function () {
            API.traceDel(id).then(function (res) {
                if (res && res.code === 0) { toast('已删除'); App.loadTraceList(); }
                else toast((res && res.msg) || '删除失败');
            }).catch(function () { toast('网络异常'); });
        });
    }

    // ===== v1.1.0 新增：订单 / 样本 / 校展 / 售后 =====
    var orderState = {};
    function renderOrderMyPage() {
        markListPage('order-my');
        orderState['my'] = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        c.innerHTML = '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">订单（我申请的）</div>' +
            '<div class="dt-toolbar-sub">我提交的订单与审单进度</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="ord-kw" type="text" placeholder="搜索订单号/客户"><button class="dt-search-btn" onclick="App.loadOrderMy()">搜索</button></div>' +
            '</div></div><div id="ord-list"></div>';
        loadOrderMy();
    }
    function loadOrderMy() {
        var st = orderState['my'];
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('ord-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('ord-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.orderList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var __rk = Object.keys(st.rows).sort(function (a, b) { return Number(b) - Number(a); });
            for (var k2 = 0; k2 < __rk.length; k2++) {
                html += orderCardHtml(st.rows[__rk[k2]], 'my');
            }
            box.innerHTML = DT_HEAD.order + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('order-my'));
            if (!isPhone()) App.updatePagerDom('order-my', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    function renderOrderHandlePage() {
        markListPage('order-handle');
        orderState['handle'] = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        c.innerHTML = '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">订单（我处理的）</div>' +
            '<div class="dt-toolbar-sub">待我审单的订单</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="ordh-kw" type="text" placeholder="搜索订单号/客户"><button class="dt-search-btn" onclick="App.loadOrderHandle()">搜索</button></div>' +
            '</div></div><div id="ordh-list"></div>';
        loadOrderHandle();
    }
    function loadOrderHandle() {
        var st = orderState['handle'];
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('ordh-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('ordh-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.orderHandleList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var __rk = Object.keys(st.rows).sort(function (a, b) { return Number(b) - Number(a); });
            for (var k2 = 0; k2 < __rk.length; k2++) {
                html += orderCardHtml(st.rows[__rk[k2]], 'handle');
            }
            box.innerHTML = DT_HEAD.order + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('order-handle'));
            if (!isPhone()) App.updatePagerDom('order-handle', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    var curOrderKind = 'handle';
    var curOrderDetailId = null;
    function openOrderDetail(id, kind) {
        regReplay(function () { App.openOrderDetail(id, kind); });
        curOrderKind = kind || 'handle';
        curOrderDetailId = id;
        var st = orderState[kind];
        var r = st && st.rows[id];
        showDetailShell(r ? (r.title || '订单审单') : '订单审单', function () { App.openMobile(kind === 'my' ? 'order-my' : 'order-handle'); });
        var c = $('page-container');
        c.innerHTML = '<div class="loading">加载中…</div>';
        // 用列表完整字段渲染基本信息；产品明细异步加载
        if (!r) { c.innerHTML = '<div class="empty">详情加载失败</div>'; return; }
        // 补拉电脑端详情 HTML（附件/审批流程/省市区县等列表接口没有的字段）；
        // “待我处理”列表额外按 id 精确拉一次列表行补齐金额等字段
        var rendered = false;
        if (r.is_cash !== undefined) { renderOrderAudit(r, c); rendered = true; }
        var tasks = [];
        if (curOrderKind !== 'my') {
            tasks.push(API.orderHandleList(1, 20, '', { id: id }).then(function (res) {
                var rows = (res && res.data) || [];
                for (var i = 0; i < rows.length; i++) {
                    if (String(rows[i].id) === String(id)) { mergeOrderExtra(r, rows[i]); break; }
                }
            }).catch(function () { }));
        }
        tasks.push(API.orderViewHtml(id).then(function (html) {
            mergeOrderExtra(r, parseOrderViewHtml(html, id) || {});
        }).catch(function () { }));
        var all = tasks.length, pending = 0;
        for (var ti = 0; ti < tasks.length; ti++) {
            tasks[ti].then(function () {
                pending++;
                if (pending < all || curOrderDetailId !== id) return;
                if (!r.files) r.files = [];
                if (rendered) {
                    // 已有可读内容时，若用户正在填写则不再重绘，避免覆盖输入
                    var ae = document.activeElement;
                    if (ae && ae.tagName && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && c.contains(ae)) return;
                }
                renderOrderAudit(r, c);
            });
        }
    }
    // 订单审核状态文案
    function orderStatusText(s) {
        return { 0: '待审核', 1: '审核中', 2: '审核通过待发货', 3: '审核不通过', 4: '已撤销', 5: '已发货', 10: '已作废' }[s] || '';
    }
    // ===== v1.1.53：与电脑端列表完全同款的字段文案映射 =====
    function orderCashText(v, amount) {
        if (amount !== undefined && !(parseFloat(amount) > 0)) return '-';
        return { 0: '未到账', 1: '部分到账', 2: '全部到账' }[Number(v)] || '-';
    }
    function orderPayText(v) { return { 1: '未打款', 2: '已打款' }[Number(v)] || '-'; }
    function orderInvoiceText(v, amount) {
        if (amount !== undefined && !(parseFloat(amount) > 0)) return '-';
        return { 1: '未开票', 2: '已申请，待开具', 3: '已开票' }[Number(v)] || '-';
    }
    // 金额统一保留两位小数（与电脑端展示一致）
    function money2(v) { var n = parseFloat(v); return isNaN(n) ? '-' : n.toFixed(2); }
    function orderGiftStatusText(v) { return { 1: '未采购', 2: '已采购' }[Number(v)] || '-'; }
    function orderCustomerTypeText(v) { return { 1: '终端', 2: '经销商' }[Number(v)] || '-'; }
    function orderPlaceText(v) { return { 1: '花湖', 2: '科技城', 3: '福建', 4: '外包', 5: '南京' }[Number(v)] || '-'; }
    // 电脑端列表“订单状态”列文案（field=type）
    function orderTypeText(v) {
        return {
            1: '等通知发货/代测', 2: '未发货', 3: '已发货', 4: '未给代测', 5: '已给代测',
            6: '订单移交', 7: '代测中', 8: '实验结题', 9: '待移交'
        }[Number(v)] || '';
    }
    function orderYnText(v) { return { 1: '是', 2: '否' }[Number(v)] || '-'; }
    function money(v, def) { return (v === null || v === undefined || v === '') ? (def === undefined ? '-' : def) : v; }
    // v1.1.67：详情页解析拿不到附件名时，按订单自带的 file_ids / other_file_ids 直接构造下载地址
    function filesFromIds(ids) {
        var arr = [];
        if (!ids) return arr;
        String(ids).split(',').forEach(function (id) {
            id = id.trim();
            if (!id || id === '0') return;
            arr.push({ id: id, name: '附件' + id, info: '', url: absUrl('/api/index/get_oss_file.html?id=' + id) });
        });
        return arr;
    }
    // v1.1.67：订单附件行（类型徽标 + 名称 + 大小时间 + 打开/转发）
    function orderFileRow(f) {
        var t = fileTypeInfo(f.name);
        var url = f.url || '';
        var nm = esc(f.name || '附件');
        var q = function (s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); };
        var acts = '';
        if (url) {
            acts = '<div class="ct-file-btns">' +
                '<span class="ct-file-btn" onclick="event.stopPropagation();App.openOrderFile(\'' + q(url) + '\', \'' + q(f.name || '附件') + '\')">打开</span>' +
                '<span class="ct-file-btn" onclick="event.stopPropagation();App.shareOrderFile(\'' + q(url) + '\', \'' + q(f.name || '附件') + '\')">转发</span>' +
                '</div>';
        }
        return '<div class="ct-file-item"' + (url ? ' onclick="App.openOrderFile(\'' + q(url) + '\', \'' + q(f.name || '附件') + '\')"' : '') + '>' +
            '<div class="ct-file-ft" style="background:' + t.c + '1a;color:' + t.c + '">' + esc(t.t) + '</div>' +
            '<div class="ct-file-body">' +
            '<div class="ct-file-nm">' + nm + '</div>' +
            (f.info ? '<div class="ct-file-in">' + esc(f.info) + '</div>' : '') +
            '</div>' + acts + '</div>';
    }
    // 订单附件：下载后用系统应用打开（PDF 阅读器 / WPS）
    function openOrderFile(url, name) {
        if (window.AndroidBridge && AndroidBridge.openFileWith) {
            try { AndroidBridge.openFileWith(url, name); return; } catch (e) {}
        }
        try { window.open(url, '_blank'); } catch (e) { toast('打开失败'); }
    }
    // 订单附件：转发（系统分享面板）
    function shareOrderFile(url, name) {
        if (window.AndroidBridge && AndroidBridge.shareFile) {
            try { AndroidBridge.shareFile(url, name); toast('正在准备转发：' + name); return; } catch (e) {}
        }
        webShare(url, name);
        toast('已开始下载：' + name);
    }
    // 详情页键值行（字段名与电脑端详情页一致）
    function orderKv(k, v, strong) {
        var val = (v === null || v === undefined || v === '') ? '-' : v;
        return '<div class="card-line"><span style="display:inline-block;min-width:78px;color:#8a8f99">' + esc(k) + '</span>' +
            (strong ? '<b>' + esc(String(val)) + '</b>' : esc(String(val))) + '</div>';
    }
    // 订单列表卡片：对齐电脑端列表主列（编号/客户/成交/到账/欠款/到账状态/打款/开票/负责人/时间）
    // v1.1.53：订单列表卡片字段与电脑端列表列一一对应（空值不显示）
    function orderCardHtml(r, kind) {
        var st = Number(r.check_status);
        var tagCls = (st === 0 || st === 1) ? 'tag-pending' : ((st === 2 || st === 5) ? 'tag-pass' : 'tag-reject');
        var stTxt = orderStatusText(st) || r.status_text || '';
        function amt(v) {
            if (v === null || v === undefined || v === '') return '';
            var n = parseFloat(v);
            return isNaN(n) ? '' : n.toFixed(2);
        }
        var items = [];
        function add(k, v) {
            if (v === undefined || v === null) return;
            var s = String(v).replace(/\s+/g, ' ').trim();
            if (!s || s === '-') return;
            items.push(k + ' <b>' + esc(s) + '</b>');
        }
        add('ID号', r.id);
        add('快递单号', r.delivery);
        add('订单编号', r.code);
        add('订单成交时间', fmtTime(r.deal_time || r.create_time));
        add('关联客户', r.customer_name || r.name);
        add('是否到账', orderCashText(r.is_cash, r.amount));
        add('订单状态', orderTypeText(r.type));
        add('是否开票', orderInvoiceText(r.is_invoice, r.amount));
        add('退款金额(元)', amt(r.refund_amount));
        add('欠款金额(元)', amt(r.arrears_amount));
        add('到账金额(元)', amt(r.enter_amount));
        add('订单实际金额(元)', amt(r.amount));
        add('成交金额(元)', amt(r.deal_amount));
        add('抵扣券金额(元)', amt(r.deduction));
        add('到账时间', r.enter_time);
        add('实验项目', r.experiment_data && r.experiment_data.experimental_project);
        add('关联主体', r.order_subject_name);
        add('发货地点', orderPlaceText(r.order_type));
        add('撤销的理由', r.check_remark);
        add('备注', r.remark);
        add('来源', r.source_text || r.source);
        add('是否首单', orderYnText(r.is_first_order));
        add('复购订单', orderYnText(r.is_repurchase));
        add('收件姓名', r.recipient_name);
        add('收件号码', r.recipient_phone);
        add('收件地址', r.recipient_address);
        add('寄件姓名', r.sender_name);
        add('寄件号码', r.sender_phone);
        add('寄件地址', r.sender_address);
        add('打款公司', r.payment_company);
        add('礼品栏', r.gift);
        add('礼品状态', orderGiftStatusText(r.gift_status));
        add('礼品订单号', r.gift_code);
        add('礼品订单金额', amt(r.gift_amount));
        add('客户类型', orderCustomerTypeText(r.customer_type));
        add('申请人', r.name);
        add('所属部门', r.department_name);
        add('申请时间', r.create_time);
        add('当前审核人', r.check_user);
        add('负责人', r.director_name);
        add('协助人员', r.assist_admin_names);
        add('发货人', r.open_name);
        add('发货时间', r.open_time);
        var subLine = '';
        if (r.code) subLine = '编号：' + esc(r.code) + (r.customer_name ? ' · ' + esc(r.customer_name) : '');
        else if (r.customer_name) subLine = esc(r.customer_name);
        var amtMain = amt(r.amount || r.deal_amount);
        return '<tr onclick="App.openOrderDetail(' + r.id + ',\'' + kind + '\')">' +
            '<td><div class="td-strong">' + esc(r.title || r.code || '订单') + '</div>' +
            (subLine ? '<div class="td-sub">' + subLine + '</div>' : '') + '</td>' +
            '<td class="td-num">' + (amtMain ? '¥ ' + amtMain : '-') + '</td>' +
            '<td><span class="tag ' + tagCls + '">' + esc(stTxt || '未知') + '</span></td>' +
            '<td>' + fmtTime(r.deal_time || r.create_time) + '</td>' +
            '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.openOrderDetail(' + r.id + ',\'' + kind + '\')">详情</span></td></tr>';
    }
    // HTML 解析结果补齐列表行缺失字段（列表行已有值优先，附件/审批记录始终取解析结果）
    function mergeOrderExtra(r, e) {
        if (!r || !e) return r;
        for (var k in e) {
            var ev = e[k];
            if (ev === null || ev === undefined || ev === '') continue;
            var rv = r[k];
            if (rv === null || rv === undefined || rv === '') r[k] = ev;
        }
        if (e.files && e.files.length) r.files = e.files;
        if (e.other_files && e.other_files.length) r.other_files = e.other_files;
        if (e.flow_nodes && e.flow_nodes.length) r.flow_nodes = e.flow_nodes;
        if (e.flow_records && e.flow_records.length) r.flow_records = e.flow_records;
        if (e.receipts && e.receipts.length) r.receipts = e.receipts;
        if (e.subject_options && e.subject_options.length) r.subject_options = e.subject_options;
        if (e.province_options && e.province_options.length) r.province_options = e.province_options;
        // 关联附件 id 串取更全的一方，避免用详情页单个 id 覆盖列表返回的完整附件集合
        if (e.file_ids && String(e.file_ids).length > String(r.file_ids || '').length) r.file_ids = e.file_ids;
        return r;
    }
    // 渲染审单页：基本信息(可编辑) + 产品明细(可编辑) + 保存/审核操作
    function renderOrderAudit(r, c) {
        var st = orderStatusText(r.check_status);
        var stColor = (r.check_status === 0) ? '#e6a23c' : (r.check_status === 5 ? '#52c41a' : (r.check_status === 3 || r.check_status === 10 ? '#f56c6c' : '#1E6FFF'));
        // v1.1.70：主表信息可折叠（默认收起，点击标题展开/收起），便于直接到达下方可修改区域
        var html = '<div class="detail-card" style="margin-top:8px">' +
            '<div class="card-title oc-fold-head" onclick="App.toggleOrderInfoFold()">' +
            '<span class="oc-fold-t">' + esc(r.title || r.code || '订单') + '</span>' +
            ' <span style="color:' + stColor + ';font-size:12px;background:' + stColor + '14;padding:2px 8px;border-radius:20px;flex:none">' + esc(st || ('状态' + r.check_status)) + '</span>' +
            '<span class="oc-fold-op" id="oc-fold-op">展开 ∨</span></div>' +
            '<div id="oc-main-info" style="display:none">' +
            orderKv('订单编号', r.code) +
            orderKv('成交客户', r.customer_name || r.name) +
            orderKv('客户类型', (r.customer_type !== null && r.customer_type !== undefined && r.customer_type !== '') ? orderCustomerTypeText(r.customer_type) : '') +
            orderKv('成交时间', r.deal_time) +
            orderKv('订单状态', r.order_state_text) +
            orderKv('发货地点', (r.order_type !== null && r.order_type !== undefined && r.order_type !== '') ? orderPlaceText(r.order_type) : '') +
            orderKv('发货单号', r.delivery_no) +
            orderKv('平台来源', r.source_text) +
            orderKv('收件地区', [r.province_text, r.city_text, r.dist_text].filter(function (x) { return !!x; }).join(' ')) +
            orderKv('成交金额', money2(r.deal_amount), true) +
            orderKv('实际金额', money2(r.amount), true) +
            orderKv('到账金额', money2(r.enter_amount)) +
            orderKv('欠款金额', money2(r.arrears_amount)) +
            orderKv('退款金额', money2(r.refund_amount)) +
            orderKv('是否到账', (r.is_cash !== null && r.is_cash !== undefined && r.is_cash !== '') ? orderCashText(r.is_cash) : '') +
            orderKv('是否打款', (r.is_pay !== null && r.is_pay !== undefined && r.is_pay !== '') ? orderPayText(r.is_pay) : '') +
            orderKv('是否开票', (r.is_invoice !== null && r.is_invoice !== undefined && r.is_invoice !== '') ? orderInvoiceText(r.is_invoice) : '') +
            orderKv('礼品状态', (r.gift_status !== null && r.gift_status !== undefined && r.gift_status !== '') ? orderGiftStatusText(r.gift_status) : '') +
            orderKv('礼品金额', r.gift_amount ? money2(r.gift_amount) : '') +
            orderKv('礼品订单号', r.gift_order_code) +
            orderKv('是否首单', (r.is_first_order !== null && r.is_first_order !== undefined && r.is_first_order !== '') ? orderYnText(r.is_first_order) : (r.first_text || '')) +
            orderKv('复购订单', (r.is_repurchase !== null && r.is_repurchase !== undefined && r.is_repurchase !== '') ? orderYnText(r.is_repurchase) : '') +
            orderKv('负责人', r.director_name) +
            orderKv('协助人', r.assist_name) +
            orderKv('开单人', r.open_name) +
            orderKv('当前审核人', r.check_user) +
            orderKv('抄送人', r.copy_name) +
            orderKv('下单时间', r.create_time) +
            orderKv('备注信息', r.remark_text) +
            (r.check_remark ? orderKv('审核意见', r.check_remark) : '') +
            '</div></div>';
        // ===== v1.1.66：销售协议（供货合同，服务端按订单生成的 Word 版）=====
        html += '<div class="card-title" style="padding:0 14px;margin-top:14px">销售协议（合同）</div>' +
            '<div class="ct-card ct-item" onclick="App.openSalesAgreement(' + r.id + ', \'' +
            esc(r.code || '') + '\', \'' + esc(r.customer_name || r.name || '') + '\')">' +
            '<div class="ct-ico">Word</div>' +
            '<div class="ct-body">' +
            '<div class="ct-name">销售协议（供货合同）</div>' +
            '<div class="ct-sub">Word 版 · 可打开编辑并转 PDF</div>' +
            '</div><span class="ct-arrow">›</span></div>';
        html += '<div class="card-title" style="padding:0 14px;margin-top:14px">订单信息（可直接修改，保存后生效）</div>';
        // 可编辑字段：主题/收件/寄件/礼品/回款公司/订单主题
        html += '<div class="form-card"><div class="form-row"><div class="form-label req">订单主题</div>' +
            '<input class="form-control" id="ai-title" type="text" value="' + esc(r.title || '') + '"></div></div>';
        html += '<div class="form-card"><div class="form-row"><div class="form-label">收件姓名</div>' +
            '<input class="form-control" id="ai-recipient_name" type="text" value="' + esc(r.recipient_name || '') + '"></div>' +
            '<div class="form-row"><div class="form-label">收件号码</div>' +
            '<input class="form-control" id="ai-recipient_phone" type="text" value="' + esc(r.recipient_phone || '') + '"></div>' +
            '<div class="form-row"><div class="form-label">收件地址</div>' +
            '<input class="form-control" id="ai-recipient_address" type="text" value="' + esc(r.recipient_address || '') + '"></div>' +
            // 收件地区：省/市/区县三级联动（与电脑端 provinceid/cityid/distid 一致，保存时提交 modify_order_info）
            '<div class="form-row"><div class="form-label">收件地区</div><div class="oc-region">' +
            '<select class="form-control oc-region-sel" id="ai-provinceid">' +
            '<option value="">请选择省份</option>' +
            (r.province_options || []).map(function (op) {
                return '<option value="' + esc(op.id) + '"' + (String(op.id) === String(r.provinceid || '') ? ' selected' : '') + '>' + esc(op.name) + '</option>';
            }).join('') +
            '</select>' +
            '<select class="form-control oc-region-sel" id="ai-cityid">' +
            '<option value="' + esc(r.cityid || '') + '" selected>' + esc(r.city_text || '请选择城市') + '</option></select>' +
            '<select class="form-control oc-region-sel" id="ai-distid">' +
            '<option value="' + esc(r.distid || '') + '" selected>' + esc(r.dist_text || '请选择区县') + '</option></select>' +
            '</div></div></div>';
        html += '<div class="form-card"><div class="form-row"><div class="form-label">寄件姓名</div>' +
            '<input class="form-control" id="ai-sender_name" type="text" value="' + esc(r.sender_name || '') + '"></div>' +
            '<div class="form-row"><div class="form-label">寄件号码</div>' +
            '<input class="form-control" id="ai-sender_phone" type="text" value="' + esc(r.sender_phone || '') + '"></div></div>';
        // 回款公司当前选中值：优先取详情页 id；列表行仅有名称时按名称反查选项 id
        var subjSel = String(r.order_subject || '');
        if (!subjSel && r.order_subject_name) {
            for (var si = 0; si < (r.subject_options || []).length; si++) {
                if (String((r.subject_options[si] || {}).name) === String(r.order_subject_name)) { subjSel = String(r.subject_options[si].id); break; }
            }
        }
        html += '<div class="form-card"><div class="form-row"><div class="form-label">打款公司</div>' +
            '<select class="form-control" id="ai-payment_company">' +
            '<option value="' + esc(r.payment_company || '') + '" selected>' + esc(r.payment_company || '加载中…') + '</option>' +
            '</select></div>' +
            '<div class="form-row"><div class="form-label">回款公司</div>' +
            '<select class="form-control" id="ai-order_subject">' +
            '<option value="">请选择回款公司</option>' +
            (r.subject_options || []).map(function (op) {
                return '<option value="' + esc(op.id) + '"' + (String(op.id) === String(subjSel) ? ' selected' : '') + '>' + esc(op.name) + '</option>';
            }).join('') +
            '</select></div>' +
            '<div class="form-row"><div class="form-label">备货</div><select class="form-control" id="ai-is_stock">' +
            '<option value=""' + (r.is_stock === '' || r.is_stock == null ? ' selected' : '') + '>未设置</option>' +
            '<option value="0"' + (r.is_stock == 0 ? ' selected' : '') + '>无需备货</option>' +
            '<option value="1"' + (r.is_stock == 1 ? ' selected' : '') + '>未备货</option>' +
            '<option value="2"' + (r.is_stock == 2 ? ' selected' : '') + '>已备货</option>' +
            '</select></div>' +
            '<div class="form-row"><div class="form-label">礼品栏</div>' +
            '<input class="form-control" id="ai-gift" type="text" value="' + esc(r.gift || '') + '"></div></div>';
        html += '<div class="card-title" style="padding:0 14px;margin-top:14px">产品明细（可直接修改，保存后生效）</div>';
        html += '<div id="ai-product-box"><div class="loading">产品加载中…</div></div>';
        // ===== v1.1.53：收款选项（电脑端表格，无数据时不展示）=====
        if (r.receipts && r.receipts.length) {
            var rh = ['收款金额', '收款日期', '逾期时间', '成交金额', '已到账金额', '申请项目', '付款方式', '备注信息'];
            html += '<div class="card-title" style="padding:0 14px;margin-top:14px">收款选项</div><div class="detail-card">';
            for (var qi = 0; qi < r.receipts.length; qi++) {
                var qrow = r.receipts[qi];
                for (var qj = 0; qj < qrow.length; qj++) {
                    html += orderKv(rh[qj] || ('列' + (qj + 1)), qrow[qj]);
                }
                if (qi < r.receipts.length - 1) html += '<div style="height:1px;background:#eef0f3;margin:6px 0"></div>';
            }
            html += '</div>';
        }
        // ===== v1.1.53：关联附件 / 其他附件（电脑端有的，手机端同步展示）=====
        // v1.1.67：附件可点开（PDF 用系统阅读器，Word/表格用 WPS）并可转发
        var fileHtml = '';
        var fileList = (r.files && r.files.length) ? r.files : filesFromIds(r.file_ids);
        var otherList = (r.other_files && r.other_files.length) ? r.other_files : filesFromIds(r.other_file_ids);
        for (var fi = 0; fi < fileList.length; fi++) fileHtml += orderFileRow(fileList[fi]);
        for (var fj = 0; fj < otherList.length; fj++) fileHtml += orderFileRow(otherList[fj]);
        if (fileHtml) {
            html += '<div class="card-title" style="padding:0 14px;margin-top:14px">关联附件 / 其他附件（' + ((r.files || []).length + (r.other_files || []).length) + '）</div>' +
                '<div class="detail-card">' + fileHtml + '</div>';
        }
        // ===== 审批流程（与电脑端 flowList 一致：初值取详情页解析，结构化节点到达后按官网规则重绘）=====
        var flowInit = '';
        for (var ni = 0; ni < (r.flow_nodes || []).length; ni++) {
            var fn0 = r.flow_nodes[ni] || {};
            var fnName = (typeof fn0 === 'string') ? fn0 : (fn0.name || '');
            var fnSt = (typeof fn0 === 'string') ? '' : (fn0.status || '');
            var fnCls = 'oc-flow-item';
            if (fnSt === '通过') fnCls += ' oc-flow-ok';
            else if (fnSt === '拒绝') fnCls += ' oc-flow-no';
            else if (fnSt === '当前审核') fnCls += ' oc-flow-cur';
            flowInit += '<div class="' + fnCls + '"><span class="oc-flow-name">' + esc(fnName) + '</span>' +
                (fnSt ? '<span class="oc-flow-st">' + esc(fnSt) + '</span>' : '') + '</div>';
        }
        html += '<div class="card-title" style="padding:0 14px;margin-top:14px">审批流程</div>' +
            '<div class="detail-card"><div class="oc-flow" id="oc-flow-box">' +
            (flowInit || '<div class="card-line" style="color:#8a919f">流程加载中…</div>') + '</div></div>';
        if (r.flow_records && r.flow_records.length) {
            html += '<div class="card-title" style="padding:0 14px;margin-top:14px">审批记录</div><div class="detail-card">';
            for (var ri = 0; ri < r.flow_records.length; ri++) {
                html += '<div class="card-line">' + esc(r.flow_records[ri]) + '</div>';
            }
            html += '</div>';
        }
        // 操作区
        html += '<div class="order-actions">' +
            '<span class="oa-btn oa-btn-primary" onclick="App.saveOrderAudit(' + r.id + ')"><span class="oa-btn-ico">💾</span>保存修改</span>' +
            '<span class="oa-btn oa-btn-danger" onclick="App.delOrder(' + r.id + ')"><span class="oa-btn-ico">🗑</span>删除</span></div>';
        // 审核操作区（与电脑端 formBtn 一致：审批意见通过/拒绝必填；当前节点为指定审批人(flow_type==0)时，
        // 通过前必须选择下一审批节点，选「指定下一审批人」时必须选择审批人）
        if (r.check_status === 0 || r.check_status === 1) {
            var needNode = (r.cur_flow_type === undefined || r.cur_flow_type === null || r.cur_flow_type === '') ? true : (Number(r.cur_flow_type) === 0);
            html += '<div class="card-title" style="padding:0 14px;margin-top:14px">审核操作</div>' +
                '<div class="form-card">' +
                '<div class="form-row textarea-row"><div class="form-label req">审批意见</div>' +
                '<textarea class="form-control" id="oc-content" rows="3" placeholder="请输入审批意见（通过/拒绝必填）"></textarea></div>' +
                (needNode ?
                    '<div class="form-row"><div class="form-label req">下一审批节点</div><div class="oc-radios">' +
                    '<label class="oc-radio"><input type="radio" name="oc_check_node" value="1" checked> 提交下一节点</label>' +
                    '<label class="oc-radio"><input type="radio" name="oc_check_node" value="2"> 指定下一审批人</label>' +
                    '</div></div>' +
                    '<div class="form-row" id="oc-admin-row" style="display:none"><div class="form-label req">下一审批人</div>' +
                    '<div class="oc-admin-pick" id="oc-admin-pick" onclick="App.pickOrderChecker(' + r.id + ')">请选择下一审批人</div></div>'
                    : '') +
                '</div>' +
                '<div class="oa-audit">' +
                '<span class="oa-btn oa-btn-success" onclick="App.doOrderCheck(' + r.id + ',1)"><span class="oa-btn-ico">✔</span>通过</span>' +
                '<span class="oa-btn oa-btn-warn" onclick="App.doOrderCheck(' + r.id + ',2)"><span class="oa-btn-ico">✖</span>拒绝</span>' +
                '<span class="oa-btn oa-btn-gray" onclick="App.doOrderCheck(' + r.id + ',3)"><span class="oa-btn-ico">↩</span>撤回</span>' +
                '</div>';
        }
        c.innerHTML = html;
        // 记录订单原始值（以表单实际渲染值为准：保存时仅提交发生变化的字段，值未变化后端会返回失败）
        orderAuditOrig = {};
        for (var oi = 0; oi < orderAuditFields.length; oi++) {
            var okey = orderAuditFields[oi];
            var oel = $('ai-' + okey);
            orderAuditOrig[okey] = (oel && oel.value != null) ? String(oel.value) : '';
        }
        // 审核操作区状态复位 + 下一审批节点单选交互 + 预拉流转节点（通过时选下一审批人用）
        orderAuditRow = r;
        orderAuditPicked = {};
        orderAuditNodes = [];
        var ocRadios = document.querySelectorAll('input[name="oc_check_node"]');
        for (var ori = 0; ori < ocRadios.length; ori++) {
            ocRadios[ori].onchange = function () {
                var arow = $('oc-admin-row');
                if (arow) arow.style.display = (this.value === '2') ? '' : 'none';
                if (this.value !== '2') orderAuditPicked = {};
            };
        }
        // 省市区三级联动（与电脑端 provinceid/cityid/distid 一致）
        (function bindRegion() {
            var pSel = $('ai-provinceid'), cSel = $('ai-cityid'), dSel = $('ai-distid');
            if (!pSel || !cSel || !dSel) return;
            function fill(sel, list, cur, tip) {
                var fh2 = '<option value="">' + (tip || '请选择') + '</option>';
                for (var i = 0; i < list.length; i++) {
                    fh2 += '<option value="' + esc(list[i].id) + '"' + (String(list[i].id) === String(cur || '') ? ' selected' : '') + '>' + esc(list[i].name) + '</option>';
                }
                sel.innerHTML = fh2;
            }
            function optName(row) { return row.district || row.city || row.name || ''; }
            pSel.onchange = function () {
                fill(cSel, [], '', '加载中…');
                fill(dSel, [], '', '请选择区县');
                if (!pSel.value) { fill(cSel, [], '', '请选择城市'); return; }
                API.regionCitys(pSel.value).then(function (res) {
                    var rows = (res && res.code === 0 && res.data) ? res.data : [], list = [];
                    for (var i = 0; i < rows.length; i++) list.push({ id: rows[i].id, name: optName(rows[i]) });
                    fill(cSel, list, '', '请选择城市');
                }).catch(function () { fill(cSel, [], '', '请选择城市'); });
            };
            cSel.onchange = function () {
                fill(dSel, [], '', '加载中…');
                if (!cSel.value) { fill(dSel, [], '', '请选择区县'); return; }
                API.regionDists(cSel.value).then(function (res) {
                    var rows = (res && res.code === 0 && res.data) ? res.data : [], list = [];
                    for (var i = 0; i < rows.length; i++) list.push({ id: rows[i].id, name: optName(rows[i]) });
                    fill(dSel, list, '', '请选择区县');
                }).catch(function () { fill(dSel, [], '', '请选择区县'); });
            };
            // 初始：按当前省份/城市回填市/区县选项（保留选中值）
            if (pSel.value) {
                API.regionCitys(pSel.value).then(function (res) {
                    var rows = (res && res.code === 0 && res.data) ? res.data : [], list = [];
                    for (var i = 0; i < rows.length; i++) list.push({ id: rows[i].id, name: optName(rows[i]) });
                    fill(cSel, list, r.cityid, '请选择城市');
                    if (cSel.value) {
                        API.regionDists(cSel.value).then(function (res2) {
                            var rows2 = (res2 && res2.code === 0 && res2.data) ? res2.data : [], list2 = [];
                            for (var j = 0; j < rows2.length; j++) list2.push({ id: rows2[j].id, name: optName(rows2[j]) });
                            fill(dSel, list2, r.distid, '请选择区县');
                        }).catch(function () {});
                    }
                }).catch(function () {});
            }
        })();
        if (r.check_status === 0 || r.check_status === 1) {
            API.orderFlowNodes(r.id).then(function (res) {
                orderAuditNodes = (res && res.code === 0 && res.data) ? res.data : [];
                renderOrderFlowBox(r, orderAuditNodes);
            }).catch(function () { orderAuditNodes = []; });
        } else {
            // 非待审状态也拉节点数据，按电脑端 flowList 规则补全审批流程展示
            API.orderFlowNodes(r.id).then(function (res) {
                renderOrderFlowBox(r, (res && res.code === 0 && res.data) ? res.data : []);
            }).catch(function () {});
        }
        // 打款公司下拉：按官网 get_customer_company_info 动态填充，保留当前选中值
        if (r.customer_id) {
            API.customerCompanyInfo(r.customer_id).then(function (res) {
                var sel = $('ai-payment_company');
                if (!sel || !res || res.code !== 0 || !res.data) return;
                var cur = sel.value, opts = ['<option value=""' + (cur ? '' : ' selected') + '>请选择打款公司</option>'];
                for (var ci = 0; ci < res.data.length; ci++) {
                    var row = res.data[ci] || {};
                    opts.push('<option value="' + esc(row.value) + '"' + (String(row.value) === String(cur) ? ' selected' : '') + '>' + esc(row.item || row.value) + '</option>');
                }
                if (cur) {
                    var has = false;
                    for (var hj = 0; hj < res.data.length; hj++) { if (String(res.data[hj].value) === String(cur)) { has = true; break; } }
                    if (!has) opts.push('<option value="' + esc(cur) + '" selected>' + esc(cur) + '</option>');
                }
                sel.innerHTML = opts.join('');
            }).catch(function () {});
        }
        // 加载产品明细
        API.orderProductData(r.id, r.product_ids || '', r.code || '').then(function (res) {
            var box = $('ai-product-box');
            if (!box) return;
            if (!res || res.code !== 0 || !res.data) { box.innerHTML = '<div class="empty">产品明细加载失败</div>'; return; }
            renderOrderProducts(res.data, box);
        }).catch(function () {
            var box = $('ai-product-box');
            if (!box) return;
            if (box) box.innerHTML = '<div class="empty">产品明细加载失败</div>';
        });
    }
    // 按电脑端 flowList 规则渲染审批流程：节点类型→审批人显示名 + 状态（当前审核高亮）
    // flow_type：1=部门负责人 2=上级部门负责人 3=多人或签 4=多人会签 5=指定审批人(流程名[姓名]) 0=指定审批人(姓名)
    function renderOrderFlowBox(r, nodes) {
        var box = $('oc-flow-box');
        if (!box || !nodes || !nodes.length) return;
        var cs = Number(r.check_status), sort = Number(r.cur_check_step_sort || 0);
        var h = '';
        for (var f = 0; f < nodes.length; f++) {
            var n = nodes[f] || {};
            var users = n.user_id_info || [];
            var name = '', st = '待审核', cls = 'oc-flow-item';
            if (n.flow_type == 1) name = '部门负责人';
            else if (n.flow_type == 2) name = '上级部门负责人';
            else if (n.flow_type == 3) name = '多人或签';
            else if (n.flow_type == 4) name = '多人会签';
            else if (n.flow_type == 5) name = (n.flow_name || '') + (users[0] ? ' [' + users[0].name + ']' : '');
            else name = users[0] ? users[0].name : (n.flow_name || '审批人');
            if (n.flow_type == 1 || n.flow_type == 2) {
                var cl = n.check_list || [];
                if (cl.length && cl[0].status == 1) st = '通过';
                else if (cl.length && cl[0].status == 2) st = '拒绝';
            } else {
                var ok = false, no = false, has = users.length > 0;
                for (var m = 0; m < users.length; m++) {
                    if (users[m].status == 1) { ok = true; break; }
                    if (users[m].status == 2) no = true;
                }
                if (ok) st = '通过';
                else if (no) st = '拒绝';
                else if (has) st = '待审核';
            }
            if (Number(n.sort) === sort && cs === 1) { st = '当前审核'; cls += ' oc-flow-cur'; }
            else if (st === '通过') cls += ' oc-flow-ok';
            else if (st === '拒绝') cls += ' oc-flow-no';
            h += '<div class="' + cls + '"><span class="oc-flow-name">' + esc(name) + '</span>' +
                '<span class="oc-flow-st">' + esc(st) + '</span></div>';
        }
        box.innerHTML = h;
    }
    // 渲染产品明细可编辑行（列与电脑端审单产品表格一一对应；缓存完整行，保存时提交全量字段避免后端清空）
    var orderProductRows = {};
    var PRODUCT_TEXT_FIELDS = [
        ['level', '档次'], ['title', '产品名称'], ['product_code', '产品代码'], ['choose_sample_type', '样本类型'],
        ['choose_storage_area', '存放区域'], ['application', '应用'], ['da', '分子量'], ['specifications', '规格'],
        ['unit', '单位'], ['order_no', '订单编号'], ['brand', '品牌'], ['batch_no', '批号'],
        ['species_eng_name', '种属英文名称'], ['eng_name', '英文简称'], ['concentration', '浓度点(数字+单位)'],
        ['remark', '产品特殊要求'], ['notes', '发货特殊要求']
    ];
    var PRODUCT_NUM_FIELDS = [['price', '成交单价'], ['num', '成交数量']];
    function renderOrderProducts(list, box) {
        orderProductRows = {};
        var h = '';
        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            orderProductRows[p.id] = p;
            h += '<div class="form-card">';
            for (var t = 0; t < PRODUCT_TEXT_FIELDS.length; t++) {
                var f = PRODUCT_TEXT_FIELDS[t][0], lb = PRODUCT_TEXT_FIELDS[t][1];
                h += '<div class="form-row"><div class="form-label">' + lb + '</div>' +
                    '<input class="form-control" data-pk="' + p.id + '" data-f="' + f + '" type="text" value="' + esc(p[f] == null ? '' : p[f]) + '"></div>';
            }
            // 产品货号：下拉（选项来自行数据 goods_no 数组，与电脑端 goods-no-select 一致）
            var goods = p.goods_no || [];
            h += '<div class="form-row"><div class="form-label">产品货号</div><select class="form-control" data-pk="' + p.id + '" data-f="choose_goods_no">' +
                '<option value="">请选择货号</option>' +
                goods.map(function (g) { return '<option value="' + esc(g) + '"' + (String(g) === String(p.choose_goods_no || '') ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') +
                '</select></div>';
            // 发货/代测（电脑端 shiportest-select）
            h += '<div class="form-row"><div class="form-label">发货/代测</div><select class="form-control" data-pk="' + p.id + '" data-f="shiportest">' +
                ['', '发货', '代测'].map(function (g) { return '<option value="' + g + '"' + (String(g) === String(p.shiportest || '') ? ' selected' : '') + '>' + (g || '请选择') + '</option>'; }).join('') +
                '</select></div>';
            // 含量/酶活/定性（电脑端 contentenzymequalitative-select）
            h += '<div class="form-row"><div class="form-label">含量/酶活/定性</div><select class="form-control" data-pk="' + p.id + '" data-f="contentenzymequalitative">' +
                ['', '含量', '酶活', '定性', '其他'].map(function (g) { return '<option value="' + g + '"' + (String(g) === String(p.contentenzymequalitative || '') ? ' selected' : '') + '>' + (g || '请选择') + '</option>'; }).join('') +
                '</select></div>';
            // 包装盒类型：下拉（选项来自行数据 box_type_arr，与电脑端 box-type-select 一致）
            var boxes = p.box_type_arr || [];
            if (p.box_type && boxes.indexOf(p.box_type) < 0) boxes = [p.box_type].concat(boxes);
            if (boxes.length || p.box_type) {
                h += '<div class="form-row"><div class="form-label">包装盒类型</div><select class="form-control" data-pk="' + p.id + '" data-f="box_type">' +
                    '<option value="">请选择包装盒类型</option>' +
                    boxes.map(function (g) { return '<option value="' + esc(g) + '"' + (String(g) === String(p.box_type || '') ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') +
                    '</select></div>';
            }
            for (var n = 0; n < PRODUCT_NUM_FIELDS.length; n++) {
                var nf = PRODUCT_NUM_FIELDS[n][0], nlb = PRODUCT_NUM_FIELDS[n][1];
                h += '<div class="form-row"><div class="form-label">' + nlb + '</div>' +
                    '<input class="form-control" data-pk="' + p.id + '" data-f="' + nf + '" type="number" value="' + esc(p[nf] == null ? '' : p[nf]) + '"></div>';
            }
            // 只读展示：成交总价/换货数量/退货数量/退款金额（电脑端同为只读列）
            h += '<div class="form-row"><div class="form-label">成交总价</div>' +
                '<input class="form-control" type="text" readonly value="' + esc(p.total == null ? '' : p.total) + '"></div>' +
                '<div class="form-row"><div class="form-label">换货数量</div>' +
                '<input class="form-control" type="text" readonly value="' + esc(p.exchange_num == null ? 0 : p.exchange_num) + '"></div>' +
                '<div class="form-row"><div class="form-label">退货数量</div>' +
                '<input class="form-control" type="text" readonly value="' + esc(p.refund_num == null ? 0 : p.refund_num) + '"></div>' +
                '<div class="form-row"><div class="form-label">退款金额</div>' +
                '<input class="form-control" type="text" readonly value="' + esc(p.refund_amount == null ? 0 : p.refund_amount) + '"></div>';
            h += '</div>';
        }
        box.innerHTML = h;
    }
    // 审单可修改字段（与官网 changeOrderInfo/modifyPCD 一致：含回款公司/打款公司/省市区下拉）
    var orderAuditFields = ['title', 'recipient_name', 'recipient_phone', 'recipient_address', 'provinceid', 'cityid', 'distid', 'sender_name', 'sender_phone', 'payment_company', 'order_subject', 'is_stock', 'gift'];
    var orderAuditOrig = {};
    // 审单审核操作区状态（与电脑端 formBtn 对应）
    var orderAuditRow = null;      // 当前审单订单行（取 cur_flow_type/cur_check_step_sort）
    var orderAuditNodes = [];      // 流转节点缓存（通过时选下一审批人）
    var orderAuditPicked = {};     // 已选下一审批人 {id,name}
    // 保存审单修改：仅提交发生变化的字段（官网 changeOrderInfo 亦为逐字段提交；值未变化时后端返回失败，故必须跳过未改动项）
    function saveOrderAudit(id) {
        var orig = orderAuditOrig || {};
        var jobs = [];
        for (var i = 0; i < orderAuditFields.length; i++) {
            var field = orderAuditFields[i];
            var el = $('ai-' + field);
            if (!el) continue;
            var v = el.value;
            if (v === undefined || v === null) v = '';
            if (String(orig[field] == null ? '' : orig[field]) === String(v)) continue; // 未修改，跳过
            jobs.push({ field: field, value: v });
        }
        // 产品明细：以服务端原始行基准，仅当有字段变化时才提交整表
        var byId = {};
        var inputs = document.querySelectorAll('#ai-product-box .form-control[data-pk]');
        for (var j = 0; j < inputs.length; j++) {
            var pk = inputs[j].getAttribute('data-pk');
            var f = inputs[j].getAttribute('data-f');
            if (!byId[pk]) byId[pk] = JSON.parse(JSON.stringify(orderProductRows[pk] || { id: pk }));
            byId[pk][f] = inputs[j].value;
        }
        var prodRows = [], changedProd = false;
        for (var k in byId) {
            var o = orderProductRows[k] || {}, n = byId[k], diff = false;
            for (var f2 in n) {
                if (String(o[f2] == null ? '' : o[f2]) !== String(n[f2] == null ? '' : n[f2])) { diff = true; break; }
            }
            if (diff) changedProd = true;
            prodRows.push(n);
        }
        if (!jobs.length && !changedProd) { toast('没有需要保存的修改'); return; }
        toast('正在保存…');
        var saveBasic = jobs.map(function (job) {
            return API.orderModifyInfo(id, job.field, job.value).then(function (res) {
                if (res && res.code !== 0) throw new Error((res.msg || job.field) + ' 保存失败');
                // v1.1.71：写回内存行与比对基准，刷新后直接显示新值
                var st2 = orderState[curOrderKind] || orderState['my'] || orderState['handle'];
                if (st2 && st2.rows && st2.rows[id]) st2.rows[id][job.field] = job.value;
                if (orderAuditOrig) orderAuditOrig[job.field] = job.value;
            });
        });
        Promise.all(saveBasic).then(function () {
            if (!changedProd) { toast('保存成功'); refreshOrderAfterSave(id); return; }
            // 订单级参数：file_ids / product_ids 取列表行
            var ord = (orderState['my'] || orderState['handle']);
            var row = ord && ord.rows[id];
            var fileIds = (row && row.file_ids) || '';
            var prodIds = (row && row.product_ids) || prodRows.map(function (p) { return p.id; }).join(',');
            return API.orderModifyProduct(id, JSON.stringify(prodRows), fileIds, prodIds).then(function (res2) {
                if (res2 && res2.code !== 0) throw new Error((res2.msg || '产品明细') + ' 保存失败');
                toast('保存成功');
                refreshOrderAfterSave(id);
            });
        }).catch(function (e) { toast((e && e.message) || '保存失败'); });
    }
    function refreshOrderAfterSave(id) {
        var st = orderState[curOrderKind] || orderState['my'] || orderState['handle'];
        // v1.1.71：不再清空 rows（openOrderDetail 依赖 rows[id] 渲染，清空后重新打开会显示"详情加载失败"）
        //          改为保留该订单行，由 openOrderDetail 内部的列表/详情页补拉任务刷新最新数据
        if (st) {
            if (!st.rows) st.rows = {};
            if (!st.rows[id]) st.rows[id] = { id: id };
            // 列表首屏下次进入时重新加载，保证列表状态同步
            st.page = 1; st.done = false;
        }
        openOrderDetail(id, curOrderKind);
    }
    // v1.1.70：订单主表信息展开/收起
    function toggleOrderInfoFold() {
        var body = $('oc-main-info');
        var op = $('oc-fold-op');
        if (!body) return;
        var show = body.style.display === 'none';
        body.style.display = show ? '' : 'none';
        if (op) op.textContent = show ? '收起 ∧' : '展开 ∨';
    }
    // ===== v1.1.66 销售协议（供货合同）：详情壳承载，返回逐级回到订单详情 =====
    function openDocShell(title, backFn) {
        showDetailShell(title || '销售协议', function () {
            if (backFn) backFn();
            else App.switchTab(currentTab || 'home');
        });
    }
    // 订单详情「销售协议（合同）」入口：进入 App 内 Word 编辑页
    function openSalesAgreement(orderId, code, customer) {
        Doc.openSalesAgreement(orderId, {
            code: code || '',
            customer: customer || '',
            title: '销售协议',
            kind: curOrderKind || 'handle'
        });
    }
    // 审核操作（与电脑端 formBtn 逐条对齐）：
    // 通过(check=1)/拒绝(check=2)：审批意见必填；当前节点为指定审批人(flow_type==0)时，通过前必须选下一审批节点，
    //   选「指定下一审批人」时必须选审批人；官网确认文案后提交 /api/index/flow_check(type=5)
    // 撤回(check=3)：弹出「请输入撤回理由」（必填）后直接提交
    function doOrderCheck(id, check) {
        if (check === 3) {
            uiPrompt('请输入撤回理由', '请输入撤回理由', function (content) {
                if (content === null || content === undefined) return;
                if (String(content).trim() === '') { toast('请输入撤回理由'); return; }
                submitOrderCheck(id, 3, String(content).trim(), 0, '');
            });
            return;
        }
        var contentEl = $('oc-content');
        var content = contentEl ? String(contentEl.value || '').trim() : '';
        if (content === '') { toast('请输入审批意见'); return; }
        var check_node = 0, check_admin_ids = '';
        if (check === 1 && orderCurFlowType() === 0) {
            var pickedNode = '';
            var radios = document.querySelectorAll('input[name="oc_check_node"]');
            for (var i = 0; i < radios.length; i++) { if (radios[i].checked) { pickedNode = radios[i].value; break; } }
            if (!pickedNode) { toast('请选择下一审批节点'); return; }
            if (pickedNode === '2') {
                if (!orderAuditPicked || !orderAuditPicked.id) { toast('请选择下一审批人'); return; }
                check_admin_ids = String(orderAuditPicked.id);
            }
            check_node = Number(pickedNode);
        }
        uiConfirm(check === 1 ? '确定通过该审核？' : '确定拒绝该审核？', function () {
            submitOrderCheck(id, check, content, check_node, check_admin_ids);
        });
    }
    // 当前节点类型：优先取详情页隐藏域 flow_type；缺失时按流转节点当前步骤推断；均不可用按 0 处理（保留选人能力）
    function orderCurFlowType() {
        if (orderAuditRow && orderAuditRow.cur_flow_type !== undefined && orderAuditRow.cur_flow_type !== null && orderAuditRow.cur_flow_type !== '') {
            return Number(orderAuditRow.cur_flow_type);
        }
        var sort = orderAuditRow ? Number(orderAuditRow.cur_check_step_sort || 0) : 0;
        for (var i = 0; i < orderAuditNodes.length; i++) {
            var n = orderAuditNodes[i] || {};
            if (Number(n.sort) === sort) return Number(n.flow_type);
        }
        return 0;
    }
    // 选择下一审批人（电脑端 check_admin_ids employeepicker）：候选取当前节点之后第一个未通过的
    // 指定审批人(flow_type==0)节点成员；无则回退为全部节点成员去重
    function pickOrderChecker(id) {
        var nodes = orderAuditNodes || [];
        var list = [], seen = {}, seenCurrent = false;
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i] || {};
            if (Number(n.flow_type) !== 0) continue;
            var cl = n.check_list || [];
            var done = cl.length > 0 && cl[0] && cl[0].status === 1;
            if (done) continue;
            if (!seenCurrent) { seenCurrent = true; continue; }
            var users = n.user_id_info || [];
            for (var j = 0; j < users.length; j++) {
                var u = users[j] || {};
                if (u.id && !seen[u.id]) { seen[u.id] = 1; list.push({ id: u.id, name: u.name || ('ID:' + u.id) }); }
            }
            break;
        }
        if (!list.length) {
            for (var i2 = 0; i2 < nodes.length; i2++) {
                var users2 = (nodes[i2] || {}).user_id_info || [];
                for (var j2 = 0; j2 < users2.length; j2++) {
                    var u2 = users2[j2] || {};
                    if (u2.id && !seen[u2.id]) { seen[u2.id] = 1; list.push({ id: u2.id, name: u2.name || ('ID:' + u2.id) }); }
                }
            }
        }
        if (!list.length) { toast('暂无可选审批人'); return; }
        uiSelectUsers('请选择下一审批人', list, function (picked) {
            orderAuditPicked = { id: picked.id, name: picked.name };
            var pk = $('oc-admin-pick');
            if (pk) { pk.textContent = picked.name; pk.style.color = '#1E6FFF'; }
        });
    }
    function submitOrderCheck(id, check, content, check_node, check_admin_ids) {
        API.orderFlowCheck(id, check, content, check_node || 0, check_admin_ids || '').then(function (res) {
            if (res && res.code === 0) { toast(check === 3 ? '已撤回' : (check === 2 ? '已驳回' : '已通过')); openOrderDetail(id, curOrderKind); }
            else toast((res && res.msg) || '操作失败');
        }).catch(function () { toast('网络异常'); });
    }
    function delOrder(id) {
        uiConfirm('确定删除该订单记录吗？', function () {
            API.orderDelete(id).then(function (res) {
                if (res && res.code === 0) { toast('已删除'); App.switchTab('customer'); }
                else toast((res && res.msg) || '删除失败');
            }).catch(function () { toast('网络异常'); });
        });
    }

    // ===== 平台订单 =====
    var platOrderState = { page: 1, loading: false, done: false, rows: {} };
    function renderPlatformOrderPage() {
        markListPage('platform-order');
        platOrderState = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        var phone = isPhone();
        var head = phone
            ? '<div class="search-bar"><input id="po-kw" type="text" placeholder="搜索平台订单号/采购单位"><span class="search-btn" onclick="App.loadPlatformOrder()">搜索</span></div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">平台订单</div>' +
            '<div class="dt-toolbar-sub">第三方平台订单的登记与结算</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="po-kw" type="text" placeholder="搜索平台订单号/采购单位"><button class="dt-search-btn" onclick="App.loadPlatformOrder()">搜索</button></div>' +
            '</div></div>';
        c.innerHTML = head + '<div id="po-list"></div>';
        loadPlatformOrder();
    }
    function loadPlatformOrder() {
        var st = platOrderState;
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('po-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('po-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.platformOrderList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var phone = isPhone();
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card" onclick="App.openPlatformOrderDetail(' + r.id + ')"><div class="card-title">' + esc(r.platform_order_no || '平台订单') +
                    (r.is_mark == 1 ? ' <span style="color:#e6a23c">★</span>' : '') + '</div>' +
                    '<div class="card-line">' + esc(r.platform || '') + ' · ' + esc(r.purchase_unit || '') + '</div>' +
                    '<div class="card-line">采购：' + esc(r.purchase_amount || '0') + ' · 成交：' + esc(r.deal_amount || '0') + '</div>' +
                    '<div class="card-line">' + esc(r.processing_status_msg || '') + ' · ' + esc(r.settlement_method_msg || '') + '</div>' +
                    '<div class="card-line">' + esc(r.director_name || '') + ' · ' + fmtTime(r.order_time) + '</div>' +
                    '</div>';
                } else {
                    html += '<tr class="tr-click" onclick="App.openPlatformOrderDetail(' + r.id + ')">' +
                    '<td><div class="td-strong">' + esc(r.platform_order_no || '-') +
                    (r.is_mark == 1 ? ' <span style="color:#e6a23c">★</span>' : '') + '</div>' +
                    '<div class="td-sub">' + esc(r.platform || '-') + '</div></td>' +
                    '<td>' + esc(r.purchase_unit || '-') + '</td>' +
                    '<td class="td-num">' + esc(r.deal_amount || r.purchase_amount || '-') + '</td>' +
                    '<td>' + esc(r.processing_status_msg || '-') + '</td>' +
                    '<td>' + esc(r.director_name || '-') + '</td>' +
                    '<td>' + fmtTime(r.order_time) + '</td>' +
                    '</tr>';
                }
            }
            box.innerHTML = phone ? html : (DT_HEAD.platorder + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('platform-order'));
            if (!isPhone()) App.updatePagerDom('platform-order', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    // v1.1.56：列表行字段兜底渲染（详情接口不可用时使用）
    function platOrderRowHtml(r) {
        var rows = [
            ['平台订单号', r.platform_order_no], ['平台来源', r.platform], ['采购单位', r.purchase_unit],
            ['采购金额', r.purchase_amount], ['成交金额', r.deal_amount], ['订单号', r.order_code],
            ['负责人', r.director_name], ['处理状态', r.processing_status_msg], ['结算方式', r.settlement_method_msg],
            ['结算单号', r.settlement_no], ['快递单号', r.express_no], ['发票代码', r.invoice_code],
            ['是否开票', r.is_invoice == 3 ? '是' : (r.is_invoice == 2 ? '已申请待开具' : (r.is_invoice == 1 ? '否' : '-'))],
            ['是否到账', r.is_cash == 1 ? '部分到账' : (r.is_cash == 2 ? '已到账' : (r.is_cash == 0 ? '未到账' : '-'))],
            ['下单时间', fmtTime(r.order_time)], ['备注', r.remark]
        ];
        var h = '';
        for (var i = 0; i < rows.length; i++) {
            if (rows[i][1] !== undefined && rows[i][1] !== '' && rows[i][1] !== null) {
                h += '<div class="detail-card"><div class="dc-label">' + rows[i][0] + '</div><div class="dc-value">' + esc(rows[i][1]) + '</div></div>';
            }
        }
        return h;
    }
    function openPlatformOrderDetail(id) {
        regReplay(function () { App.openPlatformOrderDetail(id); });
        var r = platOrderState.rows[id];
        showDetailShell('平台订单详情', function () { App.openMobile('platform-order'); });
        var c = $('page-container');
        if (!c) return;
        c.innerHTML = '<div class="loading">加载中…</div>';
        var markBtn = r ? '<div style="padding:12px 14px"><span class="act-btn" style="width:100%;text-align:center;display:block" onclick="App.togglePlatformOrderMark(' + id + ')">' + (r.is_mark == 1 ? '取消标记' : '标记该订单') + '</span></div>' : '';
        API.platformOrderViewHtml(id).then(function (html) {
            var kv = parseKvTable(html);
            var h = '';
            for (var i = 0; i < kv.length; i++) {
                h += '<div class="detail-card"><div class="dc-label">' + esc(kv[i][0]) + '</div><div class="dc-value">' + esc(kv[i][1] || '-') + '</div></div>';
            }
            if (!h && r) h = platOrderRowHtml(r);
            c.innerHTML = (h || '<div class="empty">详情加载失败</div>') + markBtn;
        }).catch(function () {
            var h = r ? platOrderRowHtml(r) : '';
            c.innerHTML = (h || '<div class="empty">网络异常</div>') + markBtn;
        });
    }
    function togglePlatformOrderMark(id) {
        var r = platOrderState.rows[id];
        var next = (r && r.is_mark == 1) ? 0 : 1;
        API.platformOrderMark(id, next).then(function (res) {
            if (res && res.code === 0) {
                if (r) r.is_mark = next;
                openPlatformOrderDetail(id);
            } else {
                toast((res && res.msg) || '操作失败');
            }
        }).catch(function () { toast('网络异常'); });
    }
    function renderSamplePage() {
        markListPage('sample');
        orderState['sample'] = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        var phone = isPhone();
        var head = phone
            ? '<div class="search-bar"><input id="smp-kw" type="text" placeholder="搜索样本/单号"><span class="search-btn" onclick="App.loadSample()">搜索</span></div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">样本管理</div>' +
            '<div class="dt-toolbar-sub">测样样本的收退状态</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="smp-kw" type="text" placeholder="搜索样本/单号"><button class="dt-search-btn" onclick="App.loadSample()">搜索</button></div>' +
            '</div></div>';
        c.innerHTML = head + '<div id="sample-list"></div>';
        loadSample();
    }
    function loadSample() {
        var st = orderState['sample'];
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('sample-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('smp-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.sampleList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
            var html = '';
            var phone = isPhone();
            for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card"><div class="card-title">' + esc(r.title || r.code || '样本') + '</div>' +
                        '<div class="card-line">测样号：' + esc(r.measurement_no || '') + (r.processing_status ? ' · 处理：' + esc(r.processing_status) : '') + '</div>' +
                        '<div class="card-line">' + fmtTime(r.order_time) + (r.return_time ? ' · 退回：' + fmtTime(r.return_time) : '') + '</div>' +
                        '</div>';
                } else {
                    html += '<tr>' +
                    '<td><div class="td-strong">' + esc(r.title || r.code || '-') + '</div>' +
                    '<div class="td-sub">测样号：' + esc(r.measurement_no || '-') + '</div></td>' +
                    '<td>' + esc(r.processing_status || '-') + '</td>' +
                    '<td>' + fmtTime(r.order_time) + '</td>' +
                    '<td>' + (r.return_time ? fmtTime(r.return_time) : '-') + '</td>' +
                    '</tr>';
                }
            }
            box.innerHTML = phone ? html : (DT_HEAD.sample + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('sample'));
            if (!isPhone()) App.updatePagerDom('sample', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    var schoolTabCur = 0; // v1.1.72：0=校展预名单（我申请的） 1=我处理的，对齐电脑端两个菜单
    function renderSchoolPage() {
        markListPage('school');
        orderState['school'] = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        var phone = isPhone();
        var seg = '<div class="seg">' +
            '<div class="seg-item' + (schoolTabCur === 0 ? ' active' : '') + '" data-s="0" onclick="App.schoolTab(0)">校展预名单</div>' +
            '<div class="seg-item' + (schoolTabCur === 1 ? ' active' : '') + '" data-s="1" onclick="App.schoolTab(1)">我处理的</div>' +
            '</div>';
        var toolbar = phone
            ? '<div class="search-bar"><input id="sc-kw" type="text" placeholder="搜索校展"><span class="search-btn" onclick="App.loadSchool()">搜索</span></div>' +
            (schoolTabCur === 0 ? '<div style="display:flex;gap:8px;padding:0 14px 6px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.openSchoolAdd()">＋ 新增校展</span></div>' : '')
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">校展管理</div>' +
            '<div class="dt-toolbar-sub">' + (schoolTabCur === 0 ? '我申请的校展预名单' : '待我处理的校展') + '</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="sc-kw" type="text" placeholder="搜索校展"><button class="dt-search-btn" onclick="App.loadSchool()">搜索</button></div>' +
            (schoolTabCur === 0 ? '<span class="oa-btn primary" onclick="App.openSchoolAdd()">＋ 新增校展</span>' : '') +
            '</div></div>';
        c.innerHTML = toolbar + seg + '<div id="school-list"></div>';
        loadSchool();
    }
    function schoolTab(t) {
        t = parseInt(t) || 0;
        if (schoolTabCur === t) return;
        schoolTabCur = t;
        renderSchoolPage(); // 整页重建：分段高亮、新增按钮显隐、列表数据一起切换
    }
    function loadSchool() {
        var st = orderState['school'];
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('school-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('sc-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        var apiFn = schoolTabCur === 1 ? API.schoolHandleList : API.schoolList;
        apiFn(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var phone = isPhone();
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card" onclick="App.openSchoolDetail(' + r.id + ')"><div class="card-title">' + plain(r.title || '') + '　' + esc(r.status_msg || '') + '</div>' +
                    '<div class="card-line">' + esc(r.region || '') + (r.organizer ? ' · ' + esc(r.organizer) : '') + ' · ' + fmtTime(r.start_time) + (r.end_time ? ' ~ ' + fmtTime(r.end_time) : '') + '</div>' +
                    (r.budget ? '<div class="card-line">预算：' + esc(r.budget) + '</div>' : '') +
                    (schoolTabCur === 0 ? '<div style="padding-top:6px"><span class="act-btn" onclick="App.delSchool(' + r.id + ')">删除</span></div>' : '') +
                    '</div>';
                } else {
                    html += '<tr class="tr-click" onclick="App.openSchoolDetail(' + r.id + ')">' +
                    '<td><div class="td-strong">' + plain(r.title || '') + '</div>' +
                    '<div class="td-sub">' + esc(r.region || '-') + (r.organizer ? ' · ' + esc(r.organizer) : '') + '</div></td>' +
                    '<td>' + esc(r.status_msg || '-') + '</td>' +
                    '<td class="td-num">' + (r.budget ? '¥ ' + esc(r.budget) : '-') + '</td>' +
                    '<td>' + fmtTime(r.start_time) + (r.end_time ? ' ~ ' + fmtTime(r.end_time) : '') + '</td>' +
                    '<td class="td-ops">' + (schoolTabCur === 0 ? '<span class="dt-link" onclick="event.stopPropagation();App.delSchool(' + r.id + ')">删除</span>' : '-') + '</td>' +
                    '</tr>';
                }
            }
            box.innerHTML = phone ? html : (DT_HEAD.school + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('school'));
            if (!isPhone()) App.updatePagerDom('school', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    function openSchoolDetail(id) {
        regReplay(function () { App.openSchoolDetail(id); });
        var r = orderState['school'].rows[id];
        showDetailShell(r ? (r.title || '校展详情') : '校展详情', function () { App.openMobile('school'); });
        var c = $('page-container');
        var rows = [
            ['标题', r.title], ['地区', r.region], ['主办方', r.organizer], ['开始', fmtTime(r.start_time)], ['结束', fmtTime(r.end_time)],
            ['预算', r.budget], ['状态', r.status_msg], ['展品', r.exhibits], ['内容', r.content], ['要求', r.requirements], ['备注', r.remark], ['创建时间', fmtTime(r.create_time)]
        ];
        var h = '';
        for (var i = 0; i < rows.length; i++) {
            if (rows[i][1]) h += '<div class="detail-card"><div class="dc-label">' + rows[i][0] + '</div><div class="dc-value">' + esc(rows[i][1]) + '</div></div>';
        }
        c.innerHTML = h;
    }
    function openSchoolAdd() {
        regReplay(function () { App.openSchoolAdd(); });
        showDetailShell('新增校展', function () { App.openMobile('school'); });
        var c = $('page-container');
        var statusOpts = [['1', '计划中'], ['2', '筹备中'], ['3', '结束'], ['4', '已取消']];
        var typeOpts = [['0', '请选择'], ['1', '经销商参展'], ['2', '业务参展'], ['3', '经销商和业务一起参展']];
        var buildSel = function (id, opts) {
            var h = '<select id="' + id + '" class="form-input">';
            for (var i = 0; i < opts.length; i++) h += '<option value="' + opts[i][0] + '">' + opts[i][1] + '</option>';
            return h + '</select>';
        };
        c.innerHTML =
            '<div class="detail-card"><div class="dc-label">标题 *</div><input id="sc-title" class="form-input" type="text" placeholder="校展名称"></div>' +
            '<div class="detail-card"><div class="dc-label">状态</div><div class="dc-value">' + buildSel('sc-status', statusOpts) + '</div></div>' +
            '<div class="detail-card"><div class="dc-label">类型</div><div class="dc-value">' + buildSel('sc-type', typeOpts) + '</div></div>' +
            '<div class="detail-card"><div class="dc-label">地区</div><input id="sc-region" class="form-input" type="text" placeholder="地区"></div>' +
            '<div class="detail-card"><div class="dc-label">主办方</div><input id="sc-org" class="form-input" type="text" placeholder="主办方"></div>' +
            '<div class="detail-card"><div class="dc-label">开始时间</div><input id="sc-start" class="form-input" type="date"></div>' +
            '<div class="detail-card"><div class="dc-label">结束时间</div><input id="sc-end" class="form-input" type="date"></div>' +
            '<div class="detail-card"><div class="dc-label">预算</div><input id="sc-budget" class="form-input" type="text" placeholder="预算"></div>' +
            '<div class="detail-card"><div class="dc-label">展品</div><input id="sc-exhibits" class="form-input" type="text" placeholder="展品"></div>' +
            '<div class="detail-card"><div class="dc-label">内容</div><textarea id="sc-content" class="form-input" rows="4" placeholder="内容"></textarea></div>' +
            '<div class="detail-card"><div class="dc-label">要求</div><textarea id="sc-req" class="form-input" rows="3" placeholder="要求"></textarea></div>' +
            '<div class="detail-card"><div class="dc-label">备注</div><textarea id="sc-remark" class="form-input" rows="2" placeholder="备注"></textarea></div>' +
            '<div style="padding:14px"><span class="act-btn" style="display:block;text-align:center" onclick="App.submitSchoolAdd()">保存</span></div>';
    }
    function submitSchoolAdd() {
        var title = $('sc-title').value.trim();
        if (!title) { toast('请填写标题'); return; }
        var data = { title: title, region: $('sc-region').value.trim(), organizer: $('sc-org').value.trim(), start_time: $('sc-start').value, end_time: $('sc-end').value, budget: $('sc-budget').value.trim(), content: $('sc-content').value.trim(), requirements: $('sc-req').value.trim() };
        if ($('sc-status').value) data.status = $('sc-status').value;
        if ($('sc-type').value) data.type = $('sc-type').value;
        if ($('sc-exhibits').value.trim()) data.exhibits = $('sc-exhibits').value.trim();
        if ($('sc-remark').value.trim()) data.remark = $('sc-remark').value.trim();
        API.schoolAdd(data).then(function (res) {
            if (res && res.code === 0) { toast('保存成功'); App.renderSchoolPage(); }
            else toast((res && res.msg) || '保存失败');
        }).catch(function () { toast('网络异常'); });
    }
    function delSchool(id) {
        uiConfirm('确定删除该校展？', function () {
            API.schoolDelete(id).then(function (res) {
                if (res && res.code === 0) { toast('已删除'); App.loadSchool(); }
                else toast((res && res.msg) || '删除失败');
            }).catch(function () { toast('网络异常'); });
        });
    }
    function renderAfterPage() {
        markListPage('after');
        orderState['after'] = { page: 1, loading: false, done: false, rows: {} };
        var c = $('page-container');
        var phone = isPhone();
        var head = phone
            ? '<div class="search-bar"><input id="af-kw" type="text" placeholder="搜索售后"><span class="search-btn" onclick="App.loadAfter()">搜索</span></div>' +
            '<div style="display:flex;gap:8px;padding:0 14px 6px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.openAfterAdd()">＋ 新增售后</span></div>'
            : '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">售后管理</div>' +
            '<div class="dt-toolbar-sub">客户售后问题单与解决进度</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="af-kw" type="text" placeholder="搜索售后"><button class="dt-search-btn" onclick="App.loadAfter()">搜索</button></div>' +
            '<span class="oa-btn primary" onclick="App.openAfterAdd()">＋ 新增售后</span>' +
            '</div></div>';
        c.innerHTML = head + '<div id="after-list"></div>';
        loadAfter();
    }
    function loadAfter() {
        var st = orderState['after'];
        if (st.loading || st.done) return;
        st.loading = true;
        var box = $('after-list');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', '<div class="loading">加载中…</div>');
        var kw = (($('af-kw')) || {}).value || '';
        if (st.kw !== undefined && st.kw !== kw) { st.page = 1; st.done = false; st.rows = {}; }
        st.kw = kw;
        API.afterList(st.page, 20, kw).then(function (res) {
            if (!box) return;
            box.innerHTML = '';
            if (!res || res.code !== 0) { box.innerHTML = '<div class="empty">' + esc((res && res.msg) || '加载失败') + '</div>'; st.done = false; st.loading = false; return; }
            var rows = res.data || [];
            if (!rows.length) { box.innerHTML = '<div class="empty">暂无数据</div>'; st.done = true; return; }
                        for (var i = 0; i < rows.length; i++) { st.rows[rows[i].id] = rows[i]; }
            var html = '';
            var phone = isPhone();
            var __rk = Object.keys(st.rows);
            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                if (phone) {
                    html += '<div class="card" onclick="App.openAfterDetail(' + r.id + ')"><div class="card-title">' + esc(r.code || '售后') + (unboxField(r.is_solve, 'is_solve') === '是' ? '　✓已解决' : '') + '</div>' +
                    '<div class="card-line">' + esc(r.customer_name || '') + (r.customer_contact ? ' · ' + esc(r.customer_contact) : '') + '</div>' +
                    '<div class="card-line">' + fmtTime(r.create_time) + '</div>' +
                    '<div style="padding-top:6px"><span class="act-btn" onclick="App.delAfter(' + r.id + ')">删除</span></div>' +
                    '</div>';
                } else {
                    html += '<tr class="tr-click" onclick="App.openAfterDetail(' + r.id + ')">' +
                    '<td><div class="td-strong">' + esc(r.code || '-') + '</div>' +
                    '<div class="td-sub">' + esc(r.customer_name || '-') + (r.customer_contact ? ' · ' + esc(r.customer_contact) : '') + '</div></td>' +
                    '<td>' + (unboxField(r.is_solve, 'is_solve') === '是' ? '<span class="tag tag-pass">已解决</span>' : '<span class="tag tag-warn">处理中</span>') + '</td>' +
                    '<td>' + fmtTime(r.create_time) + '</td>' +
                    '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.delAfter(' + r.id + ')">删除</span></td>' +
                    '</tr>';
                }
            }
            box.innerHTML = phone ? html : (DT_HEAD.after + html + DT_TAIL);
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('after'));
            if (!isPhone()) App.updatePagerDom('after', (res && res.count) || Object.keys(st.rows).length);
        }).catch(function () { if (box) { box.innerHTML = '<div class="empty retry">网络异常，点击重试</div>'; st.loading = false; } });
    }
    function openAfterDetail(id) {
        regReplay(function () { App.openAfterDetail(id); });
        var r = orderState['after'].rows[id];
        showDetailShell(r ? (r.code || '售后详情') : '售后详情', function () { App.openMobile('after'); });
        var c = $('page-container');
        var rows = [
            ['单号', r.code], ['客户', r.customer_name], ['联系方式', r.customer_contact], ['订单', r.order_ids],
            ['实际实验样本类型', unboxField(r.sample_type, 'sample_type')],
            ['实际应用场景', unboxField(r.actual_app_scens, 'actual_app_scens')],
            ['问题初步描述', unboxField(r.problem_first_desc, 'problem_first_desc')],
            ['是否WB试剂盒', unboxField(r.is_wb_kit, 'is_wb_kit')],
            ['客户回访', unboxField(r.customer_follow_up, 'customer_follow_up')],
            ['抗体是否解决', unboxField(r.is_antibody_solve, 'is_antibody_solve')],
            ['问题具体类型(初判)', unboxField(r.specific_pre_type, 'specific_pre_type')],
            ['问题具体类型(终判)', unboxField(r.specific_type, 'specific_type')],
            ['问题来源(初判)', unboxField(r.source_pre, 'source_pre')],
            ['问题来源(终判)', unboxField(r.source, 'source')],
            ['售后分析', unboxField(r.after_analysis, 'after_analysis')],
            ['解决方案', unboxField(r.solution, 'solution')],
            ['技术分析', unboxField(r.technical_analysis, 'technical_analysis')],
            ['技术方案', unboxField(r.technical_solution, 'technical_solution')],
            ['是否解决', unboxField(r.is_solve, 'is_solve')],
            ['是否退款', unboxField(r.is_refund, 'is_refund')],
            ['创建时间', fmtTime(r.create_time)]
        ];
        var h = '';
        for (var i = 0; i < rows.length; i++) {
            if (rows[i][1]) h += '<div class="detail-card"><div class="dc-label">' + rows[i][0] + '</div><div class="dc-value" style="white-space:pre-wrap">' + esc(rows[i][1]) + '</div></div>';
        }
        c.innerHTML = h;
    }
    function openAfterAdd() {
        regReplay(function () { App.openAfterAdd(); });
        showDetailShell('新增售后', function () { App.openMobile('after'); });
        var c = $('page-container');
        c.innerHTML =
            '<div class="detail-card"><div class="dc-label">客户ID</div><input id="af-cid" class="form-input" type="text" placeholder="客户ID"></div>' +
            '<div class="detail-card"><div class="dc-label">客户名称</div><input id="af-cname" class="form-input" type="text" placeholder="客户名称"></div>' +
            '<div class="detail-card"><div class="dc-label">联系电话</div><input id="af-phone" class="form-input" type="text" placeholder="联系电话"></div>' +
            '<div class="detail-card"><div class="dc-label">订单ID</div><input id="af-oid" class="form-input" type="text" placeholder="订单ID"></div>' +
            '<div class="detail-card"><div class="dc-label">问题描述</div><textarea id="af-desc" class="form-input" rows="4" placeholder="问题描述"></textarea></div>' +
            '<div style="padding:14px"><span class="act-btn" style="display:block;text-align:center" onclick="App.submitAfterAdd()">保存</span></div>';
    }
    function submitAfterAdd() {
        var data = { customer_name: $('af-cname').value.trim(), customer_contact: $('af-phone').value.trim(), problem_first_desc: $('af-desc').value.trim() };
        if ($('af-cid').value.trim()) data.customer_id = $('af-cid').value.trim();
        if ($('af-oid').value.trim()) data.order_ids = $('af-oid').value.trim();
        if (!data.problem_first_desc) { toast('请填写问题描述'); return; }
        API.afterAdd(data).then(function (res) {
            if (res && res.code === 0) { toast('保存成功'); App.renderAfterPage(); }
            else toast((res && res.msg) || '保存失败');
        }).catch(function () { toast('网络异常'); });
    }
    function delAfter(id) {
        uiConfirm('确定删除该售后记录？', function () {
            API.afterDelete(id).then(function (res) {
                if (res && res.code === 0) { toast('已删除'); App.loadAfter(); }
                else toast((res && res.msg) || '删除失败');
            }).catch(function () { toast('网络异常'); });
        });
    }

    // ===== v1.1.0 新增：新增客户 =====
    var custEditId = 0;
    var custShare = { uids: [], names: [] };
    function renderCustomerAddPage(id) {
        custEditId = id || 0;
        custShare = { uids: [], names: [] };
        var c = $('page-container');
        var h = '';
        // 基本信息
        h += '<div class="form-group-title">基本信息</div>';
        h += '<div class="detail-card"><div class="dc-label">客户名称 *</div><input id="cu-name" class="form-input" type="text" placeholder="请输入客户名称"></div>';
        h += '<div class="detail-card"><div class="dc-label">是否加微</div><select id="cu-is-wechat" class="form-input"><option value="0">否</option><option value="1">是</option></select></div>';
        h += '<div class="detail-card"><div class="dc-label">客户来源 *</div><select id="cu-source" class="form-input">' + srcOpts() + '</select></div>';
        h += '<div class="detail-card"><div class="dc-label">联系地址 *</div><input id="cu-address" class="form-input" type="text" placeholder="请输入客户联系地址"></div>';
        h += '<div class="detail-card"><div class="dc-label">所属行业 *</div><select id="cu-industry" class="form-input">' + indOpts() + '</select></div>';
        h += '<div class="detail-card"><div class="dc-label">客户等级 *</div><select id="cu-grade" class="form-input">' + gradeOpts() + '</select></div>';
        h += '<div class="detail-card"><div class="dc-label">归属员工 *</div><input id="cu-belong-name" class="form-input" type="text" readonly placeholder="默认当前登录用户"></div>';
        h += '<div class="detail-card"><div class="dc-label">归属部门</div><input id="cu-belong-dept" class="form-input" type="text" readonly placeholder="自动带出"></div>';
        h += '<div class="detail-card"><div class="dc-label">共享员工</div><div class="dc-value" id="cu-share-names" style="font-size:14px;color:#333;min-height:20px;padding:4px 0">未设置</div><div style="padding:2px 0 8px"><span class="act-btn" style="padding:6px 14px" onclick="App.pickShareUsers()">选择共享人员</span></div></div>';
        // 客户介绍
        h += '<div class="form-group-title">客户介绍</div>';
        h += '<div class="detail-card"><div class="dc-label">客户介绍 *</div><textarea id="cu-content" class="form-input" rows="4" placeholder="请输入客户介绍信息"></textarea></div>';
        h += '<div class="detail-card"><div class="dc-label">经营业务</div><textarea id="cu-market" class="form-input" rows="3" placeholder="请输入客户主要经营业务"></textarea></div>';
        // 子公司信息
        h += '<div class="form-group-title">子公司信息</div>';
        h += '<div class="detail-card" style="padding:10px 14px"><div id="cu-subs"></div><span class="act-btn" style="display:block;text-align:center;padding:8px" onclick="App.addSubRow()">＋ 添加子公司记录</span></div>';
        // 首要联系人信息
        h += '<div class="form-group-title">首要联系人信息</div>';
        h += '<div class="detail-card"><div class="dc-label">联系人 *</div><input id="cu-c-name" class="form-input" type="text" placeholder="请输入联系人姓名"></div>';
        h += '<div class="detail-card"><div class="dc-label">联系电话 *</div><input id="cu-c-mobile" class="form-input" type="text" placeholder="请输入联系人电话"></div>';
        h += '<div class="detail-card"><div class="dc-label">性别 *</div><div class="dc-value" style="display:flex;gap:18px;padding:6px 0"><label style="display:flex;align-items:center;gap:4px"><input type="radio" name="cu-c-sex" value="1"> 男</label><label style="display:flex;align-items:center;gap:4px"><input type="radio" name="cu-c-sex" value="2"> 女</label></div></div>';
        h += '<div class="detail-card"><div class="dc-label">微信号</div><input id="cu-c-wechat" class="form-input" type="text" placeholder="请输入联系人微信号"></div>';
        h += '<div class="detail-card"><div class="dc-label">QQ号码</div><input id="cu-c-qq" class="form-input" type="text" placeholder="请输入联系人QQ号码"></div>';
        h += '<div class="detail-card"><div class="dc-label">电子邮箱</div><input id="cu-c-email" class="form-input" type="text" placeholder="请输入联系人电子邮箱"></div>';
        // 开票信息
        h += '<div class="form-group-title">开票信息</div>';
        h += '<div class="detail-card"><div class="dc-label">开户银行</div><input id="cu-bank" class="form-input" type="text" placeholder="请输入开户银行"></div>';
        h += '<div class="detail-card"><div class="dc-label">银行帐号</div><input id="cu-bank-sn" class="form-input" type="text" placeholder="请输入银行帐号"></div>';
        h += '<div class="detail-card"><div class="dc-label">银行网点</div><input id="cu-bank-branch" class="form-input" type="text" placeholder="请输入银行网点"></div>';
        h += '<div class="detail-card"><div class="dc-label">纳税人识别号</div><input id="cu-tax-num" class="form-input" type="text" placeholder="请输入纳税人识别号"></div>';
        h += '<div class="detail-card"><div class="dc-label">开票电话</div><input id="cu-cperson-mobile" class="form-input" type="text" placeholder="请输入开票电话"></div>';
        h += '<div class="detail-card"><div class="dc-label">开票地址</div><input id="cu-cperson-address" class="form-input" type="text" placeholder="请输入开票地址"></div>';
        // 沟通内容
        h += '<div class="form-group-title">沟通内容</div>';
        h += '<div class="detail-card"><div class="dc-label">备注</div><textarea id="cu-remark" class="form-input" rows="4" placeholder="请输入沟通内容"></textarea></div>';
        h += '<div style="padding:14px;display:flex;gap:8px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.submitCustomerAdd()">立即提交</span><span class="act-btn" style="flex:1;text-align:center;background:#f2f4f8;color:#555" onclick="App.renderCustomerAddPage(' + custEditId + ')">重置</span></div>';
        c.innerHTML = h;
        // 归属员工/部门默认当前登录账号（与桌面新增页一致：从 /customer/index/add.html 提取服务端默认值）
        API.customerAddDefaults().then(function (d) {
            var bn = $('cu-belong-name'), bd = $('cu-belong-dept');
            if (bn && !bn.value && d) {
                bn.value = d.belong_name || '';
                bn.setAttribute('data-uid', d.belong_uid || '');
                bn.setAttribute('data-did', d.belong_did || '');
            }
            if (bd && !bd.value && d) { bd.value = d.belong_department || ''; }
        }).catch(function () {
            // 兜底：indexInfo 用户信息
            API.indexInfo().then(function (res) {
                var u = (res && res.code === 0 && res.data) ? res.data : null;
                var bn = $('cu-belong-name'), bd = $('cu-belong-dept');
                if (u) {
                    if (bn && !bn.value) { bn.value = u.nickname || u.realname || u.username || ''; bn.setAttribute('data-uid', u.id || ''); bn.setAttribute('data-did', u.did || ''); }
                    if (bd && !bd.value) { bd.value = u.department_name || ''; }
                }
            }).catch(function () {});
        });
    }
    function srcOpts() {
        return '<option value="">请选择来源</option><option value="1">独立开发</option><option value="2">自媒体（星星分配）</option><option value="3">第三方（爱采购 阿仪网 丁香通）</option><option value="4">官方抖音号</option><option value="5">官方视频号</option><option value="6">官方小红书</option><option value="7">客户介绍</option><option value="8">官网</option><option value="9">官方公众号</option><option value="10">小红书（石安琪）</option><option value="11">小红书（李俐）</option>';
    }
    function indOpts() {
        return '<option value="">请选择行业</option><option value="1">工业品企业</option><option value="2">互联网企业</option><option value="3">服务行业</option><option value="4">消费品企业</option><option value="5">原材料企业</option><option value="6">农业企业</option><option value="7">科技企业</option><option value="8">其他行业</option>';
    }
    function gradeOpts() {
        return '<option value="">请选择等级</option><option value="1">AA类成交经销商</option><option value="2">A类客户(经营elisa并且沟通良好)</option><option value="7">休眠名单（仑）</option><option value="8">休眠名单（睿）</option><option value="9">休眠名单（优）</option><option value="10">休眠名单（博）</option><option value="11">无归属客户</option><option value="12">成交关联</option><option value="13">引流资源</option><option value="14">AA类成交终端</option><option value="15">成交代理</option>';
    }
    // 子公司记录行（对齐桌面 subsidiary_records_*）
    function subRowHtml(v) {
        v = v || {};
        function inp(key, label, val) {
            return '<div><div class="dc-label" style="margin-bottom:2px;font-size:12px">' + label + '</div><input data-f="' + key + '" class="form-input" type="text" value="' + esc(val || '') + '" style="font-size:13px"></div>';
        }
        var h = '<div class="sub-row" style="border:1px solid #e8ecf2;border-radius:10px;padding:8px;margin-bottom:10px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:13px">子公司记录</b><span class="act-btn" style="padding:4px 12px;background:#fff0f0;color:#e23" onclick="App.delSubRow(this)">删除</span></div>';
        h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
        h += inp('name', '子公司名称 *', v.name);
        h += inp('contact_name', '联系人', v.contact_name);
        h += inp('contact_mobile', '联系方式', v.contact_mobile);
        h += '<div style="grid-column:1/3">' + inp('address', '地址', v.address) + '</div>';
        h += inp('bank', '开户银行', v.bank);
        h += inp('bank_sn', '银行帐号', v.bank_sn);
        h += inp('bank_branch', '银行网点', v.bank_branch);
        h += '<div style="grid-column:1/3">' + inp('tax_num', '纳税人识别号', v.tax_num) + '</div>';
        h += inp('cperson_mobile', '开票电话', v.cperson_mobile);
        h += inp('cperson_address', '开票地址', v.cperson_address);
        h += '<div style="grid-column:1/3">' + inp('remarks', '备注', v.remarks) + '</div>';
        h += '</div></div>';
        return h;
    }
    function addSubRow(v) {
        var box = $('cu-subs');
        if (!box) return;
        if (box) box.insertAdjacentHTML('beforeend', subRowHtml(v || {}));
    }
    function delSubRow(btn) {
        var row = btn.closest ? btn.closest('.sub-row') : null;
        if (row && row.parentNode) row.parentNode.removeChild(row);
    }
    // 共享员工选择（复用通讯录接口）
    function pickShareUsers() {
        var ov = document.createElement('div');
        ov.id = 'share-overlay';
        ov.className = 'mask-overlay';
        ov.innerHTML = '<div class="mask-panel"><div class="section-title" style="padding:4px 2px">选择共享员工（可多选）</div>' +
            '<div class="search-bar"><input id="share-kw" type="text" placeholder="搜索姓名/手机号"><span class="search-btn" onclick="App.loadSharePicker(1)">搜索</span></div>' +
            '<div id="share-picker-list"></div>' +
            '<div style="display:flex;gap:8px;padding:14px 0 4px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.confirmShareUsers()">确定（已选 <span id="share-picked-count">0</span> 人）</span><span class="act-btn" style="flex:1;text-align:center;background:#f2f4f8;color:#555" onclick="App.closeSharePicker()">取消</span></div></div>';
        document.body.appendChild(ov);
        loadSharePicker(1);
    }
    function loadSharePicker(page) {
        var box = $('share-picker-list');
        if (!box) return;
        var kw = (($('share-kw')) || {}).value || '';
        API.mailList(page, 50, kw).then(function (res) {
            var rows = (res && res.code === 0 && res.data) ? res.data : [];
            if (page === 1) box.innerHTML = '';
            if (!rows.length) { if (page === 1) box.innerHTML = '<div class="empty">暂无人员</div>'; return; }
            var html = '';
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                var picked = custShare.uids.indexOf(String(r.id)) >= 0;
                html += '<div class="card" style="' + (picked ? 'border:1px solid #1677ff' : '') + '" onclick="App.toggleShareUser(' + r.id + ',\'' + esc(r.name || r.username || '') + '\')">' +
                    '<div class="card-title">' + esc(r.name || r.username || '') + (picked ? '　✓' : '') + '</div>' +
                    '<div class="card-line">' + esc(r.mobile || '') + (r.email ? ' · ' + esc(r.email) : '') + '</div></div>';
            }
            if (box) box.insertAdjacentHTML('beforeend', html);
            var pc = $('share-picked-count');
            if (pc) pc.textContent = custShare.uids.length;
        }).catch(function () { if (box) box.innerHTML = '<div class="empty">网络异常</div>'; });
    }
    function toggleShareUser(id, name) {
        var i = custShare.uids.indexOf(String(id));
        if (i >= 0) { custShare.uids.splice(i, 1); custShare.names.splice(i, 1); }
        else { custShare.uids.push(String(id)); custShare.names.push(name); }
        loadSharePicker(1);
    }
    function confirmShareUsers() {
        closeSharePicker();
        var box = $('cu-share-names');
        if (!box) return;
        if (box) box.textContent = custShare.names.length ? custShare.names.join('、') : '未设置';
    }
    function closeSharePicker() {
        var ov = document.getElementById('share-overlay');
        if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    }
    function submitCustomerAdd() {
        var name = $('cu-name').value.trim();
        if (!name) { toast('请填写客户名称'); return; }
        if (!$('cu-source').value) { toast('请选择客户来源'); return; }
        if (!$('cu-address').value.trim()) { toast('请填写联系地址'); return; }
        if (!$('cu-industry').value) { toast('请选择所属行业'); return; }
        if (!$('cu-grade').value) { toast('请选择客户等级'); return; }
        if (!$('cu-content').value.trim()) { toast('请填写客户介绍'); return; }
        var bn = $('cu-belong-name');
        if (!bn.value.trim()) { toast('请填写归属员工'); return; }
        if (!$('cu-c-name').value.trim()) { toast('请填写联系人姓名'); return; }
        if (!$('cu-c-mobile').value.trim()) { toast('请填写联系人电话'); return; }
        var sexEl = document.querySelector('input[name="cu-c-sex"]:checked');
        if (!sexEl) { toast('请选择联系人性别'); return; }
        var data = {
            name: name, is_add_wechat: $('cu-is-wechat').value,
            source_id: $('cu-source').value, address: $('cu-address').value.trim(),
            industry_id: $('cu-industry').value, grade_id: $('cu-grade').value,
            belong_name: bn.value.trim(), belong_uid: bn.getAttribute('data-uid') || '', belong_did: bn.getAttribute('data-did') || '',
            belong_department: ($('cu-belong-dept') || {}).value || '',
            share_names: custShare.names.join(','), share_ids: custShare.uids.join(','),
            content: $('cu-content').value.trim(), market: ($('cu-market') || {}).value.trim(),
            c_name: $('cu-c-name').value.trim(), c_mobile: $('cu-c-mobile').value.trim(), c_sex: sexEl.value,
            c_wechat: ($('cu-c-wechat') || {}).value.trim(), c_qq: ($('cu-c-qq') || {}).value.trim(), c_email: ($('cu-c-email') || {}).value.trim(),
            bank: ($('cu-bank') || {}).value.trim(), bank_sn: ($('cu-bank-sn') || {}).value.trim(), bank_branch: ($('cu-bank-branch') || {}).value.trim(),
            tax_num: ($('cu-tax-num') || {}).value.trim(), cperson_mobile: ($('cu-cperson-mobile') || {}).value.trim(), cperson_address: ($('cu-cperson-address') || {}).value.trim(),
            remark: ($('cu-remark') || {}).value.trim()
        };
        // 子公司记录（数组）
        var subs = { name: [], contact_name: [], contact_mobile: [], address: [], bank: [], bank_sn: [], bank_branch: [], tax_num: [], cperson_mobile: [], cperson_address: [], remarks: [] };
        var srows = document.querySelectorAll('#cu-subs .sub-row');
        for (var i = 0; i < srows.length; i++) {
            var ins = srows[i].querySelectorAll('input');
            for (var j = 0; j < ins.length; j++) {
                var f = ins[j].getAttribute('data-f');
                if (f && subs.hasOwnProperty(f)) subs[f].push(ins[j].value.trim());
            }
        }
        for (var k = 0; k < subs.name.length; k++) {
            if (!subs.name[k]) { toast('请填写第' + (k + 1) + '行子公司名称'); return; }
        }
        if (subs.name.length) {
            data.subsidiary_records_name = subs.name;
            data.subsidiary_records_contact_name = subs.contact_name;
            data.subsidiary_records_contact_mobile = subs.contact_mobile;
            data.subsidiary_records_address = subs.address;
            data.subsidiary_records_bank = subs.bank;
            data.subsidiary_records_bank_sn = subs.bank_sn;
            data.subsidiary_records_bank_branch = subs.bank_branch;
            data.subsidiary_records_tax_num = subs.tax_num;
            data.subsidiary_records_cperson_mobile = subs.cperson_mobile;
            data.subsidiary_records_cperson_address = subs.cperson_address;
            data.subsidiary_records_remarks = subs.remarks;
        }
        if (custEditId) data.id = custEditId;
        API.customerAdd(data).then(function (res) {
            if (res && res.code === 0) { toast('保存成功'); App.switchTab('customer'); }
            else toast((res && res.msg) || '保存失败');
        }).catch(function () { toast('网络异常'); });
    }
    function openCustomerEdit(id) {
        regReplay(function () { App.openCustomerEdit(id); });
        showDetailShell('编辑客户', function () { openCustomer(id); });
        var c = $('page-container');
        c.innerHTML = '<div class="loading">加载中…</div>';
        API.customerView(id).then(function (res) {
            var d = (res && res.code === 0 && res.data) ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
            if (!d) { c.innerHTML = '<div class="empty">客户详情加载失败</div>'; return; }
            renderCustomerAddPage(id);
            $('cu-name').value = d.name || '';
            $('cu-is-wechat').value = (d.is_add_wechat !== undefined && d.is_add_wechat !== null) ? String(d.is_add_wechat) : '0';
            $('cu-source').value = d.source_id || '';
            $('cu-address').value = d.address || '';
            $('cu-industry').value = d.industry_id || '';
            $('cu-grade').value = d.grade_id || '';
            var bn = $('cu-belong-name'), bd = $('cu-belong-dept');
            if (bn) { bn.value = d.belong_name || ''; bn.setAttribute('data-uid', d.belong_uid || ''); bn.setAttribute('data-did', d.belong_did || ''); }
            if (bd) bd.value = d.belong_department || '';
            if (d.share_names) { custShare.names = String(d.share_names).split(',').filter(Boolean); $('cu-share-names').textContent = custShare.names.join('、'); }
            if (d.share_ids) { custShare.uids = String(d.share_ids).split(',').filter(Boolean); }
            if (d.content) $('cu-content').value = d.content;
            if (d.market) $('cu-market').value = d.market;
            if (d.c_name) $('cu-c-name').value = d.c_name;
            if (d.c_mobile) $('cu-c-mobile').value = d.c_mobile;
            var sexEl = document.querySelector('input[name="cu-c-sex"][value="' + (d.c_sex || '1') + '"]');
            if (sexEl) sexEl.checked = true;
            if (d.c_wechat) $('cu-c-wechat').value = d.c_wechat;
            if (d.c_qq) $('cu-c-qq').value = d.c_qq;
            if (d.c_email) $('cu-c-email').value = d.c_email;
            if (d.bank) $('cu-bank').value = d.bank;
            if (d.bank_sn) $('cu-bank-sn').value = d.bank_sn;
            if (d.bank_branch) $('cu-bank-branch').value = d.bank_branch;
            if (d.tax_num) $('cu-tax-num').value = d.tax_num;
            if (d.cperson_mobile) $('cu-cperson-mobile').value = d.cperson_mobile;
            if (d.cperson_address) $('cu-cperson-address').value = d.cperson_address;
            if (d.remark) $('cu-remark').value = d.remark;
            var subs = (d.subsidiary_records && Array.isArray(d.subsidiary_records)) ? d.subsidiary_records : null;
            if (subs) {
                var sv = $('cu-subs');
                if (sv) sv.innerHTML = '';
                for (var s = 0; s < subs.length; s++) addSubRow(subs[s]);
            }
        }).catch(function () { c.innerHTML = '<div class="empty">网络异常</div>'; });
    }

    // ===== v1.1.0 新增：客户详情操作 =====
    function doCustomerToSea(id) {
        uiConfirm('确定将该客户移入公海？', function () {
            API.customerToSea(id).then(function (res) {
                if (res && res.code === 0) { toast('已移入公海'); App.switchTab('customer'); }
                else toast((res && res.msg) || '操作失败');
            }).catch(function () { toast('网络异常'); });
        });
    }
    function doCustomerTransfer(id) {
        uiPrompt('转移客户', '请输入接收员工的用户ID', function (uid) {
            if (!uid || !uid.trim()) return;
            API.customerTransfer({ id: id, uid: uid.trim() }).then(function (res) {
                if (res && res.code === 0) { toast('转移成功'); App.switchTab('customer'); }
                else toast((res && res.msg) || '转移失败');
            }).catch(function () { toast('网络异常'); });
        });
    }

    // ===== 我的 =====
    // v1.1.62：当前登录人中文姓名——桌面版首页用户区有 <cite>姓名</cite>，解析后缓存
    function fetchMyName(cb) {
        API.homePageHtml().then(function (html) {
            var name = '';
            var m = html && html.match(/<cite>([^<]{1,20})<\/cite>/);
            if (m) name = m[1].trim();
            if (name) { try { localStorage.setItem('uping_me_name', name); } catch (e) {} }
            if (cb) cb(name);
        }).catch(function () { if (cb) cb(''); });
    }
    function myDisplayName() {
        var n = '';
        try { n = localStorage.getItem('uping_me_name') || ''; } catch (e) {}
        if (n) return n;
        var me = null, savedU = null;
        try { me = JSON.parse(localStorage.getItem('uping_me') || 'null'); } catch (e) {}
        try { savedU = JSON.parse(localStorage.getItem('uping_saved_user') || 'null'); } catch (e) {}
        return (me && me.name) || (savedU && savedU.u) || '未登录';
    }
    function renderMine() {
        if (isPhone()) { renderMineMobile(); return; }
        var c = $('page-container');
        var savedU = null;
        try { savedU = JSON.parse(localStorage.getItem('uping_saved_user') || 'null'); } catch (e) {}
        var myName = myDisplayName();
        var myUid = (savedU && savedU.u) ? ('优品OA · 账号 ' + savedU.u) : '';
        var ava = myName ? myName.charAt(0).toUpperCase() : 'U';
        var html = '';
        // 顶部信息带
        html += '<div class="dt-hero"><div class="dt-hero-top">' +
            '<div style="display:flex;align-items:center;gap:16px"><div class="topbar-user-ava" style="width:52px;height:52px;font-size:20px">' + esc(ava) + '</div>' +
            '<div><div class="dt-hero-title">' + esc(myName) + '</div>' +
            '<div class="dt-hero-sub">' + esc(myUid || '优品OA 网页版') + '</div></div></div>' +
            '<div class="dt-hero-ops">' +
            '<span class="oa-btn" onclick="App.showSubPage(\'profile\')">基本资料</span>' +
            '<span class="oa-btn" onclick="App.showSubPage(\'password\')">修改密码</span>' +
            '</div></div></div>';
        html += '<div class="dt-cols-wide">';
        // 左列：财务管理 + 常用功能
        html += '<div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">财务管理</div></div><div class="dt-panel-body" style="padding:6px 12px">';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/advancedepositlog/index\')"><span class="mi-left">💰 预存款</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/deductionlog/index\')"><span class="mi-left">🎫 抵扣券（我申请的）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/deductionlog/checkedlist\')"><span class="mi-left">🎫 抵扣券（管理专用）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/margindepositlog/index\')"><span class="mi-left">🛡️ 保证金</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/invoice/index\')"><span class="mi-left">🧾 发票（我申请的）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/invoice/list\')"><span class="mi-left">🗂️ 发票（我处理的）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/income/index\')"><span class="mi-left">📊 到账（发票）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/orderapply/index\')"><span class="mi-left">📈 到账（订单）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/finance/orderapply/list\')"><span class="mi-left">⚙️ 到账（订单·我处理的）</span><span class="mi-right">›</span></div>';
        html += '</div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">常用功能</div></div><div class="dt-panel-body" style="padding:6px 12px">';
        html += '<div class="menu-item" onclick="App.showSubPage(\'message-inbox\')"><span class="mi-left">✉️ 消息中心</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\'mail\')"><span class="mi-left">📇 通讯录</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\'/oa/approve/index\')"><span class="mi-left">✅ 我的审批</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\'note\')"><span class="mi-left">📢 企业公告</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\'files\')"><span class="mi-left">📁 附件管理</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openWorkbench()"><span class="mi-left">🗂️ 工作台</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openDesktop()"><span class="mi-left">🖥️ 系统桌面版</span><span class="mi-right">›</span></div>';
        html += '</div></div></div>';
        // 右列：账号
        html += '<div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">账号</div></div><div class="dt-panel-body" style="padding:6px 12px">';
        html += '<div class="menu-item" onclick="App.showSubPage(\'profile\')"><span class="mi-left">👤 基本资料</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\'password\')"><span class="mi-left">🔒 修改密码</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.logout()"><span class="mi-left" style="color:#F53F3F">🚪 退出登录</span><span class="mi-right">›</span></div>';
        html += '</div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">系统</div></div><div class="dt-panel-body">';
        html += '<div class="dt-field"><div class="dt-field-label">版本</div><div class="dt-field-value">优品OA 网页版 ' + APP_VERSION + '</div></div>';
        html += '<div class="dt-field"><div class="dt-field-label">数据源</div><div class="dt-field-value">oa.upingbio.cn</div></div>';
        html += '<div class="dt-field"><div class="dt-field-label">界面</div><div class="dt-field-value">桌面版（窄屏自动回退手机布局）</div></div>';
        html += '</div></div>';
        html += '</div>';
        html += '</div>';
        c.innerHTML = html;
        deEmoji(c);
        // v1.1.62：还没有中文名缓存时拉一次桌面首页解析；拿到后若仍在"我的"页则重渲染
        var hasName = false;
        try { hasName = !!localStorage.getItem('uping_me_name'); } catch (e) {}
        if (!hasName) {
            fetchMyName(function (name) {
                if (name && currentTab === 'mine' && $('page-container')) renderMine();
            });
        }
    }

    // ===== 移动端「我的」：原生 App 导航中枢（资料头 + 功能宫格 + 账号菜单） =====
    function renderMineMobile() {
        var c = $('page-container');
        var savedU = null;
        try { savedU = JSON.parse(localStorage.getItem('uping_saved_user') || 'null'); } catch (e) {}
        var myName = myDisplayName();
        var myUid = (savedU && savedU.u) ? ('优品OA · 账号 ' + savedU.u) : '';
        var ava = myName ? myName.charAt(0).toUpperCase() : 'U';
        var html = '';
        // 个人资料头
        html += '<div class="m-profile">' +
            '<div class="m-profile-ava">' + esc(ava) + '</div>' +
            '<div class="m-profile-name">' + esc(myName) + '</div>' +
            '<div class="m-profile-sub">' + esc(myUid || '优品OA 网页版') + '</div>' +
            '</div>';
        // 财务管理宫格
        html += '<div class="m-section-title">财务管理</div>';
        html += '<div class="m-grid">';
        var fin = [
            { n: '预存款', i: 'wallet', run: "App.openFinance('/finance/advancedepositlog/index')" },
            { n: '抵扣券', i: 'ticket', run: "App.openFinance('/finance/deductionlog/index')" },
            { n: '抵扣券管理', i: 'ticket', run: "App.openFinance('/finance/deductionlog/checkedlist')" },
            { n: '保证金', i: 'shield', run: "App.openFinance('/finance/margindepositlog/index')" },
            { n: '发票(我申请)', i: 'receipt', run: "App.openFinance('/finance/invoice/index')" },
            { n: '发票(我处理)', i: 'archive', run: "App.openFinance('/finance/invoice/list')" },
            { n: '到账(发票)', i: 'file-text', run: "App.openFinance('/finance/income/index')" },
            { n: '到账(订单)', i: 'trending-up', run: "App.openFinance('/finance/orderapply/index')" },
            { n: '到账(处理)', i: 'settings', run: "App.openFinance('/finance/orderapply/list')" }
        ];
        for (var fi = 0; fi < fin.length; fi++) html += '<div class="m-grid-item" onclick="' + fin[fi].run + '"><div class="m-grid-ic">' + ic(fin[fi].i) + '</div><div class="m-grid-name">' + fin[fi].n + '</div></div>';
        html += '</div>';
        // 常用功能宫格
        html += '<div class="m-section-title">常用功能</div>';
        html += '<div class="m-grid">';
        var common = [
            { n: '消息中心', i: 'mail', run: "App.showSubPage('message-inbox')" },
            { n: '通讯录', i: 'book', run: "App.showSubPage('mail')" },
            { n: '我的审批', i: 'check-circle', run: "App.openFinance('/oa/approve/index')" },
            { n: '企业公告', i: 'megaphone', run: "App.showSubPage('note')" },
            { n: '附件管理', i: 'folder', run: "App.showSubPage('files')" },
            { n: '工作台', i: 'layers', run: "App.openWorkbench()" },
            { n: '基本资料', i: 'user-circle', run: "App.showSubPage('profile')" },
            { n: '修改密码', i: 'lock', run: "App.showSubPage('password')" }
        ];
        for (var ci2 = 0; ci2 < common.length; ci2++) html += '<div class="m-grid-item" onclick="' + common[ci2].run + '"><div class="m-grid-ic">' + ic(common[ci2].i) + '</div><div class="m-grid-name">' + common[ci2].n + '</div></div>';
        html += '</div>';
        // 账号
        html += '<div class="m-section-title">账号</div>';
        html += '<div class="m-menu-list">' +
            '<div class="menu-item" onclick="App.showSubPage(\'profile\')"><span class="mi-left"><span class="mli-ic">' + ic('user-circle') + '</span> 基本资料</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.showSubPage(\'password\')"><span class="mi-left"><span class="mli-ic">' + ic('lock') + '</span> 修改密码</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.logout()"><span class="mi-left" style="color:#F53F3F"><span class="mli-ic">' + ic('log-out') + '</span> 退出登录</span><span class="mi-right">›</span></div>' +
            '</div>';
        c.innerHTML = html;
        deEmoji(c);
        var hasName = false;
        try { hasName = !!localStorage.getItem('uping_me_name'); } catch (e) {}
        if (!hasName) {
            fetchMyName(function (name) {
                if (name && currentTab === 'mine' && $('page-container')) renderMine();
            });
        }
    }

    function openFinance(path) {
        var map = {
            '/finance/advancedepositlog/index': 'finance-advance',
            '/finance/income/index': 'finance-income',
            '/finance/orderapply/index': 'finance-order',
            '/finance/deductionlog/index': 'deduction',
            '/finance/deductionlog/checkedlist': 'deduction-checked',
            '/finance/margindepositlog/index': 'margin',
            '/finance/invoice/index': 'invoice-my',
            '/finance/invoice/list': 'invoice-handle',
            '/finance/orderapply/list': 'orderapply-handle'
        };
        if (map[path]) showSubPage(map[path]);
        else openOa(path);
    }
    function openDesktop() { openOa('/home/index/main.html'); }

    function logout() {
        uiConfirm('确定退出登录？', function () {
        stopMsgPollNative();
        try { OA.logout(); } catch (e) {}
        try { localStorage.removeItem('uping_user'); } catch (e) {}
        location.href = 'login.html';
        });
    }

    // 会话失效自动回登录页（API 层 detect 到"请先登录"时调用）
    function onSessionExpired() {
        stopMsgPollNative();
        if (msgPollTimer) { clearInterval(msgPollTimer); msgPollTimer = null; }
        try { localStorage.removeItem('uping_user'); localStorage.removeItem('uping_me'); } catch (e) {}
        try {
            localStorage.setItem('uping_boot_err', JSON.stringify({
                t: Date.now(), tag: '会话失效', m: '登录已过期，请重新登录', s: ''
            }));
        } catch (e) {}
        location.href = 'login.html';
    }

    // ===== 滚动加载 =====
    document.addEventListener('DOMContentLoaded', function () {
        var pc = document.getElementById('page-container');
        var pcAutoTick = 0;
        pc.addEventListener('scroll', function () {
            if (pcAutoTick) return;
            if (pc.scrollTop + pc.clientHeight < pc.scrollHeight - 40) return;
            // 触底：按当前列表"加载更多"按钮或产品列表对应的加载器自动加载（覆盖所有 Tab 与 openMobile 子页面，产品页无按钮时按 #product-list 触发）
            var moreEl = document.querySelector('#page-container .load-more');
            var prodEl = document.getElementById('product-list');
            if ((!moreEl && !prodEl) || !currentLoadKey || !LM[currentLoadKey]) return;
            pcAutoTick = 1;
            setTimeout(function () { pcAutoTick = 0; }, 1200);
            if (currentLoadArg != null) App.lm(currentLoadKey, currentLoadArg);
            else App.lm(currentLoadKey);
        });
    });

    return {
        init: init,
        lm: lm,
        moreBtn: moreBtn,
        pg: pg,
        pgSize: pgSize,
        refreshList: refreshList,
        reloadList: reloadList,
        exportList: exportList,
        injectToolbarOps: injectToolbarOps,
        injectRowSelection: injectRowSelection,
        updatePagerDom: updatePagerDom,
        pgJump: pgJump,
        pgReload: pgReload,
        tabActivate: tabActivate,
        tabClose: tabClose,
        toggleTableDensity: toggleTableDensity,
        renderTabStrip: renderTabStrip,
        onApproveFiles: onApproveFiles,
        pickApproveFile: pickApproveFile,
        removeApproveFile: removeApproveFile,
        retryApproveFile: retryApproveFile,
        onFilesUpload: onFilesUpload,
        pickFilesUpload: pickFilesUpload,
        back: back,
        refreshCaptcha: refreshCaptcha,
        doLogin: doLogin,
        switchTab: switchTab,
        launchApprove: launchApprove,
        openEntry: openEntry,
        openOa: openOa,
        openApproveFromMsg: openApproveFromMsg,
        openOrderFromMsg: openOrderFromMsg,
        openAiChat: openAiChat,
        openMobile: openMobile,
        openApproveType: openApproveType,
        filterApproveType: filterApproveType,
        openWorkbench: openWorkbench,
        openApproveForm: openApproveForm,
        onFlowChange: onFlowChange,
        toggleCheck: toggleCheck,
        submitApproveForm: submitApproveForm,
        loadNote: loadNote,
        openNoteDetail: openNoteDetail,
        loadArticle: loadArticle,
        openArticleDetail: openArticleDetail,
        loadProduct: loadProduct,
        resetProductFilter: resetProductFilter,
        toggleCatePanel: toggleCatePanel,
        ensureCatePanel: ensureCatePanel,
        applyCate: applyCate,
        cateRemove: cateRemove,
        hideCatePanel: hideCatePanel,
        renderCateTree: renderCateTree,
        cateToggle: cateToggle,
        cateCheck: cateCheck,
        cateSelectAll: cateSelectAll,
        cateClearAll: cateClearAll,
        openProductDetail: openProductDetail,
        previewDoc: previewDoc,
        openFavCenter: openFavCenter,
        renderFavCenter: renderFavCenter,
        newFolderInline: newFolderInline,
        createFolder: createFolder,
        openFolder: openFolder,
        previewFavDoc: previewFavDoc,
        removeDoc: removeDoc,
        delFolder: delFolder,
        showFolderPicker: showFolderPicker,
        renderFolderPickerList: renderFolderPickerList,
        saveDocToFolder: saveDocToFolder,
        packFav: packFav,
        shareDoc: shareDoc,
        shareFavDoc: shareFavDoc,
        shareChecked: shareChecked,
        sharePackFav: sharePackFav,
        updateCheckedCount: updateCheckedCount,
        toggleProductFav: toggleProductFav,
        isProductFav: isProductFav,
        reloadPage: reloadPage,
        detailBack: detailBack,
        loadFiles: loadFiles,
        openFile: openFile,
        loadFinanceOrder: loadFinanceOrder,
        loadFinanceAdvance: loadFinanceAdvance,
        loadFinanceIncome: loadFinanceIncome,
        loadFinanceInvoiceMy: loadFinanceInvoiceMy,
        loadFinanceInvoiceHandle: loadFinanceInvoiceHandle,
        loadFinanceOrderApplyHandle: loadFinanceOrderApplyHandle,
        loadApprove: loadApprove,
        openApproveDetail: openApproveDetail,
        doApproveCheck: doApproveCheck,
        loadCustomer: loadCustomer,
        openCustomer: openCustomer,
        custTab: custTab,
        custTabBy: custTabBy,
        openFinance: openFinance,
        openDesktop: openDesktop,
        logout: logout,
        onSessionExpired: onSessionExpired,
        showSubPage: showSubPage,
        renderApprove: renderApprove,
        renderMessagePage: renderMessagePage,
        openMsgTab: openMsgTab,
        loadMessage: loadMessage,
        openMsgDetail: openMsgDetail,
        msgDelete: msgDelete,
        openMsgCompose: openMsgCompose,
        openMsgComposeReply: openMsgComposeReply,
        setMsgType: setMsgType,
        pickMsgRecipients: pickMsgRecipients,
        loadMsgRecipients: loadMsgRecipients,
        toggleMsgRecipient: toggleMsgRecipient,
        confirmMsgRecipients: confirmMsgRecipients,
        submitMsgSend: submitMsgSend,
        loadMail: loadMail,
        saveProfile: saveProfile,
        savePassword: savePassword,
        loadContactList: loadContactList,
        openContactAdd: openContactAdd,
        submitContactAdd: submitContactAdd,
        delContact: delContact,
        loadChanceList: loadChanceList,
        openChanceAdd: openChanceAdd,
        submitChanceAdd: submitChanceAdd,
        delChance: delChance,
        loadTraceList: loadTraceList,
        openTraceAdd: openTraceAdd,
        submitTraceAdd: submitTraceAdd,
        delTrace: delTrace,
        loadOrderMy: loadOrderMy,
        loadOrderHandle: loadOrderHandle,
        renderOrderMyPage: renderOrderMyPage,
        renderOrderHandlePage: renderOrderHandlePage,
        openOrderDetail: openOrderDetail,
        renderPlatformOrderPage: renderPlatformOrderPage,
        loadPlatformOrder: loadPlatformOrder,
        openPlatformOrderDetail: openPlatformOrderDetail,
        togglePlatformOrderMark: togglePlatformOrderMark,
        loadSample: loadSample,
        loadSchool: loadSchool,
        schoolTab: schoolTab,
        openSchoolAdd: openSchoolAdd,
        submitSchoolAdd: submitSchoolAdd,
        delSchool: delSchool,
        openSchoolDetail: openSchoolDetail,
        loadAfter: loadAfter,
        openAfterAdd: openAfterAdd,
        submitAfterAdd: submitAfterAdd,
        delAfter: delAfter,
        openAfterDetail: openAfterDetail,
        submitCustomerAdd: submitCustomerAdd,
        renderCustomerAddPage: renderCustomerAddPage,
        pickShareUsers: pickShareUsers,
        loadSharePicker: loadSharePicker,
        confirmShareUsers: confirmShareUsers,
        toggleShareUser: toggleShareUser,
        closeSharePicker: closeSharePicker,
        addSubRow: addSubRow,
        delSubRow: delSubRow,
        doOrderCheck: doOrderCheck,
        pickOrderChecker: pickOrderChecker,
        saveOrderAudit: saveOrderAudit,
        toggleOrderInfoFold: toggleOrderInfoFold,
        openDocShell: openDocShell,
        openSalesAgreement: openSalesAgreement,
        openOrderFile: openOrderFile,
        shareOrderFile: shareOrderFile,
        openCustomerEdit: openCustomerEdit,
        doCustomerToSea: doCustomerToSea,
        doCustomerTransfer: doCustomerTransfer,
        delOrder: delOrder,
        renderContactListPage: renderContactListPage,
        renderChanceListPage: renderChanceListPage,
        renderTraceListPage: renderTraceListPage,
        renderSchoolPage: renderSchoolPage,
        renderAfterPage: renderAfterPage
    };
})();

// v1.1.55 修复（P1-5）：隐藏启动遮罩，避免首屏一直白屏
function hideBootSplash() {
    var el = document.getElementById('boot-splash');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
}

// v1.1.55 修复（P1-5）：初始化异常/运行期未捕获错误时给出可见提示与重试入口，不再白屏无反馈
function showBootError(msg) {
    var el = document.getElementById('boot-splash');
    var tip = document.getElementById('boot-tip');
    if (el) { el.style.display = 'flex'; el.style.opacity = '1'; }
    if (tip) {
        tip.innerHTML = (msg || '页面加载异常') + '，请检查网络后 <a href="javascript:location.reload()" style="color:#1E6FFF">点击重试</a>';
    }
}

/* 网页版：由 index.html 的内联启动脚本调用 App.init()（见文件末尾 console 提示） */
