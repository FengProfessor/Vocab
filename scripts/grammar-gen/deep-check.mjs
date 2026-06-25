import { readdirSync, readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const d=path.join(path.dirname(fileURLToPath(import.meta.url)), 'out');
const files=readdirSync(d).filter(f=>f.endsWith('.json')).sort();
const rows=[]; const flags=[];
let totTheory=0,totEx=0,totXr=0;
for(const f of files){
  const o=JSON.parse(readFileSync(d+'/'+f,'utf8'));
  const s=o.sections||{}; const xr=o.exercises||[];
  const theoryLen=JSON.stringify(s).length;
  const u=(s.usage||[]).length, ex=(s.examples||[]).length, mis=(s.mistakes||[]).length;
  const types=[...new Set(xr.map(e=>e.type))].sort().join('+');
  totTheory+=theoryLen; totEx+=ex; totXr+=xr.length;
  // checks
  const fl=[];
  if(u<4)fl.push('usage<4');
  if(ex<6)fl.push('ex<6');
  if(mis<3)fl.push('mis<3');
  if(xr.length<12)fl.push('xr<12');
  if(!s.formula?.rows?.length)fl.push('noFormula');
  if(!s.tips)fl.push('noTips');
  if(!s.comparison)fl.push('noComp');
  // exercise integrity
  let badXr=0;
  for(const e of xr){
    const qText = e.question || e.q;
    const fbText = e.explanation || e.fb;
    const type = e.type;
    const opts = e.options || e.opts;
    const ans = e.correct_answer !== undefined ? e.correct_answer : e.answer;

    if(!qText || fbText === undefined || fbText === null || String(fbText).trim() === '') {
      badXr++;
    } else if (['multiple_choice', 'fill_blank', 'error_correction', 'mcq', 'error'].includes(type)) {
      if (!opts || !opts.includes(ans)) badXr++;
    } else if (type === 'fill') {
      if (!Array.isArray(ans)) badXr++;
    } else if (type === 'tf') {
      if (typeof ans !== 'boolean') badXr++;
    } else {
      badXr++;
    }
  }
  if(badXr)fl.push('badXr:'+badXr);
  // mojibake
  const raw=JSON.stringify(o);
  if(/Ã¬|Ã©|â€|á»|áº/.test(raw))fl.push('MOJIBAKE');
  // type variety
  const tcount=new Set(xr.map(e=>e.type)).size;
  if(tcount<3)fl.push('types<3('+types+')');
  rows.push({slug:o.slug,lvl:o.level[0],len:theoryLen,u,ex,mis,xr:xr.length,types});
  if(fl.length)flags.push(o.slug+' ['+o.level+']: '+fl.join(', '));
}
console.log('=== TONG QUAN '+files.length+' bai ===');
console.log('theory dai TB: '+Math.round(totTheory/files.length)+' chars | examples TB: '+(totEx/files.length).toFixed(1)+' | exercises TB: '+(totXr/files.length).toFixed(1));
// shortest 8
console.log('\n=== 8 bai NGAN nhat (theory) ===');
[...rows].sort((a,b)=>a.len-b.len).slice(0,8).forEach(r=>console.log(`  ${r.len}  ${r.slug} [${r.lvl}] ex=${r.ex} xr=${r.xr} types=${r.types}`));
console.log('\n=== FLAGS ('+flags.length+' bai) ===');
flags.forEach(x=>console.log('  - '+x));
if(!flags.length)console.log('  (khong co)');
if(flags.length)process.exitCode=1;
