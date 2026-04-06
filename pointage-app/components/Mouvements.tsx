'use client'

import { useState, useMemo } from 'react'
import { useMovements } from '@/hooks/useMovements'
import { ErrorBanner } from './ui'
import type { BadgeEvent } from '@/types'

type FilterType = 'ALL' | 'IN' | 'OUT'

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
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ label, active, color, onClick }: {
    label: string; active: boolean
    color: { active: string; activeBg: string; activeBorder: string }
    onClick: () => void
}) {
    return (
        <button onClick={onClick} style={{
            padding: '7px 16px', borderRadius: 8,
            border: `1px solid ${active ? color.activeBorder : 'var(--border)'}`,
            background: active ? color.activeBg : 'var(--surface)',
            color: active ? color.active : 'var(--text-muted)',
            fontSize: 12, fontFamily: "'DM Mono', monospace",
            fontWeight: active ? 600 : 400, letterSpacing: 1,
            cursor: 'pointer', transition: 'all 0.15s',
        }}>
            {label}
        </button>
    )
}

// ─── Event Row ────────────────────────────────────────────────────────────────
function EventRow({ event, isFirst }: { event: BadgeEvent; isFirst: boolean }) {
    const isIN = event.type === 'IN'
    return (
        <div
            className={isFirst ? 'slide-in' : ''}
            style={{
                display: 'grid',
                gridTemplateColumns: '70px 36px 1fr 130px 90px',
                alignItems: 'center', gap: 16,
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-soft)',
                transition: 'background 0.15s',
                cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f7faf8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
            {/* Heure */}
            <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700,
                color: isIN ? 'var(--kya-green)' : 'var(--kya-red)', letterSpacing: 1,
            }}>
        {event.time}
      </span>

            {/* Icône */}
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isIN ? 'var(--kya-green)' : 'var(--kya-red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, color: '#fff', fontWeight: 700, flexShrink: 0,
            }}>
                {isIN ? '↑' : '↓'}
            </div>

            {/* Nom + ID */}
            <div style={{ minWidth: 0 }}>
                <div style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {event.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                    {event.employeeId}
                </div>
            </div>



            {/* Badge IN/OUT */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{
                    padding: '4px 12px', borderRadius: 20,
                    fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 700, letterSpacing: 2,
                    color: '#fff',
                    background: isIN ? 'var(--kya-green)' : 'var(--kya-red)',
                }}>
                  {isIN ? 'ENTRÉE' : 'SORTIE'}
                </span>
            </div>
        </div>
    )
}

// ─── Date Picker ──────────────────────────────────────────────────────────────
function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
    const today = todayStr()

    const goBack    = () => {
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

    const isToday = value === today

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Bouton précédent */}
            <button onClick={goBack} style={{
                width: 34, height: 34, borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
            }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--kya-green)'; e.currentTarget.style.color = 'var(--kya-green)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
                ‹
            </button>

            {/* Champ date natif */}
            <div style={{ position: 'relative' }}>
                <input
                    type="date"
                    value={value}
                    max={today}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: `1px solid ${isToday ? 'var(--kya-green)' : 'var(--border)'}`,
                        background: isToday ? 'var(--kya-green-light)' : 'var(--surface)',
                        color: isToday ? 'var(--kya-green)' : 'var(--text-primary)',
                        fontSize: 13,
                        fontFamily: "'DM Mono', monospace",
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        minWidth: 160,
                    }}
                />
            </div>

            {/* Bouton suivant */}
            <button onClick={goForward} disabled={isToday} style={{
                width: 34, height: 34, borderRadius: 8,
                border: '1px solid var(--border)',
                background: isToday ? '#f5f5f5' : 'var(--surface)',
                color: isToday ? '#ccc' : 'var(--text-muted)',
                fontSize: 16, cursor: isToday ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
            }}
                    onMouseEnter={e => { if (!isToday) { e.currentTarget.style.borderColor = 'var(--kya-green)'; e.currentTarget.style.color = 'var(--kya-green)' }}}
                    onMouseLeave={e => { if (!isToday) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}}
            >
                ›
            </button>

            {/* Bouton "Aujourd'hui" */}
            {!isToday && (
                <button onClick={() => onChange(today)} style={{
                    padding: '7px 14px', borderRadius: 8,
                    border: '1px solid var(--kya-green)',
                    background: 'var(--kya-green)',
                    color: '#fff', fontSize: 12,
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                }}>
                    Aujourd'hui
                </button>
            )}
        </div>
    )
}

