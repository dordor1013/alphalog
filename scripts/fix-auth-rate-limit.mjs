/**
 * Supabase Auth: 이메일 발송 한도 상향 + 가입 즉시 사용(확인 메일 생략)
 * 무료 SMTP 시간당 2통 제한 때문에 over_email_send_rate_limit 발생 시 사용
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRef = 'dkmbnnaeowoayewwhnmu'

function loadEnv() {
  const p = path.join(root, '.env')
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

const token = loadEnv().SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN 필요')
  process.exit(1)
}

/** 확인 메일 없이 가입 완료 (무료 SMTP 기본 한도: 시간당 2통) */
const patch = {
  mailer_autoconfirm: true,
  security_sb_forwarded_for_enabled: true,
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(patch),
})

const text = await res.text()
console.log('PATCH status', res.status)
if (!res.ok) {
  console.error(text.slice(0, 500))
  process.exit(1)
}

const cfg = JSON.parse(text)
console.log('적용됨:', {
  mailer_autoconfirm: cfg.mailer_autoconfirm,
  rate_limit_email_sent: cfg.rate_limit_email_sent,
})
