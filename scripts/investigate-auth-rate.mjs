/**
 * Supabase Auth rate limit / mailer 설정 조사 → debug-log.txt
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const logPath = path.join(root, 'debug-log.txt')
const projectRef = 'dkmbnnaeowoayewwhnmu'

function logForAI(label, data) {
  const line =
    typeof data === 'string'
      ? `[${new Date().toISOString()}] ${label} ${data}\n`
      : `[${new Date().toISOString()}] ${label} ${JSON.stringify(data)}\n`
  fs.appendFileSync(logPath, line)
}

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

const env = loadEnv()
const token = env.SUPABASE_ACCESS_TOKEN
const anonKey = env.VITE_SUPABASE_ANON_KEY
const base = env.VITE_SUPABASE_URL?.replace(/\/$/, '')

fs.writeFileSync(logPath, `--- investigate-auth-rate ${new Date().toISOString()} ---\n`)

if (!token) {
  logForAI('error', 'SUPABASE_ACCESS_TOKEN missing')
  process.exit(1)
}

const cfgRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  headers: { Authorization: `Bearer ${token}` },
})
const cfg = await cfgRes.json()
logForAI('auth_config_status', cfgRes.status)
const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]))
logForAI(
  'auth_config_relevant',
  pick(cfg, [
    'mailer_autoconfirm',
    'rate_limit_email_sent',
    'rate_limit_signup',
    'external_email_enabled',
    'smtp_host',
    'site_url',
    'uri_allow_list',
  ]),
)

if (base && anonKey) {
  const email = `rate-probe-${Date.now()}@mailinator.com`
  const signRes = await fetch(`${base}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: 'ProbePass123!',
      options: { emailRedirectTo: 'https://alphalog-virid.vercel.app/' },
    }),
  })
  const signBody = await signRes.text()
  logForAI('signup_probe', {
    status: signRes.status,
    emailDomain: email.split('@')[1],
    body: signBody.slice(0, 400),
  })
}

console.log('Wrote', logPath)
