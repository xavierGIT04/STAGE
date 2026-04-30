'use client'


import { LogOut } from 'lucide-react';

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/superbase/client'
import Logo from "@/components/ui/Logo";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router   = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>

            {/* Navbar */}
            <nav style={{
                height: '56px', backgroundColor: '#1ca18c',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 32px',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                {/* Logo — gauche */}
                <Link href={"/"}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            backgroundColor: '#F0A02B',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Logo/>
                        </div>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                KYA Business Model
            </span>
                    </div>
                </Link>

                {/* Droite : Paramètres + séparateur + Sign out */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                    <Link
                        href="/parametres"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '13px', color: 'rgba(255,255,255,0.85)',
                            textDecoration: 'none', padding: '6px 12px',
                            borderRadius: '8px', transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Paramètres
                    </Link>

                    {/* Séparateur vertical */}
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.25)' }} />

                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '13px', color: 'rgba(255,255,255,0.85)',
                            backgroundColor: 'transparent', border: 'none',
                            cursor: 'pointer', fontFamily: 'inherit',
                            padding: '6px 12px', borderRadius: '8px',
                            transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <LogOut size={14} />
                        Sign out
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                {children}
            </main>
        </div>
    )
}