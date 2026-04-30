'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { Concurrent } from '@/lib/superbase/types'

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

const typeConfig: Record<string, { label: string; bg: string; color: string }> = {
    direct:   { label: 'Direct',   bg: '#FEE2E2', color: '#991B1B' },
    indirect: { label: 'Indirect', bg: '#FFF3DC', color: '#854F0B' },
    substitut:{ label: 'Substitut',bg: '#E1F5EE', color: '#0F6E56' },
}

export default function SectionConcurrents({ projetId, onSave }: Props) {
    const [concurrents, setConcurrents] = useState<Concurrent[]>([])
    const [saved, setSaved]             = useState(false)
    const [avantageGlobal, setAvantageGlobal] = useState('')
    const supabase = createClient()

    useEffect(() => { fetchData() }, [projetId])

    const fetchData = async () => {
        const { data } = await supabase
            .from('concurrents')
            .select('*')
            .eq('projet_id', projetId)
            .order('created_at')
        if (data) setConcurrents(data)
    }

    const ajouter = async () => {
        const { data } = await supabase
            .from('concurrents')
            .insert([{ projet_id: projetId, nom: 'Nouveau concurrent', type: 'direct' }])
            .select().single()
        if (data) setConcurrents(prev => [...prev, data])
    }

    const update = async (id: string, field: string, value: string) => {
        setConcurrents(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
        await supabase.from('concurrents').update({ [field]: value }).eq('id', id)
    }

    const supprimer = async (id: string) => {
        await supabase.from('concurrents').delete().eq('id', id)
        setConcurrents(prev => prev.filter(c => c.id !== id))
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>8</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Analyse des concurrents
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                Documentez le paysage concurrentiel pour justifier votre positionnement.
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Total concurrents', value: concurrents.length, color: '#0D2B55' },
                    { label: 'Directs',           value: concurrents.filter(c => c.type === 'direct').length,    color: '#E24B4A' },
                    { label: 'Indirects',         value: concurrents.filter(c => c.type === 'indirect').length,  color: '#F0A02B' },
                ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>{s.label}</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Cartes concurrents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {concurrents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF' }}>
                        <p style={{ fontSize: '14px' }}>Aucun concurrent renseigné</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Cliquez sur &apos;+ Ajouter&apos; pour commencer</p>
                    </div>
                ) : concurrents.map(c => {
                    const type = typeConfig[c.type || 'direct']
                    return (
                        <div key={c.id} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '18px' }}>

                            {/* Header carte */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '8px',
                                        backgroundColor: '#0D2B55',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '16px'
                                    }}>🏢</div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{c.nom}</p>
                                        <span style={{
                                            fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                                            backgroundColor: type.bg, color: type.color
                                        }}>
                      {type.label}
                    </span>
                                    </div>
                                </div>
                                <button onClick={() => supprimer(c.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px' }}>
                                    ×
                                </button>
                            </div>

                            {/* Champs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Nom du concurrent
                                    </label>
                                    <input type="text" value={c.nom}
                                           onChange={e => update(c.id, 'nom', e.target.value)}
                                           style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Type
                                    </label>
                                    <select value={c.type || 'direct'}
                                            onChange={e => update(c.id, 'type', e.target.value)}
                                            style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="direct">Concurrent direct</option>
                                        <option value="indirect">Concurrent indirect</option>
                                        <option value="substitut">Produit substitut</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                    Produit / Solution proposée
                                </label>
                                <input type="text" value={c.produit_solution || ''}
                                       onChange={e => update(c.id, 'produit_solution', e.target.value)}
                                       placeholder="Ex : Électricité du réseau national CEET"
                                       style={inputStyle} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Forces
                                    </label>
                                    <textarea value={c.forces || ''}
                                              onChange={e => update(c.id, 'forces', e.target.value)}
                                              placeholder="Avantages identifiés..."
                                              rows={3}
                                              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Faiblesses
                                    </label>
                                    <textarea value={c.faiblesses || ''}
                                              onChange={e => update(c.id, 'faiblesses', e.target.value)}
                                              placeholder="Points faibles ou limites..."
                                              rows={3}
                                              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Notre différenciation
                                    </label>
                                    <textarea value={c.notre_differenciation || ''}
                                              onChange={e => update(c.id, 'notre_differenciation', e.target.value)}
                                              placeholder="En quoi notre offre est meilleure..."
                                              rows={3}
                                              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, borderColor: '#169B86' }} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Zone avantage concurrentiel global */}
            <div style={{ backgroundColor: '#E1F5EE', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F6E56', margin: '0 0 10px' }}>
                    🏆 Notre avantage concurrentiel global
                </p>
                <textarea
                    value={avantageGlobal}
                    onChange={e => setAvantageGlobal(e.target.value)}
                    placeholder="Décrivez en quoi votre offre est globalement supérieure à la concurrence..."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, borderColor: '#169B86' }}
                />
            </div>

            <button onClick={ajouter}
                    style={{
                        padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                        color: '#F0A02B', backgroundColor: '#FFF3DC',
                        border: '1px dashed #F0A02B', borderRadius: '10px',
                        cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                + Ajouter un concurrent
            </button>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                {saved && <span style={{ fontSize: '13px', color: '#169B86', alignSelf: 'center' }}>✓ Sauvegardé</span>}
                <button
                    onClick={() => { setSaved(true); onSave(); setTimeout(() => setSaved(false), 2000) }}
                    style={{
                        padding: '10px 24px', fontSize: '13px', fontWeight: 600,
                        color: '#fff', backgroundColor: '#F0A02B',
                        border: 'none', borderRadius: '10px',
                        cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                    Sauvegarder
                </button>
            </div>
        </div>
    )
}