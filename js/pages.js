// XXTI 页面逻辑：按 body[data-page] 分发到首页、图鉴、测试、方法页。
(function (XXTI) {
  'use strict';

  const { DIMENSIONS, TYPES, QUESTIONS, SCALE } = XXTI;
  const { h, list, $, render } = XXTI.dom;
  const core = XXTI.core;
  const motion = XXTI.motion;
  const NEWLINE = String.fromCharCode(10);

  function scrollBehavior() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  // ---------- 共用片段 ----------

  function poleLabel(pole) {
    return pole.code + ' · ' + pole.title;
  }

  function dimensionCard(dimension) {
    return h('article', { class: 'dimension-card' },
      h('div', { class: 'axis-head' },
        h('div', null,
          h('div', { class: 'axis-code' }, dimension.left.code + ' / ' + dimension.right.code),
          h('h3', { class: 'axis-card-title' }, dimension.title)),
        h('p', null, dimension.subtitle)),
      h('p', { class: 'axis-question' }, dimension.question),
      h('div', { class: 'axis-poles' },
        [dimension.left, dimension.right].map((pole) => h('article', null,
          h('strong', null, poleLabel(pole)),
          h('p', null, pole.text)))),
      h('p', { class: 'axis-meta' }, dimension.research));
  }

  function renderDimensions() {
    render($('#dimension-grid'), DIMENSIONS.map(dimensionCard));
  }

  function profileSections(profile) {
    return [
      h('article', null, h('h4', null, '优势'), list(profile.strengths)),
      h('article', null, h('h4', null, '盲点'), list(profile.blindspots)),
      h('article', null, h('h4', null, '压力下'), h('p', null, profile.stress)),
      h('article', null, h('h4', null, '适配环境'), h('p', null, profile.fit)),
      h('article', null, h('h4', null, '升级建议'), h('p', null, profile.growth))
    ];
  }

  function typeChip(code) {
    return h('a', { class: 'type-chip', href: 'wiki.html?type=' + code, dataset: { type: code } },
      h('code', null, code),
      h('span', null, TYPES[code].name));
  }

  // ---------- 首页 ----------

  function initHome() {
    render($('#axis-preview'), DIMENSIONS.map((dimension) => h('article', null,
      h('span', null, dimension.left.code + ' / ' + dimension.right.code),
      h('strong', null, dimension.title),
      h('p', null, dimension.question))));
    render($('#type-strip'), Object.keys(TYPES).map(typeChip));
    renderDimensions();
  }

  // ---------- 方法页 ----------

  function initMethod() {
    renderDimensions();
  }

  // ---------- 图鉴 ----------

  function initWiki() {
    const grid = $('#atlas-grid');
    const detail = $('#type-detail');
    if (!grid || !detail) return;

    const cards = Object.entries(TYPES).map(([code, profile]) => h('button', {
      class: 'atlas-card',
      type: 'button',
      dataset: { type: code },
      'aria-pressed': 'false',
      onclick: () => select(code, true)
    },
    h('code', null, code),
    h('strong', null, profile.name),
    h('span', null, profile.alias)));
    render(grid, cards);

    function showDetail(code) {
      const profile = TYPES[code];
      const partner = core.complementOf(code);
      render(detail,
        h('div', { class: 'type-detail-header' },
          h('div', null,
            h('p', { class: 'panel-label' }, 'XXTI Type'),
            h('code', null, code),
            h('p', { class: 'type-detail-name' }, profile.name)),
          h('p', null, profile.alias)),
        h('p', null, profile.summary),
        h('div', { class: 'type-tags' }, code.split('').map((letter) => h('span', { class: 'tag' }, poleLabel(core.getPole(letter).pole)))),
        h('div', { class: 'type-detail-grid' }, profileSections(profile)),
        h('div', { class: 'type-partner' },
          h('p', { class: 'panel-label' }, '互补搭档'),
          typeChip(partner)));
      motion.swap(detail);
    }

    function select(code, fromUser) {
      cards.forEach((card) => {
        const isActive = card.dataset.type === code;
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-pressed', String(isActive));
      });
      showDetail(code);
      if (!fromUser) return;
      window.history.replaceState(null, '', '?type=' + code);
      if (window.matchMedia('(max-width: 1080px)').matches) {
        detail.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      }
    }

    detail.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-type]');
      if (!link) return;
      event.preventDefault();
      select(link.dataset.type, true);
    });

    select(core.normalizeType(new URLSearchParams(window.location.search).get('type')) || 'QMBL', false);
  }

  // ---------- 测试 ----------

  function initQuiz() {
    const form = $('#quiz-form');
    if (!form) return;

    const panel = $('#result-panel');
    const status = $('#quiz-status');
    const progressText = $('#progress-text');
    const progressTrack = $('#progress-track');
    const submitButton = $('#submit-quiz');
    let current = null;

    render(form, QUESTIONS.map((question) => h('fieldset', { class: 'question-card' },
      h('legend', null,
        h('span', { class: 'question-index' }, 'Q' + String(question.id).padStart(2, '0')),
        h('span', { class: 'question-text' }, question.text)),
      h('div', { class: 'option-row' }, SCALE.map((option) => {
        const id = 'q' + question.id + '-' + option.value;
        return h('div', { class: 'option' },
          h('input', { type: 'radio', id, name: 'q' + question.id, value: option.value }),
          h('label', { for: id },
            h('strong', null, option.value),
            h('span', null, option.text)));
      })))));

    function readAnswers() {
      const answers = {};
      new FormData(form).forEach((value, key) => {
        answers[key.slice(1)] = Number(value);
      });
      return answers;
    }

    function updateProgress() {
      const count = Object.keys(readAnswers()).length;
      progressText.textContent = count + ' / ' + QUESTIONS.length;
      progressTrack.style.setProperty('--progress', String(count / QUESTIONS.length));
      progressTrack.setAttribute('aria-valuenow', String(count));
      if (count === QUESTIONS.length) status.textContent = '';
    }

    function restoreDraft() {
      Object.entries(core.draft.load()).forEach(([id, value]) => {
        const input = form.querySelector('#q' + Number(id) + '-' + Number(value));
        if (!input) return;
        input.checked = true;
        input.closest('.question-card').classList.add('is-answered');
      });
    }

    function advanceFrom(card) {
      const next = card.nextElementSibling;
      window.setTimeout(() => {
        (next || submitButton).scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
      }, 140);
    }

    function axisCard(item) {
      return h('article', { class: 'axis-score-card' + (item.balanced ? ' is-balanced' : '') },
        h('h4', null, item.dimension.title),
        h('div', { class: 'axis-bar', role: 'img', 'aria-label': item.pole.name + ' ' + item.chosenPercent + '%' },
          h('span', { style: 'width: ' + item.chosenPercent + '%' })),
        h('div', { class: 'axis-score-meta' },
          h('span', null, poleLabel(item.pole) + ' ' + item.chosenPercent + '%'),
          h('span', null, item.balanced ? '两侧接近均衡' : '偏好强度 ' + item.strength + '%')));
    }

    function renderComparison(result, previous) {
      const box = $('#result-compare');
      if (!previous) {
        box.hidden = true;
        render(box);
        return;
      }
      const before = core.computeResult(core.listToScores(previous.scores));
      const headline = before.code === result.code
        ? '和上次一样，都是 ' + result.code
        : '上次是 ' + before.code + '，这次是 ' + result.code;
      render(box,
        h('h4', null, '和上次对比 · ' + core.formatDate(previous.at)),
        h('p', null, headline),
        h('ul', null, result.axes.map((item, index) => {
          const old = before.axes[index];
          const delta = item.rightPercent - old.rightPercent;
          const shift = delta === 0
            ? '持平'
            : '向 ' + (delta > 0 ? item.dimension.right.code : item.dimension.left.code) + ' 偏移 ' + Math.abs(delta) + '%';
          return h('li', null,
            h('strong', null, item.dimension.title),
            h('span', null, old.pole.code + ' ' + old.chosenPercent + '% → ' + item.pole.code + ' ' + item.chosenPercent + '%（' + shift + '）'));
        })));
      box.hidden = false;
    }

    function renderHistory() {
      const entries = core.history.load();
      $('#history-panel').hidden = entries.length === 0;
      render($('#history-list'), entries.map((entry) => {
        const scores = core.listToScores(entry.scores);
        const { code, profile } = core.computeResult(scores);
        return h('li', null,
          h('a', { href: core.shareUrl(scores) },
            h('code', null, code),
            h('strong', null, profile.name),
            h('span', null, core.formatDate(entry.at))));
      }));
    }

    function showResult(scores, previous) {
      const result = core.computeResult(scores);
      const { code, profile } = result;
      current = { result, url: core.shareUrl(scores) };

      $('#result-code').textContent = code;
      $('#result-clarity').textContent = result.clarity + '%';
      $('#result-name').textContent = profile.name + ' · ' + profile.alias;
      $('#result-summary').textContent = profile.summary;
      $('#result-wiki-link').href = 'wiki.html?type=' + code;
      render($('#axis-score-list'), result.axes.map(axisCard));
      render($('#result-columns'), profileSections(profile));
      render($('#result-partner'), h('p', { class: 'panel-label' }, '互补搭档'), typeChip(core.complementOf(code)));
      renderComparison(result, previous);
      renderHistory();

      panel.hidden = false;
      motion.reveal(panel);
    }

    function handleSubmit() {
      const answers = readAnswers();
      const missing = QUESTIONS.filter((question) => !answers[question.id]);
      if (missing.length > 0) {
        const card = form.querySelector('#q' + missing[0].id + '-1').closest('.question-card');
        status.textContent = '还有 ' + missing.length + ' 题没做，已帮你跳到第一题。';
        card.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
        card.classList.add('is-missing');
        motion.shake(card);
        return;
      }

      status.textContent = '';
      const scores = core.scoreAnswers(answers);
      const previous = core.history.load()[0] || null;
      core.history.add(scores);
      showResult(scores, previous);
      window.history.replaceState(null, '', new URL(current.url).search);
      panel.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      panel.focus({ preventScroll: true });
    }

    function handleReset() {
      form.reset();
      form.querySelectorAll('.question-card').forEach((card) => card.classList.remove('is-answered', 'is-missing'));
      core.draft.clear();
      updateProgress();
      status.textContent = '';
      panel.hidden = true;
      current = null;
      if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
      form.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    }

    function buildShareText() {
      const { result, url } = current;
      const axes = result.axes.map((item) => item.pole.code + ' ' + item.pole.name + ' ' + item.chosenPercent + '%').join(' / ');
      return ['我的 XXTI 是 ' + result.code + '「' + result.profile.name + '」：' + result.profile.alias, axes, url].join(NEWLINE);
    }

    async function copyText(text, button) {
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = '已复制';
        window.setTimeout(() => {
          button.textContent = original;
        }, 1600);
      } catch {
        window.prompt('复制下面的内容：', text);
      }
    }

    async function handleShare(button) {
      if (!current) return;
      const text = buildShareText();
      if (navigator.share) {
        try {
          await navigator.share({ title: 'XXTI · ' + current.result.code, text });
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') return;
        }
      }
      copyText(text, button);
    }

    form.addEventListener('change', (event) => {
      const card = event.target.closest('.question-card');
      if (!card) return;
      const firstAnswer = !card.classList.contains('is-answered');
      card.classList.add('is-answered');
      card.classList.remove('is-missing');
      core.draft.save(readAnswers());
      updateProgress();
      if (firstAnswer) advanceFrom(card);
    });
    submitButton.addEventListener('click', handleSubmit);
    $('#reset-quiz').addEventListener('click', handleReset);
    $('#share-result').addEventListener('click', (event) => handleShare(event.currentTarget));
    $('#copy-link').addEventListener('click', (event) => {
      if (current) copyText(current.url, event.currentTarget);
    });
    $('#clear-history').addEventListener('click', () => {
      if (!window.confirm('清空这台设备上保存的全部测试记录？')) return;
      core.history.clear();
      renderHistory();
      renderComparison(null, null);
    });

    restoreDraft();
    updateProgress();
    renderHistory();

    const shared = core.decodeShare(new URLSearchParams(window.location.search).get('s'));
    if (shared) {
      showResult(shared, null);
      panel.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }

  // ---------- 启动 ----------

  const PAGES = { home: initHome, wiki: initWiki, quiz: initQuiz, method: initMethod };
  const page = XXTI.layout.mount();
  if (PAGES[page]) PAGES[page]();
  motion.init();
  motion.cards();
})(window.XXTI = window.XXTI || {});
