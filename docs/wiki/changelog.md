# Changelog

## 2026-05-30 (후속)

- 매매 기준 옵션: `strategies` 테이블 마이그레이션(004)·설정 옵션 추가/초기화 수정, NewTrade 설정 바로가기
- Auth: Invalid API key 세션 정리·키 검증, 비밀번호 변경(설정), `admin-reset-password` 스크립트
- 대시보드: 일·주·월·년 누적 수익률(실현손익 기준)
- 공모주 노트 탭(`/ipo`): 일육공 스타일 투자노트, 청약일·상장일·당첨/미당첨/대기, 당첨 시만 배정·매도·수익률 자동 계산 (005)
- 배포: 기능 추가 시 `main` push → Vercel 자동 배포 (사용자 요청)
- 경제지표: Investing.com 직접 연동은 보류, FRED(`VITE_FRED_API_KEY`) 기존 구조 유지

## 2026-05-30

- Vercel·Supabase 연결 복구(URL·Publishable 키, Redeploy), 로컬 `.env` 동기화(`setup:finish`)
- 가입 실패 `email rate limit exceeded` → Supabase `mailer_autoconfirm: true`, 한국어 Auth 오류·가입 완료 메시지
- 문서: `supabase-연결-복구.md`(API URL·rate limit), 배포 가이드 UI 용어 갱신
- 스크립트: `check:deploy`, `test:production`, `fix:auth-rate`, `investigate-auth-rate` 등

## 2026-05-18

- AlphaLog 브랜딩, 로그인·사이드바, 매매 기록 폼(공통 금액·태그 행 저장), 마이그레이션 003, 로그인 로고/카피, `index.css` `@layer base`로 Tailwind margin 정상화.
- 후속: README에 Supabase 마이그레이션 순서(001→003) 명시·AlphaLog README 제목, `NewTrade` 전략 칩 Tailwind 명시 클래스, 위키/`docs/log` 핸드오프 링크, `package-lock.json` name `alphalog` 정렬.
- 배포·Auth: 초보 배포 문서(URL·env·Preview·비번 재설정), 로그인 UI 단순화+실패 후 비번 찾기, Supabase 재설정 플로, 네트워크 오류 한글 안내, PWA 캐시 완화, Playwright 배포 스냅샷 스크립트. **VITE URL은 `.supabase.co` 루트만**(Data API `/rest/v1/` 금지).
