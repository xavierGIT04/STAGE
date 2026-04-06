'use client'

import { useState } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { LoadingOverlay, ErrorBanner } from './ui'
import type { Employee } from '@/types'

type View = 'arrivals' | 'departures'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr(): string {
    return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string): string {
    const today     = todayStr()
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
    if (dateStr === today)     return "Aujourd'hui"
    if (dateStr === yesterday) return 'Hier'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
}

// ─── Date Picker (identique à Mouvements) ────────────────────────────────────
function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
    const today  = todayStr()
    const isToday = value === today

    const goBack = () => {
        const d = new Date(value)
        d.setDate(d.getDate() - 1)
        onChange(d.toISOString().slice(0, 10))
    }
    const goForward = () => {
        const d = new Date(value)
        d.setDate(d.getDate() + 1)
        const next = d.toISOString().slice(0, 10)
        if (next <= today) onChange(next)
    }

    const btnBase = {
        width: 34, height: 34, borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={goBack} style={{ ...btnBase, color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--kya-green)'; e.currentTarget.style.color = 'var(--kya-green)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';    e.currentTarget.style.color = 'var(--text-muted)' }}
            >‹</button>

            <input type="date" value={value} max={today} onChange={e => onChange(e.target.value)}
                   style={{
                       padding: '7px 14px', borderRadius: 8,
                       border: `1px solid ${isToday ? 'var(--kya-green)' : 'var(--border)'}`,
                       background: isToday ? 'var(--kya-green-light)' : 'var(--surface)',
                       color: isToday ? 'var(--kya-green)' : 'var(--text-primary)',
                       fontSize: 13, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                       cursor: 'pointer', outline: 'none', minWidth: 160,
                   }}
            />

            <button onClick={goForward} disabled={isToday}
                    style={{ ...btnBase, color: isToday ? '#ccc' : 'var(--text-muted)', cursor: isToday ? 'not-allowed' : 'pointer', background: isToday ? '#f5f5f5' : 'var(--surface)' }}
                    onMouseEnter={e => { if (!isToday) { e.currentTarget.style.borderColor = 'var(--kya-green)'; e.currentTarget.style.color = 'var(--kya-green)' }}}
                    onMouseLeave={e => { if (!isToday) { e.currentTarget.style.borderColor = 'var(--border)';    e.currentTarget.style.color = 'var(--text-muted)' }}}
            >›</button>

            {!isToday && (
                <button onClick={() => onChange(today)} style={{
                    padding: '7px 14px', borderRadius: 8,
                    border: '1px solid var(--kya-green)', background: 'var(--kya-green)',
                    color: '#fff', fontSize: 12, fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600, cursor: 'pointer',
                }}>
                    Aujourd'hui
                </button>
            )}

            {/* Raccourcis */}
            <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
                {[-1, -2, -3].map(offset => {
                    const d = new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10)
                    const labels: Record<number, string> = { [-1]: 'Hier', [-2]: 'Avant-hier', [-3]: 'J-3' }
                    const sel = value === d
                    return (
                        <button key={offset} onClick={() => onChange(d)} style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 11,
                            border: `1px solid ${sel ? 'var(--kya-green)' : 'var(--border)'}`,
                            background: sel ? 'var(--kya-green-light)' : 'var(--surface)',
                            color: sel ? 'var(--kya-green)' : 'var(--text-muted)',
                            fontFamily: "'Outfit', sans-serif", fontWeight: sel ? 600 : 400,
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                            {labels[offset]}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
    return (
        <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            background: '#f7faf8',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
      <span style={{
          fontSize: 11, letterSpacing: 2, color: 'var(--text-muted)',
          textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
          display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 3, height: 14, background: color, borderRadius: 2, display: 'inline-block' }} />
          {title}
      </span>
            <span style={{
                fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 700,
                color, background: `${color}15`, border: `1px solid ${color}40`,
                padding: '3px 12px', borderRadius: 20,
            }}>
        {count} {count > 1 ? 'personnes' : 'personne'}
      </span>
        </div>
    )
}

// ─── Employee Table ───────────────────────────────────────────────────────────
function EmployeeTable({ data, timeKey, color, emptyMsg }: {
    data: Employee[]
    timeKey: 'arrivalTime' | 'departureTime'
    color: string
    emptyMsg: string
}) {
    if (!data.length) return (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {emptyMsg}
        </div>
    )
    return (
        <div>
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 130px 90px',
                padding: '8px 18px', background: '#f7faf8',
                borderBottom: '1px solid var(--border)',
                fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5,
                textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
            }}>
                <span>Employé</span><span>Département</span><span style={{ textAlign: 'right' }}>Heure</span>
            </div>
            {data.map((e, i) => (
                <div key={e.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 130px 90px',
                    padding: '11px 18px', alignItems: 'center',
                    borderBottom: i < data.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'var(--kya-green)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                            {e.name.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>{e.matricule}</div>
                        </div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.dept}</span>
                    <span style={{ fontSize: 15, fontFamily: "'DM Mono', monospace", fontWeight: 700, color, textAlign: 'right' }}>
            {e[timeKey]}
          </span>
                </div>
            ))}
        </div>
    )
}

// ─── Component principal ──────────────────────────────────────────────────────
export default function Analytics() {
    const [selectedDate, setSelectedDate] = useState<string>(todayStr())
    const [view, setView]                 = useState<View>('arrivals')

    const { data, isLoading, error, refetch } = useAnalytics(selectedDate)
    const isToday = selectedDate === todayStr()

    const { earlyArrivals, lateArrivals, earlyDepartures, lateDepartures } = data!

    const kpis = [
        { label: 'Avant 07h30',  val: earlyArrivals.length,   desc: 'Arrivées anticipées', color: 'var(--kya-green)'  },
        { label: 'Après 07h30',  val: lateArrivals.length,    desc: 'Arrivées tardives',   color: 'var(--kya-red)'    },
        { label: 'Avant 17h30',  val: earlyDepartures.length, desc: 'Départs anticipés',   color: 'var(--kya-orange)' },
        { label: 'Après 17h30',  val: lateDepartures.length,  desc: 'Départs tardifs',     color: 'var(--indigo)'     },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {error && <ErrorBanner message={error} onRetry={refetch} />}

            {/* ── Sélecteur de date ── */}
            <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 0, padding: '16px 20px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12,
                borderLeft: '3px solid var(--kya-green)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 3, height: 14, background: 'var(--kya-green)', borderRadius: 2, display: 'inline-block' }} />
                        <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
              Jour :
            </span>
                    </div>
                    <span style={{
                        fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
            {formatDateLabel(selectedDate)}
          </span>
                    {isToday && (
                        <span style={{
                            fontSize: 9, letterSpacing: 1.5, padding: '2px 8px', borderRadius: 10,
                            background: 'var(--kya-green)', color: '#fff',
                            fontFamily: "'DM Mono', monospace", fontWeight: 600,
                        }}>
              LIVE
            </span>
                    )}
                </div>
                <DatePicker value={selectedDate} onChange={d => { setSelectedDate(d); setView('arrivals') }} />
            </div>

            {/* ── KPIs ── */}
            {isLoading ? (
                <LoadingOverlay />
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        {kpis.map(k => (
                            <div key={k.label} style={{
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: 0, padding: '20px 24px',
                                boxShadow: 'var(--shadow-sm)',
                                borderTop: `3px solid ${k.color}`,
                            }}>
                                <div style={{
                                    fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2,
                                    textTransform: 'uppercase', marginBottom: 10,
                                    fontFamily: "'DM Mono', monospace",
                                }}>
                                    {k.label}
                                </div>
                                <div style={{
                                    fontFamily: "'Outfit', sans-serif", fontSize: 48,
                                    fontWeight: 700, color: k.color, lineHeight: 1,
                                }}>
                                    {k.val}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{k.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Toggle ── */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {(['arrivals', 'departures'] as View[]).map(v => (
                            <button key={v} onClick={() => setView(v)} style={{
                                padding: '9px 22px', borderRadius: 8,
                                border: `1px solid ${view === v ? 'var(--kya-green)' : 'var(--border)'}`,
                                background: view === v ? 'var(--kya-green)' : 'var(--surface)',
                                color: view === v ? '#fff' : 'var(--text-muted)',
                                fontSize: 13, fontFamily: "'Outfit', sans-serif",
                                fontWeight: view === v ? 600 : 400,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                                {v === 'arrivals' ? 'Arrivées' : 'Départs'}
                            </button>
                        ))}
                    </div>

                    {/* ── Tables ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {view === 'arrivals' ? <>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 0, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                <SectionHeader title="Arrivées avant 07h30" count={earlyArrivals.length} color="var(--kya-green)" />
                                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                                    <EmployeeTable data={earlyArrivals} timeKey="arrivalTime" color="var(--kya-green)" emptyMsg="Aucune arrivée anticipée" />
                                </div>
                            </div>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 0, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                <SectionHeader title="Arrivées après 07h30" count={lateArrivals.length} color="var(--kya-red)" />
                                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                                    <EmployeeTable data={lateArrivals} timeKey="arrivalTime" color="var(--kya-red)" emptyMsg="Aucune arrivée tardive" />
                                </div>
                            </div>
                        </> : <>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 0, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                <SectionHeader title="Départs avant 17h30" count={earlyDepartures.length} color="var(--kya-orange)" />
                                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                                    <EmployeeTable data={earlyDepartures} timeKey="departureTime" color="var(--kya-orange)" emptyMsg="Aucun départ anticipé" />
                                </div>
                            </div>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 0, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                <SectionHeader title="Départs après 17h30" count={lateDepartures.length} color="var(--indigo)" />
                                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                                    <EmployeeTable data={lateDepartures} timeKey="departureTime" color="var(--indigo)" emptyMsg="Aucun départ tardif" />
                                </div>
                            </div>
                        </>}
                    </div>
                </>
            )}
        </div>
    )
}
