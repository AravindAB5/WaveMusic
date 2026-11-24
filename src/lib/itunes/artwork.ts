/**
 * iTunes artwork URLs end in a size segment such as `/170x170bb.png`, and the
 * CDN renders any requested size from the master. Swapping that segment is
 * the standard way to get crisper art than the feed's 170px maximum.
 */
const SIZE_SEGMENT = /\/\d+x\d+bb\.(?:png|jpe?g)$/i;

export function resizeArtwork(url: string, size: number): string {
  return SIZE_SEGMENT.test(url) ? url.replace(SIZE_SEGMENT, `/${size}x${size}bb.jpg`) : url;
}
