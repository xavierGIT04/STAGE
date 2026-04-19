import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/superbase/server'
import pptxgen from 'pptxgenjs'
import * as fs from 'fs'
import * as path from 'path'

const ORANGE = "F0A02B"
const TEAL   = "169B86"
const NAVY   = "0D2B55"
const WHITE  = "FFFFFF"
const LGRAY  = "F5F5F5"

const formatM   = (n: number) => `${(n / 1_000_000).toFixed(1)} M`
const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

function calculerTRI(fluxNets: number[]): number {
    const van = (taux: number) =>
        fluxNets.reduce((sum, f, i) => sum + f / Math.pow(1 + taux, i), 0)
    let lo = -0.5, hi = 10.0
    if (van(lo) * van(hi) > 0) return 0
    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2
        if (Math.abs(hi - lo) < 0.0001) return Math.round(mid * 10000) / 100
        if (van(mid) * van(lo) < 0) hi = mid
        else lo = mid
    }
    return Math.round(((lo + hi) / 2) * 10000) / 100
}

function getLogo(): { base64: string; ext: string } | null {
    const exts = ['png', 'jpg', 'jpeg']
    for (const ext of exts) {
        const p = path.join(process.cwd(), 'public', `kya_logo_light.${ext}`)
        if (fs.existsSync(p)) {
            return { base64: fs.readFileSync(p).toString('base64'), ext: ext === 'jpg' ? 'jpeg' : ext }
        }
    }
    return null
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const projetId = searchParams.get('projetId')
    if (!projetId) return NextResponse.json({ error: 'projetId requis' }, { status: 400 })

    const supabase = await createClient()
    const [
        { data: projet },    { data: profil },
        { data: hyps },      { data: resultats },
        { data: partenairesF }, { data: partenairesTech },
        { data: capex },     { data: opex },
        { data: risques },   { data: impacts },
        { data: concurrents }, { data: produits },
        { data: revenus },
    ] = await Promise.all([
        supabase.from('projets').select('*').eq('id', projetId).single(),
        supabase.from('entreprise_profil').select('*').eq('projet_id', projetId).single(),
        supabase.from('hypotheses').select('*').eq('projet_id', projetId),
        supabase.from('resultats_financiers').select('*').eq('projet_id', projetId).order('annee'),
        supabase.from('partenaires_financiers').select('*').eq('projet_id', projetId),
        supabase.from('partenaires_techniques').select('*').eq('projet_id', projetId),
        supabase.from('capex').select('*').eq('projet_id', projetId),
        supabase.from('opex').select('*').eq('projet_id', projetId),
        supabase.from('risques_projet').select('*').eq('projet_id', projetId),
        supabase.from('impacts_projet').select('*').eq('projet_id', projetId),
        supabase.from('concurrents').select('*').eq('projet_id', projetId),
        supabase.from('produits').select('*').eq('projet_id', projetId),
        supabase.from('revenus').select('*').eq('projet_id', projetId),
    ])

    if (!projet) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

    const hyp = (cle: string, defaut = 0) => hyps?.find(h => h.cle === cle)?.valeur ?? defaut

    // ── Données calculées ─────────────────────────────────────────────────────
    const premierRes   = resultats?.[0]
    const dernierRes   = resultats?.[resultats.length - 1]
    const totalCA      = (resultats || []).reduce((s, r) => s + r.ca_total, 0)
    const totalResNet  = (resultats || []).reduce((s, r) => s + r.resultat_net, 0)
    const totalCapex   = (capex || []).reduce((s, c) => s + c.montant, 0)
    const totalOpexFixe = (opex || []).filter(o => o.type_calcul === 'fixe').reduce((s, o) => s + o.valeur, 0)
    const wacc         = hyp('wacc', 0.1)
    const croissance   = hyp('taux_croissance', 0.25) * 100
    const marge        = hyp('marge_beneficiaire', 0.204) * 100
    const fp           = hyp('fonds_propres', 0.2) * 100
    const empPct       = hyp('emprunts', 0.8) * 100
    const totalFinancement = (partenairesF || []).reduce((s, p) => s + p.montant, 0)
    const totalFP      = (partenairesF || []).filter(p => p.type_financement === 'fonds_propres').reduce((s, p) => s + p.montant, 0)

    const anneeDebut   = projet.annee_demarrage || 2026
    const duree        = projet.duree_projet || 5
    const anneesFin    = anneeDebut + duree - 1

    // Total unités vendues (depuis revenus)
    const totalUnites  = (revenus || []).reduce((s, r) => s + r.volume, 0)
    const prixUnitaire = premierRes && premierRes.ca_total > 0
        ? premierRes.ca_total / ((revenus || []).filter(r => r.annee === anneeDebut).reduce((s, r) => s + r.volume, 0) || 1)
        : 0

    const fluxNets  = [-totalCapex, ...(resultats || []).map(r => r.tresorerie)]
    const tri       = totalCapex > 0 ? calculerTRI(fluxNets) : 0
    const van       = fluxNets.reduce((sum, f, i) => sum + f / Math.pow(1 + wacc, i), 0)

    const margeBrute = premierRes && premierRes.ca_total > 0
        ? premierRes.marge_brute / premierRes.ca_total * 100 : 0

    // Seuil de rentabilité
    const seuilRent = premierRes
        ? (premierRes.ca_total - premierRes.marge_brute + totalOpexFixe + totalCapex * 0.1)
        : 0

    const logo = getLogo()

    // ══════════════════════════════════════════════════════════════════════════
    // CRÉATION DU FICHIER PPTX
    // ══════════════════════════════════════════════════════════════════════════
    const pres = new pptxgen()
    pres.layout = 'LAYOUT_16x9'
    pres.title  = projet.nom || 'Business Model'

    // Helper pour en-têtes et footers communs
    const addHeaderFooter = (slide: ReturnType<typeof pres.addSlide>, slideNum: number) => {
        // Bande orange haut
        slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.07, fill: { color: ORANGE }, line: { color: ORANGE } })
        // Header teal
        slide.addShape(pres.ShapeType.rect, { x: 0,
            y: 0.08,
            w: '100%',
            h: 1.1,
            fill: { color: '008080' }, // Couleur TEAL
            line: { color: '008080' } })
        // Logo
        if (logo) {
            slide.addImage({ data: `data:image/${logo.ext};base64,${logo.base64}`, x: 0.15, y: 0.1, w: 0.7, h: 0.7 })
        }
        // Nom projet
        slide.addText(projet?.nom || 'Business Model', {
            x: 1.0, y: 0.1, w: 5.5, h: 0.42,
            fontSize: 17, bold: true, color: WHITE, fontFace: 'Arial'
        })
        // Infos
        slide.addText(`${projet?.numero_projet || ''}  ·  ${profil?.nom_entreprise || 'KYA-Energy Group'}  ·  Lancement : ${anneeDebut}  ·  Lomé, Togo  ·  ${profil?.certifications || 'ISO 9001:2015'}`, {
            x: 1.0, y: 0.54, w: 7.5, h: 0.28,
            fontSize: 7, color: 'D1FAE5', fontFace: 'Arial'
        })
        // Badges
        ;['Désirabilité ✓', 'Faisabilité ✓', 'Viabilité ✓'].forEach((b, i) => {
            slide.addShape(pres.ShapeType.rect, { x: 7.8 + i * 0.74, y: 0.18, w: 0.68, h: 0.22, fill: { color: ORANGE }, line: { color: ORANGE } })
            slide.addText(b, { x: 7.8 + i * 0.74, y: 0.2, w: 0.68, h: 0.18, fontSize: 6, color: WHITE, fontFace: 'Arial', align: 'center' })
        })
        // Numéro de slide
        slide.addText(`${slideNum}/2`, { x: 9.6, y: 0.1, w: 0.35, h: 0.22, fontSize: 7, color: 'D1FAE5', fontFace: 'Arial', align: 'right' })
        // Footer teal
        slide.addShape(pres.ShapeType.rect, { x: 0, y: 5.22, w: '100%', h: 0.405, fill: { color: TEAL }, line: { color: TEAL } })
        if (logo) {
            slide.addImage({ data: `data:image/${logo.ext};base64,${logo.base64}`, x: 0.1, y: 5.24, w: 0.35, h: 0.35 })
        }
        slide.addText(
            `${profil?.nom_entreprise || 'KYA-Energy Group'}  ·  ${profil?.localisation || 'Lomé, Togo'}  ·  Généré le ${new Date().toLocaleDateString('fr-FR')}`,
            { x: 0.55, y: 5.3, w: 9.1, h: 0.2, fontSize: 7, color: WHITE, fontFace: 'Arial', align: 'center' }
        )
        slide.addShape(pres.ShapeType.rect, { x: 0, y: 5.595, w: '100%', h: 0.03, fill: { color: ORANGE }, line: { color: ORANGE } })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SLIDE 1 — BUSINESS MODEL CANVAS
    // ══════════════════════════════════════════════════════════════════════════
    const slide1 = pres.addSlide()
    addHeaderFooter(slide1, 1)

    // Proposition de valeur
    slide1.addShape(pres.ShapeType.rect, { x: 0, y: 0.92, w: '100%', h: 0.38, fill: { color: ORANGE }, line: { color: ORANGE } })
    slide1.addText(`Proposition de Valeur  |  ${profil?.slogan || projet.produit_principal || '—'}`, {
        x: 0.2, y: 0.96, w: 9.6, h: 0.3,
        fontSize: 10, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
    })

    // ── BMC 9 blocs (3×3) ─────────────────────────────────────────────────────
    const allPartenaires = [
        ...(partenairesF || []).map(p => p.nom),
        ...(partenairesTech || []).map(p => p.nom),
    ].slice(0, 4).join(', ') || '—'

    const bmcData = [
        {
            titre: 'Activités clés',
            contenu: (produits || []).map(p => `• ${p.nom}`).join('\n') ||
                '• Conception & assemblage\n• Marketing & vente\n• Installation & maintenance'
        },
        {
            titre: 'Proposition de valeur',
            contenu: (produits || []).map(p => p.proposition_valeur || p.nom).join('\n') ||
                profil?.slogan || projet.produit_principal || '—'
        },
        {
            titre: 'Relations clientèle',
            contenu: 'Assistance technique personnalisée\nSuivi après-vente\nContrats de maintenance\nMonitoring à distance'
        },
        {
            titre: 'Partenaires clés',
            contenu: allPartenaires
        },
        {
            titre: 'Ressources clés',
            contenu: `${profil?.effectif || '30 ingénieurs'}\n${profil?.expertise_cle?.substring(0, 60) || '—'}\n${profil?.certifications || 'ISO 9001:2015'}`
        },
        {
            titre: 'Segments clients',
            contenu: projet.secteur || '—'
        },
        {
            titre: 'Structure de coûts',
            contenu: `CAPEX : ${formatNum(totalCapex)} FCFA\nOPEX An1 : ${formatNum(totalOpexFixe)} FCFA\nTotal projet (${duree} ans) : ${formatM(totalCapex + totalOpexFixe * duree)} FCFA`
        },
        {
            titre: 'Canaux',
            contenu: 'Prospection directe B2B\nRéseau bancaire partenaire\nSalons & événements\nMarketing digital'
        },
        {
            titre: 'Sources de revenus',
            contenu: `Vente : ${formatNum(totalUnites)} unités sur ${duree} ans\nPrix unitaire : ${formatNum(Math.round(prixUnitaire))} FCFA\nCA An1 : ${formatM(premierRes?.ca_total || 0)} FCFA`
        },
    ]

    // Disposition : Partenaires | Activités+Ressources | Valeur | Relations | Segments
    const bmcLayout = [
        { i: 3, x: 0.08, y: 1.38, w: 1.68, h: 2.2 },  // Partenaires clés
        { i: 0, x: 1.82, y: 1.38, w: 1.68, h: 1.04 }, // Activités clés
        { i: 4, x: 1.82, y: 2.48, w: 1.68, h: 1.1  }, // Ressources clés
        { i: 1, x: 3.56, y: 1.38, w: 1.7,  h: 2.2  }, // Proposition valeur (central)
        { i: 2, x: 5.32, y: 1.38, w: 1.68, h: 1.04 }, // Relations
        { i: 7, x: 5.32, y: 2.48, w: 1.68, h: 1.1  }, // Canaux
        { i: 5, x: 7.06, y: 1.38, w: 1.68, h: 2.2  }, // Segments
        { i: 6, x: 0.08, y: 3.64, w: 4.58, h: 1.35 }, // Structure coûts
        { i: 8, x: 4.72, y: 3.64, w: 4.02, h: 1.35 }, // Sources revenus
    ]

    const bmcColors = [TEAL, '0E8A74', TEAL, '0A7A66', TEAL, '0E8A74', TEAL, NAVY, NAVY]

    bmcLayout.forEach(({ i, x, y, w, h }, idx) => {
        const bloc  = bmcData[i]
        const color = bmcColors[idx]
        slide1.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color }, line: { color: WHITE, transparency: 85 } })
        slide1.addShape(pres.ShapeType.rect, { x, y, w, h: 0.2, fill: { color: ORANGE }, line: { color: ORANGE } })
        slide1.addText(bloc.titre, { x: x + 0.05, y: y + 0.02, w: w - 0.1, h: 0.16, fontSize: 7, bold: true, color: WHITE, fontFace: 'Arial' })
        slide1.addText(bloc.contenu, { x: x + 0.05, y: y + 0.23, w: w - 0.1, h: h - 0.28, fontSize: 6.5, color: WHITE, fontFace: 'Arial' })
    })

    // Mission / Vision / Valeurs à droite si espace disponible
    slide1.addShape(pres.ShapeType.rect, { x: 8.8, y: 1.38, w: 1.16, h: 2.2, fill: { color: '064E3B' }, line: { color: WHITE, transparency: 85 } })
    slide1.addShape(pres.ShapeType.rect, { x: 8.8, y: 1.38, w: 1.16, h: 0.2, fill: { color: ORANGE }, line: { color: ORANGE } })
    slide1.addText('Mission', { x: 8.85, y: 1.4, w: 1.06, h: 0.16, fontSize: 7, bold: true, color: WHITE, fontFace: 'Arial' })
    slide1.addText(profil?.mission?.substring(0, 100) || '—', { x: 8.85, y: 1.6, w: 1.06, h: 0.7, fontSize: 6, color: WHITE, fontFace: 'Arial' })
    slide1.addText('Valeurs', { x: 8.85, y: 2.35, w: 1.06, h: 0.16, fontSize: 7, bold: true, color: ORANGE, fontFace: 'Arial' })
    slide1.addText(profil?.valeurs?.substring(0, 80) || '—', { x: 8.85, y: 2.53, w: 1.06, h: 0.7, fontSize: 5.5, color: WHITE, fontFace: 'Arial' })
    slide1.addText('Vision', { x: 8.85, y: 3.27, w: 1.06, h: 0.16, fontSize: 7, bold: true, color: ORANGE, fontFace: 'Arial' })
    slide1.addText(profil?.vision?.substring(0, 60) || '—', { x: 8.85, y: 3.45, w: 1.06, h: 0.4, fontSize: 5.5, color: WHITE, fontFace: 'Arial' })

    // ══════════════════════════════════════════════════════════════════════════
    // SLIDE 2 — SYNTHÈSE FINANCIÈRE & POINTS CLÉS
    // ══════════════════════════════════════════════════════════════════════════
    const slide2 = pres.addSlide()
    addHeaderFooter(slide2, 2)

    // Titre slide 2
    slide2.addShape(pres.ShapeType.rect, { x: 0, y: 0.92, w: '100%', h: 0.32, fill: { color: NAVY }, line: { color: NAVY } })
    slide2.addText('Synthèse financière & Points clés du projet', {
        x: 0.2, y: 0.95, w: 9.6, h: 0.26,
        fontSize: 11, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
    })

    // ── KPIs financiers (8 cartes) ─────────────────────────────────────────────
    const kpis = [
        { label: 'TRI',               value: `${tri.toFixed(1)}%`,          color: tri > 15 ? TEAL : ORANGE },
        { label: 'VAN',               value: `${formatM(van)} FCFA`,        color: van > 0 ? TEAL : 'E24B4A' },
        { label: 'CA An 1',           value: `${formatM(premierRes?.ca_total || 0)} FCFA`, color: NAVY },
        { label: `CA An ${duree}`,    value: `${formatM(dernierRes?.ca_total || 0)} FCFA`, color: NAVY },
        { label: 'Marge brute',       value: `${margeBrute.toFixed(1)}%`,   color: TEAL },
        { label: 'Résultat net cumulé', value: `${formatM(totalResNet)} FCFA`, color: totalResNet > 0 ? TEAL : 'E24B4A' },
        { label: 'Financement total', value: `${formatM(totalFinancement)} FCFA`, color: NAVY },
        { label: 'Apport fonds propres', value: `${formatM(totalFP)} FCFA`, color: NAVY },
    ]

    kpis.forEach((k, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        const x   = 0.08 + col * 2.48
        const y   = 1.32 + row * 0.75
        slide2.addShape(pres.ShapeType.rect, { x, y, w: 2.38, h: 0.68, fill: { color: LGRAY }, line: { color: 'E5E7EB' } })
        slide2.addShape(pres.ShapeType.rect, { x, y, w: 2.38, h: 0.12, fill: { color: k.color }, line: { color: k.color } })
        slide2.addText(k.label, { x: x + 0.08, y: y + 0.14, w: 2.22, h: 0.18, fontSize: 8, color: '6B7280', fontFace: 'Arial' })
        slide2.addText(k.value, { x: x + 0.08, y: y + 0.32, w: 2.22, h: 0.28, fontSize: 13, bold: true, color: k.color, fontFace: 'Arial' })
    })

    // ── Tableau compte de résultat ────────────────────────────────────────────
    const tableY = 2.86
    slide2.addShape(pres.ShapeType.rect, { x: 0.08, y: tableY, w: 4.8, h: 0.24, fill: { color: NAVY }, line: { color: NAVY } })
    slide2.addText('Compte de résultat prévisionnel (FCFA)', {
        x: 0.12, y: tableY + 0.04, w: 4.7, h: 0.18, fontSize: 8, bold: true, color: WHITE, fontFace: 'Arial'
    })

    const lignesRes = [
        { label: "Chiffre d'Affaires",  key: 'ca_total',     bold: true  },
        { label: 'Marge brute',         key: 'marge_brute',  bold: false },
        { label: 'EBITDA',              key: 'ebitda',       bold: false },
        { label: 'Résultat net',        key: 'resultat_net', bold: true  },
        { label: 'Trésorerie',          key: 'tresorerie',   bold: false },
    ]
    const colsAnnees = (resultats || []).slice(0, 5)
    const colW = 4.1 / (colsAnnees.length + 1)

    // En-tête colonnes
    slide2.addShape(pres.ShapeType.rect, { x: 0.08, y: tableY + 0.24, w: 0.72, h: 0.22, fill: { color: TEAL }, line: { color: TEAL } })
    colsAnnees.forEach((r, ci) => {
        slide2.addShape(pres.ShapeType.rect, { x: 0.08 + 0.72 + ci * colW, y: tableY + 0.24, w: colW, h: 0.22, fill: { color: TEAL }, line: { color: TEAL } })
        slide2.addText(String(r.annee), { x: 0.08 + 0.72 + ci * colW, y: tableY + 0.26, w: colW, h: 0.18, fontSize: 7, bold: true, color: WHITE, fontFace: 'Arial', align: 'center' })
    })

    lignesRes.forEach((l, li) => {
        const ry   = tableY + 0.46 + li * 0.3
        const bg   = l.bold ? 'E6F1FB' : (li % 2 === 0 ? WHITE : LGRAY)
        slide2.addShape(pres.ShapeType.rect, { x: 0.08, y: ry, w: 4.8, h: 0.28, fill: { color: bg }, line: { color: 'E5E7EB' } })
        slide2.addText(l.label, { x: 0.12, y: ry + 0.05, w: 0.65, h: 0.2, fontSize: 6.5, bold: l.bold, color: '374151', fontFace: 'Arial' })
        colsAnnees.forEach((r, ci) => {
            const val = r[l.key as keyof typeof r] as number
            const txt = `${formatM(val)}`
            slide2.addText(txt, {
                x: 0.08 + 0.72 + ci * colW, y: ry + 0.04, w: colW, h: 0.2,
                fontSize: 6.5, bold: l.bold, color: val < 0 ? 'E24B4A' : l.bold ? TEAL : '374151',
                fontFace: 'Arial', align: 'center'
            })
        })
    })

    // ── Plan de financement ───────────────────────────────────────────────────
    const finY = tableY
    slide2.addShape(pres.ShapeType.rect, { x: 5.08, y: finY, w: 4.88, h: 0.24, fill: { color: NAVY }, line: { color: NAVY } })
    slide2.addText('Plan de financement', {
        x: 5.12, y: finY + 0.04, w: 4.78, h: 0.18, fontSize: 8, bold: true, color: WHITE, fontFace: 'Arial'
    })

    ;[
        { label: 'Coûts démarrage An 1', value: `${formatNum(totalCapex + totalOpexFixe)} FCFA`, color: NAVY },
        { label: `CAPEX`, value: `${formatNum(totalCapex)} FCFA`, color: '374151' },
        { label: `OPEX An 1`, value: `${formatNum(totalOpexFixe)} FCFA`, color: '374151' },
        { label: 'Financement sollicité', value: `${formatNum(totalFinancement)} FCFA`, color: ORANGE },
        { label: 'Apport fonds propres', value: `${formatNum(totalFP)} FCFA`, color: TEAL },
        { label: `Croissance ventes`, value: `${(hyp('volume_initial', 100) || 0).toFixed(0)} → ${Math.round((hyp('volume_initial', 100) || 100) * Math.pow(1 + hyp('taux_croissance', 0.25), duree - 1))} unités (+${croissance.toFixed(0)}%/an)`, color: NAVY },
        { label: 'Total unités sur projet', value: `${formatNum(totalUnites)} unités / ${duree} ans`, color: NAVY },
        { label: 'Résultat net cumulé', value: `${formatNum(Math.round(totalResNet))} FCFA`, color: totalResNet > 0 ? TEAL : 'E24B4A' },
        { label: `Coûts totaux (${duree} ans)`, value: `${formatM((totalCapex + totalOpexFixe) * duree)} FCFA`, color: NAVY },
    ].forEach((r, i) => {
        const ry = finY + 0.28 + i * 0.28
        const bg = i === 0 || i === 3 || i === 4 ? LGRAY : (i % 2 === 0 ? WHITE : 'FAFAFA')
        slide2.addShape(pres.ShapeType.rect, { x: 5.08, y: ry, w: 4.88, h: 0.26, fill: { color: bg }, line: { color: 'E5E7EB' } })
        slide2.addText(r.label, { x: 5.12, y: ry + 0.04, w: 2.8, h: 0.18, fontSize: 7, color: '374151', fontFace: 'Arial', bold: i === 0 || i === 3 })
        slide2.addText(r.value, { x: 7.95, y: ry + 0.04, w: 1.96, h: 0.18, fontSize: 7, bold: i === 0 || i === 3 || i === 4, color: r.color, fontFace: 'Arial', align: 'right' })
    })

    // ── Risques & Impacts ─────────────────────────────────────────────────────
    const bottomY = 4.55
    // Risques
    slide2.addShape(pres.ShapeType.rect, { x: 0.08, y: bottomY, w: 4.8, h: 0.22, fill: { color: ORANGE }, line: { color: ORANGE } })
    slide2.addText('⚠ Risques identifiés', { x: 0.12, y: bottomY + 0.03, w: 4.7, h: 0.16, fontSize: 8, bold: true, color: WHITE, fontFace: 'Arial' })

    const risquesTop = (risques || []).slice(0, 4)
    if (risquesTop.length === 0) {
        slide2.addText('Aucun risque identifié', { x: 0.12, y: bottomY + 0.26, w: 4.7, h: 0.2, fontSize: 7, color: '6B7280', fontFace: 'Arial' })
    } else {
        risquesTop.forEach((r, i) => {
            const nColor = r.niveau_risque === 'critique' ? 'FEE2E2' : r.niveau_risque === 'eleve' ? 'FFF3DC' : 'F9FAFB'
            const tColor = r.niveau_risque === 'critique' ? '991B1B' : r.niveau_risque === 'eleve' ? '854F0B' : '374151'
            slide2.addShape(pres.ShapeType.rect, { x: 0.08, y: bottomY + 0.24 + i * 0.15, w: 4.8, h: 0.14, fill: { color: nColor }, line: { color: 'E5E7EB' } })
            slide2.addText(`${r.niveau_risque === 'critique' ? '🔴' : r.niveau_risque === 'eleve' ? '🟠' : '🟡'} ${r.description.substring(0, 45)} — ${r.mesure_mitigation?.substring(0, 30) || 'À définir'}`, {
                x: 0.12, y: bottomY + 0.25 + i * 0.15, w: 4.7, h: 0.12,
                fontSize: 6.5, color: tColor, fontFace: 'Arial'
            })
        })
    }

    // Impacts
    slide2.addShape(pres.ShapeType.rect, { x: 5.08, y: bottomY, w: 4.88, h: 0.22, fill: { color: TEAL }, line: { color: TEAL } })
    slide2.addText('🌿 Impacts & ODD', { x: 5.12, y: bottomY + 0.03, w: 4.78, h: 0.16, fontSize: 8, bold: true, color: WHITE, fontFace: 'Arial' })

    const impactsTop = (impacts || []).slice(0, 4)
    if (impactsTop.length === 0) {
        slide2.addText('Aucun impact renseigné', { x: 5.12, y: bottomY + 0.26, w: 4.78, h: 0.2, fontSize: 7, color: '6B7280', fontFace: 'Arial' })
    } else {
        impactsTop.forEach((imp, i) => {
            slide2.addShape(pres.ShapeType.rect, { x: 5.08, y: bottomY + 0.24 + i * 0.15, w: 4.88, h: 0.14, fill: { color: i % 2 === 0 ? 'E1F5EE' : 'F9FAFB' }, line: { color: 'E5E7EB' } })
            slide2.addText(`✅ ${imp.indicateur}${imp.valeur ? ` : ${imp.valeur} ${imp.unite || ''}` : ''} ${imp.odd ? `[${imp.odd}]` : ''}`, {
                x: 5.12, y: bottomY + 0.25 + i * 0.15, w: 4.78, h: 0.12,
                fontSize: 6.5, color: '0F6E56', fontFace: 'Arial'
            })
        })
    }

    // ── Concurrents ───────────────────────────────────────────────────────────
    if (concurrents && concurrents.length > 0) {
        const concY = bottomY + 0.88
        if (concY < 5.1) {
            slide2.addText('Concurrents : ' + concurrents.slice(0, 3).map(c => `${c.nom} (${c.type || '—'})`).join('  |  '), {
                x: 0.08, y: concY, w: 9.88, h: 0.18,
                fontSize: 6.5, color: '6B7280', fontFace: 'Arial', italic: true
            })
        }
    }

    const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer
    const nom    = (projet.nom || 'BusinessModel').replace(/\s+/g, '_')
    const date   = new Date().toISOString().split('T')[0]

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': `attachment; filename="${nom}_Synthese_${date}.pptx"`,
        }
    })
}