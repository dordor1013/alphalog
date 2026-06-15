# Session Handoff

> Created: 2026-06-15  
> AlphaLog를 웹+Supabase → 오프라인 단독 APK로 전환 완료. CI 빌드 성공.

## 내가 할 일 (다음 세션 시작 시 이 섹션을 맨 먼저 보여줄 것)

코딩 몰라도 되는 것부터 순서대로:

1. [ ] **APK 설치** — https://github.com/dordor1013/alphalog/releases/tag/latest 에서 `AlphaLog.apk` 받아 폰에 설치
2. [ ] **앱 테스트** — 매매 기록 1건, 공모주 1건 입력 → 앱 껐다 켜서 데이터 유지 확인
3. [ ] **백업 연습** — 설정 → 데이터 내보내기 (JSON 저장해 두기)
4. [ ] **Vercel 프로젝트 삭제** — https://vercel.com → `alphalog` 프로젝트 → Delete Project (웹 더 이상 안 씀)
5. [ ] **Supabase 프로젝트 삭제** — https://supabase.com/dashboard → AlphaLog 프로젝트 → Delete (앱 데이터는 폰에만 있음)
6. [ ] **PC `.env` 파일 삭제** — `c:\dev\AlphaLog\.env` (Supabase 키 들어 있음, 앱은 안 씀)
7. [ ] **북마크 정리** — `https://alphalog-virid.vercel.app` 북마크 삭제

> APK 업데이트는: 코드 수정 → GitHub push → 5~10분 후 Releases에서 새 APK 받아 **덮어쓰기 설치**

## Context

- **AlphaLog** = 혼자 쓰는 오프라인 Android 앱. 로그인·인ternet·서버 없음.
- 데이터: 폰 로컬 `@capacitor/preferences` (`src/lib/localdb.ts`)
- APK 빌드: GitHub Actions → Release **`latest`** → `AlphaLog.apk`
- 최신 APK 빌드: **성공** (Node 22, Java 21, 고정 키스토어 서명)

## Open Items (개발/에이전트용)

- [ ] 웹 잔여물 정리 커밋 반영됨 (supabase/, guides/, handoff 아카이브 삭제 등) — push 후 확인
- [ ] 폰 실사용 후 UI/버그 피드백
- [ ] (선택) 사이드바 `lg:` 레이아웃을 모바일 전용으로 더 단순화

## Key Decisions Made

- 웹·Supabase·다중 사용자 **포기** → APK 단독 + 로컬 저장
- GitHub Actions 무료 빌드 + Release `latest`로 APK 배포
- 덮어쓰기 설치 시 데이터 유지: 고정 `alphalog-release.keystore` (레포에 커밋됨)
- 경제지표 탭 제거, 기존 Supabase 데이터는 새로 시작(마이그레이션 없음)

## Files to Review

- `src/lib/localdb.ts` — 로컬 저장·백업
- `src/store/useStore.ts` — CRUD
- `.github/workflows/android.yml` — APK CI
- `android/app/build.gradle` — 버전·서명
- `README.md` — APK 사용법

## Notes for Next Session

- **session-start 시**: 위 「내가 할 일」7개를 사용자에게 **맨 먼저** 체크리스트로 보여줄 것.
- `.env`는 gitignore — 절대 커밋하지 말 것.
- Commits (APK 전환): `db474bd` … `8c327eb` (CI fix 포함)
