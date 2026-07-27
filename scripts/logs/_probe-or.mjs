import fs from 'fs'
const raw = fs.readFileSync('.env.local','utf8')
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1)
  process.env[m[1]]=v
}
const key = process.env.OPENROUTER_API_KEY
const models = [
  'openrouter/free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen3-4b:free',
  'google/gemma-3-4b-it:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'deepseek/deepseek-r1-0528:free',
  'nvidia/nemotron-nano-9b-v2:free',
]
for (const model of models) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:'POST',
      headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','HTTP-Referer':'https://lingopro.local','X-Title':'LingoPro'},
      body: JSON.stringify({model, messages:[{role:'user',content:'Reply exactly: {"ok":true}'}], max_tokens:30})
    })
    const t = await r.text()
    console.log(model, '=>', r.status, t.slice(0,100).replace(/\n/g,' '))
  } catch(e) { console.log(model, 'ERR', e.message) }
}
// nlm auth
import { spawnSync } from 'child_process'
const nlm = process.env.USERPROFILE + '\\pipx\\venvs\\notebooklm-cli\\Scripts\\nlm.exe'
const st = spawnSync(nlm, ['auth','status'], {encoding:'utf8', timeout:60000, shell:true})
console.log('NLM', (st.stdout||st.stderr||'').slice(0,200))
