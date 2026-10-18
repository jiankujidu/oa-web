// 直接验证 moreBtn 桌面/移动分支 + 分页器 DOM（不依赖 mock 数据格式）
const { chromium } = require('playwright-core');
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  // 桌面
  for (const w of [1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w===1440?900:1080 }, isMobile: false });
    await ctx.addInitScript(() => localStorage.setItem('uping_user','1'));
    const page = await ctx.newPage();
    await page.goto('http://localhost:8123/index.html', { waitUntil:'networkidle' });
    await page.waitForTimeout(2200);
    await page.evaluate(() => App.switchTab('customer'));
    await page.waitForTimeout(1200);
    // 手动注入一张表格 + 分页器（模拟"有数据且有下一页"）
    const r = await page.evaluate(() => {
      const pc = document.getElementById('page-container');
      let wrap = pc.querySelector('.dt-table-wrap');
      if (!wrap) {
        // 客户双栏主区：在第一个 div 容器内造表格
        const host = pc.querySelector('.dt-cols > div') || pc;
        host.innerHTML = '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' +
          '<th>客户名称</th><th>类型</th><th>预存款</th><th>抵扣券</th><th>保证金</th><th>负责人</th><th>操作</th>' +
          '</tr></thead><tbody>' +
          Array.from({length:6},(_,i)=>'<tr><td>客户'+(i+1)+'</td><td>我的客户</td><td>1000</td><td>200</td><td>50</td><td>经理'+(i+1)+'</td><td><span class="dt-link">详情</span></td></tr>').join('') +
          '</tbody></table></div>';
        wrap = host.querySelector('.dt-table-wrap');
      }
      // 调 moreBtn 桌面分支生成分页器，插到表格后
      const pg = App.moreBtn('customer', 1);
      wrap.insertAdjacentHTML('afterend', pg);
      // 给表格加连体类
      wrap.classList.add('dt-pager-connected');
      // 注入工具栏按钮
      App.injectToolbarOps();
      const q=s=>document.querySelector(s); const cs=s=>q(s)?getComputedStyle(q(s)):null;
      return {
        hasPager: !!q('.dt-pager'),
        pagerDisp: cs('.dt-pager')?cs('.dt-pager').display:null,
        pgBtns: document.querySelectorAll('.dt-pager .pg-btn').length,
        pgPrev: !!q('.dt-pager [data-pg-prev]'), pgNext: !!q('.dt-pager [data-pg-next]'), pgSize: !!q('.dt-pager [data-pg-size]'),
        toolbarGhost: document.querySelectorAll('.dt-toolbar .oa-btn.ghost[data-desktop-only]').length,
        tableConnected: wrap.classList.contains('dt-pager-connected'),
        firstTdDisp: cs('.dt-table tbody td')?cs('.dt-table tbody td').display:null,
        mAppbar: cs('.m-appbar')?cs('.m-appbar').display:null,
      };
    });
    console.log('W'+w+' ' + JSON.stringify(r));
    await page.evaluate(() => App.pg('customer',1));
    await page.waitForTimeout(300);
    const info = await page.evaluate(()=> (document.querySelector('.dt-pager [data-pg-info]')||{}).textContent || null);
    console.log('W'+w+' pginfo=' + info);
    await page.screenshot({ path: 'pg_w'+w+'.png' });
    await ctx.close();
  }
  // 移动：moreBtn 返回 load-more（非分页器）
  const mctx = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' });
  await mctx.addInitScript(()=>localStorage.setItem('uping_user','1'));
  const mp = await mctx.newPage();
  await mp.goto('http://localhost:8123/index.html',{waitUntil:'networkidle'});
  await mp.waitForTimeout(2200);
  const mr = await mp.evaluate(()=>{
    const html = App.moreBtn('customer',1);
    return {
      mobile_returnsLoadMore: html.indexOf('load-more')>=0,
      mobile_noPager: html.indexOf('dt-pager')<0,
      device: document.documentElement.getAttribute('data-device'),
    };
  });
  console.log('mobile ' + JSON.stringify(mr));
  await browser.close();
  console.log('PHASE12_DONE');
})().catch(e=>{console.error(e);process.exit(1);});
