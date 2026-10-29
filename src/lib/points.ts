const POINT_TONES = [
  'bg-[#ddd9d3] dark:bg-[#3d3a36]',
  'bg-[#c9daf5] dark:bg-[#2b3a55]',
  'bg-[#b7d7b0] dark:bg-[#2f4a2b]',
  'bg-[#9fd9cf] dark:bg-[#1f4a44]',
  'bg-[#f3d19a] dark:bg-[#55421f]',
  'bg-[#f0c0a4] dark:bg-[#5a3626]',
  'bg-[#e7aeb8] dark:bg-[#57303a]',
  'bg-[#d4b8ea] dark:bg-[#43335a]',
  'bg-[#c5c9a4] dark:bg-[#43462c]',
]

export function pointsTone(points: number): string {
  const index = Math.max(0, Math.round(points * 2))
  return POINT_TONES[index] ?? POINT_TONES[POINT_TONES.length - 1] ?? 'bg-muted'
}

export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1)
}
