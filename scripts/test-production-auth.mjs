/**
 * Vercel 배포 + Supabase Auth 동작 점검
 * node scripts/test-production-auth.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const baseUrl = (process.env.BASE_URL ?? 'https://alphalog-virid.vercel.app').replace(/\/?$/, '')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

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

async function getDeployConfig() {
  const html = await fetch(`${baseUrl}/`).then((r) => r.text())
  if (!rOk(html)) throw new Error(`사이트 HTML 로드 실패`)
  const jsPath = html.match(/\/assets\/[a-zA-Z0-9_-]+\.js/)?.[0]
  if (!jsPath) throw new Error('JS 번들 없음')
  const js = await fetch(`${baseUrl}${jsPath}`).then((r) => r.text())
  const url = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0]
  const jwt = js.match(/eyJhbGci[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0]
  const publishable = js.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0]
  return { url, key: publishable ?? jwt ?? null, keyType: publishable ? 'publishable' : jwt ? 'jwt' : 'none' }
}

function rOk(x) {
  return typeof x === 'string' && x.length > 0
}

async function health(url, key) {
  const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return { status: res.status, ok: res.ok }
}

async function signupProbe(url, key) {
  const email = `alphalog-test-${Date.now()}@example.com`
  const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: 'TestPass123!',
      options: { emailRedirectTo: `${baseUrl}/` },
    }),
  })
  const body = await res.text()
  return { status: res.status, email, snippet: body.slice(0, 200) }
}

const env = loadEnv()
const localUrl = env.VITE_SUPABASE_URL?.trim()
const localKey = env.VITE_SUPABASE_ANON_KEY?.trim()

console.log('=== AlphaLog 프로덕션 테스트 ===')
console.log('사이트:', baseUrl)

const siteRes = await fetch(baseUrl)
console.log('\n[1] 사이트 HTTP', siteRes.status, siteRes.ok ? 'OK' : 'FAIL')

const deploy = await getDeployConfig()
console.log('\n[2] Vercel 빌드 Supabase')
console.log('  URL:', deploy.url ?? '(없음)')
console.log('  키 형식:', deploy.keyType)
console.log('  키 길이:', deploy.key?.length ?? 0)

if (deploy.url && deploy.key) {
  const h = await health(deploy.url, deploy.key)
  console.log('  auth health:', h.status, h.ok ? 'OK' : h.status === 401 ? 'FAIL(키 무효)' : 'CHECK')
  const s = await signupProbe(deploy.url, deploy.key)
  console.log('  signup API:', s.status, s.status === 200 ? 'OK(가입 API 동작)' : `응답: ${s.snippet}`)
}

if (localUrl && localKey) {
  console.log('\n[3] 로컬 .env')
  const h = await health(localUrl, localKey)
  console.log('  auth health:', h.status, h.ok ? 'OK' : 'FAIL — anon 키를 살아있는 프로젝트에서 다시 복사하세요')
}

console.log('\n[4] Playwright UI (선택)')
try {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(2000)
  const ui = await page.evaluate(() => ({
    title: document.title,
    hasAlphaLog: document.body.innerText.includes('AlphaLog'),
    hasLogin: /로그인/.test(document.body.innerText),
    hasSignupLink: /회원가입/.test(document.body.innerText),
    errorText: [...document.querySelectorAll('p')].map((p) => p.innerText).find((t) => /연결|API|Supabase/i.test(t)) ?? null,
  }))
  console.log('  페이지:', ui.title)
  console.log('  로그인 UI:', ui.hasLogin && ui.hasAlphaLog ? 'OK' : 'CHECK')
  console.log('  회원가입 링크:', ui.hasSignupLink ? 'OK' : '없음')
  if (ui.errorText) console.log('  화면 경고:', ui.errorText.slice(0, 120))
  await browser.close()
} catch (e) {
  console.log('  Playwright 스킵:', e.message?.slice(0, 80))
}

console.log('\n=== 요약 ===')
const deployOk = deploy.url && deploy.key && (await health(deploy.url, deploy.key)).ok
console.log(deployOk ? '배포(Supabase 키): 통과 가능' : '배포(Supabase 키): URL·키 확인 또는 Redeploy 필요')
console.log('다른 사람 가입: Vercel 키 OK + Supabase URL Configuration에 Vercel 주소 필요')
