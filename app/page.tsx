import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import { SERVICES } from "@/lib/services";

// 메인 랜딩 — 슬로건 + 서비스 그리드 + 시작하기
export default function HomePage() {
  return (
    <main className="flex flex-col px-6 pb-20 pt-12">
      {/* 슬로건 (다시 로고는 상단 헤더에 고정) */}
      <div className="animate-fade-up flex flex-col items-center text-center">
        <h1 className="text-[26px] font-bold leading-[1.55] tracking-[-0.5px] text-ink">
          지친 당신이
          <br />
          다시 시작하는 곳
        </h1>
        <p className="mt-4 text-[14px] text-faint">오늘도 애쓴 당신에게</p>
      </div>

      {/* 서비스 그리드 */}
      <section className="mt-12 flex flex-col gap-3">
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>

      {/* 안내 문구 + 시작하기 */}
      <section className="mt-14 flex flex-col items-center text-center">
        <p className="text-[16px] leading-[1.7] text-ink">
          책 읽고 싶은데
          <br />
          손이 안 가죠?
        </p>
        <Link
          href="/book"
          className="mt-6 w-full max-w-[300px] rounded-full bg-brand px-6 py-4 text-center text-[16px] font-bold text-white transition-transform active:scale-[0.98]"
        >
          시작하기
        </Link>
      </section>
    </main>
  );
}
