import fs from 'fs';
import path from 'path';
import { loadVstepExamSafe, loadRawVstepExam, getVstepCatalogIndex } from '../../src/lib/vstep-test-loader';

async function main() {
  console.log('================================================================');
  console.log('🔎 REVIEWER M2 INDEPENDENT AUDIT: DATA AUTHENTICITY & SECURITY');
  console.log('================================================================\n');

  let passed = true;

  // -------------------------------------------------------------
  // 1. AUDIT ONTHIVSTEP SAMPLES & FULL BATCH
  // -------------------------------------------------------------
  console.log('--- 1. Auditing OnThiVSTEP Reading Practice Sets ---');
  const onthiSamples = ['vstep-reading-onthi-01', 'vstep-reading-onthi-37', 'vstep-reading-onthi-75'];
  for (const id of onthiSamples) {
    const raw = loadRawVstepExam(id);
    if (!raw) {
      console.error(`❌ [FAIL] Could not load raw exam: ${id}`);
      passed = false;
      continue;
    }
    const sec = raw.sections[0];
    const task = sec?.tasks[0];
    const pLen = task?.passage?.text?.length || 0;
    const qCount = task?.questions?.length || 0;
    const validOpts = task?.questions?.every(q => q.options && q.options.length >= 3 && q.options.length <= 4) ?? false;
    const validAns = task?.questions?.every(q => typeof q.answer === 'number' && q.answer >= 0 && q.answer < q.options.length) ?? false;
    const hasExpl = task?.questions?.every(q => q.explanationVi && q.explanationVi.trim().length > 0) ?? false;

    console.log(`[Sample ${id}]`);
    console.log(`  Title: ${raw.title}`);
    console.log(`  Passage Title: "${task?.passage?.title}", Text Length: ${pLen} chars`);
    console.log(`  Questions: ${qCount}, Valid Options: ${validOpts}, Valid Answers: ${validAns}, Explanations: ${hasExpl}`);

    if (pLen < 100 || !validOpts || !validAns || !hasExpl) {
      console.error(`❌ [FAIL] Sample ${id} did not meet authenticity criteria`);
      passed = false;
    } else {
      console.log(`  ✅ Passed authenticity check.`);
    }
  }

  // Scan all 75 OnThi files
  let onthiFound = 0;
  let onthiValid = 0;
  for (let i = 1; i <= 75; i++) {
    const numStr = String(i).padStart(2, '0');
    const id = `vstep-reading-onthi-${numStr}`;
    const raw = loadRawVstepExam(id);
    if (raw) {
      onthiFound++;
      let ok = true;
      for (const sec of raw.sections) {
        for (const t of sec.tasks) {
          if (!t.passage?.text || t.passage.text.length < 50) ok = false;
          for (const q of t.questions || []) {
            if (!q.options || q.options.length < 3 || q.options.length > 4) ok = false;
            if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) ok = false;
            if (!q.explanationVi || q.explanationVi.trim().length === 0) ok = false;
          }
        }
      }
      if (ok) onthiValid++;
    }
  }
  console.log(`\nBatch Scan OnThiVSTEP: Found ${onthiFound}/75, Fully Valid: ${onthiValid}/75`);
  if (onthiFound !== 75 || onthiValid !== 75) {
    console.error(`❌ [FAIL] Not all OnThi files are valid (${onthiValid}/${onthiFound}/75)`);
    passed = false;
  } else {
    console.log(`✅ All 75 OnThiVSTEP practice sets authentic and valid.`);
  }

  // -------------------------------------------------------------
  // 2. AUDIT ENGLISHTESTSTORE SAMPLES & FULL BATCH
  // -------------------------------------------------------------
  console.log('\n--- 2. Auditing EnglishTestStore Reading & Listening Sets ---');
  const etsSamples = [
    { id: 'vstep-reading-ets-01', type: 'reading' },
    { id: 'vstep-reading-ets-10', type: 'reading' },
    { id: 'vstep-listening-ets-01', type: 'listening' },
    { id: 'vstep-listening-ets-05', type: 'listening' }
  ];
  for (const s of etsSamples) {
    const raw = loadRawVstepExam(s.id);
    if (!raw) {
      console.error(`❌ [FAIL] Could not load raw exam: ${s.id}`);
      passed = false;
      continue;
    }
    let qCount = 0;
    let audioOk = true;
    let optsOk = true;
    let ansOk = true;
    let passagesOk = true;
    let explOk = true;

    for (const sec of raw.sections) {
      for (const t of sec.tasks) {
        if (s.type === 'listening') {
          if (!t.media?.audio || !t.media.audio.startsWith('http')) audioOk = false;
        } else {
          if (!t.passage?.text || t.passage.text.length < 50) passagesOk = false;
        }
        for (const q of t.questions || []) {
          qCount++;
          if (!q.options || q.options.length < 3 || q.options.length > 4) optsOk = false;
          if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) ansOk = false;
          if (!q.explanationVi || q.explanationVi.trim().length === 0) explOk = false;
        }
      }
    }

    console.log(`[Sample ${s.id} (${s.type})]`);
    console.log(`  Title: ${raw.title}`);
    console.log(`  Questions: ${qCount}, Valid Options: ${optsOk}, Valid Answers: ${ansOk}`);
    if (s.type === 'listening') console.log(`  Audio URLs: ${audioOk}`);
    else console.log(`  Passages Valid: ${passagesOk}`);
    console.log(`  Explanations: ${explOk}`);

    if (!optsOk || !ansOk || !explOk || (s.type === 'listening' ? !audioOk : !passagesOk)) {
      console.error(`❌ [FAIL] Sample ${s.id} did not meet criteria`);
      passed = false;
    } else {
      console.log(`  ✅ Passed authenticity check.`);
    }
  }

  // Scan all 10 Reading + 5 Listening ETS files
  let etsReadingValid = 0;
  for (let i = 1; i <= 10; i++) {
    const numStr = String(i).padStart(2, '0');
    const raw = loadRawVstepExam(`vstep-reading-ets-${numStr}`);
    if (raw && raw.sections[0]?.tasks?.every(t => t.passage?.text?.length && t.questions?.every(q => q.options?.length >= 3 && typeof q.answer === 'number' && q.explanationVi))) {
      etsReadingValid++;
    }
  }
  let etsListeningValid = 0;
  for (let i = 1; i <= 5; i++) {
    const numStr = String(i).padStart(2, '0');
    const raw = loadRawVstepExam(`vstep-listening-ets-${numStr}`);
    if (raw && raw.sections[0]?.tasks?.every(t => t.media?.audio?.startsWith('http') && t.questions?.every(q => q.options?.length >= 3 && typeof q.answer === 'number' && q.explanationVi))) {
      etsListeningValid++;
    }
  }
  console.log(`\nBatch Scan EnglishTestStore: Reading Valid: ${etsReadingValid}/10, Listening Valid: ${etsListeningValid}/5`);
  if (etsReadingValid !== 10 || etsListeningValid !== 5) {
    console.error(`❌ [FAIL] Not all EnglishTestStore tests are valid`);
    passed = false;
  } else {
    console.log(`✅ All 15 EnglishTestStore tests authentic and valid.`);
  }

  // -------------------------------------------------------------
  // 3. AUDIT VNU OFFICIAL 4-SKILL MOCK EXAM
  // -------------------------------------------------------------
  console.log('\n--- 3. Auditing VNU Official Sample Mock Exam (vstep-exam-vnu-01) ---');
  const vnuRaw = loadRawVstepExam('vstep-exam-vnu-01');
  if (!vnuRaw) {
    console.error(`❌ [FAIL] Could not load raw exam vstep-exam-vnu-01`);
    passed = false;
  } else {
    console.log(`Title: ${vnuRaw.title}`);
    console.log(`Duration: ${vnuRaw.duration} mins, Total Sections: ${vnuRaw.sections.length}`);
    
    const listeningSec = vnuRaw.sections.find(s => s.type === 'listening');
    const readingSec = vnuRaw.sections.find(s => s.type === 'reading');
    const writingSec = vnuRaw.sections.find(s => s.type === 'writing');
    const speakingSec = vnuRaw.sections.find(s => s.type === 'speaking');

    const listeningQCount = listeningSec?.tasks?.reduce((sum, t) => sum + (t.questions?.length || 0), 0) || 0;
    const readingQCount = readingSec?.tasks?.reduce((sum, t) => sum + (t.questions?.length || 0), 0) || 0;
    const writingTasksCount = writingSec?.tasks?.length || 0;
    const speakingTasksCount = speakingSec?.tasks?.length || 0;

    console.log(`  Listening Section: ${listeningSec?.tasks.length} tasks, ${listeningQCount} questions (Expected: 35)`);
    console.log(`  Reading Section: ${readingSec?.tasks.length} tasks, ${readingQCount} questions (Expected: 40)`);
    console.log(`  Writing Section: ${writingTasksCount} tasks (Expected: 2)`);
    console.log(`  Speaking Section: ${speakingTasksCount} tasks (Expected: 3)`);

    const vnuValid = (
      listeningSec !== undefined && listeningQCount === 35 &&
      readingSec !== undefined && readingQCount === 40 &&
      writingSec !== undefined && writingTasksCount === 2 &&
      speakingSec !== undefined && speakingTasksCount === 3
    );

    if (!vnuValid) {
      console.error(`❌ [FAIL] VNU Official exam structure does not match the 4-skill specification!`);
      passed = false;
    } else {
      console.log(`✅ VNU Official Exam verified: 4 skills (35 Listening Q, 40 Reading Q, 2 Writing tasks, 3 Speaking tasks)`);
    }
  }

  // -------------------------------------------------------------
  // 4. VERIFY ZERO-BULK-LEAK VIA loadVstepExamSafe
  // -------------------------------------------------------------
  console.log('\n--- 4. Auditing Zero-Bulk-Leak on Newly Ingested Exams ---');

  function checkLeaks(obj: any, pathStr = ''): string[] {
    const leaks: string[] = [];
    if (!obj || typeof obj !== 'object') return leaks;
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        leaks.push(...checkLeaks(item, `${pathStr}[${idx}]`));
      });
    } else {
      for (const [k, v] of Object.entries(obj)) {
        if (['answer', 'explanationVi', 'tapescript', 'suggestion'].includes(k)) {
          leaks.push(`${pathStr}.${k} = ${JSON.stringify(v)}`);
        }
        leaks.push(...checkLeaks(v, `${pathStr}.${k}`));
      }
    }
    return leaks;
  }

  const newTypes = [
    'vstep-reading-onthi-01',
    'vstep-reading-onthi-37',
    'vstep-reading-onthi-75',
    'vstep-reading-ets-01',
    'vstep-reading-ets-10',
    'vstep-listening-ets-01',
    'vstep-listening-ets-05',
    'vstep-exam-vnu-01'
  ];

  for (const id of newTypes) {
    const safe = loadVstepExamSafe(id);
    if (!safe) {
      console.error(`❌ [FAIL] loadVstepExamSafe returned null for ${id}`);
      passed = false;
      continue;
    }
    const leaks = checkLeaks(safe);
    if (leaks.length > 0) {
      console.error(`❌ [LEAK DETECTED] ${id} leaked ${leaks.length} sensitive fields!`);
      console.error('  Samples:', leaks.slice(0, 5));
      passed = false;
    } else {
      console.log(`  ✅ ${id}: 0 sensitive leaks found (answer, explanationVi, tapescript, suggestion 100% absent).`);
    }
  }

  // -------------------------------------------------------------
  // 5. AUDIT ALL 190 CATALOG ITEMS FOR ZERO-BULK-LEAK
  // -------------------------------------------------------------
  console.log('\n--- 5. Comprehensive Zero-Bulk-Leak Audit Across Entire Catalog ---');
  const catalog = getVstepCatalogIndex();
  console.log(`Catalog total items: ${catalog.items.length}`);
  let totalAudited = 0;
  let totalCatalogLeaks = 0;

  for (const item of catalog.items) {
    const safe = loadVstepExamSafe(item.id);
    if (!safe) {
      console.error(`❌ [FAIL] Could not load safe exam for catalog item: ${item.id}`);
      passed = false;
      continue;
    }
    totalAudited++;
    const leaks = checkLeaks(safe);
    if (leaks.length > 0) {
      totalCatalogLeaks += leaks.length;
      console.error(`❌ [LEAK] ${item.id} has ${leaks.length} leaks!`);
      passed = false;
    }
  }

  console.log(`Audited ${totalAudited} / ${catalog.items.length} catalog exams.`);
  console.log(`Total Sensitive Leaks: ${totalCatalogLeaks}`);
  if (totalCatalogLeaks === 0 && totalAudited === catalog.items.length) {
    console.log(`✅ 100% of all ${catalog.items.length} exams in the catalog are immune to Zero-Bulk-Leak.`);
  } else {
    console.error(`❌ [FAIL] Catalog has ${totalCatalogLeaks} sensitive data leaks.`);
    passed = false;
  }

  console.log('\n================================================================');
  console.log(`OVERALL AUDIT RESULT: ${passed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log('================================================================');

  process.exit(passed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
