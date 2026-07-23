/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 카카오 책 검색 API 표지 이미지 도메인
    remotePatterns: [
      { protocol: "https", hostname: "search1.kakaocdn.net" },
      { protocol: "https", hostname: "search2.kakaocdn.net" },
      { protocol: "https", hostname: "search3.kakaocdn.net" },
      { protocol: "https", hostname: "search4.kakaocdn.net" },
    ],
  },
};

module.exports = nextConfig;
