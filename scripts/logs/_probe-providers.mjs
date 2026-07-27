import fs from 'fs'
const raw = fs.readFileSync('.env.local','utf8')
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1)
  process.env[m[1]]=v
}
async function tryGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) return 'no key'
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body: JSON.stringify({model:'llama-3.3-70b-versatile', messages:[{role:'user',content:'Reply exactly: {"ok":true}'}], max_tokens:20, temperature:0})
  })
  const t = await r.text()
  return `status=${r.status} body=${t.slice(0,120)}`
}
async function tryOr() {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return 'no key'
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body: JSON.stringify({model:'google/gemma-2-9b-it:free', messages:[{role:'user',content:'Reply exactly: {"ok":true}'}], max_tokens:20})
  })
  const t = await r.text()
  return `status=${r.status} body=${t.slice(0,160)}`
}
async function tryGemini() {
  const keys = (process.env.GEMINI_API_KEY||'').split(',').map(s=>s.trim()).filter(Boolean)
  if (!keys.length) return 'no key'
  const k = keys[0]
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${k}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({contents:[{parts:[{text:'Reply exactly: {"ok":true}'}]}]})
  })
  const t = await r.text()
  return `status=${r.status} body=${t.slice(0,120)} keys=${keys.length}`
}
console.log('GROQ', await tryGroq())
console.log('OPENROUTER', await tryOr())
console.log('GEMINI', await tryGemini())
