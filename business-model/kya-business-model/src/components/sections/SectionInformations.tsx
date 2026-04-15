'use client'

import { useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { Projet } from '@/lib/superbase/types'
import { Statut } from '@/lib/superbase/types'

interface Props {
    projet: Projet
    onSave: (projet: Projet) => void
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

export default function SectionInformations({ projet, onSave }: Props) {
    const [loading, setLoading] = useState(false)
    const [saved, setSaved]     = useState(false)
    const [form, setForm] = useState({
        nom:               projet.nom || '',
        numero_projet:     projet.numero_projet || '',
        description:       projet.description || '',
        secteur:           projet.secteur || '',
        produit_principal: projet.produit_principal || '',
        annee_demarrage:   projet.annee_demarrage || new Date().getFullYear(),
        duree_projet:      projet.duree_projet || 5,
        devise:            projet.devise || 'FCFA',
        statut:            projet.statut || 'draft',
    })
    const supabase = createClient()

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data } = await supabase
            .from('projets')
            .update(form)
            .eq('id', projet.id)
            .select()
            .single()

        if (data) onSave(data)
        setLoading(false)
        setSaved(true)
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
                }}>2</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Informations du projet
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '28px', paddingLeft: '44px' }}>
                Informations générales qui définissent le cadre du Business Model.
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Nom du projet <span style={{ color: '#E24B4A' }}>*</span></label>
                        <input
                            type="text" required value={form.nom}
                            onChange={e => setForm({ ...form, nom: e.target.value })}
                            placeholder="Ex : KYA-SoP Institutions"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Numéro de projet</label>
                        <input
                            type="text" value={form.numero_projet}
                            onChange={e => setForm({ ...form, numero_projet: e.target.value })}
                            placeholder="Ex : 001-26-KYA"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Description</label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Décrivez brièvement le projet..."
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Secteur d&apos;activité</label>
                        <select
                            value={form.secteur}
                            onChange={e => setForm({ ...form, secteur: e.target.value })}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                            <option value="">Choisir un secteur</option>
                            <option value="Énergie">Énergie</option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="BTP">BTP</option>
                            <option value="Santé">Santé</option>
                            <option value="Éducation">Éducation</option>
                            <option value="Technologie">Technologie</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Produit ou service principal</label>
                        <input
                            type="text" value={form.produit_principal}
                            onChange={e => setForm({ ...form, produit_principal: e.target.value })}
                            placeholder="Ex : Groupe électrosolaire"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Année démarrage</label>
                        <input
                            type="number" value={form.annee_demarrage}
                            onChange={e => setForm({ ...form, annee_demarrage: parseInt(e.target.value) })}
                            min={2020} max={2035}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Durée (ans)</label>
                        <input
                            type="number" value={form.duree_projet}
                            onChange={e => setForm({ ...form, duree_projet: parseInt(e.target.value) })}
                            min={1} max={20}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Devise</label>
                        <select
                            value={form.devise}
                            onChange={e => setForm({ ...form, devise: e.target.value })}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                            <option value="FCFA">FCFA</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Statut</label>
                        <select
                            value={form.statut}
                            onChange={e => setForm({ ...form, statut: e.target.value as Statut})}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                            <option value="draft">Draft</option>
                            <option value="en_cours">En cours</option>
                            <option value="finalise">Finalisé</option>
                            <option value="archive">Archivé</option>
                        </select>
                    </div>
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