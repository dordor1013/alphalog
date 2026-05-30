/**
 * 1) Vercel 배포본에서 동작하는 anon 키를 .env에 반영
 * 2) Supabase Management API로 Auth URL 설정
 * 실행: node scripts/finish-setup.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env')
const vercelUrl = 'https://alphalog-virid.vercel.app'
const projectRef = 'dkmbnnaeowoayewwhnmu'
const siteUrl = vercelUrl
const redirectList = [
  siteUrl,
  `${siteUrl}/**`,
  'http://localhost:5173',
  'http://localhost:5173/**',
].join(',')

function loadEnv() {
  const out = {}
  if (!fs.existsSync(envPath)) return out
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[line.slice(0, i).trim()] = v
  }
  return out
}

function saveEnv(updates) {
  let lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : []
  const keys = new Set(Object.keys(updates))
  const out = []
  const written = new Set()
  for (const line of lines) {
    if (!line || line.startsWith('#') || !line.includes('=')) {
      out.push(line)
      continue
    }
    const k = line.slice(0, line.indexOf('=')).trim()
    if (keys.has(k)) {
      out.push(`${k}=${updates[k]}`)
      written.add(k)
    } else out.push(line)
  }
  for (const k of keys) {
    if (!written.has(k)) out.push(`${k}=${updates[k]}`)
  }
  fs.writeFileSync(envPath, out.filter((l, i, a) => !(i === a.length - 1 && l === '')).join('\n') + '\n', 'utf8')
}

async function fetchDeployKey() {
  const html = await fetch(`${vercelUrl}/`).then((r) => r.text())
  const jsPath = html.match(/\/assets\/[a-zA-Z0-9_-]+\.js/)?.[0]
  if (!jsPath) throw new Error('Vercel JS 번들 없음')
  const js = await fetch(`${vercelUrl}${jsPath}`).then((r) => r.text())
  const publishable = js.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0]
  const jwt = js.match(/eyJhbGci[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0]
  const key = publishable ?? jwt
  if (!key) throw new Error('배포 번들에서 Supabase 키를 찾지 못함')
  return { key, type: publishable ? 'publishable' : 'jwt' }
}

async function authHealth(key) {
  const res = await fetch(`https://${projectRef}.supabase.co/auth/v1/health`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return res.ok
}

async function patchSupabaseAuth(token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      site_url: siteUrl,
      uri_allow_list: redirectList,
    }),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, body: text.slice(0, 300) }
}

console.log('=== finish-setup ===\n')

const { key, type } = await fetchDeployKey()
console.log('[1] Vercel 배포 키 추출:', type, `(길이 ${key.length})`)
if (!(await authHealth(key))) throw new Error('추출한 키로 auth health 실패')

saveEnv({
  VITE_SUPABASE_URL: `https://${projectRef}.supabase.co`,
  VITE_SUPABASE_ANON_KEY: key,
})
console.log('[2] .env 갱신: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (배포와 동일)')

const env = loadEnv()
const mgmt = env.SUPABASE_ACCESS_TOKEN
if (!mgmt) {
  console.log('[3] SUPABASE_ACCESS_TOKEN 없음 — Supabase URL은 대시보드에서 수동 설정 필요')
} else {
  const r = await patchSupabaseAuth(mgmt)
  console.log('[3] Supabase Auth URL API:', r.status, r.ok ? 'OK' : r.body)
  if (!r.ok) console.log('    (실패 시 대시보드 Authentication → URL Configuration 에서 수동 설정)')
}

console.log('\n다음: git push 후 Vercel 자동 배포 (한국어 메시지·가입 redirect 코드 반영)')
