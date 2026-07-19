// @imgly/background-removal-data 의 모델/WASM/onnx 에셋을 public/models 로 복사한다.
// publicPath 옵션(/models/)으로 CDN 없이 자체 호스팅하기 위한 스크립트이며,
// npm install 시 postinstall 로 자동 실행된다.
// (실제 모델 파일은 메인 패키지가 아니라 -data 패키지의 dist 에 들어있다.)
import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const src = path.resolve("node_modules/@imgly/background-removal-data/dist");
const dest = path.resolve("public/models");

async function main() {
  if (!existsSync(src)) {
    console.warn(
      "[copy-models] @imgly/background-removal-data dist 를 찾을 수 없어 건너뜁니다. " +
        "`npm install @imgly/background-removal-data` 후 `npm run setup:models` 를 실행하세요."
    );
    return;
  }

  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
  console.log("[copy-models] 모델 에셋을 public/models 로 복사했습니다.");
}

main().catch((err) => {
  console.warn("[copy-models] 복사 중 오류가 발생했지만 계속 진행합니다:", err.message);
});
