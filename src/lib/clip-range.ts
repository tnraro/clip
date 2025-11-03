export type ClipRange = number[] & { __range__: null };
export function setClipRange(range: ClipRange, index: number, value: number) {
  range[index] = value;
}

export function verifyClipRange(x: ClipRange) {
  return (
    x.length === 2 &&
    Number.isFinite(x[0]) &&
    Number.isFinite(x[1]) &&
    x[0] < x[1]
  );
}
