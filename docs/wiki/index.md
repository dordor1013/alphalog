# AlphaLog — Wiki index

- [Changelog](changelog.md) — 날짜별 요약
- [Session log](../log.md) — 세션 기록

## 앱 개요

- **AlphaLog** — 오프라인 단독 Android 앱 (혼자 사용)
- **패키징**: Capacitor + GitHub Actions → [Releases](https://github.com/dordor1013/alphalog/releases/tag/latest) 에 APK
- **저장**: 폰 로컬 `@capacitor/preferences` (`src/lib/localdb.ts`)
- **기능**: 매매일지 · 공모주 노트 · 대시보드 수익률 · 설정(매매 기준 · 데이터 백업)

## APK 받기 / 업데이트

1. GitHub **Releases → latest** 에서 `AlphaLog.apk` 다운로드
2. 폰에 설치 (덮어쓰기 설치 시 데이터 유지)
3. 코드 수정 후 `main` push → Actions가 새 APK 빌드

자세한 사용법은 [README](../../README.md) 참고.
