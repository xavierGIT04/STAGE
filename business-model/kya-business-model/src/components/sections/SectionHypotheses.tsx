'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'

interface Props {
    projetId: string
    onSave: () => void
}

interface HypoSection {
    titre: string
    hypotheses: {
        cle: string
        label: string
        unite: string
        description: string
        defaut: number
    }[]
}

const STRUCTURE: HypoSection[] = [
    {
        titre: 'Fiscalité & Taux',
        hypotheses: [
            { cle: 'taux_is',          label: "Taux d'impôt sur les sociétés", unite: '%',     description: 'Taux IS applicable au projet',             defaut: 0.27  },
            { cle: 'taux_is_min',      label: 'Impôt minimum forfaitaire',     unite: '%',     description: "Si résultat nul ou négatif",               defaut: 0.01  },
            { cle: 'tva',              label: 'TVA',                           unite: '%',     description: 'Taux de TVA applicable',                   defaut: 0.18  },
            { cle: 'taf',              label: 'TAF sur intérêts',              unite: '%',     description: 'Taxe sur les activités financières',        defaut: 0.10  },
        ]
    },
    {
        titre: 'Marges & Revenus',
        hypotheses: [
            { cle: 'marge_beneficiaire', label: 'Marge bénéficiaire',    unite: '%', description: 'Marge appliquée sur le coût de revient', defaut: 0.204 },
            { cle: 'frais_coordination', label: 'Frais de coordination', unite: '%', description: '% du chiffre d\'affaires annuel',        defaut: 0.01  },
            { cle: 'frais_marketing',    label: 'Marketing & Comm.',     unite: '%', description: '% du chiffre d\'affaires annuel',        defaut: 0.02  },
            { cle: 'frais_rd',           label: 'Recherche & Développement', unite: '%', description: '% du chiffre d\'affaires annuel',   defaut: 0.01  },
        ]
    },
    {
        titre: 'Volumes & Croissance',
        hypotheses: [
            { cle: 'volume_initial',      label: 'Volume initial (unités)', unite: 'unités', description: 'Nombre de produits vendus la 1ère année', defaut: 100  },
            { cle: 'taux_croissance',     label: 'Taux de croissance annuel', unite: '%',   description: 'Croissance des ventes par an',           defaut: 0.25 },
            { cle: 'taux_encaissement',   label: "Taux d'encaissement",       unite: '%',   description: 'Part des ventes effectivement encaissées', defaut: 1.0 },
        ]
    },
    {
        titre: 'Financement',
        hypotheses: [
            { cle: 'fonds_propres',    label: 'Part fonds propres',          unite: '%',     description: '% de l\'investissement financé en fonds propres', defaut: 0.20 },
            { cle: 'emprunts',         label: 'Part emprunt',                unite: '%',     description: '% de l\'investissement financé par emprunt',      defaut: 0.80 },
            { cle: 'duree_remb',       label: 'Durée de remboursement',      unite: 'ans',   description: 'Durée du prêt en années',                         defaut: 5    },
            { cle: 'taux_interet',     label: "Taux d'intérêt emprunt",      unite: '%',     description: 'Taux annuel du prêt bancaire',                    defaut: 0.10 },
            { cle: 'wacc',             label: 'WACC',                        unite: '%',     description: 'Coût moyen pondéré du capital',                   defaut: 0.10 },
        ]
    },
    {
        titre: 'Client',
        hypotheses: [
            { cle: 'frais_dossier',    label: 'Frais de dossier client',     unite: '%',     description: '% appliqué sur le montant du crédit client', defaut: 0.01  },
            { cle: 'assurance_pret',   label: 'Assurance sur prêt client',   unite: '%',     description: 'Taux d\'assurance du crédit client',          defaut: 0.015 },
            { cle: 'taux_credit_client', label: "Taux d'intérêt client",     unite: '%',     description: 'Taux appliqué au crédit client',              defaut: 0.075 },
            { cle: 'droits_enreg',     label: "Droits d'enregistrement",     unite: 'FCFA',  description: 'Montant forfaitaire',                         defaut: 200000 },
        ]
    },
]

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '13px',
    border: '1px solid #E5E7EB', borderRadius: '8px',
    backgroundColor: '#fff', outline: 'none',
    fontFamily: 'inherit', color: '#111827', textAlign: 'right'
}

