import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const alive = 'https://dkmbnnaeowoayewwhnmu.supabase.co'

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

function refFromJwt(jwt) {
  try {
    return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).ref
  } catch {
    return null
  }
}

async function health(url, key) {
  const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return res.status
}

const env = loadEnv()
const localJwt = env.VITE_SUPABASE_ANON_KEY ?? ''
const localUrl = env.VITE_SUPABASE_URL ?? ''
const localHost = (() => {
  try {
    return new URL(localUrl).hostname.split('.')[0]
  } catch {
    return null
  }
})()
const localJwtRef = refFromJwt(localJwt)

console.log('--- 로컬 .env ---')
console.log('URL 프로젝트 ref:', localHost)
console.log('키(JWT) 프로젝트 ref:', localJwtRef)
console.log('URL·키 짝 일치:', localHost && localJwtRef ? localHost === localJwtRef : false)
console.log('살아있는 프로젝트와 일치:', localHost === 'dkmbnnaeowoayewwhnmu')
if (localJwt) console.log('로컬 키 → alive 프로젝트 health:', await health(alive, localJwt))

const html = await fetch('https://alphalog-virid.vercel.app/').then((r) => r.text())
const jsPath = html.match(/\/assets\/[a-zA-Z0-9_-]+\.js/)?.[0]
const js = await fetch(`https://alphalog-virid.vercel.app${jsPath}`).then((r) => r.text())
const deployUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0]
const deployJwt = js.match(/eyJhbGci[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0]
const deployHost = deployUrl ? new URL(deployUrl).hostname.split('.')[0] : null
const deployJwtRef = refFromJwt(deployJwt ?? '')

console.log('\n--- Vercel 배포 번들 ---')
console.log('URL 프로젝트 ref:', deployHost)
console.log('키(JWT) 프로젝트 ref:', deployJwtRef)
console.log('URL·키 짝 일치:', deployHost === deployJwtRef)
if (deployJwt) console.log('Vercel 키 → alive 프로젝트 health:', await health(alive, deployJwt))
if (deployHost !== deployJwtRef) console.log('\n=> Invalid API key 원인: Vercel에 URL과 anon 키가 다른 프로젝트 것입니다.')
if (localHost !== 'dkmbnnaeowoayewwhnmu' || localJwtRef !== 'dkmbnnaeowoayewwhnmu') {
  console.log('\n=> 로컬 .env 도 살아있는 프로젝트(dkmbnnaeowoayewwhnmu) URL·키로 바꿔야 합니다.')
}
