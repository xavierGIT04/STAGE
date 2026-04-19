'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { RisqueProjet } from '@/lib/superbase/types'

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

const NIVEAU_CONFIG: Record<string, { bg: string; color: string }> = {
    'faible':   { bg: '#E1F5EE', color: '#0F6E56' },
    'modere':   { bg: '#FFF3DC', color: '#854F0B' },
    'eleve':    { bg: '#FEE2E2', color: '#991B1B' },
    'critique': { bg: '#450A0A', color: '#fff'    },
}

const PROB_CONFIG: Record<string, { bg: string; color: string }> = {
    'faible':  { bg: '#E1F5EE', color: '#0F6E56' },
    'moyenne': { bg: '#FFF3DC', color: '#854F0B' },
    'elevee':  { bg: '#FEE2E2', color: '#991B1B' },
}

export default function SectionRisques({ projetId, onSave }: Props) {
    const [risques, setRisques] = useState<RisqueProjet[]>([])
    const [saved, setSaved]     = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchData() }, [projetId])

    const fetchData = async () => {
        const { data } = await supabase
            .from('risques_projet')
            .select('*')
            .eq('projet_id', projetId)
            .order('created_at')
        if (data) setRisques(data)
    }

    const ajouter = async () => {
        const { data } = await supabase
            .from('risques_projet')
            .insert([{
                projet_id: projetId,
                description: 'Nouveau risque',
                probabilite: 'moyenne',
                niveau_risque: 'modere',
            }])
            .select().single()
        if (data) setRisques(prev => [...prev, data])
    }

    const update = async (id: string, field: string, value: string) => {
        setRisques(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
        await supabase.from('risques_projet').update({ [field]: value }).eq('id', id)
    }

    const supprimer = async (id: string) => {
        await supabase.from('risques_projet').delete().eq('id', id)
        setRisques(prev => prev.filter(r => r.id !== id))
    }

    const stats = [
        { label: 'Total',    value: risques.length,                                              color: '#0D2B55' },
        { label: 'Critiques', value: risques.filter(r => r.niveau_risque === 'critique').length, color: '#991B1B' },
        { label: 'Élevés',   value: risques.filter(r => r.niveau_risque === 'eleve').length,    color: '#E24B4A' },
        { label: 'Modérés',  value: risques.filter(r => r.niveau_risque === 'modere').length,   color: '#F0A02B' },
    ]

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>11</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Risques du projet
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                Identifiez les risques, évaluez leur probabilité et définissez les mesures de mitigation.
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {stats.map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>{s.label}</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Liste des risques */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {risques.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF' }}>
                        <p style={{ fontSize: '14px' }}>Aucun risque identifié</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Cliquez sur "+ Ajouter un risque" pour commencer</p>
                    </div>
                ) : risques.map((r, i) => {
                    const niv  = NIVEAU_CONFIG[r.niveau_risque || 'modere'] || NIVEAU_CONFIG['modere']
                    const prob = PROB_CONFIG[r.probabilite || 'moyenne']    || PROB_CONFIG['moyenne']
                    return (
                        <div key={r.id} style={{
                            backgroundColor: '#F9FAFB', borderRadius: '12px',
                            border: `1px solid ${r.niveau_risque === 'critique' ? '#FCA5A5' : '#E5E7EB'}`,
                            padding: '18px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>
                    {r.niveau_risque === 'critique' ? '🔴' : r.niveau_risque === 'eleve' ? '🟠' : r.niveau_risque === 'modere' ? '🟡' : '🟢'}
                  </span>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{r.description}</p>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 8px', borderRadius: '20px', backgroundColor: niv.bg, color: niv.color }}>
                        {r.niveau_risque ? r.niveau_risque.charAt(0).toUpperCase() + r.niveau_risque.slice(1) : '—'}
                      </span>
                                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 8px', borderRadius: '20px', backgroundColor: prob.bg, color: prob.color }}>
                        Prob. {r.probabilite || '—'}
                      </span>
                                            {r.categorie && (
                                                <span style={{ fontSize: '10px', padding: '1px 8px', borderRadius: '20px', backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                          {r.categorie}
                        </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => supprimer(r.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px' }}>
                                    ×
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Description</label>
                                    <input type="text" value={r.description}
                                           onChange={e => update(r.id, 'description', e.target.value)}
                                           style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Catégorie</label>
                                    <select value={r.categorie || ''}
                                            onChange={e => update(r.id, 'categorie', e.target.value)}
                                            style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="">Choisir</option>
                                        <option value="Financier">Financier</option>
                                        <option value="Technique">Technique</option>
                                        <option value="Marché">Marché</option>
                                        <option value="Réglementaire">Réglementaire</option>
                                        <option value="Opérationnel">Opérationnel</option>
                                        <option value="Environnemental">Environnemental</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Responsable</label>
                                    <input type="text" value={r.responsable || ''}
                                           onChange={e => update(r.id, 'responsable', e.target.value)}
                                           placeholder="Ex : Chef de projet"
                                           style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Probabilité</label>
                                    <select value={r.probabilite || 'moyenne'}
                                            onChange={e => update(r.id, 'probabilite', e.target.value)}
                                            style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="faible">Faible</option>
                                        <option value="moyenne">Moyenne</option>
                                        <option value="elevee">Élevée</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Impact</label>
                                    <select value={r.impact || ''}
                                            onChange={e => update(r.id, 'impact', e.target.value)}
                                            style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="">Choisir</option>
                                        <option value="Faible">Faible</option>
                                        <option value="Modéré">Modéré</option>
                                        <option value="Élevé">Élevé</option>
                                        <option value="Critique">Critique</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Niveau de risque</label>
                                    <select value={r.niveau_risque || 'modere'}
                                            onChange={e => update(r.id, 'niveau_risque', e.target.value)}
                                            style={{ ...inputStyle, cursor: 'pointer', borderColor: niv.bg }}>
                                        <option value="faible">Faible</option>
                                        <option value="modere">Modéré</option>
                                        <option value="eleve">Élevé</option>
                                        <option value="critique">Critique</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                    Mesure de mitigation
                                </label>
                                <textarea value={r.mesure_mitigation || ''}
                                          onChange={e => update(r.id, 'mesure_mitigation', e.target.value)}
                                          placeholder="Comment réduire ou éliminer ce risque..."
                                          rows={2}
                                          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, borderColor: '#169B86' }} />
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
                + Ajouter un risque
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