import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/superbase/server'
import pptxgen from 'pptxgenjs'

const ORANGE = "F0A02B"
const TEAL   = "169B86"
const NAVY   = "0D2B55"
const WHITE  = "FFFFFF"
const LGRAY  = "F5F5F5"

const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))
const formatM   = (n: number) => `${(n / 1_000_000).toFixed(1)} M`

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const projetId = searchParams.get('projetId')

    if (!projetId) {
        return NextResponse.json({ error: 'projetId requis' }, { status: 400 })
    }

    const supabase = await createClient()

    const [
        { data: projet },
        { data: profil },
        { data: hyps },
        { data: resultats },
        { data: concurrents },
        { data: partenaires },
        { data: capex },
        { data: opex },
    ] = await Promise.all([
        supabase.from('projets').select('*').eq('id', projetId).single(),
        supabase.from('entreprise_profil').select('*').eq('projet_id', projetId).single(),
        supabase.from('hypotheses').select('*').eq('projet_id', projetId),
        supabase.from('resultats_financiers').select('*').eq('projet_id', projetId).order('annee'),
        supabase.from('concurrents').select('*').eq('projet_id', projetId),
        supabase.from('partenaires_financiers').select('*').eq('projet_id', projetId),
        supabase.from('capex').select('*').eq('projet_id', projetId),
        supabase.from('opex').select('*').eq('projet_id', projetId),
    ])

    if (!projet) {
        return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }

    const hyp = (cle: string, defaut = 0) =>
        hyps?.find(h => h.cle === cle)?.valeur ?? defaut

    const premierRes = resultats?.[0]
    const dernierRes = resultats?.[resultats.length - 1]
    const totalCA    = (resultats || []).reduce((s, r) => s + r.ca_total, 0)
    const totalRes   = (resultats || []).reduce((s, r) => s + r.resultat_net, 0)
    const wacc       = hyp('wacc', 0.1)
    const croissance = hyp('taux_croissance', 0.25) * 100

    // VAN simplifiée
    const van = (resultats || []).reduce((sum, r, i) =>
        sum + r.resultat_net / Math.pow(1 + wacc, i + 1), 0
    )

    const totalCapex = (capex || []).reduce((s, c) => s + c.montant, 0)
    const totalOpex  = (opex || []).filter(o => o.type_calcul === 'fixe').reduce((s, o) => s + o.valeur, 0)

    const pres = new pptxgen()
    pres.layout = 'LAYOUT_16x9'
    pres.title  = projet.nom || 'Business Model'

    const slide = pres.addSlide()

    // ── FOND BLANC ────────────────────────────────────────────────────────────
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: WHITE }, line: { color: WHITE }
    })

    // ── HEADER navy ───────────────────────────────────────────────────────────
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 1.1,
        fill: { color: NAVY }, line: { color: NAVY }
    })

    // Numéro projet
    slide.addText(projet.numero_projet || '—', {
        x: 0.2, y: 0.05, w: 2, h: 0.3,
        fontSize: 9, color: 'A0B4CC', fontFace: 'Arial'
    })

    // Nom projet
    slide.addText(projet.nom || 'Business Model', {
        x: 0.2, y: 0.3, w: 6, h: 0.55,
        fontSize: 22, bold: true, color: WHITE, fontFace: 'Arial Black'
    })

    // Badges droite
    const badges = ['Désirabilité ✓', 'Faisabilité ✓', 'Viabilité ✓']
    badges.forEach((b, i) => {
        slide.addText(b, {
            x: 6.5 + i * 1.2, y: 0.35, w: 1.1, h: 0.3,
            fontSize: 7, color: WHITE, fontFace: 'Arial',
            fill: { color: i === 0 ? TEAL : i === 1 ? ORANGE : '5B5EA6' },
            align: 'center', valign: 'middle'
        })
    })

    // Entreprise + date
    slide.addText(`${profil?.nom_entreprise || 'KYA-Energy Group'}  ·  ${profil?.certifications || ''}  ·  ${new Date().toLocaleDateString('fr-FR')}`, {
        x: 0.2, y: 0.82, w: 8, h: 0.22,
        fontSize: 8, color: 'A0B4CC', fontFace: 'Arial'
    })

    // ── PROPOSITION DE VALEUR ─────────────────────────────────────────────────
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 1.1, w: '100%', h: 0.55,
        fill: { color: ORANGE }, line: { color: ORANGE }
    })
    slide.addText(profil?.slogan || 'Business Model — Vision stratégique', {
        x: 0.3, y: 1.18, w: 9.4, h: 0.38,
        fontSize: 13, bold: true, color: WHITE, fontFace: 'Arial Black', align: 'center'
    })

    // ── COLONNE GAUCHE : BMC ──────────────────────────────────────────────────
    const bmcBlocs = [
        { titre: 'Segments clients',    contenu: projet.secteur || '—' },
        { titre: 'Proposition valeur',  contenu: projet.produit_principal || '—' },
        { titre: 'Canaux',              contenu: partenaires?.map(p => p.nom).join(', ') || '—' },
        { titre: 'Relations clients',   contenu: 'Service personnalisé' },
        { titre: 'Sources de revenus',  contenu: `CA An1 : ${formatM(premierRes?.ca_total || 0)} FCFA` },
        { titre: 'Ressources clés',     contenu: profil?.expertise_cle?.substring(0, 60) || '—' },
        { titre: 'Activités clés',      contenu: projet.produit_principal || '—' },
        { titre: 'Partenaires clés',    contenu: partenaires?.map(p => p.nom).join(', ') || '—' },
        { titre: 'Structure de coûts',  contenu: `CAPEX : ${formatM(totalCapex)} | OPEX : ${formatM(totalOpex)}/an` },
    ]

    bmcBlocs.forEach((bloc, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = 0.15 + col * 1.85
        const y = 1.75 + row * 1.05

        slide.addShape(pres.ShapeType.rect, {
            x, y, w: 1.75, h: 0.95,
            fill: { color: i % 2 === 0 ? '1A3F6F' : NAVY },
            line: { color: WHITE, transparency: 80 }
        })
        slide.addText(bloc.titre, {
            x: x + 0.05, y: y + 0.04, w: 1.65, h: 0.25,
            fontSize: 7.5, bold: true, color: ORANGE, fontFace: 'Arial'
        })
        slide.addText(bloc.contenu, {
            x: x + 0.05, y: y + 0.28, w: 1.65, h: 0.6,
            fontSize: 7, color: WHITE, fontFace: 'Arial'
        })
    })

    // ── COLONNE DROITE : KPIs & Mission ───────────────────────────────────────
    const rightX = 5.85

    // Mission / Vision
    slide.addShape(pres.ShapeType.rect, {
        x: rightX, y: 1.75, w: 4.0, h: 1.0,
        fill: { color: LGRAY }, line: { color: 'CCCCCC' }
    })
    slide.addText('Mission', {
        x: rightX + 0.1, y: 1.8, w: 3.8, h: 0.22,
        fontSize: 8, bold: true, color: ORANGE, fontFace: 'Arial'
    })
    slide.addText(profil?.mission?.substring(0, 120) || '—', {
        x: rightX + 0.1, y: 2.0, w: 3.8, h: 0.65,
        fontSize: 7.5, color: '333333', fontFace: 'Arial'
    })

    // Valeurs
    slide.addShape(pres.ShapeType.rect, {
        x: rightX, y: 2.82, w: 4.0, h: 0.6,
        fill: { color: TEAL }, line: { color: TEAL }
    })
    slide.addText('Valeurs  |  ' + (profil?.valeurs || '—'), {
        x: rightX + 0.1, y: 2.88, w: 3.8, h: 0.45,
        fontSize: 7.5, color: WHITE, fontFace: 'Arial'
    })

    // KPIs financiers
    const kpis = [
        { label: 'CA An 1',          value: `${formatM(premierRes?.ca_total || 0)} FCFA`   },
        { label: 'CA An 5',          value: `${formatM(dernierRes?.ca_total || 0)} FCFA`   },
        { label: 'Résultat net cumulé', value: `${formatM(totalRes)} FCFA`                 },
        { label: 'VAN',              value: `${formatM(van)} FCFA`                         },
        { label: 'Croissance/an',    value: `${croissance.toFixed(0)}%`                    },
        { label: 'Financement total', value: `${formatM((partenaires || []).reduce((s, p) => s + p.montant, 0))} FCFA` },
    ]

    kpis.forEach((k, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = rightX + col * 2.0
        const y = 3.52 + row * 0.6

        slide.addShape(pres.ShapeType.rect, {
            x, y, w: 1.9, h: 0.52,
            fill: { color: i % 2 === 0 ? 'F9FAFB' : WHITE },
            line: { color: 'E5E7EB' }
        })
        slide.addText(k.label, {
            x: x + 0.08, y: y + 0.04, w: 1.74, h: 0.2,
            fontSize: 7, color: '9CA3AF', fontFace: 'Arial'
        })
        slide.addText(k.value, {
            x: x + 0.08, y: y + 0.22, w: 1.74, h: 0.24,
            fontSize: 10, bold: true, color: NAVY, fontFace: 'Arial Black'
        })
    })

    // ── FOOTER ────────────────────────────────────────────────────────────────
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 5.2, w: '100%', h: 0.425,
        fill: { color: NAVY }, line: { color: NAVY }
    })
    slide.addText(`${profil?.nom_entreprise || 'KYA-Energy Group'}  ·  ${profil?.localisation || 'Lomé, Togo'}  ·  Généré le ${new Date().toLocaleDateString('fr-FR')}`, {
        x: 0.3, y: 5.26, w: 9.4, h: 0.22,
        fontSize: 7.5, color: 'A0B4CC', fontFace: 'Arial', align: 'center'
    })

    // Générer le fichier
    const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer
    const nom    = (projet.nom || 'BusinessModel').replace(/\s+/g, '_')
    const date   = new Date().toISOString().split('T')[0]

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': `attachment; filename="${nom}_Synthese_${date}.pptx"`,
        }
    });
}