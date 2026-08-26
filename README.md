# 🎁 funnyText - 3D 인터랙티브 비밀 선물상자 텍스트

인스타그램 릴스 및 카카오톡 밈으로 화제가 된 **선물상자 오픈 텍스트 웹 애플리케이션**입니다.
친구에게 질문에 대한 답변(예: *"중국집 뭐먹을래? ➔ 난 짬뽕"*, *"돈 갚아라"*, *"칼퇴합니다"*)을 비밀 선물상자 링크로 보낼 수 있습니다.

---

## ✨ 핵심 기능

1. **🔒 별도 DB 없이 100% 동작 (Zero-DB)**
   - `LZ-String` 압축 + `Web Crypto` 암호화 알고리즘을 통해 모든 데이터가 URL 해시(`56b900a9...`)에 안전하게 패킹됩니다.
   - 서버 유지비 0원, 데이터베이스 구축 불필요, 영구 보존.

2. **🙈 완벽한 스포일러 방지 (URL 텍스트 노출 0%)**
   - URL 상에 평문 텍스트나 파라미터가 노출되지 않고 난독화된 16진수 해시 토큰으로만 표시됩니다.
   - 카카오톡/인스타그램에 링크를 공유해도 미리보기 카드에는 *"🎁 선물이 도착했습니다! 눌러서 선물상자를 열어보세요"* 문구만 표시되어 열어보기 전까지 내용을 절대 알 수 없습니다.

3. **🎨 Three.js 3D 선물상자 & 한글 텍스트 베이킹**
   - Three.js 3D 선물상자 (몸체, 뚜껑, 리본, 매듭, 반짝임 파티클).
   - 3D 텍스트 보드 실시간 Canvas 2D 텍스처 베이킹으로 깨짐 없이 선명한 한글 렌더링 지원.
   - **3단계 오픈 연출**: 덜덜 떨리는 진동(드럼롤 🥁) ➔ 뚜껑 오픈(펑! 💥) ➔ 폭죽 파티클(🎉)과 함께 텍스트 보드 팝업!

4. **🔊 무의존 Web Audio API 자체 신디사이저**
   - 외부 사운드 파일 다운로드 없이 브라우저 자체 Web Audio API로 드럼롤, 808 붐 베이스 드롭, 승리의 팡파레, 짜잔 효과음을 지연 없이 합성 재생합니다.

5. **📱 모바일 최적화 & 공유 기능**
   - 원클릭 클립보드 복사
   - Web Share API (카카오톡, 문자, 인스타 공유 연동)
   - 오프라인/PC-모바일 즉시 스캔용 QR 코드 자동 생성
   - 인기 밈 프리셋 템플릿 제공

---

## 🚀 로컬 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 시작
npm run dev

# 3. 브라우저에서 접속
# http://localhost:5173
```

---

## ☁️ Cloudflare Pages 배포 방법

본 프로젝트는 정적 SPA 빌드 및 Cloudflare Pages 리다이렉트(`public/_redirects`) 설정이 완료되어 있습니다.

### 방법 1: Cloudflare 대시보드 (Git 연결 - 권장)
1. GitHub 저장소에 코드를 푸시합니다.
2. [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)에 로그인합니다.
3. **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**을 선택합니다.
4. 빌드 설정을 아래와 같이 입력합니다:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Save and Deploy**를 누르면 끝!

### 방법 2: Wrangler CLI로 직접 배포
```bash
# 빌드
npm run build

# Cloudflare Pages에 배포
npx wrangler pages deploy dist --project-name funny-text
```

---

## 🛠️ 프로젝트 구조

```
funnyText/
├── public/
│   ├── _redirects       # Cloudflare Pages SPA 라우팅 설정
│   └── favicon.svg      # 3D 선물상자 파비콘
├── src/
│   ├── components/
│   │   ├── GiftBox3D.tsx    # Three.js 3D 선물상자 & 연출 엔진
│   │   └── ShareModal.tsx   # 링크 복사, QR 코드, 카톡 미리보기 모달
│   ├── lib/
│   │   ├── audio.ts         # Web Audio API 실시간 사운드 신디사이저
│   │   ├── confetti.ts      # Canvas Confetti 폭죽/돈다발/하트 효과
│   │   └── crypto.ts        # Zero-DB URL 압축 & 암호화 인코더/디코더
│   ├── pages/
│   │   ├── CreatorPage.tsx  # 설정/제작 화면 (실시간 3D 프리뷰 & 템플릿)
│   │   └── ViewerPage.tsx   # 수신자용 보는 화면 (3D 상자 오픈 인터랙션)
│   ├── types/
│   │   └── index.ts         # 테마, 사운드, 페이로드 타입 정의
│   ├── App.tsx              # URL Hash & Path SPA 라우터
│   ├── index.css            # Tailwind CSS & 애니메이션 스타일
│   └── main.tsx
├── package.json
└── vite.config.ts
```
