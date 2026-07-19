import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brandflow · 인스타그램 게시물 생성기",
  description:
    "브랜딩 스튜디오를 위한 인스타그램 게시물 이미지 생성 툴. 작업물 누끼를 추출해 무드별 배경에 합성합니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans">{children}</body>
    </html>
  );
}
