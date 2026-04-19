'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/superbase/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
    projetId: string
}

interface ResultatAnnee {
    annee: number
    ca_total: number
    cout_revient: number
    marge_brute: number
    ebitda: number
    ebit: number
    resultat_net: number
    tresorerie: number
}

const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))
const formatM   = (n: number) => `${(n / 1_000_000).toFixed(1)} M`

// ── Calcul TRI par dichotomie ──────────────────────────────────────────────
function calculerTRI(fluxNets: number[]): number {
    // fluxNets[0] = investissement initial (négatif), suite = flux annuels
    const van = (taux: number) =>
        fluxNets.reduce((sum, f, i) => sum + f / Math.pow(1 + taux, i), 0)

    let lo = -0.5, hi = 10.0
    // Vérifier que le TRI existe
    if (van(lo) * van(hi) > 0) return 0

    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2
        if (Math.abs(hi - lo) < 0.0001) return Math.round(mid * 10000) / 100
        if (van(mid) * van(lo) < 0) hi = mid
        else lo = mid
    }
    return Math.round(((lo + hi) / 2) * 10000) / 100
}

// ── Calcul VAN ────────────────────────────────────────────────────────────
function calculerVAN(fluxNets: number[], wacc: number): number {
    return fluxNets.reduce((sum, f, i) => sum + f / Math.pow(1 + wacc, i), 0)
}

// ── Calcul Payback ────────────────────────────────────────────────────────
function calculerPayback(investissement: number, fluxAnnuels: number[]): string {
    let cumul = -Math.abs(investissement)
    for (let i = 0; i < fluxAnnuels.length; i++) {
        cumul += fluxAnnuels[i]
        if (cumul >= 0) return `${i + 1} an${i > 0 ? 's' : ''}`
    }
    return '> durée projet'
}

