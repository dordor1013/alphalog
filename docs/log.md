# Session log

## [2026-05-18] session | AlphaLog 브랜딩, 폼·여백·CSS 레이어, trade_options 마이그레이션

- AlphaLog 리네임, 로고 `public/images/logo.png`, Auth·사이드바 반영.
- 로그인 서브카피: 나만의 초과수익(α) 매매 일지.
- `index.css` 글로벌 스타일 `@layer base` 이관으로 Tailwind margin 유틸 복구.
- NewTrade: 1주당 가격·수량·총액, 기준 다중 선택 + 태그 행 저장 패턴.
- 마이그레이션 `003_trade_options_tag_rows.sql` 추가.
- 경제지표·설정·대시보드·매매일지 등 여백 조정, Select/날짜 입력 패딩.

상세: `docs/handoff-2026-05-18.md`
