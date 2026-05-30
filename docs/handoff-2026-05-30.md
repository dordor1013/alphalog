# Session Handoff

> Created: 2026-05-30  
> Vercel·Supabase 배포 가입/로그인 복구, 이메일 rate limit 해결.

## Context

- **AlphaLog** 프로덕션: `https://alphalog-virid.vercel.app`
- **Supabase** 살아 있는 프로젝트: `dkmbnnaeowoayewwhnmu` (Paused 해제·중복 프로젝트 1개 삭제)
- Vercel env: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`(Publishable) 정렬·Redeploy 완료
- 로컬 `.env`는 `npm run setup:finish`로 배포와 동일 키 동기화
- **가입 `email rate limit exceeded`**: 원인 `rate_limit_email_sent: 2` + 확인 메일 발송. **`mailer_autoconfirm: true`** 로 API 패치해 확인 메일 없이 가입(가입 API 200 확인)
- Auth UX: 한국어 오류(`Invalid login credentials`, rate limit 등), `signUp`에 `emailRedirectTo`, 연결 사전 점검(`probeSupabaseReachability`)
- Supabase Auth URL: Site/Redirect에 Vercel + localhost (`finish-setup` / Management API)

## Open Items

- [ ] Vercel에서 **실사용자 이메일**(예: `gaminem9@gmail.com`)로 회원가입·로그인 재확인
- [ ] 신규 사용자 매매 저장까지 E2E (마이그레이션 001~003 적용 여부)
- [ ] 나중에 **이메일 인증** 다시 켤 경우: Custom SMTP + `mailer_autoconfirm: false` + Rate Limits 상향

## Key Decisions Made

- 무료 SMTP **시간당 2통** 한도 때문에 운영 초기는 **`mailer_autoconfirm: true`**(즉시 가입) 선택
- Supabase UI 이름 변경 반영: **API URL** / **Publishable·anon** (문서 `supabase-연결-복구.md`, `배포하기-초보자용.md`)
- 진단·복구 스크립트: `check:deploy`, `check:api-key`, `test:production`, `setup:finish`, `fix:auth-rate`, `investigate-auth-rate`

## Files to Review

- `src/pages/Auth.tsx` — 한국어 Auth 오류·가입 메시지
- `scripts/fix-auth-rate-limit.mjs` — autoconfirm 재적용
- `scripts/finish-setup.mjs` — .env + Auth URL 동기화
- `docs/guides/supabase-연결-복구.md` — rate limit·API URL 안내

## Notes for Next Session

- `SUPABASE_ACCESS_TOKEN`은 `.env`만 (Git 제외). Management API로 Auth 설정 변경 가능
- `Invalid login credentials` = 연결 OK, **이 프로젝트에 계정 없음/비번 틀림** → 회원가입
- handoff 아카이브: `session-start` 시 `docs/handoff-2026-05-30.md` 등으로 rename
