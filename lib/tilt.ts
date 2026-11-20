export function tiltFor(seed: string, maxDegrees = 2.5): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 1000) / 1000) * maxDegrees * 2 - maxDegrees;
}
