(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('nav');
  var toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false);
    });
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var items = document.querySelectorAll('.sl-item');
  var closeAll = function (except) {
    items.forEach(function (it) {
      if (it === except) return;
      it.classList.remove('is-open');
      it.querySelector('.sl-chip').setAttribute('aria-expanded', 'false');
    });
  };
  items.forEach(function (it) {
    var btn = it.querySelector('.sl-chip');
    btn.addEventListener('click', function () {
      var open = !it.classList.contains('is-open');
      closeAll(it);
      it.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  if (items.length) {
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.sl-item')) closeAll(); });
  }

  var supportsIO = 'IntersectionObserver' in window;

  // Step connectors draw once the path is in view.
  var paths = document.querySelectorAll('.steps, .process-grid');
  if (paths.length) {
    if (!supportsIO || reduceMotion) {
      paths.forEach(function (p) { p.classList.add('is-seen'); });
    } else {
      var pathObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-seen'); pathObserver.unobserve(en.target); }
        });
      }, { threshold: 0.35 });
      paths.forEach(function (p) { pathObserver.observe(p); });
    }
  }

  // Hero figures count up once. The final text is authored in the markup, so the
  // number is parsed from it and restored verbatim when the count ends.
  var stats = document.querySelectorAll('.stat-num');
  if (stats.length && supportsIO && !reduceMotion) {
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };
    var countUp = function (el, delay) {
      var final = el.textContent;
      var m = final.match(/^([\d,]*\.?\d+)(.*)$/);
      if (!m) return;
      var target = parseFloat(m[1].replace(/,/g, ''));
      var decimals = (m[1].split('.')[1] || '').length;
      var suffix = m[2];
      var duration = 1100;
      var start = null;
      el.textContent = (0).toFixed(decimals) + suffix;
      var frame = function (now) {
        if (start === null) start = now + delay;
        var t = Math.min(Math.max((now - start) / duration, 0), 1);
        el.textContent = (target * easeOut(t)).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame); else el.textContent = final;
      };
      requestAnimationFrame(frame);
    };
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        statObserver.unobserve(en.target);
        countUp(en.target, 300 + 80 * Array.prototype.indexOf.call(stats, en.target));
      });
    }, { threshold: 0.5 });
    stats.forEach(function (s) { statObserver.observe(s); });
  }
})();
