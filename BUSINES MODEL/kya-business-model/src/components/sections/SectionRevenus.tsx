'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { Produit, Revenu } from '@/lib/superbase/types'

interface Props {
    projetId: string
    onSave: () => void
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '13px',
    border: '1px solid #E5E7EB', borderRadius: '8px',
    backgroundColor: '#fff', outline: 'none',
    fontFamily: 'inherit', color: '#111827', textAlign: 'right'
}

const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export default function SectionRevenus({ projetId, onSave }: Props) {
    const [produits, setProduits]   = useState<Produit[]>([])
    const [revenus, setRevenus]     = useState<Revenu[]>([])
    const [annees, setAnnees]       = useState<number[]>([])
    const [saved, setSaved]         = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchData() }, [projetId])

    const fetchData = async () => {
        const [{ data: prods }, { data: proj }, { data: revs }] = await Promise.all([
            supabase.from('produits').select('*').eq('projet_id', projetId),
            supabase.from('projets').select('annee_demarrage, duree_projet').eq('id', projetId).single(),
            supabase.from('revenus').select('*').eq('projet_id', projetId),
        ])

        if (prods) setProduits(prods)
        if (proj) {
            const debut = proj.annee_demarrage || 2026
            const duree = proj.duree_projet || 5
            setAnnees(Array.from({ length: duree }, (_, i) => debut + i))
        }
        if (revs) setRevenus(revs)
    }

    const getRevenu = (produitId: string, annee: number) =>
        revenus.find(r => r.produit_id === produitId && r.annee === annee)

    const updateRevenu = async (produitId: string, annee: number, field: 'volume' | 'prix_unitaire_ht', value: number) => {
        const existing = getRevenu(produitId, annee)
        if (existing) {
            setRevenus(prev => prev.map(r =>
                r.produit_id === produitId && r.annee === annee ? { ...r, [field]: value } : r
            ))
            await supabase.from('revenus').update({ [field]: value }).eq('id', existing.id)
        } else {
            const newRev = {
                projet_id: projetId, produit_id: produitId, annee,
                volume: field === 'volume' ? value : 0,
                prix_unitaire_ht: field === 'prix_unitaire_ht' ? value : 0,
            }
            const { data } = await supabase.from('revenus').insert([newRev]).select().single()
            if (data) setRevenus(prev => [...prev, data])
        }
    }

    const caParAnnee = (annee: number) =>
        produits.reduce((sum, p) => {
            const r = getRevenu(p.id, annee)
            return sum + (r ? r.volume * r.prix_unitaire_ht : 0)
        }, 0)

    const caTotalProjet = annees.reduce((s, a) => s + caParAnnee(a), 0)

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>6</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Revenus
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                Définissez les volumes de vente et les prix par produit et par année.
            </p>

            {/* CA total */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>CA total projet</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#0D2B55', margin: 0 }}>{formatNum(caTotalProjet)} FCFA</p>
                </div>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>CA année 1</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#169B86', margin: 0 }}>{formatNum(caParAnnee(annees[0]))} FCFA</p>
                </div>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>CA dernière année</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#F0A02B', margin: 0 }}>{formatNum(caParAnnee(annees[annees.length - 1]))} FCFA</p>
                </div>
            </div>

            {produits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF' }}>
                    <p style={{ fontSize: '14px' }}>Aucun produit défini</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Ajoutez des produits dans la section &apos;Produits & Services&apos; d&apos;abord.</p>
                </div>
            ) : (
                produits.map(produit => (
                    <div key={produit.id} style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0D2B55', margin: '0 0 12px' }}>
                            {produit.nom}
                        </p>
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#0D2B55' }}>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px' }}>
                                        Indicateur
                                    </th>
                                    {annees.map(a => (
                                        <th key={a} style={{ padding: '10px 14px', textAlign: 'center', color: '#fff', fontWeight: 500, fontSize: '12px' }}>
                                            {a}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {/* Volume */}
                                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: '#374151', backgroundColor: '#F9FAFB' }}>
                                        Volume (unités)
                                    </td>
                                    {annees.map(a => (
                                        <td key={a} style={{ padding: '8px 10px' }}>
                                            <input
                                                type="number" min={0}
                                                value={getRevenu(produit.id, a)?.volume || ''}
                                                onChange={e => updateRevenu(produit.id, a, 'volume', parseFloat(e.target.value) || 0)}
                                                style={{ ...inputStyle, width: '90px', padding: '5px 8px', fontSize: '12px' }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                                {/* Prix unitaire */}
                                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: '#374151', backgroundColor: '#F9FAFB' }}>
                                        Prix unitaire HT (FCFA)
                                    </td>
                                    {annees.map(a => (
                                        <td key={a} style={{ padding: '8px 10px' }}>
                                            <input
                                                type="number" min={0}
                                                value={getRevenu(produit.id, a)?.prix_unitaire_ht || ''}
                                                onChange={e => updateRevenu(produit.id, a, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                                                style={{ ...inputStyle, width: '110px', padding: '5px 8px', fontSize: '12px' }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                                {/* CA */}
                                <tr style={{ backgroundColor: '#E1F5EE' }}>
                                    <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: '#0F6E56' }}>
                                        CA HT (FCFA)
                                    </td>
                                    {annees.map(a => {
                                        const r = getRevenu(produit.id, a)
                                        const ca = r ? r.volume * r.prix_unitaire_ht : 0
                                        return (
                                            <td key={a} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0F6E56', fontSize: '12px' }}>
                                                {formatNum(ca)}
                                            </td>
                                        )
                                    })}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            {/* CA consolidé par année */}
            {produits.length > 1 && (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#169B86' }}>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px' }}>CA Total consolidé</th>
                            {annees.map(a => (
                                <th key={a} style={{ padding: '10px 14px', textAlign: 'center', color: '#fff', fontWeight: 500, fontSize: '12px' }}>{a}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#169B86', backgroundColor: '#E1F5EE' }}>Total (FCFA)</td>
                            {annees.map(a => (
                                <td key={a} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#169B86' }}>
                                    {formatNum(caParAnnee(a))}
                                </td>
                            ))}
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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