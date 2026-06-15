# AlphaLog — Wiki index

- [Changelog](changelog.md) — 날짜별 요약
- [배포하기 (초보자 단계별)](../guides/배포하기-초보자용.md)
- 최근 핸드오프: [진행중](../handoff.md) · [2026-05-30](../handoff-2026-05-30.md)
- [Supabase 연결·가입 오류 복구](../guides/supabase-연결-복구.md)

## 주제

- 앱 브랜드: AlphaLog (오프라인 단독 Android 앱, 혼자 사용).
- 패키징: Capacitor(Android) + GitHub Actions 자동 APK 빌드 → Release `latest` 첨부.
- 저장: 폰 로컬 `@capacitor/preferences` (`src/lib/localdb.ts`). 로그인·서버 없음.
- 기능: 매매일지·공모주 노트·대시보드 수익률·설정(매매 기준 옵션·데이터 백업).
- 참고: 2026-06-15 세션에서 Supabase·로그인·경제지표 제거. 이전 Supabase 마이그레이션은 `supabase/`에 히스토리로만 남음.
