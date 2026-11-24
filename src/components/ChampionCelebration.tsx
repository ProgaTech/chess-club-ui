import { Crown } from 'lucide-react'
import { Fragment, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

// The timeline lives in index.css under "Champion celebration":
// board rises, kings land, the runner-up's king topples, CHECKMATE slams in,
// the board shatters, then the crown drops onto the champion's name under a rain of pieces.

type Vars = CSSProperties & Record<`--${string}`, string | number>

// U+FE0E keeps chess glyphs as text instead of emoji.
const GLYPHS = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'].map(glyph => `${glyph}︎`)
const KING = '♚︎'

// Fixed pseudo-random numbers, so the explosion looks the same on every render.
function noise(index: number, salt: number) {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const SQUARES = Array.from({ length: 64 }, (_, index) => {
  const row = Math.floor(index / 8)
  const col = index % 8
  const angle = Math.atan2(row - 3.5, col - 3.5)
  const force = 45 + noise(index, 1) * 70
  const style: Vars = {
    '--d': `${(row + col) * 35}ms`,
    '--tx': `${Math.cos(angle) * force}vmin`,
    '--ty': `${Math.sin(angle) * force}vmin`,
    '--tz': `${120 + noise(index, 2) * 380}px`,
    '--rx': `${noise(index, 3) * 720 - 360}deg`,
    '--rz': `${noise(index, 4) * 540 - 270}deg`,
  }
  return { dark: (row + col) % 2 === 1, style }
})

const SPARKS = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2 + noise(index, 11) * 0.3
  const distance = 28 + noise(index, 12) * 32
  const style: Vars = {
    '--sx': `${Math.cos(angle) * distance}vmin`,
    '--sy': `${Math.sin(angle) * distance}vmin`,
    '--sr': `${noise(index, 13) * 720}deg`,
  }
  return style
})

const RAIN = Array.from({ length: 34 },(_, index) => {
  const style: Vars = {
    '--x': `${noise(index, 5) * 100}vw`,
    '--size': `${1.4 + noise(index, 6) * 3}rem`,
    '--dur': `${3.6 + noise(index, 7) * 3.6}s`,
    '--delay': `${3700 + noise(index, 8) * 3200}ms`,
    '--spin': `${noise(index, 9) * 720 - 360}deg`,
    '--sway': `${noise(index, 10) * 16 - 8}vw`,
  }
  return { glyph: GLYPHS[index % GLYPHS.length]!, tone: index % 3, style }
})

export function ChampionCelebration({ champion, runnerUp, onClose }: { champion: string; runnerUp: string | null; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    closeButton.current?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  let letter = 0
  const words = champion.split(' ').map((word, index) => (
    <Fragment key={index}>
      {index > 0 ? ' ' : null}
      <span className="cc-word">
        {[...word].map((char, at) => <span key={at} className="cc-letter" style={{ '--i': letter++ } as Vars}>{char}</span>)}
      </span>
    </Fragment>
  ))

  return createPortal(
    <div className="cc-root" role="dialog" aria-modal="true" aria-label={`${champion} is the champion`}>
      <div className="cc-backdrop" onClick={onClose} />
      <div className="cc-rays cc-motion" aria-hidden="true" />

      <div className="cc-stage cc-motion" aria-hidden="true">
        <div className="cc-shake">
          <div className="cc-board-wrap">
            <div className="cc-board">
              {SQUARES.map((square, index) => <span key={index} className="cc-square" data-dark={square.dark || undefined} style={square.style} />)}
            </div>
          </div>
          <div className="cc-kings">
            <span className="cc-king cc-king-champ">{KING}</span>
            <span className="cc-king cc-king-loser">{KING}</span>
          </div>
          <span className="cc-ring" />
          <span className="cc-ring cc-ring-late" />
          {SPARKS.map((style, index) => <span key={index} className="cc-spark" style={style} />)}
          <p className="cc-checkmate">Checkmate</p>
        </div>
      </div>

      <div className="cc-rain cc-motion" aria-hidden="true">
        {RAIN.map((drop, index) => <span key={index} className="cc-drop" data-tone={drop.tone} style={drop.style}>{drop.glyph}</span>)}
      </div>

      <div className="cc-finale">
        <Crown className="cc-crown" strokeWidth={1.5} aria-hidden="true" />
        <p className="cc-kicker">Autumn 2026 champion</p>
        <h2 className="cc-name" aria-label={champion}><span aria-hidden="true">{words}</span></h2>
        {runnerUp ? <p className="cc-sub">Beat {runnerUp} in the grand final</p> : null}
        <button ref={closeButton} type="button" className="cc-close" onClick={onClose}>Continue</button>
      </div>

      <div className="cc-flash cc-motion" aria-hidden="true" />
      <div className="cc-flash cc-flash-gold cc-motion" aria-hidden="true" />
    </div>,
    document.body,
  )
}
