'use client'
import { useEffect, useRef } from 'react'
import type { BadgeEvent } from '@/types'

export default function EventLog({ events }: { events: BadgeEvent[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [events])

  return (
    <div>
      <div style={{
        fontSize: 11, letterSpacing: 2, color: 'var(--text-muted)',
        textTransform: 'uppercase', marginBottom: 12,
        fontFamily: "'DM Mono', monospace",
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 3, height: 14, background: 'var(--kya-green)', borderRadius: 2, display: 'inline-block' }} />
        Journal des mouvements
      </div>

      <div ref={ref} style={{ height: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {events.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
            Aucun mouvement enregistré
          </div>
        ) : events.map((e, i) => (
          <div key={e.id} className={i === 0 ? 'slide-in' : ''} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 8,
            background: e.type === 'IN' ? 'var(--kya-green-light)' : 'var(--kya-red-light)',
            border: `1px solid ${e.type === 'IN' ? 'var(--kya-green-border)' : 'var(--kya-red-border)'}`,
            borderLeft: `3px solid ${e.type === 'IN' ? 'var(--kya-green)' : 'var(--kya-red)'}`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: e.type === 'IN' ? 'var(--kya-green-mid)' : '#f5d0cc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 13,
              color: e.type === 'IN' ? 'var(--kya-green)' : 'var(--kya-red)',
              fontWeight: 700,
            }}>
              {e.type === 'IN' ? '↑' : '↓'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.dept}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontSize: 13, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                color: e.type === 'IN' ? 'var(--kya-green)' : 'var(--kya-red)',
              }}>
                {e.time}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {e.type === 'IN' ? 'Arrivée' : 'Départ'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
