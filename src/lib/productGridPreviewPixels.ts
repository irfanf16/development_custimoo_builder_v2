/** Small preview tiles + desktop 2D flip (keep in sync with ProductSelection). */
export function productGridPreviewCanvasPixels(
  isMobile: boolean,
  desktopPreviewCompact: boolean
): number {
  if (isMobile) return 130
  if (desktopPreviewCompact) return 120
  return 176
}
