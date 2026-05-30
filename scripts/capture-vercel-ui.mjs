/**
 * 배포 URL 로그인 화면 UI 스냅샷 (Playwright)
 * 실행: npx node scripts/capture-vercel-ui.mjs
 * 또는: BASE_URL=https://... npx node scripts/capture-vercel-ui.mjs
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'artifacts')
const baseUrl = process.env.BASE_URL ?? 'https://alphalog-virid.vercel.app/'

fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})

async function dumpState(label) {
  const info = await page.evaluate(() => {
    const qs = (s) => [...document.querySelectorAll(s)]
    const buttons = qs('button').map((el) => ({
      text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 120),
      type: el.type,
      aria: el.getAttribute('aria-label'),
    }))
    const navs = qs('nav').map((n) => ({
      aria: n.getAttribute('aria-label'),
      childButtonTexts: [...n.querySelectorAll('button')].map((b) =>
        (b.innerText || '').trim().replace(/\s+/g, ' '),
      ),
    }))
    const links = qs('a').map((a) => (a.innerText || '').trim()).filter(Boolean).slice(0, 20)
    const inputs = qs('input:not([type="hidden"])').map((i) => ({
      type: i.type,
      name: i.name,
      placeholder: i.placeholder,
      labelNear: i.labels?.[0]?.innerText ?? null,
    }))
    const headings = qs('h1,h2,h3').map((h) => h.innerText.trim())
    const mainText = (document.body?.innerText || '').trim().replace(/\s+\n/g, '\n').slice(0, 3500)

    /** 로드된 JS 번들 이름 (해시 확인용) */
    const scriptSrcs = qs('script[src]').map((s) => {
      const src = s.getAttribute('src') || ''
      try {
        return new URL(src, window.location.origin).pathname
      } catch {
        return src
      }
    })

    return {
      href: window.location.href,
      title: document.title,
      headings,
      navs,
      buttons,
      inputs,
      links,
      scriptSrcs,
      bodyTextPreview: mainText,
    }
  })

  const jsonPath = path.join(outDir, `vercel-ui-${label}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(info, null, 2), 'utf8')
  return jsonPath
}

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForTimeout(3000)

  await page.screenshot({
    path: path.join(outDir, 'vercel-auth-fullpage.png'),
    fullPage: true,
  })

  const p1 = await dumpState('after-load')
  console.log('Wrote', p1)

  /** 회원가입 탭/전환 버튼이 있으면 클릭해 두 번째 상태도 기록 */
  const signupClicked = await page.evaluate(() => {
    const hay = [...document.querySelectorAll('button')]
    const t = hay.find((b) =>
      /회원가입|계정이 없으신가요/i.test((b.innerText || '').trim()),
    )
    if (t) {
      ;(t).click()
      return true
    }
    return false
  })

  if (signupClicked) {
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(outDir, 'vercel-signup-view.png'),
      fullPage: true,
    })
    const p2 = await dumpState('signup')
    console.log('Wrote', p2)
  }
} finally {
  await browser.close()
}

console.log('Screenshots in', outDir)
