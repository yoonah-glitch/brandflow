import Link from "next/link";
import type { Service } from "@/lib/services";

// 서비스 타일. active 는 탭 가능(링크), soon 은 흐리게 + "곧 만나요" 배지(클릭 불가).
export default function ServiceCard({ service }: { service: Service }) {
  const soon = service.status === "soon";
  const base =
    "flex items-center gap-4 rounded-2xl border px-5 py-[18px] transition-colors";

  if (soon) {
    return (
      <div
        aria-disabled="true"
        className={`${base} cursor-default border-line bg-paper/60`}
      >
        <span className="text-[26px] opacity-50 grayscale">{service.emoji}</span>
        <span className="flex-1 text-[16px] font-bold text-faint">
          {service.label}
        </span>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-dark">
          곧 만나요
        </span>
      </div>
    );
  }

  return (
    <Link
      href={service.href ?? "#"}
      className={`${base} border-line bg-paper hover:border-brand active:scale-[0.99]`}
    >
      <span className="text-[26px]">{service.emoji}</span>
      <span className="flex-1 text-[16px] font-bold text-ink">
        {service.label}
      </span>
      <span aria-hidden className="text-[18px] text-brand">
        →
      </span>
    </Link>
  );
}
