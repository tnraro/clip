<script lang="ts">
  import {
    FlagTriangleLeftIcon,
    FlagTriangleRightIcon,
    PauseIcon,
    PlayIcon,
    SkipBackIcon,
    SkipForwardIcon,
  } from "lucide-svelte";
  import { onMount } from "svelte";
  import { clamp } from "./clamp";
  import { setClipRange, type ClipRange } from "./clip-range";
  import { formatSeconds } from "./format-time";
  import Timeline from "./timeline.svelte";

  interface Props {
    src: string;
    range: ClipRange;
  }
  let { src, range = $bindable() }: Props = $props();
  let videoElement: HTMLVideoElement;
  let playing = $state(false);
  let currentTime = $state(0);
  let duration = $state(100);
  let playbackRate = $state(1);

  const playbackRateOptions = [0.5, 1, 1.5, 2, 4];

  function setCurrentTime(time: number) {
    videoElement.currentTime = time;
    currentTime = videoElement.currentTime;
  }

  onMount(() => {
    currentTime = videoElement.currentTime;
    playbackRate = videoElement.playbackRate;
    const items = [
      "seeked",
      "playing",
      "seeking",
      "pause",
      "canplaythrough",
      "ratechange",
    ];
    items.forEach((item) => videoElement.addEventListener(item, handler));
    function handler(e: Event) {
      switch (e.type) {
        case "playing": {
          playing = true;
          render();
          break;
        }
        case "pause": {
          playing = false;
          break;
        }
        case "seeked":
        case "seeking": {
          currentTime = videoElement.currentTime;
          break;
        }
        case "canplaythrough": {
          duration = videoElement.duration;
        }
        case "ratechange": {
          playbackRate = videoElement.playbackRate;
        }
      }
    }
    function render() {
      currentTime = videoElement.currentTime;

      if (!playing) return;

      requestAnimationFrame(render);
    }
    return () => {
      items.forEach((item) => videoElement.removeEventListener(item, handler));
    };
  });

  function togglePlaying() {
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  }
  function moveToStart() {
    const s = range[0];
    if (Number.isFinite(s)) {
      setCurrentTime(s);
    } else {
      setCurrentTime(0);
    }
  }
  function moveToEnd() {
    const s = range[1];
    if (Number.isFinite(s)) {
      setCurrentTime(s);
    } else {
      setCurrentTime(duration);
    }
  }
  function markStart() {
    setClipRange(range, 0, videoElement.currentTime);
  }
  function markEnd() {
    setClipRange(range, 1, videoElement.currentTime);
  }
</script>

<div class="flex flex-col">
  <div class="bg-black">
    <video class="max-w-sm w-full mx-auto" bind:this={videoElement}>
      <track kind="captions" />
      <source {src} />
    </video>
  </div>
  <div
    class="flex max-w-sm w-full mx-auto items-center py-1 justify-between gap-x-1"
  >
    <div class="flex gap-x-2">
      <button
        class="flex items-center justify-center text-gray-800 hover:bg-gray-200"
        onclick={moveToStart}
      >
        <SkipBackIcon />
      </button>
      <button
        class="flex items-center justify-center bg-gray-200 text-gray-800 hover:bg-gray-300"
        onclick={togglePlaying}
      >
        {#if playing}
          <PauseIcon />
        {:else}
          <PlayIcon />
        {/if}
      </button>
      <button
        class="flex items-center justify-center text-gray-800 hover:bg-gray-200"
        onclick={moveToEnd}
      >
        <SkipForwardIcon />
      </button>
    </div>
    <div>{formatSeconds(currentTime | 0)}</div>
    <select
      bind:value={
        () => playbackRate, (value) => (videoElement.playbackRate = value)
      }
    >
      {#each playbackRateOptions as opt}
        <option value={opt}>x{opt}</option>
      {/each}
    </select>
  </div>
  <Timeline
    {duration}
    bind:value={() => currentTime, setCurrentTime}
    bind:range
  />
  <div class="py-1 w-full flex gap-4 items-center justify-center text-gray-800">
    2.
    <button
      class="flex gap-x-0.5 items-center justify-center bg-violet-200 text-violet-800 hover:bg-violet-300"
      onclick={markStart}
      ><FlagTriangleRightIcon size="1em" />시작점 설정하기</button
    >
    <button
      class="flex gap-x-0.5 items-center justify-center bg-violet-200 text-violet-800 hover:bg-violet-300"
      onclick={markEnd}><FlagTriangleLeftIcon size="1em" />끝점 설정하기</button
    >
  </div>
</div>

<svelte:window
  onkeydown={(e) => {
    switch (e.key) {
      case " ": {
        e.preventDefault();
        togglePlaying();
        break;
      }
      case "a":
      case "A":
      case "d":
      case "D": {
        e.preventDefault();
        const scale = e.shiftKey ? 1 / 60 : e.ctrlKey ? 5 : 1;
        const direction = e.key === "a" || e.key === "A" ? -1 : 1;
        console.log(scale * direction);
        setCurrentTime(videoElement.currentTime + direction * scale);
        break;
      }
      case "q": {
        e.preventDefault();
        moveToStart();
        break;
      }
      case "e": {
        e.preventDefault();
        moveToEnd();
        break;
      }
      case "1": {
        e.preventDefault();
        markStart();
        break;
      }
      case "2": {
        e.preventDefault();
        markEnd();
        break;
      }
      case "w": {
        videoElement.playbackRate = clamp(playbackRate + 0.5, 0.5, 4);
        break;
      }
      case "s": {
        videoElement.playbackRate = clamp(playbackRate - 0.5, 0.5, 4);
        break;
      }
    }
  }}
/>
