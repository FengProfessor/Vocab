// ==UserScript==
// @name         LingoPro Grammar Enrich Bot (AI Studio / Gemini)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Làm giàu câu hỏi grammar lên 100 câu/bài bằng cách cào qua web AI Studio/Gemini (Né API Quota)
// @author       LingoPro
// @match        *://aistudio.google.com/*
// @match        *://gemini.google.com/*
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
        BASE_URL:         GM_getValue('base_url', 'http://localhost:3000'),
        BOT_SECRET:       GM_getValue('bot_secret', 'lingopro-secret-key-123'), // Cần trùng với BOT_SECRET trong .env.local
        BATCH_SIZE:       25,
        POLL_INTERVAL_MS: 1500,
        POLL_TIMEOUT_MS:  150_000,
        BATCH_DELAY_MS:   3000,
    };

    const isAI = location.hostname.includes('aistudio');
    const PLATFORM = isAI ? 'aistudio' : 'gemini';

    // selectors & submit mechanism
    const PLATFORMS = {
        aistudio: { 
            editors: ['textarea', 'div[contenteditable="true"]', 'div[role="textbox"]'], 
            submit: submitRunButton, 
            quota: ['reached your quota', 'rate limit', 'try again later', '429', 'exhausted'] 
        },
        gemini: { 
            editors: ['rich-textarea .ql-editor', 'rich-textarea p', 'div[contenteditable="true"]', 'textarea'], 
            submit: submitSendButton, 
            quota: ['rate limit', 'try again later', 'exhausted'] 
        }
    };

    const platform = PLATFORMS[PLATFORM];

    // STATE
    let isRunning  = GM_getValue('gbot_running', false);
    let activeLesson = GM_getValue('gbot_active_lesson', null);

    GM_registerMenuCommand(`🚀 ${isRunning ? 'ĐANG CHẠY' : 'BẮT ĐẦU CHẠY'} [${PLATFORM}]`, startBot);
    GM_registerMenuCommand('🛑 DỪNG', stopBot);
    GM_registerMenuCommand('🔧 Đổi Server URL', changeUrl);
    GM_registerMenuCommand('🔑 Đổi Secret Key', changeSecret);

    // Auto resume
    if (isRunning) {
        console.log('[GrammarBot] Resume active session...');
        setTimeout(processNext, 2500);
    }

    function startBot() {
        if (isRunning) { alert('Bot đang chạy rồi!'); return; }
        GM_setValue('gbot_running', true);
        isRunning = true;
        processNext();
    }

    function stopBot() {
        GM_setValue('gbot_running', false);
        isRunning = false;
        document.title = '[DỪNG] LingoPro Grammar';
    }

    function changeUrl() {
        const u = prompt('Server URL (production hoặc localhost:3000):', CFG.BASE_URL);
        if (u) { CFG.BASE_URL = u.replace(/\/$/, ''); GM_setValue('base_url', CFG.BASE_URL); }
    }

    function changeSecret() {
        const s = prompt('BOT_SECRET (Phải trùng với BOT_SECRET trong file .env.local):', CFG.BOT_SECRET);
        if (s) { CFG.BOT_SECRET = s; GM_setValue('bot_secret', CFG.BOT_SECRET); }
    }

    // Helpers for AI Studio / Gemini clicks
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
                b.click(); 
                return true; 
            }
        }
        for (const e of root.querySelectorAll('*')) { if (e.shadowRoot && deepClickRun(e.shadowRoot)) return true; }
        return false;
    }

    function submitRunButton() {
        deepClickRun(document.documentElement);
    }

    function submitSendButton() {
        const btn = deepQuery(document.documentElement, 'button.send-button')
            || deepQuery(document.documentElement, 'button[aria-label*="Send"]')
            || deepQuery(document.documentElement, 'button[aria-label*="Gửi"]');
        if (btn) btn.click();
    }

    // Main logic
    async function processNext() {
        if (!isRunning) return;

        document.title = '⏳ Đang gọi local API...';
        
        try {
            const res = await apiGet(`${CFG.BASE_URL}/api/bot/grammar/next`);
            const data = JSON.parse(res.responseText);

            if (!data.success) {
                alert(`Lỗi API: ${data.error}`);
                stopBot();
                return;
            }

            if (data.finished) {
                document.title = '✅ XONG!';
                stopBot();
                alert('Tất cả bài học grammar đã được làm giàu đủ 100 câu hỏi!');
                return;
            }

            GM_setValue('gbot_active_lesson', JSON.stringify(data));
            activeLesson = data;

            await injectPrompt(data);
        } catch (err) {
            console.error('[GrammarBot] Connection error:', err);
            document.title = '❌ Lỗi kết nối -> Thử lại trong 5s...';
            setTimeout(processNext, 5000);
        }
    }

    async function injectPrompt(lesson) {
        const currentCount = lesson.exercises.length;
        const need = 100 - currentCount;
        const currentBatchSize = Math.min(CFG.BATCH_SIZE, need);

        document.title = `📝 Soạn bài: ${lesson.slug} (còn ${lesson.remaining} bài)`;

        const existingBrief = lesson.exercises.map((e) => ({
            question: e.question || e.q || '',
            type: e.type
        }));

        const prompt = `SYSTEM ROLE: Bạn là giáo viên tiếng Anh chuyên nghiệp cho người Việt. Trả về JSON ARRAY RAW (không markdown, không giải thích).
NHIỆM VỤ: Tạo đúng ${currentBatchSize} bài tập ngữ pháp mới cho chủ đề: "${lesson.title}" (${lesson.title_vi}).
Level: ${lesson.level} (beginner = A1-A2, intermediate = B1-B2, advanced = C1-C2).

Ngữ cảnh lý thuyết:
- Định nghĩa: ${lesson.sections.definition || ''}
- Cách dùng: ${JSON.stringify(lesson.sections.usage || [])}
- Quy tắc: ${JSON.stringify(lesson.sections.rules || [])}

TRÁNH TRÙNG LẶP. Không tạo các câu trùng hoặc quá giống với các câu hiện có sau:
${JSON.stringify(existingBrief.slice(-35))}

Quy tắc tạo câu hỏi:
1. Tạo đúng ${currentBatchSize} câu hỏi.
2. Với mỗi câu hỏi:
   - "type" phải là một trong: "multiple_choice", "fill_blank", "error_correction".
   - In đậm từ khóa chính trong "question" bằng ** (ví dụ: "Choose the correct **preposition**: She sat ___ the table.").
   - "options" phải chứa đúng 4 lựa chọn khác nhau (mảng chuỗi).
   - "correct_answer" phải trùng khớp hoàn toàn với 1 trong 4 options.
   - "explanation" bằng tiếng Việt (giải thích tại sao đúng và tại sao lựa chọn khác sai, tối đa 3 câu).
   - "difficulty" là 1 (dễ), 2 (trung bình), hoặc 3 (khó).
3. Đảm bảo tỷ lệ đa dạng giữa các dạng câu hỏi.
4. Trả về định dạng: { "exercises": [ { "type": "...", "question": "...", "options": [...], "correct_answer": "...", "explanation": "...", "difficulty": 2 } ] }
`;

        const editor = await waitForEditor(platform.editors);
        if (!editor) {
            alert('Không tìm thấy ô nhập câu hỏi trên AI Studio / Gemini!');
            stopBot();
            return;
        }

        // Inject text
        editor.focus();
        if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
            editor.value = prompt;
        } else if (editor.isContentEditable) {
            document.execCommand('selectAll', false);
            document.execCommand('insertText', false, prompt);
        } else {
            editor.textContent = prompt;
        }
        editor.dispatchEvent(new Event('input', { bubbles: true }));

        await new Promise((r) => setTimeout(r, 1000));
        platform.submit();

        document.title = `🧠 AI đang xử lý... ${lesson.slug} (+${currentBatchSize})`;
        pollResult(lesson, currentBatchSize);
    }

    async function pollResult(lesson, batchSize) {
        const deadline = Date.now() + CFG.POLL_TIMEOUT_MS;

        while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, CFG.POLL_INTERVAL_MS));

            if (!isRunning) return;

            // Kiểm tra quota
            const lowerText = document.body.innerText.toLowerCase();
            if (platform.quota.some(q => lowerText.includes(q))) {
                document.title = '⚠️ HẾT QUOTA!';
                stopBot();
                GM_notification({ title: 'LingoPro', text: 'Hết quota trình duyệt! Vui lòng đổi tài khoản Google.', timeout: 10000 });
                return;
            }

            const json = findJSON(document.body.innerText);
            if (json) {
                document.title = '💾 Lưu câu hỏi vào database...';
                try {
                    const saveRes = await apiPost(`${CFG.BASE_URL}/api/bot/grammar/save`, {
                        lessonId: lesson.lessonId,
                        exercises: json
                    });
                    const resultData = JSON.parse(saveRes.responseText);
                    if (resultData.success) {
                        console.log(`[GrammarBot] Saved ${resultData.added} new questions. Total: ${resultData.total}/100.`);
                    } else {
                        console.error('[GrammarBot] Save failed:', resultData.error);
                    }
                } catch (saveErr) {
                    console.error('[GrammarBot] Save connection error:', saveErr);
                }
                
                await new Promise((r) => setTimeout(r, CFG.BATCH_DELAY_MS));
                location.reload(); // Reload trang để làm sạch session chat
                return;
            }
        }

        // Timeout
        console.warn('[GrammarBot] Timeout! Reloading...');
        location.reload();
    }

    function findJSON(text) {
        let start = 0; const found = [];
        while ((start = text.indexOf('{', start)) !== -1) {
            let end = start;
            let bracketCount = 1;
            for (let i = start + 1; i < text.length; i++) {
                if (text[i] === '{') bracketCount++;
                else if (text[i] === '}') {
                    bracketCount--;
                    if (bracketCount === 0) {
                        end = i;
                        break;
                    }
                }
            }
            if (bracketCount === 0 && end > start) {
                try {
                    const subStr = text.substring(start, end + 1);
                    const parsed = JSON.parse(subStr);
                    if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
                        found.push(parsed.exercises);
                        break;
                    }
                } catch (e) { /* keep scanning */ }
            }
            start++;
        }
        if (!found.length) return null;
        return found[found.length - 1];
    }

    async function waitForEditor(selectors) {
        for (let i = 0; i < 20; i++) {
            for (const sel of selectors) {
                const ed = deepQuery(document.documentElement, sel);
                if (ed) return ed;
            }
            await new Promise((r) => setTimeout(r, 500));
        }
        return null;
    }

    // ── HTTP HELPERS ──────────────────────────────────────────
    function apiGet(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: { 'Authorization': `Bearer ${CFG.BOT_SECRET}` },
                onload: (res) => resolve(res),
                onerror: (err) => reject(err)
            });
        });
    }

    function apiPost(url, data) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: url,
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CFG.BOT_SECRET}`
                },
                onload: (res) => resolve(res),
                onerror: (err) => reject(err)
            });
        });
    }
})();
