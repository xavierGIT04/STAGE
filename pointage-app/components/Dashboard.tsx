'use client'
import PresenceCircle from './PresenceCircle'
import EventLog from './EventLog'
import { StatCard, ErrorBanner } from './ui'
import type { Employee, BadgeEvent, DashboardStats } from '@/types'

interface Props {
    employees:  Employee[]
    events:     BadgeEvent[]
    stats:      DashboardStats
    isLoading:  boolean
    error:      string | null
}

export default function Dashboard({ employees, events, stats, isLoading, error }: Props) {
    const presentList = employees.filter(e => e.present)

    const card = {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 0,
        boxShadow: 'var(--shadow-sm)',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && <ErrorBanner message={error} />}

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

                {/* ── Colonne gauche — cercle ── */}
                <div style={{
                    ...card,
                    padding: 28,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
                    borderTop: '3px solid var(--kya-green)',
                }}>
                    <div style={{ width: '100%' }}>
                        <div style={{
                            fontSize: 11, letterSpacing: 2, color: 'var(--text-muted)',
                            textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                            marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <span style={{ width: 3, height: 14, background: 'var(--kya-green)', borderRadius: 2, display: 'inline-block' }} />
                            Présence en temps réel
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 11 }}>Polling toutes les 5 s</div>
                    </div>

                    <PresenceCircle present={stats.presentCount} total={stats.totalEmployees} />

                    <div style={{ width: '100%', height: 1, background: 'var(--border-soft)' }} />

                    <div style={{ width: '100%' }}>
                        {([
                            ["Effectif total",         stats.totalEmployees],
                            ["Arrivées aujourd'hui",    stats.arrivedToday],
                            ["Départs aujourd'hui",     stats.departedToday],
                            ["En attente",             stats.pendingArrival],
                        ] as [string, number][]).map(([label, val]) => (
                            <div key={label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 0', borderBottom: '1px solid var(--border-soft)',
                            }}>
                                <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{label}</span>
                                <span style={{
                                    fontFamily: "'DM Mono', monospace", fontSize: 15,
                                    fontWeight: 600, color: 'var(--kya-green)',
                                }}>
                  {val}
                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Colonne droite ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* KPIs */}
                    <div style={{ display: 'flex', gap: 16 }}>
                        <StatCard label="Sur site"  value={stats.presentCount}                        sub={`${stats.presenceRate}% de l'effectif`} accent="green" loading={isLoading} />
                        <StatCard label="Absents"   value={stats.totalEmployees - stats.presentCount} sub="Hors site"                              accent="red"   loading={isLoading} />
                        <StatCard label="Arrivées"  value={stats.arrivedToday}                        sub="Aujourd'hui"                            accent="gray"  loading={isLoading} />
                        <StatCard label="Départs"   value={stats.departedToday}                       sub="Aujourd'hui"                            accent="gray"  loading={isLoading} />
                    </div>

                    {/* Journal */}
                    <div style={{ ...card, padding: 24 }}>
                        <EventLog events={events} />
                    </div>

                    {/* Présents sur site */}
                    <div style={{ ...card, padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{
                                fontSize: 11, letterSpacing: 2, color: 'var(--text-muted)',
                                textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{ width: 3, height: 14, background: 'var(--kya-green)', borderRadius: 2, display: 'inline-block' }} />
                                Personnel sur site
                            </div>
                            <div style={{
                                fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                                color: 'var(--kya-green)', background: 'var(--kya-green-light)',
                                border: '1px solid var(--kya-green-border)', padding: '3px 12px', borderRadius: 20,
                            }}>
                                {presentList.length} / {stats.totalEmployees}
                            </div>
                        </div>

                        {presentList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                                Aucun employé présent sur site
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                                {presentList.map(e => (
                                    <div key={e.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', borderRadius: 10,
                                        border: '1px solid var(--kya-green-border)',
                                        background: 'var(--kya-green-light)',
                                    }}>
                                        <div style={{
                                            width: 34, height: 34, borderRadius: '50%',
                                            background: 'var(--kya-green)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, fontWeight: 700, color: '#ffffff', flexShrink: 0,
                                        }}>
                                            {e.name.charAt(0)}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {e.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 5 }}>
                                                <span>{e.dept}</span><span>·</span>
                                                <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--kya-green)', fontWeight: 500 }}>{e.arrivalTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
