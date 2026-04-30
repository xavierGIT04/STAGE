'use client'

// Page de paramètres globaux de l'entreprise

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { ProfilEntrepriseGlobal } from '@/lib/superbase/types'

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 14px', fontSize: '13px',
    border: '1px solid #E5E7EB', borderRadius: '10px',
    backgroundColor: '#fff', outline: 'none',
    fontFamily: 'inherit', color: '#111827',
}

const labelStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 500,
    color: '#374151', display: 'block', marginBottom: '6px',
}

export default function ParametresPage() {
    const [form, setForm] = useState<Partial<ProfilEntrepriseGlobal>>({})
    const [loading, setSaving] = useState(false)
    const [saved, setSaved]    = useState(false)
    const [profilId, setProfilId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => { fetchProfil() }, [])

    const fetchProfil = async () => {
        const { data } = await supabase
            .from('profil_entreprise_global')
            .select('*')
            .limit(1)
            .single()
        if (data) {
            setProfilId(data.id)
            setForm(data)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        if (profilId) {
            await supabase.from('profil_entreprise_global').update(form).eq('id', profilId)
        } else {
            const { data } = await supabase
                .from('profil_entreprise_global')
                .insert([form])
                .select().single()
            if (data) setProfilId(data.id)
        }

        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const f = (field: keyof ProfilEntrepriseGlobal) => ({
        value: (form[field] as string) || '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value })),
    })

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
                    Paramètres de l&apos;entreprise
                </h1>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                    Ces informations sont pré-remplies automatiquement à la création de chaque projet, mais restent modifiables localement.
                </p>
            </div>

            {/* Bandeau info */}
            <div style={{ backgroundColor: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: '10px', padding: '12px 16px', marginBottom: '28px', fontSize: '13px', color: '#185FA5' }}>
                💡 Ces données constituent le profil <strong>global</strong> de votre organisation. À la création d&apos;un nouveau projet, elles seront copiées dans la section &apos;Qui sommes-nous ?&apos; — vous pourrez les modifier sans affecter les autres projets.
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0D2B55', margin: '0 0 18px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB' }}>
                        Identité de l&apos;entreprise
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                        <div>
                            <label style={labelStyle}>Nom de l&apos;entreprise</label>
                            <input type="text" {...f('nom_entreprise')} placeholder="Ex : KYA-Energy Group" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Slogan / Accroche</label>
                            <input type="text" {...f('slogan')} placeholder="Ex : Move beyond the sky !" style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                        <div>
                            <label style={labelStyle}>Année de création</label>
                            <input type="number" value={form.annee_creation || ''} onChange={e => setForm(p => ({ ...p, annee_creation: parseInt(e.target.value) }))} placeholder="2015" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Localisation</label>
                            <input type="text" {...f('localisation')} placeholder="Lomé, Togo" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Effectif</label>
                            <input type="text" {...f('effectif')} placeholder="30 ingénieurs et techniciens" style={inputStyle} />
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0D2B55', margin: '0 0 18px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB' }}>
                        Mission, Vision & Valeurs
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={labelStyle}>Mission</label>
                            <textarea {...f('mission')} rows={3} placeholder="Ce que l'entreprise fait et pour qui..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Vision</label>
                                <textarea {...f('vision')} rows={3} placeholder="Où l'entreprise veut aller..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                            </div>
                            <div>
                                <label style={labelStyle}>Valeurs</label>
                                <textarea {...f('valeurs')} rows={3} placeholder="Professionnalisme, Intégrité..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0D2B55', margin: '0 0 18px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB' }}>
                        Notre société & Notre histoire
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={labelStyle}>Notre société</label>
                            <textarea {...f('notre_societe')} rows={4} placeholder="Présentation générale de la société..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Notre histoire</label>
                            <textarea {...f('notre_histoire')} rows={4} placeholder="L'histoire et l'évolution de l'entreprise..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0D2B55', margin: '0 0 18px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB' }}>
                        Expertise & Certifications
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                            <label style={labelStyle}>Expertise clé</label>
                            <textarea {...f('expertise_cle')} rows={3} placeholder="Domaine d'expertise principal..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Certifications</label>
                            <input type="text" {...f('certifications')} placeholder="ISO 9001:2015" style={inputStyle} />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    {saved && <span style={{ fontSize: '13px', color: '#169B86', alignSelf: 'center' }}>✓ Sauvegardé</span>}
                    <button
                        type="submit" disabled={loading}
                        style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 600, color: '#fff', backgroundColor: loading ? '#D1D5DB' : '#F0A02B', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                    >
                        {loading ? 'Sauvegarde...' : 'Enregistrer les paramètres'}
                    </button>
                </div>

            </form>
        </div>
    )
}
