const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const URL_BASE = 'http://localhost:3000/grammar/learn?topic=';

async function run() {
  console.log('Fetching topics from DB...');
  const { data: topics } = await client.from('grammar_topics').select('slug');
  
  if (!topics || topics.length === 0) {
      console.log('No topics found in DB.');
      return;
  }
  
  const sampleTopics = topics.slice(0, 10).map(t => t.slug);
  console.log(`Starting Puppeteer UI QA for ${sampleTopics.length} topics...`);
  
  const browser = await puppeteer.launch({ headless: 'new' });
  
  for (let loop = 1; loop <= 3; loop++) {
      console.log(`\n=== LOOP ${loop} ===`);
      let errorsFound = 0;
      
      for (const slug of sampleTopics) {
          const page = await browser.newPage();
          
          try {
              await page.goto(`${URL_BASE}${slug}`, { waitUntil: 'networkidle0', timeout: 30000 });
              
              // Wait for React to finish rendering
              await new Promise(r => setTimeout(r, 1000));
              
              const pageText = await page.evaluate(() => {
                  return document.body.innerText || '';
              });
              
              // Check for duplicate title overlaps exactly like the bug: "Khuyết thiếu: lời khuyên (should)\nKhuyết thiếu..."
              const lines = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
              let hasDuplicateBug = false;
              if (lines.length > 5) {
                  for (let i = 0; i < lines.length - 2; i++) {
                      if (lines[i].length > 10 && lines[i] === lines[i+1] && lines[i] === lines[i+2]) {
                          hasDuplicateBug = true;
                          console.log(`❌ [FAILED] ${slug}: Phát hiện lặp chữ! Lỗi: "${lines[i]}"`);
                          break;
                      }
                  }
              }
              
              if (!hasDuplicateBug) {
                  console.log(`✅ [OK] ${slug}`);
              } else {
                  errorsFound++;
              }
          } catch (e) {
              console.log(`⚠️ [TIMEOUT/ERROR] ${slug}: ${e.message}`);
          } finally {
              await page.close();
          }
      }
      console.log(`Kết quả Loop ${loop}: Phát hiện ${errorsFound} lỗi.`);
  }
  
  await browser.close();
  console.log('\nHoàn tất 3 vòng quét UI!');
}

run();
