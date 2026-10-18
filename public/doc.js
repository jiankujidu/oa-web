// 优品OA 网页版 · 订单销售协议（供货合同）处理
// 由 App 源码 doc.js 移植：readFileBase64Async → fetch(arrayBuffer)；原生桥 → 浏览器能力；
// 文档库（jszip/docx-preview/mammoth/html2canvas/jspdf）经 Worker 代理 /vendor/* 到 GitHub Pages，失败回退 jsdelivr CDN。
// 数据来源：GET /customer/order/salesagreement.html?id={订单id} → .docx（Content-Disposition 带真实文件名）
var Doc = (function () {
    var BASE = (window.OA && OA.BASE) || (window.OA_BASE) || 'https://oa.upingbio.cn';
    var state = {
        orderId: null, orderCode: '', customer: '', title: '',
        docName: '', url: '', mode: 'view',
        buffer: null,            // 原始 docx ArrayBuffer（高保真渲染用）
        lastPdfName: '', lastPdfB64: ''
    };

    // 文档库 CDN 兜底表（/vendor/* 代理失败时使用）
    var CDN = {
        jszip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
        docx: 'https://cdn.jsdelivr.net/npm/docx-preview@0.3.5/dist/docx-preview.min.js',
        mammoth: 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
        html2canvas: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        jspdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
    };

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function toast(msg) {
        if (typeof webToast === 'function') { webToast(msg); return; }
        var t = document.getElementById('app-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'app-toast';
            t.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);background:rgba(0,0,0,.78);color:#fff;font-size:13px;padding:8px 16px;border-radius:8px;z-index:9999;max-width:80%;text-align:center';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.display = 'block';
        clearTimeout(t.__timer);
        t.__timer = setTimeout(function () { t.style.display = 'none'; }, 1800);
    }
    function salesUrl(orderId) {
        return BASE + '/customer/order/salesagreement.html?id=' + orderId;
    }
    // 合同显示名：订单号 + 客户名（与订单一致）
    function contractLabel() {
        var parts = [];
        if (state.orderCode) parts.push(state.orderCode);
        if (state.customer) parts.push(state.customer);
        return parts.join(' · ') || ('订单' + (state.orderId || ''));
    }
    // 下载/转发文件名：优先服务端真实名（日期+客户+订单号），否则本地拼接
    function outName(ext) {
        var base = String(state.docName || '').replace(/\.docx?$/i, '');
        if (!base) base = saleDefaultName().replace(/\.docx$/i, '');
        return base + '.' + ext;
    }
    function saleDefaultName() {
        var d = new Date();
        function p(n) { return (n < 10 ? '0' : '') + n; }
        var ds = '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
        return ds + (state.customer || '') + (state.orderCode || state.orderId || '') + '.docx';
    }

    // ===== 1. 入口：订单详情「销售协议（合同）」 =====
    function openSalesAgreement(orderId, opt) {
        opt = opt || {};
        state.orderId = orderId;
        state.orderCode = opt.code || '';
        state.customer = opt.customer || '';
        state.title = opt.title || '销售协议';
        state.docName = opt.name || '';
        state.url = salesUrl(orderId);
        state.mode = 'loading';
        state.lastPdfB64 = ''; state.lastPdfName = '';
        App.openDocShell('销售协议', function () {
            if (state.orderId) App.openOrderDetail(state.orderId, opt.kind || 'handle');
            else App.switchTab('home');
        });
        var box = document.getElementById('page-container');
        if (box) box.innerHTML = shellHtml(loadingHtml('正在打开 Word 版销售协议…'));
        readAndRender();
    }
    function loadingHtml(msg) {
        return '<div class="ct-doc-card" style="padding:26px 14px;text-align:center">' +
            '<div class="ct-loading-txt">' + esc(msg) + '</div>' +
            '<div class="ct-empty-sub">首次打开需要下载 Word 原件，请稍候</div></div>';
    }
    // 页面骨架：信息条（订单号 · 客户名）+ 内容区 + 底部操作栏
    function shellHtml(inner) {
        return '<div class="ct-page ct-doc-page">' +
            '<div class="ct-doc-bar">' +
            '<div class="ct-doc-bar-row">' +
            '<div><div class="ct-doc-bar-main">' + esc(contractLabel()) + '</div>' +
            '<div class="ct-doc-bar-sub">销售协议（供货合同）· Word 版</div></div>' +
            '<button class="ct-doc-zoom" onclick="Doc.toggleZoom()">查看大小</button>' +
            '</div></div>' +
            '<div id="ct-doc-host" class="ct-doc-host">' + (inner || '') + '</div>' +
            '<div class="ct-actionbar">' +
            '<button class="ct-btn ct-btn-ghost ct-btn-sm" onclick="Doc.openWithApp()">编辑</button>' +
            '<button class="ct-btn ct-btn-ghost ct-btn-sm" onclick="Doc.downloadWord()">下载 Word</button>' +
            '<button class="ct-btn ct-btn-ghost ct-btn-sm" onclick="Doc.toPdf()">⇩ 转 PDF</button>' +
            '<button class="ct-btn ct-btn-main ct-btn-sm" onclick="Doc.sharePdf()">↗ 保存 PDF</button>' +
            '</div></div>';
    }
    // 下载 Word 原件 → docx-preview 高保真渲染（版式与 Word 一致）
    function readAndRender() {
        fetch(state.url, { credentials: 'include' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            // 从 Content-Disposition 提取服务端真实文件名
            var cd = r.headers.get('Content-Disposition') || '';
            var m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
            if (m) {
                try { state.docName = decodeURIComponent(m[1].trim()); } catch (e) { state.docName = m[1].trim(); }
            }
            return r.arrayBuffer();
        }).then(function (buf) {
            state.buffer = buf;
            renderFidelity();
        }).catch(function (e) {
            var host = document.getElementById('ct-doc-host');
            if (host) {
                host.innerHTML = '<div class="ct-doc-card" style="padding:26px 14px;text-align:center">' +
                    '<div class="ct-empty-txt">销售协议打开失败</div>' +
                    '<div class="ct-empty-sub">' + esc(e && e.message ? e.message : '下载失败') + '</div>' +
                    '<div style="margin-top:14px"><button class="ct-btn ct-btn-ghost" onclick="Doc.downloadWord()">下载 Word 原件</button></div>' +
                    '</div>';
            }
        });
    }
    // 高保真渲染（docx-preview 依赖 JSZip，本地库按需加载）
    function renderFidelity() {
        ensureLib('jszip', function () {
            ensureLib('docx', function () {
                var host = document.getElementById('ct-doc-host');
                if (!host) return;
                host.innerHTML = '';
                try {
                    docx.renderAsync(state.buffer.slice(0), host, null, {
                        inWrapper: true,
                        ignoreWidth: false,     // 保持 Word 原始页宽与页边距（A4），再整体等比缩放到容器宽
                        ignoreHeight: false,
                        ignoreFonts: false,
                        breakPages: true        // 按 A4 分页，与 Word 一致（保留页边距与分页边界）
                    }).then(function () {
                        state.mode = 'view';
                        fitWidth();
                    }).catch(function () {
                        fallbackSimple();
                    });
                } catch (e) {
                    fallbackSimple();
                }
            });
        });
    }
    // 整体等比缩放到容器宽度（版式 1:1 保持，避免表格/文字被截断）
    function fitWidth() {
        var host = document.getElementById('ct-doc-host');
        if (!host) return;
        var wrap = host.querySelector('.docx-wrapper');
        if (!wrap) return;
        var sec = wrap.querySelector('section.docx') || wrap;
        var docW = sec.offsetWidth || 794;
        var avail = host.clientWidth - 16;
        if (docW <= 0 || avail <= 0) return;
        var z = Math.min(1, avail / docW);
        wrap.style.transformOrigin = 'top left';
        wrap.style.zoom = z;
        wrap.style.width = 'auto';
    }
    // 点击文档区在"适应屏宽 / 原始大小（可横向滑动）"之间切换
    function toggleZoom() {
        var host = document.getElementById('ct-doc-host');
        if (!host) return;
        var wrap = host.querySelector('.docx-wrapper');
        if (!wrap) return;
        var sec = wrap.querySelector('section.docx') || wrap;
        var docW = sec.offsetWidth || 794;
        var z = parseFloat(wrap.style.zoom || '1');
        var fit = Math.min(1, (host.clientWidth - 16) / docW);
        if (Math.abs(z - fit) < 0.01) {
            wrap.style.zoom = 1;
            wrap.style.width = 'auto';
            host.style.overflowX = 'auto';
            toast('已切换原始大小，可左右滑动查看');
        } else {
            fitWidth();
            toast('已适应屏宽');
        }
    }
    // 兜底：高保真渲染不可用时退回简化 HTML（mammoth）
    function fallbackSimple() {
        ensureLib('mammoth', function () {
            mammoth.convertToHtml({ arrayBuffer: state.buffer.slice(0) }).then(function (res) {
                var host = document.getElementById('ct-doc-host');
                if (host) host.innerHTML = '<div class="ct-simple">' + (res.value || '<p>（文档内容为空）</p>') + '</div>';
            }).catch(function () {
                var host = document.getElementById('ct-doc-host');
                if (host) host.innerHTML = '<div class="ct-doc-card" style="padding:20px;text-align:center"><div class="ct-empty-sub">文档解析失败，可下载 Word 原件后查看</div></div>';
            });
        });
    }

    // ===== 2. 编辑：新标签页打开 Word 原件（浏览器调用本机 Office/WPS） =====
    function openWithApp() {
        var url = state.url || salesUrl(state.orderId);
        try { window.open(url, '_blank'); } catch (e) { toast('打开失败'); }
    }

    // ===== 3. 下载 Word 原件 =====
    function downloadWord() {
        var name = outName('docx');
        if (typeof webDownload === 'function') {
            if (webDownload(state.url || salesUrl(state.orderId), name)) { toast('已开始下载：' + name); return; }
        }
        toast('下载失败');
    }

    // ===== 4. 转 PDF（对高保真渲染结果按 A4 宽重排后截图分页，与原版式一致） =====
    function toPdf() {
        var host = document.getElementById('ct-doc-host');
        if (!host || !host.innerHTML || host.querySelector('.ct-loading-txt')) {
            toast('文档尚未加载完成，请稍候');
            return;
        }
        toast('正在生成 PDF…');
        ensureLib('html2canvas', function () {
            ensureLib('jspdf', function () {
                var clone = host.cloneNode(true);
                clone.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:0;margin:0;background:#fff;box-shadow:none;z-index:-1';
                var wrap = clone.querySelector('.docx-wrapper');
                if (wrap) wrap.style.cssText = 'background:#fff;padding:0;margin:0;box-shadow:none';
                // 不覆盖文档自身的页宽与页边距：保持与 Word 原件一致的版式
                var secs = clone.querySelectorAll('.docx-wrapper > section.docx, section.docx');
                for (var i = 0; i < secs.length; i++) {
                    secs[i].style.boxShadow = 'none';
                    secs[i].style.margin = '0';
                    secs[i].style.background = '#fff';
                }
                document.body.appendChild(clone);
                html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, width: 794, windowWidth: 794 }).then(function (canvas) {
                    var jsPDFctor = window.jspdf && window.jspdf.jsPDF;
                    if (!jsPDFctor) { toast('PDF 组件加载失败'); return; }
                    var pdf = new jsPDFctor('p', 'mm', 'a4');
                    var pageW = 210, pageH = 297;
                    var imgW = pageW;
                    var pageContentH = canvas.width * (pageH / pageW);
                    var rendered = 0, page = 0;
                    while (rendered < canvas.height) {
                        var sliceH = Math.min(pageContentH, canvas.height - rendered);
                        var slice = document.createElement('canvas');
                        slice.width = canvas.width;
                        slice.height = sliceH;
                        slice.getContext('2d').drawImage(canvas, 0, rendered, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
                        if (page > 0) pdf.addPage();
                        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgW, sliceH * imgW / canvas.width);
                        rendered += sliceH;
                        page++;
                    }
                    var b64 = pdf.output('datauristring').split(',')[1];
                    state.lastPdfName = outName('pdf');
                    state.lastPdfB64 = b64;
                    if (clone.parentNode) clone.parentNode.removeChild(clone);
                    toast('PDF 已生成（' + page + ' 页）');
                    savePdfB64();
                }).catch(function () {
                    if (clone.parentNode) clone.parentNode.removeChild(clone);
                    toast('PDF 生成失败，请重试');
                });
            });
        });
    }
    function sharePdf() {
        if (state.lastPdfB64) { savePdfB64(); return; }
        toPdf();
    }
    // 网页版「转发」= 保存 PDF 到本地（浏览器无系统分享面板）
    function sharePdfB64() {
        savePdfB64();
    }
    // base64 → Blob → <a download> 保存
    function savePdfB64() {
        if (!state.lastPdfB64) { toast('请先转 PDF'); return; }
        try {
            var bin = atob(state.lastPdfB64);
            var bytes = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            var blob = new Blob([bytes], { type: 'application/pdf' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = state.lastPdfName || '销售协议.pdf';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                URL.revokeObjectURL(a.href);
                if (a.parentNode) a.parentNode.removeChild(a);
            }, 900);
            toast('已保存：' + a.download);
        } catch (e) { toast('保存失败'); }
    }

    // ===== 工具：动态加载文档库（/vendor/* 经 Worker 代理到 GitHub Pages，失败回退 jsdelivr CDN） =====
    var libLoading = {};
    function loadScript(url, cb, errcb) {
        var s = document.createElement('script');
        s.src = url;
        s.onload = function () { cb(); };
        s.onerror = function () { if (errcb) errcb(); };
        document.head.appendChild(s);
    }
    function ensureLib(name, cb) {
        if (name === 'jszip' && window.JSZip) { cb(); return; }
        if (name === 'docx' && window.docx) { cb(); return; }
        if (name === 'mammoth' && window.mammoth) { cb(); return; }
        if (name === 'html2canvas' && window.html2canvas) { cb(); return; }
        if (name === 'jspdf' && window.jspdf) { cb(); return; }
        if (libLoading[name]) { libLoading[name].push(cb); return; }
        libLoading[name] = [cb];
        var fired = false;
        function done() {
            if (fired) return; fired = true;
            var cbs = libLoading[name]; libLoading[name] = null;
            for (var i = 0; i < cbs.length; i++) cbs[i]();
        }
        function fail() {
            libLoading[name] = null;
            toast(name + ' 组件加载失败');
        }
        // 第一跳：同域 /vendor/*（Worker → GitHub Pages）；失败回退 CDN
        loadScript('/vendor/' + VENDOR_FILES[name], done, function () {
            loadScript(CDN[name], done, fail);
        });
    }
    var VENDOR_FILES = {
        jszip: 'jszip.min.js',
        docx: 'docx-preview.min.js',
        mammoth: 'mammoth.min.js',
        html2canvas: 'html2canvas.min.js',
        jspdf: 'jspdf.umd.min.js'
    };

    return {
        openSalesAgreement: openSalesAgreement,
        toggleZoom: toggleZoom,
        openWithApp: openWithApp,
        downloadWord: downloadWord,
        toPdf: toPdf,
        sharePdf: sharePdf,
        sharePdfB64: sharePdfB64,
        savePdfB64: savePdfB64
    };
})();
