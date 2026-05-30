# Session log

## [2026-05-30] session | Vercel·Supabase 가입/로그인, email rate limit

- API 키·Paused 프로젝트·Vercel env 불일치 진단; `finish-setup`으로 .env·Auth URL 정렬
- `email rate limit exceeded`: `rate_limit_email_sent: 2` + 확인 메일 → `mailer_autoconfirm: true` 패치
- Auth 한국어 오류, signUp `emailRedirectTo`, 연결 probe, 배포/진단 스크립트
- Commits: `2407ef1`, `e4119ac`

상세: `docs/handoff.md`

## [2026-05-18] session | AlphaLog 브랜딩, 폼·여백·CSS 레이어, trade_options 마이그레이션

- AlphaLog 리네임, 로고 `public/images/logo.png`, Auth·사이드바 반영.
- 로그인 서브카피: 나만의 초과수익(α) 매매 일지.
- `index.css` 글로벌 스타일 `@layer base` 이관으로 Tailwind margin 유틸 복구.
- NewTrade: 1주당 가격·수량·총액, 기준 다중 선택 + 태그 행 저장 패턴.
- 마이그레이션 `003_trade_options_tag_rows.sql` 추가.
- 경제지표·설정·대시보드·매매일지 등 여백 조정, Select/날짜 입력 패딩.

상세: `docs/handoff-2026-05-18.md`

## [2026-05-18] session | 배포 트러블슈팅, Auth UX, 문서 핸드오프

- Vercel 환경 변수·Redeploy·Supabase URL(루트 vs `/rest/v1/`) 가이드 및 배포 초보 문서 업데이트.
- 로그인 화면: 탭 제거, 비번 찾기는 로그인 실패 후 노출·재설정 메일 플로.
- `failed to fetch` 한글 진단、`vite.config` PWA workbox、`scripts/capture-vercel-ui.mjs`, `artifacts/` ignore.
- 새 핸드오프: `docs/handoff.md` (세션 시작 시 아카이브 예정).

