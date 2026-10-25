// ==UserScript==
// @name         LingoPro Example-VI Bot (aistudio + gemini)
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Dịch words.example → example_vi. v1.1: batch token + echo EN (tránh bắt JSON cũ / lệch index).
// @author       LingoPro
// @match        *://aistudio.google.com/*
// @match        *://gemini.google.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';
  if (window.top !== window.self) return;

  const CONFIG = {
    BASE_URL: 'http://localhost:3000',
    SECRET: '', // điền BOT_SECRET local (không commit secret)
    BATCH_SIZE: 80, // vừa đủ lớn (Studio tính request); quá to dễ model lệch index
    MAX_BATCHES: 40,
    SHARDS: 4,
    POLL_MS: 1500,
    POLL_TIMEOUT_MS: 240000,
    MIN_HIT_RATIO: 0.55,
  };

  const isAI = location.hostname.includes('aistudio');
  let shard = parseInt(sessionStorage.getItem('exvi_shard') || '0', 10);
  let isRunning = sessionStorage.getItem('exvi_running') === 'true';
  let batchCount = parseInt(sessionStorage.getItem('exvi_count') || '0', 10);
  /** @type {string} */
  let activeToken = '';
  /** độ dài text trang trước khi gửi — chỉ parse phần mới */
  let baselineTextLen = 0;

  function authHeaders(extra) {
    const h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    if (CONFIG.SECRET) h.Authorization = 'Bearer ' + CONFIG.SECRET;
    return h;
  }

  function gmGet(url) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        headers: authHeaders(),
        onload: resolve,
        onerror: reject,
        ontimeout: function () { reject(new Error('timeout')); },
        timeout: 30000,
      });
    });
  }

  function gmPost(url, data) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: 'POST',
        url: url,
        headers: authHeaders(),
        data: typeof data === 'string' ? data : JSON.stringify(data),
        onload: resolve,
        onerror: reject,
        ontimeout: function () { reject(new Error('timeout')); },
        timeout: 60000,
      });
    });
  }

  function normEn(s) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
  }

  function makeToken() {
    return 'EXVI_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  GM_registerMenuCommand(
    '🚀 ' + (isRunning ? 'ĐANG CHẠY Example-VI…' : 'BẮT ĐẦU Example-VI v1.1'),
    startBot,
  );
  GM_registerMenuCommand('🛑 DỪNG', stopBot);
  GM_registerMenuCommand('📦 ĐẶT BATCH_SIZE (hiện: ' + CONFIG.BATCH_SIZE + ')', function () {
    const v = prompt('Số câu unique / request (20–120):', String(CONFIG.BATCH_SIZE));
    if (v === null) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 10 || n > 120) {
      alert('Chọn 10–120');
      return;
    }
    sessionStorage.setItem('exvi_batch_size', String(n));
    location.reload();
  });
  GM_registerMenuCommand('🔢 ĐẶT SHARD (hiện: ' + shard + '/' + (CONFIG.SHARDS - 1) + ')', function () {
    const v = prompt('Tab này shard? (0…' + (CONFIG.SHARDS - 1) + ')', String(shard));
    if (v === null) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 0 || n >= CONFIG.SHARDS) {
      alert('Không hợp lệ');
      return;
    }
    shard = n;
    sessionStorage.setItem('exvi_shard', String(n));
    location.reload();
  });

  const savedSize = parseInt(sessionStorage.getItem('exvi_batch_size') || '', 10);
  if (!Number.isNaN(savedSize) && savedSize >= 10 && savedSize <= 120) {
    CONFIG.BATCH_SIZE = savedSize;
  }

  function startBot() {
    if (isRunning) return;
    if (!CONFIG.SECRET) {
      alert('Thiếu CONFIG.SECRET');
      return;
    }
    isRunning = true;
    batchCount = 0;
    sessionStorage.setItem('exvi_running', 'true');
    sessionStorage.setItem('exvi_count', '0');
    // Chat cũ đầy JSON → dễ bắt nhầm: khuyên tab mới; vẫn chạy với token
    processNextBatch();
  }

  function stopBot() {
    isRunning = false;
    sessionStorage.removeItem('exvi_running');
    location.reload();
  }

  function status(msg, left) {
    document.title =
      '[ExVI#' +
      shard +
      ' ' +
      msg +
      '] (' +
      batchCount +
      '/' +
      CONFIG.MAX_BATCHES +
      ')' +
      (left != null && left !== '' ? ' · còn ~' + left : '');
  }

  function deepQuery(root, sel) {
    const el = root.querySelector(sel);
    if (el && el.offsetParent !== null) return el;
    for (const e of root.querySelectorAll('*')) {
      if (e.shadowRoot) {
        const f = deepQuery(e.shadowRoot, sel);
        if (f) return f;
      }
    }
    return null;
  }

  function deepClickRun(root) {
    for (const b of root.querySelectorAll('button, div[role="button"]')) {
      if (
        b.offsetParent !== null &&
        b.innerText &&
        (b.innerText.includes('Run') || b.innerText.includes('Submit'))
      ) {
        b.click();
        return true;
      }
    }
    for (const e of root.querySelectorAll('*')) {
      if (e.shadowRoot && deepClickRun(e.shadowRoot)) return true;
    }
    return false;
  }

  async function processNextBatch() {
    if (!isRunning) return;
    if (batchCount >= CONFIG.MAX_BATCHES) {
      sessionStorage.setItem('exvi_count', '0');
      setTimeout(function () {
        location.reload();
      }, 2000);
      return;
    }

    status('Lấy batch…');
    try {
      const url =
        CONFIG.BASE_URL +
        '/api/bot/example-vi-batch?size=' +
        CONFIG.BATCH_SIZE +
        '&shard=' +
        shard +
        '&shards=' +
        CONFIG.SHARDS;
      const res = await gmGet(url);
      const data = JSON.parse(res.responseText);
      if (!data.success) {
        status('LỖI SERVER');
        console.error('[ExVI]', data.error);
        if (/Unauthorized/i.test(String(data.error || ''))) {
          alert('Unauthorized — kiểm tra BOT_SECRET');
          stopBot();
        }
        return;
      }
      await runPrompt(data.items || [], data.remaining, data.rowCount);
    } catch (e) {
      console.error('[ExVI] fetch batch:', e);
      status('MẤT KẾT NỐI');
      setTimeout(processNextBatch, 5000);
    }
  }

  async function runPrompt(items, remaining, rowCount) {
    if (!items || items.length === 0) {
      status('XONG!');
      console.log('[ExVI] Hết câu cần sub VI.');
      isRunning = false;
      sessionStorage.removeItem('exvi_running');
      return;
    }

    activeToken = makeToken();
    baselineTextLen = (document.body.innerText || '').length;

    console.log(
      '[ExVI] Batch',
      items.length,
      'câu · rows~',
      rowCount,
      '· remaining~',
      remaining,
      '· token',
      activeToken,
    );

    // AI phải echo lại en + batch token → không lệch index / không nhặt JSON cũ
    const payload = items.map(function (it) {
      return { i: it.i, en: it.example };
    });

    const prompt =
      'SYSTEM: Máy dịch Anh→Việt cho app học từ vựng.\n' +
      'CHỈ trả ĐÚNG 1 JSON object, không markdown, không text ngoài JSON.\n' +
      'NHIỆM VỤ: dịch từng câu "en" sang 1 câu tiếng Việt TỰ NHIÊN (không word-by-word).\n' +
      'OUTPUT shape BẮT BUỘC:\n' +
      '{\n' +
      '  "batch": "' +
      activeToken +
      '",\n' +
      '  "items": [\n' +
      '    {"i":0,"en":"<copy đúng en gốc>","vi":"<bản dịch Việt>"},\n' +
      '    ...\n' +
      '  ]\n' +
      '}\n' +
      'QUY TẮC:\n' +
      '- "batch" PHẢI đúng: ' +
      activeToken +
      '\n' +
      '- Đủ mọi i từ 0..' +
      (items.length - 1) +
      '\n' +
      '- "en" PHẢI copy y hệt input (không sửa, không dịch en)\n' +
      '- "vi" = 1 câu Việt tự nhiên, đúng nghĩa en đó\n' +
      '- Không gộp/bỏ/đảo câu\n' +
      'INPUT (' +
      items.length +
      ' câu):\n' +
      JSON.stringify(payload);

    const inSelectors = isAI
      ? ['textarea', 'div[contenteditable="true"]', 'div[role="textbox"]']
      : ['rich-textarea .ql-editor', 'rich-textarea p', 'div[contenteditable="true"]', 'textarea'];

    let editor = null;
    for (let t = 0; t < 25 && !editor; t++) {
      for (let s = 0; s < inSelectors.length; s++) {
        editor = deepQuery(document.documentElement, inSelectors[s]);
        if (editor) break;
      }
      if (!editor) await new Promise(function (r) { setTimeout(r, 400); });
    }
    if (!editor) {
      console.error('[ExVI] Không thấy ô nhập');
      status('NO INPUT');
      return;
    }

    editor.focus();
    if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
      editor.value = prompt;
    } else if (editor.isContentEditable) {
      try {
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, prompt);
      } catch (e) {
        editor.textContent = prompt;
      }
    } else {
      editor.textContent = prompt;
    }
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(function (r) { setTimeout(r, 900); });

    // baseline lại sau khi dán prompt (prompt có token — tránh parse nhầm prompt)
    baselineTextLen = (document.body.innerText || '').length;

    if (isAI) {
      deepClickRun(document.documentElement);
    } else {
      const btn =
        deepQuery(document.documentElement, 'button.send-button') ||
        deepQuery(document.documentElement, 'button[aria-label*="Send"]') ||
        deepQuery(document.documentElement, 'button[aria-label*="Gửi"]');
      if (btn) btn.click();
      else console.error('[ExVI] Không thấy nút gửi gemini');
    }

    status('Chờ AI…', remaining);
    pollResult(items, remaining);
  }

  /**
   * Parse chỉ object có batch === token.
   * Trả mảng {i, en, vi} hoặc null.
   */
  function extractTokenResult(text, token) {
    if (!text || text.indexOf(token) === -1) return null;

    const results = [];
    let start = 0;
    while ((start = text.indexOf('{', start)) !== -1) {
      let depth = 0;
      let end = -1;
      let inStr = false;
      let esc = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inStr) {
          if (esc) esc = false;
          else if (ch === '\\') esc = true;
          else if (ch === '"') inStr = false;
          continue;
        }
        if (ch === '"') {
          inStr = true;
          continue;
        }
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end === -1) break;
      const slice = text.slice(start, end + 1);
      if (slice.indexOf(token) === -1) {
        start++;
        continue;
      }
      try {
        const obj = JSON.parse(slice);
        if (!obj || typeof obj !== 'object') {
          start++;
          continue;
        }
        if (String(obj.batch || '') !== token) {
          start++;
          continue;
        }
        let items = obj.items;
        if (!Array.isArray(items) && obj.vi && typeof obj.vi === 'object') {
          // fallback shape cũ nhưng vẫn có batch
          items = Object.keys(obj.vi).map(function (k) {
            return { i: parseInt(k, 10), vi: obj.vi[k] };
          });
        }
        if (Array.isArray(items) && items.length > 0) {
          results.push(items);
        }
      } catch (e) {
        /* scan */
      }
      start++;
    }
    return results.length ? results[results.length - 1] : null;
  }

  function buildSavePayload(items, rawItems) {
    // Map theo en (ưu tiên), rồi i
    const byEn = new Map();
    const byI = new Map();
    for (let k = 0; k < rawItems.length; k++) {
      const it = rawItems[k] || {};
      const vi = String(it.vi || it.example_vi || '').trim();
      if (vi.length < 2) continue;
      if (it.en) byEn.set(normEn(it.en), vi);
      if (it.i != null && !Number.isNaN(Number(it.i))) byI.set(Number(it.i), { vi: vi, en: it.en });
    }

    const payload = [];
    let hitEn = 0;
    let hitI = 0;
    for (let j = 0; j < items.length; j++) {
      const src = items[j];
      let vi = byEn.get(normEn(src.example));
      if (vi) {
        hitEn++;
      } else {
        const fb = byI.get(src.i);
        // chỉ nhận fallback i nếu AI cũng echo en trùng (khi có en)
        if (fb) {
          if (!fb.en || normEn(fb.en) === normEn(src.example)) {
            vi = fb.vi;
            hitI++;
          }
        }
      }
      if (!vi) continue;
      // chặn VI copy nguyên EN
      if (normEn(vi) === normEn(src.example)) continue;
      payload.push({
        i: src.i,
        ids: src.ids,
        example: src.example,
        example_vi: vi,
      });
    }
    return { payload: payload, hitEn: hitEn, hitI: hitI };
  }

  async function pollResult(items, remaining) {
    const t0 = Date.now();
    const token = activeToken;
    let lastLog = 0;

    while (Date.now() - t0 < CONFIG.POLL_TIMEOUT_MS) {
      await new Promise(function (r) { setTimeout(r, CONFIG.POLL_MS); });
      const full = document.body.innerText || '';
      const lower = full.toLowerCase();
      if (
        lower.includes('reached your quota') ||
        lower.includes('rate limit') ||
        lower.includes('try again later') ||
        lower.includes('usage limit')
      ) {
        status('HẾT QUOTA!');
        isRunning = false;
        sessionStorage.removeItem('exvi_running');
        return;
      }

      // Ưu tiên phần text mới sau baseline (bỏ prompt + chat cũ)
      let scan = full;
      if (full.length > baselineTextLen + 50) {
        scan = full.slice(Math.max(0, baselineTextLen - 200));
      }
      // vẫn cần token trong scan
      if (scan.indexOf(token) === -1) {
        // model có thể chỉ trả items — bắt buộc có token; chờ tiếp
        if (Date.now() - lastLog > 15000) {
          console.log('[ExVI] chờ token', token, '…');
          lastLog = Date.now();
        }
        continue;
      }

      const rawItems = extractTokenResult(scan, token);
      if (!rawItems) continue;

      const built = buildSavePayload(items, rawItems);
      const need = Math.max(3, Math.floor(items.length * CONFIG.MIN_HIT_RATIO));
      if (built.payload.length < need) {
        if (Date.now() - lastLog > 10000) {
          console.log(
            '[ExVI] partial',
            built.payload.length + '/' + items.length,
            'enHit',
            built.hitEn,
            'iHit',
            built.hitI,
          );
          lastLog = Date.now();
        }
        continue;
      }

      console.log(
        '[ExVI] Parse OK',
        built.payload.length + '/' + items.length,
        '· matchEN',
        built.hitEn,
        '· matchI',
        built.hitI,
        '· token',
        token,
      );

      try {
        const res = await gmPost(CONFIG.BASE_URL + '/api/bot/example-vi-save', built.payload);
        const data = JSON.parse(res.responseText || '{}');
        console.log('[ExVI] save:', data);
        status('Lưu ' + (data.saved || 0), remaining);
      } catch (e) {
        console.error('[ExVI] save fail', e);
      }

      batchCount++;
      sessionStorage.setItem('exvi_count', String(batchCount));
      await new Promise(function (r) { setTimeout(r, 2000); });
      processNextBatch();
      return;
    }

    console.warn('[ExVI] timeout poll → reload');
    location.reload();
  }

  if (isRunning) setTimeout(processNextBatch, 2500);
})();
