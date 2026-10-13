// XXTI 核心逻辑：计分、本地存储、分享链接。不碰 DOM。
(function (XXTI) {
  'use strict';

  const { DIMENSIONS, QUESTIONS, TYPES } = XXTI;
  const AXES = DIMENSIONS.map((dimension) => dimension.axis);
  const MAX_SCORE = Object.fromEntries(
    AXES.map((axis) => [axis, QUESTIONS.filter((question) => question.axis === axis).length * 2])
  );
  const BALANCED_THRESHOLD = 15;
  const HISTORY_LIMIT = 10;
  const KEYS = { draft: 'xxti:draft', history: 'xxti:history' };

  const DQ = String.fromCharCode(34);
  const SQ = String.fromCharCode(39);
  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', [DQ]: '&quot;', [SQ]: '&#39;' };
  const HTML_PATTERN = new RegExp('[&<>' + DQ + SQ + ']', 'g');

  function escapeHtml(value) {
    return String(value).replace(HTML_PATTERN, (char) => HTML_ESCAPES[char]);
  }

  function getDimension(axis) {
    return DIMENSIONS.find((dimension) => dimension.axis === axis);
  }

  function getPole(letter) {
    for (const dimension of DIMENSIONS) {
      if (dimension.left.code === letter) return { dimension, pole: dimension.left, side: 'left' };
      if (dimension.right.code === letter) return { dimension, pole: dimension.right, side: 'right' };
    }
    return null;
  }

  function normalizeType(value) {
    const code = String(value || '').trim().toUpperCase();
    return TYPES[code] ? code : null;
  }

  // 四个字母全部取反，得到最能补位的搭档类型。
  function complementOf(code) {
    return code.split('').map((letter) => {
      const { dimension, side } = getPole(letter);
      return side === 'left' ? dimension.right.code : dimension.left.code;
    }).join('');
  }

  function scoreAnswers(answers) {
    const scores = Object.fromEntries(AXES.map((axis) => [axis, 0]));
    QUESTIONS.forEach((question) => {
      const value = Number(answers[question.id]);
      if (value >= 1 && value <= 5) {
        scores[question.axis] += (value - 3) * question.direction;
      }
    });
    return scores;
  }

  function axisResult(axis, score) {
    const dimension = getDimension(axis);
    const max = MAX_SCORE[axis];
    const rightPercent = Math.round(((score + max) / (max * 2)) * 100);
    const isRight = score >= 0;
    const strength = Math.round((Math.abs(score) / max) * 100);
    return {
      axis,
      dimension,
      score,
      pole: isRight ? dimension.right : dimension.left,
      rightPercent,
      chosenPercent: isRight ? rightPercent : 100 - rightPercent,
      strength,
      balanced: strength < BALANCED_THRESHOLD
    };
  }

  // clarity：四轴偏好强度的均值，表示这次结果有多「清晰」，不是准确率。
  function computeResult(scores) {
    const axes = AXES.map((axis) => axisResult(axis, scores[axis]));
    const code = axes.map((item) => item.pole.code).join('');
    const clarity = Math.round(axes.reduce((sum, item) => sum + item.strength, 0) / axes.length);
    return { code, profile: TYPES[code], axes, clarity, scores };
  }

  const store = {
    read(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // 隐私模式或存储已满时静默失败
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  };

  const draft = {
    load() {
      const value = store.read(KEYS.draft, {});
      return value && typeof value === 'object' ? value : {};
    },
    save(answers) {
      store.write(KEYS.draft, answers);
    },
    clear() {
      store.remove(KEYS.draft);
    }
  };

  function isValidScoreList(list) {
    return Array.isArray(list)
      && list.length === AXES.length
      && list.every((value, index) => Number.isInteger(value) && Math.abs(value) <= MAX_SCORE[AXES[index]]);
  }

  function listToScores(list) {
    return Object.fromEntries(AXES.map((axis, index) => [axis, list[index]]));
  }

  function scoresToList(scores) {
    return AXES.map((axis) => scores[axis]);
  }

  const history = {
    load() {
      const list = store.read(KEYS.history, []);
      if (!Array.isArray(list)) return [];
      return list.filter((entry) => entry && isValidScoreList(entry.scores) && Number.isFinite(entry.at));
    },
    add(scores) {
      const list = history.load();
      list.unshift({ scores: scoresToList(scores), at: Date.now() });
      store.write(KEYS.history, list.slice(0, HISTORY_LIMIT));
    },
    clear() {
      store.write(KEYS.history, []);
    }
  };

  function shareUrl(scores) {
    const url = new URL('quiz.html', window.location.href);
    url.searchParams.set('s', scoresToList(scores).join('.'));
    return url.toString();
  }

  function decodeShare(param) {
    if (!param) return null;
    const list = param.split('.').map(Number);
    return isValidScoreList(list) ? listToScores(list) : null;
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  XXTI.core = {
    AXES,
    escapeHtml,
    getDimension,
    getPole,
    normalizeType,
    complementOf,
    scoreAnswers,
    computeResult,
    listToScores,
    draft,
    history,
    shareUrl,
    decodeShare,
    formatDate
  };
})(window.XXTI = window.XXTI || {});
