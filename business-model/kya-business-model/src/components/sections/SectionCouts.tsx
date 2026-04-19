'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { Capex, Opex } from '@/lib/superbase/types'

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

export default function SectionCouts({ projetId, onSave }: Props) {
    const [capex, setCapex]     = useState<Capex[]>([])
    const [opex, setOpex]       = useState<Opex[]>([])
    const [onglet, setOnglet]   = useState<'capex' | 'opex'>('capex')
    const [saved, setSaved]     = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchData() }, [projetId])

    const fetchData = async () => {
        const [{ data: capexData }, { data: opexData }] = await Promise.all([
            supabase.from('capex').select('*').eq('projet_id', projetId).order('created_at'),
            supabase.from('opex').select('*').eq('projet_id', projetId).order('created_at'),
        ])
        if (capexData) setCapex(capexData)
        if (opexData)  setOpex(opexData)
    }

    // ── CAPEX ──────────────────────────────────────────────────────────────
    const ajouterCapex = async () => {
        const { data } = await supabase
            .from('capex')
            .insert([{ projet_id: projetId, libelle: 'Nouvel investissement', montant: 0, taux_amortissement: 0.1 }])
            .select().single()
        if (data) setCapex(prev => [...prev, data])
    }

    const updateCapex = async (id: string, field: string, value: string | number) => {
        setCapex(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
        await supabase.from('capex').update({ [field]: value }).eq('id', id)
    }

    const supprimerCapex = async (id: string) => {
        await supabase.from('capex').delete().eq('id', id)
        setCapex(prev => prev.filter(c => c.id !== id))
    }

    // ── OPEX ───────────────────────────────────────────────────────────────
    const ajouterOpex = async () => {
        const { data } = await supabase
            .from('opex')
            .insert([{ projet_id: projetId, libelle: 'Nouvelle charge', type_calcul: 'fixe', valeur: 0 }])
            .select().single()
        if (data) setOpex(prev => [...prev, data])
    }

    const updateOpex = async (id: string, field: string, value: string | number) => {
        setOpex(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o))
        await supabase.from('opex').update({ [field]: value }).eq('id', id)
    }

    const supprimerOpex = async (id: string) => {
        await supabase.from('opex').delete().eq('id', id)
        setOpex(prev => prev.filter(o => o.id !== id))
    }

    // Totaux
    const totalCapex = capex.reduce((s, c) => s + c.montant, 0)
    const totalAmort = capex.reduce((s, c) => s + c.montant * c.taux_amortissement, 0)
    const totalOpexFixe = opex.filter(o => o.type_calcul === 'fixe').reduce((s, o) => s + o.valeur, 0)

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>5</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Coûts & Composants
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                Définissez vos investissements (CAPEX) et charges d&apos;exploitation (OPEX).
            </p>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
                {[
                    { key: 'capex', label: 'CAPEX — Investissements' },
                    { key: 'opex',  label: 'OPEX — Charges d\'exploitation' },
                ].map(o => (
                    <button
                        key={o.key}
                        onClick={() => setOnglet(o.key as 'capex' | 'opex')}
                        style={{
                            padding: '10px 20px', fontSize: '13px', fontWeight: 500,
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'inherit',
                            color: onglet === o.key ? '#0D2B55' : '#6B7280',
                            borderBottom: onglet === o.key ? '2px solid #F0A02B' : '2px solid transparent',
                            marginBottom: '-1px',
                        }}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            {/* ── CAPEX ── */}
            {onglet === 'capex' && (
                <div>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        {[
                            { label: 'Total investissement', value: formatNum(totalCapex) + ' FCFA', color: '#0D2B55' },
                            { label: 'Amortissement annuel moyen', value: formatNum(totalAmort) + ' FCFA', color: '#F0A02B' },
                            { label: 'Nombre de postes', value: capex.length.toString(), color: '#169B86' },
                        ].map(s => (
                            <div key={s.label} style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>{s.label}</p>
                                <p style={{ fontSize: '16px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tableau */}
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#0D2B55' }}>
                                {['Libellé', 'Catégorie', 'Montant (FCFA)', 'Taux amort.', 'Amort./an', ''].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {capex.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                                    Aucun investissement — cliquez sur &apos;+ Ajouter&apos;
                                </td></tr>
                            ) : capex.map((c, i) => (
                                <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input type="text" value={c.libelle}
                                               onChange={e => updateCapex(c.id, 'libelle', e.target.value)}
                                               style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px' }} />
                                    </td>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input type="text" value={c.categorie || ''}
                                               onChange={e => updateCapex(c.id, 'categorie', e.target.value)}
                                               placeholder="Ex : Équipement"
                                               style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px' }} />
                                    </td>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input type="number" value={c.montant} min={0}
                                               onChange={e => updateCapex(c.id, 'montant', parseFloat(e.target.value))}
                                               style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', width: '130px', textAlign: 'right' }} />
                                    </td>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input type="number" value={c.taux_amortissement} min={0} max={1} step={0.01}
                                               onChange={e => updateCapex(c.id, 'taux_amortissement', parseFloat(e.target.value))}
                                               style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', width: '80px', textAlign: 'right' }} />
                                    </td>
                                    <td style={{ padding: '8px 14px', fontWeight: 600, color: '#F0A02B' }}>
                                        {formatNum(c.montant * c.taux_amortissement)}
                                    </td>
                                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                        <button onClick={() => supprimerCapex(c.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px' }}>
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <button onClick={ajouterCapex}
                            style={{
                                padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                                color: '#F0A02B', backgroundColor: '#FFF3DC',
                                border: '1px dashed #F0A02B', borderRadius: '10px',
                                cursor: 'pointer', fontFamily: 'inherit'
                            }}>
                        + Ajouter un investissement
                    </button>
                </div>
            )}

            {/* ── OPEX ── */}
            {onglet === 'opex' && (
                <div>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        {[
                            { label: 'Total charges fixes/an', value: formatNum(totalOpexFixe) + ' FCFA', color: '#0D2B55' },
                            { label: 'Charges en % du CA', value: opex.filter(o => o.type_calcul === 'pourcentage').length + ' postes', color: '#F0A02B' },
                            { label: 'charges fixes', value: opex.length.toString(), color: '#169B86' },
                        ].map(s => (
                            <div key={s.label} style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>{s.label}</p>
                                <p style={{ fontSize: '16px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tableau */}
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#0D2B55' }}>
                                {['Libellé', 'Catégorie', 'Type de calcul', 'Valeur', ''].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {opex.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                                    Aucune charge — cliquez sur &apos;+ Ajouter&apos;
                                </td></tr>
                            ) : opex.map((o, i) => (
                                <tr key={o.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input type="text" value={o.libelle}
                                               onChange={e => updateOpex(o.id, 'libelle', e.target.value)}
                                               style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px' }} />
                                    </td>
                                    <td style={{ padding: '8px 14px' }}>
                                        <input type="text" value={o.categorie || ''}
                                               onChange={e => updateOpex(o.id, 'categorie', e.target.value)}
                                               placeholder="Ex : Personnel"
                                               style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px' }} />
                                    </td>
                                    <td style={{ padding: '8px 14px' }}>
                                        <select value={o.type_calcul}
                                                onChange={e => updateOpex(o.id, 'type_calcul', e.target.value)}
                                                style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', cursor: 'pointer', width: '140px' }}>
                                            <option value="fixe">Montant fixe</option>
                                            <option value="pourcentage">% du CA</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '8px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <input type="number" value={o.valeur} min={0}
                                                   onChange={e => updateOpex(o.id, 'valeur', parseFloat(e.target.value))}
                                                   style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', width: '120px', textAlign: 'right' }} />
                                            <span style={{ fontSize: '12px', color: '#9CA3AF', flexShrink: 0 }}>
                                                {o.type_calcul === 'fixe' ? 'FCFA' : '%'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                        <button onClick={() => supprimerOpex(o.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px' }}>
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <button onClick={ajouterOpex}
                            style={{
                                padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                                color: '#F0A02B', backgroundColor: '#FFF3DC',
                                border: '1px dashed #F0A02B', borderRadius: '10px',
                                cursor: 'pointer', fontFamily: 'inherit'
                            }}>
                        + Ajouter une charge
                    </button>
                </div>
            )}

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