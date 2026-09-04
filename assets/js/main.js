/* AirPro Heating & Cooling  |  scroll and motion behaviour */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- split headlines into per character spans ---------- */
  function splitHeadings() {
    var nodes = document.querySelectorAll('[data-split]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var words = el.textContent.trim().split(/\s+/);
      var frag = document.createDocumentFragment();
      var idx = 0;
      for (var w = 0; w < words.length; w++) {
        var wrap = document.createElement('span');
        wrap.className = 'split';
        var chars = words[w].split('');
        for (var c = 0; c < chars.length; c++) {
          var s = document.createElement('span');
          s.className = 'split__c';
          s.textContent = chars[c];
          s.style.transitionDelay = (idx * 22) + 'ms';
          wrap.appendChild(s);
          idx++;
        }
        frag.appendChild(wrap);
        if (w < words.length - 1) frag.appendChild(document.createTextNode(' '));
      }
      el.textContent = '';
      el.appendChild(frag);
    }
  }
  if (!reduced) splitHeadings();

  /* ---------- entrance reveals ---------- */
  var revealTargets = document.querySelectorAll('[data-reveal], [data-split], .work__item, .years__shot');

  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        window.setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    for (var r = 0; r < revealTargets.length; r++) io.observe(revealTargets[r]);
  } else {
    for (var q = 0; q < revealTargets.length; q++) revealTargets[q].classList.add('is-in');
  }

  /* ---------- counter ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduced) { el.textContent = String(target); return; }
    var start = null;
    var dur = 1400;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        runCount(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    for (var n = 0; n < counters.length; n++) cio.observe(counters[n]);
  } else {
    for (var m = 0; m < counters.length; m++) runCount(counters[m]);
  }

  /* ---------- scroll driven: meter, masthead, parallax, nav state ---------- */
  var meter = document.querySelector('.scroll-meter__fill');
  var masthead = document.getElementById('masthead');
  var bleedImg = document.querySelector('.work__bleed img');
  var bleedWrap = document.querySelector('.work__bleed');
  var sections = [];
  var navLinks = document.querySelectorAll('.nav a');
  for (var s = 0; s < navLinks.length; s++) {
    var id = navLinks[s].getAttribute('href');
    var sec = id && id.charAt(0) === '#' ? document.querySelector(id) : null;
    if (sec) sections.push({ link: navLinks[s], el: sec });
  }

  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var docH = document.documentElement.scrollHeight - window.innerHeight;

    if (meter) meter.style.width = (docH > 0 ? (y / docH) * 100 : 0) + '%';
    if (masthead) masthead.classList.toggle('is-stuck', y > 40);
    document.documentElement.style.setProperty('--sy', String(y));

    if (bleedImg && bleedWrap && !reduced) {
      var rect = bleedWrap.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        var mid = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        bleedImg.style.setProperty('--py', String(Math.round(mid * -70)));
      }
    }

    var current = null;
    for (var i = 0; i < sections.length; i++) {
      var top = sections[i].el.getBoundingClientRect().top;
      if (top <= window.innerHeight * 0.4) current = sections[i];
    }
    for (var j = 0; j < sections.length; j++) {
      sections[j].link.classList.toggle('is-current', current === sections[j]);
    }
    ticking = false;
  }
  function requestScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ---------- mobile drawer ---------- */
  var burger = document.querySelector('.burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    var setDrawer = function (open) {
      drawer.hidden = !open;
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () {
      setDrawer(burger.getAttribute('aria-expanded') !== 'true');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setDrawer(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setDrawer(false);
    });
  }

  /* ---------- shop lamp lighting on dark sections ---------- */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    var lamps = document.querySelectorAll('.lamp');
    for (var l = 0; l < lamps.length; l++) {
      (function (panel) {
        panel.addEventListener('pointermove', function (e) {
          var box = panel.getBoundingClientRect();
          panel.style.setProperty('--mx', ((e.clientX - box.left) / box.width) * 100 + '%');
          panel.style.setProperty('--my', ((e.clientY - box.top) / box.height) * 100 + '%');
          panel.classList.add('is-lit');
        });
        panel.addEventListener('pointerleave', function () {
          panel.classList.remove('is-lit');
        });
      })(lamps[l]);
    }
  }
})();
