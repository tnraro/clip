export function formatSeconds(seconds: number) {
  const as = Math.abs(seconds);
  const sign = Math.sign(seconds);
  const h = Math.floor(as / 3600);
  const m = Math.floor(as / 60) % 60;
  const s = Math.floor(as % 60);
  const ms = as % 1;

  const mst = ms !== 0 ? `${String(Number(ms.toFixed(3))).slice(1)}` : "";
  if (h !== 0) {
    return `${sign < 0 ? "-" : ""}${padZero(h)}:${padZero(m)}:${padZero(
      s
    )}${mst}`;
  }
  return `${sign < 0 ? "-" : ""}${padZero(m)}:${padZero(s)}${mst}`;
}

function padZero(x: number) {
  return String(x).padStart(2, "0");
}
