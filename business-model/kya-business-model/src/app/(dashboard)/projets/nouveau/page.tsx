'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/superbase/client'

export default function NouveauProjetPage() {
    const [etape, setEtape]           = useState<'modele' | 'infos'>('modele')
    const [modeleChoisi, setModele]   = useState('')
    const [loading, setLoading]       = useState(false)
    const [error, setError]           = useState('')
    const [form, setForm] = useState({
        nom:               '',
        numero_projet:     '',
        description:       '',
        secteur:           '',
        produit_principal: '',
        annee_demarrage:   new Date().getFullYear(),
        duree_projet:      5,
        devise:            'FCFA',
    })
    const router   = useRouter()
    const supabase = createClient()

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data, error } = await supabase
            .from('projets')
            .insert([{ ...form, modele: modeleChoisi, statut: 'draft' }])
            .select()
            .single()

        if (error || !data) {
            setError('Erreur lors de la création du projet.')
            setLoading(false)
            return
        }

        router.push(`/projets/${data.id}`)
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

    // ── ÉTAPE 1 : Choix du modèle ────────────────────────────────────────────
    if (etape === 'modele') {
        return (
            <div>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                    <button
                        onClick={() => router.push('/')}
                        style={{ fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        ← Mes projets
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                        Quel type de Business Model souhaitez-vous créer ?
                    </h1>
                    <p style={{ fontSize: '13px', color: '#6B7280' }}>
                        Choisissez un modèle pour démarrer. Ce choix détermine la structure de votre projet.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>

                    {/* Lancement de produit */}
                    <div
                        onClick={() => setModele('lancement_produit')}
                        style={{
                            backgroundColor: '#fff', borderRadius: '14px',
                            border: modeleChoisi === 'lancement_produit' ? '2px solid #F0A02B' : '2px solid #E5E7EB',
                            padding: '24px', cursor: 'pointer',
                            transition: 'border-color 0.15s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>
                                        Lancement de produit
                                    </p>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                                        backgroundColor: '#E1F5EE', color: '#0F6E56', borderRadius: '20px'
                                    }}>
                                        Disponible
                                    </span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>
                                    Modèle recommandé
                                </p>
                            </div>
                        </div>

                        <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: '0 0 16px' }}>
                            Pour la commercialisation d&apos;un nouveau produit ou service. Structure complète en 10 sections.
                        </p>

                        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', margin: '0 0 8px' }}>
                                10 sections incluses :
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {[
                                    'Qui sommes-nous ?', 'Informations', 'Produits & Services',
                                    'Hypothèses', 'Coûts', 'Revenus', 'Partenaires financiers',
                                    'Concurrents', 'Prévisions financières', 'KPIs & Dashboard'
                                ].map((s, i) => (
                                    <span key={s} style={{
                                        fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                                        backgroundColor: i <= 1 ? '#FFF3DC' : '#F3F4F6',
                                        color: i <= 1 ? '#854F0B' : '#4B5563'
                                    }}>
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modèle libre */}
                    <div style={{
                        backgroundColor: '#F9FAFB', borderRadius: '14px',
                        border: '2px solid #E5E7EB', padding: '24px',
                        opacity: 0.6, cursor: 'not-allowed'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>
                                        Modèle libre
                                    </p>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                                        backgroundColor: '#F3F4F6', color: '#6B7280', borderRadius: '20px'
                                    }}>
                                        Bientôt
                                    </span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>
                                    Disponible prochainement
                                </p>
                            </div>
                        </div>
                        <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                            Créez votre propre structure section par section, sans gabarit imposé. Pour les projets atypiques.
                        </p>
                    </div>

                </div>

                {/* Bouton continuer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '800px', margin: '32px auto 0' }}>
                    <button
                        onClick={() => modeleChoisi && setEtape('infos')}
                        disabled={!modeleChoisi}
                        style={{
                            padding: '11px 28px', fontSize: '14px', fontWeight: 600,
                            color: '#fff', backgroundColor: modeleChoisi ? '#F0A02B' : '#D1D5DB',
                            border: 'none', borderRadius: '10px',
                            cursor: modeleChoisi ? 'pointer' : 'not-allowed',
                            fontFamily: 'inherit', transition: 'background-color 0.15s'
                        }}
                    >
                        Continuer avec ce modèle →
                    </button>
                </div>
            </div>
        )
    }

    // ── ÉTAPE 2 : Informations du projet ─────────────────────────────────────
    return (
        <div>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                <button
                    onClick={() => setEtape('modele')}
                    style={{ fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                    ← Retour
                </button>
                <span style={{ fontSize: '13px', color: '#D1D5DB' }}>/</span>
                <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>Informations du projet</span>
            </div>

            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                    Informations générales
                </h1>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '32px' }}>
                    Ces informations définissent le cadre de votre Business Model.
                </p>

                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Nom + Numéro */}
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

                    {/* Description */}
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

                    {/* Secteur + Produit */}
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

                    {/* Année + Durée + Devise */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                        <div>
                            <label style={labelStyle}>Année de démarrage</label>
                            <input
                                type="number" value={form.annee_demarrage}
                                onChange={e => setForm({ ...form, annee_demarrage: parseInt(e.target.value) })}
                                min={2020} max={2035}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Durée du projet (ans)</label>
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
                    </div>

                    {error && (
                        <p style={{
                            fontSize: '13px', color: '#E24B4A',
                            backgroundColor: '#FEF2F2', padding: '10px 14px', borderRadius: '8px'
                        }}>
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setEtape('modele')}
                            style={{
                                padding: '10px 20px', fontSize: '13px', fontWeight: 500,
                                color: '#6B7280', backgroundColor: '#fff',
                                border: '1px solid #E5E7EB', borderRadius: '10px',
                                cursor: 'pointer', fontFamily: 'inherit'
                            }}
                        >
                            ← Retour
                        </button>
                        <button
                            type="submit" disabled={loading}
                            style={{
                                padding: '10px 28px', fontSize: '14px', fontWeight: 600,
                                color: '#fff', backgroundColor: loading ? '#D1D5DB' : '#F0A02B',
                                border: 'none', borderRadius: '10px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', transition: 'background-color 0.15s'
                            }}
                        >
                            {loading ? 'Création...' : 'Créer le projet →'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}