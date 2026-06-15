# Session log

## [2026-06-15] session | 홈페이지 복구 + 오프라인 단독 APK 전환

- 홈페이지 안 열림: Supabase 프로젝트 INACTIVE 상태 → Management API `restore`로 복구, `App.tsx` getSession 타임아웃 추가
- 요청에 따라 웹+Supabase 구조를 **오프라인 단독 Android APK**로 전환 (혼자 사용, 로그인·서버 제거)
- 로컬 저장 계층 `src/lib/localdb.ts`(@capacitor/preferences), `useStore` 전면 로컬화, `App` HashRouter
- 경제지표·Auth·PasswordRecovery·supabase 파일 삭제, 설정에 데이터 백업(JSON) 추가
- Capacitor Android 추가, 로고 아이콘 생성, 고정 키스토어 서명, GitHub Actions로 APK 자동 빌드→Release 첨부
- 정리: supabase-js·PWA·playwright·scripts·vercel.json 제거, README 갱신

상세: `docs/wiki/changelog.md`

## [2026-05-30] session | 옵션·Auth·수익률·공모주 노트·Vercel 배포

- 설정 매수/매도 옵션: DB `strategies` 생성(004), 타입별 초기화·추가 오류 처리, NewTrade→설정 바로가기
- 로그인 Invalid API key: 세션 정리·probe, 비밀번호 찾기/변경 UX, `admin-reset-password`
- 대시보드 일·주·월·년 누적 수익률 (`src/lib/returns.ts`)
- 설정 계정 비밀번호 변경
- 공모주 노트 `/ipo`: 배정가·수익률, 청약일·상장일·당첨/미당첨/대기(005)
- 경제지표 Investing.com 조사 → 보류; FRED 키만 넣으면 동작
- Commits: `6320205`, `4de3760`, `7b84108`, `b19138a`, `698baa7`

상세: `docs/handoff.md`

## [2026-05-30] session | Vercel·Supabase 가입/로그인, email rate limit

- API 키·Paused 프로젝트·Vercel env 불일치 진단; `finish-setup`으로 .env·Auth URL 정렬
- `email rate limit exceeded`: `rate_limit_email_sent: 2` + 확인 메일 → `mailer_autoconfirm: true` 패치
- Auth 한국어 오류, signUp `emailRedirectTo`, 연결 probe, 배포/진단 스크립트
- Commits: `2407ef1`, `e4119ac`

상세: `docs/handoff-2026-05-30.md`

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

