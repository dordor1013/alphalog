# Session Handoff

> Created: 2026-05-30  
> 옵션·Auth·대시보드 수익률·공모주 노트·Vercel 배포까지 한 세션.

## Context

- **AlphaLog** PWA: `https://alphalog-virid.vercel.app` (Vercel + Supabase `dkmbnnaeowoayewwhnmu`)
- 로컬·프로덕션 Supabase 키 정렬됨; Auth `mailer_autoconfirm: true`
- DB 마이그레이션 **001~005** 원격 적용됨 (`strategies`, `trades`, `trade_options`, `ipo_records`)
- 이후 기능은 **`main` push → Vercel 자동 배포** 로 진행 (사용자 요청)

## Open Items

- [ ] `.env` / Vercel에 `VITE_FRED_API_KEY` 넣으면 경제지표 탭 데이터 표시 (Investing.com 연동은 **보류**)
- [ ] 신규 사용자 E2E: 가입 → 매매 저장 → 공모주 노트 저장 (프로덕션에서 한 번 확인)
- [ ] `npm run db:migrate`는 001 재실행 시 policy 중복 에러 — **신규만** `005` 등 단독 적용 패턴 유지

## Key Decisions Made

- **Investing.com**: 공식 API·스크래핑 없음 → FRED 유지, 경제지표 확장은 나중에
- **누적 수익률**: 시세 없이 매매일지 **실현손익** 기준; 전체 탭은 KRW/USD 분리 표시
- **공모주**: `PENDING` / `WON` / `LOST` — **당첨만** 배정가·매도·수익률; 미당첨·대기는 청약일·상장일만
- **Auth**: API 키 변경 시 localStorage 세션 fingerprint로 정리; 비밀번호는 설정에서 변경

## Files to Review

- `src/pages/IpoNotes.tsx` — 공모주 UI·당첨 분기
- `src/lib/returns.ts` — 대시보드 기간별 수익률
- `src/lib/ipo.ts` — `ipoFormToRow`, `validateIpoForm`
- `src/store/useStore.ts` — trades/strategies/ipo CRUD
- `supabase/migrations/004_ipo_records.sql`, `005_ipo_allotment_schedule.sql`
- `scripts/apply-migrations.mjs`, `scripts/admin-reset-password.mjs`

## Notes for Next Session

- 임시 비밀번호 재설정은 `node scripts/admin-reset-password.mjs 이메일` (`.env`에 `SUPABASE_ACCESS_TOKEN`)
- 공모주 추가 필드(청약 증권사별 수량, 환매 등) 요청 시 `005` 이후 마이그레이션
- Commits (이번 세션 후속): `6320205`, `4de3760`, `7b84108`, `b19138a`, `698baa7`
