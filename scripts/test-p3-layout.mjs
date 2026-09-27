import puppeteer from 'puppeteer';
import path from 'node:path';

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 450, height: 800, deviceScaleFactor: 2.4 });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      body { width: 450px; height: 800px; background: #0b1220; color: #f8fafc; overflow: hidden; position: relative; }
      
      /* Safe zone overlay (red dashed border for preview) */
      .safezone-guide { position: absolute; left: 20px; top: 60px; right: 55px; bottom: 130px; border: 1.5px dashed rgba(239, 68, 68, 0.5); pointer-events: none; }
      .safezone-label { position: absolute; right: 60px; bottom: 135px; font-size: 10px; color: #ef4444; font-family: monospace; }
      
      /* Header */
      .header { position: absolute; top: 22px; left: 24px; right: 55px; display: flex; justify-content: space-between; align-items: center; }
      .badge-part { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); font-size: 11px; font-weight: 700; color: #60a5fa; letter-spacing: 0.04em; text-transform: uppercase; }
      .brand { font-size: 16px; font-weight: 800; color: #4ade80; text-shadow: 0 0 12px rgba(74, 222, 128, 0.6); }
      
      /* Audio / Status bar */
      .audio-bar { position: absolute; top: 62px; left: 24px; right: 55px; display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border-radius: 12px; background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(148, 163, 184, 0.18); }
      .wave-container { display: flex; align-items: center; gap: 3px; height: 16px; }
      .wave-bar { width: 3px; height: 100%; border-radius: 2px; background: #4ade80; }
      .audio-status { font-size: 11.5px; font-weight: 600; color: #cbd5e1; }
      .timer { font-family: monospace; font-size: 13px; font-weight: 700; color: #4ade80; }
      
      /* 3 Questions Container */
      .questions-container { position: absolute; top: 106px; left: 24px; right: 55px; display: flex; flex-direction: column; gap: 8px; }
      
      .question-card { background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 13px; padding: 8px 11px; }
      .question-card.active { border-color: #38bdf8; box-shadow: 0 0 16px rgba(56, 189, 248, 0.25); background: rgba(30, 41, 59, 0.95); }
      
      .q-header { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 5px; }
      .q-num { flex-shrink: 0; width: 22px; height: 22px; border-radius: 6px; background: rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 800; color: #94a3b8; }
      .question-card.active .q-num { background: #0284c7; color: #fff; }
      .q-prompt { font-size: 12px; font-weight: 650; line-height: 1.3; color: #f1f5f9; }
      
      .options-grid { display: flex; flex-direction: column; gap: 3.5px; padding-left: 28px; }
      .opt-row { display: flex; align-items: center; gap: 6px; padding: 3px 7px; border-radius: 6px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(148, 163, 184, 0.12); font-size: 10.5px; color: #cbd5e1; }
      .opt-key { font-weight: 750; color: #94a3b8; font-size: 10px; width: 12px; }
      .opt-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      
      .opt-row.correct { background: #15803d; border-color: #4ade80; color: #ffffff; font-weight: 700; box-shadow: 0 0 8px rgba(74, 222, 128, 0.4); }
      .opt-row.correct .opt-key { color: #ffffff; }
    </style>
  </head>
  <body>
    <div class="safezone-guide"></div>
    <div class="safezone-label">TikTok Safe Zone</div>
    
    <div class="header">
      <div class="badge-part">🎧 Part 3 · 3 Câu liên tiếp</div>
      <div class="brand">LingoPro</div>
    </div>
    
    <div class="audio-bar">
      <div class="wave-container">
        <div class="wave-bar" style="height: 60%"></div>
        <div class="wave-bar" style="height: 100%"></div>
        <div class="wave-bar" style="height: 40%"></div>
        <div class="wave-bar" style="height: 80%"></div>
      </div>
      <div class="audio-status">Đang phát đoạn hội thoại...</div>
      <div class="timer">00:28</div>
    </div>
    
    <div class="questions-container">
      <!-- Q1 -->
      <div class="question-card active">
        <div class="q-header">
          <div class="q-num">Q1</div>
          <div class="q-prompt">Why is the man calling?</div>
        </div>
        <div class="options-grid">
          <div class="opt-row"><span class="opt-key">A</span><span class="opt-text">To request a payment</span></div>
          <div class="opt-row"><span class="opt-key">B</span><span class="opt-text">To confirm an order</span></div>
          <div class="opt-row correct"><span class="opt-key">C</span><span class="opt-text">To offer a room upgrade ✓</span></div>
          <div class="opt-row"><span class="opt-key">D</span><span class="opt-text">To advertise a product</span></div>
        </div>
      </div>
      
      <!-- Q2 -->
      <div class="question-card">
        <div class="q-header">
          <div class="q-num">Q2</div>
          <div class="q-prompt">What does the woman inquire about?</div>
        </div>
        <div class="options-grid">
          <div class="opt-row"><span class="opt-key">A</span><span class="opt-text">An additional fee</span></div>
          <div class="opt-row"><span class="opt-key">B</span><span class="opt-text">Driving directions</span></div>
          <div class="opt-row"><span class="opt-key">C</span><span class="opt-text">Dinner recommendations</span></div>
          <div class="opt-row"><span class="opt-key">D</span><span class="opt-text">Conference facilities</span></div>
        </div>
      </div>
      
      <!-- Q3 -->
      <div class="question-card">
        <div class="q-header">
          <div class="q-num">Q3</div>
          <div class="q-prompt">What does the woman say she will do?</div>
        </div>
        <div class="options-grid">
          <div class="opt-row"><span class="opt-key">A</span><span class="opt-text">Contact a travel agent</span></div>
          <div class="opt-row"><span class="opt-key">B</span><span class="opt-text">Compare options</span></div>
          <div class="opt-row"><span class="opt-key">C</span><span class="opt-text">Check into a hotel</span></div>
          <div class="opt-row"><span class="opt-key">D</span><span class="opt-text">Post a review</span></div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: path.resolve('out/p3_test_stacked_layout.png') });

  const transcriptHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      body { width: 450px; height: 800px; background: #0b1220; color: #f8fafc; overflow: hidden; position: relative; }
      
      .safezone-guide { position: absolute; left: 20px; top: 60px; right: 55px; bottom: 130px; border: 1.5px dashed rgba(239, 68, 68, 0.5); pointer-events: none; }
      .safezone-label { position: absolute; right: 60px; bottom: 135px; font-size: 10px; color: #ef4444; font-family: monospace; }
      
      .header { position: absolute; top: 22px; left: 24px; right: 55px; display: flex; justify-content: space-between; align-items: center; }
      .badge-part { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); font-size: 11px; font-weight: 700; color: #60a5fa; letter-spacing: 0.04em; text-transform: uppercase; }
      .brand { font-size: 16px; font-weight: 800; color: #4ade80; text-shadow: 0 0 12px rgba(74, 222, 128, 0.6); }
      
      .transcript-container { position: absolute; top: 62px; left: 24px; right: 55px; display: flex; flex-direction: column; gap: 10px; }
      
      .card { background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 14px; padding: 14px 16px; }
      .card-title { font-size: 14px; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
      .dialogue { font-size: 11.5px; line-height: 1.55; color: #cbd5e1; }
      .speaker { font-weight: 750; color: #93c5fd; }
      
      .hl-q1 { background: rgba(34, 197, 94, 0.2); color: #86efac; padding: 1px 4px; border-radius: 4px; border-bottom: 1.5px solid #22c55e; font-weight: 650; }
      .hl-q2 { background: rgba(234, 179, 8, 0.2); color: #fde047; padding: 1px 4px; border-radius: 4px; border-bottom: 1.5px solid #eab308; font-weight: 650; }
      .hl-q3 { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; padding: 1px 4px; border-radius: 4px; border-bottom: 1.5px solid #a855f7; font-weight: 650; }
      
      .badge-clue { font-size: 9.5px; font-weight: 800; padding: 1px 4px; border-radius: 3px; vertical-align: baseline; margin-right: 2px; }
      .clue-1 { background: #15803d; color: #fff; }
      .clue-2 { background: #a16207; color: #fff; }
      .clue-3 { background: #7e22ce; color: #fff; }
      
      .summary-box { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 10px; padding: 8px 12px; font-size: 11px; line-height: 1.45; color: #94a3b8; }
      .summary-box strong { color: #f1f5f9; }
    </style>
  </head>
  <body>
    <div class="safezone-guide"></div>
    <div class="safezone-label">TikTok Safe Zone</div>
    
    <div class="header">
      <div class="badge-part">📜 Lời thoại & Bằng chứng</div>
      <div class="brand">LingoPro</div>
    </div>
    
    <div class="transcript-container">
      <div class="card">
        <div class="card-title">🎧 Transcript Đoạn Hội Thoại</div>
        <div class="dialogue">
          <p style="margin-bottom: 6px;"><span class="speaker">M:</span> Hello, Ms. Turner. Michael calling from Yorkshire Seaside Hotel. You wanted to know if a seaside room became available. <span class="hl-q1"><span class="badge-clue clue-1">Q1</span>Someone just canceled, so if you'd like to upgrade, you may.</span></p>
          <p style="margin-bottom: 6px;"><span class="speaker">W:</span> Oh, great! <span class="hl-q2"><span class="badge-clue clue-2">Q2</span>How much more is the upgraded room compared to standard?</span></p>
          <p style="margin-bottom: 6px;"><span class="speaker">M:</span> It's an extra $50 a night with a larger bed and hot tub. Check our website for details.</p>
          <p><span class="speaker">W:</span> OK. <span class="hl-q3"><span class="badge-clue clue-3">Q3</span>I'll look at your website and then call you back with my decision.</span></p>
        </div>
      </div>
      
      <div class="summary-box">
        <strong>💡 Bí kíp Part 3:</strong> Vị trí đáp án thường xuất hiện tuần tự theo mạch hội thoại (Đầu ➔ Giữa ➔ Cuối). Hãy đọc trước câu hỏi để định vị manh mối!
      </div>
    </div>
  </body>
  </html>
  `;
  
  await page.setContent(transcriptHtml);
  await page.screenshot({ path: path.resolve('out/p3_test_transcript_layout.png') });
  await browser.close();
  console.log('Saved out/p3_test_stacked_layout.png and out/p3_test_transcript_layout.png');
}

main().catch(console.error);
