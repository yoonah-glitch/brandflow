# Brandflow

브랜딩 스튜디오를 위한 인스타그램 게시물 이미지 생성 툴입니다.
작업물(명함·로고 등) 사진의 배경을 브라우저에서 자동으로 제거하고,
무드에 맞는 배경 4종에 합성해 바로 올릴 수 있는 이미지를 만들어줍니다.

**모든 처리는 브라우저 안에서 이루어지며, 이미지는 서버로 전송되지 않습니다.**

## 기능

1. 작업물 사진 업로드 (드래그앤드롭 + 클릭)
2. 브라우저에서 누끼 자동 추출 ([@imgly/background-removal](https://github.com/imgly/background-removal-js))
3. 무드 태그 선택 — 미니멀 / 내추럴 / 다크 / 럭셔리 / 비비드
4. 무드별 **스튜디오 배경 4종**에 **3D 느낌으로 합성**
   (그라디언트 깊이 + 소프트 조명 + 보케 + 필름 그레인 + 비네트, 접지 그림자·반사·방향 그림자)
5. **사이즈 선택** — Instagram·Facebook·X·YouTube·Pinterest 프리셋 + **가로×세로 자유 입력**
6. 합성 이미지 PNG 개별 다운로드 (`{mood}_{width}x{height}_{번호}.png`)

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- @imgly/background-removal (누끼 추출, WASM)
- Canvas API (리사이즈 + 스튜디오 씬 렌더링 + 3D 합성)

## 시작하기

```bash
npm install      # 의존성 설치 + 모델 에셋을 public/models 로 자동 복사(postinstall)
npm run dev      # 개발 서버 (http://localhost:3000)
```

프로덕션 빌드:

```bash
npm run build
npm run start
```

## Vercel 배포

이 저장소를 Vercel 에 **GitHub 연동(Import)** 으로 올리면 자동 배포됩니다.

1. [vercel.com/new](https://vercel.com/new) → GitHub 계정 연결 → `brandflow` 저장소 Import
2. 배포할 브랜치를 `claude/instagram-post-generator-5d7fu6`(또는 병합 후 기본 브랜치)로 선택
3. Framework 는 자동으로 **Next.js** 로 감지됨 — 별도 설정 없이 Deploy
4. 완료되면 `https://<프로젝트>.vercel.app` URL 발급

배포 시 모델은 `.env.production` 에 지정된 **imgly CDN** 에서 로드되므로
200MB 모델을 배포 산출물에 싣지 않습니다. (`postinstall` 의 로컬 복사는
Vercel 빌드에서 자동으로 건너뜀 — `scripts/copy-models.mjs` 의 `VERCEL` 가드)

> 모델까지 완전 self-host 로 배포하려면 `.env.production` 의
> `NEXT_PUBLIC_IMGLY_PUBLIC_PATH` 를 지우고, 빌드 환경변수에서 `SKIP_MODEL_COPY`
> 를 설정하지 않으면 됩니다. (배포 용량이 200MB 커집니다)

## 모델 에셋 (self-hosting)

누끼 추출 모델은 기본적으로 imgly CDN 에서 내려받지만, 이 프로젝트는
`publicPath` 옵션으로 **자체 호스팅**하도록 구성돼 있습니다.

- 실제 모델 파일은 `@imgly/background-removal-data` 패키지의 `dist` 에 들어있습니다.
- `npm install` 시 `postinstall` 훅(`scripts/copy-models.mjs`)이 해당 파일들을
  `public/models/` 로 복사합니다. (Next.js 에서 `/models/` 경로로 서빙됨)
- 수동으로 다시 복사하려면: `npm run setup:models`

> `public/models` 는 용량이 커서(약 200MB) 저장소에 커밋하지 않습니다.
> `.gitignore` 로 제외되며 `npm install` 때마다 자동 생성됩니다.

CDN 등 다른 경로를 쓰고 싶다면 환경변수로 재정의할 수 있습니다:

```bash
# 예: imgly CDN 사용
NEXT_PUBLIC_IMGLY_PUBLIC_PATH=https://staticimgly.com/@imgly/background-removal-data/1.4.5/dist/
```

## 프로젝트 구조

```
app/
  layout.tsx          # 루트 레이아웃 / 메타데이터
  page.tsx            # 메인 페이지 (업로드→누끼→무드→사이즈→결과 오케스트레이션)
  globals.css
components/
  ImageUploader.tsx   # 드래그앤드롭 업로드 + 진행률 + 에러/재시도
  MoodSelector.tsx    # 무드 선택
  SizeSelector.tsx    # 사이즈 프리셋 + 커스텀 가로×세로 입력
  ResultGrid.tsx      # 결과 2열 그리드 + 다운로드
lib/
  backgrounds.ts      # 무드별 스튜디오 씬 스펙(그라디언트/블룸/보케/그레인/비네트)
  sizes.ts            # 사이즈 프리셋 + 커스텀 사이즈 유틸
  canvasUtils.ts      # 씬 렌더링 + 3D 합성(그림자/반사/조명) + 파일명
  imageUtils.ts       # 유효성 검사 + 리사이즈 + 브라우저 지원 체크
scripts/
  copy-models.mjs     # 모델 에셋 복사(postinstall)
public/models/        # 자동 생성되는 모델 에셋 (gitignore)
```

## 주요 구현 노트

- `@imgly/background-removal` 와 Canvas API 는 `'use client'` 컴포넌트에서만 사용합니다.
- 누끼 추출 라이브러리는 `dynamic import`(`await import(...)`)로 로드해 SSR 을 피합니다.
- 업로드 이미지는 처리 전 긴 변 기준 **최대 2000px** 로 리사이즈합니다.
- `next.config.js` 에 WASM/Node 코어 모듈 fallback webpack 설정을 추가해 Vercel 배포에 대응합니다.

## 무드별 스튜디오 배경 (씬 4종)

단색/평면이 아니라 캔버스로 그라디언트·조명·질감을 합성한 "스튜디오 씬"입니다.

| 무드 | 씬 특징 |
| --- | --- |
| 미니멀 | 오프화이트 그라디언트 + 부드러운 상단광 + 미세 그레인 |
| 내추럴 | 베이지·그린 그라디언트 + 따뜻한 자연광 블룸 |
| 다크 | 차콜 그라디언트 + 피사체 뒤 스포트라이트 + 강한 비네트 + 그레인 |
| 럭셔리 | 딥블랙→골드 그라디언트 + 골드 보케 + 림라이트 |
| 비비드 | 파스텔 그라디언트 + 컬러 보케 |

각 씬 위에 **접지 그림자 + 반사 + 방향성 드롭섀도**를 얹어 입체감을 만듭니다.

## 실사 배경을 쓰고 싶다면

핀터레스트 등에서 이미지를 가져와 번들하는 것은 저작권 문제로 지원하지 않습니다.
대신 **Unsplash / Pexels API**(상업적 사용 가능, 무료 API 키)를 붙여 런타임에 실제
사진을 무드별로 불러오도록 확장할 수 있습니다. (선택 사항)
