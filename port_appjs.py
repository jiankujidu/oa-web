#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 App 源码 app.js 1:1 移植为网页版 public/app.js。
只做「外壳适配」补丁（登录态/原生桥/文档库路径），业务逻辑逐字保留。

用法: python port_appjs.py
源: ../oa_src/app/src/main/assets/www/js/app.js（App 源码，只读）
"""
import os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "..", "oa_src", "app", "src", "main", "assets", "www", "js", "app.js")
OUT = os.path.join(ROOT, "public", "app.js")

PRELUDE = r'''/* 优品OA 网页版 · 主逻辑（由 App 源码 app.js 1:1 移植，仅外壳适配）
 * 适配点：API=OA.API；toast/webToast 替代 alert；absUrl 走同域 Worker；
 *          登录态由 login.html 守卫；原生桥调用全部退化为浏览器能力（新窗口/下载）。 */
var API = OA.API;

/* ===== 网页版 toast（替代 App 的 alert 兜底） ===== */
function webToast(msg) {
    var t = document.getElementById('app-web-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'app-web-toast';
        t.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);background:rgba(20,24,31,.88);color:#fff;font-size:14px;padding:10px 18px;border-radius:10px;z-index:9999;max-width:78%;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.22);opacity:0;transition:opacity .18s';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t.__timer);
    t.__timer = setTimeout(function () { t.style.opacity = '0'; }, 1800);
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
        '</tr></thead><tbody>'
};
var DT_TAIL = '</tbody></table></div>';

'''

# (说明, 原文, 替换文) —— 原文必须与 App 源码逐字匹配
PATCHES = [
    # toast 兜底：alert → webToast
    ("toast", """        if (window.AndroidBridge) AndroidBridge.toast(msg);
        else alert(msg);""",
     """        if (window.AndroidBridge) AndroidBridge.toast(msg);
        else webToast(msg);"""),

    # init：网页版无登录视图，直接进主界面；并折叠原尾部 DOMContentLoaded 的滚动自动加载监听
    ("init", """        bindPullRefresh();
        fillSavedUser();
        if (localStorage.getItem('uping_user') === '1') {
            $('login-view').style.display = 'none';
            $('app-view').style.display = 'flex';
            switchTab('home');
            startMsgPoll();
            checkSession();
            fetchMyName(); // v1.1.62：已登录态预热中文名缓存
        } else {
            refreshCaptcha();
        }
    }""",
     """        // 网页版：登录态由 login.html 守卫，进入本页即已登录
        try { $('login-view').style.display = 'none'; } catch (e) {}
        $('app-view').style.display = 'flex';
        switchTab('home');
        startMsgPoll();
        checkSession();
        fetchMyName(); // 预热中文名缓存
        bindScrollAutoLoad();
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
    }"""),

    # absUrl：硬编码域名 → 同域 Worker（OA.absUrl 基于 window.OA_BASE）
    ("absUrl", """    function absUrl(u) {
        if (!u) return '';
        if (u.indexOf('http') === 0) return u;
        if (u.indexOf('//') === 0) return 'https:' + u;
        return 'https://oa.upingbio.cn' + (u.charAt(0) === '/' ? '' : '/') + u;
    }""",
     """    function absUrl(u) { return OA.absUrl(u); }"""),

    # 退出登录：回登录页
    ("logout", """        uiConfirm('确定退出登录？', function () {
        stopMsgPollNative();
        localStorage.removeItem('uping_user');
        $('app-view').style.display = 'none';
        $('login-view').style.display = 'flex';
        refreshCaptcha();
        $('login-username').value = '';
        $('login-password').value = '';
        $('login-captcha').value = '';
        fillSavedUser();
        });""",
     """        uiConfirm('确定退出登录？', function () {
        stopMsgPollNative();
        try { OA.logout(); } catch (e) {}
        try { localStorage.removeItem('uping_user'); } catch (e) {}
        location.href = 'login.html';
        });"""),

    # 会话失效：记录原因回登录页
    ("onSessionExpired", """        localStorage.removeItem('uping_user');
        localStorage.removeItem('uping_me');
        listState = {};
        currentTab = 'home';
        $('app-view').style.display = 'none';
        $('login-view').style.display = 'flex';
        refreshCaptcha();
        $('login-password').value = '';
        $('login-captcha').value = '';
        fillSavedUser();
        toast('登录已过期，请重新登录');""",
     """        try { localStorage.removeItem('uping_user'); localStorage.removeItem('uping_me'); } catch (e) {}
        try {
            localStorage.setItem('uping_boot_err', JSON.stringify({
                t: Date.now(), tag: '会话失效', m: '登录已过期，请重新登录', s: ''
            }));
        } catch (e) {}
        location.href = 'login.html';"""),

    # 订单附件打开：无桥 → 新标签页
    ("openOrderFile", """    function openOrderFile(url, name) {
        try {
            AndroidBridge.openFileWith(url, name);
        } catch (e) { toast('打开失败：当前版本不支持'); }
    }""",
     """    function openOrderFile(url, name) {
        if (window.AndroidBridge && AndroidBridge.openFileWith) {
            try { AndroidBridge.openFileWith(url, name); return; } catch (e) {}
        }
        try { window.open(url, '_blank'); } catch (e) { toast('打开失败'); }
    }"""),

    # 订单附件转发：无桥 → 下载
    ("shareOrderFile", """    function shareOrderFile(url, name) {
        try {
            AndroidBridge.shareFile(url, name);
            toast('正在准备转发：' + name);
        } catch (e) { toast('转发失败'); }
    }""",
     """    function shareOrderFile(url, name) {
        if (window.AndroidBridge && AndroidBridge.shareFile) {
            try { AndroidBridge.shareFile(url, name); toast('正在准备转发：' + name); return; } catch (e) {}
        }
        webShare(url, name);
        toast('已开始下载：' + name);
    }"""),

    # 收藏夹打包：无桥 → 逐个下载
    ("packFav", """        try {
            AndroidBridge.zipFiles(JSON.stringify(list), zipName);
            toast('开始打包 ' + docs.length + ' 份说明书，完成后在通知栏查看');
        } catch (e) { toast('打包失败：' + e.message); }""",
     """        if (window.AndroidBridge && AndroidBridge.zipFiles) {
            try {
                AndroidBridge.zipFiles(JSON.stringify(list), zipName);
                toast('开始打包 ' + docs.length + ' 份说明书，完成后在通知栏查看');
                return;
            } catch (e) {}
        }
        webZipDownload(list);
        toast('开始下载 ' + list.length + ' 份说明书（网页版逐个下载）');"""),

    # 单个说明书转发（产品详情页）
    ("shareDoc", """        try { AndroidBridge.shareFile(url, name); toast('正在准备转发：' + name); }
        catch (e) { toast('转发失败：' + e.message); }""",
     """        if (window.AndroidBridge && AndroidBridge.shareFile) {
            try { AndroidBridge.shareFile(url, name); toast('正在准备转发：' + name); return; } catch (e) {}
        }
        webShare(url, name); toast('已开始下载：' + name);"""),

    # 单个说明书转发（收藏夹内）
    ("shareFavDoc", """        try { AndroidBridge.shareFile(absUrl(d.url), name); toast('正在准备转发：' + name); }
        catch (e) { toast('转发失败：' + e.message); }""",
     """        if (window.AndroidBridge && AndroidBridge.shareFile) {
            try { AndroidBridge.shareFile(absUrl(d.url), name); toast('正在准备转发：' + name); return; } catch (e) {}
        }
        webShare(absUrl(d.url), name); toast('已开始下载：' + name);"""),

    # 勾选转发：无桥 → 逐个下载
    ("shareChecked", """        try { AndroidBridge.shareZip(JSON.stringify(list), '勾选转发'); toast('正在打包并准备转发 ' + list.length + ' 份说明书'); }
        catch (e) { toast('转发失败：' + e.message); }""",
     """        if (window.AndroidBridge && AndroidBridge.shareZip) {
            try { AndroidBridge.shareZip(JSON.stringify(list), '勾选转发'); toast('正在打包并准备转发 ' + list.length + ' 份说明书'); return; } catch (e) {}
        }
        webZipDownload(list); toast('开始下载 ' + list.length + ' 份说明书（网页版逐个下载）');"""),

    # 打包转发全部：无桥 → 逐个下载
    ("sharePackFav", """        try { AndroidBridge.shareZip(JSON.stringify(list), folderId ? '文件夹打包' : '全部说明书合集'); toast('正在打包并准备转发 ' + docs.length + ' 份说明书'); }
        catch (e) { toast('转发失败：' + e.message); }""",
     """        if (window.AndroidBridge && AndroidBridge.shareZip) {
            try { AndroidBridge.shareZip(JSON.stringify(list), folderId ? '文件夹打包' : '全部说明书合集'); toast('正在打包并准备转发 ' + docs.length + ' 份说明书'); return; } catch (e) {}
        }
        webZipDownload(list); toast('开始下载 ' + list.length + ' 份说明书（网页版逐个下载）');"""),

    # 尾部启动块：网页版由 index.html 启动脚本调用 App.init()，删掉 DOMContentLoaded 监听（避免双初始化）
    ("tail-boot", """document.addEventListener('DOMContentLoaded', function () {
    try {
        App.init();
        hideBootSplash();
    } catch (e) {
        showBootError('初始化失败');
    }
});

