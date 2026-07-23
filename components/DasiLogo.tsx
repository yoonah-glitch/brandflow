interface DasiLogoProps {
  size?: number; // 글자 크기(px)
}

// "다시" 워드마크 — 명조 세리프 텍스트 로고 (작고 우아하게).
// 끝에 작은 클레이 점을 하나 찍어 브랜드 마크로 삼는다.
export default function DasiLogo({ size = 20 }: DasiLogoProps) {
  return (
    <span
      className="inline-flex items-baseline font-serif font-extrabold tracking-[-0.5px] text-ink"
      style={{ fontSize: size }}
      aria-label="다시"
    >
      다시
      <span
        aria-hidden
        className="ml-[3px] inline-block rounded-full bg-brand"
        style={{ width: size * 0.16, height: size * 0.16 }}
      />
    </span>
  );
}
