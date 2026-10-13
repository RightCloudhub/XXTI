// XXTI 公共布局：背景层、顶部导航、页脚。HTML 里只保留 <main>，其余在这里统一生成。
(function (XXTI) {
  'use strict';

  const { SITE } = XXTI;
  const { h } = XXTI.dom;

  function renderBackdrop() {
    return [
      h('div', { class: 'backdrop', 'aria-hidden': 'true' }),
      h('div', { class: 'motion-field', 'aria-hidden': 'true' },
        ['one', 'two', 'three'].map((name) => h('span', { class: 'motion-orb motion-orb-' + name })))
    ];
  }

  function renderHeader(page) {
    return h('header', { class: 'site-header' },
      h('nav', { class: 'nav', 'aria-label': '主导航' },
        h('a', { class: 'brand', href: 'index.html' }, SITE.name),
        h('div', { class: 'nav-links' },
          SITE.nav.map((item) => h('a', {
            href: item.href,
            class: item.page === page ? 'is-current' : null,
            'aria-current': item.page === page ? 'page' : null
          }, item.label)))));
  }

  function renderFooter(page) {
    return h('footer', { class: 'site-footer' },
      h('div', { class: 'footer-links' },
        SITE.nav
          .filter((item) => item.page !== page)
          .map((item) => h('a', { href: item.href }, item.label))),
      h('p', null, SITE.footer[page] || SITE.footer.home));
  }

  function mount() {
    const page = document.body.dataset.page || 'home';
    document.body.prepend(...renderBackdrop(), renderHeader(page));
    const main = document.querySelector('main');
    if (main) main.after(renderFooter(page));
    return page;
  }

  XXTI.layout = { mount };
})(window.XXTI = window.XXTI || {});
