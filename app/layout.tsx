import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmatch · 당신의 책 이상형 찾기",
  description:
    "여덟 가지 짧은 질문에 답하면 지금 당신의 마음에 꼭 맞는 책 한 권을 찾아드려요.",
  openGraph: {
    title: "Bookmatch · 당신의 책 이상형 찾기",
    description:
      "당신의 기분과 취향을 읽어 지금 마음에 꼭 맞는 책 한 권을 찾아드려요.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#E8674A",
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
      <body className="font-serif">
        {/* 모바일 우선: 화면 가운데 480px 컨테이너 */}
        <div className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-app shadow-[0_30px_80px_-30px_rgba(176,74,44,0.28)]">
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
