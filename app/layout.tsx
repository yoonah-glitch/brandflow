import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmatch · 당신의 책 이상형 찾기",
  description:
    "몇 가지 질문에 답하면 AI 큐레이터가 지금 당신에게 딱 맞는 책 한 권을 추천해드려요.",
  openGraph: {
    title: "Bookmatch · 당신의 책 이상형 찾기",
    description:
      "AI 큐레이터가 당신의 기분과 취향을 분석해 책 한 권을 추천해드려요.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#534AB7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans">
        {/* 모바일 우선: 화면 가운데 480px 컨테이너 */}
        <div className="mx-auto min-h-screen w-full max-w-app bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}
