'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { PartenaireTechnique } from '@/lib/superbase/types'

interface Props {
    projetId: string
    onSave: () => void
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '13px',
    border: '1px solid #E5E7EB', borderRadius: '8px',
    backgroundColor: '#fff', outline: 'none',
    fontFamily: 'inherit', color: '#111827'
}

export default function SectionPartenairesTechniques({ projetId, onSave }: Props) {
    const [partenaires, setPartenaires] = useState<PartenaireTechnique[]>([])
    const [saved, setSaved] = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchData() }, [projetId])

    const fetchData = async () => {
        const { data } = await supabase
            .from('partenaires_techniques')
            .select('*')
            .eq('projet_id', projetId)
            .order('created_at')
        if (data) setPartenaires(data)
    }

    const ajouter = async () => {
        const { data } = await supabase
            .from('partenaires_techniques')
            .insert([{ projet_id: projetId, nom: 'Nouveau partenaire technique' }])
            .select().single()
        if (data) setPartenaires(prev => [...prev, data])
    }

    const update = async (id: string, field: string, value: string) => {
        setPartenaires(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
        await supabase.from('partenaires_techniques').update({ [field]: value }).eq('id', id)
    }

    const supprimer = async (id: string) => {
        await supabase.from('partenaires_techniques').delete().eq('id', id)
        setPartenaires(prev => prev.filter(p => p.id !== id))
    }

    const typeColors: Record<string, { bg: string; color: string }> = {
        'Fournisseur':    { bg: '#E6F1FB', color: '#185FA5' },
        'Installateur':   { bg: '#E1F5EE', color: '#0F6E56' },
        'Distributeur':   { bg: '#FFF3DC', color: '#854F0B' },
        'Sous-traitant':  { bg: '#F3E8FF', color: '#6B21A8' },
        'Autre':          { bg: '#F3F4F6', color: '#4B5563' },
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>9</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Partenaires techniques
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                Fournisseurs, installateurs, sous-traitants et autres partenaires opérationnels du projet.
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Total partenaires', value: partenaires.length,                                                 color: '#0D2B55' },
                    { label: 'Fournisseurs',      value: partenaires.filter(p => p.type === 'Fournisseur').length,          color: '#185FA5' },
                    { label: 'Installateurs',     value: partenaires.filter(p => p.type === 'Installateur').length,         color: '#169B86' },
                ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>{s.label}</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {partenaires.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF' }}>
                        <p style={{ fontSize: '14px' }}>Aucun partenaire technique</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Cliquez sur "+ Ajouter" pour commencer</p>
                    </div>
                ) : partenaires.map(p => {
                    const typeConf = typeColors[p.type || 'Autre'] || typeColors['Autre']
                    return (
                        <div key={p.id} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '8px',
                                        backgroundColor: '#169B86',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                                    }}>🔧</div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{p.nom}</p>
                                        {p.type && (
                                            <span style={{
                                                fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                                                backgroundColor: typeConf.bg, color: typeConf.color
                                            }}>{p.type}</span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => supprimer(p.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px' }}>
                                    ×
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Nom du partenaire
                                    </label>
                                    <input type="text" value={p.nom}
                                           onChange={e => update(p.id, 'nom', e.target.value)}
                                           style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Type
                                    </label>
                                    <select value={p.type || ''}
                                            onChange={e => update(p.id, 'type', e.target.value)}
                                            style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="">Choisir un type</option>
                                        <option value="Fournisseur">Fournisseur</option>
                                        <option value="Installateur">Installateur</option>
                                        <option value="Distributeur">Distributeur</option>
                                        <option value="Sous-traitant">Sous-traitant</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Rôle dans le projet
                                    </label>
                                    <input type="text" value={p.role || ''}
                                           onChange={e => update(p.id, 'role', e.target.value)}
                                           placeholder="Ex : Fourniture des panneaux solaires"
                                           style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Contact
                                    </label>
                                    <input type="text" value={p.contact || ''}
                                           onChange={e => update(p.id, 'contact', e.target.value)}
                                           placeholder="Ex : contact@partenaire.com"
                                           style={inputStyle} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                    Apport / Valeur ajoutée
                                </label>
                                <textarea value={p.apport || ''}
                                          onChange={e => update(p.id, 'apport', e.target.value)}
                                          placeholder="Ce que ce partenaire apporte au projet..."
                                          rows={2}
                                          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            <button onClick={ajouter}
                    style={{
                        padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                        color: '#F0A02B', backgroundColor: '#FFF3DC',
                        border: '1px dashed #F0A02B', borderRadius: '10px',
                        cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                + Ajouter un partenaire technique
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                {saved && <span style={{ fontSize: '13px', color: '#169B86', alignSelf: 'center' }}>✓ Sauvegardé</span>}
                <button
                    onClick={() => { setSaved(true); onSave(); setTimeout(() => setSaved(false), 2000) }}
                    style={{
                        padding: '10px 24px', fontSize: '13px', fontWeight: 600,
                        color: '#fff', backgroundColor: '#F0A02B',
                        border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                    Sauvegarder
                </button>
            </div>
        </div>
    )
}