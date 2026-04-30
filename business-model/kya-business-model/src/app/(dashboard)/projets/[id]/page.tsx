'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/superbase/client'
import { Projet } from '@/lib/superbase/types'

// Sections
import SectionQuiSommesNous from '@/components/sections/SectionQuiSommesNous'
import SectionInformations from '@/components/sections/SectionInformations'
import SectionProduits    from '@/components/sections/SectionProduits'
import SectionHypotheses  from '@/components/sections/SectionHypotheses'
import SectionCouts      from '@/components/sections/SectionCouts'
import SectionRevenus    from '@/components/sections/SectionRevenus'
import SectionPartenaires from '@/components/sections/SectionPartenaires'
import SectionConcurrents from '@/components/sections/SectionConcurrents'
import SectionPrevisions  from '@/components/sections/SectionPrevisions'
import SectionDashboard   from '@/components/sections/SectionDashboard'
import SectionImpacts from '@/components/sections/SectionImpacts'
import SectionRisques from '@/components/sections/SectionRisques'
import SectionSegmentClientele from '@/components/sections/SectionSegmentClientele'

const SECTIONS = [
    { id: 1,  label: 'Qui sommes-nous ?'        },
    { id: 2,  label: 'Informations'             },
    { id: 3,  label: 'Produits & Services'      },
    { id: 4,  label: 'Hypothèses'               },
    { id: 5,  label: 'Coûts & Composants'       },
    { id: 6,  label: 'Revenus'                  },
    { id: 7,  label: 'Partenaires'   },
    { id: 8, label: 'Segment Clientèle' },
    { id: 9,  label: 'Concurrents'              },
    { id: 10, label: 'Impacts du projet'        },
    { id: 11, label: 'Risques'                  },
    { id: 12, label: 'Prévisions financières'   },
    { id: 13, label: 'KPIs & Dashboard'         },
]


const statutConfig: Record<string, { label: string; bg: string; color: string }> = {
    draft:    { label: 'Draft',    bg: '#FFF3DC', color: '#854F0B' },
    en_cours: { label: 'En cours', bg: '#E1F5EE', color: '#0F6E56' },
    finalise: { label: 'Finalisé', bg: '#E6F1FB', color: '#0C447C' },
    archive:  { label: 'Archivé', bg: '#F3F4F6', color: '#4B5563' },
}

