/**
 * AnimatedSprite.tsx — Pure React 2D sprite animation component.
 * Cycles through a list of frame images at a specified interval.
 */

import { useEffect, useState } from 'react'

interface Props {
  folder: string         // e.g. "Boss enemies/Fire Spell/PNG"
  prefix: string         // e.g. "Fire Spell_Frame_0"
  frameCount: number     // e.g. 8
  interval?: number      // ms per frame, default 120
  className?: string
  alt?: string
}

export default function AnimatedSprite({
  folder,
  prefix,
  frameCount,
  interval = 120,
  className = '',
  alt = 'Animated Sprite',
}: Props) {
  const [frame, setFrame] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(current => (current >= frameCount ? 1 : current + 1))
    }, interval)

    return () => clearInterval(timer)
  }, [frameCount, interval])

  // Pad the frame number with a leading zero if needed, since filenames are like _Frame_01.png
  const frameString = frame < 10 ? `0${frame}` : `${frame}`
  const src = `/assets/${folder}/${prefix}${frameString}.png`

  return (
    <img
      src={src}
      alt={alt}
      className={`sprite-placeholder select-none ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
