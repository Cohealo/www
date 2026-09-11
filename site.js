(function () {
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
  }

  // Hover-capable devices (desktop) reveal the tooltip on :hover alone (see CSS);
  // click-to-toggle is only wired up where hover isn't available (touch), since
  // a click's persistent open state would otherwise linger independently of
  // whatever the user is currently hovering.
  var supportsHover = window.matchMedia('(hover: hover)').matches;
  var items = document.querySelectorAll('.sl-item');
  if (!supportsHover && items.length) {
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
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.sl-item')) closeAll(); });
  }
})();
