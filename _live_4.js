
/* 启动逻辑：CSS/JS 已由构建内联进本页，DOM 解析到这里即可直接执行，不等待 window.load。
 * try/catch + 3.5s 看门狗双兜底，任何异常都不会卡死在启动屏。
 * 任何"退回登录页"的路径都会先把原因写入 localStorage（uping_boot_err），登录页 90 秒内回显。 */
(function () {
  var sp = document.getElementById('boot-splash');
  function hideSplash() { if (sp) sp.style.display = 'none'; }
  function recordErr(tag, e) {
    try {
      localStorage.setItem('uping_boot_err', JSON.stringify({
        t: Date.now(), tag: tag,
        m: String((e && e.message) || e || 'unknown'),
        s: String((e && e.stack) || '').slice(0, 260)
      }));
    } catch (_e) {}
  }
  // 全局错误兜底：运行期任何未捕获异常都记录（便于定位"莫名弹回"）
  window.addEventListener('error', function (ev) { recordErr('运行时错误', ev.error || ev.message); });
  window.addEventListener('unhandledrejection', function (ev) { recordErr('异步异常', ev.reason); });
  function boot() {
    try {
      if (OA.isLoggedIn()) {
        document.getElementById('app-view').style.display = 'flex';
        App.init();
        hideSplash();
      } else {
        location.replace('login.html');
      }
    } catch (e) {
      // 启动异常：记录原因 → 清登录态回登录页，绝不留在启动屏
      recordErr('主界面启动异常', e);
      try { localStorage.removeItem('uping_user'); localStorage.removeItem('uping_me'); } catch (_e) {}
      location.replace('login.html');
    }
  }
  // 看门狗：3.5s 后若启动屏仍在（脚本异常/极端情况），强制恢复
  setTimeout(function () {
    if (!sp || sp.style.display === 'none') return;
    var logged = false;
    try { logged = localStorage.getItem('uping_user') === '1'; } catch (e) {}
    if (!logged) { recordErr('看门狗', '启动屏未消失且无登录态'); location.replace('login.html'); return; }
    hideSplash();
    var av = document.getElementById('app-view');
    if (av && av.style.display === 'none') {
      av.style.display = 'flex';
      try { App.init(); } catch (e) { recordErr('看门狗重试', e); }
    }
  }, 3500);
  boot();
})();
