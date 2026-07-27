import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
const raw = fs.readFileSync('.env.local','utf8')
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1,-1)
  process.env[m[1]] = v
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const sb = createClient(url, key)

const { count: total } = await sb.from('global_dictionary').select('id', { count: 'exact', head: true })

// page through to count coreSensesChecked / core_senses
let done = 0, pending = 0, page = 0
const pageSize = 1000
while (true) {
  const from = page * pageSize
  const { data, error } = await sb.from('global_dictionary').select('id, data').range(from, from + pageSize - 1)
  if (error) { console.log('err', error.message); break }
  if (!data || data.length === 0) break
  for (const r of data) {
    const d = r.data || {}
    const has = Array.isArray(d.core_senses) && d.core_senses.length > 0
    const checked = d.coreSensesChecked === true || d.coreSensesSource
    if (has || checked) done++
    else pending++
  }
  if (data.length < pageSize) break
  page++
}
console.log(JSON.stringify({ total, done, pending, pagesScanned: page+1 }, null, 2))