export default function ProjetPage() {
    const [projet, setProjet]           = useState<Projet | null>(null)
    const [sectionActive, setSection]   = useState(1)
    const [sectionsOk, setSectionsOk]   = useState<number[]>([])
    const [loading, setLoading]         = useState(true)
    // ← NOUVEAU : version incrémentée à chaque sauvegarde pour forcer le rechargement du dashboard
    const [dashboardVersion, setDashboardVersion] = useState(0)
    const router   = useRouter()
    const params   = useParams()
    const supabase = createClient()
    const id       = params.id as string

    useEffect(() => { fetchProjet() }, [id])

    const fetchProjet = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('projets')
            .select('*')
            .eq('id', id)
            .single()
        if (data) setProjet(data)
        else router.push('/')
        setLoading(false)
    }

    const markSectionOk = useCallback((sectionId: number) => {
        setSectionsOk(prev => prev.includes(sectionId) ? prev : [...prev, sectionId])
        // ← Incrémenter la version du dashboard à chaque sauvegarde d'une section
        setDashboardVersion(v => v + 1)
    }, [])

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF', fontSize: '14px' }}>
                Chargement...
            </div>
        )
    }

    if (!projet) return null

    const statut = statutConfig[projet.statut] || statutConfig.draft

    const renderSection = () => {
        switch (sectionActive) {
            case 1:  return <SectionQuiSommesNous      projetId={id} onSave={() => markSectionOk(1)}  />
            case 2:  return <SectionInformations        projet={projet} onSave={(p) => { setProjet(p); markSectionOk(2) }} />
            case 3:  return <SectionProduits           projetId={id} onSave={() => markSectionOk(3)}  />
            case 4:  return <SectionHypotheses         projetId={id} onSave={() => markSectionOk(4)}  />
            case 5:  return <SectionCouts              projetId={id} onSave={() => markSectionOk(5)}  />
            case 6:  return <SectionRevenus            projetId={id} onSave={() => markSectionOk(6)}  />
            case 7:  return <SectionPartenaires        projetId={id} onSave={() => markSectionOk(7)}  />
            case 8: return <SectionSegmentClientele projetId={id} onSave={() => markSectionOk(14)} />
            case 9:  return <SectionConcurrents        projetId={id} onSave={() => markSectionOk(8)}  />
            case 10: return <SectionImpacts            projetId={id} onSave={() => markSectionOk(10)} />
            case 11: return <SectionRisques            projetId={id} onSave={() => markSectionOk(11)} />
            case 12: return <SectionPrevisions         projetId={id} onSave={() => markSectionOk(12)} />
            case 13: return <SectionDashboard          key={dashboardVersion} projetId={id} />
            default: return (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                    <p style={{ fontSize: '14px' }}>Section en cours de développement...</p>
                </div>
            )
        }
    }

    return (
        <div style={{ display: 'flex', gap: '0', minHeight: 'calc(100vh - 56px)', margin: '-32px -24px' }}>

            {/* ── Sidebar ─────────────────────────────────────────────────────── */}
            <div style={{
                width: '220px', flexShrink: 0,
                backgroundColor: '#fff',
                borderRight: '1px solid #E5E7EB',
                padding: '24px 0',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Nom projet */}
                <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #F3F4F6' }}>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                        Projet
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 6px', lineHeight: 1.3 }}>
                        {projet.nom}
                    </p>
                    <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '20px', backgroundColor: statut.bg, color: statut.color
                    }}>
                        {statut.label}
                    </span>
                </div>

                {/* Sections */}
                <div style={{ padding: '16px 0', flex: 1 }}>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 16px', marginBottom: '8px' }}>
                        Sections
                    </p>
                    {SECTIONS.map(s => {
                        const isActive = sectionActive === s.id
                        const isDone   = sectionsOk.includes(s.id)
                        return (
                            <div
                                key={s.id}
                                onClick={() => setSection(s.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 16px', cursor: 'pointer',
                                    backgroundColor: isActive ? '#F9FAFB' : 'transparent',
                                    borderRight: isActive ? '3px solid #F0A02B' : '3px solid transparent',
                                    transition: 'background-color 0.1s',
                                }}
                            >
                                {/* Numéro */}
                                <div style={{
                                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', fontWeight: 600,
                                    backgroundColor: isDone ? '#169B86' : isActive ? '#F0A02B' : '#F3F4F6',
                                    color: isDone || isActive ? '#fff' : '#6B7280',
                                }}>
                                    {isDone ? '✓' : s.id}
                                </div>
                                <span style={{
                                    fontSize: '12px', fontWeight: isActive ? 600 : 400,
                                    color: isActive ? '#111827' : '#6B7280',
                                    lineHeight: 1.3,
                                }}>
                                    {s.label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Progression */}
                <div style={{ padding: '16px', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Progression</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#169B86' }}>
                            {sectionsOk.length} / {SECTIONS.length}
                        </span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: '#F3F4F6', borderRadius: '2px' }}>
                        <div style={{
                            height: '4px', borderRadius: '2px',
                            backgroundColor: '#169B86',
                            width: `${(sectionsOk.length / SECTIONS.length) * 100}%`,
                            transition: 'width 0.3s',
                        }} />
                    </div>
                </div>
            </div>

            {/* ── Contenu principal ────────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{
                    height: '56px', backgroundColor: '#0D2B55',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '0 28px',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                fontSize: '13px', color: '#9FB4CC',
                                background: 'none', border: 'none',
                                cursor: 'pointer', fontFamily: 'inherit'
                            }}
                        >
                            ← Mes projets
                        </button>
                        <span style={{ color: '#4B6584', fontSize: '13px' }}>/</span>
                        <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
                            {projet.nom}
                        </span>
                        <span style={{
                            fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: '20px', backgroundColor: statut.bg, color: statut.color
                        }}>
                            {statut.label}
                        </span>
                    </div>
                </div>

                {/* Section active */}
                <div style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
                    {renderSection()}
                </div>

            </div>
        </div>
    )
}