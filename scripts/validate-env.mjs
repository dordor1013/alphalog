/**
 * 빌드 전 Supabase env 형식 검사
 * node scripts/validate-env.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const p = path.join(root, '.env')
  if (!fs.existsSync(p)) return {}
  const out = {}
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[line.slice(0, i).trim()] = v.trim()
  }
  return out
}

function keyValid(key) {
  if (!key || /your-anon|your-project|placeholder/i.test(key)) return false
  if (key.startsWith('sb_publishable_')) return key.length >= 40
  if (key.startsWith('eyJ')) return key.split('.').length === 3
  return false
}

function urlValid(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && /^[a-z0-9]+\.supabase\.co$/i.test(u.hostname)
  } catch {
    return false
  }
}

const url = process.env.VITE_SUPABASE_URL?.trim() || loadEnv().VITE_SUPABASE_URL || ''
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim() || loadEnv().VITE_SUPABASE_ANON_KEY || ''

if (!url || !key) {
  console.warn('[validate-env] VITE_SUPABASE_* 없음 — Vercel/CI에서는 환경 변수로 주입해야 합니다.')
  process.exit(0)
}

if (!urlValid(url) || !keyValid(key)) {
  console.error('[validate-env] Supabase URL 또는 API 키 형식이 잘못되었습니다.')
  console.error('  URL:', url || '(없음)')
  console.error('  키:', key ? `${key.slice(0, 24)}… (길이 ${key.length})` : '(없음)')
  process.exit(1)
}

console.log('[validate-env] Supabase env OK')
