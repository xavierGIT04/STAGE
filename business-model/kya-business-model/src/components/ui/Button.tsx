interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    children: React.ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { backgroundColor: '#0D2B55', color: '#fff', border: 'none' },
    secondary: { backgroundColor: '#169B86', color: '#fff', border: 'none' },
    outline:   { backgroundColor: 'transparent', color: '#4B5563', border: '1px solid #E5E7EB' },
    danger:    { backgroundColor: '#E24B4A', color: '#fff', border: 'none' },
    ghost:     { backgroundColor: 'transparent', color: '#6B7280', border: 'none' },
}

const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '8px' },
    md: { padding: '9px 18px', fontSize: '13px', borderRadius: '10px' },
    lg: { padding: '12px 24px', fontSize: '14px', borderRadius: '12px' },
}

export default function Button({
                                   variant = 'primary',
                                   size = 'md',
                                   loading = false,
                                   children,
                                   disabled,
                                   style,
                                   ...props
                               }: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled || loading ? 0.55 : 1,
                transition: 'opacity 0.15s, transform 0.1s',
                ...variantStyles[variant],
                ...sizeStyles[size],
                ...style,
            }}
            {...props}
        >
            {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: 14, height: 14 }}
               fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Chargement...
        </span>
            ) : children}
        </button>
    )
}