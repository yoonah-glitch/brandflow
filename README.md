# 다시 (DASI)

> **지친 당신이 다시 시작하는 곳**

지치고 힘든 마음을 조용히 읽어주고, 지금 이 마음에 꼭 맞는 것 하나를 건네주는
멀티 서비스 브랜드예요. 화려하지 않고, 따뜻하고, 명조체의 조용한 책 느낌.
모바일 우선(최대 480px), 베이지/크림 팔레트.

첫 번째 서비스는 **다시, 책** 입니다.

## 서비스 (확장형)

| 서비스 | 상태 |
| --- | --- |
| 📖 **다시, 책** | ✅ 이용 가능 |
| 🎧 다시, 음악 | 곧 만나요 |
| 🎬 다시, 영화 | 곧 만나요 |
| 🌿 다시, 산책 | 곧 만나요 |

서비스는 `lib/services.ts` 레지스트리로 관리됩니다. 새 서비스를 추가하려면
배열에 항목을 하나 더 넣고(`status:"active"` + `href`) 해당 라우트 폴더
(예: `app/music/`)를 만들면 됩니다. `다시, 책`은 `app/book/` 아래에 있습니다.

---

## 다시, 책 — 동작 방식

### 3단계 플로우 (`app/book/page.tsx`)

1. **지금 어떤 상황이에요?** — 복수 선택 (연애/가족/상실/직장·학교/무기력 …)
2. **책이 어떻게 해줬으면 해요?** — 단일 선택 (고르면 자동으로 다음 단계)
3. **마지막으로 읽은 책은?** — 자유 입력 (건너뛰기 가능)

각 단계에 뒤로가기 · `1/3` 진행률. 완료 시 답변을 localStorage 에 저장하고
`/book/result` 로 이동합니다. 저장 형태: `{ situations: string[], want: string, lastBook: string }`.

### 결과 (`app/book/result/page.tsx` + `/api/recommend`)

- 조용한 로딩 문구가 약 1.8초 교체되는 동안 추천을 불러옵니다.
- `/api/recommend` (Claude 또는 무료 모드 샘플) → `/api/aladin` (표지·판매가·구매링크)
- 결과 화면 구성
  1. **감정 언어화** — 지금의 마음을 2줄로 시적으로 비춰줍니다 ("지금 당신은…")
  2. **책 소개** — "이 책 속 주인공이 딱 그랬어요" + 표지 + 제목/저자 (표지 없으면 베이지 자리표시)
  3. **첫 페이지 분위기** — 한 줄의 조용한 인용
  4. 매치 % · 두께(●●●○○)를 은은하게
  5. **구매 버튼** — 알라딘 / 쿠팡
  6. **결과 카드 저장** — 공유용 카드 이미지 다운로드 (베이지 팔레트)
  7. **다음날 체크인** — "내일 밤, 다시 안부를 물어봐도 될까요?"
- 재추천: `이 책 말고 다른 책`(무료) / `새로 추천받기`(남은 횟수 차감, 기본 월 3회)
- 하단에 쿠팡 파트너스 고지 문구 (결과 화면에만)

> ⚠️ **다음날 체크인**은 브라우저 알림 권한 요청 + localStorage 플래그까지의
> **UI 레벨 설정**입니다. 실제 예약 푸시 알림은 백엔드(스케줄러 + 푸시 서버)가 필요합니다.

### 구독 (`app/subscribe/page.tsx`)

- 무료: 월 3회
- **다시 구독 6,900원/월** — 다시, 책 무제한 · 매일 밤 체크인 · 월간 감정 독서 리포트 ·
  감정 책장 · 나중에 음악/영화/산책 추가 시 자동 포함
- 구독 버튼 → "준비 중입니다" 모달 (결제는 UI 전용, 실제 결제 없음)

---

## 무료 모드 (핵심)

**`ANTHROPIC_API_KEY` 가 없어도 앱이 완전히 동작합니다.**
키가 비어 있으면 `/api/recommend` 는 에러 대신 실제 존재하는 한국 책 4권 중
하나를 샘플로 돌려줍니다(비용 0). 키가 있으면 Claude(`claude-sonnet-4-6`)가
실제 추천을 생성합니다. 표지·판매가·구매링크는 알라딘 API(기본 TTB 키 내장)로
가져오며, 실패해도 표지 없이 안전하게 진행됩니다.

