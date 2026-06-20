// ==UserScript==
// @name         LingoPro Word-Family Bot (aistudio + gemini) V2.3
// @namespace    http://tampermonkey.net/
// @version      2.3.0
// @description  Cào HỌ TỪ VỰNG (word family + nghĩa Việt) qua aistudio.google.com VÀ gemini.google.com. Mở nhiều tab/nick song song. Menu Tampermonkey điều khiển.
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
        // Nếu server set BOT_SECRET, điền vào đây (gửi qua ?secret=). Để '' nếu chạy local không secret.
        SECRET: '',
        BATCH_SIZE: 30,
        MAX_BATCHES: 30, // reload trang sau N batch (tránh aistudio phình DOM)
        SHARDS: 4, // tổng số tab/nick chạy song song
    };

    const isAI = location.hostname.includes('aistudio'); // aistudio vs gemini consumer

    // Mỗi tab 1 shard (0..SHARDS-1). Đặt qua menu, lưu sessionStorage.
    let shard = parseInt(sessionStorage.getItem('wf_bot_shard') || '0', 10);

    const q = (p) => CONFIG.SECRET ? `${p}${p.includes('?') ? '&' : '?'}secret=${encodeURIComponent(CONFIG.SECRET)}` : p;

    let isRunning = sessionStorage.getItem('wf_bot_running') === 'true';
    let batchCount = parseInt(sessionStorage.getItem('wf_bot_count') || '0', 10);

    GM_registerMenuCommand(`🚀 ${isRunning ? 'ĐANG CHẠY...' : 'BẮT ĐẦU CÀO FAMILY'}`, startBot);
    GM_registerMenuCommand('🛑 DỪNG', stopBot);
    GM_registerMenuCommand(`🔢 ĐẶT SHARD (hiện: ${shard}/${CONFIG.SHARDS - 1})`, () => {
        const v = prompt(`Tab này là shard số mấy? (0 đến ${CONFIG.SHARDS - 1})`, String(shard));
        if (v === null) return;
        const n = parseInt(v, 10);
        if (Number.isNaN(n) || n < 0 || n >= CONFIG.SHARDS) { alert('Số không hợp lệ'); return; }
        shard = n;
        sessionStorage.setItem('wf_bot_shard', String(n));
        location.reload();
    });

    function startBot() {
        if (isRunning) return;
        isRunning = true; batchCount = 0;
        sessionStorage.setItem('wf_bot_running', 'true');
        sessionStorage.setItem('wf_bot_count', '0');
        processNextBatch();
    }
    function stopBot() {
        isRunning = false;
        sessionStorage.removeItem('wf_bot_running');
        location.reload();
    }
    function status(msg, left = '') {
        document.title = `[WF#${shard} ${msg}] (${batchCount}/${CONFIG.MAX_BATCHES})${left ? ' - Còn ' + left : ''}`;
    }

    function deepQuery(root, sel) {
        const el = root.querySelector(sel);
        if (el && el.offsetParent !== null) return el;
        for (const e of root.querySelectorAll('*')) {
            if (e.shadowRoot) { const f = deepQuery(e.shadowRoot, sel); if (f) return f; }
        }
        return null;
    }
    function deepClickRun(root) {
        for (const b of root.querySelectorAll('button, div[role="button"]')) {
            if (b.offsetParent !== null && b.innerText && (b.innerText.includes('Run') || b.innerText.includes('Submit'))) {
                b.click(); return true;
            }
        }
        for (const e of root.querySelectorAll('*')) {
            if (e.shadowRoot && deepClickRun(e.shadowRoot)) return true;
        }
        return false;
    }

    function processNextBatch() {
        if (!isRunning) return;
        if (batchCount >= CONFIG.MAX_BATCHES) {
            sessionStorage.setItem('wf_bot_count', '0');
            setTimeout(() => location.reload(), 2000);
            return;
        }
        GM_xmlhttpRequest({
            method: 'GET',
            url: q(`${CONFIG.BASE_URL}/api/bot/family-batch?size=${CONFIG.BATCH_SIZE}&shard=${shard}&shards=${CONFIG.SHARDS}`),
            onload: async (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    if (!data.success) { status('LỖI SERVER'); console.error('[WF]', data.error); return; }
                    await runPrompt(data.words, data.remaining);
                } catch (e) { console.error('[WF] parse:', e.message); status('LỖI PARSE'); }
            },
            onerror: () => { status('MẤT KẾT NỐI'); setTimeout(processNextBatch, 5000); },
        });
    }

    async function runPrompt(words, remaining) {
        if (!words || words.length === 0) { status('XONG!'); console.log('[WF] Hết từ.'); return; }
        console.log(`[WF] Cào ${words.length} từ. Còn ${remaining}.`);

        const prompt = `SYSTEM ROLE: Bạn là máy xuất dữ liệu từ điển Anh-Việt. Trả về JSON ARRAY RAW (không markdown, không giải thích).
NHIỆM VỤ: Với mỗi từ tiếng Anh, liệt kê WORD FAMILY — các dạng phái sinh THỰC SỰ tồn tại (noun/verb/adjective/adverb), GỒM cả từ gốc.
OUTPUT FORMAT: [ { "word": "từ gốc", "familyWords": [ { "word": "dạng phái sinh (lowercase)", "pos": "noun|verb|adjective|adverb", "meaning": "nghĩa tiếng Việt NGẮN GỌN của dạng đó" } ] } ]
QUY TẮC: chỉ dạng có thật & phổ biến (tối đa 6/từ). meaning là nghĩa Việt của CHÍNH dạng phái sinh đó. Nếu từ không có họ phái sinh, trả familyWords: [].
XỬ LÝ: ` + words.join(', ');

        const inSelectors = isAI
            ? ['textarea', 'div[contenteditable="true"]', 'div[role="textbox"]']
            : ['rich-textarea .ql-editor', 'rich-textarea p', 'div[contenteditable="true"]', 'textarea'];
        let editor = null;
        for (let i = 0; i < 20 && !editor; i++) {
            for (const sel of inSelectors) {
                editor = deepQuery(document.documentElement, sel);
                if (editor) break;
            }
            if (!editor) await new Promise(r => setTimeout(r, 500));
        }
        if (!editor) { console.error('[WF] Không thấy ô nhập!'); status('NO INPUT'); return; }

        editor.focus();
        if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') editor.value = prompt;
        else if (editor.isContentEditable) document.execCommand('insertText', false, prompt);
        else editor.textContent = prompt;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 1000));

        if (isAI) {
            deepClickRun(document.documentElement);
        } else {
            // gemini consumer: nút gửi
            const btn = deepQuery(document.documentElement, 'button.send-button')
                || deepQuery(document.documentElement, 'button[aria-label*="Send"]')
                || deepQuery(document.documentElement, 'button[aria-label*="Gửi"]');
            if (btn) btn.click();
            else console.error('[WF] Không thấy nút gửi gemini!');
        }
        status('Đang rình AI...', remaining);
        pollResult(words);
    }

    function findResultJSON(text, currentWords) {
        const matches = [];
        let start = 0;
        while ((start = text.indexOf('[', start)) !== -1) {
            let end = start;
            while ((end = text.indexOf(']', end + 1)) !== -1) {
                try {
                    const parsed = JSON.parse(text.substring(start, end + 1));
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].word && parsed[0].familyWords) {
                        matches.push(parsed); break;
                    }
                } catch (e) { /* keep scanning */ }
            }
            start++;
        }
        if (matches.length === 0) return null;
        const latest = matches[matches.length - 1];
        const expected = currentWords.map(w => w.toLowerCase().trim());
        const hit = latest.some(it => it.word && expected.includes(it.word.toLowerCase().trim()));
        return hit ? latest : null;
    }

    async function pollResult(currentWords) {
        const t0 = Date.now();
        while (Date.now() - t0 < 120000) {
            await new Promise(r => setTimeout(r, 1000));
            const lower = document.body.innerText.toLowerCase();
            if (lower.includes('reached your quota') || lower.includes('rate limit') || lower.includes('try again later')) {
                status('HẾT QUOTA!'); isRunning = false; sessionStorage.removeItem('wf_bot_running'); return;
            }
            const json = findResultJSON(document.body.innerText, currentWords);
            if (json) {
                console.log('[WF] Có kết quả, đang lưu...');
                await new Promise(resolve => GM_xmlhttpRequest({
                    method: 'POST',
                    url: q(`${CONFIG.BASE_URL}/api/bot/family-save`),
                    data: JSON.stringify(json),
                    headers: { 'Content-Type': 'application/json' },
                    onload: () => resolve(),
                    onerror: () => resolve(),
                }));
                batchCount++;
                sessionStorage.setItem('wf_bot_count', String(batchCount));
                await new Promise(r => setTimeout(r, 2000));
                processNextBatch();
                return;
            }
        }
        location.reload();
    }

    if (isRunning) setTimeout(processNextBatch, 2000);
})();
