'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/superbase/client'
import Logo from "@/components/ui/Logo";


export default function LoginPage() {
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState('')
    const router   = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
        router.push('/')
        router.refresh()
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#F9FAFB', padding: '24px'
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        margin: '0 auto 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Logo/>
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                        KYA Business Model
                    </h1>
                    <p style={{ fontSize: '13px', color: '#169B86', marginTop: '4px' }}>
                        Move beyond the sky !
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    backgroundColor: '#fff', borderRadius: '16px',
                    border: '1px solid #E5E7EB', padding: '32px'
                }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: '#111827' }}>
                        Connexion
                    </h2>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                                Adresse email
                            </label>
                            <input
                                type="email" value={email} required
                                onChange={e => setEmail(e.target.value)}
                                placeholder="vous@kya-energy.com"
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: '13px',
                                    border: '1px solid #E5E7EB', borderRadius: '10px',
                                    outline: 'none', fontFamily: 'inherit', color: '#111827'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                                Mot de passe
                            </label>
                            <input
                                type="password" value={password} required
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: '13px',
                                    border: '1px solid #E5E7EB', borderRadius: '10px',
                                    outline: 'none', fontFamily: 'inherit', color: '#111827'
                                }}
                            />
                        </div>

                        {error && (
                            <p style={{ fontSize: '13px', color: '#E24B4A', backgroundColor: '#FEF2F2', padding: '10px 14px', borderRadius: '8px' }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '11px', fontSize: '14px',
                                fontWeight: 600, color: '#fff', backgroundColor: '#0D2B55',
                                border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1, fontFamily: 'inherit', marginTop: '4px'
                            }}
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </button>

                    </form>
                </div>

                {/* Barre KYA */}
                <div style={{ display: 'flex', height: '3px', borderRadius: '2px', overflow: 'hidden', margin: '20px auto 0', width: '80px' }}>
                    <div style={{ flex: 1, backgroundColor: '#0D2B55' }} />
                    <div style={{ flex: 1, backgroundColor: '#F0A02B' }} />
                    <div style={{ flex: 1, backgroundColor: '#169B86' }} />
                </div>

                <p style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '12px' }}>
                    © KYA-Energy Group 2026 — Usage interne
                </p>
            </div>
        </div>
    )
}