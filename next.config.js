/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // @imgly/background-removal 는 브라우저 전용(WASM/Canvas)이라
    // 서버 번들에서 Node 코어 모듈을 참조하지 못하도록 fallback 처리한다.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // .wasm 파일을 asset 으로 처리 (Vercel 배포 대응)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

module.exports = nextConfig;
