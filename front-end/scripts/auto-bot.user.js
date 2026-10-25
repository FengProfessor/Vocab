// ==UserScript==
// @name         LingoPro AI Bot (V3.0 - Multi-Model Router)
// @namespace    http://tampermonkey.net/
// @version      3.0.0
// @description  Cào từ vựng qua UI: AI Studio, ChatGPT, Claude.ai, DeepSeek, Cambridge. Không dùng API key.
// @author       Antigravity
// @match        *://aistudio.google.com/*
// @match        *://gemini.google.com/*
// @match        *://chatgpt.com/*
// @match        *://claude.ai/*
// @match        *://chat.deepseek.com/*
// @match        *://dictionary.cambridge.org/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// ==/UserScript==

(function () {
    'use strict';
    if (window.top !== window.self) return;

    // ── CONFIG ────────────────────────────────────────────────
    const CFG = {
        // Đổi thành localhost:3000 khi chạy dev local
        BASE_URL:         GM_getValue('base_url', 'https://lingopro.online'),
        BATCH_SIZE:       35,
        MAX_BATCHES:      40,
        POLL_INTERVAL_MS: 1500,
        POLL_TIMEOUT_MS:  120_000,
        BATCH_DELAY_MS:   2500,
    };

    // ── PLATFORM DETECT ───────────────────────────────────────
    const H = window.location.hostname;
    const PLATFORM =
        H.includes('aistudio')   ? 'aistudio'   :
        H.includes('gemini')     ? 'gemini'      :
        H.includes('chatgpt')    ? 'chatgpt'     :
        H.includes('claude')     ? 'claude'      :
        H.includes('deepseek')   ? 'deepseek'    :
        H.includes('cambridge')  ? 'cambridge'   : 'unknown';

    // Mỗi platform: cách tìm editor + cách submit + dấu hiệu hết quota
    const PLATFORMS = {
        aistudio:  { editors: ['textarea', 'div[contenteditable="true"]'],           submit: submitRunButton,  quota: ['reached your quota','rate limit','try again later','429'] },
        gemini:    { editors: ['rich-textarea p', 'div[contenteditable="true"]'],    submit: submitEnter,      quota: ['rate limit','try again later'] },
        chatgpt:   { editors: ['#prompt-textarea', 'textarea'],                      submit: submitEnter,      quota: ["you've reached","rate limit","too many requests"] },
        claude:    { editors: ['div[contenteditable="true"].ProseMirror', 'div[contenteditable="true"]'], submit: submitEnter, quota: ['usage limit','rate limit','try again'] },
        deepseek:  { editors: ['textarea#chat-input', 'textarea'],                   submit: submitEnter,      quota: ['rate limit','service busy','try again later'] },
        cambridge: { editors: [], submit: null, quota: [] },
    };

    const platform = PLATFORMS[PLATFORM] || PLATFORMS.aistudio;

    // ── STATE (GM_setValue để persist qua reload/tab) ─────────
    let isRunning  = GM_getValue('bot_running',  false);
    let batchCount = GM_getValue('bot_count',    0);
    let isReverse  = GM_getValue('bot_reverse',  false);
    let harvWords  = GM_getValue('harv_words',   '[]');

    // ── MENU ──────────────────────────────────────────────────
    GM_registerMenuCommand(`🚀 ${isRunning ? `ĐANG CHẠY (batch ${batchCount})` : 'BẮT ĐẦU CÀO'} [${PLATFORM}]`, startBot);
    GM_registerMenuCommand('🛑 DỪNG', stopBot);
    GM_registerMenuCommand(`🔄 Chiều: ${isReverse ? 'Z→A' : 'A→Z'}`, toggleDir);
    GM_registerMenuCommand('📥 Nhập từ thủ công (Cambridge)', promptBulk);
    GM_registerMenuCommand('🔧 Đổi Server URL', changeUrl);
    GM_registerMenuCommand('📊 Tiến độ', showProgress);

    // ── AUTO-RESUME ───────────────────────────────────────────
    if (isRunning && PLATFORM !== 'cambridge') {
        console.log(`[LingoPro] Resume, batch=${batchCount}`);
        setTimeout(processNextBatch, 2500);
    }

    // ── CAMBRIDGE AUTO-NAVIGATE ───────────────────────────────
    if (PLATFORM === 'cambridge' && isRunning) {
        const words = JSON.parse(harvWords);
        if (words.length > 0) {
            window.addEventListener('load', async () => {
                await sleep(2000);
                const data = extractCambridge(words[0]);
                if (data) await apiPost(`${CFG.BASE_URL}/api/bot/save-batch`, [data]);
                const rest = words.slice(1);
                GM_setValue('harv_words', JSON.stringify(rest));
                if (rest.length > 0) {
                    location.href = `https://dictionary.cambridge.org/dictionary/english/${rest[0]}`;
                } else {
                    GM_setValue('bot_running', false);
                    GM_notification({ title: 'LingoPro', text: 'Xong Cambridge harvest!', timeout: 5000 });
                }
            });
        }
    }

    // ── CONTROLS ─────────────────────────────────────────────
    function startBot() {
        if (isRunning) { alert('Đang chạy rồi!'); return; }
        GM_setValue('bot_running', true);
        GM_setValue('bot_count', 0);
        isRunning = true; batchCount = 0;
        processNextBatch();
    }

    function stopBot() {
        GM_setValue('bot_running', false);
        isRunning = false;
        setTitle('DỪNG');
    }

    function toggleDir() {
        isReverse = !isReverse;
        GM_setValue('bot_reverse', isReverse);
        location.reload();
    }

    function promptBulk() {
        const input = prompt('Dán danh sách từ (phẩy hoặc xuống dòng):');
        if (!input) return;
        const ws = input.split(/[\n,]+/).map(w => w.trim()).filter(Boolean);
        if (!ws.length) return;
        GM_setValue('harv_words', JSON.stringify(ws));
        GM_setValue('bot_running', true);
        location.href = `https://dictionary.cambridge.org/dictionary/english/${ws[0]}`;
    }

    function changeUrl() {
        const u = prompt('Server URL (production hoặc localhost:3000):', CFG.BASE_URL);
        if (u) { CFG.BASE_URL = u.replace(/\/$/, ''); GM_setValue('base_url', CFG.BASE_URL); }
    }

    async function showProgress() {
        try {
            const res = await apiGet(`${CFG.BASE_URL}/api/bot/next-batch?size=1`);
            const d = JSON.parse(res.responseText);
            alert(`✅ Đã lưu: ${d.saved}\n📦 Tổng danh sách: ${d.total}\n🕐 Còn lại: ${d.remaining}\n📍 Server: ${CFG.BASE_URL}`);
        } catch { alert('Không kết nối được server'); }
    }

    // ── CORE LOOP ─────────────────────────────────────────────
    async function processNextBatch() {
        if (!isRunning) return;

        if (batchCount >= CFG.MAX_BATCHES) {
            GM_setValue('bot_count', 0);
            await sleep(2000);
            location.reload();
            return;
        }

        setTitle('Lấy từ từ server...');
        try {
            const dir = isReverse ? 'desc' : 'asc';
            const res = await apiGet(`${CFG.BASE_URL}/api/bot/next-batch?size=${CFG.BATCH_SIZE}&direction=${dir}`);
            const data = JSON.parse(res.responseText);

            if (data.error)        { setTitle(`LỖI SERVER: ${data.error}`); return; }
            if (!data.words?.length) { setTitle('✅ XONG! Hết từ'); stopBot(); return; }

            await injectPrompt(data.words, data.remaining);
        } catch (e) {
            console.error('[LingoPro]', e);
            setTitle('LỖI KẾT NỐI → thử lại 5s...');
            setTimeout(processNextBatch, 5000);
        }
    }

    // ── INJECT PROMPT ─────────────────────────────────────────
    async function injectPrompt(words, remaining) {
        const prompt =
`SYSTEM ROLE: Bạn là cỗ máy xuất dữ liệu từ điển chuyên nghiệp. Trả về JSON ARRAY RAW, không markdown, không giải thích.

OUTPUT FORMAT:
[{"word":"từ gốc","familyWords":["word (part of speech)"],"pronunciations":[{"ipa":"/phiên âm/","audio_uk":"url hoặc rỗng","audio_us":"url hoặc rỗng"}],"results":[{"meanings":[{"pos":"noun|verb|adj|adv","definition":"định nghĩa tiếng Anh","example":"câu ví dụ tự nhiên","collocations":["cụm hay gặp 1","cụm hay gặp 2"]}]}]}]

Bắt đầu xử lý: ${words.join(', ')}`;

        const editor = await waitForEditor(platform.editors);
        if (!editor) { console.error('[LingoPro] Không tìm thấy editor!'); return; }

        injectText(editor, prompt);
        await sleep(800);
        platform.submit?.();

        setTitle(`AI đang xử lý... (còn ~${remaining} từ)`);
        await pollForResult(words);
    }

    function injectText(editor, text) {
        editor.focus();
        if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
            // React-safe value setter
            const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
            setter?.call(editor, text);
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // contenteditable
            document.execCommand('selectAll', false);
            document.execCommand('insertText', false, text);
        }
    }

    // ── POLL ─────────────────────────────────────────────────
    async function pollForResult(words) {
        const deadline = Date.now() + CFG.POLL_TIMEOUT_MS;

        while (Date.now() < deadline) {
            await sleep(CFG.POLL_INTERVAL_MS);

            // Quota check
            const lower = document.body.innerText.toLowerCase();
            if (platform.quota.some(s => lower.includes(s))) {
                setTitle('⚠️ HẾT QUOTA!');
                stopBot();
                GM_notification({ title: 'LingoPro', text: `Quota hết trên ${PLATFORM}. Mở tab AI khác!`, timeout: 10000 });
                return;
            }

            const result = extractJSON(document.body.innerText, words);
            if (result) {
                setTitle('Lưu vào DB...');
                try {
                    const saved = await apiPost(`${CFG.BASE_URL}/api/bot/save-batch`, result);
                    const r = JSON.parse(saved.responseText);
                    batchCount++;
                    GM_setValue('bot_count', batchCount);
                    console.log(`[LingoPro] Batch ${batchCount}: ${r.saved} từ đã lưu`);
                } catch (e) {
                    console.error('[LingoPro] Lỗi lưu:', e);
                }
                await sleep(CFG.BATCH_DELAY_MS);
                processNextBatch();
                return;
            }
        }

        // Timeout
        console.warn('[LingoPro] Timeout! Reload...');
        location.reload();
    }

    // ── JSON EXTRACTION (bracket-depth) ───────────────────────
    function extractJSON(text, expectedWords) {
        const candidates = [];
        let depth = 0, start = -1;

        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '[') {
                if (depth === 0) start = i;
                depth++;
            } else if (c === ']') {
                depth--;
                if (depth === 0 && start !== -1) {
                    try {
                        const parsed = JSON.parse(text.slice(start, i + 1));
                        if (Array.isArray(parsed) && parsed[0]?.word) {
                            const found = new Set(parsed.map(p => p.word?.toLowerCase().trim()));
                            const hits = expectedWords.filter(w => found.has(w.toLowerCase().trim())).length;
                            if (hits > 0) candidates.push({ data: parsed, hits });
                        }
                    } catch { /* continue */ }
                    start = -1;
                }
            }
        }

        if (!candidates.length) return null;
        candidates.sort((a, b) => b.hits - a.hits);
        return candidates[0].data;
    }

    // ── SUBMIT HANDLERS ───────────────────────────────────────
    function submitRunButton() {
        // AI Studio: tìm nút "Run"
        for (const el of document.querySelectorAll('button, div[role="button"]')) {
            if (el.offsetParent && /^(run|submit|▶)/i.test(el.textContent?.trim() || '')) {
                el.click(); return;
            }
        }
        // Shadow DOM fallback
        for (const el of document.querySelectorAll('*')) {
            if (el.shadowRoot) {
                const btn = el.shadowRoot.querySelector('button[aria-label*="run" i]');
                if (btn) { btn.click(); return; }
            }
        }
    }

    function submitEnter() {
        const sel = platform.editors[0];
        const el = document.querySelector(sel);
        if (!el) return;
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    }

    // ── CAMBRIDGE EXTRACTOR ───────────────────────────────────
    function extractCambridge(targetWord) {
        try {
            const word = document.querySelector('.headword .hw')?.innerText || targetWord;
            const pos = document.querySelector('.pos-header .pos')?.innerText || 'word';
            const ipa = document.querySelector('.pos-header .ipa')?.innerText || '';
            const defEl = document.querySelector('.def-block .def');
            if (!defEl) return null;
            const definition = defEl.innerText.replace(/\s+/g, ' ').trim();
            const example = document.querySelector('.def-block .examp .eg')?.innerText.trim() || '';
            return {
                word: word.toLowerCase(),
                pronunciations: [{ ipa }],
                results: [{ meanings: [{ pos, definition, example }] }],
            };
        } catch { return null; }
    }

    // ── UTILS ─────────────────────────────────────────────────
    async function waitForEditor(selectors, maxMs = 10000) {
        const t = Date.now();
        while (Date.now() - t < maxMs) {
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el?.offsetParent !== null) return el;
            }
            await sleep(500);
        }
        return null;
    }

    function setTitle(msg) {
        document.title = `[Bot ${batchCount}/${CFG.MAX_BATCHES}] ${msg}`;
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function apiGet(url) {
        return new Promise((res, rej) => GM_xmlhttpRequest({ method: 'GET', url, onload: res, onerror: rej }));
    }

    function apiPost(url, data) {
        return new Promise((res, rej) => GM_xmlhttpRequest({
            method: 'POST', url,
            data: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            onload: res, onerror: rej,
        }));
    }

})();
