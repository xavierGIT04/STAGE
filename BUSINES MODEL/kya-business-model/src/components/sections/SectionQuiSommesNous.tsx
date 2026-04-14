'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'

interface Props {
    projetId: string
    onSave: () => void
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 14px', fontSize: '13px',
    border: '1px solid #E5E7EB', borderRadius: '10px',
    backgroundColor: '#fff', outline: 'none',
    fontFamily: 'inherit', color: '#111827'
}

const labelStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 500,
    color: '#374151', display: 'block', marginBottom: '6px'
}

export default function SectionQuiSommesNous({ projetId, onSave }: Props) {
    const [loading, setSaving] = useState(false)
    const [saved, setSaved]    = useState(false)
    const [form, setForm] = useState({
        nom_entreprise: '',
        slogan:         '',
        mission:        '',
        vision:         '',
        valeurs:        '',
        certifications: '',
        annee_creation: '',
        localisation:   '',
        effectif:       '',
        expertise_cle:  '',
    })
    const supabase = createClient()

    useEffect(() => { fetchData() }, [projetId])

    const fetchData = async () => {
        const { data } = await supabase
            .from('entreprise_profil')
            .select('*')
            .eq('projet_id', projetId)
            .single()
        if (data) setForm({
            nom_entreprise: data.nom_entreprise || '',
            slogan:         data.slogan || '',
            mission:        data.mission || '',
            vision:         data.vision || '',
            valeurs:        data.valeurs || '',
            certifications: data.certifications || '',
            annee_creation: data.annee_creation?.toString() || '',
            localisation:   data.localisation || '',
            effectif:       data.effectif || '',
            expertise_cle:  data.expertise_cle || '',
        })
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            projet_id:      projetId,
            ...form,
            annee_creation: form.annee_creation ? parseInt(form.annee_creation) : null,
        }

        // Upsert
        const { data: existing } = await supabase
            .from('entreprise_profil')
            .select('id')
            .eq('projet_id', projetId)
            .single()

        if (existing) {
            await supabase.from('entreprise_profil').update(payload).eq('projet_id', projetId)
        } else {
            await supabase.from('entreprise_profil').insert([payload])
        }

        setSaving(false)
        setSaved(true)
        onSave()
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div>
            {/* Header section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>1</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Qui sommes-nous ?
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '28px', paddingLeft: '44px' }}>
                Présentation de l&apos;entreprise — ces informations apparaîtront dans le Word et le PowerPoint générés.
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Nom de l&apos;entreprise <span style={{ color: '#E24B4A' }}>*</span></label>
                        <input
                            type="text" required value={form.nom_entreprise}
                            onChange={e => setForm({ ...form, nom_entreprise: e.target.value })}
                            placeholder="Ex : KYA-Energy Group"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Slogan / Accroche</label>
                        <input
                            type="text" value={form.slogan}
                            onChange={e => setForm({ ...form, slogan: e.target.value })}
                            placeholder="Ex : Move beyond the sky !"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Mission <span style={{ color: '#E24B4A' }}>*</span></label>
                    <textarea
                        required value={form.mission}
                        onChange={e => setForm({ ...form, mission: e.target.value })}
                        placeholder="Ce que l'entreprise fait et pour qui..."
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Vision</label>
                        <textarea
                            value={form.vision}
                            onChange={e => setForm({ ...form, vision: e.target.value })}
                            placeholder="Où l'entreprise veut aller..."
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Valeurs</label>
                        <textarea
                            value={form.valeurs}
                            onChange={e => setForm({ ...form, valeurs: e.target.value })}
                            placeholder="Ex : Professionnalisme, Intégrité, Innovation..."
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Certifications</label>
                        <input
                            type="text" value={form.certifications}
                            onChange={e => setForm({ ...form, certifications: e.target.value })}
                            placeholder="Ex : ISO 9001:2015"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Année de création</label>
                        <input
                            type="number" value={form.annee_creation}
                            onChange={e => setForm({ ...form, annee_creation: e.target.value })}
                            placeholder="Ex : 2015"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Localisation</label>
                        <input
                            type="text" value={form.localisation}
                            onChange={e => setForm({ ...form, localisation: e.target.value })}
                            placeholder="Ex : Lomé, Togo"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Effectif</label>
                        <input
                            type="text" value={form.effectif}
                            onChange={e => setForm({ ...form, effectif: e.target.value })}
                            placeholder="Ex : 30 ingénieurs et techniciens"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Expertise clé</label>
                    <textarea
                        value={form.expertise_cle}
                        onChange={e => setForm({ ...form, expertise_cle: e.target.value })}
                        placeholder="Domaine d'expertise principal et avantages concurrentiels..."
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                    {saved && (
                        <span style={{ fontSize: '13px', color: '#169B86', alignSelf: 'center' }}>
              ✓ Sauvegardé
            </span>
                    )}
                    <button
                        type="submit" disabled={loading}
                        style={{
                            padding: '10px 24px', fontSize: '13px', fontWeight: 600,
                            color: '#fff', backgroundColor: loading ? '#D1D5DB' : '#F0A02B',
                            border: 'none', borderRadius: '10px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit'
                        }}
                    >
                        {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>

            </form>
        </div>
    )
}