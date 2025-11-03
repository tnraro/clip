<script lang="ts">
  import type { FileData } from "@ffmpeg/ffmpeg";
  import { DownloadIcon, FilePlayIcon, ScissorsIcon } from "lucide-svelte";
  import { verifyClipRange, type ClipRange } from "./lib/clip-range";
  import Editor from "./lib/editor.svelte";
  import { getFFmpeg } from "./lib/ffmpeg";

  interface VideoFile {
    name: string;
    size: number;
    lastModified: Date;
    blobUrl: string;
    file: File;
    range: ClipRange;
  }

  let selectedVideo = $state<VideoFile>();
  let output = $state<string>();
  let cutting = $state(false);
  let dragging = $state(false);

  async function cut(input: FileData, [ss, to]: number[]) {
    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile("input.mp4", input);
    await ffmpeg.exec([
      "-ss",
      String(ss),
      "-to",
      String(to),
      "-i",
      "input.mp4",
      "-c:v",
      "copy",
      "-c:a",
      "copy",
      "output.mp4",
    ]);
    const data = (await ffmpeg.readFile("output.mp4")) as Uint8Array;

    return URL.createObjectURL(
      new Blob([data.buffer as BlobPart], { type: "video/mp4" })
    );
  }
  function saveOutput() {
    if (output == null) {
      alert("저장할 파일이 없습니다");
      return;
    }
    const a = document.createElement("a");
    a.href = output;
    a.download = `${selectedVideo?.name.split(".").slice(0, -1).join(".")}_${selectedVideo?.range[0].toFixed(3)}-${selectedVideo?.range[1].toFixed(3)}.mp4`;
    a.click();
  }
  function addFile(file: File) {
    URL.revokeObjectURL(selectedVideo?.blobUrl!);
    URL.revokeObjectURL(output!);
    output = undefined;
    selectedVideo = {
      name: file.name,
      size: file.size,
      lastModified: new Date(file.lastModified),
      blobUrl: URL.createObjectURL(file),
      file,
      range: [] as unknown as ClipRange,
    };
  }
</script>

<main>
  {#if dragging}
    <div
      class="fixed top-0 left-0 right-0 bottom-0 bg-gray-500/50 flex justify-center items-center text-center text-white"
    >
      동영상 파일을 놓아주세요
    </div>
  {/if}
  <label
    class="py-1 w-full flex gap-1 items-center justify-center text-gray-800 hover:bg-gray-200"
  >
    1.
    <FilePlayIcon />
    동영상 열기
    <input
      class="hidden"
      type="file"
      accept="video/*"
      onchange={(e) => {
        const files = e.currentTarget.files;
        if (files == null || files.length === 0) {
          throw alert("파일을 넣어주세요");
        }
        const file = files[0];
        addFile(file);
      }}
    />
  </label>
  {#if selectedVideo != null}
    {#key selectedVideo}
      <Editor src={selectedVideo.blobUrl} bind:range={selectedVideo.range} />
    {/key}
    {#if selectedVideo.range.length === 2}
      <button
        class="py-1 w-full flex gap-1 items-center justify-center text-gray-800 not-disabled:hover:bg-gray-200 disabled:text-gray-500"
        disabled={cutting || !verifyClipRange(selectedVideo.range)}
        onclick={async () => {
          cutting = true;
          try {
            URL.revokeObjectURL(output!);
            output = undefined;
            const sv = selectedVideo!;
            const ab = await sv.file.arrayBuffer();
            const buffer = new Uint8Array(ab);
            output = await cut(buffer, sv.range);
          } catch (e) {
            console.error(e);
          } finally {
            cutting = false;
          }
        }}>3. <ScissorsIcon />{cutting ? "자르는 중..." : "자르기"}</button
      >
    {/if}
  {/if}
  {#if output != null}
    <div class="bg-black">
      <video class="max-w-sm w-full mx-auto" controls>
        <track kind="captions" />
        <source src={output} />
      </video>
    </div>
    <button
      class="py-1 w-full flex gap-1 items-center justify-center text-gray-800 hover:bg-gray-200"
      onclick={saveOutput}
    >
      4.
      <DownloadIcon />
      저장
    </button>
  {/if}
</main>

<svelte:window
  ondrop={(e) => {
    if (
      [...(e.dataTransfer?.items ?? [])].some(
        (item) => item.kind === "file" && item.type.startsWith("video/")
      )
    ) {
      e.preventDefault();
      const item = e.dataTransfer!.items[0]!;
      const file = item.getAsFile()!;
      addFile(file);
    }
    dragging = false;
  }}
  ondragover={(e) => {
    if (
      [...(e.dataTransfer?.items ?? [])].some(
        (item) => item.kind === "file" && item.type.startsWith("video/")
      )
    ) {
      e.preventDefault();
      dragging = true;
    }
  }}
  ondragexit={(e) => {
    dragging = false;
  }}
/>
