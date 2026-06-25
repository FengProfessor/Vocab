import { createClient } from '@supabase/supabase-js';
import fs from 'fs'; import path from 'path';
const env = fs.readFileSync(path.resolve('.env.local'),'utf8');
for (const l of env.split('\n')){const m=l.match(/^\s*([^#=]+)\s*=\s*(.*)$/);if(m){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1].trim()]=v;}}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const { count } = await sb.from('global_dictionary').select('*',{count:'exact',head:true}).contains('tags',['groq-enriched']);
console.log('TOTAL groq-enriched rows:', count);
const { data } = await sb.from('global_dictionary').select('word,data').contains('tags',['groq-enriched']).limit(600);
let noIpa=0, noVn=0, longVn=0, latinVn=0, dup=0;
const rows = data||[];
for (const r of rows){
  const m=r.data?.results?.[0]?.meanings?.[0]; const vn=(m?.definition||'').trim(); const ipa=r.data?.pronunciations?.[0]?.ipa||'';
  if(!ipa) noIpa++;
  if(!vn) noVn++;
  if(vn.length>60) longVn++;
  // VN nghĩa chứa >=2 từ latin liên tiếp (nghi dịch sót / để nguyên tiếng Anh)
  if(/[a-z]{3,}\s+[a-z]{3,}/i.test(vn) && !/[àáảãạăâđêôơưèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i.test(vn)) latinVn++;
}
console.log(`sample=${rows.length} | noIPA=${noIpa} noVN=${noVn} longVN=${longVn} suspiciousLatinVN=${latinVn}`);
console.log('\n--- 25 random sample ---');
for(const r of rows.sort(()=>Math.random()-0.5).slice(0,25)){
  const m=r.data?.results?.[0]?.meanings?.[0];
  console.log(`${r.word}  →  ${m?.definition}  [${r.data?.pronunciations?.[0]?.ipa||'no-ipa'}] (${m?.pos||''})`);
}