이 덕분에 **API 키 없이 바로 배포해도** 그대로 쓸 수 있어요.

---

## 기술 스택

- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**
- 폰트: **Nanum Myeongjo** (명조 세리프)
- **Anthropic Claude API** — 모델 `claude-sonnet-4-6` (선택, 없으면 무료 모드)
- **알라딘 Open API** — 표지·판매가·제휴 구매링크
- **Vercel** 배포 준비 (`vercel.json` — `/api/recommend` maxDuration 60s)

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값은 비워둬도 무료 모드로 동작
npm run dev                  # http://localhost:3000
```

프로덕션 빌드:

```bash
npm run build && npm run start
```

## 환경변수 (`.env.example`)

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | 선택 | Claude API 키. 비우면 무료 모드(샘플 추천) |
| `ALADIN_TTB_KEY` | 선택 | 알라딘 TTB 키. 코드에 기본값(`ttbya07361549001`) 내장 |
| `NEXT_PUBLIC_COUPANG_ID` | 선택 | 쿠팡 파트너스 ID. 기본값 `AF8666448` |
| `NEXT_PUBLIC_BASE_URL` | 선택 | 서비스 기본 URL |

`ANTHROPIC_API_KEY`, `ALADIN_TTB_KEY` 는 서버 라우트에서만 사용되어 브라우저로
노출되지 않습니다. `NEXT_PUBLIC_` 접두사 변수만 클라이언트에 노출됩니다.

## Vercel 배포

1. GitHub 에 푸시 → [vercel.com/new](https://vercel.com/new) 에서 Import
2. Framework 는 **Next.js** 자동 감지
3. (선택) **Settings → Environment Variables** 에 위 변수 추가
   - 아무것도 넣지 않아도 무료 모드로 배포됩니다.
4. **Deploy**

## 프로젝트 구조

```
app/
  layout.tsx              # 브랜드 셸 / 메타데이터 / 480px 컨테이너 / 고정 헤더
  globals.css             # Tailwind + 베이지 팔레트 CSS 변수 + 애니메이션
  page.tsx                # 메인 랜딩 (슬로건 + 서비스 그리드 + 시작하기)
  book/page.tsx           # 다시, 책 — 3단계 플로우
  book/result/page.tsx    # 다시, 책 — 결과 (감정 언어화 · 책 · 구매 · 공유 · 체크인)
  subscribe/page.tsx      # 다시 구독 (UI 전용)
  api/
    recommend/route.ts    # 추천 (Claude, 무료 모드 샘플 폴백)
    aladin/route.ts        # 알라딘 검색 (표지·판매가·구매링크)
components/
  DasiLogo.tsx            # "다시" 명조 워드마크
  BrandHeader.tsx         # 모든 화면 상단 고정 헤더
  ServiceCard.tsx         # 서비스 타일 (active/soon)
  Chip.tsx                # 선택 칩
  ProgressBar.tsx         # 3단계 진행률 바
lib/
  services.ts             # 서비스 레지스트리 (확장 지점)
  bookSteps.ts            # 3단계 정의 · 로딩 문구
  types.ts               # 공용 타입 · localStorage 키 · 무료 횟수
  affiliate.ts            # 알라딘 · 쿠팡 구매 링크
  shareCard.ts            # 공유 카드 이미지(canvas) 생성/다운로드
```

## 참고

- Claude 응답은 텍스트에서 JSON(첫 `{` ~ 마지막 `}`)을 추출해 파싱하며,
  `match`(85–99) · `thickness`(1–5) 는 안전 범위로 보정합니다.
- 존재하지 않는 책 추천을 막는 시스템 프롬프트가 적용되어 있으나,
  LLM 특성상 드물게 부정확할 수 있습니다.
- 공유 카드 생성 시 표지 이미지가 CORS 로 canvas 를 오염시키면 표지 없이
  텍스트 카드로 안전하게 대체합니다.
