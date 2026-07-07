/**
 * Gelembung naik pelan di background gelap (hero banner, login).
 * Opacity rendah, non-interaktif — tidak mengganggu teks/angka.
 */
const BUBBLES = [
  { size: 6,  left: '8%',  delay: 0,   dur: 9  },
  { size: 10, left: '18%', delay: 2.5, dur: 12 },
  { size: 4,  left: '27%', delay: 5,   dur: 8  },
  { size: 8,  left: '38%', delay: 1,   dur: 11 },
  { size: 5,  left: '52%', delay: 3.5, dur: 9  },
  { size: 12, left: '63%', delay: 0.8, dur: 14 },
  { size: 6,  left: '74%', delay: 4,   dur: 10 },
  { size: 9,  left: '84%', delay: 2,   dur: 13 },
  { size: 4,  left: '91%', delay: 6,   dur: 8  },
  { size: 7,  left: '96%', delay: 1.5, dur: 11 },
]

export function BubbleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            '--delay': `${b.delay}s`,
            '--duration': `${b.dur}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