export default function SectionHypotheses({ projetId, onSave }: Props) {
    const [valeurs, setValeurs] = useState<Record<string, number>>({})
    const [saving, setSaving]   = useState(false)
    const [saved, setSaved]     = useState(false)
    const supabase = createClient()

    useEffect(() => { fetchHypotheses() }, [projetId])

    const fetchHypotheses = async () => {
        const { data } = await supabase
            .from('hypotheses')
            .select('*')
            .eq('projet_id', projetId)

        if (data && data.length > 0) {
            const map: Record<string, number> = {}
            data.forEach(h => { map[h.cle] = h.valeur })
            setValeurs(map)
        } else {
            // Charger les valeurs par défaut
            const defaults: Record<string, number> = {}
            STRUCTURE.forEach(s => s.hypotheses.forEach(h => { defaults[h.cle] = h.defaut }))
            setValeurs(defaults)
        }
    }

    const handleChange = (cle: string, valeur: number) => {
        setValeurs(prev => ({ ...prev, [cle]: valeur }))
    }

    const handleSave = async () => {
        setSaving(true)

        // Supprimer les anciennes hypothèses et réinsérer
        await supabase.from('hypotheses').delete().eq('projet_id', projetId)

        const toInsert = STRUCTURE.flatMap(s =>
            s.hypotheses.map(h => ({
                projet_id:   projetId,
                cle:         h.cle,
                valeur:      valeurs[h.cle] ?? h.defaut,
                unite:       h.unite,
                section:     s.titre,
                description: h.description,
            }))
        )

        await supabase.from('hypotheses').insert(toInsert)

        setSaving(false)
        setSaved(true)
        onSave()
        setTimeout(() => setSaved(false), 2000)
    }

    const totalFP   = valeurs['fonds_propres'] || 0
    const totalEmp  = valeurs['emprunts'] || 0
    const somme     = Math.round((totalFP + totalEmp) * 100) / 100

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>4</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Hypothèses
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '28px', paddingLeft: '44px' }}>
                Ces paramètres pilotent tous les calculs financiers. Toute modification est répercutée automatiquement.
            </p>

            {/* Alerte financement */}
            {somme !== 1 && (somme > 0) && (
                <div style={{
                    backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: '10px', padding: '10px 16px', marginBottom: '20px',
                    fontSize: '13px', color: '#E24B4A'
                }}>
                    ⚠ Fonds propres + Emprunt = {Math.round(somme * 100)}% — la somme doit être égale à 100%
                </div>
            )}

            {somme === 1 && (somme > 0) && (
                <div style={{
                    backgroundColor: '#E1F5EE', border: '1px solid #A7F3D0',
                    borderRadius: '10px', padding: '10px 16px', marginBottom: '20px',
                    fontSize: '13px', color: '#0F6E56'
                }}>
                    ✓ Fonds propres + Emprunt = 100%
                </div>
            )}

            {/* Sections hypothèses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {STRUCTURE.map(section => (
                    <div key={section.titre} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '18px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0D2B55', margin: '0 0 14px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB' }}>
                            {section.titre}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            {section.hypotheses.map(h => (
                                <div key={h.cle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#374151', margin: '0 0 2px' }}>
                                            {h.label}
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                                            {h.description}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                        <input
                                            type="number"
                                            step="0.001"
                                            value={valeurs[h.cle] ?? h.defaut}
                                            onChange={e => handleChange(h.cle, parseFloat(e.target.value))}
                                            style={{ ...inputStyle, width: '100px' }}
                                        />
                                        <span style={{ fontSize: '12px', color: '#9CA3AF', minWidth: '36px' }}>
                      {h.unite}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                {saved && <span style={{ fontSize: '13px', color: '#169B86', alignSelf: 'center' }}>✓ Sauvegardé</span>}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        padding: '10px 24px', fontSize: '13px', fontWeight: 600,
                        color: '#fff', backgroundColor: saving ? '#D1D5DB' : '#F0A02B',
                        border: 'none', borderRadius: '10px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit'
                    }}
                >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
            </div>
        </div>
    )
}