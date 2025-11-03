<script lang="ts">
  import { onMount } from "svelte";
  import { clamp } from "./clamp";
  import { verifyClipRange, type ClipRange } from "./clip-range";
  import { formatSeconds } from "./format-time";

  interface Props {
    value: number;
    duration: number;
    fps?: number;
    range: ClipRange;
  }
  let {
    value = $bindable(),
    duration,
    fps = 60,
    range = $bindable(),
  }: Props = $props();
  let canvasElement: HTMLCanvasElement;

  let si = $state(3);
  let scale = $derived(2 ** si);

  let offset = 0;
  let hoveringPointIndex = $state<number>();

  $effect(() => {
    render(scale, value, duration, hoveringPointIndex);
  });

  function render(..._: unknown[]) {
    const context = canvasElement.getContext("2d");
    if (context == null) return;

    const w = canvasElement.width;
    const h = canvasElement.height;
    const s = fps / scale;
    {
      context.save();
      context.fillStyle = "oklch(87.2% 0.01 258.338)";
      context.fillRect(0, 0, w, h);

      context.fillStyle = "oklch(96.7% 0.003 264.542)";
      context.fillRect(s2l(0), 0, duration * s, h);
      context.restore();
    }
    {
      context.save();
      context.fillStyle = "oklch(44.6% 0.03 256.802)";
      context.strokeStyle = "oklch(44.6% 0.03 256.802)";
      context.beginPath();
      for (let i = 0; i <= Math.ceil(w / s); i++) {
        const time = Math.floor(value + i - offset / s);
        const x = s2l(time);
        context.moveTo(x, 0);

        if (time % (Math.ceil(scale / 10) * 10) === 0) {
          context.lineTo(x, h);
          context.fillText(formatSeconds(time), s2l(time), h - 1);
        } else if (time % 5 === 0) {
          context.lineTo(x, 15);
        } else {
          context.lineTo(x, 10);
        }
      }
      context.stroke();
      context.restore();
    }
    {
      context.save();
      const r = 4;
      if (verifyClipRange(range)) {
        const [ss, to] = range;
        context.fillStyle = "oklch(81.1% 0.111 293.571 / 75%)";
        context.fillRect(s2l(ss), 0, (to - ss) * s, h - 10);
      } else if (range.length === 2) {
        const [ss, to] = range;
        context.fillStyle = "oklch(81% 0.117 11.638 / 75%)";
        context.fillRect(s2l(ss), 0, (to - ss) * s, h - 10);
      }
      context.strokeStyle = "oklch(43.2% 0.232 292.759)";
      context.fillStyle = "oklch(38% 0.189 293.745)";
      context.textBaseline = "middle";
      for (let i = 0; i < range.length; i++) {
        context.save();
        if (hoveringPointIndex === i) {
          context.lineWidth = 5;
        }
        context.beginPath();
        const s = range[i];
        const x = s2l(s);
        const isFirst = i === 0;
        context.moveTo(x, 0);
        context.lineTo(x, h - 10);
        context.lineTo(x + 7.07 * (isFirst ? 1 : -1), h - 15);
        context.lineTo(x, h - 20);
        context.lineTo(x, h);
        context.stroke();
        if (isFirst) {
          context.fillText(formatSeconds(s | 0), s2l(s) + r + 7.07, h - 15);
        } else {
          context.textAlign = "end";
          context.fillText(formatSeconds(s | 0), s2l(s) - r - 7.07, h - 15);
        }
        context.restore();
      }
      context.restore();
    }

    {
      context.save();
      context.strokeStyle = "red";
      context.beginPath();
      const x = s2l(value);
      context.moveTo(x, 0);
      context.lineTo(x, h);
      context.stroke();
      context.restore();
    }
  }
  onMount(() => {
    resize();
  });
  function resize() {
    const rect = canvasElement.getBoundingClientRect();
    canvasElement.width = rect.width;
    canvasElement.height = rect.height;
    offset = rect.width / 2;
    render();
  }

  let drag = $state.raw<{ target: TimelineObject }>();
  function handleMouseDown(e: MouseEvent) {
    drag = {
      target: getTimelineObjectAt(e.offsetX),
    };
  }
  function handleMouseMove(e: MouseEvent) {
    if (drag != null) {
      switch (drag.target.type) {
        case "timeline": {
          const s = (e.movementX / fps) * scale;
          value -= s;
          break;
        }
        case "point": {
          const rect = canvasElement.getBoundingClientRect();
          const x = e.x - rect.x;
          const s = clamp(l2s(x), 0, duration);
          range[drag.target.index] = s;
          break;
        }
      }
    }
    const o = getTimelineObjectAt(e.offsetX);
    if (o.type === "point") {
      hoveringPointIndex = o.index;
      render();
    } else {
      hoveringPointIndex = undefined;
      render();
    }
  }
  type TimelineObject = { type: "timeline" } | { type: "point"; index: number };
  function getTimelineObjectAt(x: number, p = 5): TimelineObject {
    for (let i = 0; i < range.length; i++) {
      const s = range[i];
      const _x = s2l(s);
      if (_x >= x - p && _x <= x + p) {
        return { type: "point", index: i };
      }
    }
    return { type: "timeline" };
  }
  function handleMouseUp() {
    drag = undefined;
  }
  function s2l(sec: number) {
    const s = fps / scale;
    return (sec - value) * s + offset;
  }
  function l2s(x: number) {
    const s = fps / scale;
    return (x - offset) / s + value;
  }
  function fill(ratio = 0.45) {
    let a = 0;
    let b = duration;
    if (verifyClipRange(range)) {
      a = range[0];
      b = range[1];
    }
    const size = b - a;
    const w = canvasElement.getBoundingClientRect().width;
    si = clamp(Math.log2((size * fps) / w / ratio), 0, 7);
    value = a;
  }
</script>

<canvas
  class="w-full h-15"
  bind:this={canvasElement}
  onwheel={(e) => {
    e.preventDefault();

    si = clamp(si + e.deltaY * 0.001, 0, 7);
  }}
  onmousedown={handleMouseDown}
></canvas>

<svelte:window
  onresize={() => {
    resize();
  }}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onblur={() => {
    handleMouseUp();
  }}
  onkeydown={(e) => {
    switch (e.key) {
      case "f": {
        e.preventDefault();
        fill();
        break;
      }
    }
  }}
/>