export default function SectionDashboard({ projetId }: Props) {
    const [resultats, setResultats]         = useState<ResultatAnnee[]>([])
    const [hyps, setHyps]                   = useState<Record<string, number>>({})
    const [totalCapex, setTotalCapex]       = useState(0)
    const [loading, setLoading]             = useState(true)
    const [exportLoading, setExportLoading] = useState<'word' | 'pptx' | null>(null)
    const supabase = createClient()

    useEffect(() => { fetchData() }, [projetId])

    const fetchData = async () => {
        setLoading(true)
        const [{ data: ress }, { data: hypData }, { data: capexData }] = await Promise.all([
            supabase.from('resultats_financiers').select('*').eq('projet_id', projetId).order('annee'),
            supabase.from('hypotheses').select('*').eq('projet_id', projetId),
            supabase.from('capex').select('*').eq('projet_id', projetId),
        ])

        if (ress) {
            const unique = new Map<number, typeof ress[0]>()
            ress.forEach(r => unique.set(r.annee, r))
            setResultats(Array.from(unique.values()).sort((a, b) => a.annee - b.annee))
        }
        if (hypData) {
            const map: Record<string, number> = {}
            hypData.forEach(h => { map[h.cle] = h.valeur })
            setHyps(map)
        }
        if (capexData) {
            setTotalCapex(capexData.reduce((s, c) => s + c.montant, 0))
        }
        setLoading(false)
    }

    const wacc        = hyps['wacc'] || 0.1
    const croissance  = (hyps['taux_croissance'] || 0) * 100
    const premierRes  = resultats[0]
    const dernierRes  = resultats[resultats.length - 1]
    const totalCA     = resultats.reduce((s, r) => s + r.ca_total, 0)
    const totalResNet = resultats.reduce((s, r) => s + r.resultat_net, 0)

    // Flux pour TRI et VAN : -CAPEX initial + flux de trésorerie annuels
    const fluxNets = [-totalCapex, ...resultats.map(r => r.tresorerie)]
    const tri      = totalCapex > 0 ? calculerTRI(fluxNets) : 0
    const van      = calculerVAN(fluxNets, wacc)
    const payback  = calculerPayback(totalCapex, resultats.map(r => r.tresorerie))

    const margeBrute = premierRes && premierRes.ca_total > 0
        ? premierRes.marge_brute / premierRes.ca_total * 100 : 0
    const margeNette = dernierRes && dernierRes.ca_total > 0
        ? dernierRes.resultat_net / dernierRes.ca_total * 100 : 0

    // Seuil de rentabilité = Charges fixes / Taux marge sur coûts variables
    const chargesFixes = premierRes ? premierRes.ebitda - premierRes.marge_brute + premierRes.ca_total * 0 : 0
    const seuilRent    = premierRes && premierRes.ca_total > 0
        ? (premierRes.ca_total - premierRes.marge_brute) / premierRes.ca_total * premierRes.ca_total : 0

    const kpis = [
        { label: 'TRI',                value: `${tri.toFixed(1)}%`,         sub: 'Taux rentabilité interne', color: tri > 15 ? '#169B86' : tri > 5 ? '#F0A02B' : '#E24B4A' },
        { label: 'VAN',                value: `${formatM(van)}`,             sub: 'FCFA au WACC ' + Math.round(wacc * 100) + '%', color: van > 0 ? '#0D2B55' : '#E24B4A' },
        { label: 'Marge brute (An 1)', value: `${margeBrute.toFixed(1)}%`,  sub: 'Sur le chiffre d\'affaires', color: '#0D2B55' },
        { label: 'Marge nette (fin)',  value: `${margeNette.toFixed(1)}%`,  sub: 'Dernière année projet', color: margeNette > 0 ? '#169B86' : '#E24B4A' },
        { label: 'CA total projet',    value: `${formatM(totalCA)}`,         sub: 'FCFA cumulé', color: '#0D2B55' },
        { label: 'Résultat net cumulé',value: `${formatM(totalResNet)}`,     sub: 'FCFA sur le projet', color: totalResNet > 0 ? '#169B86' : '#E24B4A' },
        { label: 'Payback',            value: payback,                        sub: 'Délai de récupération', color: '#F0A02B' },
        { label: 'Croissance/an',      value: `${croissance.toFixed(0)}%`,  sub: 'Taux de croissance annuel', color: '#0D2B55' },
    ]

    const chartData = resultats.map(r => ({
        annee:    r.annee.toString(),
        CA:       Math.round(r.ca_total / 1_000_000),
        Résultat: Math.round(r.resultat_net / 1_000_000),
    }))

    const handleExport = async (type: 'word' | 'pptx') => {
        setExportLoading(type)
        try {
            const resp = await fetch(`/api/export/${type}?projetId=${projetId}`)
            if (!resp.ok) throw new Error('Erreur export')
            const blob = await resp.blob()
            const link = document.createElement('a')
            link.href  = URL.createObjectURL(blob)
            link.download = type === 'word'
                ? `BusinessModel_${new Date().toISOString().split('T')[0]}.docx`
                : `Synthese_${new Date().toISOString().split('T')[0]}.pptx`
            link.click()
            URL.revokeObjectURL(link.href)
        } catch (e) { console.error('Export error:', e) }
        setExportLoading(null)
    }

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF', fontSize: '14px' }}>
            Chargement du dashboard...
        </div>
    )

    if (resultats.length === 0) return (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', margin: '0 0 8px' }}>
                Aucune donnée financière disponible
            </p>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
                Complétez les sections précédentes puis cliquez sur Sauvegarder dans les Prévisions financières.
            </p>
        </div>
    )

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: '#F0A02B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>13</div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>KPIs & Dashboard</h2>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleExport('word')} disabled={exportLoading !== null}
                            style={{
                                padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                                color: '#185FA5', backgroundColor: '#E6F1FB',
                                border: '1px solid #185FA5', borderRadius: '10px',
                                cursor: exportLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', opacity: exportLoading ? 0.6 : 1
                            }}>
                        {exportLoading === 'word' ? '⏳ Génération...' : '📄 Générer Word'}
                    </button>
                    <button onClick={() => handleExport('pptx')} disabled={exportLoading !== null}
                            style={{
                                padding: '8px 18px', fontSize: '13px', fontWeight: 500,
                                color: '#854F0B', backgroundColor: '#FFF3DC',
                                border: '1px solid #F0A02B', borderRadius: '10px',
                                cursor: exportLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', opacity: exportLoading ? 0.6 : 1
                            }}>
                        {exportLoading === 'pptx' ? '⏳ Génération...' : '📊 Obtenir une Présentation'}
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {kpis.map(k => (
                    <div key={k.label} style={{
                        backgroundColor: '#F9FAFB', borderRadius: '12px',
                        border: '1px solid #E5E7EB', padding: '16px'
                    }}>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 6px' }}>{k.label}</p>
                        <p style={{ fontSize: '22px', fontWeight: 700, color: k.color, margin: '0 0 2px' }}>{k.value}</p>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Graphe + tableau */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '18px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>
                        Évolution CA & Résultat net (M FCFA)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} barGap={4}>
                            <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v} M FCFA`} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="CA"       fill="#169B86" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Résultat" fill="#F0A02B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '18px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 14px' }}>
                        Synthèse financière
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#E5E7EB' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 500, color: '#374151' }}>Indicateur</th>
                            <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 500, color: '#374151' }}>An 1</th>
                            <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 500, color: '#374151' }}>An {resultats.length}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {[
                            { label: 'CA (M FCFA)',   an1: premierRes?.ca_total,    ann: dernierRes?.ca_total },
                            { label: 'Marge brute',   an1: premierRes ? premierRes.marge_brute / premierRes.ca_total * 100 : 0, ann: dernierRes ? dernierRes.marge_brute / dernierRes.ca_total * 100 : 0, pct: true },
                            { label: 'Résultat net',  an1: premierRes?.resultat_net, ann: dernierRes?.resultat_net },
                            { label: 'Trésorerie',    an1: premierRes?.tresorerie,   ann: dernierRes?.tresorerie },
                        ].map((r, i) => (
                            <tr key={r.label} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                                <td style={{ padding: '8px 10px', color: '#374151' }}>{r.label}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500, color: '#374151' }}>
                                    {r.pct ? `${(r.an1 || 0).toFixed(1)}%` : formatM(r.an1 || 0)}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#169B86' }}>
                                    {r.pct ? `${(r.ann || 0).toFixed(1)}%` : formatM(r.ann || 0)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}