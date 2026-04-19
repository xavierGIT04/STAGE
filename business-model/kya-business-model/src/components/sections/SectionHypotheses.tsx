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
        defaut: number        // valeur stockée en DB (décimal pour les %, montant pour FCFA)
        affichage: number     // valeur affichée à l'utilisateur (ex: 27 pour 27%)
        estPourcentage: boolean
        step: number
        min: number
        max: number
    }[]
}

// Règle simple :
// - estPourcentage = true  → stocké en décimal (0.27), affiché en % (27)
// - estPourcentage = false → stocké et affiché tel quel (montants, années, unités)
const STRUCTURE: HypoSection[] = [
    {
        titre: 'Fiscalité & Taux',
        hypotheses: [
            {
                cle: 'taux_is',
                label: "Taux d'impôt sur les sociétés (IS)",
                unite: '%',
                description: 'Ex : 27 pour 27%. Taux IS applicable au projet.',
                defaut: 0.27, affichage: 27, estPourcentage: true,
                step: 0.1, min: 0, max: 60
            },
            {
                cle: 'taux_is_min',
                label: 'Impôt minimum forfaitaire',
                unite: '% du CA',
                description: 'Ex : 1 pour 1%. Appliqué même si le résultat est nul ou négatif.',
                defaut: 0.01, affichage: 1, estPourcentage: true,
                step: 0.1, min: 0, max: 5
            },
            {
                cle: 'tva',
                label: 'TVA',
                unite: '%',
                description: 'Ex : 18 pour 18%. Taux de TVA applicable.',
                defaut: 0.18, affichage: 18, estPourcentage: true,
                step: 0.5, min: 0, max: 30
            },
            {
                cle: 'taf',
                label: 'TAF sur intérêts financiers',
                unite: '%',
                description: 'Ex : 10 pour 10%. Taxe sur les activités financières.',
                defaut: 0.10, affichage: 10, estPourcentage: true,
                step: 0.5, min: 0, max: 20
            },
        ]
    },
    {
        titre: 'Marges & Revenus',
        hypotheses: [
            {
                cle: 'marge_beneficiaire',
                label: 'Marge bénéficiaire (markup)',
                unite: '%',
                description: 'Ex : 20.4 pour 20.4%. Marge ajoutée au-dessus du coût de revient.',
                defaut: 0.204, affichage: 20.4, estPourcentage: true,
                step: 0.1, min: 0, max: 200
            },
            {
                cle: 'frais_coordination',
                label: 'Frais de coordination',
                unite: '% du CA',
                description: 'Ex : 1 pour 1% du CA annuel.',
                defaut: 0.01, affichage: 1, estPourcentage: true,
                step: 0.1, min: 0, max: 20
            },
            {
                cle: 'frais_marketing',
                label: 'Marketing & Communication',
                unite: '% du CA',
                description: 'Ex : 2 pour 2% du CA annuel.',
                defaut: 0.02, affichage: 2, estPourcentage: true,
                step: 0.1, min: 0, max: 20
            },
            {
                cle: 'frais_rd',
                label: 'Recherche & Développement',
                unite: '% du CA',
                description: 'Ex : 1 pour 1% du CA annuel.',
                defaut: 0.01, affichage: 1, estPourcentage: true,
                step: 0.1, min: 0, max: 20
            },
        ]
    },
    {
        titre: 'Volumes & Croissance',
        hypotheses: [
            {
                cle: 'volume_initial',
                label: 'Volume initial (unités)',
                unite: 'unités',
                description: 'Nombre de produits vendus la 1ère année.',
                defaut: 100, affichage: 100, estPourcentage: false,
                step: 1, min: 0, max: 100000
            },
            {
                cle: 'taux_croissance',
                label: 'Taux de croissance annuel',
                unite: '%',
                description: 'Ex : 25 pour 25%. Croissance des ventes d\'une année à l\'autre.',
                defaut: 0.25, affichage: 25, estPourcentage: true,
                step: 0.5, min: 0, max: 300
            },
            {
                cle: 'taux_encaissement',
                label: "Taux d'encaissement",
                unite: '%',
                description: 'Ex : 95 pour 95%. Part des ventes effectivement encaissées.',
                defaut: 1.0, affichage: 100, estPourcentage: true,
                step: 1, min: 0, max: 100
            },
        ]
    },
    {
        titre: 'Financement',
        hypotheses: [
            {
                cle: 'fonds_propres',
                label: 'Part fonds propres',
                unite: '%',
                description: 'Ex : 30 pour 30%. Fonds propres + Emprunt doivent totaliser 100%.',
                defaut: 0.20, affichage: 20, estPourcentage: true,
                step: 1, min: 0, max: 100
            },
            {
                cle: 'emprunts',
                label: "Part emprunt bancaire",
                unite: '%',
                description: 'Ex : 70 pour 70%. Fonds propres + Emprunt doivent totaliser 100%.',
                defaut: 0.80, affichage: 80, estPourcentage: true,
                step: 1, min: 0, max: 100
            },
            {
                cle: 'duree_remb',
                label: 'Durée de remboursement',
                unite: 'ans',
                description: 'Durée totale du prêt en années.',
                defaut: 5, affichage: 5, estPourcentage: false,
                step: 1, min: 1, max: 30
            },
            {
                cle: 'taux_interet',
                label: "Taux d'intérêt emprunt",
                unite: '%',
                description: 'Ex : 9 pour 9%. Taux annuel du prêt bancaire.',
                defaut: 0.10, affichage: 10, estPourcentage: true,
                step: 0.1, min: 0, max: 30
            },
            {
                cle: 'wacc',
                label: 'WACC',
                unite: '%',
                description: 'Ex : 11 pour 11%. Coût moyen pondéré du capital.',
                defaut: 0.10, affichage: 10, estPourcentage: true,
                step: 0.1, min: 0, max: 50
            },
        ]
    },
    {
        titre: 'Conditions client (crédit)',
        hypotheses: [
            {
                cle: 'frais_dossier',
                label: 'Frais de dossier client',
                unite: '% du crédit',
                description: 'Ex : 1 pour 1% appliqué sur le montant du crédit client.',
                defaut: 0.01, affichage: 1, estPourcentage: true,
                step: 0.1, min: 0, max: 10
            },
            {
                cle: 'assurance_pret',
                label: 'Assurance sur prêt client',
                unite: '% du crédit',
                description: 'Ex : 1.5 pour 1.5%. Taux d\'assurance du crédit client.',
                defaut: 0.015, affichage: 1.5, estPourcentage: true,
                step: 0.1, min: 0, max: 10
            },
            {
                cle: 'taux_credit_client',
                label: "Taux d'intérêt client",
                unite: '%',
                description: 'Ex : 7.5 pour 7.5%. Taux appliqué au crédit accordé au client.',
                defaut: 0.075, affichage: 7.5, estPourcentage: true,
                step: 0.1, min: 0, max: 30
            },
            {
                cle: 'droits_enreg',
                label: "Droits d'enregistrement",
                unite: 'FCFA',
                description: 'Montant forfaitaire en FCFA (ex : 200000).',
                defaut: 200000, affichage: 200000, estPourcentage: false,
                step: 1000, min: 0, max: 10000000
            },
        ]
    },
]

