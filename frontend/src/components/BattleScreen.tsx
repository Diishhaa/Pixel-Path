/**
 * BattleScreen.tsx — RPG battle UI for quiz questions.
 * Uses AnimatedSprite and TiledBackground to create a dynamic 2D battle layout.
 */

import { useEffect, useState } from 'react'
import { QuestionOut } from '../api/api'
import AnimatedSprite from './AnimatedSprite'
import TiledBackground from './TiledBackground'

interface Answer {
  question_id: number
  answer: string
}

interface Props {
  questions: QuestionOut[]
  onComplete: (answers: Answer[]) => Promise<void>
}

type FeedbackState = 'idle' | 'attacking' | 'done'

const PLAYER_MAX_HP = 100
const ENEMY_MAX_HP  = 100

export default function BattleScreen({ questions, onComplete }: Props) {
  const total = questions.length

  const [index,       setIndex]       = useState(0)
  const [answers,     setAnswers]     = useState<Answer[]>([])
  const [textInput,   setTextInput]   = useState('')
  const [feedback,    setFeedback]    = useState<FeedbackState>('idle')
  const [playerHp,    setPlayerHp]    = useState(PLAYER_MAX_HP)
  const [enemyHp,     setEnemyHp]     = useState(ENEMY_MAX_HP)
  const [shakePlayer, setShakePlayer] = useState(false)
  const [shakeEnemy,  setShakeEnemy]  = useState(false)
  const [flashColor,  setFlashColor]  = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)

  const hpPerQuestion  = Math.floor(ENEMY_MAX_HP / total)

  const currentQ = questions[index]

  // Decide boss monster type based on question index
  const isFireType = index % 2 === 0
  const bossFolder = isFireType ? 'Boss enemies/Fire Spell/PNG' : 'Boss enemies/Water Spell/PNG'
  const bossPrefix = isFireType ? 'Fire Spell_Frame_0' : 'Water Spell_Frame_0'

  // Spell animation asset
  const spellFolder = isFireType ? 'Boss enemies/Fire Ball/PNG' : 'Boss enemies/Water Ball/PNG'
  const spellPrefix = isFireType ? 'Fire Ball_Frame_0' : 'Water Ball_Frame_0'

  const submitAnswer = (answer: string) => {
    if (feedback !== 'idle' || submitting) return

    const newAnswers = [...answers, { question_id: currentQ.id, answer }]
    setAnswers(newAnswers)

    // Trigger player attacking animations
    setFeedback('attacking')
    setShakeEnemy(true)
    setFlashColor(isFireType ? '#ff444444' : '#4488ff44')

    const newEnemyHp = Math.max(0, enemyHp - hpPerQuestion)
    setEnemyHp(newEnemyHp)

    setTimeout(() => {
      setShakeEnemy(false)
      setFlashColor(null)
      setFeedback('done')

      setTimeout(() => {
        setFeedback('idle')
        if (index + 1 >= total) {
          setSubmitting(true)
          onComplete(newAnswers)
        } else {
          setIndex(i => i + 1)
          setTextInput('')
        }
      }, 300)
    }, 800) // Spell anim time
  }

  return (
    <TiledBackground groundIndex="05" showProps={false}>
      <div className="min-h-screen flex flex-col justify-between overflow-hidden relative scanlines">
        {/* Flash effect overlay */}
        {flashColor && (
          <div
            className="absolute inset-0 pointer-events-none z-50 animate-flash"
            style={{ background: flashColor }}
          />
        )}

        {/* ── Turn/Quiz Header ── */}
        <div className="flex justify-center pt-4 z-10">
          <div className="pixel-border bg-dim bg-opacity-90 px-5 py-2">
            <p className="font-pixel text-gold text-[0.6rem] tracking-widest">
              BATTLE STAGE: TURN {index + 1} / {total}
            </p>
          </div>
        </div>

        {/* ── Sprites Arena ── */}
        <div className="relative z-10 flex items-end justify-between px-8 md:px-24 flex-1 pb-8">
          
          {/* Enemy Boss Sprite */}
          <div className="flex flex-col items-center gap-2 relative">
            <p className="font-pixel text-[0.5rem] text-purple-400 tracking-wider">
              {isFireType ? 'FIRE REAPER' : 'WATER SPECTRE'}
            </p>
            <div className="w-32 font-pixel text-[0.45rem] text-[#888] flex justify-between mb-0.5">
              <span>HP</span><span>{enemyHp}/{ENEMY_MAX_HP}</span>
            </div>
            <div className="hp-bar-track w-32">
              <div
                className="hp-bar-fill enemy"
                style={{ width: `${(enemyHp / ENEMY_MAX_HP) * 100}%` }}
              />
            </div>

            {/* Boss animation */}
            <div className={`relative ${shakeEnemy ? 'animate-shake' : ''}`}>
              <AnimatedSprite
                folder={bossFolder}
                prefix={bossPrefix}
                frameCount={8}
                interval={140}
                className="w-40 h-40 object-contain drop-shadow-[0_0_16px_rgba(187,68,255,0.3)]"
                alt="Boss Enemy"
              />

              {/* Active Spell hit overlay */}
              {feedback === 'attacking' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <AnimatedSprite
                    folder={spellFolder}
                    prefix={spellPrefix}
                    frameCount={8}
                    interval={80}
                    className="w-32 h-32 object-contain"
                    alt="Spell Hit"
                  />
                </div>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="hidden md:flex flex-col items-center gap-2 self-center mb-16">
            <span className="font-pixel text-red-500 text-lg drop-shadow-[0_0_8px_#ff4444]">VS</span>
            <div className="w-1 h-20 bg-border opacity-50" />
          </div>

          {/* Player Mage Sprite */}
          <div className="flex flex-col items-center gap-2">
            <p className="font-pixel text-[0.5rem] text-gold tracking-wider">PLAYER MAGE</p>
            <div className="w-32 font-pixel text-[0.45rem] text-[#888] flex justify-between mb-0.5">
              <span>HP</span><span>{playerHp}/{PLAYER_MAX_HP}</span>
            </div>
            <div className="hp-bar-track w-32">
              <div
                className="hp-bar-fill"
                style={{ width: `${(playerHp / PLAYER_MAX_HP) * 100}%` }}
              />
            </div>

            <div className={`w-32 h-32 flex items-center justify-center text-6xl mt-4 ${shakePlayer ? 'animate-shake' : ''}`}>
              🧙
            </div>
          </div>
        </div>

        {/* ── Question Dialogue Box ── */}
        <div className="z-10 px-4 pb-6 w-full max-w-4xl mx-auto">
          <div className="pixel-border bg-dim bg-opacity-95 p-6 md:p-8 flex flex-col gap-4">
            
            {/* Level Badge and Rewards */}
            <div className="flex justify-between items-center">
              <span className={`font-pixel text-[0.5rem] px-3 py-1.5 border-2
                ${currentQ.level === 1 ? 'text-green border-green bg-[#00ff8811]' :
                  currentQ.level === 2 ? 'text-gold border-gold bg-[#ffd70011]' :
                  'text-purple-400 border-purple-400 bg-[#bb44ff11]'}`}
              >
                LEVEL {currentQ.level} {currentQ.q_type.toUpperCase()}
              </span>
              <span className="font-pixel text-[0.5rem] text-gold animate-float">
                💎 REWARD: +{currentQ.xp_reward} XP
              </span>
            </div>

            {/* Question Text */}
            <p className="font-vt text-gold text-2xl md:text-3xl leading-relaxed whitespace-pre-wrap">
              {currentQ.question_text}
            </p>

            {/* MCQ Options Grid */}
            {currentQ.q_type === 'mcq' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => submitAnswer(opt)}
                    disabled={feedback !== 'idle' || submitting}
                    className="pixel-border p-4 text-left font-vt text-xl text-[#eee] bg-navy bg-opacity-80
                               hover:border-gold hover:text-gold hover:bg-[#ffd70011]
                               active:translate-x-0.5 active:translate-y-0.5
                               disabled:opacity-40 transition-all duration-100"
                  >
                    <span className="font-pixel text-[0.5rem] text-gold mr-3">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Fill-in-the-blank & Code input */}
            {(currentQ.q_type === 'fib' || currentQ.q_type === 'code') && (
              <div className="flex gap-4 mt-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && textInput.trim()) submitAnswer(textInput.trim())
                  }}
                  disabled={feedback !== 'idle' || submitting}
                  className="flex-1 bg-navy border-4 border-border p-4 font-vt text-2xl text-gold
                             focus:border-gold focus:outline-none disabled:opacity-40"
                  placeholder={currentQ.q_type === 'fib' ? 'Type the blank word...' : 'Fix the bug...'}
                  autoFocus
                />
                <button
                  onClick={() => textInput.trim() && submitAnswer(textInput.trim())}
                  disabled={!textInput.trim() || feedback !== 'idle' || submitting}
                  className="pixel-btn pixel-btn-gold text-sm px-6 py-4 flex items-center gap-2"
                >
                  ⚔ CAST
                </button>
              </div>
            )}

          </div>

          {/* Submitting Loading screen overlay */}
          {submitting && (
            <div className="mt-4 text-center">
              <p className="font-pixel text-[0.55rem] text-gold animate-blink">
                RETRIEVING BATTLE RESOLUTION...
              </p>
            </div>
          )}
        </div>
      </div>
    </TiledBackground>
  )
}
