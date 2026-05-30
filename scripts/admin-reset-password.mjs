/**
 * 관리자 비밀번호 초기화 (SUPABASE_ACCESS_TOKEN + Management API)
 * 사용: node scripts/admin-reset-password.mjs 이메일@example.com
 * 비밀번호 미지정 시 임시 비밀번호를 생성해 출력합니다.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRef = 'dkmbnnaeowoayewwhnmu'
const baseUrl = `https://${projectRef}.supabase.co`

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

async function getServiceRoleKey(mgmtToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${mgmtToken}` },
  })
  if (!res.ok) throw new Error(`API keys 조회 실패: ${res.status}`)
  const keys = await res.json()
  const service = keys.find((k) => k.name === 'service_role')?.api_key
  if (!service) throw new Error('service_role 키 없음')
  return service
}

async function findUserByEmail(serviceKey, email) {
  const res = await fetch(`${baseUrl}/auth/v1/admin/users?per_page=200`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })
  if (!res.ok) throw new Error(`사용자 목록 실패: ${res.status}`)
  const data = await res.json()
  return (data.users ?? []).find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase())
}

async function setPassword(serviceKey, userId, password) {
  const res = await fetch(`${baseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`비밀번호 변경 실패: ${res.status} ${text}`)
}

async function testLogin(anonKey, email, password) {
  const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  return res.ok
}

const email = process.argv[2]?.trim()
if (!email) {
  console.error('사용법: node scripts/admin-reset-password.mjs 이메일@example.com')
  process.exit(1)
}

const env = loadEnv()
const mgmt = env.SUPABASE_ACCESS_TOKEN
if (!mgmt) {
  console.error('.env 에 SUPABASE_ACCESS_TOKEN 이 필요합니다.')
  process.exit(1)
}

const newPassword = process.argv[3]?.trim() || `AlphaLog-${crypto.randomBytes(4).toString('hex')}!`

const serviceKey = await getServiceRoleKey(mgmt)
const user = await findUserByEmail(serviceKey, email)
if (!user) {
  console.error(`사용자 없음: ${email}`)
  process.exit(1)
}

await setPassword(serviceKey, user.id, newPassword)
const anonKey = env.VITE_SUPABASE_ANON_KEY
const ok = anonKey ? await testLogin(anonKey, email, newPassword) : false

console.log('')
console.log('비밀번호를 새로 설정했습니다.')
console.log('이메일:', email)
console.log('임시 비밀번호:', newPassword)
console.log('로그인 테스트:', ok ? '성공' : '(건너뜀 — .env 키로 확인)')
console.log('')
console.log('localhost:5173 에서 위 비밀번호로 로그인한 뒤, 원하면 설정에서 바꾸세요.')
console.log('(이 비밀번호는 터미널에만 표시됩니다. 메모해 두세요.)')
