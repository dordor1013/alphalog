# AlphaLog

국내·미국 주식 **매매일지 & 공모주 기록** 앱. 혼자 쓰는 **오프라인 단독 Android 앱(APK)** 으로, 모든 데이터는 폰 안에만 저장됩니다. 로그인·서버·인터넷 연결이 필요 없습니다.

## 기능

- 매매 기록(국내/미국, 매수/매도, 다중 매매 기준)과 보유 종목·평가금액
- 대시보드: 일·주·월·년 누적 실현 수익률, 종목별 비중
- 공모주 노트: 청약/상장일, 당첨·미당첨·대기, 당첨 시 배정가·매도·수익률
- 설정: 매매 기준 옵션 편집, 데이터 백업(내보내기/가져오기)

## 데이터 저장

- 데이터는 **Capacitor Preferences**(폰 로컬 저장소)에만 저장됩니다.
- 클라우드가 없으므로 **설정 → 데이터 백업**에서 주기적으로 JSON으로 내보내 두세요.
- 같은 키로 서명된 APK를 **덮어쓰기 설치**하면 데이터가 유지됩니다 (아래 빌드 참고).

## 개발 (웹 미리보기)

```bash
npm install
npm run dev
```

`http://localhost:5173` 에서 브라우저로 확인할 수 있습니다 (웹에서는 Preferences가 localStorage로 동작).

## APK 만들기 (GitHub Actions, 무료)

로컬에 Android Studio/JDK를 설치할 필요 없이 GitHub Actions가 APK를 빌드합니다.

1. **저장소 설정 → Actions → General → Workflow permissions** 에서 **Read and write permissions** 를 켭니다. (서명 키스토어를 처음 한 번 자동 커밋하기 위해 필요)
2. `main` 브랜치에 코드를 push 합니다.
3. **Actions** 탭에서 `Build Android APK` 워크플로가 끝나면, 저장소 **Releases → latest** 의 `AlphaLog.apk` 를 폰에서 내려받아 설치합니다.
4. 처음 설치 시 "출처를 알 수 없는 앱" 설치를 허용해야 할 수 있습니다.

### 기능 업데이트

코드를 고쳐 `git push` 하면 몇 분 뒤 Release의 `AlphaLog.apk` 가 갱신됩니다. 폰에서 다시 받아 **기존 앱 위에 덮어쓰기 설치**하면 데이터가 그대로 유지됩니다.

### 서명에 대해

- 첫 빌드 때 워크플로가 `android/app/alphalog-release.keystore` 를 생성해 저장소에 커밋합니다.
- 이후 모든 빌드가 같은 키로 서명되어 덮어쓰기 설치가 가능합니다. (개인용이라 키스토어를 저장소에 두는 방식)

### 로컬 빌드 (선택, Android Studio 필요)

```bash
npm run cap:sync      # 웹 빌드 + Capacitor 동기화
npm run android:open  # Android Studio로 열기
```

## 기술 스택

- React + Vite + TypeScript
- Tailwind CSS v4
- Capacitor (Android 패키징 + Preferences 로컬 저장)
- Recharts (차트) · Zustand (상태관리)
