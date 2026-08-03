import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3a6b4a',
          color: '#faf8f5',
          fontSize: 110,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          borderRadius: 36,
        }}
      >
        G
      </div>
    ),
    { ...size },
  );
}
