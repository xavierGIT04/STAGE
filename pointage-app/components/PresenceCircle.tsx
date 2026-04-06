'use client'
import { useEffect, useState } from 'react'

interface Props { present: number; total: number }

export default function PresenceCircle({ present, total }: Props) {
  const SIZE = 280, STROKE = 16
  const R    = SIZE / 2 - STROKE
  const CIRC = 2 * Math.PI * R
  const pct  = total === 0 ? 0 : present / total
  const [dash, setDash] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDash(CIRC * pct), 80)
    return () => clearTimeout(t)
  }, [pct, CIRC])

  const taux = total === 0 ? 0 : Math.round(pct * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          {/* Track */}
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#e2ece6" strokeWidth={STROKE} />
          {/* Rouge — absents */}
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke="#e8b4ae" strokeWidth={STROKE}
            strokeDasharray={`${CIRC*(1-pct)} ${CIRC}`}
            strokeDashoffset={-dash} strokeLinecap="round"
            style={{ transition: 'all 0.9s cubic-bezier(.4,0,.2,1)' }} />
          {/* Vert KYA — présents */}
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke="var(--kya-green)" strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRC}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)' }} />
        </svg>

        {/* Centre */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2,
        }}>
          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 68, fontWeight: 700,
            color: 'var(--text-primary)', lineHeight: 1,
          }}>
            {present}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: "'DM Mono', monospace", letterSpacing: 1,
          }}>
            / {total}
          </div>
          <div style={{
            marginTop: 8, fontSize: 10,
            fontFamily: "'DM Mono', monospace", letterSpacing: 2,
            color: present > 0 ? 'var(--kya-green)' : 'var(--text-muted)',
            background: present > 0 ? 'var(--kya-green-light)' : '#f5f5f5',
            padding: '4px 12px', borderRadius: 20,
            border: `1px solid ${present > 0 ? 'var(--kya-green-border)' : 'var(--border)'}`,
            fontWeight: 600,
          }}>
            {present > 0 ? '● ACTIF' : '○ VIDE'}
          </div>
        </div>
      </div>

      {/* Barre de taux */}
      <div style={{ width: '100%', maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-sec)' }}>
          <span>Taux de présence</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: 'var(--kya-green)' }}>{taux}%</span>
        </div>
        <div style={{ height: 6, background: '#e2ece6', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, width: `${taux}%`,
            background: `linear-gradient(90deg, var(--kya-green-border), var(--kya-green))`,
            transition: 'width 0.9s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, background: 'var(--kya-green)', borderRadius: '50%', display: 'inline-block' }} />
            {present} présents
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, background: '#e8b4ae', borderRadius: '50%', display: 'inline-block' }} />
            {total - present} absents
          </span>
        </div>
      </div>
    </div>
  )
}
