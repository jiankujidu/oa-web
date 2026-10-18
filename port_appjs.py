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

'''

# (说明, 原文, 替换文) —— 原文必须与 App 源码逐字匹配
PATCHES = [
    # toast 兜底：alert → webToast
    ("toast", """        if (window.AndroidBridge) AndroidBridge.toast(msg);
        else alert(msg);""",
     """        if (window.AndroidBridge) AndroidBridge.toast(msg);
        else webToast(msg);"""),

    # init：网页版无登录视图，直接进主界面
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
