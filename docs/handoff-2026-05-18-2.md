# Session Handoff

> Created: 2026-05-18  
> 배포·가입 이슈·Auth UI 정리 및 문서 보강 (꽥꽥 핸드오프).

## Context

- **AlphaLog** Vercel 배포 중. 외부 가입 **`Failed to fetch`** 는 대부분 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 미설정·잘못된 URL·Redeploy 누락 때문.
- **Project URL 규칙**: `Project Settings → API → Project URL` 은 **`https://xxx.supabase.co` 만.** Integrations → Data API 의 `…/rest/v1/` 포함 URL은 **넣으면 안 됨.**
- **Auth UI**: 상단 탭 3개 제거. 깔끔한 카드 형태 로그인/회원가입. 비밀번호 찾기 링크는 **로그인 실패 후** 에만 노출 (`Auth.tsx`).
- 비밀번호 재설정: `PasswordRecovery.tsx` + `App.tsx` 에서 recovery 해시/이벤트 처리. Supabase 클라이언트 `detectSessionInUrl: true`.
- **`formatSupabaseAuthError`**: 네트워크 실패 시 한국어로 Vercel env·Preview·Redeploy 안내.
- **PWA**: `vite.config.ts` 에 `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches` (구 번들 캐시 완화).
- **Playwright**: `scripts/capture-vercel-ui.mjs` 로 배포 URL DOM/스크린샷 검증 가능. `npm run capture:vercel`. `artifacts/` gitignore.

## Open Items

- [ ] 로컬에 **커밋 안 된 변경**: `.gitignore`, `package.json` / `package-lock.json` (playwright 추가), `scripts/` — 필요 시 한 커밋으로 정리 후 push.
- [ ] Vercel **Environment Variables**: `VITE_SUPABASE_URL` 이 **반드시** `/rest/v1/` 없는 루트 URL 인지 사용자 최종 확인 후 **Redeploy**.
- [ ] Supabase **Authentication → URL Configuration** 에 프로덕션 도메인(예: `alphalog-virid.vercel.app` 및 `/**`) 허용.
- [ ] 가입 테스트: 시크릿 창에서 회원가입·로그인·(선택) 비번 재설정.

## Key Decisions Made

- 초보 사용자를 위해 **`docs/guides/배포하기-초보자용.md`** 에 Preview env, Key/Value 주의, 비번 재설정·Failed to fetch 안내 추가.
- “탭 버튼” 레이아웃 포기하고 **실패 후에만** 비번 찾기 노출 (사용자 요청).
- 라이브 UI 검증은 **Playwright 스크립트**로 재현 가능하게 함.

## Files to Review

- `src/pages/Auth.tsx` — 로그인/가입/forgot 플로·에러 메시지.
- `src/App.tsx` — `passwordRecoveryMode`·세션 처리.
- `src/lib/supabase.ts` — `trim()`, `detectSessionInUrl`.
- `vite.config.ts` — PWA workbox.
- `docs/guides/배포하기-초보자용.md` — Vercel UI 경로(Environment Variables 등).
- `scripts/capture-vercel-ui.mjs` — 배포 URL 스냅샷.

## Notes for Next Session

- Vercel은 **프로젝트 위에 탭형 Settings 가 없고** 왼쪽 사이드에 **Environment Variables** 가 있다 (사용자 혼선).
- `npm warn deprecated`(glob, source-map-beta) 은 트랜지티브 경고라 **설치 성공 시** 보통 무시 가능.
- 다음 세션 시작 시 `session-start` 스킬이 있으면 이 파일을 읽은 뒤 `docs/handoff-2026-05-18-2.md` 등으로 중복 방지 이름으로 아카이브해야 함 (`handoff-2026-05-18.md` 가 이미 있으므로 이름 충돌 시 `-2`).
