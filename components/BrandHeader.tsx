import Link from "next/link";
import DasiLogo from "./DasiLogo";

// 모든 화면 상단에 고정되는 브랜드 헤더. "다시" 로고를 항상 위에 둔다.
export default function BrandHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-center border-b border-line bg-bg px-5 py-3.5">
      <Link href="/" aria-label="다시 홈" className="flex items-center">
        <DasiLogo size={20} />
      </Link>
    </header>
  );
}
