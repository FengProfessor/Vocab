import puppeteer from 'puppeteer';

async function testGraphicLayout() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 450, height: 800, deviceScaleFactor: 2.4 });

  const imageUrl = 'https://storage.googleapis.com/estudyme/legacy-data/kstoeic/images/873890_1562638446607.png';
  const questionsData = [
    {
      num: 1,
      prompt: 'What does the woman have on Friday?',
      options: [
        { key: 'A', text: 'A dinner meeting' },
        { key: 'B', text: 'A seminar' },
        { key: 'C', text: 'A meeting' },
        { key: 'D', text: 'A work party' }
      ]
    },
    {
      num: 2,
      prompt: 'Look at the graphic. How much does the woman pay for the furniture?',
      options: [
        { key: 'A', text: '$165' },
        { key: 'B', text: '$195' },
        { key: 'C', text: '$307' },
        { key: 'D', text: '$614' }
      ]
    },
    {
      num: 3,
      prompt: 'What does the man say he will do?',
      options: [
        { key: 'A', text: 'Arrange free delivery' },
        { key: 'B', text: 'Deliver the furniture in the evening' },
        { key: 'C', text: 'Send a confirmation' },
        { key: 'D', text: 'Deliver the table himself' }
      ]
    }
  ];

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 450px; height: 800px; overflow: hidden;
          background: #0b1220;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f8fafc;
        }
        .safe-zone {
          position: absolute;
          top: 20px; left: 24px; right: 55px; bottom: 130px;
          border: 1px dashed rgba(239, 68, 68, 0.4);
          pointer-events: none;
          z-index: 9999;
        }
        .safe-tag {
          position: absolute; bottom: 4px; right: 6px;
          font-size: 10px; color: rgba(239, 68, 68, 0.7);
        }
      </style>
    </head>
    <body>
      <div class="safe-zone"><span class="safe-tag">TikTok Safe Zone</span></div>
      <div id="stage"></div>
    </body>
    </html>
  `);

  await page.evaluate(({ imgUrl, qData }) => {
    const stage = document.getElementById('stage');
    stage.style.position = 'fixed';
    stage.style.inset = '0';
    stage.style.background = '#0b1220';

    // 1. Top Header
    const header = document.createElement('div');
    header.style.position = 'absolute';
    header.style.top = '22px';
    header.style.left = '24px';
    header.style.right = '55px';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';

    const badge = document.createElement('div');
    badge.textContent = '🎧 PART 3 · GRAPHIC';
    badge.style.fontSize = '11.5px';
    badge.style.fontWeight = '750';
    badge.style.padding = '4px 10px';
    badge.style.borderRadius = '999px';
    badge.style.background = 'rgba(56, 189, 248, 0.15)';
    badge.style.border = '1px solid rgba(56, 189, 248, 0.35)';
    badge.style.color = '#7dd3fc';

    const brand = document.createElement('div');
    brand.textContent = 'LingoPro';
    brand.style.fontSize = '16px';
    brand.style.fontWeight = '800';
    brand.style.color = '#4ade80';

    header.append(badge, brand);

    // 2. Audio Bar (compact)
    const audioBar = document.createElement('div');
    audioBar.id = 'p3-audio-bar';
    audioBar.style.position = 'absolute';
    audioBar.style.top = '52px';
    audioBar.style.left = '24px';
    audioBar.style.right = '55px';
    audioBar.style.height = '30px';
    audioBar.style.display = 'flex';
    audioBar.style.alignItems = 'center';
    audioBar.style.justifyContent = 'space-between';
    audioBar.style.padding = '5px 10px';
    audioBar.style.borderRadius = '10px';
    audioBar.style.background = 'rgba(30, 41, 59, 0.85)';
    audioBar.style.border = '1px solid rgba(148, 163, 184, 0.18)';

    const waveBox = document.createElement('div');
    waveBox.style.display = 'flex';
    waveBox.style.alignItems = 'center';
    waveBox.style.gap = '2.5px';
    waveBox.style.height = '14px';
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('div');
      b.style.width = '2.5px';
      b.style.height = `${[50, 100, 40, 80][i]}%`;
      b.style.borderRadius = '2px';
      b.style.background = '#4ade80';
      waveBox.appendChild(b);
    }

    const statusText = document.createElement('div');
    statusText.id = 'p3-status-text';
    statusText.textContent = 'Đang nghe hội thoại & Quan sát bảng...';
    statusText.style.fontSize = '11px';
    statusText.style.fontWeight = '600';
    statusText.style.color = '#cbd5e1';

    const timer = document.createElement('div');
    timer.id = 'p3-timer';
    timer.textContent = '00:45';
    timer.style.fontFamily = 'monospace';
    timer.style.fontSize = '12px';
    timer.style.fontWeight = '700';
    timer.style.color = '#4ade80';

    audioBar.append(waveBox, statusText, timer);

    // 3. Graphic Card
    let topOffset = 88;
    if (imgUrl) {
      const imgCard = document.createElement('div');
      imgCard.id = 'p3-graphic-card';
      imgCard.style.position = 'absolute';
      imgCard.style.top = '88px';
      imgCard.style.left = '24px';
      imgCard.style.right = '55px';
      imgCard.style.height = '150px';
      imgCard.style.background = 'rgba(15, 23, 42, 0.95)';
      imgCard.style.border = '1px solid rgba(148, 163, 184, 0.25)';
      imgCard.style.borderRadius = '12px';
      imgCard.style.padding = '5px 8px';
      imgCard.style.display = 'flex';
      imgCard.style.alignItems = 'center';
      imgCard.style.justifyContent = 'center';
      imgCard.style.overflow = 'hidden';

      const img = document.createElement('img');
      img.src = imgUrl;
      img.style.maxHeight = '100%';
      img.style.maxWidth = '100%';
      img.style.objectFit = 'contain';
      img.style.borderRadius = '6px';
      img.style.background = '#ffffff';

      imgCard.appendChild(img);
      stage.appendChild(imgCard);
      topOffset = 244;
    }

    // 4. Questions Container
    const qContainer = document.createElement('div');
    qContainer.id = 'p3-questions-container';
    qContainer.style.position = 'absolute';
    qContainer.style.top = `${topOffset}px`;
    qContainer.style.left = '24px';
    qContainer.style.right = '55px';
    qContainer.style.display = 'flex';
    qContainer.style.flexDirection = 'column';
    qContainer.style.gap = '6px';

    qData.forEach((q, idx) => {
      const card = document.createElement('div');
      card.id = `p3-qcard-${idx + 1}`;
      card.style.background = idx === 1 ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.9)';
      card.style.border = idx === 1 ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)';
      card.style.borderRadius = '11px';
      card.style.padding = '6px 9px';
      if (idx === 1) {
        card.style.boxShadow = '0 0 14px rgba(56, 189, 248, 0.25)';
      }

      const qHeader = document.createElement('div');
      qHeader.style.display = 'flex';
      qHeader.style.alignItems = 'flex-start';
      qHeader.style.gap = '6px';
      qHeader.style.marginBottom = '4px';

      const qNum = document.createElement('div');
      qNum.textContent = `Q${idx + 1}`;
      qNum.style.flexShrink = '0';
      qNum.style.width = '20px';
      qNum.style.height = '20px';
      qNum.style.borderRadius = '5px';
      qNum.style.background = idx === 1 ? '#0284c7' : 'rgba(255, 255, 255, 0.1)';
      qNum.style.display = 'flex';
      qNum.style.alignItems = 'center';
      qNum.style.justifyContent = 'center';
      qNum.style.fontSize = '9.5px';
      qNum.style.fontWeight = '800';
      qNum.style.color = idx === 1 ? '#fff' : '#94a3b8';

      const qPrompt = document.createElement('div');
      qPrompt.textContent = q.prompt;
      qPrompt.style.fontSize = '11px';
      qPrompt.style.fontWeight = '650';
      qPrompt.style.lineHeight = '1.3';
      qPrompt.style.color = '#f1f5f9';

      qHeader.append(qNum, qPrompt);

      const isShort = q.options.every(o => o.text.length < 28);
      const optsGrid = document.createElement('div');
      optsGrid.style.display = 'grid';
      optsGrid.style.gridTemplateColumns = isShort ? '1fr 1fr' : '1fr';
      optsGrid.style.gap = '3px 6px';
      optsGrid.style.paddingLeft = '26px';

      q.options.forEach((opt) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '4px';
        row.style.padding = '2px 5px';
        row.style.borderRadius = '5px';
        row.style.background = 'rgba(255, 255, 255, 0.04)';
        row.style.border = '1px solid rgba(148, 163, 184, 0.14)';
        row.style.fontSize = '10px';

        const k = document.createElement('span');
        k.textContent = opt.key;
        k.style.fontWeight = '750';
        k.style.color = '#94a3b8';
        k.style.fontSize = '9.5px';

        const t = document.createElement('span');
        t.textContent = opt.text;
        t.style.lineHeight = '1.25';
        t.style.whiteSpace = 'nowrap';
        t.style.overflow = 'hidden';
        t.style.textOverflow = 'ellipsis';

        row.append(k, t);
        optsGrid.appendChild(row);
      });

      card.append(qHeader, optsGrid);
      qContainer.appendChild(card);
    });

    stage.append(header, audioBar, qContainer);
  }, { imgUrl: imageUrl, qData: questionsData });

  await page.evaluate(async () => {
    const img = document.querySelector('#p3-graphic-card img');
    if (img) {
      if (!img.complete) {
        await new Promise((res) => { img.onload = res; img.onerror = res; });
      }
      try { await img.decode(); } catch {}
    }
  });

  await page.screenshot({ path: 'out/p3_test_graphic_layout.png' });
  await browser.close();
  console.log('Saved out/p3_test_graphic_layout.png');
}

testGraphicLayout().catch(console.error);
