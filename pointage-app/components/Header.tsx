'use client'
import { useState, useEffect } from 'react'

export type Tab = 'dashboard' | 'analytics' | 'mouvements'

interface HeaderProps {
    activeTab:    Tab
    setActiveTab: (t: Tab) => void
    isConnected:  boolean
    lastSync:     Date | null
}

const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard',  label: 'Temps réel'  },
    { id: 'analytics',  label: 'Analyse'     },
    { id: 'mouvements', label: 'Mouvements'  },
]

export default function Header({ activeTab, setActiveTab, isConnected, lastSync }: HeaderProps) {
    const [time, setTime]           = useState('')
    const [date, setDate]           = useState('')
    const [syncLabel, setSyncLabel] = useState('')

    useEffect(() => {
        const tick = () => {
            const n = new Date()
            setTime(n.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
            setDate(n.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
            if (lastSync) {
                const diff = Math.round((n.getTime() - lastSync.getTime()) / 1000)
                setSyncLabel(diff < 5 ? 'Sync. maintenant' : `Sync. il y a ${diff}s`)
            }
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [lastSync])

    return (
        <header style={{
            background: 'var(--kya-green)',
            position: 'sticky', top: 0, zIndex: 100,
            boxShadow: '0 2px 12px rgba(13,92,61,0.3)',
        }}>
            {/* Top bar */}
            <div style={{
                maxWidth: 1280, margin: '0 auto', padding: '0 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 66,
            }}>
                {/* Logo + Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                        src="/logo-kya.png"
                        alt="KYA-Energy Group"
                        style={{
                            width: 46, height: 46,
                            objectFit: 'contain',
                            flexShrink: 0,
                        }}
                    />
                    <div>
                        <div style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 700, fontSize: 17,
                            color: '#ffffff', letterSpacing: '-0.3px',
                        }}>
                            KYA Pointage
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', fontFamily: "'DM Mono', monospace", letterSpacing: 0.3 }}>
                            {date}
                        </div>
                    </div>
                </div>

                {/* Right: sync + clock */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    {/* Sync status */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: isConnected ? '#4ade80' : '#f87171',
                                boxShadow: isConnected ? '0 0 0 2px rgba(74,222,128,0.3)' : 'none',
                                animation: isConnected ? 'pulseGreen 2s infinite' : 'none',
                            }} />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                {isConnected ? 'CONNECTÉ' : 'HORS LIGNE'}
              </span>
                        </div>
                        {syncLabel && (
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Mono', monospace" }}>
                {syncLabel}
              </span>
                        )}
                    </div>

                    {/* Clock */}
                    <div style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 22,
                        fontWeight: 500, letterSpacing: 3,
                        color: '#ffffff',
                        padding: '6px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.15)',
                    }}>
                        {time}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                maxWidth: 1280, margin: '0 auto', padding: '0 32px',
                display: 'flex',
                borderTop: '1px solid rgba(255,255,255,0.1)',
            }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                        padding: '11px 22px',
                        background: 'none', border: 'none',
                        borderBottom: `2px solid ${activeTab === t.id ? '#ffffff' : 'transparent'}`,
                        color: activeTab === t.id ? '#ffffff' : 'rgba(255,255,255,0.55)',
                        fontSize: 13,
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: activeTab === t.id ? 600 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                        marginBottom: -1,
                        letterSpacing: '0.2px',
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>
        </header>
    )
}
