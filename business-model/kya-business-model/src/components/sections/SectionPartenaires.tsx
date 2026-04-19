'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { PartenaireFinancier } from '@/lib/superbase/types'

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

const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export default function SectionPartenaires({ projetId, onSave }: Props) {
    const [partenaires, setPartenaires] = useState<PartenaireFinancier[]>([])
    const [saved, setSaved]             = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchData() }, [projetId])

    const fetchData = async () => {
        const { data } = await supabase
            .from('partenaires_financiers')
            .select('*')
            .eq('projet_id', projetId)
            .order('created_at')
        if (data) setPartenaires(data)
    }

    const ajouter = async () => {
        const { data } = await supabase
            .from('partenaires_financiers')
            .insert([{
                projet_id: projetId, nom: 'Nouveau partenaire',
                type_financement: 'emprunt', montant: 0,
                taux_interet: 0.1, duree_annees: 5,
            }])
            .select().single()
        if (data) setPartenaires(prev => [...prev, data])
    }

    const update = async (id: string, field: string, value: string | number) => {
        setPartenaires(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
        await supabase.from('partenaires_financiers').update({ [field]: value }).eq('id', id)
    }

    const supprimer = async (id: string) => {
        await supabase.from('partenaires_financiers').delete().eq('id', id)
        setPartenaires(prev => prev.filter(p => p.id !== id))
    }

    const totalFinancement = partenaires.reduce((s, p) => s + p.montant, 0)
    const totalEmprunts    = partenaires.filter(p => p.type_financement === 'emprunt').reduce((s, p) => s + p.montant, 0)
    const totalFondsPropres = partenaires.filter(p => p.type_financement === 'fonds_propres').reduce((s, p) => s + p.montant, 0)

    const typeLabel: Record<string, string> = {
        emprunt:       'Emprunt bancaire',
        fonds_propres: 'Fonds propres',
        subvention:    'Subvention',
        autre:         'Autre',
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
                }}>7</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Partenaires financiers
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                Renseignez les partenaires qui financent le projet et leurs conditions.
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Total financement',  value: formatNum(totalFinancement)  + ' FCFA', color: '#0D2B55' },
                    { label: 'Total emprunts',     value: formatNum(totalEmprunts)     + ' FCFA', color: '#F0A02B' },
                    { label: 'Total fonds propres', value: formatNum(totalFondsPropres) + ' FCFA', color: '#169B86' },
                ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>{s.label}</p>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Cartes partenaires */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {partenaires.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF' }}>
                        <p style={{ fontSize: '14px' }}>Aucun partenaire financier</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Cliquez sur &apos;+ Ajouter&apos; pour commencer</p>
                    </div>
                ) : partenaires.map(p => (
                    <div key={p.id} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '8px',
                                    backgroundColor: '#0D2B55',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px'
                                }}>🏦</div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{p.nom}</p>
                                    <span style={{
                                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                                        backgroundColor: p.type_financement === 'emprunt' ? '#FFF3DC' : '#E1F5EE',
                                        color: p.type_financement === 'emprunt' ? '#854F0B' : '#0F6E56',
                                    }}>
                    {typeLabel[p.type_financement || 'autre']}
                  </span>
                                </div>
                            </div>
                            <button onClick={() => supprimer(p.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px' }}>
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
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
                                    Type de financement
                                </label>
                                <select value={p.type_financement || 'emprunt'}
                                        onChange={e => update(p.id, 'type_financement', e.target.value)}
                                        style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="emprunt">Emprunt bancaire</option>
                                    <option value="fonds_propres">Fonds propres</option>
                                    <option value="subvention">Subvention</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                    Montant (FCFA)
                                </label>
                                <input type="number" value={p.montant} min={0}
                                       onChange={e => update(p.id, 'montant', parseFloat(e.target.value))}
                                       style={inputStyle} />
                            </div>
                        </div>

                        {p.type_financement === 'emprunt' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Taux d&apos;intérêt (%)
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input
                                            type="number"
                                            value={Math.round(p.taux_interet * 100 * 10) / 10}
                                            min={0} max={30} step={0.1}
                                            onChange={e => update(p.id, 'taux_interet', parseFloat(e.target.value) / 100)}
                                            style={inputStyle}
                                        />
                                        <span style={{ fontSize: '12px', color: '#169B86', fontWeight: 600, flexShrink: 0 }}>%</span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                                        Ex : 10%
                                    </p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Durée (années)
                                    </label>
                                    <input type="number" value={p.duree_annees} min={1} max={30}
                                           onChange={e => update(p.id, 'duree_annees', parseInt(e.target.value))}
                                           style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                        Remboursement annuel estimé
                                    </label>
                                    <div style={{
                                        padding: '8px 12px', backgroundColor: '#E1F5EE',
                                        borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#169B86'
                                    }}>
                                        {formatNum(p.montant / (p.duree_annees || 1))} FCFA
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>
                                Conditions particulières
                            </label>
                            <textarea value={p.conditions || ''}
                                      onChange={e => update(p.id, 'conditions', e.target.value)}
                                      placeholder="Ex : Paiement mensuel sur 7 ans via la SIAB..."
                                      rows={2}
                                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={ajouter}
                    style={{
                        padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                        color: '#F0A02B', backgroundColor: '#FFF3DC',
                        border: '1px dashed #F0A02B', borderRadius: '10px',
                        cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                + Ajouter un partenaire financier
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