/*
 * IPA masterclass (/ipa) - progressive enhancement for the server-rendered page.
 * Vanilla JS, no build step. Data comes from <script type="application/json" id="ipa-data">.
 * Progress is stored in localStorage under `lingopro_ipa_progress_v1` (same JSON shape as the Next.js app):
 *   { [phonemeId]: { phonemeId, masteryPercent, stagesCompleted, stars, lastPracticed } }
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'lingopro_ipa_progress_v1';
  var MASTERED_AT = 80;
  var DEFAULT_STAGE = 'stage-must-fix';
  var FALLBACK_RECOMMENDED = 'th-voiced';

  var dataEl = document.getElementById('ipa-data');
  if (!dataEl) return;
  var data;
  try {
    data = JSON.parse(dataEl.textContent || '{}');
  } catch (e) {
    return;
  }
  var phonemes = data.phonemes || [];
  var stages = data.stages || [];
  var byId = {};
  phonemes.forEach(function (p) { byId[p.id] = p; });

  var root = document.getElementById('ipa-root');
  var modal = document.getElementById('ipa-modal');
  var state = { stageId: DEFAULT_STAGE, mode: 'pathway', filter: 'all', progress: {} };

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /** Tiny DOM builder: el('div', {class:'x', onclick:fn}, [children|strings]). */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function setClasses(node, add, remove) {
    (remove || []).forEach(function (c) { node.classList.remove(c); });
    (add || []).forEach(function (c) { node.classList.add(c); });
  }

  /* ------------------------------------------------------------------ */
  /* Progress storage                                                    */
  /* ------------------------------------------------------------------ */

  function readProgress() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress(phonemeId, updates) {
    var current = readProgress();
    var existing = current[phonemeId] || { phonemeId: phonemeId, masteryPercent: 0, stagesCompleted: 0, stars: 0 };
    var next = {};
    Object.keys(existing).forEach(function (k) { next[k] = existing[k]; });
    Object.keys(updates).forEach(function (k) { next[k] = updates[k]; });
    next.lastPracticed = new Date().toISOString();
    current[phonemeId] = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) { /* storage full or blocked - ignore */ }
    state.progress = current;
    refreshProgressUi();
    return next;
  }

  function mastery(id) {
    var p = state.progress[id];
    return p && typeof p.masteryPercent === 'number' ? p.masteryPercent : 0;
  }

  /** First phoneme (stage order 1 -> 4) below 80% mastery; falls back to th-voiced. */
  function nextRecommended() {
    for (var i = 0; i < stages.length; i++) {
      var ids = stages[i].phonemeIds;
      for (var j = 0; j < ids.length; j++) {
        var p = state.progress[ids[j]];
        if (!p || p.masteryPercent < MASTERED_AT) {
          if (byId[ids[j]]) return byId[ids[j]];
        }
      }
    }
    return byId[FALLBACK_RECOMMENDED] || phonemes[0] || null;
  }

  /* ------------------------------------------------------------------ */
  /* Audio (same fallback cascade as src/lib/audio.ts, minus offline cache) */
  /* ------------------------------------------------------------------ */

  var audioGen = 0;
  var currentAudio = null;

  function stopAudio() {
    if (currentAudio) {
      try {
        currentAudio.onended = null;
        currentAudio.onerror = null;
        currentAudio.pause();
        currentAudio.removeAttribute('src');
        currentAudio.load();
      } catch (e) { /* ignore */ }
      currentAudio = null;
    }
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
  }

  function playUrl(url, gen) {
    return new Promise(function (resolve) {
      if (gen !== audioGen) { resolve(false); return; }
      stopAudio();
      var audio = new Audio();
      currentAudio = audio;
      audio.preload = 'auto';
      var settled = false;
      var timer = window.setTimeout(function () { done(false); }, 8000);
      function done(ok) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(ok && gen === audioGen);
      }
      audio.onended = function () { done(true); };
      audio.onerror = function () { done(false); };
      audio.src = url;
      var pr = audio.play();
      if (pr && pr.then) {
        pr.then(function () {
          if (gen !== audioGen) {
            try { audio.pause(); } catch (e) { /* ignore */ }
            done(false);
          } else {
            // Playback started; report success right away so we do not cascade to the next source.
            done(true);
          }
        }).catch(function () { done(false); });
      }
    });
  }

  function speak(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      var u = new window.SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }

  /** Plays a word: Youdao US -> Google dictionary mp3 -> /api/tts -> Web Speech. */
  function playWord(word) {
    var text = (word || '').trim();
    if (!text) return;
    var gen = ++audioGen;
    stopAudio();
    var isPhrase = /\s/.test(text);
    var urls = ['https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(text)];
    var clean = text.toLowerCase().replace(/[^a-z]/g, '');
    if (!isPhrase && clean && clean.length <= 40) {
      urls.push('https://ssl.gstatic.com/dictionary/static/sounds/20200429/' + clean + '--_us_1.mp3');
    }
    urls.push('/api/tts?q=' + encodeURIComponent(text));

    var chain = Promise.resolve(false);
    urls.forEach(function (u) {
      chain = chain.then(function (ok) {
        if (ok || gen !== audioGen) return ok;
        return playUrl(u, gen);
      });
    });
    chain.then(function (ok) {
      if (!ok && gen === audioGen) speak(text);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Progress -> DOM (stats, cards, stage tabs, recommendation)          */
  /* ------------------------------------------------------------------ */

  function stageById(id) {
    for (var i = 0; i < stages.length; i++) if (stages[i].id === id) return stages[i];
    return stages[0];
  }

  function stageStats(stage) {
    var total = stage.phonemeIds.length;
    var done = stage.phonemeIds.filter(function (id) { return mastery(id) >= MASTERED_AT; }).length;
    return { total: total, mastered: done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  function refreshProgressUi() {
    var total = phonemes.length;
    var mastered = 0;
    Object.keys(state.progress).forEach(function (k) {
      if (state.progress[k] && state.progress[k].masteryPercent >= MASTERED_AT) mastered++;
    });
    var percent = total ? Math.round((mastered / total) * 100) : 0;
    var t = $('#ipa-mastered-count'); if (t) t.textContent = mastered + '/' + total;
    var b = $('#ipa-mastered-bar'); if (b) b.style.width = percent + '%';
    var pc = $('#ipa-mastered-percent'); if (pc) pc.textContent = percent + '%';

    // Cards
    $all('[data-ipa-card]').forEach(function (card) {
      var id = card.getAttribute('data-ipa-card');
      var m = mastery(id);
      var isMastered = m >= MASTERED_AT;
      card.setAttribute('data-mastered', isMastered ? 'true' : 'false');
      var check = $('[data-ipa-check]', card);
      var play = $('[data-ipa-play]', card);
      if (check) check.classList.toggle('hidden', !isMastered);
      if (play && check) play.classList.toggle('hidden', isMastered);
      var bar = $('[data-ipa-bar]', card);
      if (bar) {
        var show = m > 0 && !isMastered;
        bar.classList.toggle('hidden', !show);
        var inner = bar.firstElementChild;
        if (inner) inner.style.width = m + '%';
      }
    });

    // Stage tabs
    stages.forEach(function (s) {
      var st = stageStats(s);
      var c = $('[data-ipa-stage-mastered="' + s.id + '"]'); if (c) c.textContent = st.mastered;
      var p = $('[data-ipa-stage-percent="' + s.id + '"]'); if (p) p.textContent = st.percent + '%';
      var bb = $('[data-ipa-stage-bar="' + s.id + '"]'); if (bb) bb.style.width = st.percent + '%';
    });
    var cur = stageStats(stageById(state.stageId));
    var sc = $('#ipa-stage-count'); if (sc) sc.textContent = cur.mastered + '/' + cur.total;
    var sb = $('#ipa-stage-bar'); if (sb) sb.style.width = cur.percent + '%';
    var sp = $('#ipa-stage-percent'); if (sp) sp.textContent = cur.percent + '%';

    // Recommendation
    var rec = nextRecommended();
    if (rec) {
      var label = $('#ipa-next-label'); if (label) label.textContent = '/' + rec.symbol + '/ \u00B7 ' + rec.anchorWord;
      var btn = $('#ipa-next-btn'); if (btn) btn.setAttribute('data-ipa-open', rec.id);
      var txt = $('#ipa-next-btn-text'); if (txt) txt.textContent = '\uD83C\uDFAF Luy\u1EC7n ngay /' + rec.symbol + '/';
    }
  }

  /* ------------------------------------------------------------------ */
  /* Stage tabs / mode / filter                                          */
  /* ------------------------------------------------------------------ */

  var TAB_ON = ['border-[#b5502f]', 'bg-[#b5502f]/10', 'shadow-sm'];
  var TAB_OFF = ['border-[#bca58f]/50', 'bg-white/60'];

  function showStage(stageId, updateUrl) {
    state.stageId = stageById(stageId).id;
    $all('[data-ipa-panel]').forEach(function (panel) {
      panel.classList.toggle('hidden', panel.getAttribute('data-ipa-panel') !== state.stageId);
    });
    $all('[data-ipa-stage]').forEach(function (tab) {
      var active = tab.getAttribute('data-ipa-stage') === state.stageId;
      if (active) { setClasses(tab, TAB_ON, TAB_OFF); tab.setAttribute('aria-current', 'true'); }
      else { setClasses(tab, TAB_OFF, TAB_ON); tab.removeAttribute('aria-current'); }
    });
    if (updateUrl) writeQuery({ stage: state.stageId });
    refreshProgressUi();
  }

  function writeQuery(changes) {
    try {
      var url = new URL(window.location.href);
      Object.keys(changes).forEach(function (k) {
        if (changes[k] === null) url.searchParams.delete(k);
        else url.searchParams.set(k, changes[k]);
      });
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) { /* ignore */ }
  }

  function setMode(mode) {
    state.mode = mode;
    var pathway = $('#ipa-pathway'), ref = $('#ipa-reference'), sp = $('#ipa-stage-progress');
    if (pathway) pathway.classList.toggle('hidden', mode !== 'pathway');
    if (ref) ref.classList.toggle('hidden', mode !== 'reference');
    if (sp) sp.style.display = mode === 'pathway' ? '' : 'none';
    $all('[data-ipa-mode]').forEach(function (b) {
      var on = b.getAttribute('data-ipa-mode') === mode;
      b.classList.toggle('bg-white', on);
      b.classList.toggle('shadow-sm', on);
      b.classList.toggle('text-[#b5502f]', on);
      b.classList.toggle('text-[#241710]/60', !on);
    });
  }

  function setFilter(filter) {
    state.filter = filter;
    $all('[data-ipa-filter]').forEach(function (b) {
      var on = b.getAttribute('data-ipa-filter') === filter;
      b.classList.toggle('bg-white', on);
      b.classList.toggle('shadow-sm', on);
    });
    var refRoot = $('#ipa-reference');
    $all('[data-ipa-group]', refRoot).forEach(function (group) {
      var type = group.getAttribute('data-ipa-group');
      var groupVisible = filter === 'all' || filter === 'vn-hardest' || filter === type;
      group.classList.toggle('hidden', !groupVisible);
      $all('[data-ipa-card]', group).forEach(function (card) {
        var visible = filter !== 'vn-hardest' || card.getAttribute('data-hard') === 'true';
        card.style.display = visible ? '' : 'none';
      });
      // Hide whole group when the hard-only filter leaves it empty
      if (filter === 'vn-hardest') {
        var any = $all('[data-ipa-card]', group).some(function (c) { return c.getAttribute('data-hard') === 'true'; });
        group.classList.toggle('hidden', !any);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Practice studio modal (5 steps)                                     */
  /* ------------------------------------------------------------------ */

  var studio = null; // { phoneme, stage, quizIndex, targetWord, answered, selected, positionTab, recordedUrl, recorder, chunks, recording }

  var STEPS = [
    { id: 1, label: '1. Kh\u1EA9u h\u00ECnh' },
    { id: 2, label: '2. Luy\u1EC7n tai' },
    { id: 3, label: '3. V\u1ECB tr\u00ED t\u1EEB' },
    { id: 4, label: '4. Thu \u00E2m' },
    { id: 5, label: '5. Luy\u1EC7n c\u00E2u' }
  ];

  function openStudio(id) {
    var p = byId[id];
    if (!p || !modal) return;
    studio = { phoneme: p, stage: 1, quizIndex: 0, targetWord: '', answered: false, selected: null, positionTab: 'initial', recordedUrl: null, recorder: null, chunks: [], recording: false };
    pickQuizTarget();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('ipa-modal-open');
    renderStudio();
  }

  function closeStudio() {
    if (!modal) return;
    stopRecording(true);
    stopAudio();
    audioGen++;
    studio = null;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.innerHTML = '';
    document.body.classList.remove('ipa-modal-open');
    writeQuery({ sound: null });
  }

  function pickQuizTarget() {
    var pairs = studio.phoneme.minimalPairs || [];
    if (!pairs.length) return;
    var pair = pairs[studio.quizIndex % pairs.length];
    studio.targetWord = Math.random() < 0.5 ? pair.target : pair.contrast;
    studio.selected = null;
    studio.answered = false;
  }

  function stopRecording(discard) {
    if (!studio) return;
    if (studio.recorder && studio.recording) {
      try { studio.recorder.stop(); } catch (e) { /* ignore */ }
    }
    studio.recording = false;
    if (discard && studio.recordedUrl) {
      try { URL.revokeObjectURL(studio.recordedUrl); } catch (e) { /* ignore */ }
      studio.recordedUrl = null;
    }
  }

  function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      window.alert('Tr\u00ECnh duy\u1EC7t kh\u00F4ng h\u1ED7 tr\u1EE3 thu \u00E2m.');
      return;
    }
    studio.recordedUrl = null;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      if (!studio) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      var s = studio;
      var rec = new window.MediaRecorder(stream);
      s.recorder = rec;
      s.chunks = [];
      rec.ondataavailable = function (ev) { if (ev.data && ev.data.size > 0) s.chunks.push(ev.data); };
      rec.onstop = function () {
        s.recordedUrl = URL.createObjectURL(new Blob(s.chunks, { type: 'audio/webm' }));
        stream.getTracks().forEach(function (t) { t.stop(); });
        if (studio === s) renderStudio();
      };
      rec.start();
      s.recording = true;
      renderStudio();
    }).catch(function () {
      window.alert('Kh\u00F4ng truy c\u1EADp \u0111\u01B0\u1EE3c Micro. Vui l\u00F2ng cho ph\u00E9p quy\u1EC1n truy c\u1EADp Micro tr\u00EAn tr\u00E1nh duy\u1EC7t.');
    });
  }

  function goStage(n) { studio.stage = n; renderStudio(); }

  function speakerBtn(word, cls, label) {
    return el('button', { type: 'button', class: cls, title: label || 'Nghe ph\u00E1t \u00E2m', 'aria-label': label || 'Nghe ph\u00E1t \u00E2m', onclick: function () { playWord(word); } }, ['\uD83D\uDD0A']);
  }

  var PRIMARY_BTN = 'inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#b5502f] px-4 text-xs font-semibold text-white transition hover:bg-[#9c4326] sm:w-auto';

  function videoSection(p) {
    var v = p.video;
    var wrap = el('div', { class: 'space-y-2' });
    if (v && v.youtubeVideoId) {
      var src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.youtubeVideoId) +
        '?start=' + Math.max(0, Math.floor(v.startSeconds || 0)) +
        '&end=' + Math.floor(v.endSeconds || 0) +
        '&rel=0&modestbranding=1&playsinline=1';
      wrap.appendChild(el('div', { class: 'relative aspect-video w-full overflow-hidden rounded-xl border border-[#bca58f]/50 bg-black' }, [
        el('iframe', {
          src: src, title: v.clipTitle || p.name, class: 'absolute inset-0 h-full w-full', loading: 'lazy',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture', allowfullscreen: true
        })
      ]));
      wrap.appendChild(el('p', { class: 'text-[11px] text-[#241710]/60' }, [
        '\uD83C\uDFA5 ' + (v.channelName || "Rachel's English") + (v.clipTitle ? ' \u00B7 ' + v.clipTitle : '')
      ]));
      if (v.videoTip) wrap.appendChild(el('p', { class: 'text-[11px] italic text-[#241710]/70' }, [v.videoTip]));
    }
    return wrap;
  }

  function stageBody(p) {
    var s = studio;
    var body = el('div', { class: 'flex-1 space-y-4 overflow-y-auto p-4' });

    if (s.stage === 1) {
      body.appendChild(videoSection(p));
      var guide = el('div', { class: 'space-y-1.5 rounded-xl border border-[#bca58f]/50 bg-[#bca58f]/10 p-3 text-xs' }, [
        el('div', { class: 'flex items-start gap-1.5 leading-relaxed' }, [
          el('span', { class: 'shrink-0 font-bold text-[#b5502f]' }, ['\uD83D\uDCA1 Kh\u1EA9u h\u00ECnh:']),
          el('span', null, [p.mouthTip])
        ])
      ]);
      if (p.vietnameseNote) {
        guide.appendChild(el('div', { class: 'flex items-start gap-1.5 border-t border-[#bca58f]/40 pt-1 leading-relaxed text-[#241710]/70' }, [
          el('span', { class: 'shrink-0 font-semibold text-amber-600' }, ['\u26A0\uFE0F L\u01B0u \u00FD:']),
          el('span', null, [p.vietnameseNote])
        ]));
      }
      body.appendChild(guide);
      body.appendChild(el('div', { class: 'flex justify-end pt-1' }, [
        el('button', { type: 'button', class: PRIMARY_BTN, onclick: function () {
          saveProgress(p.id, { stagesCompleted: 1, masteryPercent: 20 });
          goStage(2);
        } }, ['N\u1EA5c 2: Luy\u1EC7n tai ph\u00E2n bi\u1EC7t c\u1EB7p \u00E2m \u2192'])
      ]));
    }

    if (s.stage === 2) {
      body.appendChild(el('div', null, [
        el('h3', { class: 'text-sm font-bold' }, ['Nghe v\u00E0 ch\u1ECDn t\u1EEB \u0111\u00FAng:']),
        el('p', { class: 'text-xs text-[#241710]/60' }, ['Ph\u00E2n bi\u1EC7t s\u1EF1 kh\u00E1c bi\u1EC7t gi\u1EEFa \u00E2m /' + p.symbol + '/ v\u00E0 \u00E2m \u0111\u1ED1i l\u1EADp d\u1EC5 nh\u1EA7m l\u1EABn.'])
      ]));
      var pairs = p.minimalPairs || [];
      if (pairs.length) {
        var pair = pairs[s.quizIndex % pairs.length];
        var options = [pair.target, pair.contrast].sort();
        var grid = el('div', { class: 'mx-auto grid max-w-sm grid-cols-2 gap-3' });
        options.forEach(function (opt) {
          var cls = 'rounded-xl border p-3 text-sm font-bold transition border-[#bca58f]/60 bg-white hover:border-[#b5502f]';
          if (s.answered) {
            if (opt === s.targetWord) cls = 'rounded-xl border p-3 text-sm font-bold transition border-emerald-500 bg-emerald-500/10 text-emerald-800';
            else if (opt === s.selected) cls = 'rounded-xl border p-3 text-sm font-bold transition border-rose-500 bg-rose-500/10 text-rose-800';
          }
          grid.appendChild(el('button', { type: 'button', class: cls, onclick: function () {
            if (s.answered) return;
            s.selected = opt;
            s.answered = true;
            renderStudio();
          } }, [opt]));
        });
        var card = el('div', { class: 'space-y-4 rounded-xl border border-[#bca58f]/50 bg-[#bca58f]/10 p-5 text-center' }, [
          el('div', { class: 'flex justify-center' }, [
            el('button', { type: 'button', title: 'B\u1EA5m \u0111\u1EC3 nghe \u00E2m thanh b\u00ED m\u1EADt', class: 'flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#b5502f]/50 bg-[#b5502f]/5 text-2xl transition hover:scale-105 hover:bg-[#b5502f]/15', onclick: function () { playWord(s.targetWord); } }, ['\uD83D\uDD0A'])
          ]),
          el('p', { class: 'text-xs font-medium text-[#241710]/60' }, ['B\u1EA5m loa \u0111\u1EC3 nghe \u00E2m thanh']),
          grid
        ]);
        if (s.answered) {
          card.appendChild(el('div', { class: 'space-y-2 pt-1' }, [
            el('p', { class: 'text-xs text-[#241710]/70' }, [pair.note]),
            el('button', { type: 'button', class: 'inline-flex h-8 items-center rounded-lg bg-[#b5502f] px-3 text-xs font-semibold text-white hover:bg-[#9c4326]', onclick: function () {
              if (s.quizIndex + 1 < (pairs.length || 3)) {
                s.quizIndex++;
                pickQuizTarget();
                renderStudio();
              } else {
                saveProgress(p.id, { stagesCompleted: 2, masteryPercent: 40 });
                goStage(3);
              }
            } }, ['C\u00E2u ti\u1EBFp theo \u2192'])
          ]));
        }
        body.appendChild(card);
      } else {
        body.appendChild(el('div', { class: 'p-6 text-center text-xs text-[#241710]/60' }, [
          '\u00C2m n\u00E0y kh\u00F4ng c\u00F3 c\u1EB7p t\u1ED1i thi\u1EC3u g\u00E2y nh\u1EA7m l\u1EABn l\u1EDBn.',
          el('div', { class: 'mt-3' }, [
            el('button', { type: 'button', class: 'inline-flex h-8 items-center rounded-lg bg-[#b5502f] px-3 text-xs font-semibold text-white', onclick: function () { goStage(3); } }, ['Qua n\u1EA5c 3: V\u1ECB tr\u00ED t\u1EEB \u2192'])
          ])
        ]));
      }
    }

    if (s.stage === 3) {
      body.appendChild(el('div', null, [
        el('h3', { class: 'text-sm font-bold' }, ['Luy\u1EC7n \u00E2m /' + p.symbol + '/ \u1EDF 3 v\u1ECB tr\u00ED t\u1EEB']),
        el('p', { class: 'text-xs text-[#241710]/60' }, ['Ng\u01B0\u1EDDi Vi\u1EC7t hay nu\u1ED1t \u00E2m cu\u1ED1i t\u1EEB. B\u1EA5m v\u00E0o t\u1EEB \u0111\u1EC3 nghe ph\u00E1t \u00E2m chu\u1EA9n:'])
      ]));
      var tabs = el('div', { class: 'flex gap-1 rounded-lg border border-[#bca58f]/50 bg-[#bca58f]/10 p-0.5 text-xs font-semibold' });
      [
        ['initial', '\u0110\u1EA7u t\u1EEB', p.initialWords],
        ['medial', 'Gi\u1EEFa t\u1EEB', p.medialWords],
        ['final', 'Cu\u1ED1i t\u1EEB', p.finalWords]
      ].forEach(function (t) {
        var on = s.positionTab === t[0];
        tabs.appendChild(el('button', { type: 'button', class: 'flex-1 rounded-md py-1.5 transition ' + (on ? 'bg-white font-bold shadow-sm' : 'text-[#241710]/60'), onclick: function () { s.positionTab = t[0]; renderStudio(); } }, [t[1] + ' (' + (t[2] || []).length + ')']));
      });
      body.appendChild(tabs);
      var words = s.positionTab === 'initial' ? p.initialWords : s.positionTab === 'medial' ? p.medialWords : p.finalWords;
      var wg = el('div', { class: 'grid grid-cols-2 gap-2 sm:grid-cols-3' });
      if (!words || !words.length) {
        wg.appendChild(el('div', { class: 'col-span-3 py-4 text-center text-xs text-[#241710]/60' }, ['\u00C2m n\u00E0y kh\u00F4ng xu\u1EA5t hi\u1EC7n \u1EDF v\u1ECB tr\u00ED n\u00E0y.']));
      } else {
        words.forEach(function (w) {
          wg.appendChild(el('button', { type: 'button', class: 'flex items-center justify-between rounded-lg border border-[#bca58f]/50 bg-white p-2.5 text-left transition hover:border-[#b5502f]/60', onclick: function () { playWord(w); } }, [
            el('span', { class: 'text-xs font-bold' }, [w]),
            el('span', { class: 'text-[#241710]/50' }, ['\uD83D\uDD0A'])
          ]));
        });
      }
      body.appendChild(wg);
      body.appendChild(el('div', { class: 'flex justify-end pt-1' }, [
        el('button', { type: 'button', class: PRIMARY_BTN, onclick: function () {
          saveProgress(p.id, { stagesCompleted: 3, masteryPercent: 60 });
          goStage(4);
        } }, ['Ti\u1EBFp t\u1EE5c: N\u1EA5c 4 - Thu \u00E2m \u0111\u1ED1i chi\u1EBFu \u2192'])
      ]));
    }

    if (s.stage === 4) {
      body.appendChild(el('div', null, [
        el('h3', { class: 'text-sm font-bold' }, ['Thu \u00E2m gi\u1ECDng \u0111\u1ECDc & \u0111\u1ED1i chi\u1EBFu']),
        el('p', { class: 'text-xs text-[#241710]/60' }, ['Ph\u00E1t \u00E2m t\u1EEB "' + p.anchorWord + '" ' + p.anchorWordIpa + ' v\u00E0 nghe l\u1EA1i \u0111\u1EC3 so s\u00E1nh v\u1EDBi c\u00F4 Rachel.'])
      ]));
      var mic = el('div', { class: 'mx-auto max-w-xs space-y-2.5 rounded-xl border border-[#bca58f]/50 bg-white p-3 shadow-sm' }, [
        el('p', { class: 'text-xs font-medium text-[#241710]/60' }, ['Gi\u1ECDng \u0111\u1ECDc c\u1EE7a b\u1EA1n:']),
        el('div', { class: 'flex justify-center' }, [
          s.recording
            ? el('button', { type: 'button', class: 'inline-flex h-8 animate-pulse items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white', onclick: function () { stopRecording(false); renderStudio(); } }, ['\uD83C\uDF99\uFE0F D\u1EEBng thu \u00E2m'])
            : el('button', { type: 'button', class: 'inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#b5502f] px-4 text-xs font-semibold text-white hover:bg-[#9c4326]', onclick: startRecording }, ['\uD83C\uDF99\uFE0F B\u1EAFt \u0111\u1EA7u thu \u00E2m'])
        ])
      ]);
      if (s.recordedUrl) {
        mic.appendChild(el('div', { class: 'space-y-1 border-t border-[#bca58f]/40 pt-2' }, [
          el('p', { class: 'text-[11px] font-semibold text-emerald-600' }, ['\u2713 \u0110\u00E3 thu \u00E2m xong! Nghe l\u1EA1i:']),
          el('audio', { controls: true, src: s.recordedUrl, class: 'h-7 w-full' })
        ]));
      }
      body.appendChild(el('div', { class: 'space-y-4 rounded-xl border border-[#bca58f]/50 bg-[#bca58f]/10 p-4 text-center' }, [
        el('div', { class: 'flex items-center justify-center gap-3' }, [
          el('span', { class: 'font-mono text-2xl font-black' }, ['/' + p.symbol + '/']),
          el('span', { class: 'text-lg font-bold' }, [p.anchorWord]),
          el('button', { type: 'button', class: 'inline-flex h-8 items-center gap-1 rounded-lg border border-[#bca58f]/60 px-2.5 text-xs hover:bg-white', onclick: function () { playWord(p.anchorWord); } }, ['\uD83D\uDD0A M\u1EABu'])
        ]),
        mic
      ]));
      body.appendChild(el('div', { class: 'flex justify-end pt-1' }, [
        el('button', { type: 'button', class: PRIMARY_BTN, onclick: function () {
          stopRecording(true);
          saveProgress(p.id, { stagesCompleted: 4, masteryPercent: 80 });
          goStage(5);
        } }, ['Ti\u1EBFp t\u1EE5c: N\u1EA5c 5 - Luy\u1EC7n c\u00E2u ng\u1EEF c\u1EA3nh \u2192'])
      ]));
    }

    if (s.stage === 5) {
      body.appendChild(el('div', null, [
        el('h3', { class: 'text-sm font-bold' }, ['Luy\u1EC7n c\u00E2u ng\u1EEF c\u1EA3nh & Shadowing']),
        el('p', { class: 'text-xs text-[#241710]/60' }, ['\u0110\u1EB7t \u00E2m /' + p.symbol + '/ v\u00E0o m\u1EA1ch c\u00E2u giao ti\u1EBFp t\u1EF1 nhi\u00EAn:'])
      ]));
      var list = el('div', { class: 'space-y-2' });
      (p.practiceSentences || []).forEach(function (sen) {
        var targets = (sen.targetWords || []).map(function (w) { return w.toLowerCase(); });
        var line = el('p', { class: 'text-sm font-bold' });
        sen.sentence.split(' ').forEach(function (word) {
          var clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
          var isTarget = targets.indexOf(clean) !== -1;
          line.appendChild(el('span', { class: isTarget ? 'mr-1 border-b-2 border-[#b5502f]/50 font-black text-[#b5502f]' : 'mr-1' }, [word]));
        });
        list.appendChild(el('div', { class: 'space-y-1 rounded-xl border border-[#bca58f]/50 bg-white p-3 shadow-sm transition hover:border-[#b5502f]/50' }, [
          el('div', { class: 'flex items-start justify-between gap-2' }, [
            el('div', null, [line, el('p', { class: 'text-xs text-[#241710]/60' }, [sen.translationVi])]),
            speakerBtn((sen.targetWords && sen.targetWords[0]) || p.anchorWord, 'h-8 w-8 shrink-0 rounded-lg text-[#b5502f] hover:bg-[#b5502f]/10', 'Nghe t\u1EEB kh\u00F3a')
          ])
        ]));
      });
      body.appendChild(list);
      body.appendChild(el('div', { class: 'space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center' }, [
        el('div', { class: 'text-2xl' }, ['\uD83C\uDFC6']),
        el('div', null, [
          el('h4', { class: 'text-sm font-bold' }, ['Xu\u1EA5t s\u1EAFc! \u0110\u00E3 ho\u00E0n th\u00E0nh 5 b\u01B0\u1EDBc \u00E2m /' + p.symbol + '/']),
          el('p', { class: 'text-xs text-[#241710]/60' }, ['\u0110\u00E3 ghi nh\u1EADn 100% \u0111\u1ED9 th\u00E0nh th\u1EA1o v\u00E0 t\u1EB7ng +30 XP v\u00E0o h\u1ED3 s\u01A1.'])
        ]),
        el('button', { type: 'button', class: 'inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700', onclick: function () {
          saveProgress(p.id, { stagesCompleted: 5, masteryPercent: 100, stars: 3 });
          closeStudio();
        } }, ['L\u01B0u th\u00E0nh t\u00EDch & Ho\u00E0n th\u00E0nh \uD83C\uDF89'])
      ]));
    }
    return body;
  }

  function renderStudio() {
    if (!studio || !modal) return;
    var p = studio.phoneme;
    var scrollTop = 0;
    var oldBody = $('[data-studio-body]', modal);
    if (oldBody) scrollTop = oldBody.scrollTop;

    var header = el('div', { class: 'flex items-center justify-between border-b border-[#bca58f]/40 bg-[#bca58f]/10 px-4 py-3' }, [
      el('div', { class: 'flex items-center gap-2.5' }, [
        el('div', { class: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b5502f] font-mono text-lg font-black text-white shadow-sm' }, ['/' + p.symbol + '/']),
        el('div', null, [
          el('div', { class: 'flex items-center gap-1.5' }, [
            el('h2', { class: 'text-sm font-bold sm:text-base' }, [p.name]),
            p.difficultyForVn === 'high' ? el('span', { class: 'rounded-full border border-amber-300/70 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700' }, ['Hay sai']) : null
          ]),
          el('p', { class: 'mt-0.5 flex items-center gap-1 text-xs text-[#241710]/60' }, [
            el('span', null, ['T\u1EEB m\u1EABu:']),
            el('span', { class: 'font-bold text-[#241710]' }, [p.anchorWord]),
            el('span', { class: 'font-mono text-[11px] opacity-70' }, [p.anchorWordIpa]),
            speakerBtn(p.anchorWord, 'p-0.5 text-[#b5502f] transition hover:scale-110', 'Nghe t\u1EEB m\u1EABu')
          ])
        ])
      ]),
      el('button', { type: 'button', class: 'flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-[#bca58f]/30', 'aria-label': '\u0110\u00F3ng', onclick: closeStudio }, ['\u2715'])
    ]);

    var stepper = el('div', { class: 'flex items-center gap-1 overflow-x-auto border-b border-[#bca58f]/40 bg-[#bca58f]/5 px-2 py-1.5' });
    STEPS.forEach(function (st) {
      var on = studio.stage === st.id;
      stepper.appendChild(el('button', { type: 'button', class: 'flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition ' + (on ? 'border border-[#bca58f]/60 bg-white shadow-sm' : 'text-[#241710]/60 hover:text-[#241710]'), onclick: function () { goStage(st.id); } }, [st.label]));
    });

    var body = stageBody(p);
    body.setAttribute('data-studio-body', '1');

    var panel = el('div', { class: 'flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#bca58f]/50 bg-[#fbf7f1] shadow-2xl' }, [header, stepper, body]);
    modal.innerHTML = '';
    modal.appendChild(panel);
    body.scrollTop = scrollTop;
  }

  /* ------------------------------------------------------------------ */
  /* Wiring                                                              */
  /* ------------------------------------------------------------------ */

  document.addEventListener('click', function (ev) {
    var target = ev.target;
    if (!(target instanceof Element)) return;

    var play = target.closest('[data-ipa-play]');
    if (play) {
      ev.preventDefault();
      ev.stopPropagation();
      playWord(play.getAttribute('data-ipa-play'));
      return;
    }
    if (modal && ev.target === modal) { closeStudio(); return; }

    var open = target.closest('[data-ipa-open]');
    if (open && !(modal && modal.contains(open))) {
      ev.preventDefault();
      openStudio(open.getAttribute('data-ipa-open'));
      return;
    }
    var stageTab = target.closest('[data-ipa-stage]');
    if (stageTab) {
      ev.preventDefault();
      showStage(stageTab.getAttribute('data-ipa-stage'), true);
      return;
    }
    var modeBtn = target.closest('[data-ipa-mode]');
    if (modeBtn) { setMode(modeBtn.getAttribute('data-ipa-mode')); return; }
    var filterBtn = target.closest('[data-ipa-filter]');
    if (filterBtn) { setFilter(filterBtn.getAttribute('data-ipa-filter')); return; }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && studio) { closeStudio(); return; }
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target instanceof Element && ev.target.matches('[data-ipa-card]')) {
      ev.preventDefault();
      openStudio(ev.target.getAttribute('data-ipa-card'));
    }
  });

  function init() {
    // Reveal JS-only controls (hidden by default so the no-JS page stays clean).
    $all('.js-only').forEach(function (n) { n.classList.remove('hidden'); n.classList.add('flex'); });

    state.progress = readProgress();

    var params = new URLSearchParams(window.location.search);
    var stageParam = params.get('stage');
    var soundParam = params.get('sound');
    var initialStage = stageParam && stages.some(function (s) { return s.id === stageParam; })
      ? stageParam
      : (root && root.getAttribute('data-active-stage')) || DEFAULT_STAGE;

    setMode('pathway');
    setFilter('all');
    showStage(initialStage, false);
    refreshProgressUi();

    if (soundParam && byId[soundParam]) openStudio(soundParam);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
