/**
 * TiledBackground.tsx — Tiled map background using Tiled assets.
 * Renders a repeating ground tile and overlays scattered decorative props.
 */

import React from 'react'

interface Props {
  children?: React.ReactNode
  className?: string
  groundIndex?: string   // "01" to "56"
  showProps?: boolean
}

// Decorative props with static positions to keep it looking consistent
const DECORATIONS = [
  { name: 'cave',     x: '10%', y: '15%', src: 'Top-Down Poisonous Swamp_Prop - Cave Enterance.png', scale: 'w-24 h-24' },
  { name: 'skeleton', x: '80%', y: '25%', src: 'Top-Down Poisonous Swamp_Prop - Animal Skeleton.png', scale: 'w-16 h-16' },
  { name: 'sign',     x: '75%', y: '60%', src: 'Top-Down Poisonous Swamp_Prop - Danger Sign.png', scale: 'w-10 h-10' },
  { name: 'boulder1', x: '15%', y: '75%', src: 'Top-Down Poisonous Swamp_Prop - Boulder 1.png', scale: 'w-16 h-16' },
  { name: 'tree1',    x: '85%', y: '80%', src: 'Top-Down Poisonous Swamp_Prop - Tree Tower Short.png', scale: 'w-20 h-28' },
  { name: 'bush1',    x: '5%',  y: '45%', src: 'Top-Down Poisonous Swamp_Prop - Bushes 1.png', scale: 'w-12 h-12' },
  { name: 'rafflesia',x: '90%', y: '45%', src: 'Top-Down Poisonous Swamp_Prop - Rafflesia.png', scale: 'w-12 h-12' },
]

export default function TiledBackground({
  children,
  className = '',
  groundIndex = '01',
  showProps = true,
}: Props) {
  const groundSrc = `/assets/Tile Map maker/PNG/Top-Down Poisonous Swamp_Ground ${groundIndex}.png`

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${className}`}
      style={{
        backgroundImage: `url("${groundSrc}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '96px 96px', // Zoom tile size to look pixelated and chunkier
        imageRendering: 'pixelated',
      }}
    >
      {/* Scattered background props */}
      {showProps && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {DECORATIONS.map((d, i) => (
            <img
              key={i}
              src={`/assets/Tile Map maker/PNG/${d.src}`}
              alt={d.name}
              className={`absolute object-contain select-none opacity-60 ${d.scale}`}
              style={{
                left: d.x,
                top: d.y,
                imageRendering: 'pixelated',
              }}
            />
          ))}
        </div>
      )}

      {/* Foreground content */}
      <div className="relative z-10 w-full h-full min-h-screen">
        {children}
      </div>
    </div>
  )
}
