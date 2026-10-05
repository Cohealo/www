(function () {
  // Total equipment moves to date. This is the one place to update it; every [data-moves] element shows it.
  var MOVES = 9847;
  document.querySelectorAll('[data-moves]').forEach(function (el) { el.textContent = MOVES.toLocaleString('en-US'); });

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
    var header = nav.parentElement;
    var hero = document.querySelector('.hero');
    var navHeight = nav.offsetHeight;
    var navFrame = null;
    // Hero rect is read live: web fonts change its height after this script runs.
    var onScroll = function () {
      navFrame = null;
      var pastHero = hero ? hero.getBoundingClientRect().bottom <= navHeight : window.scrollY > 8;
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
      header.classList.toggle('is-dark', pastHero);
    };
    onScroll();
    window.addEventListener('scroll', function () { if (navFrame === null) navFrame = requestAnimationFrame(onScroll); }, { passive: true });
    window.addEventListener('resize', function () { navHeight = nav.offsetHeight; onScroll(); });
  }

  var supportsIO = 'IntersectionObserver' in window;

  // [data-scroll] elements get --p: 0 as their top enters the viewport, 1 as their bottom leaves it.
  var tracked = [];
  var frame = null;
  var vh = window.innerHeight;
  // Read all rects before writing any style so one frame costs one layout.
  var update = function () {
    frame = null;
    var rects = tracked.map(function (t) { return t.el.getBoundingClientRect(); });
    tracked.forEach(function (t, i) {
      var r = rects[i];
      var p = (vh - r.top) / (vh + r.height);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      if (Math.abs(p - t.last) < 0.0005) return;
      t.last = p;
      t.el.style.setProperty('--p', p.toFixed(4));
      if (t.fn) t.fn(p, r);
    });
  };
  var schedule = function () { if (frame === null) frame = requestAnimationFrame(update); };
  var motion = {
    track: function (el, fn) {
      if (!el) return;
      if (reduceMotion) { el.style.setProperty('--p', '1'); if (fn) fn(1, el.getBoundingClientRect()); return; }
      tracked.push({ el: el, fn: fn, last: -1 });
      schedule();
    },
    reveal: function (el, fn, threshold) {
      if (!el) return;
      var done = function () { el.classList.add('is-in'); if (fn) fn(el); };
      if (!supportsIO || reduceMotion) { done(); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); done(); } });
      }, { threshold: threshold == null ? 0.2 : threshold });
      io.observe(el);
    },
    tween: function (duration, onFrame, onDone) {
      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        onFrame(t);
        if (t < 1) requestAnimationFrame(step); else if (onDone) onDone();
      };
      requestAnimationFrame(step);
    }
  };
  document.querySelectorAll('[data-scroll]').forEach(function (el) { motion.track(el); });
  var heroBand = document.querySelector('.pg-index .hero');
  if (heroBand && !reduceMotion) {
    motion.track(heroBand, function (p, r) {
      heroBand.style.setProperty('--hero-y', Math.max(0, -r.top) * 0.28 + 'px');
    });
  }
  document.querySelectorAll('.reveal').forEach(function (el) { motion.reveal(el); });
  initLg();
  initSl();
  if (tracked.length) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', function () { vh = window.innerHeight; tracked.forEach(function (t) { t.last = -1; }); schedule(); });
  }

  // Step connectors draw once the path is in view.
  document.querySelectorAll('.process-grid').forEach(function (p) { motion.reveal(p, null, .35); });

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

function initLg() {
  var section = document.querySelector('body.pg-index .solve');
  if (!section) return;
  var steps = section.querySelectorAll('.lg-step');
  var cards = section.querySelectorAll('.solve-card');
  var last = steps.length - 1;

  var applyState = function (activeIndex, allActive) {
    steps.forEach(function (s, i) {
      s.classList.toggle('is-lit', allActive || i <= activeIndex);
      s.classList.toggle('is-active', !allActive && i === activeIndex);
    });
    cards.forEach(function (c, i) {
      c.classList.toggle('is-active', allActive || i === activeIndex);
      c.classList.toggle('is-done', !allActive && i < activeIndex);
    });
  };

  if (reduceMotion) {
    steps.forEach(function (s) { s.style.setProperty('--f', '1'); });
    applyState(last, true);
    return;
  }

  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var leg = function (i) {
    var from = steps[i - 1];
    motion.tween(1000, function (t) { from.style.setProperty('--f', easeOut(t).toFixed(4)); }, function () {
      applyState(i, false);
      if (i < last) leg(i + 1);
    });
  };
  applyState(-1, false);
  motion.reveal(section.querySelector('.solve-grid') || section, function () { applyState(0, false); leg(1); }, .2);
}

// Selecting a service line swaps the panel list; the unit marker flips legs so
// every change reads as the same equipment moving, without implying a real route.
function initSl() {
  var explorer = document.querySelector('body.pg-index .sl-explorer');
  if (!explorer) return;
  var buttons = explorer.querySelectorAll('.sl-specialty');
  var unit = explorer.querySelector('.sl-unit');
  var unitName = explorer.querySelector('.sl-unit-name');
  var status = explorer.querySelector('.sl-status');
  var stop = 0;

  var select = function (slug) {
    var btn = explorer.querySelector('.sl-specialty[data-specialty="' + slug + '"]');
    if (!btn || btn.getAttribute('aria-pressed') === 'true') return btn;
    var panel;
    buttons.forEach(function (b) {
      var on = b === btn;
      b.setAttribute('aria-pressed', String(on));
      var p = document.getElementById(b.getAttribute('aria-controls'));
      p.hidden = !on;
      if (on) panel = p;
    });
    stop = 1 - stop;
    unit.style.setProperty('--stop', stop);
    unitName.textContent = panel.getAttribute('data-unit');
    status.textContent = panel.querySelector('.sl-panel-title').textContent;
    return btn;
  };

  explorer.addEventListener('click', function (e) {
    var btn = e.target.closest('.sl-specialty');
    if (btn) { select(btn.getAttribute('data-specialty')); return; }
    var tag = e.target.closest('.sl-tag');
    if (tag) {
      var target = select(tag.getAttribute('data-specialty'));
      if (target) target.focus();
    }
  });
}

})();
