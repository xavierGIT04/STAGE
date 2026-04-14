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
                <Link href={"/"}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            backgroundColor: '#F0A02B',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Logo/>
                        </div>
                        <span style={{color: '#fff', fontWeight: 600, fontSize: '14px'}}>
                            KYA Business Model
                        </span>
                    </div>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {['#fff', '#F0A02B', '#169B86'].map((c, i) => (
                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c, opacity: c === '#fff' ? 0.4 : 1 }} />
                    ))}
                </div>
                <div className="flex items-center gap-3 bg-transparent p-2">
                    {/* Le cercle reste vert, il ressort bien sur le noir */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#169B86] text-white shadow-sm" style={{color: '#fff'}}>
                        <LogOut size={16} />
                    </div>

                    {/* Modification : texte blanc (slate-200) et hover plus lumineux */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-[13px] font-medium text-white-200 hover:text-white transition-colors"
                        style={{color: '#fff'}}
                    >
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