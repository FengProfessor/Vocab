/*
 * Progressive enhancement for /sat-thu-toeic-listening (server-rendered by Views/Home/SatThuToeicListening.cshtml).
 * Vanilla JS, no dependencies. Ports the interactive parts of the original React components:
 * StickyCtaBar, EmailOptinCard, DiagnosticScorecard, KillerMatrixSection, VisualExamShowcase,
 * DictionarySection and EbookReaderModal.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'lingopro_diagnostic_15d_scores';
  var EBOOK_URL = '/lead-magnet/sat-thu-toeic-listening-lead-magnet.md';
  var SUBSCRIBE_URL = '/api/lead-magnet/subscribe';
  var TIER_RANGES = ['0 – 15 Điểm', '16 – 24 Điểm', '25 – 30 Điểm'];

  // Quick-fill presets from the original scorecard ("Thử nhanh").
  var PRESETS = {
    beginner: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1, 9: 0, 10: 1, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 },
    stuck: { 1: 1, 2: 1, 3: 2, 4: 1, 5: 1, 6: 1, 7: 0, 8: 1, 9: 1, 10: 2, 11: 1, 12: 1, 13: 1, 14: 0, 15: 1 },
    master: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2, 15: 2 }
  };

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(el, type, fn, opts) { if (el) el.addEventListener(type, fn, opts); }
  function setHidden(el, hidden) { if (!el) return; if (hidden) el.setAttribute('hidden', ''); else el.removeAttribute('hidden'); }

  /* ------------------------------------------------------------------ */
  /* Generic helpers: smooth scroll buttons                              */
  /* ------------------------------------------------------------------ */
  function initScrollButtons() {
    qsa('[data-lm-scroll]').forEach(function (btn) {
      on(btn, 'click', function () {
        var target = document.getElementById(btn.getAttribute('data-lm-scroll') || '');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Sticky CTA bar (visible after 550px of scroll)                      */
  /* ------------------------------------------------------------------ */
  function initSticky() {
    var bar = document.getElementById('lm-sticky');
    if (!bar) return;
    var buttons = qsa('button', bar);
    var visible = false;
    var ticking = false;

    function apply() {
      ticking = false;
      var show = window.scrollY > 550;
      if (show === visible) return;
      visible = show;
      bar.setAttribute('data-visible', show ? 'true' : 'false');
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      buttons.forEach(function (b) { if (show) b.removeAttribute('tabindex'); else b.setAttribute('tabindex', '-1'); });
    }

    on(window, 'scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(apply); }
    }, { passive: true });
    apply();
  }

  /* ------------------------------------------------------------------ */
  /* FAQ: native <details>; keep the first open (server-rendered).       */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /* Killer matrix                                                       */
  /* ------------------------------------------------------------------ */
  function initMatrix() {
    var root = qs('[data-lm-matrix]');
    if (!root) return;
    var blockBtns = qsa('[data-matrix-block]', root);
    var lists = qsa('[data-matrix-list]', root);
    var items = qsa('[data-matrix-item]', root);
    var panes = qsa('[data-matrix-pane]', root);

    function selectItem(id) {
      items.forEach(function (it) { it.setAttribute('aria-selected', it.getAttribute('data-matrix-item') === String(id) ? 'true' : 'false'); });
      panes.forEach(function (p) { setHidden(p, p.getAttribute('data-matrix-pane') !== String(id)); });
    }
    function selectBlock(b) {
      blockBtns.forEach(function (btn) { btn.setAttribute('aria-selected', btn.getAttribute('data-matrix-block') === String(b) ? 'true' : 'false'); });
      lists.forEach(function (l) { setHidden(l, l.getAttribute('data-matrix-list') !== String(b)); });
      var firstList = lists.filter(function (l) { return l.getAttribute('data-matrix-list') === String(b); })[0];
      var first = firstList && qs('[data-matrix-item]', firstList);
      if (first) selectItem(first.getAttribute('data-matrix-item'));
    }

    blockBtns.forEach(function (btn) { on(btn, 'click', function () { selectBlock(btn.getAttribute('data-matrix-block')); }); });
    items.forEach(function (it) {
      var id = it.getAttribute('data-matrix-item');
      on(it, 'click', function () { selectItem(id); });
      on(it, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectItem(id); } });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Visual exam showcase tabs                                           */
  /* ------------------------------------------------------------------ */
  function initVisual() {
    var root = qs('[data-lm-visual]');
    if (!root) return;
    var tabs = qsa('[data-visual-tab]', root);
    var panels = qsa('[data-visual-panel]', root);
    tabs.forEach(function (tab) {
      on(tab, 'click', function () {
        var idx = tab.getAttribute('data-visual-tab');
        tabs.forEach(function (t) { t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
        panels.forEach(function (p) {
          var match = p.getAttribute('data-visual-panel') === idx;
          setHidden(p, !match);
          if (match) {
            // Lazy images in hidden panels load once their panel is shown.
            qsa('img[loading="lazy"]', p).forEach(function (img) { img.loading = 'eager'; });
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Dictionary: group filter, search, "show more"                       */
  /* ------------------------------------------------------------------ */
  function initDictionary() {
    var root = qs('[data-lm-dict]');
    if (!root) return;
    var cards = qsa('[data-dict-card]', root);
    var pills = qsa('[data-dict-group]', root);
    var search = qs('[data-dict-search]', root);
    var moreWrap = qs('[data-dict-more-wrap]', root);
    var moreBtn = qs('[data-dict-more]', root);
    var moreLabel = qs('[data-dict-more-label]', root);
    var empty = qs('[data-dict-empty]', root);
    var group = 0;
    var query = '';
    var count = 18;

    function render() {
      var matched = 0;
      cards.forEach(function (card) {
        var ok = (group === 0 || card.getAttribute('data-group') === String(group)) &&
          (!query || (card.getAttribute('data-hay') || '').indexOf(query) !== -1);
        var show = false;
        if (ok) { matched++; show = matched <= count; }
        setHidden(card, !show);
      });
      setHidden(moreWrap, !(count < matched));
      if (moreLabel) moreLabel.textContent = 'Xem thêm ' + Math.min(24, matched - count) + ' từ tiếp theo (Tổng: ' + matched + ' từ)';
      if (empty) empty.classList.toggle('hidden', matched !== 0);
    }

    pills.forEach(function (p) {
      on(p, 'click', function () {
        group = parseInt(p.getAttribute('data-dict-group') || '0', 10) || 0;
        count = 18;
        pills.forEach(function (x) { x.setAttribute('aria-pressed', x === p ? 'true' : 'false'); });
        render();
      });
    });
    on(search, 'input', function () { query = search.value.toLowerCase().trim(); count = 18; render(); });
    on(moreBtn, 'click', function () { count += 24; render(); });

    // Text-to-speech pronunciation (browser built-in voices).
    on(root, 'click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-speak]') : null;
      if (!btn) return;
      try {
        if ('speechSynthesis' in window) {
          var text = btn.getAttribute('data-speak') || '';
          window.speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(text);
          u.lang = 'en-US';
          u.rate = 0.9;
          var voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
          var v = voices.filter(function (x) { return x.lang.indexOf('en') === 0 && (x.name.indexOf('US') !== -1 || x.name.indexOf('Natural') !== -1); })[0] ||
            voices.filter(function (x) { return x.lang.indexOf('en') === 0; })[0];
          if (v) u.voice = v;
          window.speechSynthesis.speak(u);
        }
      } catch (err) { /* speech is optional */ }
    });

    render();
  }

  /* ------------------------------------------------------------------ */
  /* Shared opt-in state: email / name are mirrored between both forms.  */
  /* ------------------------------------------------------------------ */
  function initSharedFields() {
    function mirror(selector) {
      var inputs = qsa(selector);
      inputs.forEach(function (input) {
        on(input, 'input', function () {
          inputs.forEach(function (other) { if (other !== input) other.value = input.value; });
        });
      });
    }
    mirror('[data-lm-email]');
    mirror('[data-lm-name]');
  }

  /* ------------------------------------------------------------------ */
  /* Diagnostic scorecard                                                */
  /* ------------------------------------------------------------------ */
  var quiz = { scores: {}, api: null };

  function loadScores() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          var clean = {};
          Object.keys(parsed).forEach(function (k) {
            var v = parsed[k];
            if (/^\d+$/.test(k) && (v === 0 || v === 1 || v === 2)) clean[k] = v;
          });
          return clean;
        }
      }
    } catch (e) { /* ignore corrupt storage */ }
    return {};
  }
  function saveScores(scores) {
    try {
      if (Object.keys(scores).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* storage may be unavailable */ }
  }
  function sumScores(scores, ids) {
    var total = 0;
    (ids || Object.keys(scores)).forEach(function (id) { total += scores[id] || 0; });
    return total;
  }
  function quizTotals() {
    var answered = Object.keys(quiz.scores).length;
    return { total: sumScores(quiz.scores), answered: answered };
  }
  function tierIndex(total) { return total <= 15 ? 0 : total <= 24 ? 1 : 2; }

  function initQuiz() {
    var root = qs('[data-lm-quiz]');
    if (!root) return;
    var rows = qsa('[data-quiz-row]', root);
    var tabs = qsa('[data-quiz-tab]', root);
    var scoreBtns = qsa('[data-quiz-score]', root);
    var toggles = qsa('[data-quiz-toggle]', root);
    var empty = qs('[data-quiz-empty]', root);
    var result = qs('[data-quiz-result]', root);
    var tiers = qsa('[data-quiz-tier]', root);
    var expandedId = '1';
    var activeTab = '1';

    function setExpanded(id) {
      expandedId = id;
      toggles.forEach(function (t) {
        var open = t.getAttribute('data-quiz-toggle') === id;
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      qsa('[data-quiz-details]', root).forEach(function (d) {
        setHidden(d, d.getAttribute('data-quiz-details') !== id);
      });
    }

    function showTab(b) {
      activeTab = b;
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-quiz-tab') === b ? 'true' : 'false'); });
      rows.forEach(function (r) { setHidden(r, r.getAttribute('data-block') !== b); });
    }

    function renderScores() {
      var t = quizTotals();
      scoreBtns.forEach(function (btn) {
        var dim = btn.getAttribute('data-dim');
        var val = quiz.scores[dim];
        btn.setAttribute('aria-pressed', val !== undefined && String(val) === btn.getAttribute('data-quiz-score') ? 'true' : 'false');
      });
      qsa('[data-quiz-total]', root).forEach(function (el) { el.textContent = String(t.total); });
      qsa('[data-quiz-answered]', root).forEach(function (el) { el.textContent = String(t.answered); });

      var blocks = { 1: [1, 2, 3, 4, 5], 2: [6, 7, 8, 9, 10], 3: [11, 12, 13, 14, 15] };
      [1, 2, 3].forEach(function (b) {
        var s = sumScores(quiz.scores, blocks[b].map(String));
        var label = qs('[data-quiz-block-score="' + b + '"]', root);
        var bar = qs('[data-quiz-block-bar="' + b + '"]', root);
        if (label) label.textContent = String(s);
        if (bar) bar.style.width = (s / 10 * 100) + '%';
      });

      setHidden(empty, t.answered !== 0);
      setHidden(result, t.answered === 0);
      var idx = tierIndex(t.total);
      tiers.forEach(function (el) { setHidden(el, el.getAttribute('data-quiz-tier') !== String(idx)); });
      qsa('[data-quiz-progress-note]', root).forEach(function (el) {
        el.textContent = t.answered === 15 ? '✔ Đã hoàn thành 15/15 chiều' : 'Đang đánh giá ' + t.answered + '/15 chiều (còn ' + (15 - t.answered) + ' chiều)';
      });

      // Link the score to the opt-in card.
      var linked = qs('[data-lm-linked]');
      var linkedScore = qs('[data-lm-linked-score]');
      if (linked) setHidden(linked, t.answered === 0);
      if (linkedScore) linkedScore.textContent = String(t.total);
    }

    function update(next) {
      quiz.scores = next;
      saveScores(next);
      renderScores();
    }

    scoreBtns.forEach(function (btn) {
      on(btn, 'click', function () {
        var next = {};
        Object.keys(quiz.scores).forEach(function (k) { next[k] = quiz.scores[k]; });
        next[btn.getAttribute('data-dim')] = parseInt(btn.getAttribute('data-quiz-score') || '0', 10);
        update(next);
      });
    });
    tabs.forEach(function (t) { on(t, 'click', function () { showTab(t.getAttribute('data-quiz-tab') || '1'); }); });
    toggles.forEach(function (t) {
      var id = t.getAttribute('data-quiz-toggle') || '';
      function flip() { setExpanded(expandedId === id ? '' : id); }
      on(t, 'click', flip);
      on(t, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    });
    qsa('[data-quiz-preset]', root).forEach(function (btn) {
      on(btn, 'click', function () {
        var preset = PRESETS[btn.getAttribute('data-quiz-preset') || ''];
        if (!preset) return;
        var next = {};
        Object.keys(preset).forEach(function (k) { next[k] = preset[k]; });
        update(next);
      });
    });
    on(qs('[data-quiz-reset]', root), 'click', function () {
      var success = qs('[data-lm-success="quiz"]', root);
      var form = qs('[data-lm-form="quiz"]', root);
      setHidden(success, true);
      setHidden(form, false);
      update({});
    });

    quiz.scores = loadScores();
    showTab(activeTab);
    setExpanded(expandedId);
    renderScores();
  }

  /* ------------------------------------------------------------------ */
  /* Opt-in + quiz forms: POST /api/lead-magnet/subscribe                */
  /* ------------------------------------------------------------------ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showError(form, msg) {
    var box = qs('[data-lm-error]', form.parentElement) || qs('[data-lm-error]', form);
    if (!box) return;
    box.textContent = msg;
    setHidden(box, !msg);
  }

  function buildPayload(kind, form) {
    var data = new FormData(form);
    var t = quizTotals();
    var payload = {
      email: String(data.get('email') || '').trim(),
      fullName: String(data.get('fullName') || '').trim(),
      hp: String(data.get('hp') || '')
    };
    if (kind === 'optin') {
      payload.phone = String(data.get('phone') || '').trim();
      payload.currentScore = String(data.get('currentScore') || '');
      payload.targetScore = String(data.get('targetScore') || '');
      payload.diagnosticScore = t.answered > 0 ? t.total : null;
      payload.dimensionScores = quiz.scores;
    } else {
      payload.diagnosticScore = t.total;
      payload.dimensionScores = quiz.scores;
      payload.targetScore = 'Bứt phá 450+ Listening';
      payload.currentScore = t.answered > 0 ? TIER_RANGES[tierIndex(t.total)] : 'Chưa test';
    }
    return payload;
  }

  function initForms() {
    qsa('[data-lm-form]').forEach(function (form) {
      var kind = form.getAttribute('data-lm-form');
      var submit = qs('[data-lm-submit]', form);
      var label = qs('[data-lm-submit-label]', form);
      var idleLabel = label ? label.textContent : '';
      var scope = form.parentElement;

      function showSuccess(promo) {
        var success = qs('[data-lm-success="' + kind + '"]', scope);
        if (kind === 'optin' && promo) {
          var promoEl = qs('[data-lm-promo]', scope);
          if (promoEl) promoEl.textContent = promo;
        }
        setHidden(form, true);
        setHidden(success, false);
      }

      on(form, 'submit', function (e) {
        e.preventDefault();
        showError(form, '');
        var payload = buildPayload(kind, form);
        if (!payload.email || !EMAIL_RE.test(payload.email)) {
          showError(form, kind === 'optin'
            ? 'Vui lòng nhập địa chỉ Email hợp lệ để nhận ấn phẩm.'
            : 'Vui lòng nhập Email hợp lệ để nhận kết quả.');
          return;
        }
        if (submit) submit.disabled = true;
        if (label) label.textContent = kind === 'optin' ? 'Đang xử lý tải tài liệu...' : 'Đang lưu...';

        fetch(SUBSCRIBE_URL, {
          method: 'POST',
          credentials: 'same-origin',
          // The server CSRF middleware requires this header on every /api POST without Authorization.
          headers: { 'Content-Type': 'application/json', 'X-LingoPro-Request': '1' },
          body: JSON.stringify(payload)
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; });
        }).then(function (r) {
          if (r.ok && r.data && r.data.success) {
            showSuccess(r.data.promoCode || 'SATTHUTOEIC');
          } else {
            showError(form, (r.data && r.data.error) || 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại.');
          }
        }).catch(function () {
          // Offline fallback (same as the original): still reveal the download links.
          showSuccess('SATTHUTOEIC');
        }).then(function () {
          if (submit) submit.disabled = false;
          if (label) label.textContent = idleLabel;
        });
      });
    });

    // Copy promo code
    qsa('[data-lm-copy]').forEach(function (btn) {
      on(btn, 'click', function () {
        var promoEl = qs('[data-lm-promo]', btn.closest('[data-lm-optin]') || document);
        var text = promoEl ? (promoEl.textContent || '') : '';
        var label = qs('[data-lm-copy-label]', btn);
        function done() {
          if (!label) return;
          label.textContent = '✔ Đã sao chép';
          setTimeout(function () { label.textContent = 'Sao chép'; }, 2500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (err) { /* ignore */ }
          document.body.removeChild(ta);
          done();
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Ebook reader modal + minimal markdown renderer                      */
  /* ------------------------------------------------------------------ */
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function slugify(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  }
  function inline(raw) {
    var s = escapeHtml(raw);
    s = s.replace(/&lt;br\s*\/?&gt;/gi, '<br>'); // the ebook uses <br> inside table cells
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*|#[^)\s]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }
  function splitRow(line) {
    var t = line.trim();
    if (t.charAt(0) === '|') t = t.slice(1);
    if (t.charAt(t.length - 1) === '|') t = t.slice(0, -1);
    return t.split('|').map(function (c) { return c.trim(); });
  }
  function renderMarkdown(md) {
    var lines = md.replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var i = 0;
    var used = {};

    function uniqueId(text) {
      var base = slugify(text) || 'section';
      var id = base;
      var n = 2;
      while (used[id]) { id = base + '-' + n++; }
      used[id] = true;
      return id;
    }
    function isBlockStart(l) {
      return /^#{1,4}\s/.test(l) || /^\s*\|/.test(l) || /^>\s?/.test(l) || /^\s*([-*+]|\d+\.)\s+/.test(l) || /^\s*(-{3,}|\*{3,})\s*$/.test(l);
    }

    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (/^<div[^>]*><\/div>\s*$/i.test(line.trim())) { i++; continue; } // page-break helpers

      var h = /^(#{1,4})\s+(.*)$/.exec(line);
      if (h) {
        var level = h[1].length;
        var text = h[2].trim();
        out.push('<h' + level + ' id="' + uniqueId(text.replace(/[*`]/g, '')) + '">' + inline(text) + '</h' + level + '>');
        i++;
        continue;
      }

      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        var head = splitRow(line);
        i += 2;
        var body = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { body.push(splitRow(lines[i])); i++; }
        var html = '<div class="lm-table-wrap"><table><thead><tr>' +
          head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          body.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div>';
        out.push(html);
        continue;
      }

      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      if (/^>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>');
        continue;
      }

      var li = /^\s*([-*+]|\d+\.)\s+/.exec(line);
      if (li) {
        var ordered = /\d/.test(li[1]);
        var items = [];
        while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
          items.push('<li>' + inline(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, '')) + '</li>');
          i++;
        }
        out.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>'));
        continue;
      }

      var para = [];
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i]) && !/^<div[^>]*><\/div>\s*$/i.test(lines[i].trim())) { para.push(lines[i].trim()); i++; }
      if (para.length) out.push('<p>' + inline(para.join(' ')) + '</p>');
      else i++;
    }
    return out.join('\n');
  }

  function initReader() {
    var modal = document.getElementById('lm-reader');
    if (!modal) return;
    var panel = document.getElementById('lm-reader-panel');
    var content = document.getElementById('lm-reader-content');
    var toc = document.getElementById('lm-reader-toc');
    var tocList = document.getElementById('lm-reader-toc-list');
    var loaded = false;
    var loading = false;
    var lastFocus = null;

    function setFullscreen(full) {
      modal.setAttribute('data-fullscreen', full ? 'true' : 'false');
      panel.setAttribute('data-fullscreen', full ? 'true' : 'false');
    }

    function buildToc() {
      tocList.innerHTML = '';
      qsa('h2', content).forEach(function (h) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-indigo-50/60 hover:text-indigo-700';
        var span = document.createElement('span');
        span.className = 'truncate';
        span.textContent = h.textContent || '';
        var chev = document.createElement('span');
        chev.className = 'ml-1 shrink-0 text-slate-400';
        chev.textContent = '›';
        btn.appendChild(span);
        btn.appendChild(chev);
        on(btn, 'click', function () {
          setHidden(toc, true);
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        tocList.appendChild(btn);
      });
    }

    function load() {
      if (loaded || loading) return;
      loading = true;
      fetch(EBOOK_URL, { credentials: 'same-origin' })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
        .then(function (md) {
          content.innerHTML = renderMarkdown(md);
          buildToc();
          loaded = true;
        })
        .catch(function () {
          content.innerHTML = '<p class="py-20 text-center text-sm text-rose-600">Không thể tải nội dung Ebook lúc này. Vui lòng <a href="/downloads/Bach-Khoa-Sat-Thu-TOEIC-Listening-ETS-2026-LingoPro.pdf" download>tải bản PDF</a> hoặc thử lại sau.</p>';
        })
        .then(function () { loading = false; });
    }

    function focusables() {
      return qsa('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', modal).filter(function (el) {
        return el.offsetParent !== null;
      });
    }

    function open() {
      lastFocus = document.activeElement;
      setHidden(modal, false);
      document.body.style.overflow = 'hidden';
      load();
      var closeBtn = qs('[data-reader-close]', modal);
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      setHidden(modal, true);
      setHidden(toc, true);
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    qsa('[data-lm-open-reader]').forEach(function (btn) { on(btn, 'click', open); });
    qsa('[data-reader-close]', modal).forEach(function (btn) { on(btn, 'click', close); });
    on(modal, 'click', function (e) { if (e.target === modal) close(); });
    qsa('[data-reader-toc-toggle]', modal).forEach(function (btn) {
      on(btn, 'click', function () {
        var willShow = toc.hasAttribute('hidden');
        setHidden(toc, !willShow);
        qsa('[data-reader-toc-toggle][aria-expanded]', modal).forEach(function (b) { b.setAttribute('aria-expanded', willShow ? 'true' : 'false'); });
      });
    });
    on(qs('[data-reader-fullscreen]', modal), 'click', function () {
      setFullscreen(modal.getAttribute('data-fullscreen') !== 'true');
    });
    on(document, 'keydown', function (e) {
      if (modal.hasAttribute('hidden')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function init() {
    initScrollButtons();
    initSticky();
    initMatrix();
    initVisual();
    initDictionary();
    initSharedFields();
    initQuiz();
    initForms();
    initReader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
