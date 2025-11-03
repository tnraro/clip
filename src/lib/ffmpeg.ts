import wasmURL from "@ffmpeg/core/wasm?url";
import coreURL from "@ffmpeg/core?url";
import { FFmpeg } from "@ffmpeg/ffmpeg";

let cache: Promise<FFmpeg>;

export function getFFmpeg() {
  if (cache == null) {
    cache = (async () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", (x) => {
        console.log(x);
      });

      // const baseURL =
      //   "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
      await ffmpeg.load({
        coreURL,
        wasmURL,
      });
      return ffmpeg;
    })();
  }
  return cache;
}
