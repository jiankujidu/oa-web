# ===== v5 首页（桌面仪表盘 / 手机原生 双版本，视口分支渲染）=====
V3_HOME = r'''    function isPhone() { return window.innerWidth < 992; }

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
'''
