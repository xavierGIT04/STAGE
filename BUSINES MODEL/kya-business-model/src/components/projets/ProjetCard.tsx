'use client'

import { Projet } from '@/lib/superbase/types'
import { useRouter } from 'next/navigation'

interface ProjetCardProps {
    projet: Projet
}

const statutConfig: Record<string, { label: string; bg: string; color: string }> = {
    draft:    { label: 'Draft',     bg: '#FFF3DC', color: '#854F0B' },
    en_cours: { label: 'En cours',  bg: '#E1F5EE', color: '#0F6E56' },
    finalise: { label: 'Finalisé',  bg: '#E6F1FB', color: '#0C447C' },
    archive:  { label: 'Archivé',   bg: '#F3F4F6', color: '#4B5563' },
}

export default function ProjetCard({ projet }: ProjetCardProps) {
    const router = useRouter()
    const statut = statutConfig[projet.statut] || statutConfig.draft

    const dateRelative = (dateStr: string) => {
        const diff  = Date.now() - new Date(dateStr).getTime()
        const jours = Math.floor(diff / 86400000)
        if (jours === 0) return "aujourd'hui"
        if (jours === 1) return 'hier'
        return `il y a ${jours} jours`
    }

    return (
        <div
            onClick={() => router.push(`/projets/${projet.id}`)}
            style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                padding: '20px',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, transform 0.1s',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{
              fontSize: '11px', fontWeight: 600,
              padding: '3px 10px', borderRadius: '20px',
              backgroundColor: statut.bg, color: statut.color,
              width: 'fit-content',
          }}>
            {statut.label}
          </span>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.4 }}>
                        {projet.nom}
                    </h3>
                </div>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: '#FFF3DC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginLeft: '8px',
                    fontSize: '16px',
                }}>
                    ⚡
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
                    overflow: 'hidden',
                }}>
                    {projet.description}
                </p>
            )}

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {projet.secteur && (
                    <span style={{
                        fontSize: '11px', padding: '2px 8px',
                        backgroundColor: '#F3F4F6', color: '#4B5563',
                        borderRadius: '6px',
                    }}>
            {projet.secteur}
          </span>
                )}
                {projet.annee_demarrage && (
                    <span style={{
                        fontSize: '11px', padding: '2px 8px',
                        backgroundColor: '#F3F4F6', color: '#4B5563',
                        borderRadius: '6px',
                    }}>
            {projet.annee_demarrage}
          </span>
                )}
                {projet.devise && (
                    <span style={{
                        fontSize: '11px', padding: '2px 8px',
                        backgroundColor: '#F3F4F6', color: '#4B5563',
                        borderRadius: '6px',
                    }}>
            {projet.devise}
          </span>
                )}
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid #F3F4F6',
                marginTop: 'auto',
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
}