// Convertit la valeur affichée → valeur stockée en DB
const toDb    = (v: number, estPourcentage: boolean) => estPourcentage ? v / 100 : v
// Convertit la valeur DB → valeur affichée
const toAff   = (v: number, estPourcentage: boolean) => estPourcentage ? Math.round(v * 10000) / 100 : v

const inputStyle: React.CSSProperties = {
    padding: '8px 12px', fontSize: '13px',
    border: '1px solid #E5E7EB', borderRadius: '8px',
    backgroundColor: '#fff', outline: 'none',
    fontFamily: 'inherit', color: '#111827', textAlign: 'right',
    width: '110px',
}

export default function SectionHypotheses({ projetId, onSave }: Props) {
    // valeurs stockées telles qu'affichées (ex: 27 pour 27%)
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
            // Les valeurs en DB sont en décimal → on les convertit pour l'affichage
            const map: Record<string, number> = {}
            STRUCTURE.forEach(s => s.hypotheses.forEach(h => {
                const row = data.find(d => d.cle === h.cle)
                map[h.cle] = row ? toAff(row.valeur, h.estPourcentage) : h.affichage
            }))
            setValeurs(map)
        } else {
            // Pas de données → valeurs par défaut affichées
            const defaults: Record<string, number> = {}
            STRUCTURE.forEach(s => s.hypotheses.forEach(h => { defaults[h.cle] = h.affichage }))
            setValeurs(defaults)
        }
    }

    const handleChange = (cle: string, valeur: number) => {
        setValeurs(prev => ({ ...prev, [cle]: valeur }))
    }

    const handleSave = async () => {
        setSaving(true)

        // Supprimer et réinsérer avec conversion affichage → DB
        await supabase.from('hypotheses').delete().eq('projet_id', projetId)

        const toInsert = STRUCTURE.flatMap(s =>
            s.hypotheses.map(h => ({
                projet_id:   projetId,
                cle:         h.cle,
                // Conversion : si % → diviser par 100 avant stockage
                valeur:      toDb(valeurs[h.cle] ?? h.affichage, h.estPourcentage),
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

    // Vérification financement : fonds propres + emprunts doivent = 100
    const fp   = valeurs['fonds_propres'] || 0
    const emp  = valeurs['emprunts'] || 0
    const somme = Math.round((fp + emp) * 10) / 10
    const financementOk = Math.abs(somme - 100) < 0.1

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
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', paddingLeft: '44px' }}>
                Saisissez les pourcentages directement en % (ex : tapez <strong>27</strong> pour 27%).
            </p>

            {/* Bandeau d'aide */}
            <div style={{
                backgroundColor: '#E6F1FB', border: '1px solid #B5D4F4',
                borderRadius: '10px', padding: '10px 16px', marginBottom: '20px',
                fontSize: '13px', color: '#185FA5', display: 'flex', gap: '8px', alignItems: 'flex-start'
            }}>

                <span>
                    Les champs en <strong>%</strong> acceptent des valeurs entre 0 et 100 (ou plus pour les marges).
                    Le système convertit automatiquement pour les calculs. Exemple : <strong>27</strong> → 27% d'IS.
                </span>
            </div>

            {/* Alerte financement */}
            {(fp > 0 || emp > 0) && !financementOk && (
                <div style={{
                    backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: '10px', padding: '10px 16px', marginBottom: '20px',
                    fontSize: '13px', color: '#E24B4A'
                }}>
                     Fonds propres ({fp}%) + Emprunt ({emp}%) = {somme}% — la somme doit être égale à 100%
                </div>
            )}

            {financementOk && (fp > 0 || emp > 0) && (
                <div style={{
                    backgroundColor: '#E1F5EE', border: '1px solid #A7F3D0',
                    borderRadius: '10px', padding: '10px 16px', marginBottom: '20px',
                    fontSize: '13px', color: '#0F6E56'
                }}>
                    ✓ Fonds propres ({fp}%) + Emprunt ({emp}%) = 100%
                </div>
            )}

            {/* Sections hypothèses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {STRUCTURE.map(section => (
                    <div key={section.titre} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '18px' }}>
                        <p style={{
                            fontSize: '13px', fontWeight: 600, color: '#0D2B55',
                            margin: '0 0 14px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB'
                        }}>
                            {section.titre}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {section.hypotheses.map(h => {
                                const val = valeurs[h.cle] ?? h.affichage
                                return (
                                    <div key={h.cle} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Label + description */}
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '13px', fontWeight: 500, color: '#374151', margin: '0 0 2px' }}>
                                                {h.label}
                                            </p>
                                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                                                {h.description}
                                            </p>
                                        </div>

                                        {/* Champ de saisie + unité */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                            <input
                                                type="number"
                                                step={h.step}
                                                min={h.min}
                                                max={h.max}
                                                value={val}
                                                onChange={e => handleChange(h.cle, parseFloat(e.target.value) || 0)}
                                                style={inputStyle}
                                            />
                                            <span style={{
                                                fontSize: '12px',
                                                color: h.estPourcentage ? '#169B86' : '#9CA3AF',
                                                fontWeight: h.estPourcentage ? 600 : 400,
                                                minWidth: '60px'
                                            }}>
                                                {h.unite}
                                            </span>
                                        </div>

                                    </div>
                                )
                            })}
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