// ─── Component principal ──────────────────────────────────────────────────────
export default function Mouvements() {
    const [selectedDate, setSelectedDate] = useState<string>(todayStr())
    const [filterType, setFilterType]     = useState<FilterType>('ALL')
    const [search, setSearch]             = useState('')

    const { events, isLoading, error, refetch } = useMovements(selectedDate)
    const isToday = selectedDate === todayStr()

    const filtered = useMemo(() => events.filter(ev => {
        if (filterType !== 'ALL' && ev.type !== filterType) return false
        if (search.trim()) {
            const q = search.toLowerCase()
            if (!ev.name.toLowerCase().includes(q) && !ev.dept.toLowerCase().includes(q) && !ev.employeeId.toLowerCase().includes(q)) return false
        }
        return true
    }), [events, filterType, search])

    const totalIn  = events.filter(e => e.type === 'IN').length
    const totalOut = events.filter(e => e.type === 'OUT').length

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {error && <ErrorBanner message={error} onRetry={refetch} />}

            {/* ── KPIs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                    { label: 'Total mouvements', val: events.length, dark: true },
                    { label: 'Entrées',          val: totalIn,       dark: false, color: 'var(--kya-green)', bg: 'var(--kya-green-light)', border: 'var(--kya-green-border)' },
                    { label: 'Sorties',          val: totalOut,      dark: false, color: 'var(--kya-red)',   bg: 'var(--kya-red-light)',   border: 'var(--kya-red-border)'   },
                ].map(k => (
                    <div key={k.label} style={{
                        background:   k.dark ? 'var(--kya-green)' : k.bg,
                        border:       k.dark ? 'none' : `1px solid ${k.border}`,
                        borderRadius: 0, padding: '20px 24px',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div style={{
                            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                            marginBottom: 10, fontFamily: "'DM Mono', monospace",
                            color: k.dark ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)',
                        }}>
                            {k.label}
                        </div>
                        <div style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: 48, fontWeight: 700, lineHeight: 1,
                            color: k.dark ? '#ffffff' : k.color,
                        }}>
                            {isLoading ? '—' : k.val}
                        </div>
                        <div style={{ fontSize: 11, marginTop: 6, color: k.dark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
                            {formatDateLabel(selectedDate)}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tableau principal ── */}
            <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 0, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                borderTop: '3px solid var(--kya-green)',
            }}>

                {/* En-tête */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                    background: '#f7faf8', display: 'flex', flexDirection: 'column', gap: 14,
                }}>

                    {/* Ligne 1 : titre + compteur */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                            fontSize: 11, letterSpacing: 2, color: 'var(--text-muted)',
                            textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <span style={{ width: 3, height: 14, background: 'var(--kya-green)', borderRadius: 2, display: 'inline-block' }} />
                            Journal — {formatDateLabel(selectedDate)}
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
                        <span style={{
                            fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 700,
                            color: 'var(--kya-green)', background: 'var(--kya-green-light)',
                            border: '1px solid var(--kya-green-border)', padding: '3px 12px', borderRadius: 20,
                        }}>
              {filtered.length} mouvement{filtered.length > 1 ? 's' : ''}
            </span>
                    </div>

                    {/* Ligne 2 : sélecteur de date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <DatePicker value={selectedDate} onChange={d => { setSelectedDate(d); setFilterType('ALL'); setSearch('') }} />

                        {/* Raccourcis rapides */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            {[-1, -2, -3].map(offset => {
                                const d = new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10)
                                const labels: Record<number, string> = { [-1]: 'Hier', [-2]: 'Avant-hier', [-3]: 'J-3' }
                                const isSelected = selectedDate === d
                                return (
                                    <button key={offset} onClick={() => { setSelectedDate(d); setFilterType('ALL'); setSearch('') }} style={{
                                        padding: '6px 12px', borderRadius: 8, fontSize: 11,
                                        border: `1px solid ${isSelected ? 'var(--kya-green)' : 'var(--border)'}`,
                                        background: isSelected ? 'var(--kya-green-light)' : 'var(--surface)',
                                        color: isSelected ? 'var(--kya-green)' : 'var(--text-muted)',
                                        fontFamily: "'Outfit', sans-serif", fontWeight: isSelected ? 600 : 400,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                        {labels[offset]}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Ligne 3 : filtres type + recherche */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <Pill label="TOUS"    active={filterType === 'ALL'} color={{ active: 'var(--kya-green)', activeBg: 'var(--kya-green-light)', activeBorder: 'var(--kya-green-border)' }} onClick={() => setFilterType('ALL')} />
                            <Pill label="ENTRÉES" active={filterType === 'IN'}  color={{ active: 'var(--kya-green)', activeBg: 'var(--kya-green-light)', activeBorder: 'var(--kya-green-border)' }} onClick={() => setFilterType('IN')}  />
                            <Pill label="SORTIES" active={filterType === 'OUT'} color={{ active: 'var(--kya-red)',   activeBg: 'var(--kya-red-light)',   activeBorder: 'var(--kya-red-border)'   }} onClick={() => setFilterType('OUT')} />
                        </div>
                        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
                        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                                 width="13" height="13" viewBox="0 0 16 16" fill="none">
                                <circle cx="7" cy="7" r="5.5" stroke="var(--text-muted)" strokeWidth="1.5"/>
                                <path d="M11 11L14 14" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <input type="text" placeholder="Rechercher un employé…"
                                   value={search} onChange={e => setSearch(e.target.value)}
                                   style={{
                                       width: '100%', paddingLeft: 32, paddingRight: 12,
                                       paddingTop: 7, paddingBottom: 7,
                                       borderRadius: 8, border: '1px solid var(--border)',
                                       background: 'var(--surface)', fontSize: 12,
                                       fontFamily: "'Outfit', sans-serif",
                                       color: 'var(--text-primary)', outline: 'none',
                                   }}
                            />
                        </div>
                        {(filterType !== 'ALL' || search) && (
                            <button onClick={() => { setFilterType('ALL'); setSearch('') }} style={{
                                padding: '7px 12px', borderRadius: 8,
                                border: '1px solid var(--border)', background: 'var(--surface)',
                                color: 'var(--text-muted)', fontSize: 11,
                                fontFamily: "'DM Mono', monospace", cursor: 'pointer',
                            }}>
                                ✕ Réinitialiser
                            </button>
                        )}
                    </div>
                </div>

                {/* En-têtes colonnes */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '70px 36px 1fr 130px 90px',
                    gap: 16, padding: '9px 20px', background: '#f7faf8',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5,
                    textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                }}>
                    <span>Heure</span><span /><span>Employé</span>
                    <span style={{ textAlign: 'right' }}>Type</span>
                </div>

                {/* Lignes */}
                <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                    {isLoading ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '60px 0', gap: 12, color: 'var(--text-muted)', fontSize: 13,
                        }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: '50%',
                                border: '2px solid var(--kya-green-border)',
                                borderTopColor: 'var(--kya-green)',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                            Chargement du {formatDateLabel(selectedDate).toLowerCase()}…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                            {events.length === 0
                                ? `Aucun mouvement enregistré le ${formatDateLabel(selectedDate).toLowerCase()}`
                                : 'Aucun résultat pour ces filtres'}
                        </div>
                    ) : (
                        filtered.map((ev, i) => <EventRow key={ev.id} event={ev} isFirst={i === 0} />)
                    )}
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                    <div style={{
                        padding: '12px 20px', borderTop: '1px solid var(--border-soft)',
                        background: '#f7faf8', display: 'flex', justifyContent: 'space-between',
                        fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace",
                        alignItems: 'center',
                    }}>
            <span>
              {filtered.filter(e => e.type === 'IN').length} entrée{filtered.filter(e => e.type === 'IN').length > 1 ? 's' : ''}
                {' · '}
                {filtered.filter(e => e.type === 'OUT').length} sortie{filtered.filter(e => e.type === 'OUT').length > 1 ? 's' : ''}
            </span>
                        <span>{isToday ? `Dernier : ${filtered[0]?.time ?? '—'}` : selectedDate}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
