'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/superbase/client'
import { Projet } from '@/lib/superbase/types'

const statutConfig: Record<string, { label: string; bg: string; color: string }> = {
    draft:    { label: 'Draft',    bg: '#FFF3DC', color: '#854F0B' },
    en_cours: { label: 'En cours', bg: '#E1F5EE', color: '#0F6E56' },
    finalise: { label: 'Finalisé', bg: '#E6F1FB', color: '#0C447C' },
    archive:  { label: 'Archivé', bg: '#F3F4F6', color: '#4B5563' },
}

export default function HomePage() {
    const [projets, setProjets] = useState<Projet[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch]   = useState('')
    const [filtre, setFiltre]   = useState('tous')
    const router   = useRouter()
    const supabase = createClient()

    useEffect(() => { fetchProjets() }, [])

    const fetchProjets = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('projets')
            .select('*')
            .order('updated_at', { ascending: false })
        if (data) setProjets(data)
        setLoading(false)
    }

    const projetsFiltres = projets.filter(p => {
        const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase())
        const matchFiltre = filtre === 'tous' || p.statut === filtre
        return matchSearch && matchFiltre
    })

    const stats = [
        { label: 'Total',    value: projets.length,                                        color: '#0D2B55' },
        { label: 'En cours', value: projets.filter(p => p.statut === 'en_cours').length,   color: '#169B86' },
        { label: 'Draft',    value: projets.filter(p => p.statut === 'draft').length,      color: '#F0A02B' },
        { label: 'Finalisé', value: projets.filter(p => p.statut === 'finalise').length,   color: '#0C447C' },
    ]

    const dateRelative = (dateStr: string) => {
        const jours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
        if (jours === 0) return "aujourd'hui"
        if (jours === 1) return 'hier'
        return `il y a ${jours} jours`
    }

    return (
        <div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Mes projets
                    </h1>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                        {projets.length} Business Model{projets.length > 1 ? 's' : ''} au total
                    </p>
                </div>
                <button
                    onClick={() => router.push('/projets/nouveau')}
                    style={{
                        padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                        color: '#fff', backgroundColor: '#F0A02B',
                        border: 'none', borderRadius: '10px', cursor: 'pointer',
                        fontFamily: 'inherit'
                    }}
                >
                    + Nouveau projet
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
                {stats.map(s => (
                    <div key={s.label} style={{
                        backgroundColor: '#fff', borderRadius: '12px',
                        border: '1px solid #E5E7EB', padding: '18px 20px'
                    }}>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 6px', fontWeight: 500 }}>
                            {s.label}
                        </p>
                        <p style={{ fontSize: '26px', fontWeight: 700, color: s.color, margin: 0 }}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Rechercher un projet..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        flex: 1, padding: '9px 14px', fontSize: '13px',
                        border: '1px solid #E5E7EB', borderRadius: '10px',
                        backgroundColor: '#fff', outline: 'none',
                        fontFamily: 'inherit', color: '#111827'
                    }}
                />
                <select
                    value={filtre}
                    onChange={e => setFiltre(e.target.value)}
                    style={{
                        padding: '9px 14px', fontSize: '13px',
                        border: '1px solid #E5E7EB', borderRadius: '10px',
                        backgroundColor: '#fff', outline: 'none',
                        fontFamily: 'inherit', color: '#111827', cursor: 'pointer'
                    }}
                >
                    <option value="tous">Tous les statuts</option>
                    <option value="draft">Draft</option>
                    <option value="en_cours">En cours</option>
                    <option value="finalise">Finalisé</option>
                    <option value="archive">Archivé</option>
                </select>
            </div>

            {/* Contenu */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF', fontSize: '14px' }}>
                    Chargement...
                </div>

            ) : projetsFiltres.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        border: '2px dashed #E5E7EB', margin: '0 auto 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        📁
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', margin: '0 0 4px' }}>
                        {search ? 'Aucun projet trouvé' : 'Aucun projet pour le moment'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 20px' }}>
                        {search ? 'Essayez un autre mot-clé' : 'Créez votre premier Business Model'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => router.push('/projets/nouveau')}
                            style={{
                                padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                                color: '#fff', backgroundColor: '#F0A02B',
                                border: 'none', borderRadius: '10px', cursor: 'pointer',
                                fontFamily: 'inherit'
                            }}
                        >
                            + Créer un projet
                        </button>
                    )}
                </div>

            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>

                    {projetsFiltres.map(projet => {
                        const statut = statutConfig[projet.statut] || statutConfig.draft
                        return (
                            <div
                                key={projet.id}
                                onClick={() => router.push(`/projets/${projet.id}`)}
                                style={{
                                    backgroundColor: '#fff', borderRadius: '14px',
                                    border: '1px solid #E5E7EB', padding: '20px',
                                    cursor: 'pointer', transition: 'box-shadow 0.15s',
                                    display: 'flex', flexDirection: 'column', gap: '10px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                            >
                                {/* Header carte */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 600, padding: '2px 10px',
                                            borderRadius: '20px', width: 'fit-content',
                                            backgroundColor: statut.bg, color: statut.color
                                        }}>
                                          {statut.label}
                                        </span>
                                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>
                                            {projet.nom}
                                        </h3>
                                    </div>

                                </div>

                                {/* Description */}
                                {projet.description && (
                                    <p style={{
                                        fontSize: '12px', color: '#6B7280',
                                        lineHeight: 1.6, margin: 0,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {projet.description}
                                    </p>
                                )}

                                {/* Tags */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {projet.secteur && (
                                        <span style={{
                                            fontSize: '11px', padding: '2px 8px',
                                            backgroundColor: '#F3F4F6', color: '#4B5563', borderRadius: '6px'
                                        }}>
                                            {projet.secteur}
                                        </span>
                                    )}
                                    {projet.annee_demarrage && (
                                        <span style={{
                                            fontSize: '11px', padding: '2px 8px',
                                            backgroundColor: '#F3F4F6', color: '#4B5563', borderRadius: '6px'
                                        }}>
                                            {projet.annee_demarrage}
                                        </span>
                                    )}
                                </div>

                                {/* Footer */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    paddingTop: '10px', borderTop: '1px solid #F3F4F6', marginTop: 'auto'
                                }}>
                                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                    Modifié {dateRelative(projet.updated_at)}
                                  </span>
                                   <span style={{ fontSize: '12px', fontWeight: 600, color: '#0D2B55' }}>
                                        Ouvrir →
                                    </span>
                                </div>
                            </div>
                        )
                    })}

                    {/* Carte nouveau projet */}
                    <div
                        onClick={() => router.push('/projets/nouveau')}
                        style={{
                            border: '2px dashed #E5E7EB', borderRadius: '14px',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '10px', cursor: 'pointer', minHeight: '180px',
                            transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            border: '2px dashed #D1D5DB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', color: '#9CA3AF'
                        }}>
                            +
                        </div>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
                            Créer un nouveau<br />Business Model
                        </p>
                    </div>

                </div>
            )}

        </div>
    )
}