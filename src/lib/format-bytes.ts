export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = (Math.log10(bytes) / 3) | 0;
  const divider = 1024 ** exp;
  return `${Math.round((bytes / divider) * 100) / 100} ${units[exp]}`;
}
