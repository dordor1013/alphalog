/**
 * 로컬 .env 와 Vercel 배포 번들에 박힌 Supabase 설정이 같은 프로젝트인지 확인
 * 실행: node scripts/check-deploy-supabase.mjs
 *       BASE_URL=https://alphalog-virid.vercel.app node scripts/check-deploy-supabase.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const baseUrl = (process.env.BASE_URL ?? 'https://alphalog-virid.vercel.app').replace(/\/?$/, '/')

function loadEnv() {
  const p = path.join(root, '.env')
  if (!fs.existsSync(p)) return {}
  const out = {}
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    const k = line.slice(0, i).trim()
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

function hostFromUrl(url) {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

async function fetchBundleHosts() {
  const html = await fetch(baseUrl).then((r) => r.text())
  const m = html.match(/\/assets\/[a-zA-Z0-9_-]+\.js/)
  if (!m) throw new Error('배포 HTML에서 JS 번들을 찾지 못했습니다.')
  const jsUrl = new URL(m[0], baseUrl).href
  const js = await fetch(jsUrl).then((r) => r.text())
  const urlMatch = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)
  const jwtMatch = js.match(/eyJhbGci[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)
  return {
    jsUrl,
    deployUrl: urlMatch?.[0] ?? null,
    deployJwt: jwtMatch?.[0] ?? null,
    deployKeyPrefix: jwtMatch ? jwtMatch[0].slice(0, 12) : null,
    deployKeyLen: jwtMatch?.[0]?.length ?? 0,
  }
}

async function authHealth(url, key) {
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    return res.status
  } catch (err) {
    const code = err?.cause?.code ?? err?.code
    if (code === 'ENOTFOUND') return 'ENOTFOUND'
    return 'FETCH_FAIL'
  }
}

const env = loadEnv()
const localUrl = (env.VITE_SUPABASE_URL ?? '').trim()
const localKey = (env.VITE_SUPABASE_ANON_KEY ?? '').trim()
const localHost = hostFromUrl(localUrl)

console.log('배포 URL:', baseUrl)
const bundle = await fetchBundleHosts()
const deployHost = hostFromUrl(bundle.deployUrl)

console.log('\n--- 비교 ---')
console.log('로컬 .env 프로젝트:', localHost || '(없음)')
console.log('Vercel 빌드 프로젝트:', deployHost || '(없음)')
console.log(
  'URL 일치:',
  localHost && deployHost ? (localHost === deployHost ? 'YES' : 'NO ← 원인 후보') : '확인 불가',
)
console.log(
  'anon 키 길이:',
  `로컬 ${localKey.length}`,
  `배포 ${bundle.deployKeyLen}`,
  localKey.length && bundle.deployKeyLen
    ? localKey.length === bundle.deployKeyLen
      ? '(길이 같음, 내용은 다를 수 있음)'
      : '(길이 다름 ← 키 불일치 후보)'
    : '',
)

if (localUrl && localKey) {
  const localStatus = await authHealth(localUrl, localKey)
  console.log(
    '\n로컬 키 + 로컬 URL auth health:',
    localStatus,
    localStatus === 200 ? 'OK' : localStatus === 'ENOTFOUND' ? 'DNS 없음 → 프로젝트 삭제/URL 오타' : 'FAIL',
  )
  if (bundle.deployUrl && deployHost !== localHost) {
    const mixStatus = await authHealth(bundle.deployUrl, localKey)
    console.log(
      '로컬 키 + Vercel URL auth health:',
      mixStatus,
      mixStatus === 200 ? 'OK' : mixStatus === 'ENOTFOUND' ? 'DNS 없음' : 'FAIL (URL·키 짝 불일치)',
    )
  }
  if (bundle.deployUrl && bundle.deployJwt) {
    const deployStatus = await authHealth(bundle.deployUrl, bundle.deployJwt)
    console.log(
      'Vercel 빌드 URL + Vercel 빌드 키 auth health:',
      deployStatus,
      deployStatus === 200 ? 'OK' : deployStatus === 'ENOTFOUND' ? 'DNS 없음 → 프로젝트 없음' : 'FAIL',
    )
  }
}

let failed = false
if (localHost && deployHost && localHost !== deployHost) failed = true
if (localUrl && localKey && (await authHealth(localUrl, localKey)) === 'ENOTFOUND') failed = true
if (bundle.deployUrl && bundle.deployJwt && (await authHealth(bundle.deployUrl, bundle.deployJwt)) === 'ENOTFOUND') {
  failed = true
}

if (failed) {
  console.log(`
[조치] docs/guides/supabase-연결-복구.md 참고

1) Supabase 대시보드에서 **실제로 열리는** 프로젝트의 Project URL + anon 키 복사
2) 로컬 .env 와 Vercel Environment Variables 를 **같은 값**으로 맞춤
3) Production + Preview 체크 후 Redeploy
4) Authentication → URL Configuration 에
   ${baseUrl.replace(/\/$/, '')} 와 ${baseUrl.replace(/\/$/, '')}/** 추가

DNS 없음(ENOTFOUND)이면 해당 프로젝트 ref 는 더 이상 없습니다. 새 프로젝트를 만들고 마이그레이션 001~003 을 실행하세요.
`)
  process.exit(1)
}

if (localHost && deployHost && localHost === deployHost) {
  console.log('\n배포 번들과 로컬 .env 의 Supabase 프로젝트 호스트가 같습니다.')
}
if (!localUrl || !localKey) {
  console.log('로컬 .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 필요합니다.')
  process.exit(1)
}
