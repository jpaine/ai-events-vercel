import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AI Events 2026 — AI, ML & Robotics Conferences'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f1117',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 90px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3fb950' }} />
          <span style={{ color: '#3fb950', fontSize: '20px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Updated Daily
          </span>
        </div>

        {/* Title */}
        <div style={{ color: '#f0f6fc', fontSize: '68px', fontWeight: '800', letterSpacing: '-2px', lineHeight: '1.1', marginBottom: '28px', display: 'flex', flexDirection: 'column' }}>
          <span>AI, ML &amp; Robotics</span>
          <span style={{ color: '#58a6ff' }}>Conferences 2026</span>
        </div>

        {/* Subtitle */}
        <div style={{ color: '#8b949e', fontSize: '26px', marginBottom: '52px', lineHeight: '1.5' }}>
          95 curated events · Academic &amp; Industry · 18+ Countries
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0', alignItems: 'center' }}>
          {[
            { num: '29', lbl: 'Academic' },
            { num: '66', lbl: 'Industry' },
            { num: '95', lbl: 'Total' },
            { num: '18+', lbl: 'Countries' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '40px', background: '#21262d', margin: '0 28px' }} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#f0f6fc', fontSize: '30px', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: '1' }}>{s.num}</span>
                <span style={{ color: '#484f58', fontSize: '15px' }}>{s.lbl}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: '52px', right: '90px', color: '#30363d', fontSize: '16px' }}>
          ai-events-vercel.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
