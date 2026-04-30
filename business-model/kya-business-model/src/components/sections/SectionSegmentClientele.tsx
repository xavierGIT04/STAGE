'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import {
    SegmentClientele,
    RelationClientele,
    CanalDistribution,
} from '@/lib/superbase/types'

interface Props {
    projetId: string
    onSave: () => void
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '13px',
    border: '1px solid #E5E7EB', borderRadius: '8px',
    backgroundColor: '#fff', outline: 'none',
    fontFamily: 'inherit', color: '#111827',
}

const ONGLETS = [
    { key: 'cible',     label: 'Cible'                },
    { key: 'relation',  label: 'Relation clientèle'   },
    { key: 'canaux',    label: 'Canaux de distribution'},
]

const CATEGORIE_SEGMENT_LABELS: Record<string, string> = {
    institution_publique: 'Institution publique',
    institution_privee:   'Institution privée',
    menage:               'Ménage',
    autre:                'Autre',
}

const CATEGORIE_CANAL_LABELS: Record<string, string> = {
    reseaux_sociaux: 'Réseaux sociaux',
    autre:           'Autre',
}

export default function SectionSegmentClientele({ projetId, onSave }: Props) {
    const [onglet, setOnglet]           = useState<'cible' | 'relation' | 'canaux'>('cible')
    const [segments, setSegments]       = useState<SegmentClientele[]>([])
    const [relations, setRelations]     = useState<RelationClientele[]>([])
    const [canaux, setCanaux]           = useState<CanalDistribution[]>([])
    const [saved, setSaved]             = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchAll() }, [projetId])

    const fetchAll = async () => {
        const [{ data: s }, { data: r }, { data: c }] = await Promise.all([
            supabase.from('segments_clientele').select('*').eq('projet_id', projetId).order('created_at'),
            supabase.from('relations_clientele').select('*').eq('projet_id', projetId).order('created_at'),
            supabase.from('canaux_distribution').select('*').eq('projet_id', projetId).order('created_at'),
        ])
        if (s) setSegments(s)
        if (r) setRelations(r)
        if (c) setCanaux(c)
    }

    // ── Segments ───────────────────────────────────────────
    const ajouterSegment = async () => {
        const { data } = await supabase
            .from('segments_clientele')
            .insert([{ projet_id: projetId, libelle: 'Nouveau segment', categorie: 'institution_publique' }])
            .select().single()
        if (data) setSegments(prev => [...prev, data])
    }

    const updateSegment = async (id: string, field: string, value: string) => {
        setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
        await supabase.from('segments_clientele').update({ [field]: value }).eq('id', id)
    }

    const supprimerSegment = async (id: string) => {
        await supabase.from('segments_clientele').delete().eq('id', id)
        setSegments(prev => prev.filter(s => s.id !== id))
    }

    // ── Relations ──────────────────────────────────────────
    const ajouterRelation = async () => {
        const { data } = await supabase
            .from('relations_clientele')
            .insert([{ projet_id: projetId, libelle: 'Nouvelle relation' }])
            .select().single()
        if (data) setRelations(prev => [...prev, data])
    }

    const updateRelation = async (id: string, value: string) => {
        setRelations(prev => prev.map(r => r.id === id ? { ...r, libelle: value } : r))
        await supabase.from('relations_clientele').update({ libelle: value }).eq('id', id)
    }

    const supprimerRelation = async (id: string) => {
        await supabase.from('relations_clientele').delete().eq('id', id)
        setRelations(prev => prev.filter(r => r.id !== id))
    }

    // ── Canaux ─────────────────────────────────────────────
    const ajouterCanal = async () => {
        const { data } = await supabase
            .from('canaux_distribution')
            .insert([{ projet_id: projetId, libelle: 'Nouveau canal', categorie: 'reseaux_sociaux' }])
            .select().single()
        if (data) setCanaux(prev => [...prev, data])
    }

    const updateCanal = async (id: string, field: string, value: string) => {
        setCanaux(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
        await supabase.from('canaux_distribution').update({ [field]: value }).eq('id', id)
    }

    const supprimerCanal = async (id: string) => {
        await supabase.from('canaux_distribution').delete().eq('id', id)
        setCanaux(prev => prev.filter(c => c.id !== id))
    }

    const SECTION_NUMBER = 14 // adapter selon votre SECTIONS array

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{SECTION_NUMBER}</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Segment Clientèle
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                Définissez vos cibles, la nature de vos relations clients et vos canaux de distribution.
            </p>

            {/* Stats rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Segments cibles',   value: segments.length,  color: '#0D2B55' },
                    { label: 'Types de relation', value: relations.length,  color: '#169B86' },
                    { label: 'Canaux',            value: canaux.length,     color: '#F0A02B' },
                ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>{s.label}</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
                {ONGLETS.map(o => (
                    <button
                        key={o.key}
                        onClick={() => setOnglet(o.key as typeof onglet)}
                        style={{
                            padding: '10px 20px', fontSize: '13px', fontWeight: onglet === o.key ? 600 : 400,
                            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            color: onglet === o.key ? '#0D2B55' : '#6B7280',
                            borderBottom: onglet === o.key ? '2px solid #F0A02B' : '2px solid transparent',
                            marginBottom: '-1px',
                        }}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            {/* ── Onglet 1 : Cible ─────────────────────────────── */}
            {onglet === 'cible' && (
                <div>
                    {segments.length === 0 ? (
                        <EmptyState label="Aucun segment cible" />
                    ) : (
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#0D2B55' }}>
                                    {['Libellé', 'Catégorie', ''].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px' }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {segments.map((s, i) => (
                                    <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '8px 14px' }}>
                                            <input type="text" value={s.libelle} onChange={e => updateSegment(s.id, 'libelle', e.target.value)} style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px' }} />
                                        </td>
                                        <td style={{ padding: '8px 14px', minWidth: '220px' }}>
                                            <select
                                                value={s.categorie || ''}
                                                onChange={e => updateSegment(s.id, 'categorie', e.target.value)}
                                                style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}
                                            >
                                                {Object.entries(CATEGORIE_SEGMENT_LABELS).map(([v, l]) => (
                                                    <option key={v} value={v}>{l}</option>
                                                ))}
                                            </select>
                                            {/* LOGIQUE "AUTRE" : affichage conditionnel */}
                                            {s.categorie === 'autre' && (
                                                <input
                                                    type="text"
                                                    value={s.categorie_libre || ''}
                                                    onChange={e => updateSegment(s.id, 'categorie_libre', e.target.value)}
                                                    placeholder="Précisez la catégorie..."
                                                    style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', marginTop: '6px', borderColor: '#F0A02B' }}
                                                />
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                            <button onClick={() => supprimerSegment(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px' }}>×</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <AddButton label="+ Ajouter un segment" onClick={ajouterSegment} color="#0D2B55" bg="#E6F1FB" borderColor="#0D2B55" />
                </div>
            )}

            {/* ── Onglet 2 : Relation Clientèle ─────────────────── */}
            {onglet === 'relation' && (
                <div>
                    {relations.length === 0 ? (
                        <EmptyState label="Aucune relation clientèle définie" />
                    ) : (
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#169B86' }}>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px' }}>Libellé</th>
                                    <th style={{ padding: '10px 14px', width: '40px' }}></th>
                                </tr>
                                </thead>
                                <tbody>
                                {relations.map((r, i) => (
                                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '8px 14px' }}>
                                            <input type="text" value={r.libelle} onChange={e => updateRelation(r.id, e.target.value)} placeholder="Ex : Assistance technique personnalisée..." style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px' }} />
                                        </td>
                                        <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                            <button onClick={() => supprimerRelation(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px' }}>×</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <AddButton label="+ Ajouter une relation" onClick={ajouterRelation} color="#169B86" bg="#E1F5EE" borderColor="#169B86" />
                </div>
            )}

            {/* ── Onglet 3 : Canaux de Distribution ─────────────── */}
            {onglet === 'canaux' && (
                <div>
                    {canaux.length === 0 ? (
                        <EmptyState label="Aucun canal de distribution défini" />
                    ) : (
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#0D2B55' }}>
                                    {['Libellé', 'Catégorie', ''].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px' }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {canaux.map((c, i) => (
                                    <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '8px 14px' }}>
                                            <input type="text" value={c.libelle} onChange={e => updateCanal(c.id, 'libelle', e.target.value)} style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px' }} />
                                        </td>
                                        <td style={{ padding: '8px 14px', minWidth: '200px' }}>
                                            <select
                                                value={c.categorie || ''}
                                                onChange={e => updateCanal(c.id, 'categorie', e.target.value)}
                                                style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}
                                            >
                                                {Object.entries(CATEGORIE_CANAL_LABELS).map(([v, l]) => (
                                                    <option key={v} value={v}>{l}</option>
                                                ))}
                                            </select>
                                            {/* LOGIQUE "AUTRE" */}
                                            {c.categorie === 'autre' && (
                                                <input
                                                    type="text"
                                                    value={c.categorie_libre || ''}
                                                    onChange={e => updateCanal(c.id, 'categorie_libre', e.target.value)}
                                                    placeholder="Précisez le canal..."
                                                    style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', marginTop: '6px', borderColor: '#F0A02B' }}
                                                />
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                            <button onClick={() => supprimerCanal(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px' }}>×</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <AddButton label="+ Ajouter un canal" onClick={ajouterCanal} color="#F0A02B" bg="#FFF3DC" borderColor="#F0A02B" />
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                {saved && <span style={{ fontSize: '13px', color: '#169B86', alignSelf: 'center' }}>✓ Sauvegardé</span>}
                <button
                    onClick={() => { setSaved(true); onSave(); setTimeout(() => setSaved(false), 2000) }}
                    style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 600, color: '#fff', backgroundColor: '#F0A02B', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                    Sauvegarder
                </button>
            </div>
        </div>
    )
}

function EmptyState({ label }: { label: string }) {
    return (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF', marginBottom: '12px' }}>
            <p style={{ fontSize: '14px' }}>{label}</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Cliquez sur "+ Ajouter" pour commencer</p>
        </div>
    )
}

function AddButton({ label, onClick, color, bg, borderColor }: {
    label: string; onClick: () => void
    color: string; bg: string; borderColor: string
}) {
    return (
        <button
            onClick={onClick}
            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 500, color, backgroundColor: bg, border: `1px dashed ${borderColor}`, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
            {label}
        </button>
    )
}
