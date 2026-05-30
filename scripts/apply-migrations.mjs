/**
 * Supabase DB에 마이그레이션 SQL 적용 (테이블 없을 때)
 * node scripts/apply-migrations.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRef = 'dkmbnnaeowoayewwhnmu'
const migrationDir = path.join(root, 'supabase', 'migrations')

function loadEnv() {
  const p = path.join(root, '.env')
  if (!fs.existsSync(p)) return {}
  const out = {}
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[line.slice(0, i).trim()] = v
  }
  return out
}

async function runQuery(token, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${text.slice(0, 400)}`)
  }
  return text
}

const token = loadEnv().SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('.env 에 SUPABASE_ACCESS_TOKEN 이 필요합니다.')
  process.exit(1)
}

const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort()
console.log('=== AlphaLog DB 마이그레이션 ===\n')

for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8')
  console.log(`[${file}] 적용 중...`)
  try {
    await runQuery(token, sql)
    console.log(`  OK`)
  } catch (e) {
    console.error(`  FAIL:`, e.message)
    process.exit(1)
  }
}

// verify
const check = await runQuery(
  token,
  `select table_name from information_schema.tables where table_schema = 'public' and table_name in ('strategies','trades','trade_options') order by 1`,
)
console.log('\n테이블 확인:', check)
console.log('\n완료. 브라우저에서 설정 페이지를 새로고침(F5) 후 옵션 추가를 다시 시도하세요.')