window.addEventListener('error', function () {
    showBootError('页面加载异常');
});""",
     """/* 网页版：由 index.html 的内联启动脚本调用 App.init()（见文件末尾 console 提示） */"""),

    # ===== 第二批：桌面设计系统（渲染层桌面化）=====

    # 首页 → 桌面仪表盘（欢迎语 + 入口统计 + 左应用中心 / 右快捷审批+待办）
    ("home", """    function renderHome() {
        var c = $('page-container');
        var html = '';
        // 快捷审批（常用8个 + 全部入口）
        html += '<div class="section-title">快捷审批</div><div class="grid">';
        var quickCount = APPROVE_TYPES.length;
        for (var i = 0; i < quickCount; i++) {
            var at = APPROVE_TYPES[i];
            html += '<div class="grid-item" onclick="App.launchApprove(' + at.type + ')"><span class="gi-icon">' + at.icon + '</span><span class="gi-text">' + at.name + '</span></div>';
        }
        html += '</div>';
        // 信息功能（已移动端化的页面走 openMobile，其余保留桌面版）
        html += '<div class="section-title">办公入口</div><div class="grid">';
        var entries = [
            { mobile: 'note', icon: '📢', name: '企业公告' },
            { mobile: 'article', icon: '💬', name: '问答知识' },
            { ai: true, icon: '🤖', name: 'AI问答' },
            { mobile: 'product', icon: '🧪', name: '产品管理' },
            { mobile: 'files', icon: '📁', name: '附件管理' },
            { mobile: 'message-inbox', icon: '✉️', name: '消息中心' },
            { mobile: 'mail', icon: '📇', name: '通讯录' },
            { approveType: true, icon: '📝', name: '发起审批' },
            { tab: 'customer', icon: '👥', name: '客户列表' },
            { workbench: true, icon: '🏠', name: '工作台' },
            // 财务
            { mobile: 'finance-advance', icon: '💰', name: '预存款' },
            { mobile: 'deduction', icon: '🎫', name: '抵扣券' },
            { mobile: 'margin', icon: '🛡️', name: '保证金' },
            { mobile: 'invoice-my', icon: '🧾', name: '发票申请' },
            { mobile: 'invoice-handle', icon: '🗂️', name: '发票处理' },
            { mobile: 'finance-income', icon: '📊', name: '到账（发票）' },
            { mobile: 'finance-order', icon: '📈', name: '到账（订单）' },
            { mobile: 'orderapply-handle', icon: '⚙️', name: '订单到账处理' },
            // 客户子功能
            { mobile: 'contact-list', icon: '👤', name: '客户联系人' },
            { mobile: 'chance-list', icon: '🎯', name: '销售机会' },
            { mobile: 'trace-list', icon: '📝', name: '跟进记录' },
            { mobile: 'order-my', icon: '📦', name: '我的订单' },
            { mobile: 'order-handle', icon: '🔧', name: '订单处理' },
            { mobile: 'platform-order', icon: '🛒', name: '平台订单' },
            { mobile: 'sample', icon: '🧫', name: '样本管理' },
            { mobile: 'school', icon: '🏫', name: '校展管理' },
            { mobile: 'after', icon: '🔨', name: '售后管理' },
            { mobile: 'customer-add', icon: '➕', name: '新增客户' }
        ];
        for (var j = 0; j < entries.length; j++) {
            var e = entries[j];
            if (e.mobile) html += '<div class="grid-item" onclick="App.openMobile(\\'' + e.mobile + '\\')"><span class="gi-icon">' + e.icon + '</span><span class="gi-text">' + e.name + '</span></div>';
            else if (e.tab) html += '<div class="grid-item" onclick="App.switchTab(\\'' + e.tab + '\\')"><span class="gi-icon">' + e.icon + '</span><span class="gi-text">' + e.name + '</span></div>';
            else if (e.approveType) html += '<div class="grid-item" onclick="App.openApproveType()"><span class="gi-icon">' + e.icon + '</span><span class="gi-text">' + e.name + '</span></div>';
            else if (e.workbench) html += '<div class="grid-item" onclick="App.openWorkbench()"><span class="gi-icon">' + e.icon + '</span><span class="gi-text">' + e.name + '</span></div>';
            else if (e.ai) html += '<div class="grid-item" onclick="App.openAiChat()"><span class="gi-icon">' + e.icon + '</span><span class="gi-text">' + e.name + '</span></div>';
            else html += '<div class="grid-item" onclick="App.openEntry(\\'' + e.path + '\\')"><span class="gi-icon">' + e.icon + '</span><span class="gi-text">' + e.name + '</span></div>';
        }
        html += '</div>';
        // 待办提示卡
        html += '<div class="section-title">我的待办</div>';
        html += '<div class="card" onclick="App.switchTab(\\'approve\\')">';
        html += '<div class="card-title">待审审批</div>';
        html += '<div class="card-line">点击查看我发起的与待我处理的审批</div>';
        html += '</div>';
        html += '<div class="card" onclick="App.switchTab(\\'customer\\')">';
        html += '<div class="card-title">客户跟进</div>';
        html += '<div class="card-line">客户列表 · 公海 · 联系人 · 订单 · 样本</div>';
        html += '</div>';
        c.innerHTML = html;
    }""",
     """    function renderHome() {
        var c = $('page-container');
        var now = new Date();
        var weekNames = ['日', '一', '二', '三', '四', '五', '六'];
        var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + weekNames[now.getDay()];
        var html = '';
        html += '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">' + esc(myDisplayName()) + '，欢迎回来</div>' +
            '<div class="dt-toolbar-sub">' + dateStr + ' · 优品OA 网页版</div>' +
            '</div></div>';
        // 四大模块入口统计
        html += '<div class="dt-stats">' +
            '<div class="dt-stat" onclick="App.switchTab(\\'approve\\')"><div class="dt-stat-ico" style="background:#E8F0FF">✅</div><div><div class="dt-stat-num" style="color:#165DFF">审批中心</div><div class="dt-stat-label">我的申请与待我处理</div></div></div>' +
            '<div class="dt-stat" onclick="App.switchTab(\\'customer\\')"><div class="dt-stat-ico" style="background:#E8F7EC">👥</div><div><div class="dt-stat-num" style="color:#00B42A">客户管理</div><div class="dt-stat-label">客户 · 公海 · 联系人 · 订单</div></div></div>' +
            '<div class="dt-stat" onclick="App.showSubPage(\\'order-handle\\')"><div class="dt-stat-ico" style="background:#FFF3E8">📦</div><div><div class="dt-stat-num" style="color:#FF7D00">订单处理</div><div class="dt-stat-label">审单 · 平台订单 · 售后</div></div></div>' +
            '<div class="dt-stat" onclick="App.showSubPage(\\'message-inbox\\')"><div class="dt-stat-ico" style="background:#F5E8FF">✉️</div><div><div class="dt-stat-num" style="color:#722ED1">消息中心</div><div class="dt-stat-label">收件箱 · 发件箱 · 草稿</div></div></div>' +
            '</div>';
        html += '<div class="dt-cols-wide">';
        // 左列：应用中心（分组宫格）
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">应用中心</div></div><div class="dt-panel-body">';
        var entries = [
            { mobile: 'note', icon: '📢', name: '企业公告' },
            { mobile: 'article', icon: '💬', name: '问答知识' },
            { ai: true, icon: '🤖', name: 'AI问答' },
            { mobile: 'product', icon: '🧪', name: '产品管理' },
            { mobile: 'files', icon: '📁', name: '附件管理' },
            { mobile: 'message-inbox', icon: '✉️', name: '消息中心' },
            { mobile: 'mail', icon: '📇', name: '通讯录' },
            { approveType: true, icon: '📝', name: '发起审批' },
            { tab: 'customer', icon: '👥', name: '客户列表' },
            { workbench: true, icon: '🗂️', name: '工作台' },
            // 财务
            { mobile: 'finance-advance', icon: '💰', name: '预存款' },
            { mobile: 'deduction', icon: '🎫', name: '抵扣券' },
            { mobile: 'margin', icon: '🛡️', name: '保证金' },
            { mobile: 'invoice-my', icon: '🧾', name: '发票申请' },
            { mobile: 'invoice-handle', icon: '🗂️', name: '发票处理' },
            { mobile: 'finance-income', icon: '📊', name: '到账（发票）' },
            { mobile: 'finance-order', icon: '📈', name: '到账（订单）' },
            { mobile: 'orderapply-handle', icon: '⚙️', name: '订单到账处理' },
            // 客户子功能
            { mobile: 'contact-list', icon: '👤', name: '客户联系人' },
            { mobile: 'chance-list', icon: '🎯', name: '销售机会' },
            { mobile: 'trace-list', icon: '📝', name: '跟进记录' },
            { mobile: 'order-my', icon: '📦', name: '我的订单' },
            { mobile: 'order-handle', icon: '🔧', name: '订单处理' },
            { mobile: 'platform-order', icon: '🛒', name: '平台订单' },
            { mobile: 'sample', icon: '🧫', name: '样本管理' },
            { mobile: 'school', icon: '🏫', name: '校展管理' },
            { mobile: 'after', icon: '🔨', name: '售后管理' },
            { mobile: 'customer-add', icon: '➕', name: '新增客户' }
        ];
        var iconBgs = ['#E8F0FF', '#E8F7EC', '#FFF3E8', '#F5E8FF', '#FFECE8', '#E8F7EC'];
        html += '<div class="dt-app-grid">';
        for (var j = 0; j < entries.length; j++) {
            var e = entries[j];
            var bg = iconBgs[j % iconBgs.length];
            var click = '';
            if (e.mobile) click = 'App.openMobile(\\'' + e.mobile + '\\')';
            else if (e.tab) click = 'App.switchTab(\\'' + e.tab + '\\')';
            else if (e.approveType) click = 'App.openApproveType()';
            else if (e.workbench) click = 'App.openWorkbench()';
            else if (e.ai) click = 'App.openAiChat()';
            else click = 'App.openEntry(\\'' + (e.path || '') + '\\')';
            html += '<div class="dt-app" onclick="' + click + '"><div class="dt-app-ico" style="background:' + bg + '">' + e.icon + '</div><div class="dt-app-name">' + e.name + '</div></div>';
        }
        html += '</div></div></div>';
        // 右列：快捷审批 + 我的待办
        html += '<div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">快捷审批</div>' +
            '<div class="dt-panel-ops"><span class="dt-link" onclick="App.openApproveType()">全部类型 ›</span></div></div>' +
            '<div class="dt-panel-body"><div class="dt-app-grid" style="grid-template-columns:repeat(3,1fr)">';
        var quickCount = APPROVE_TYPES.length;
        for (var i = 0; i < quickCount; i++) {
            var at = APPROVE_TYPES[i];
            html += '<div class="dt-app" onclick="App.launchApprove(' + at.type + ')"><div class="dt-app-ico" style="background:#E8F0FF">' + at.icon + '</div><div class="dt-app-name">' + at.name + '</div></div>';
        }
        html += '</div></div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">我的待办</div></div><div class="dt-panel-body" style="padding:6px 12px">';
        html += '<div class="menu-item" onclick="App.switchTab(\\'approve\\')"><span class="mi-left">✅ 待审审批</span><span class="mi-right">查看 ›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\\'order-handle\\')"><span class="mi-left">📦 待处理订单</span><span class="mi-right">查看 ›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\\'message-inbox\\')"><span class="mi-left">✉️ 未读消息</span><span class="mi-right">查看 ›</span></div>';
        html += '<div class="menu-item" onclick="App.switchTab(\\'customer\\')"><span class="mi-left">👥 客户跟进</span><span class="mi-right">查看 ›</span></div>';
        html += '</div></div>';
        html += '</div>';
        html += '</div>';
        c.innerHTML = html;
    }"""),

    # 审批列表：seg 外包工具条标题
    ("approve-toolbar", """        c.innerHTML =
            '<div class="seg">' +
            '<div class="seg-item active" data-s="0" onclick="App.loadApprove(0)">全部</div>' +
            '<div class="seg-item" data-s="1" onclick="App.loadApprove(1)">待审批</div>' +
            '<div class="seg-item" data-s="2" onclick="App.loadApprove(2)">已通过</div>' +
            '<div class="seg-item" data-s="3" onclick="App.loadApprove(3)">已拒绝</div>' +
            '</div>' +
            '<div id="approve-list"></div>';""",
     """        c.innerHTML =
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">审批中心</div>' +
            '<div class="dt-toolbar-sub">我发起的与待我处理的审批</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<span class="dt-btn primary" onclick="App.openApproveType()">＋ 发起审批</span>' +
            '</div></div>' +
            '<div class="seg">' +
            '<div class="seg-item active" data-s="0" onclick="App.loadApprove(0)">全部</div>' +
            '<div class="seg-item" data-s="1" onclick="App.loadApprove(1)">待审批</div>' +
            '<div class="seg-item" data-s="2" onclick="App.loadApprove(2)">已通过</div>' +
            '<div class="seg-item" data-s="3" onclick="App.loadApprove(3)">已拒绝</div>' +
            '</div>' +
            '<div id="approve-list"></div>';"""),

    # 审批列表行：卡片 → 表格行
    ("approve-row", """                html += '<div class="card">' +
                '<div class="card-title">' + esc(r.content || '审批') + '<span class="tag ' + stCls + '">' + stText + '</span></div>' +
                '<div class="card-line"><b>主题：</b>' + esc(r.name || '') + '</div>' +
                '<div class="card-line"><b>申请人：</b>' + esc(r.admin_name || r.name || '') + '</div>' +
                '<div class="card-line"><b>时间：</b>' + fmtTime(r.create_time || r.detail_time || r.start_time) + '</div>' +
                (r.amount ? '<div class="card-line"><b>金额：</b>' + esc(r.amount) + '</div>' : '') +
                (r.remark ? '<div class="card-line"><b>说明：</b>' + esc(r.remark) + '</div>' : '') +
                '<div class="card-line" style="margin-top:6px"><span style="color:#1E6FFF" onclick="App.openApproveDetail(' + r.id + ')">查看详情 ›</span></div>' +
                (canCheck ? '<div class="approve-actions"><button class="btn btn-ok" onclick="App.doApproveCheck(' + r.id + ',2,event)">通过</button><button class="btn btn-no" onclick="App.doApproveCheck(' + r.id + ',3,event)">拒绝</button></div>' : '') +
                '</div>';""",
     """                html += '<tr onclick="App.openApproveDetail(' + r.id + ')">' +
                '<td><div class="td-strong">' + esc(r.name || r.content || '审批') + '</div><div class="td-sub">' + esc(r.content || '') + '</div></td>' +
                '<td>' + esc(r.admin_name || r.name || '') + '</td>' +
                '<td class="td-num">' + (r.amount ? esc(r.amount) : '-') + '</td>' +
                '<td>' + fmtTime(r.create_time || r.detail_time || r.start_time) + '</td>' +
                '<td><span class="tag ' + stCls + '">' + stText + '</span></td>' +
                '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.openApproveDetail(' + r.id + ')">详情</span>' +
                (canCheck ? '<span class="dt-link ok" onclick="event.stopPropagation();App.doApproveCheck(' + r.id + ',2,event)">通过</span><span class="dt-link no" onclick="event.stopPropagation();App.doApproveCheck(' + r.id + ',3,event)">拒绝</span>' : '') +
                '</td></tr>';"""),

    # 审批列表：包裹表格
    ("approve-table", """            $('approve-list').innerHTML = html;""",
     """            $('approve-list').innerHTML = DT_HEAD.approve + html + DT_TAIL;"""),

    # 客户列表：seg+搜索+新增 → 工具条
    ("customer-toolbar", """        c.innerHTML =
            '<div class="seg">' +
            '<div class="seg-item active" data-t="1" onclick="App.loadCustomer(1)">我的客户</div>' +
            '<div class="seg-item" data-t="2" onclick="App.loadCustomer(2)">公海</div>' +
            '<div class="seg-item" data-t="3" onclick="App.loadCustomer(3)">废弃</div>' +
            '</div>' +
            '<div class="search-bar"><input id="cust-kw" type="text" placeholder="搜索客户名称"><span class="search-btn" onclick="App.loadCustomer(' + (listState.customer ? listState.customer.type : 1) + ')">搜索</span></div>' +
            '<div style="display:flex;gap:8px;padding:0 14px 6px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.showSubPage(\\'customer-add\\')">＋ 新增客户</span></div>' +
            '<div id="customer-list"></div>' +""",
     """        c.innerHTML =
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">客户管理</div>' +
            '<div class="dt-toolbar-sub">我的客户 · 公海 · 废弃</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="cust-kw" type="text" placeholder="搜索客户名称"><button class="dt-search-btn" onclick="App.loadCustomer(' + (listState.customer ? listState.customer.type : 1) + ')">搜索</button></div>' +
            '<span class="dt-btn primary" onclick="App.showSubPage(\\'customer-add\\')">＋ 新增客户</span>' +
            '</div></div>' +
            '<div class="seg">' +
            '<div class="seg-item active" data-t="1" onclick="App.loadCustomer(1)">我的客户</div>' +
            '<div class="seg-item" data-t="2" onclick="App.loadCustomer(2)">公海</div>' +
            '<div class="seg-item" data-t="3" onclick="App.loadCustomer(3)">废弃</div>' +
            '</div>' +
            '<div id="customer-list"></div>' +"""),

    # 客户列表行：卡片 → 表格行
    ("customer-row", """                html += '<div class="card" onclick="App.openCustomer(' + r.id + ')">' +
                    '<div class="card-title">' + esc(r.name || '未命名') + '</div>' +
                    '<div class="card-line">预存款：<b>' + esc(r.advance_deposit || '0.00') + '</b> · 抵扣券：<b>' + esc(r.deduction || '0.00') + '</b></div>' +
                    '<div class="card-line">保证金：' + esc(r.margin_deposit || '0.00') + ' · 负责人：' + esc(r.belong_name || '') + '</div>' +
                    '</div>';""",
     """                html += '<tr onclick="App.openCustomer(' + r.id + ')">' +
                    '<td><div class="td-strong">' + esc(r.name || '未命名') + '</div></td>' +
                    '<td>' + esc(r.type_title || (Number(r.c_type) === 2 ? '公海客户' : Number(r.c_type) === 3 ? '废弃客户' : '我的客户')) + '</td>' +
                    '<td class="td-num">' + esc(r.advance_deposit || '0.00') + '</td>' +
                    '<td class="td-num">' + esc(r.deduction || '0.00') + '</td>' +
                    '<td class="td-num">' + esc(r.margin_deposit || '0.00') + '</td>' +
                    '<td>' + esc(r.belong_name || '') + '</td>' +
                    '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.openCustomer(' + r.id + ')">详情</span></td></tr>';"""),

    # 客户列表：包裹表格
    ("customer-table", """            $('customer-list').innerHTML = html;""",
     """            $('customer-list').innerHTML = DT_HEAD.customer + html + DT_TAIL;"""),

    # 订单卡片 → 表格行
    ("order-card", """        var html = '<div class="card" onclick="App.openOrderDetail(' + r.id + ',\\'' + kind + '\\')">' +
            '<div class="card-title">' + esc(r.title || r.code || '订单') +
            (stTxt ? '<span class="tag ' + tagCls + '">' + esc(stTxt) + '</span>' : '') + '</div>';
        for (var i = 0; i < items.length; i += 2) {
            html += '<div class="card-line">' + items[i] + (items[i + 1] ? ' · ' + items[i + 1] : '') + '</div>';
        }
        return html + '</div>';""",
     """        var subLine = '';
        if (r.code) subLine = '编号：' + esc(r.code) + (r.customer_name ? ' · ' + esc(r.customer_name) : '');
        else if (r.customer_name) subLine = esc(r.customer_name);
        var amtMain = amt(r.amount || r.deal_amount);
        return '<tr onclick="App.openOrderDetail(' + r.id + ',\\'' + kind + '\\')">' +
            '<td><div class="td-strong">' + esc(r.title || r.code || '订单') + '</div>' +
            (subLine ? '<div class="td-sub">' + subLine + '</div>' : '') + '</td>' +
            '<td class="td-num">' + (amtMain ? '¥ ' + amtMain : '-') + '</td>' +
            '<td><span class="tag ' + tagCls + '">' + esc(stTxt || '未知') + '</span></td>' +
            '<td>' + fmtTime(r.deal_time || r.create_time) + '</td>' +
            '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.openOrderDetail(' + r.id + ',\\'' + kind + '\\')">详情</span></td></tr>';"""),

    # 我的订单列表：搜索条工具条化 + 包裹表格
    ("order-my-page", """        c.innerHTML = '<div class="search-bar"><input id="ord-kw" type="text" placeholder="搜索订单号/客户"><span class="search-btn" onclick="App.loadOrderMy()">搜索</span></div><div id="ord-list"></div>';""",
     """        c.innerHTML = '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">订单（我申请的）</div>' +
            '<div class="dt-toolbar-sub">我提交的订单与审单进度</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="ord-kw" type="text" placeholder="搜索订单号/客户"><button class="dt-search-btn" onclick="App.loadOrderMy()">搜索</button></div>' +
            '</div></div><div id="ord-list"></div>';"""),
    ("order-my-table", """            for (var k2 = 0; k2 < __rk.length; k2++) {
                html += orderCardHtml(st.rows[__rk[k2]], 'my');
            }
            box.innerHTML = html;""",
     """            for (var k2 = 0; k2 < __rk.length; k2++) {
                html += orderCardHtml(st.rows[__rk[k2]], 'my');
            }
            box.innerHTML = DT_HEAD.order + html + DT_TAIL;"""),

    # 订单处理列表：工具条化 + 包裹表格
    ("order-handle-page", """        c.innerHTML = '<div class="search-bar"><input id="ordh-kw" type="text" placeholder="搜索订单号/客户"><span class="search-btn" onclick="App.loadOrderHandle()">搜索</span></div><div id="ordh-list"></div>';""",
     """        c.innerHTML = '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">订单（我处理的）</div>' +
            '<div class="dt-toolbar-sub">待我审单的订单</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="ordh-kw" type="text" placeholder="搜索订单号/客户"><button class="dt-search-btn" onclick="App.loadOrderHandle()">搜索</button></div>' +
            '</div></div><div id="ordh-list"></div>';"""),
    ("order-handle-table", """            for (var k2 = 0; k2 < __rk.length; k2++) {
                html += orderCardHtml(st.rows[__rk[k2]], 'handle');
            }
            box.innerHTML = html;""",
     """            for (var k2 = 0; k2 < __rk.length; k2++) {
                html += orderCardHtml(st.rows[__rk[k2]], 'handle');
            }
            box.innerHTML = DT_HEAD.order + html + DT_TAIL;"""),

    # 财务卡片 → 表格行
    ("fin-card", """    function finCard(r) {
        var t = '';
        var rows = [
            ['单号', r.code || r.id], ['客户', r.customer_name || ''], ['金额', r.amount != null ? r.amount : (r.money != null ? r.money : '')],
            ['状态', r.status_msg || r.status_name || (r.check_status == 1 ? '已通过' : '')], ['时间', fmtTime(r.create_time || r.enter_time)]
        ];
        for (var i = 0; i < rows.length; i++) {
            if (rows[i][1]) t += '<div class="card-line"><b>' + rows[i][0] + '：</b>' + esc(rows[i][1]) + '</div>';
        }
        if (r.remark) t += '<div class="card-line">备注：' + esc(r.remark) + '</div>';
        return '<div class="card"><div class="card-title">' + esc(r.customer_name || '财务记录') + '</div>' + t + '</div>';
    }""",
     """    function finCard(r) {
        var stTxt = r.status_msg || r.status_name || (r.check_status == 1 ? '已通过' : '') || '-';
        var amt = (r.amount != null ? r.amount : (r.money != null ? r.money : ''));
        return '<tr>' +
            '<td>' + esc(r.code || r.id) + '</td>' +
            '<td><div class="td-strong">' + esc(r.customer_name || '-') + '</div>' + (r.remark ? '<div class="td-sub">' + esc(r.remark) + '</div>' : '') + '</td>' +
            '<td class="td-num">' + esc(amt || '-') + '</td>' +
            '<td>' + esc(stTxt) + '</td>' +
            '<td>' + fmtTime(r.create_time || r.enter_time) + '</td>' +
            '</tr>';
    }"""),

    # 财务通用列表：包裹表格
    ("fin-table", """            for (var k2 = 0; k2 < __rk.length; k2++) { html += cardFn(st.rows[__rk[k2]]); }
            box.innerHTML = html;""",
     """            for (var k2 = 0; k2 < __rk.length; k2++) { html += cardFn(st.rows[__rk[k2]]); }
            box.innerHTML = DT_HEAD.fin + html + DT_TAIL;"""),

    # 财务列表壳：搜索条工具条化
    ("fin-shell", """        c.innerHTML = '<div class="search-bar"><input id="fin-kw-' + key + '" type="text" placeholder="搜索"><span class="search-btn" onclick="App.' + loader.name + '()">搜索</span></div>' +
            '<div id="fin-list-' + key + '"></div>';""",
     """        c.innerHTML = '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">' + title + '</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<div class="dt-search"><input id="fin-kw-' + key + '" type="text" placeholder="搜索"><button class="dt-search-btn" onclick="App.' + loader.name + '()">搜索</button></div>' +
            '</div></div>' +
            '<div id="fin-list-' + key + '"></div>';"""),

    # 预存款：卡片循环 → 表格行 + 包裹
    ("fin-advance-row", """            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<div class="card">' +
                    '<div class="card-title">¥ ' + esc(r.amount || '0.00') + '<span class="tag ' + (Number(r.type) === 1 ? 'tag-pass' : 'tag-reject') + '">' + (Number(r.type) === 1 ? '存入' : '支出') + '</span></div>' +
                    '<div class="card-line">' + esc(r.customer_name || '') + '</div>' +
                    '<div class="card-line">余额：' + esc(r.before || '0.00') + ' → ' + esc(r.after || '0.00') + ' · ' + fmtTime(r.create_time) + '</div>' +
                    '</div>';
            }
            el2.innerHTML = html;""",
     """            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<tr>' +
                    '<td class="td-num">¥ ' + esc(r.amount || '0.00') + '</td>' +
                    '<td><span class="tag ' + (Number(r.type) === 1 ? 'tag-pass' : 'tag-reject') + '">' + (Number(r.type) === 1 ? '存入' : '支出') + '</span></td>' +
                    '<td>' + esc(r.customer_name || '-') + '</td>' +
                    '<td class="td-num">' + esc(r.before || '0.00') + ' → ' + esc(r.after || '0.00') + '</td>' +
                    '<td>' + fmtTime(r.create_time) + '</td>' +
                    '</tr>';
            }
            el2.innerHTML = DT_HEAD['fin-advance'] + html + DT_TAIL;"""),

    # 到账（发票）：卡片循环 → 表格行 + 包裹
    ("fin-income-row", """            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<div class="card">' +
                    '<div class="card-title">¥ ' + esc(r.amount || '0.00') + '</div>' +
                    '<div class="card-line">发票抬头：' + esc(r.invoice_title || '') + '</div>' +
                    '<div class="card-line">' + fmtTime(r.create_time || r.open_time) + '</div>' +
                    '</div>';
            }
            el2.innerHTML = html;""",
     """            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<tr>' +
                    '<td class="td-num">¥ ' + esc(r.amount || '0.00') + '</td>' +
                    '<td><div class="td-strong">' + esc(r.invoice_title || '-') + '</div></td>' +
                    '<td>' + fmtTime(r.create_time || r.open_time) + '</td>' +
                    '</tr>';
            }
            el2.innerHTML = DT_HEAD['fin-income'] + html + DT_TAIL;"""),

    # 到账（订单）：卡片循环 → 表格行 + 包裹
    ("fin-order-row", """            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<div class="card">' +
                    '<div class="card-title">¥ ' + esc(r.amount || '0.00') + '</div>' +
                    (r.customer_order_ids ? '<div class="card-line">订单：' + esc(r.customer_order_ids) + '</div>' : '') +
                    '<div class="card-line">' + fmtTime(r.create_time) + '</div>' +
                    '</div>';
            }
            el2.innerHTML = html;""",
     """            for (var k2 = 0; k2 < __rk.length; k2++) {
                var r = st.rows[__rk[k2]];
                html += '<tr>' +
                    '<td class="td-num">¥ ' + esc(r.amount || '0.00') + '</td>' +
                    '<td><div class="td-strong">' + esc(r.customer_order_ids || '-') + '</div></td>' +
                    '<td>' + fmtTime(r.create_time) + '</td>' +
                    '</tr>';
            }
            el2.innerHTML = DT_HEAD['fin-order'] + html + DT_TAIL;"""),

    # 消息中心：seg+按钮 → 工具条
    ("msg-toolbar", """        c.innerHTML =
            '<div class="seg">' +
            '<div class="seg-item' + (tab === 'inbox' ? ' active' : '') + '" onclick="App.openMsgTab(\\'inbox\\')">收件箱</div>' +
            '<div class="seg-item' + (tab === 'sendbox' ? ' active' : '') + '" onclick="App.openMsgTab(\\'sendbox\\')">发件箱</div>' +
            '<div class="seg-item' + (tab === 'draft' ? ' active' : '') + '" onclick="App.openMsgTab(\\'draft\\')">草稿箱</div>' +
            '<div class="seg-item' + (tab === 'rubbish' ? ' active' : '') + '" onclick="App.openMsgTab(\\'rubbish\\')">回收站</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;padding:0 14px 6px"><span class="act-btn" style="flex:1;text-align:center" onclick="App.openMsgCompose()">＋ 新建消息</span></div>' +
            '<div id="msg-list"></div>';""",
     """        c.innerHTML =
            '<div class="dt-toolbar"><div>' +
            '<div class="dt-toolbar-title">消息中心</div>' +
            '<div class="dt-toolbar-sub">收件箱 · 发件箱 · 草稿箱 · 回收站</div>' +
            '</div><div class="dt-toolbar-ops">' +
            '<span class="dt-btn primary" onclick="App.openMsgCompose()">＋ 新建消息</span>' +
            '</div></div>' +
            '<div class="seg">' +
            '<div class="seg-item' + (tab === 'inbox' ? ' active' : '') + '" onclick="App.openMsgTab(\\'inbox\\')">收件箱</div>' +
            '<div class="seg-item' + (tab === 'sendbox' ? ' active' : '') + '" onclick="App.openMsgTab(\\'sendbox\\')">发件箱</div>' +
            '<div class="seg-item' + (tab === 'draft' ? ' active' : '') + '" onclick="App.openMsgTab(\\'draft\\')">草稿箱</div>' +
            '<div class="seg-item' + (tab === 'rubbish' ? ' active' : '') + '" onclick="App.openMsgTab(\\'rubbish\\')">回收站</div>' +
            '</div>' +
            '<div id="msg-list"></div>';"""),

    # 消息列表行：卡片 → 表格行
    ("msg-row", """                html += '<div class="card" onclick="App.openMsgDetail(' + r.id + ')">' +
                '<div class="card-title">' + plain(r.title || '（无主题）') + unread + '</div>' +
                '<div class="card-line">' + esc(r.from_name || r.to_name || '') + ' · ' + fmtTime(r.send_time || r.create_time) + '</div>' +
                '<div class="card-line" style="color:#1E6FFF">查看详情 ›</div>' +
                '</div>';""",
     """                html += '<tr onclick="App.openMsgDetail(' + r.id + ')">' +
                '<td><div class="td-strong">' + plain(r.title || '（无主题）') + unread + '</div></td>' +
                '<td>' + esc(r.from_name || r.to_name || '') + '</td>' +
                '<td>' + fmtTime(r.send_time || r.create_time) + '</td>' +
                '<td class="td-ops"><span class="dt-link" onclick="event.stopPropagation();App.openMsgDetail(' + r.id + ')">查看</span></td></tr>';"""),

    # 消息列表：包裹表格
    ("msg-table", """            box.innerHTML = html;
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('msg', tab));""",
     """            box.innerHTML = DT_HEAD.msg + html + DT_TAIL;
            st.page++;
            st.loading = false;
            st.done = rows.length < 20;
            if (!st.done) box.insertAdjacentHTML('beforeend', App.moreBtn('msg', tab));"""),

    # 我的 → 桌面个人中心
    ("mine", """    function renderMine() {
        var c = $('page-container');
        var savedU = null;
        try { savedU = JSON.parse(localStorage.getItem('uping_saved_user') || 'null'); } catch (e) {}
        var myName = myDisplayName();
        var myUid = (savedU && savedU.u) ? ('优品OA · 账号 ' + savedU.u) : '';
        c.innerHTML =
            '<div class="mine-head"><div class="name">' + esc(myName) + '</div><div class="uid">' + esc(myUid) + '</div></div>' +
            '<div class="section-title">财务管理</div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/advancedepositlog/index\\')"><span class="mi-left">预存款</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/deductionlog/index\\')"><span class="mi-left">抵扣券（我申请的）</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/deductionlog/checkedlist\\')"><span class="mi-left">抵扣券（管理专用）</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/margindepositlog/index\\')"><span class="mi-left">保证金</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/invoice/index\\')"><span class="mi-left">发票（我申请的）</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/invoice/list\\')"><span class="mi-left">发票（我处理的）</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/income/index\\')"><span class="mi-left">到账（发票）</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/orderapply/index\\')"><span class="mi-left">到账（订单）</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/finance/orderapply/list\\')"><span class="mi-left">到账（订单·我处理的）</span><span class="mi-right">›</span></div>' +
            '<div class="section-title">常用功能</div>' +
            '<div class="menu-item" onclick="App.showSubPage(\\'message-inbox\\')"><span class="mi-left">消息中心</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.showSubPage(\\'mail\\')"><span class="mi-left">通讯录</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openFinance(\\'/oa/approve/index\\')"><span class="mi-left">我的审批</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.showSubPage(\\'profile\\')"><span class="mi-left">基本资料</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.showSubPage(\\'password\\')"><span class="mi-left">修改密码</span><span class="mi-right">›</span></div>' +
            '<div class="menu-item" onclick="App.openDesktop()"><span class="mi-left">系统桌面版</span><span class="mi-right">›</span></div>' +
            '<div class="section-title">账号</div>' +
            '<div class="menu-item" onclick="App.logout()"><span class="mi-left" style="color:#ff4d4f">退出登录</span><span class="mi-right">›</span></div>' +
            '<div class="app-ver">优品OA 移动端 ' + APP_VERSION + '</div>';""",
     """    function renderMine() {
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
            '<span class="dt-btn" onclick="App.showSubPage(\\'profile\\')">基本资料</span>' +
            '<span class="dt-btn" onclick="App.showSubPage(\\'password\\')">修改密码</span>' +
            '</div></div></div>';
        html += '<div class="dt-cols-wide">';
        // 左列：财务管理 + 常用功能
        html += '<div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">财务管理</div></div><div class="dt-panel-body" style="padding:6px 12px">';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/advancedepositlog/index\\')"><span class="mi-left">💰 预存款</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/deductionlog/index\\')"><span class="mi-left">🎫 抵扣券（我申请的）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/deductionlog/checkedlist\\')"><span class="mi-left">🎫 抵扣券（管理专用）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/margindepositlog/index\\')"><span class="mi-left">🛡️ 保证金</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/invoice/index\\')"><span class="mi-left">🧾 发票（我申请的）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/invoice/list\\')"><span class="mi-left">🗂️ 发票（我处理的）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/income/index\\')"><span class="mi-left">📊 到账（发票）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/orderapply/index\\')"><span class="mi-left">📈 到账（订单）</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/finance/orderapply/list\\')"><span class="mi-left">⚙️ 到账（订单·我处理的）</span><span class="mi-right">›</span></div>';
        html += '</div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">常用功能</div></div><div class="dt-panel-body" style="padding:6px 12px">';
        html += '<div class="menu-item" onclick="App.showSubPage(\\'message-inbox\\')"><span class="mi-left">✉️ 消息中心</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\\'mail\\')"><span class="mi-left">📇 通讯录</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openFinance(\\'/oa/approve/index\\')"><span class="mi-left">✅ 我的审批</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\\'note\\')"><span class="mi-left">📢 企业公告</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\\'files\\')"><span class="mi-left">📁 附件管理</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openWorkbench()"><span class="mi-left">🗂️ 工作台</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.openDesktop()"><span class="mi-left">🖥️ 系统桌面版</span><span class="mi-right">›</span></div>';
        html += '</div></div></div>';
        // 右列：账号
        html += '<div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">账号</div></div><div class="dt-panel-body" style="padding:6px 12px">';
        html += '<div class="menu-item" onclick="App.showSubPage(\\'profile\\')"><span class="mi-left">👤 基本资料</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.showSubPage(\\'password\\')"><span class="mi-left">🔒 修改密码</span><span class="mi-right">›</span></div>';
        html += '<div class="menu-item" onclick="App.logout()"><span class="mi-left" style="color:#F53F3F">🚪 退出登录</span><span class="mi-right">›</span></div>';
        html += '</div></div>';
        html += '<div class="dt-panel"><div class="dt-panel-head"><div class="dt-panel-title">系统</div></div><div class="dt-panel-body">';
        html += '<div class="dt-field"><div class="dt-field-label">版本</div><div class="dt-field-value">优品OA 网页版 ' + APP_VERSION + '</div></div>';
        html += '<div class="dt-field"><div class="dt-field-label">数据源</div><div class="dt-field-value">oa.upingbio.cn</div></div>';
        html += '<div class="dt-field"><div class="dt-field-label">界面</div><div class="dt-field-value">桌面版（窄屏自动回退手机布局）</div></div>';
        html += '</div></div>';
        html += '</div>';
        html += '</div>';
        c.innerHTML = html;"""),

    # 审批详情：detail-head → dt-hero
    ("approve-detail", """        var html = '<div class="detail-head"><div class="dh-title">' + esc(r.content || '审批') + '<span class="tag ' + stCls + '">' + stText + '</span></div></div>';""",
     """        var html = '<div class="dt-hero"><div class="dt-hero-top"><div class="dt-hero-title">' + esc(r.content || '审批') + '<span class="tag ' + stCls + '">' + stText + '</span></div></div></div>';"""),

    # 客户详情：detail-head+stat-row → dt-hero
    ("customer-detail", """        var html = '<div class="detail-head"><div class="dh-title">' + esc(r.name || '未命名') + '</div>' +
            '<div class="dh-sub">' + esc(r.type_title || (Number(r.c_type) === 2 ? '公海客户' : Number(r.c_type) === 3 ? '废弃客户' : '我的客户')) + ' · 负责人：' + esc(r.belong_name || '') + '</div></div>';
        html += '<div class="stat-row">' +
            '<div class="stat-card"><div class="stat-num">' + esc(r.advance_deposit || '0.00') + '</div><div class="stat-label">预存款</div></div>' +
            '<div class="stat-card"><div class="stat-num">' + esc(r.deduction || '0.00') + '</div><div class="stat-label">抵扣券</div></div>' +
            '<div class="stat-card"><div class="stat-num">' + esc(r.margin_deposit || '0.00') + '</div><div class="stat-label">保证金</div></div>' +
            '</div>';""",
     """        var html = '<div class="dt-hero"><div class="dt-hero-top"><div>' +
            '<div class="dt-hero-title">' + esc(r.name || '未命名') + '</div>' +
            '<div class="dt-hero-sub">' + esc(r.type_title || (Number(r.c_type) === 2 ? '公海客户' : Number(r.c_type) === 3 ? '废弃客户' : '我的客户')) + ' · 负责人：' + esc(r.belong_name || '') + '</div>' +
            '</div></div>' +
            '<div class="dt-hero-fields">' +
            '<div class="dt-hero-field"><div class="dt-hero-field-label">预存款</div><div class="dt-hero-field-value" style="color:#165DFF">' + esc(r.advance_deposit || '0.00') + '</div></div>' +
            '<div class="dt-hero-field"><div class="dt-hero-field-label">抵扣券</div><div class="dt-hero-field-value" style="color:#00B42A">' + esc(r.deduction || '0.00') + '</div></div>' +
            '<div class="dt-hero-field"><div class="dt-hero-field-label">保证金</div><div class="dt-hero-field-value" style="color:#FF7D00">' + esc(r.margin_deposit || '0.00') + '</div></div>' +
            '<div class="dt-hero-field"><div class="dt-hero-field-label">创建时间</div><div class="dt-hero-field-value">' + fmtTime(r.create_time) + '</div></div>' +
            '</div></div>';"""),
]


def main():
    with open(SRC, "r", encoding="utf-8") as fh:
        src = fh.read()

    for name, old, new in PATCHES:
        n = src.count(old)
        if n != 1:
            print("[FAIL] 补丁 %s 匹配 %d 次（需恰好 1 次）" % (name, n))
            sys.exit(1)
        src = src.replace(old, new)
        print("[ok] %s" % name)

    # 头部注释 + 适配层前置
    out = PRELUDE + "\n" + src

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(out)
    print("生成 %s（%d 行）" % (OUT, out.count("\n") + 1))


if __name__ == "__main__":
    main()
