# AlphaLog

주식 매매일지 PWA 웹앱 (**AlphaLog**). 국내·미국 주식 매매 기록과 포트폴리오를 관리합니다.

## 설정

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 무료 프로젝트를 생성합니다.
2. **SQL Editor**에서 아래 순서대로 마이그레이션 파일을 실행합니다 (`supabase/migrations/`).
   - `001_initial_schema.sql` — 초기 스키마
   - `002_unlimited_options.sql` — 옵션 번호 제한 완화
   - `003_trade_options_tag_rows.sql` — 복수 기준 선택 시 `quantity >= 0` (태그 행)
3. **Project Settings → API**에서 URL과 anon key를 복사합니다.

신규 DB가 아니라면 이미 적용된 스크립트는 건너뛰고, **아직 없는 변경만** 실행하면 됩니다. `003`이 없으면 여러 매매 기준 선택 시 저장이 거절될 수 있습니다.

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 Supabase URL과 anon key를 입력합니다.

### 3. 외부 API 키 (선택)

- **FRED API**: [fred.stlouisfed.org](https://fred.stlouisfed.org)에서 무료 API 키 발급 (경제지표)

### 4. 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 **LAN(같은 Wi‑Fi)에서 접속 가능**하도록 설정되어 있습니다. 터미널에 `Network: http://192.168.x.x:5173/` 주소가 표시되면, **PC와 핸드폰이 같은 Wi‑Fi**에 연결한 뒤 핸드폰 브라우저에서 그 주소로 접속하세요.

`localhost`와 `127.0.0.1`은 **폰에서 접속할 수 없습니다** (내 PC 안쪽 주소이기 때문입니다).

이메일 인증 등 Supabase Auth 리다이렉트를 쓰는 경우, Supabase 대시보드 **Authentication → URL Configuration**에 `http://192.168.x.x:5173` 형태의 주소를 **Redirect URLs**에 추가해야 할 수 있습니다.

### 5. 다른 사람에게 공개해서 쓰게 하기 (배포)

- **처음 배포한다면**: 아래 초보자용 가이드를 **위에서부터 순서대로** 따라 하면 됩니다.  
  → [배포하기-초보자용](./docs/guides/배포하기-초보자용.md)

아래는 요약입니다.

앱과 DB 설계상 **계정별로 데이터가 분리**되어 있습니다(RLS). **하나의 Supabase 프로젝트**만 두고, 웹 프론트만 공개 호스팅하면 여러 사용자가 같은 주소에서 가입·로그인해 쓸 수 있습니다.

1. **GitHub 등에 저장소 올리기** (민감 정보는 올리지 않기: `.env`, API 키).
2. **정적 호스팅 연결** (예: [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), Cloudflare Pages).  
   이 저장소는 `public/_redirects`(Netlify)와 `vercel.json`(Vercel)으로 SPA 새로고침 시에도 라우팅이 동작하도록 맞춰 두었습니다.
3. 빌드 설정 예시  
   - **Build command**: `npm run build`  
   - **Output directory**: `dist`
4. 호스팅 대시보드에 **환경 변수** 추가 (프로덕션):  
   - `VITE_SUPABASE_URL`  
   - `VITE_SUPABASE_ANON_KEY`  
   - (선택) `VITE_FRED_API_KEY` — 없으면 경제지표만 비어 있거나 오류 처리됩니다.
5. **Supabase** 대시보드 → **Authentication → URL Configuration**
   - **Site URL**: 배포 도메인 (예: `https://your-app.vercel.app`)
   - **Redirect URLs**에 같은 도메인과 와일드카드 허용이 필요하면 `https://your-app.vercel.app/**` 추가  
   로컬 개발도 쓸 거면 기존처럼 `http://localhost:5173` 등도 함께 넣어 둡니다.
6. 배포 후 **공개 URL**을 알려 주면 사용자는 그 주소로 접속해 회원가입·로그인하면 됩니다.

**참고**: 완전 오픈 SaaS처럼 “누구나 가입”을 막고 싶다면 Supabase Auth 설정(예: 이메일 도메인 제한·수동 초대 등)은 별도 정책이 필요합니다. 기본은 이메일/비번 공개 회원가입에 가깝습니다.

## 기술 스택

- React + Vite + TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL)
- Recharts (파이차트)
- Zustand (상태관리)
- PWA (오프라인 지원)
