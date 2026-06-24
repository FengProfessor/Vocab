// ==UserScript==
// @name         LingoPro Collection Enrich Bot (aistudio + gemini)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Enrich list cụm tiếng Anh -> JSON {w, vi, example} qua aistudio/gemini (FREE, né API quota). Paste list -> chạy -> tải JSON. Dùng cho collections.ts / DB pack.
// @author       LingoPro
// @match        *://aistudio.google.com/*
// @match        *://gemini.google.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_download
// ==/UserScript==

(function () {
    'use strict';
    if (window.top !== window.self) return;

    const CONFIG = { BATCH_SIZE: 25 };
    const isAI = location.hostname.includes('aistudio');
    const SS = sessionStorage;

    let queue = JSON.parse(SS.getItem('ce_queue') || '[]');     // các cụm chưa enrich
    let results = JSON.parse(SS.getItem('ce_results') || '[]');  // {w, vi, example}
    let running = SS.getItem('ce_running') === 'true';

    GM_registerMenuCommand('📋 1. DÁN DANH SÁCH (mỗi dòng 1 cụm)', pasteList);
    GM_registerMenuCommand(`🚀 2. CHẠY ENRICH (còn ${queue.length})`, startBot);
    GM_registerMenuCommand(`💾 3. TẢI JSON (${results.length} cụm)`, dumpJson);
    GM_registerMenuCommand('🛑 DỪNG / RESET', resetBot);

    function pasteList() {
        const raw = prompt('Dán danh sách cụm tiếng Anh (mỗi dòng 1 cụm). Sẽ enrich -> {w, vi, example}:', '');
        if (!raw) return;
        queue = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        results = [];
        SS.setItem('ce_queue', JSON.stringify(queue));
        SS.setItem('ce_results', JSON.stringify(results));
        alert(`Đã nạp ${queue.length} cụm. Bấm "2. CHẠY ENRICH".`);
        location.reload();
    }

    function startBot() {
        if (!queue.length) { alert('Queue rỗng — dán danh sách trước (mục 1).'); return; }
        running = true; SS.setItem('ce_running', 'true');
        processNext();
    }
    function resetBot() {
        running = false;
        SS.removeItem('ce_running'); SS.removeItem('ce_queue'); SS.removeItem('ce_results');
        location.reload();
    }
    function dumpJson() {
        if (!results.length) { alert('Chưa có kết quả.'); return; }
        const json = JSON.stringify(results, null, 2);
        try { GM_setClipboard(json); } catch (e) { /* ignore */ }
        console.log('[CE] JSON kết quả:\n' + json);
        try {
            const blob = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
            GM_download({ url: blob, name: `collection-enriched-${Date.now()}.json` });
        } catch (e) { alert('Đã copy JSON vào clipboard (xem Console nếu cần).'); }
    }
    function status(msg) { document.title = `[CE ${msg}] (${results.length} xong / ${queue.length} còn)`; }

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
            if (b.offsetParent !== null && b.innerText && (b.innerText.includes('Run') || b.innerText.includes('Submit'))) { b.click(); return true; }
        }
        for (const e of root.querySelectorAll('*')) { if (e.shadowRoot && deepClickRun(e.shadowRoot)) return true; }
        return false;
    }

    async function processNext() {
        if (!running) return;
        if (!queue.length) { status('XONG! Bấm "3. TẢI JSON"'); running = false; SS.removeItem('ce_running'); alert('Enrich xong! Bấm "3. TẢI JSON".'); return; }
        const batch = queue.slice(0, CONFIG.BATCH_SIZE);
        await runPrompt(batch);
    }

    async function runPrompt(words) {
        const prompt = `SYSTEM ROLE: Máy xuất dữ liệu từ điển Anh-Việt cho ứng dụng học từ. Trả về JSON ARRAY RAW (không markdown, không giải thích).
NHIỆM VỤ: Với mỗi cụm/từ tiếng Anh, cho: nghĩa tiếng Việt NGẮN (có dấu) và 1 câu ví dụ tiếng Anh tự nhiên, ngắn (6-10 từ).
OUTPUT FORMAT: [ { "w": "english phrase", "vi": "nghĩa tiếng Việt", "example": "Short natural English example." } ]
QUY TẮC: vi súc tích, đúng nghĩa thông dụng nhất; example tự nhiên, đúng ngữ pháp, KHÔNG pha tiếng Việt; giữ nguyên "w" như đầu vào.
XỬ LÝ: ` + words.join(', ');

        const inSelectors = isAI
            ? ['textarea', 'div[contenteditable="true"]', 'div[role="textbox"]']
            : ['rich-textarea .ql-editor', 'rich-textarea p', 'div[contenteditable="true"]', 'textarea'];
        let editor = null;
        for (let i = 0; i < 20 && !editor; i++) {
            for (const sel of inSelectors) { editor = deepQuery(document.documentElement, sel); if (editor) break; }
            if (!editor) await new Promise((r) => setTimeout(r, 500));
        }
        if (!editor) { status('NO INPUT'); console.error('[CE] Không thấy ô nhập!'); return; }

        editor.focus();
        if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') editor.value = prompt;
        else if (editor.isContentEditable) document.execCommand('insertText', false, prompt);
        else editor.textContent = prompt;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 1000));

        if (isAI) deepClickRun(document.documentElement);
        else {
            const btn = deepQuery(document.documentElement, 'button.send-button')
                || deepQuery(document.documentElement, 'button[aria-label*="Send"]')
                || deepQuery(document.documentElement, 'button[aria-label*="Gửi"]');
            if (btn) btn.click();
        }
        status('Đang rình AI...');
        pollResult(words);
    }

    function findJSON(text, wordsLower) {
        let start = 0; const found = [];
        while ((start = text.indexOf('[', start)) !== -1) {
            let end = start;
            while ((end = text.indexOf(']', end + 1)) !== -1) {
                try {
                    const parsed = JSON.parse(text.substring(start, end + 1));
                    if (Array.isArray(parsed) && parsed.length && parsed[0].w && parsed[0].vi) { found.push(parsed); break; }
                } catch (e) { /* keep scanning */ }
            }
            start++;
        }
        if (!found.length) return null;
        const latest = found[found.length - 1];
        const hit = latest.some((it) => it.w && wordsLower.includes(it.w.toLowerCase().trim()));
        return hit ? latest : null;
    }

    async function pollResult(words) {
        const wordsLower = words.map((w) => w.toLowerCase().trim());
        const t0 = Date.now();
        while (Date.now() - t0 < 120000) {
            await new Promise((r) => setTimeout(r, 1000));
            const lower = document.body.innerText.toLowerCase();
            if (lower.includes('reached your quota') || lower.includes('rate limit') || lower.includes('try again later')) {
                status('HẾT QUOTA — đổi nick/tab'); running = false; SS.removeItem('ce_running'); return;
            }
            const json = findJSON(document.body.innerText, wordsLower);
            if (json) {
                // gộp kết quả, bỏ batch khỏi queue
                const got = new Set(json.map((it) => it.w.toLowerCase().trim()));
                results = results.concat(json);
                queue = queue.filter((w) => !got.has(w.toLowerCase().trim()));
                SS.setItem('ce_results', JSON.stringify(results));
                SS.setItem('ce_queue', JSON.stringify(queue));
                console.log(`[CE] +${json.length} cụm. Còn ${queue.length}.`);
                await new Promise((r) => setTimeout(r, 2000));
                location.reload(); // reload cho prompt mới sạch
                return;
            }
        }
        location.reload();
    }

    // auto-resume sau reload
    if (running && queue.length) setTimeout(processNext, 2500);
})();
