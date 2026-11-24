/** @jest-environment node */
import { resizeArtwork } from './artwork';

const base = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d2/d1/24/abc/196875002307.jpg';

describe('resizeArtwork', () => {
  it('rewrites the size segment and requests a jpg', () => {
    expect(resizeArtwork(`${base}/170x170bb.png`, 600)).toBe(`${base}/600x600bb.jpg`);
  });

  it('handles jpg sources and non-square segments', () => {
    expect(resizeArtwork(`${base}/100x55bb.jpg`, 300)).toBe(`${base}/300x300bb.jpg`);
  });

  it('only touches the final path segment', () => {
    expect(resizeArtwork(`${base}/55x55bb.png`, 600)).toContain('196875002307.jpg/600x600bb.jpg');
  });

  it('leaves unrecognised URLs alone', () => {
    const other = 'https://example.com/cover.png';
    expect(resizeArtwork(other, 600)).toBe(other);
  });
});
