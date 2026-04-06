// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            border: `2px solid var(--kya-green-mid)`,
            borderTopColor: 'var(--kya-green)',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
        }} />
    )
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px',
            background: 'var(--kya-red-light)', border: '1px solid var(--kya-red-border)',
            borderRadius: 10, fontSize: 13, color: 'var(--kya-red)',
            borderLeft: '3px solid var(--kya-red)',
        }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
            </svg>
            <span style={{ flex: 1 }}>{message}</span>
            {onRetry && (
                <button onClick={onRetry} style={{
                    padding: '4px 12px', borderRadius: 6,
                    border: '1px solid var(--kya-red-border)',
                    background: 'var(--surface)', color: 'var(--kya-red)',
                    fontSize: 12, cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    Réessayer
                </button>
            )}
        </div>
    )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
type Accent = 'green' | 'red' | 'amber' | 'indigo' | 'gray'

const ACCENT: Record<Accent, { bg: string; border: string; text: string; bar?: string }> = {
    green:  { bg: 'var(--kya-green-light)',  border: 'var(--kya-green-border)',  text: 'var(--kya-green)',  bar: 'var(--kya-green)' },
    red:    { bg: 'var(--kya-red-light)',    border: 'var(--kya-red-border)',    text: 'var(--kya-red)'    },
    amber:  { bg: 'var(--kya-orange-light)', border: 'var(--kya-orange-border)', text: 'var(--kya-orange)' },
    indigo: { bg: 'var(--indigo-light)',     border: 'var(--indigo-border)',     text: 'var(--indigo)'     },
    gray:   { bg: '#f2f6f3',                border: 'var(--border)',            text: 'var(--text-sec)'   },
}

interface StatCardProps {
    label:   string
    value:   number | string
    sub?:    string
    accent?: Accent
    loading?: boolean
}

export function StatCard({ label, value, sub, accent = 'gray', loading }: StatCardProps) {
    const c = ACCENT[accent]
    return (
        <div style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 0,
            padding: '18px 22px',
            flex: 1,
            borderTop: accent !== 'gray' ? `3px solid ${c.text}` : `1px solid ${c.border}`,
        }}>
            <div style={{
                fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2,
                textTransform: 'uppercase', marginBottom: 10,
                fontFamily: "'DM Mono', monospace",
            }}>
                {label}
            </div>
            {loading ? (
                <div style={{ height: 44, display: 'flex', alignItems: 'center' }}>
                    <Spinner size={18} />
                </div>
            ) : (
                <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 42, fontWeight: 700,
                    color: c.text, lineHeight: 1,
                }}>
                    {value}
                </div>
            )}
            {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
        </div>
    )
}

// ─── LoadingOverlay ───────────────────────────────────────────────────────────
export function LoadingOverlay() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 300, gap: 14,
        }}>
            <Spinner size={32} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chargement des données…</span>
        </div>
    )
}
