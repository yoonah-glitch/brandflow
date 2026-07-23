# 📚 Bookmatch

몇 가지 질문에 답하면 **AI 큐레이터(Claude)** 가 당신의 기분·취향·상황을 분석해
지금 딱 맞는 **책 한 권**을 추천해주는 모바일 우선 웹앱입니다.

- 8단계 온보딩(한 번에 하나씩, 뒤로가기 · 스킵 지원)
- Claude 가 실제 존재하는 한국 책/번역본을 1권 추천 (매치%·추천 이유·책 온도계)
- 카카오 책 검색 API 로 표지 이미지 표시
- 예스24 구매 링크, 인스타 공유용 카드 이미지 저장, 친구 초대 보너스
- 마지막 추천 결과 localStorage 저장

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (포인트 컬러 `#534AB7`)
- **Anthropic Claude API** — 모델 `claude-sonnet-4-6`
- **카카오 책 검색 API** — 표지 이미지
- **Vercel** 배포 준비 (`vercel.json` 포함)

---

## 1. 사전 준비 — API 키 발급

### Anthropic Claude API 키

1. [console.anthropic.com](https://console.anthropic.com/) 로그인
2. **API Keys → Create Key** 로 키 발급 (`sk-ant-...`)

### 카카오 REST API 키 (책 표지용)

1. [developers.kakao.com](https://developers.kakao.com/) 로그인
2. **내 애플리케이션 → 애플리케이션 추가** 로 앱 생성
3. **앱 키 → REST API 키** 복사
4. (책 검색 API는 별도 동의 없이 REST 키만으로 호출됩니다.)

> 카카오 키가 없어도 앱은 동작합니다. 이 경우 표지 이미지 없이 제목 카드로 대체됩니다.

---

## 2. 로컬 실행

```bash
# 1) 의존성 설치
npm install

# 2) 환경변수 파일 생성 후 값 채우기
cp .env.example .env.local
#   ANTHROPIC_API_KEY=sk-ant-...
#   KAKAO_API_KEY=...
#   NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 3) 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

프로덕션 빌드 확인:

```bash
npm run build
npm run start
```

---

## 3. 환경변수

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ✅ | Claude API 키 (서버 전용, 브라우저 노출 금지) |
| `KAKAO_API_KEY` | 선택 | 카카오 REST API 키 (책 표지). 없으면 표지 없이 동작 |
| `NEXT_PUBLIC_BASE_URL` | ✅ | 서비스 기본 URL. 친구 초대 링크 생성에 사용 |

`ANTHROPIC_API_KEY`, `KAKAO_API_KEY` 는 **서버 라우트에서만** 사용되어 브라우저로
노출되지 않습니다. `NEXT_PUBLIC_BASE_URL` 만 `NEXT_PUBLIC_` 접두사로 클라이언트에
노출됩니다(초대 링크 생성용).

---

## 4. Vercel 배포

1. 이 저장소를 GitHub 에 푸시
2. [vercel.com/new](https://vercel.com/new) → GitHub 연동 → 저장소 **Import**
3. Framework 는 자동으로 **Next.js** 감지 — 기본 빌드 설정 그대로
4. **Settings → Environment Variables** 에 아래 3개 추가
   - `ANTHROPIC_API_KEY`
   - `KAKAO_API_KEY`
   - `NEXT_PUBLIC_BASE_URL` → 배포 후 발급된 `https://<프로젝트>.vercel.app`
5. **Deploy** → 완료되면 URL 발급

> `vercel.json` 에 Claude 를 호출하는 라우트(`/api/recommend`, `/api/explain`)의
> `maxDuration` 을 60초로 지정해 두었습니다.

> ⚠️ 배포 후 `NEXT_PUBLIC_BASE_URL` 값을 실제 배포 URL 로 바꾸고 재배포해야
> 친구 초대 링크가 올바르게 생성됩니다.

---

## 5. 프로젝트 구조

```
app/
  layout.tsx              # 루트 레이아웃 / 메타데이터 / 480px 모바일 컨테이너
  globals.css             # Tailwind + 전역 스타일 / 애니메이션
  page.tsx                # 메인 8단계 온보딩 (인트로 → 질문 → 결과 이동)
  result/page.tsx         # 결과 페이지 (추천 로드 · 재추천 · 로딩 문구)
  pricing/page.tsx        # 요금제 페이지 (무료/월간/연간 플랜)
  api/
    recommend/route.ts    # Claude 추천 (JSON 반환 파싱)
    book/route.ts         # 카카오 책 검색 (표지 이미지)
    explain/route.ts      # "왜 이 책인지" 추가 설명 (Claude)
components/
  Chip.tsx                # 둥근 선택 칩
  ProgressBar.tsx         # 상단 진행률 바 + 문구
  BookCard.tsx            # 추천 결과 카드 (표지·매치·이유·구매·공유·재추천)
  Thermometer.tsx         # 책 온도계 (난이도/감성/두께 ●●●○○)
  PricingPlans.tsx        # 요금제 카드 3종 + "준비 중입니다" 팝업
lib/
  types.ts                # 공용 타입 · localStorage 키 · 무료 횟수
  steps.ts                # 8단계 정의 · 진행률 문구 · 로딩 문구
  shareCard.ts            # 인스타 공유용 카드 이미지(canvas) 생성/다운로드
```

---

## 6. 동작 방식

### 온보딩 (`app/page.tsx`)

1. 요즘 기분 · 2. MBTI · 3. 인생책(스킵) · 4. 표지 취향 · 5. 읽는 장소 ·
6. 원하는 것 · 7. 싫어하는 것(복수) · 8. 최근 읽은 책(스킵)

- 단일 선택 칩은 고르면 자동으로 다음 단계로 넘어갑니다.
- 각 단계 상단에 뒤로가기 버튼과 `"3/8 단계 · 거의 다 왔어요!"` 진행률 텍스트.
- 완료 시 응답을 localStorage 에 저장하고 `/result` 로 이동.

### 추천 (`app/result/page.tsx` + `/api/recommend`)

- 온보딩 응답을 Claude(`claude-sonnet-4-6`)에 전달 → 아래 JSON 을 받아 파싱

  ```json
  {
    "title": "책제목", "author": "저자명", "reason": "추천이유",
    "match": 85, "difficulty": 3, "emotion": 4, "thickness": 2,
    "yes24_query": "예스24검색어", "kakao_query": "카카오검색어"
  }
  ```

- `kakao_query` 로 카카오 책 검색 → 표지 이미지 결합
- 로딩 중 재밌는 문구 3개가 랜덤 교체
- 결과는 localStorage 에 저장되어 새로고침해도 유지

### 재추천 규칙

- **🙈 이 책 별로예요** — 횟수 차감 **없이** 현재 책을 제외하고 다시 추천
- **🔄 다른 책 추천** — 남은 무료 횟수(기본 3회)에서 1회 차감
- **🔗 친구 초대** — 초대 링크 복사 시 추천 1회 추가
- 이미 추천한 책은 다음 추천에서 제외(중복 방지)

### 결과 카드 요소

표지 이미지 · 제목/저자 · 알라딘 판매가 · 매치 퍼센트(85–99) · 추천 이유 · 책 온도계
· "왜 이 책인지 더 알고 싶어요"(Claude 추가 설명) · **알라딘 / 쿠팡** 구매 링크
· 인스타 공유용 카드 이미지 저장 · 친구 초대 · 남은 추천 횟수 · 재추천 버튼

---

## 7. 수익화 — 제휴(어필리에이트) 링크

구매 버튼은 **알라딘 · 쿠팡** 2곳입니다. 둘 다 제휴(수수료) 링크로 동작합니다.

### 알라딘 (이미 연결됨)

- 알라딘 Open API(`/api/aladin`)가 돌려준 상품 링크(`link`)를 그대로 버튼에 연결합니다.
  이 링크에는 **TTB 키(제휴 추적)** 가 포함되어 있어 별도 설정이 필요 없습니다.
- 표지 이미지와 판매가(`priceSales`)도 이 API 에서 함께 가져옵니다.
- 키는 `ALADIN_TTB_KEY` 환경변수로 관리하며, 코드에 기본값(`ttbya07361549001`)이 있어
  비워둬도 동작합니다. 본인 키 사용을 권장합니다.

### 쿠팡 파트너스 (이미 연결됨)

파트너스 ID **`AF8666448`** 가 기본값으로 들어가 있어, 쿠팡 버튼은 아래 형식으로 열립니다.

```
https://www.coupang.com/np/search?q={책제목}&channel=user&affiliate=AF8666448
```

- 다른 ID 로 바꾸려면 환경변수만 덮어쓰면 됩니다.
  ```
  NEXT_PUBLIC_COUPANG_AFFILIATE_ID=AF8666448
  ```
- 파트너스에서 발급한 딥링크/상품 추적 URL 을 쓰고 싶으면 템플릿이 우선합니다.
  ```
  NEXT_PUBLIC_COUPANG_LINK_TEMPLATE=https://link.coupang.com/re/…&q={query}
  ```

> **고지 문구는 필수**입니다. 모든 화면 하단(푸터)에 다음 문구가 항상 표시되도록 넣어 두었습니다.
> _"이 서비스는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."_

## 8. 참고

- Claude 응답은 텍스트에서 JSON 을 추출해 파싱하며, 숫자 필드는 안전 범위로 보정합니다.
- 카카오 표지 이미지는 CORS 제약이 있을 수 있어, 공유 카드 생성 시 표지가
  canvas 를 오염시키면 표지 없이 텍스트 카드로 안전하게 대체합니다.
- 존재하지 않는 책 추천을 막기 위한 시스템 프롬프트가 적용되어 있으나,
  LLM 특성상 드물게 부정확할 수 있습니다.
