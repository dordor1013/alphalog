# Supabase 연결 안 됨 (Failed to fetch / 서버와 연결할 수 없습니다)

로그인 화면에 **서버와 연결할 수 없습니다** 또는 **Failed to fetch** 가 나오면, AlphaLog가 **Supabase**에 닿지 못하는 상태입니다.

## 1. 원인 확인 (PC에서)

```bash
npm run check:deploy
```

- **로컬 .env** 와 **Vercel 빌드**의 `*.supabase.co` 호스트가 **다르면** → Vercel 환경 변수를 로컬과 **같은 프로젝트**로 맞춘 뒤 Redeploy.
- **DNS 없음 / ENOTFOUND** → 해당 Supabase 프로젝트가 **삭제**되었거나 URL이 틀림. 대시보드에서 **살아 있는 프로젝트**의 URL·키를 다시 복사해야 합니다.

## 2. Supabase에서 값 복사 (2025~ 대시보드 기준)

예전 문서의 **「Project URL」「anon public」** 이름이 바뀌었습니다. AlphaLog에 넣을 값은 아래와 같습니다.

| Supabase 화면에 보이는 이름 | AlphaLog / Vercel 변수 | 넣을 값 |
|---------------------------|------------------------|---------|
| **API URL** (Data API 안) | `VITE_SUPABASE_URL` | `https://프로젝트ref.supabase.co` 만 (**`/rest/v1/` 없음**) |
| **Publishable key** 또는 **anon** (API Keys 안) | `VITE_SUPABASE_ANON_KEY` | 공개용 키 하나 (아래 2-2) |

### 2-1. API URL (구 Project URL)

1. [supabase.com](https://supabase.com) → 살아 있는 **AlphaLog** 프로젝트
2. 왼쪽 아래 **Project Settings** (톱니바퀴)
3. **Data API** 메뉴
4. 맨 위 **API URL** 복사 → `https://dkmbnnaeowoayewwhnmu.supabase.co` 형태

> **주의:** Integrations 등에 있는 `…/rest/v1/` 이 붙은 주소는 **쓰지 마세요.** Data API 페이지의 **API URL**만 사용합니다.

### 2-2. 공개 API 키 (구 anon public)

같은 **Project Settings**에서 **API Keys** 메뉴 (Data API와 **다른 탭**).

- **권장:** **Publishable key** (`sb_publishable_…` 로 시작) → **Copy**
- **또는:** 아래쪽 **「Legacy anon, service_role API keys」** 탭 → **anon** (`eyJ…` 로 시작하는 긴 JWT) → **Copy**

둘 중 **하나**를 `VITE_SUPABASE_ANON_KEY`에 넣으면 됩니다. **URL과 키는 반드시 같은 프로젝트 화면에서 연속으로 복사**하세요.

> **절대 넣지 말 것:** `service_role`, **Secret** (`sb_secret_…`) — 서버 전용입니다.

### 2-3. 더 빠른 방법

프로젝트 대시보드 상단 **Connect** 버튼 → 프레임워크 선택 → 표시되는 **URL + Publishable/anon key** 를 그대로 써도 됩니다.

### 2-5. `email rate limit exceeded` (가입 시)

Supabase **무료 기본 메일**은 프로젝트 전체 **시간당 약 2통**(`rate_limit_email_sent: 2`)입니다. 확인 메일을 켜 두면(`mailer_autoconfirm: false`) 가입·재시도가 금방 한도에 걸립니다.

**조치 (관리자):**

```bash
npm run fix:auth-rate
```

- `mailer_autoconfirm: true` → 확인 메일 없이 가입 완료(다른 사람 가입에 유리)
- 나중에 SMTP 연결 후 확인 메일을 다시 켤 수 있음

### 2-6. 가입 확인 메일 링크 (localhost 연결 거부)

메일의 **Confirm email** 링크가 `localhost`로 가면:

- **로컬에서 가입** (`npm run dev` 주소): 확인 전에 터미널에서 `npm run dev` 실행 → 브라우저에서 `http://localhost:5173` 접속 가능한 상태에서 링크 클릭
- **Vercel에서 가입**: Supabase **Authentication → URL Configuration**에 배포 주소 추가  
  - Site URL: `https://내앱.vercel.app`  
  - Redirect URLs: `https://내앱.vercel.app`, `https://내앱.vercel.app/**`, (개발용) `http://localhost:5173`, `http://localhost:5173/**`  
  - 저장 후 **다시 회원가입**하거나 Supabase **Authentication → Users**에서 해당 사용자에게 확인 메일 재발송

### 2-7. DB 마이그레이션

새 프로젝트면 SQL Editor에서 `supabase/migrations/` **001 → 002 → 003** 순서 실행.

## 3. 로컬 `.env` 수정

```env
VITE_SUPABASE_URL=https://여기프로젝트ref.supabase.co
VITE_SUPABASE_ANON_KEY=여기_anon_키
```

저장 후 `npm run dev` 로 로컬 로그인 테스트.

## 4. Vercel에 **같은 값** 넣기

1. [vercel.com](https://vercel.com) → AlphaLog 프로젝트 → **Settings → Environment Variables**
2. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가 또는 수정
3. **Production** + **Preview** 체크 → Save
4. **Deployments** → 최신 배포 **⋯ → Redeploy**

## 5. Supabase Auth URL

**Authentication → URL Configuration**

- **Site URL**: `https://alphalog-virid.vercel.app` (본인 Vercel 주소)
- **Redirect URLs**: 같은 주소 + `https://…vercel.app/**`

## 6. 다시 확인

- 시크릿 창에서 Vercel 주소 접속 → 회원가입/로그인
- `npm run check:deploy` 에서 URL 일치·health OK
