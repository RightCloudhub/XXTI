// XXTI 动效：全部基于 GSAP，缺少 GSAP 或用户开启减少动态时一律跳过。
(function (XXTI) {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const CARD_SELECTOR = '.axis-preview article, .portal-card, .story-card, .dimension-card, .method-card, .atlas-card, .question-card';

  function can() {
    return Boolean(window.gsap) && !reduced.matches;
  }

  function exists(selector) {
    return document.querySelector(selector) !== null;
  }

  function ambient() {
    if (!can() || !exists('.motion-orb')) return;
    const { gsap } = window;
    gsap.to('.backdrop', { backgroundPosition: '64px 64px', duration: 22, ease: 'none', repeat: -1 });
    gsap.to('.motion-orb', {
      x: (index) => [52, -68, 38][index] || 32,
      y: (index) => [-38, 54, -46][index] || 28,
      rotation: (index) => [28, -22, 34][index] || 18,
      scale: (index) => [1.12, 0.92, 1.08][index] || 1.06,
      borderRadius: '58% 42% 46% 54%',
      duration: (index) => [8.5, 10.5, 9.2][index] || 9,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      stagger: 0.7
    });
  }

  function intro() {
    if (!can()) return;
    const timeline = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (exists('.site-header')) {
      timeline.from('.site-header', { autoAlpha: 0, y: -18, duration: 0.5 });
    }
    if (exists('.hero-copy, .copy-stack, .note-card')) {
      timeline.from('.hero-copy, .copy-stack, .note-card', { autoAlpha: 0, y: 28, duration: 0.64, stagger: 0.08, clearProps: 'opacity,visibility,transform' }, '-=0.24');
    }
    if (exists('.hero-panel')) {
      timeline.from('.hero-panel', { autoAlpha: 0, x: 28, y: 18, duration: 0.72, ease: 'back.out(1.4)' }, '-=0.42');
    }
  }

  function cards(root = document) {
    if (!can()) return;
    const items = root.querySelectorAll(CARD_SELECTOR);
    if (items.length === 0) return;
    window.gsap.from(items, { autoAlpha: 0, y: 18, duration: 0.42, ease: 'power2.out', stagger: 0.03, clearProps: 'opacity,visibility,transform' });
  }

  function press(element) {
    if (!can() || !element) return;
    window.gsap.fromTo(element, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: 'back.out(2.4)', clearProps: 'transform' });
  }

  function shake(element) {
    if (!can() || !element) return;
    window.gsap.fromTo(element, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.35)', clearProps: 'transform' });
  }

  function swap(element) {
    if (!can() || !element || element.children.length === 0) return;
    window.gsap.from(element.children, { autoAlpha: 0, y: 14, duration: 0.4, ease: 'power2.out', stagger: 0.045, clearProps: 'opacity,visibility,transform' });
  }

  function reveal(panel) {
    if (!can() || !panel) return;
    const { gsap } = window;
    const bars = panel.querySelectorAll('.axis-bar span');
    const blocks = panel.querySelectorAll('.axis-score-card, .result-columns article');
    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
    timeline.from(panel, { autoAlpha: 0, y: 20, duration: 0.34, clearProps: 'opacity,visibility,transform' });
    if (bars.length) {
      timeline.from(bars, { scaleX: 0, transformOrigin: 'left center', duration: 0.5, stagger: 0.06, clearProps: 'transform' }, '-=0.1');
    }
    if (blocks.length) {
      timeline.from(blocks, { autoAlpha: 0, y: 14, duration: 0.34, stagger: 0.045, clearProps: 'opacity,visibility,transform' }, '-=0.3');
    }
  }

  function stopAll() {
    if (!window.gsap) return;
    window.gsap.globalTimeline.clear();
    window.gsap.set('.backdrop, .motion-orb', { clearProps: 'all' });
  }

  function init() {
    ambient();
    intro();
    document.addEventListener('click', (event) => {
      const target = event.target.closest('.button, .atlas-card');
      if (target) press(target);
    });
    const onChange = () => (reduced.matches ? stopAll() : ambient());
    if (reduced.addEventListener) reduced.addEventListener('change', onChange);
    else reduced.addListener(onChange);
  }

  XXTI.motion = { init, cards, press, shake, swap, reveal };
})(window.XXTI = window.XXTI || {});
