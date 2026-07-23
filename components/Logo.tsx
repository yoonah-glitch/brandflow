"use client";

import { useId } from "react";

interface LogoProps {
  size?: number;
}

// 북매치 로고 — 둥근 코랄 그라디언트 사각형 + 흰색 펼친 책 + 작은 하트
export default function Logo({ size = 92 }: LogoProps) {
  const gid = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Bookmatch 로고"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8674A" />
          <stop offset="1" stopColor="#F2915E" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="88" height="88" rx="27" fill={`url(#${gid})`} />
      <path
        transform="translate(41 22) scale(0.72)"
        d="M12 21C12 21 3 14.5 3 8.5C3 5.4 5.4 3 8.5 3C10.4 3 12 4.3 12 4.3C12 4.3 13.6 3 15.5 3C18.6 3 21 5.4 21 8.5C21 14.5 12 21 12 21Z"
        fill="#fff"
        opacity=".96"
      />
      <path
        d="M50 48C42 43 29.5 43 23 46L23 71C29.5 68 42 68 50 73Z"
        fill="#fff"
        opacity=".96"
      />
      <path
        d="M50 48C58 43 70.5 43 77 46L77 71C70.5 68 58 68 50 73Z"
        fill="#fff"
        opacity=".8"
      />
      <path d="M50 48L50 73" stroke="#E8674A" strokeWidth="1.4" opacity=".5" />
    </svg>
  );
}
