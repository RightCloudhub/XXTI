// XXTI DOM 小工具：用 h() 建节点，文本一律走 textContent，不拼 innerHTML。
(function (XXTI) {
  'use strict';

  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : String(value));
    });
    children.flat(Infinity).forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      node.append(child instanceof Node ? child : String(child));
    });
    return node;
  }

  function list(items, tag = 'ul', attrs = null) {
    return h(tag, attrs, items.map((item) => h('li', null, item)));
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function render(target, ...nodes) {
    if (target) target.replaceChildren(...nodes.flat(Infinity).filter(Boolean));
    return target;
  }

  XXTI.dom = { h, list, $, render };
})(window.XXTI = window.XXTI || {});
