'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import {
    PartenaireFinancier,
    PartenaireTechnique,
    TypeOngletPartenaire,
    PartenaireCustom,
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

const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

// ─── Onglets fixes ─────────────────────────────────────────
const ONGLETS_FIXES = [
    { key: 'financiers',  label: 'Partenaires financiers' },
    { key: 'techniques',  label: 'Partenaires techniques'  },
]

export default function SectionPartenaires({ projetId, onSave }: Props) {
    const [ongletActif, setOngletActif]       = useState<string>('financiers')
    const [financiers, setFinanciers]         = useState<PartenaireFinancier[]>([])
    const [techniques, setTechniques]         = useState<PartenaireTechnique[]>([])
    const [ongletsDyna, setOngletsDyna]       = useState<TypeOngletPartenaire[]>([])
    const [partCustom, setPartCustom]         = useState<Record<string, PartenaireCustom[]>>({})
    const [saved, setSaved]                   = useState(false)
    const [newOngletLabel, setNewOngletLabel] = useState('')
    const [showAddOnglet, setShowAddOnglet]   = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchAll() }, [projetId])

    const fetchAll = async () => {
        const [{ data: f }, { data: t }, { data: o }, { data: c }] = await Promise.all([
            supabase.from('partenaires_financiers').select('*').eq('projet_id', projetId).order('created_at'),
            supabase.from('partenaires_techniques').select('*').eq('projet_id', projetId).order('created_at'),
            supabase.from('types_onglets_partenaires').select('*').eq('projet_id', projetId).order('ordre'),
            supabase.from('partenaires_custom').select('*').eq('projet_id', projetId),
        ])
        if (f) setFinanciers(f)
        if (t) setTechniques(t)
        if (o) {
            setOngletsDyna(o)
            const map: Record<string, PartenaireCustom[]> = {}
            o.forEach(og => {
                map[og.id] = (c || []).filter(p => p.onglet_id === og.id)
            })
            setPartCustom(map)
        }
    }

    // ── Onglets dynamiques ─────────────────────────────────
    const ajouterOnglet = async () => {
        if (!newOngletLabel.trim()) return
        const { data } = await supabase
            .from('types_onglets_partenaires')
            .insert([{ projet_id: projetId, label: newOngletLabel.trim(), ordre: ongletsDyna.length }])
            .select().single()
        if (data) {
            setOngletsDyna(prev => [...prev, data])
            setPartCustom(prev => ({ ...prev, [data.id]: [] }))
            setOngletActif(data.id)
        }
        setNewOngletLabel('')
        setShowAddOnglet(false)
    }

    const supprimerOnglet = async (id: string) => {
        await supabase.from('types_onglets_partenaires').delete().eq('id', id)
        setOngletsDyna(prev => prev.filter(o => o.id !== id))
        setPartCustom(prev => { const n = { ...prev }; delete n[id]; return n })
        setOngletActif('financiers')
    }

    // ── Partenaires custom ─────────────────────────────────
    const ajouterCustom = async (ongletId: string) => {
        const { data } = await supabase
            .from('partenaires_custom')
            .insert([{ projet_id: projetId, onglet_id: ongletId, nom: 'Nouveau partenaire' }])
            .select().single()
        if (data) setPartCustom(prev => ({ ...prev, [ongletId]: [...(prev[ongletId] || []), data] }))
    }

    const updateCustom = async (ongletId: string, id: string, field: string, value: string) => {
        setPartCustom(prev => ({
            ...prev,
            [ongletId]: prev[ongletId].map(p => p.id === id ? { ...p, [field]: value } : p),
        }))
        await supabase.from('partenaires_custom').update({ [field]: value }).eq('id', id)
    }

    const supprimerCustom = async (ongletId: string, id: string) => {
        await supabase.from('partenaires_custom').delete().eq('id', id)
        setPartCustom(prev => ({ ...prev, [ongletId]: prev[ongletId].filter(p => p.id !== id) }))
    }

    // ── Partenaires financiers ─────────────────────────────
    const ajouterFinancier = async () => {
        const { data } = await supabase
            .from('partenaires_financiers')
            .insert([{ projet_id: projetId, nom: 'Nouveau partenaire', type_financement: 'emprunt', montant: 0, taux_interet: 0.1, duree_annees: 5 }])
            .select().single()
        if (data) setFinanciers(prev => [...prev, data])
    }

    const updateFinancier = async (id: string, field: string, value: string | number) => {
        setFinanciers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
        await supabase.from('partenaires_financiers').update({ [field]: value }).eq('id', id)
    }

    const supprimerFinancier = async (id: string) => {
        await supabase.from('partenaires_financiers').delete().eq('id', id)
        setFinanciers(prev => prev.filter(p => p.id !== id))
    }

    // ── Partenaires techniques ─────────────────────────────
    const ajouterTechnique = async () => {
        const { data } = await supabase
            .from('partenaires_techniques')
            .insert([{ projet_id: projetId, nom: 'Nouveau partenaire technique' }])
            .select().single()
        if (data) setTechniques(prev => [...prev, data])
    }

    const updateTechnique = async (id: string, field: string, value: string) => {
        setTechniques(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
        await supabase.from('partenaires_techniques').update({ [field]: value }).eq('id', id)
    }

    const supprimerTechnique = async (id: string) => {
        await supabase.from('partenaires_techniques').delete().eq('id', id)
        setTechniques(prev => prev.filter(p => p.id !== id))
    }

    // ── Compteurs ──────────────────────────────────────────
    const totalFinancement = financiers.reduce((s, p) => s + p.montant, 0)

    const allTabs = [
        ...ONGLETS_FIXES,
        ...ongletsDyna.map(o => ({ key: o.id, label: o.label, isDyna: true, id: o.id })),
    ]

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>7</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>Partenaires</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                Financiers, techniques et tout autre type de partenaire.
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Financement total', value: formatNum(totalFinancement) + ' FCFA', color: '#0D2B55' },
                    { label: 'Partenaires financiers', value: String(financiers.length), color: '#F0A02B' },
                    { label: 'Partenaires techniques', value: String(techniques.length), color: '#169B86' },
                ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 4px' }}>{s.label}</p>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
                {allTabs.map(tab => {
                    const isActive = ongletActif === tab.key
                    const isDyna = 'isDyna' in tab && !!tab.isDyna;
                    return (
                        <div key={tab.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
                            <button
                                onClick={() => setOngletActif(tab.key)}
                                style={{
                                    padding: '10px 16px', fontSize: '13px', fontWeight: isActive ? 600 : 400,
                                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                    color: isActive ? '#0D2B55' : '#6B7280',
                                    borderBottom: isActive ? '2px solid #F0A02B' : '2px solid transparent',
                                    marginBottom: '-1px',
                                }}
                            >
                                {tab.label}
                            </button>
                            {!!isDyna && (
                                <button
                                    onClick={() => supprimerOnglet(tab.key)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#9CA3AF', fontSize: '14px', padding: '0 4px', lineHeight: 1,
                                        marginBottom: '-1px',
                                    }}
                                    title="Supprimer cet onglet"
                                >×</button>
                            )}
                        </div>
                    )
                })}

                {/* Bouton ajouter onglet */}
                {showAddOnglet ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px' }}>
                        <input
                            type="text"
                            value={newOngletLabel}
                            onChange={e => setNewOngletLabel(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && ajouterOnglet()}
                            placeholder="Nom de l'onglet..."
                            autoFocus
                            style={{ ...inputStyle, width: '160px', padding: '4px 8px', fontSize: '12px' }}
                        />
                        <button
                            onClick={ajouterOnglet}
                            style={{
                                padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                                color: '#fff', backgroundColor: '#F0A02B', border: 'none',
                                borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            OK
                        </button>
                        <button
                            onClick={() => setShowAddOnglet(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '16px' }}
                        >×</button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddOnglet(true)}
                        style={{
                            padding: '8px 12px', fontSize: '12px', fontWeight: 500,
                            color: '#169B86', background: 'none', border: 'none',
                            cursor: 'pointer', fontFamily: 'inherit',
                            borderBottom: '2px solid transparent', marginBottom: '-1px',
                        }}
                    >
                        + Ajouter un type
                    </button>
                )}
            </div>

            {/* ── Contenu : Financiers ─────────────────────────── */}
            {ongletActif === 'financiers' && (
                <TabFinanciers
                    partenaires={financiers}
                    inputStyle={inputStyle}
                    onAjouter={ajouterFinancier}
                    onUpdate={updateFinancier}
                    onSupprimer={supprimerFinancier}
                />
            )}

            {/* ── Contenu : Techniques ─────────────────────────── */}
            {ongletActif === 'techniques' && (
                <TabTechniques
                    partenaires={techniques}
                    inputStyle={inputStyle}
                    onAjouter={ajouterTechnique}
                    onUpdate={updateTechnique}
                    onSupprimer={supprimerTechnique}
                />
            )}

            {/* ── Contenu : Onglets dynamiques ─────────────────── */}
            {ongletsDyna.map(og => ongletActif === og.id && (
                <TabCustom
                    key={og.id}
                    ongletId={og.id}
                    partenaires={partCustom[og.id] || []}
                    inputStyle={inputStyle}
                    onAjouter={() => ajouterCustom(og.id)}
                    onUpdate={(id, f, v) => updateCustom(og.id, id, f, v)}
                    onSupprimer={(id) => supprimerCustom(og.id, id)}
                />
            ))}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                {saved && <span style={{ fontSize: '13px', color: '#169B86', alignSelf: 'center' }}>✓ Sauvegardé</span>}
                <button
                    onClick={() => { setSaved(true); onSave(); setTimeout(() => setSaved(false), 2000) }}
                    style={{
                        padding: '10px 24px', fontSize: '13px', fontWeight: 600,
                        color: '#fff', backgroundColor: '#F0A02B',
                        border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Sauvegarder
                </button>
            </div>
        </div>
    )
}

// ─── Sous-composant : Financiers ──────────────────────────────
function TabFinanciers({ partenaires, inputStyle, onAjouter, onUpdate, onSupprimer }: {
    partenaires: PartenaireFinancier[]
    inputStyle: React.CSSProperties
    onAjouter: () => void
    onUpdate: (id: string, field: string, value: string | number) => void
    onSupprimer: (id: string) => void
}) {
    const typeLabel: Record<string, string> = {
        emprunt: 'Emprunt bancaire', fonds_propres: 'Fonds propres',
        subvention: 'Subvention', autre: 'Autre',
    }
    const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

    return (
        <div>
            {partenaires.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF' }}>
                    <p style={{ fontSize: '14px' }}>Aucun partenaire financier</p>
                </div>
            ) : partenaires.map(p => (
                <div key={p.id} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '18px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#0D2B55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏦</div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{p.nom}</p>
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#FFF3DC', color: '#854F0B' }}>
                  {typeLabel[p.type_financement || 'autre']}
                </span>
                            </div>
                        </div>
                        <button onClick={() => onSupprimer(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px' }}>×</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Nom</label>
                            <input type="text" value={p.nom} onChange={e => onUpdate(p.id, 'nom', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Type de financement</label>
                            <select value={p.type_financement || 'emprunt'} onChange={e => onUpdate(p.id, 'type_financement', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="emprunt">Emprunt bancaire</option>
                                <option value="fonds_propres">Fonds propres</option>
                                <option value="subvention">Subvention</option>
                                <option value="autre">Autre</option>
                            </select>
                            {/* NOUVEAU : saisie libre si "Autre" */}
                            {p.type_financement === 'autre' && (
                                <input
                                    type="text"
                                    value={p.type_financement_libre || ''}
                                    onChange={e => onUpdate(p.id, 'type_financement_libre', e.target.value)}
                                    placeholder="Précisez le type..."
                                    style={{ ...inputStyle, marginTop: '6px', borderColor: '#F0A02B' }}
                                />
                            )}
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Montant (FCFA)</label>
                            <input type="number" value={p.montant} min={0} onChange={e => onUpdate(p.id, 'montant', parseFloat(e.target.value))} style={inputStyle} />
                        </div>
                    </div>

                    {/* NOUVEAU : Rôle dans le projet */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Rôle dans le projet</label>
                        <input type="text" value={p.role_projet || ''} onChange={e => onUpdate(p.id, 'role_projet', e.target.value)} placeholder="Ex : Financeur principal du CAPEX..." style={inputStyle} />
                    </div>

                    {p.type_financement === 'emprunt' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Taux d&apos;intérêt (%)</label>
                                <input type="number" value={Math.round(p.taux_interet * 100 * 10) / 10} min={0} max={30} step={0.1} onChange={e => onUpdate(p.id, 'taux_interet', parseFloat(e.target.value) / 100)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Durée (années)</label>
                                <input type="number" value={p.duree_annees} min={1} max={30} onChange={e => onUpdate(p.id, 'duree_annees', parseInt(e.target.value))} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Remboursement/an estimé</label>
                                <div style={{ padding: '8px 12px', backgroundColor: '#E1F5EE', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#169B86' }}>
                                    {formatNum(p.montant / (p.duree_annees || 1))} FCFA
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Conditions particulières</label>
                        <textarea value={p.conditions || ''} onChange={e => onUpdate(p.id, 'conditions', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                    </div>
                </div>
            ))}

            <button onClick={onAjouter} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 500, color: '#F0A02B', backgroundColor: '#FFF3DC', border: '1px dashed #F0A02B', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Ajouter un partenaire financier
            </button>
        </div>
    )
}

// ─── Sous-composant : Techniques ─────────────────────────────
function TabTechniques({ partenaires, inputStyle, onAjouter, onUpdate, onSupprimer }: {
    partenaires: PartenaireTechnique[]
    inputStyle: React.CSSProperties
    onAjouter: () => void
    onUpdate: (id: string, field: string, value: string) => void
    onSupprimer: (id: string) => void
}) {
    return (
        <div>
            {partenaires.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF' }}>
                    <p style={{ fontSize: '14px' }}>Aucun partenaire technique</p>
                </div>
            ) : partenaires.map(p => (
                <div key={p.id} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '18px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#169B86', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🔧</div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{p.nom}</p>
                        </div>
                        <button onClick={() => onSupprimer(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px' }}>×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Nom</label>
                            <input type="text" value={p.nom} onChange={e => onUpdate(p.id, 'nom', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Type</label>
                            <select value={p.type || ''} onChange={e => onUpdate(p.id, 'type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="">Choisir</option>
                                {['Fournisseur', 'Installateur', 'Distributeur', 'Sous-traitant', 'Autre'].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Rôle dans le projet</label>
                            <input type="text" value={p.role || ''} onChange={e => onUpdate(p.id, 'role', e.target.value)} placeholder="Ex : Fourniture des panneaux solaires" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Contact</label>
                            <input type="text" value={p.contact || ''} onChange={e => onUpdate(p.id, 'contact', e.target.value)} placeholder="contact@partenaire.com" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Apport / Valeur ajoutée</label>
                        <textarea value={p.apport || ''} onChange={e => onUpdate(p.id, 'apport', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                    </div>
                </div>
            ))}

            <button onClick={onAjouter} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 500, color: '#169B86', backgroundColor: '#E1F5EE', border: '1px dashed #169B86', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Ajouter un partenaire technique
            </button>
        </div>
    )
}

// ─── Sous-composant : Onglet dynamique ───────────────────────
function TabCustom({ ongletId, partenaires, inputStyle, onAjouter, onUpdate, onSupprimer }: {
    ongletId: string
    partenaires: PartenaireCustom[]
    inputStyle: React.CSSProperties
    onAjouter: () => void
    onUpdate: (id: string, field: string, value: string) => void
    onSupprimer: (id: string) => void
}) {
    return (
        <div>
            {partenaires.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF' }}>
                    <p style={{ fontSize: '14px' }}>Aucun partenaire dans cet onglet</p>
                </div>
            ) : partenaires.map(p => (
                <div key={p.id} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '18px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{p.nom}</p>
                        <button onClick={() => onSupprimer(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px' }}>×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Nom</label>
                            <input type="text" value={p.nom} onChange={e => onUpdate(p.id, 'nom', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Rôle</label>
                            <input type="text" value={p.role || ''} onChange={e => onUpdate(p.id, 'role', e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Apport</label>
                            <textarea value={p.apport || ''} onChange={e => onUpdate(p.id, 'apport', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Contact</label>
                            <input type="text" value={p.contact || ''} onChange={e => onUpdate(p.id, 'contact', e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                </div>
            ))}

            <button onClick={onAjouter} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 500, color: '#0D2B55', backgroundColor: '#E6F1FB', border: '1px dashed #0D2B55', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Ajouter un partenaire
            </button>
        </div>
    )
}
