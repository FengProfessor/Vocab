import { ImageResponse } from 'next/og';

// OG image động cho social share (Facebook/Zalo/Twitter card).
// Next tự route file này tại /opengraph-image và sinh PNG 1200x630.
export const runtime = 'edge';
export const alt = 'LingoPro';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // gradient indigo đậm cho nền card
          background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 96, marginBottom: 8 }}>🦜</div>
        <div style={{ display: 'flex', fontSize: 120, fontWeight: 800, letterSpacing: '-4px' }}>
          LingoPro
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 40,
            fontWeight: 500,
            color: '#e0e7ff',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Học từ vựng tiếng Anh thông minh hơn — AI + FSRS v5
        </div>
      </div>
    ),
    { ...size },
  );
}
