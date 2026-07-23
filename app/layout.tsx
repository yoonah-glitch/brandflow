import type { Metadata, Viewport } from "next";
import "./globals.css";
import BrandHeader from "@/components/BrandHeader";

export const metadata: Metadata = {
  title: "다시 · 지친 당신이 다시 시작하는 곳",
  description:
    "지친 당신이 다시 시작하는 곳. 다시, 책이 지금 이 마음에 꼭 맞는 책 한 권을 조용히 골라드려요.",
  openGraph: {
    title: "다시 · 지친 당신이 다시 시작하는 곳",
    description: "지친 당신이 다시 시작하는 곳",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#A9805C",
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
        <div className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-bg">
          {/* 모든 화면 상단에 고정되는 다시 로고 */}
          <BrandHeader />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
