/* =========================================================
   撕拉寄语 · StPageFlip 引擎 v19
   * 使用 Promise + 循环检测的方式，等待 #book 容器有尺寸后再初始化
   * 这样不依赖 CSS 加载与 DOM 渲染的相对时序
   ========================================================= */
(function () {

  // ---------- 诊断标记 ----------
  function diag(msg, ok) {
    var d = document.getElementById('__diag__');
    if (!d) {
      d = document.createElement('div');
      d.id = '__diag__';
      d.style.cssText = 'position:fixed;top:6px;left:6px;color:#0f0;font:bold 11px monospace;z-index:99999;background:rgba(0,0,0,.7);padding:4px 8px;border-radius:3px;pointer-events:none;white-space:pre';
      (document.body || document.documentElement).appendChild(d);
    }
    d.textContent = msg;
    d.style.color = ok === false ? '#f44' : (ok === true ? '#0f0' : '#fc8');
  }

  diag('v19 booting...');

  // ---------- 等待 window load 与可用尺寸 ----------
  function wait(conditionFn, thenFn, label, maxTry, interval) {
    var tries = 0;
    function step() {
      try {
        var v = conditionFn();
        if (v !== false && v != null && (typeof v !== 'number' || !isNaN(v))) {
          thenFn(v);
          return;
        }
      } catch (e) { /* keep trying */ }
      tries++;
      if (tries > maxTry) { diag('TIMEOUT: ' + label, false); return; }
      setTimeout(step, interval);
    }
    step();
  }

  function boot() {
    var bookEl = document.getElementById('book');
    if (!bookEl) { diag('no #book', false); return; }

    // 等 book 容器有尺寸（CSS 生效）
    wait(
      function() {
        var w = bookEl.clientWidth, h = bookEl.clientHeight;
        return (w > 50 && h > 50) ? { w: w, h: h } : false;
      },
      function(size) {
        diag('v19 book ' + size.w + 'x' + size.h);
        initFlip(bookEl, size.w, size.h);
      },
      'book size',
      80,   // 80 * 80ms = 6.4s
      80
    );
  }

  function initFlip(bookEl, w, h) {
    if (typeof St === 'undefined' || !St.PageFlip) {
      diag('St.PageFlip not loaded', false); return;
    }

    var pageFlip;
    try {
      pageFlip = new St.PageFlip(bookEl, {
        width: Math.floor(w / 2),
        height: Math.floor(h),
        size: 'fixed',
        showCover: true,
        mobileScrollSupport: false,
        drawShadow: true,
        flippingTime: 700,
        maxShadowOpacity: 0.5,
        startZIndex: 100,
        useMouseEvents: true,
        useTouchEvents: true
      });
    } catch (e) { diag('new St.PageFlip: ' + e.message, false); return; }

    try {
      pageFlip.loadFromHTML(document.querySelectorAll('.my-page'));
    } catch (e) { diag('loadFromHTML: ' + e.message, false); return; }

    diag('v19 OK ' + pageFlip.getPageCount() + ' pages', true);

    setTimeout(function () {
      var d = document.getElementById('__diag__');
      if (d) { d.style.transition = 'opacity 1s'; d.style.opacity = '0'; setTimeout(function () { d.remove(); }, 1200); }
    }, 4000);

    // 翻页状态
    var busy = false;
    pageFlip.on('changeState', function (e) { busy = (e.data === 'flipping'); });
    pageFlip.on('flip', function (e) {
      var pager = document.getElementById('pager'),
          hint  = document.getElementById('hint');
      if (e.data > 0) { if (pager) pager.classList.add('show'); if (hint) hint.classList.add('off'); }
      else            { if (pager) pager.classList.remove('show'); if (hint) hint.classList.remove('off'); }
    });

    // 把实例暴露出去以便调试
    window.__pageFlip = pageFlip;

    var prevBtn = document.getElementById('prev-btn');
    var nextBtn = document.getElementById('next-btn');
    var resetBtn = document.getElementById('reset-btn');
    if (prevBtn)  prevBtn.addEventListener('click', function () { if (!busy) pageFlip.flipPrev('top'); });
    if (nextBtn)  nextBtn.addEventListener('click', function () { if (!busy) pageFlip.flipNext('top'); });
    if (resetBtn) resetBtn.addEventListener('click', function () { pageFlip.turnToPage(0); var p = document.getElementById('pager'), h = document.getElementById('hint'); if (p) p.classList.remove('show'); if (h) h.classList.remove('off'); });
    if (resetBtn) resetBtn.classList.add('show');

    // 键盘
    document.addEventListener('keydown', function (e) {
      if (busy) return;
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); pageFlip.flipNext('top'); }
      else if (e.key === 'ArrowLeft')              { e.preventDefault(); pageFlip.flipPrev('top'); }
      else if (e.key === 'Home')                   { pageFlip.turnToPage(0); }
      else if (e.key === 'End')                    { pageFlip.turnToPage(5); }
    });

    // 双击
    bookEl.addEventListener('dblclick', function (e) {
      if (busy) return;
      var rect = bookEl.getBoundingClientRect();
      if (e.clientX - rect.left > rect.width * 0.55) pageFlip.flipNext('top');
      else pageFlip.flipPrev('top');
    });
  }

  // ---------- 启动 ----------
  if (document.readyState === 'complete') setTimeout(boot, 50);
  else window.addEventListener('load', function () { setTimeout(boot, 50); });

})();
