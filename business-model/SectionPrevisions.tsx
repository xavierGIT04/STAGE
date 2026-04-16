'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/superbase/client'

interface Props {
    projetId: string
    onSave: () => void
}

const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

interface ResultatAnnee {
    annee: number
    ca: number
    cout_revient: number
    marge_brute: number
    charges_fixes: number
    ebitda: number
    amortissement: number
    ebit: number
    frais_financiers: number
    ebt: number
    impots: number
    resultat_net: number
    tresorerie: number
}

// Calcule le remboursement du capital et les intérêts par année pour un emprunt
// Méthode : amortissement constant (annuité constante sur le capital)
function calcInteretsParAnnee(
    capital: number,
    taux: number,
    duree: number,
    anneeIndex: number // 0-based
): number {
    if (capital <= 0 || taux <= 0 || duree <= 0) return 0
    // Capital restant dû au début de l'année n = capital × (1 - n/duree)
    const capitalRestant = capital * Math.max(0, 1 - anneeIndex / duree)
    return capitalRestant * taux
}

export default function SectionPrevisions({ projetId, onSave }: Props) {
    const [resultats, setResultats] = useState<ResultatAnnee[]>([])
    const [loading, setLoading]     = useState(true)
    const [saving, setSaving]       = useState(false)
    const [saved, setSaved]         = useState(false)
    const [onglet, setOnglet]       = useState<'compte_resultat' | 'tresorerie' | 'ratios'>('compte_resultat')
    const calculEnCours = useRef(false)
    const supabase = createClient()

    useEffect(() => {
        calculer()
    }, [projetId])

    const calculer = async () => {
        if (calculEnCours.current) return
        calculEnCours.current = true
        setLoading(true)

        const [
            { data: proj },
            { data: hyps },
            { data: revs },
            { data: capexData },
            { data: opexData },
            { data: partenaires },
        ] = await Promise.all([
            supabase.from('projets').select('*').eq('id', projetId).single(),
            supabase.from('hypotheses').select('*').eq('projet_id', projetId),
            supabase.from('revenus').select('*').eq('projet_id', projetId),
            supabase.from('capex').select('*').eq('projet_id', projetId),
            supabase.from('opex').select('*').eq('projet_id', projetId),
            supabase.from('partenaires_financiers').select('*').eq('projet_id', projetId),
        ])

        if (!proj || !hyps) {
            setLoading(false)
            calculEnCours.current = false
            return
        }

        // Les valeurs en DB sont TOUTES en décimal pour les % (ex: 0.27 pour 27%)
        // car SectionHypotheses fait la conversion avant la sauvegarde
        const hyp = (cle: string, defaut = 0) => hyps.find(h => h.cle === cle)?.valeur ?? defaut

        const taux_is            = hyp('taux_is', 0.27)           // ex: 0.27
        const taux_is_min        = hyp('taux_is_min', 0.01)        // ex: 0.01 → 1% du CA
        const marge_beneficiaire = hyp('marge_beneficiaire', 0.204) // ex: 0.204
        const frais_coord        = hyp('frais_coordination', 0.01)  // ex: 0.01
        const frais_marketing    = hyp('frais_marketing', 0.02)
        const frais_rd           = hyp('frais_rd', 0.01)

        const annee_debut = proj.annee_demarrage || 2026
        const duree       = proj.duree_projet || 5
        const annees      = Array.from({ length: duree }, (_, i) => annee_debut + i)

        // Amortissement CAPEX annuel (somme de tous les postes)
        const amort_annuel = (capexData || []).reduce((s, c) => s + c.montant * c.taux_amortissement, 0)

        // OPEX fixes annuelles
        const opex_fixe = (opexData || [])
            .filter(o => o.type_calcul === 'fixe')
            .reduce((s, o) => s + o.valeur, 0)

        // Emprunts : liste pour calcul dégressif
        const emprunts = (partenaires || []).filter(p => p.type_financement === 'emprunt')

        const resultatsCalc: ResultatAnnee[] = annees.map((annee, idx) => {
            // CA de l'année
            const ca = (revs || [])
                .filter(r => r.annee === annee)
                .reduce((s, r) => s + r.volume * r.prix_unitaire_ht, 0)

            // Coût de revient : CA / (1 + marge_beneficiaire)
            const cout_revient = ca / (1 + marge_beneficiaire)

            // Marge brute
            const marge_brute = ca - cout_revient

            // Charges variables issues des hypothèses (% du CA)
            const charges_var = ca * (frais_coord + frais_marketing + frais_rd)

            // OPEX variables (% du CA saisis dans Section Coûts)
            const opex_pct = (opexData || [])
                .filter(o => o.type_calcul === 'pourcentage')
                .reduce((s, o) => s + ca * o.valeur, 0)

            // Charges d'exploitation totales
            const charges_fixes = opex_fixe + charges_var + opex_pct

            // EBITDA
            const ebitda = marge_brute - charges_fixes

            // EBIT
            const ebit = ebitda - amort_annuel

            // ✅ Frais financiers DÉGRESSIFS : chaque emprunt voit son capital diminuer
            const frais_financiers = emprunts.reduce((s, p) =>
                s + calcInteretsParAnnee(p.montant, p.taux_interet, p.duree_annees, idx), 0
            )

            // EBT
            const ebt = ebit - frais_financiers

            // ✅ Impôt corrigé : max(IS normal, impôt minimum forfaitaire sur le CA)
            const is_normal  = ebt > 0 ? ebt * taux_is : 0
            const is_minimum = ca * taux_is_min
            const impots     = Math.max(is_normal, is_minimum)

            // Résultat net
            const resultat_net = ebt - impots

            // Capacité d'autofinancement
            const tresorerie = resultat_net + amort_annuel

            return {
                annee, ca, cout_revient, marge_brute,
                charges_fixes, ebitda, amortissement: amort_annuel,
                ebit, frais_financiers, ebt, impots, resultat_net, tresorerie,
            }
        })

        setResultats(resultatsCalc)

        // Sauvegarde dans resultats_financiers
        const { error: deleteError } = await supabase
            .from('resultats_financiers')
            .delete()
            .eq('projet_id', projetId)

        if (!deleteError) {
            await supabase.from('resultats_financiers').insert(
                resultatsCalc.map(r => ({
                    projet_id:    projetId,
                    annee:        r.annee,
                    ca_total:     r.ca,
                    cout_revient: r.cout_revient,
                    marge_brute:  r.marge_brute,
                    ebitda:       r.ebitda,
                    ebit:         r.ebit,
                    resultat_net: r.resultat_net,
                    tresorerie:   r.tresorerie,
                }))
            )
        }

        setLoading(false)
        calculEnCours.current = false
    }

    const handleSave = async () => {
        setSaving(true)
        await calculer()
        setSaving(false)
        setSaved(true)
        onSave()
        setTimeout(() => setSaved(false), 2000)
    }

    const lignes = [
        { label: "Chiffre d'Affaires",     key: 'ca',              bold: true,  color: '#0D2B55' },
        { label: 'Coût de revient',        key: 'cout_revient',    bold: false, color: '#E24B4A' },
        { label: 'Marge brute',            key: 'marge_brute',     bold: true,  color: '#169B86' },
        { label: "Charges d'exploitation", key: 'charges_fixes',   bold: false, color: '#E24B4A' },
        { label: 'EBITDA',                 key: 'ebitda',          bold: true,  color: '#0D2B55' },
        { label: 'Amortissements',         key: 'amortissement',   bold: false, color: '#9CA3AF' },
        { label: 'EBIT',                   key: 'ebit',            bold: true,  color: '#0D2B55' },
        { label: 'Frais financiers',       key: 'frais_financiers',bold: false, color: '#E24B4A' },
        { label: 'Résultat avant impôts',  key: 'ebt',             bold: false, color: '#374151' },
        { label: 'Impôts',                 key: 'impots',          bold: false, color: '#E24B4A' },
        { label: 'Résultat net',           key: 'resultat_net',    bold: true,  color: '#169B86' },
    ]

    const ratioLignes = resultats.map(r => ({
        annee:           r.annee,
        marge_brute_pct: r.ca > 0 ? (r.marge_brute / r.ca * 100) : 0,
        marge_nette_pct: r.ca > 0 ? (r.resultat_net / r.ca * 100) : 0,
        ebitda_pct:      r.ca > 0 ? (r.ebitda / r.ca * 100) : 0,
    }))

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#F0A02B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>9</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Prévisions financières
                </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', paddingLeft: '44px' }}>
                États financiers calculés automatiquement. Les frais financiers sont dégressifs (capital amorti chaque année).
            </p>

            {/* Bouton recalculer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                    onClick={calculer}
                    disabled={loading}
                    style={{
                        padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                        color: '#0D2B55', backgroundColor: '#E6F1FB',
                        border: '1px solid #0D2B55', borderRadius: '10px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', opacity: loading ? 0.6 : 1
                    }}>
                    {loading ? '⏳ Calcul...' : '🔄 Recalculer'}
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>
                    Calcul en cours...
                </div>
            ) : (
                <>
                    {/* Onglets */}
                    <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
                        {[
                            { key: 'compte_resultat', label: 'Compte de résultat' },
                            { key: 'tresorerie',      label: 'Flux de trésorerie' },
                            { key: 'ratios',          label: 'Ratios de performance' },
                        ].map(o => (
                            <button key={o.key}
                                    onClick={() => setOnglet(o.key as typeof onglet)}
                                    style={{
                                        padding: '10px 20px', fontSize: '13px', fontWeight: 500,
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        color: onglet === o.key ? '#0D2B55' : '#6B7280',
                                        borderBottom: onglet === o.key ? '2px solid #F0A02B' : '2px solid transparent',
                                        marginBottom: '-1px',
                                    }}>
                                {o.label}
                            </button>
                        ))}
                    </div>

                    {/* Compte de résultat */}
                    {onglet === 'compte_resultat' && (
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#0D2B55' }}>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px', width: '220px' }}>
                                        Indicateur (FCFA)
                                    </th>
                                    {resultats.map(r => (
                                        <th key={r.annee} style={{ padding: '10px 14px', textAlign: 'right', color: '#fff', fontWeight: 500, fontSize: '12px' }}>
                                            {r.annee}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {lignes.map(l => (
                                    <tr key={l.key} style={{ backgroundColor: l.bold ? '#F9FAFB' : '#fff', borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{
                                            padding: '10px 16px', fontSize: '12px',
                                            fontWeight: l.bold ? 600 : 400, color: '#374151',
                                            borderLeft: l.bold ? '3px solid #F0A02B' : '3px solid transparent',
                                        }}>
                                            {l.label}
                                        </td>
                                        {resultats.map(r => {
                                            const val = r[l.key as keyof ResultatAnnee] as number
                                            return (
                                                <td key={r.annee} style={{
                                                    padding: '10px 14px', textAlign: 'right',
                                                    fontWeight: l.bold ? 700 : 400,
                                                    color: val < 0 ? '#E24B4A' : l.color,
                                                    fontSize: '12px',
                                                }}>
                                                    {val < 0 ? `(${formatNum(Math.abs(val))})` : formatNum(val)}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Flux de trésorerie */}
                    {onglet === 'tresorerie' && (
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#0D2B55' }}>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px', width: '220px' }}>
                                        Flux (FCFA)
                                    </th>
                                    {resultats.map(r => (
                                        <th key={r.annee} style={{ padding: '10px 14px', textAlign: 'right', color: '#fff', fontWeight: 500, fontSize: '12px' }}>
                                            {r.annee}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {[
                                    { label: 'Résultat net',               key: 'resultat_net',  bold: false },
                                    { label: 'Amortissements (+)',          key: 'amortissement', bold: false },
                                    { label: "Capacité d'autofinancement", key: 'tresorerie',    bold: true  },
                                ].map(l => (
                                    <tr key={l.key} style={{ backgroundColor: l.bold ? '#F9FAFB' : '#fff', borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{
                                            padding: '10px 16px', fontSize: '12px',
                                            fontWeight: l.bold ? 600 : 400, color: '#374151',
                                            borderLeft: l.bold ? '3px solid #169B86' : '3px solid transparent',
                                        }}>
                                            {l.label}
                                        </td>
                                        {resultats.map(r => {
                                            const val = r[l.key as keyof ResultatAnnee] as number
                                            return (
                                                <td key={r.annee} style={{
                                                    padding: '10px 14px', textAlign: 'right',
                                                    fontWeight: l.bold ? 700 : 400,
                                                    color: val < 0 ? '#E24B4A' : l.bold ? '#169B86' : '#374151',
                                                    fontSize: '12px',
                                                }}>
                                                    {formatNum(val)}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Ratios */}
                    {onglet === 'ratios' && (
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#0D2B55' }}>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: '12px', width: '220px' }}>
                                        Ratio
                                    </th>
                                    {resultats.map(r => (
                                        <th key={r.annee} style={{ padding: '10px 14px', textAlign: 'right', color: '#fff', fontWeight: 500, fontSize: '12px' }}>
                                            {r.annee}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {[
                                    { label: 'Marge brute',  key: 'marge_brute_pct' },
                                    { label: 'Marge EBITDA', key: 'ebitda_pct'      },
                                    { label: 'Marge nette',  key: 'marge_nette_pct' },
                                ].map((l, i) => (
                                    <tr key={l.key} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 500, color: '#374151' }}>
                                            {l.label}
                                        </td>
                                        {ratioLignes.map(r => {
                                            const val = r[l.key as keyof typeof r] as number
                                            return (
                                                <td key={r.annee} style={{
                                                    padding: '10px 14px', textAlign: 'right',
                                                    fontWeight: 600, fontSize: '12px',
                                                    color: val < 0 ? '#E24B4A' : val > 15 ? '#169B86' : '#F0A02B',
                                                }}>
                                                    {val.toFixed(1)}%
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                {saved && <span style={{ fontSize: '13px', color: '#169B86', alignSelf: 'center' }}>✓ Sauvegardé</span>}
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    style={{
                        padding: '10px 24px', fontSize: '13px', fontWeight: 600,
                        color: '#fff', backgroundColor: saving ? '#D1D5DB' : '#F0A02B',
                        border: 'none', borderRadius: '10px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit'
                    }}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
            </div>
        </div>
    )
}