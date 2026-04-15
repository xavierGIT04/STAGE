import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/superbase/server'
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
    VerticalAlign, PageBreak, LevelFormat, Header, Footer, SimpleField
} from 'docx'

const ORANGE = "F0A02B"
const TEAL   = "169B86"
const NAVY   = "0D2B55"
const LGRAY  = "F5F5F5"
const WHITE  = "FFFFFF"
const DGRAY  = "888888"

const border  = (c = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color: c })
const borders = (c = "CCCCCC") => ({ top: border(c), bottom: border(c), left: border(c), right: border(c) })
const noBorder  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }

const run  = (text: string, opts = {}) => new TextRun({ text, font: "Arial", size: 22, ...opts })
const h1   = (text: string) => new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: NAVY })]
})
const h2   = (text: string) => new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: TEAL })]
})
const para = (text: string) => new Paragraph({
    spacing: { before: 80, after: 100 }, children: [run(text)]
})
const sep  = (color = ORANGE) => new Paragraph({
    spacing: { before: 100, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 1 } },
    children: [run("")]
})
const space = () => new Paragraph({ children: [run("")], spacing: { before: 60, after: 60 } })
const bullet = (text: string) => new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 }, children: [run(text)]
})

const cell = (content: string, opts: Record<string, unknown> = {}) => new TableCell({
    borders: borders("CCCCCC"),
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    shading: { fill: (opts.fill as string) || WHITE, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    width: opts.width ? { size: opts.width as number, type: WidthType.DXA } : undefined,
    children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 60 },
        children: [new TextRun({
            text: content, font: "Arial", size: 20,
            bold: (opts.bold as boolean) || false,
            color: (opts.color as string) || "000000"
        })]
    })]
})

const hCell = (text: string, width: number, bg = NAVY) =>
    cell(text, { fill: bg, bold: true, color: WHITE, width, align: AlignmentType.CENTER })

const formatNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const projetId = searchParams.get('projetId')

    if (!projetId) {
        return NextResponse.json({ error: 'projetId requis' }, { status: 400 })
    }

    const supabase = await createClient()

    // Récupérer toutes les données
    const [
        { data: projet },
        { data: profil },
        { data: produits },
        { data: composants },
        { data: hyps },
        { data: capex },
        { data: opex },
        { data: revenus },
        { data: partenaires },
        { data: concurrents },
        { data: resultats },
    ] = await Promise.all([
        supabase.from('projets').select('*').eq('id', projetId).single(),
        supabase.from('entreprise_profil').select('*').eq('projet_id', projetId).single(),
        supabase.from('produits').select('*').eq('projet_id', projetId),
        supabase.from('composants').select('*'),
        supabase.from('hypotheses').select('*').eq('projet_id', projetId),
        supabase.from('capex').select('*').eq('projet_id', projetId),
        supabase.from('opex').select('*').eq('projet_id', projetId),
        supabase.from('revenus').select('*').eq('projet_id', projetId),
        supabase.from('partenaires_financiers').select('*').eq('projet_id', projetId),
        supabase.from('concurrents').select('*').eq('projet_id', projetId),
        supabase.from('resultats_financiers').select('*').eq('projet_id', projetId).order('annee'),
    ])

    if (!projet) {
        return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }

    const hyp = (cle: string, defaut = 0) =>
        hyps?.find(h => h.cle === cle)?.valeur ?? defaut

    const formatM = (n: number) => `${(n / 1_000_000).toFixed(1)} M FCFA`

    const doc = new Document({
        numbering: {
            config: [{
                reference: "bullets",
                levels: [{
                    level: 0, format: LevelFormat.BULLET, text: "•",
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            }]
        },
        styles: {
            default: { document: { run: { font: "Arial", size: 22 } } },
            paragraphStyles: [
                { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
                    run: { size: 32, bold: true, font: "Arial", color: NAVY },
                    paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
                { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
                    run: { size: 26, bold: true, font: "Arial", color: TEAL },
                    paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
            ]
        },
        sections: [{
            properties: {
                page: {
                    size: { width: 11906, height: 16838 },
                    margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
                }
            },
            headers: {
                default: new Header({ children: [
                        new Table({
                            width: { size: 9386, type: WidthType.DXA }, columnWidths: [6200, 3186],
                            rows: [new TableRow({ children: [
                                    new TableCell({ borders: noBorders, children: [new Paragraph({ children: [
                                                new TextRun({ text: projet.nom || 'Business Model', font: "Arial", size: 17, color: TEAL })
                                            ]})] }),
                                    new TableCell({ borders: noBorders, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
                                                new TextRun({ text: profil?.nom_entreprise || 'KYA-Energy Group', font: "Arial", size: 17, bold: true, color: ORANGE })
                                            ]})] }),
                                ]})]
                        }),
                        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ORANGE, space: 1 } }, children: [run("")] })
                    ]})
            },
            footers: {
                default: new Footer({ children: [
                        new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 1 } }, children: [run("")] }),
                        new Table({
                            width: { size: 9386, type: WidthType.DXA }, columnWidths: [5500, 3886],
                            rows: [new TableRow({ children: [
                                    new TableCell({ borders: noBorders, children: [new Paragraph({ children: [
                                                new TextRun({ text: `© ${profil?.nom_entreprise || 'KYA-Energy Group'} — Confidentiel`, font: "Arial", size: 17, color: DGRAY })
                                            ]})] }),
                                    new TableCell({ borders: noBorders, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
                                                new TextRun({ text: "Page ", font: "Arial", size: 17, color: DGRAY }),
                                                new SimpleField("PAGE"),
                                            ]})] }),
                                ]})]
                        })
                    ]})
            },
            children: [

                // ── PAGE DE GARDE ──────────────────────────────────────────────────
                space(), space(), space(),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }, children: [
                        new TextRun({ text: profil?.nom_entreprise?.toUpperCase() || 'KYA-ENERGY GROUP', font: "Arial", size: 28, bold: true, color: TEAL })
                    ]}),
                sep(ORANGE),
                space(), space(),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }, children: [
                        new TextRun({ text: 'BUSINESS MODEL', font: "Arial", size: 44, bold: true, color: NAVY })
                    ]}),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 400 }, children: [
                        new TextRun({ text: projet.nom || '', font: "Arial", size: 28, bold: true, color: ORANGE })
                    ]}),
                space(), space(),
                new Table({
                    width: { size: 9386, type: WidthType.DXA }, columnWidths: [3000, 6386],
                    rows: [
                        new TableRow({ children: [hCell("Document", 3000), hCell("Informations", 6386)] }),
                        new TableRow({ children: [cell("Projet", { fill: LGRAY, bold: true, width: 3000 }), cell(projet.nom || '', { width: 6386 })] }),
                        new TableRow({ children: [cell("Numéro", { fill: LGRAY, bold: true, width: 3000 }), cell(projet.numero_projet || '—', { width: 6386 })] }),
                        new TableRow({ children: [cell("Secteur", { fill: LGRAY, bold: true, width: 3000 }), cell(projet.secteur || '—', { width: 6386 })] }),
                        new TableRow({ children: [cell("Année démarrage", { fill: LGRAY, bold: true, width: 3000 }), cell(String(projet.annee_demarrage || '—'), { width: 6386 })] }),
                        new TableRow({ children: [cell("Durée", { fill: LGRAY, bold: true, width: 3000 }), cell(`${projet.duree_projet || '—'} ans`, { width: 6386 })] }),
                        new TableRow({ children: [cell("Devise", { fill: LGRAY, bold: true, width: 3000 }), cell(projet.devise || 'FCFA', { width: 6386 })] }),
                        new TableRow({ children: [cell("Statut", { fill: LGRAY, bold: true, width: 3000 }), cell(projet.statut || '—', { width: 6386 })] }),
                    ]
                }),

                new Paragraph({ children: [new PageBreak()] }),

                // ── QUI SOMMES-NOUS ────────────────────────────────────────────────
                h1("1. Qui sommes-nous ?"),
                sep(ORANGE),
                ...(profil ? [
                    new Table({
                        width: { size: 9386, type: WidthType.DXA }, columnWidths: [2500, 6886],
                        rows: [
                            new TableRow({ children: [cell("Entreprise",     { fill: LGRAY, bold: true, width: 2500 }), cell(profil.nom_entreprise || '—',  { width: 6886 })] }),
                            new TableRow({ children: [cell("Slogan",         { fill: LGRAY, bold: true, width: 2500 }), cell(profil.slogan || '—',          { width: 6886 })] }),
                            new TableRow({ children: [cell("Localisation",   { fill: LGRAY, bold: true, width: 2500 }), cell(profil.localisation || '—',    { width: 6886 })] }),
                            new TableRow({ children: [cell("Création",       { fill: LGRAY, bold: true, width: 2500 }), cell(String(profil.annee_creation || '—'), { width: 6886 })] }),
                            new TableRow({ children: [cell("Effectif",       { fill: LGRAY, bold: true, width: 2500 }), cell(profil.effectif || '—',        { width: 6886 })] }),
                            new TableRow({ children: [cell("Certifications", { fill: LGRAY, bold: true, width: 2500 }), cell(profil.certifications || '—',  { width: 6886 })] }),
                        ]
                    }),
                    space(),
                    h2("Mission"),
                    para(profil.mission || '—'),
                    h2("Vision"),
                    para(profil.vision || '—'),
                    h2("Valeurs"),
                    para(profil.valeurs || '—'),
                    h2("Expertise clé"),
                    para(profil.expertise_cle || '—'),
                ] : [para("Informations non renseignées.")]),

                new Paragraph({ children: [new PageBreak()] }),

                // ── INFORMATIONS PROJET ────────────────────────────────────────────
                h1("2. Informations du projet"),
                sep(ORANGE),
                para(projet.description || 'Aucune description renseignée.'),
                space(),
                new Table({
                    width: { size: 9386, type: WidthType.DXA }, columnWidths: [3000, 6386],
                    rows: [
                        new TableRow({ children: [cell("Produit principal", { fill: LGRAY, bold: true, width: 3000 }), cell(projet.produit_principal || '—', { width: 6386 })] }),
                        new TableRow({ children: [cell("Secteur",           { fill: LGRAY, bold: true, width: 3000 }), cell(projet.secteur || '—', { width: 6386 })] }),
                        new TableRow({ children: [cell("Année démarrage",   { fill: LGRAY, bold: true, width: 3000 }), cell(String(projet.annee_demarrage || '—'), { width: 6386 })] }),
                        new TableRow({ children: [cell("Durée",             { fill: LGRAY, bold: true, width: 3000 }), cell(`${projet.duree_projet} ans`, { width: 6386 })] }),
                    ]
                }),

                new Paragraph({ children: [new PageBreak()] }),

                // ── HYPOTHÈSES ─────────────────────────────────────────────────────
                h1("3. Hypothèses clés"),
                sep(ORANGE),
                new Table({
                    width: { size: 9386, type: WidthType.DXA }, columnWidths: [4000, 2693, 2693],
                    rows: [
                        new TableRow({ children: [hCell("Paramètre", 4000), hCell("Valeur", 2693), hCell("Unité", 2693)] }),
                        ...(hyps || []).map(h => new TableRow({ children: [
                                cell(h.description || h.cle, { fill: LGRAY, width: 4000 }),
                                cell(String(h.valeur), { width: 2693 }),
                                cell(h.unite || '—', { width: 2693 }),
                            ]}))
                    ]
                }),

                new Paragraph({ children: [new PageBreak()] }),

                // ── COÛTS ─────────────────────────────────────────────────────────
                h1("4. Coûts & Investissements"),
                sep(ORANGE),

                h2("CAPEX — Investissements initiaux"),
                new Table({
                    width: { size: 9386, type: WidthType.DXA }, columnWidths: [4000, 2693, 2693],
                    rows: [
                        new TableRow({ children: [hCell("Libellé", 4000), hCell("Montant (FCFA)", 2693), hCell("Amort./an (FCFA)", 2693)] }),
                        ...(capex || []).map(c => new TableRow({ children: [
                                cell(c.libelle, { fill: LGRAY, width: 4000 }),
                                cell(formatNum(c.montant), { width: 2693 }),
                                cell(formatNum(c.montant * c.taux_amortissement), { width: 2693 }),
                            ]})),
                        new TableRow({ children: [
                                cell("TOTAL", { fill: NAVY, bold: true, color: WHITE, width: 4000 }),
                                cell(formatNum((capex || []).reduce((s, c) => s + c.montant, 0)), { fill: NAVY, bold: true, color: WHITE, width: 2693 }),
                                cell(formatNum((capex || []).reduce((s, c) => s + c.montant * c.taux_amortissement, 0)), { fill: NAVY, bold: true, color: WHITE, width: 2693 }),
                            ]})
                    ]
                }),

                space(),
                h2("OPEX — Charges d'exploitation"),
                new Table({
                    width: { size: 9386, type: WidthType.DXA }, columnWidths: [4000, 2693, 2693],
                    rows: [
                        new TableRow({ children: [hCell("Libellé", 4000), hCell("Type", 2693), hCell("Valeur", 2693)] }),
                        ...(opex || []).map(o => new TableRow({ children: [
                                cell(o.libelle, { fill: LGRAY, width: 4000 }),
                                cell(o.type_calcul === 'fixe' ? 'Montant fixe' : '% du CA', { width: 2693 }),
                                cell(o.type_calcul === 'fixe' ? formatNum(o.valeur) + ' FCFA' : `${o.valeur * 100}%`, { width: 2693 }),
                            ]}))
                    ]
                }),

                new Paragraph({ children: [new PageBreak()] }),

                // ── CONCURRENTS ────────────────────────────────────────────────────
                h1("5. Analyse des concurrents"),
                sep(ORANGE),
                new Table({
                    width: { size: 9386, type: WidthType.DXA }, columnWidths: [1800, 1400, 2000, 2000, 2186],
                    rows: [
                        new TableRow({ children: [
                                hCell("Concurrent", 1800), hCell("Type", 1400),
                                hCell("Forces", 2000), hCell("Faiblesses", 2000),
                                hCell("Notre différenciation", 2186)
                            ]}),
                        ...(concurrents || []).map((c, i) => new TableRow({ children: [
                                cell(c.nom, { fill: i % 2 === 0 ? LGRAY : WHITE, bold: true, width: 1800 }),
                                cell(c.type || '—', { width: 1400 }),
                                cell(c.forces || '—', { width: 2000 }),
                                cell(c.faiblesses || '—', { width: 2000 }),
                                cell(c.notre_differenciation || '—', { fill: "E1F5EE", width: 2186 }),
                            ]}))
                    ]
                }),

                new Paragraph({ children: [new PageBreak()] }),

                // ── PRÉVISIONS FINANCIÈRES ─────────────────────────────────────────
                h1("6. Prévisions financières"),
                sep(ORANGE),
                new Table({
                    width: { size: 9386, type: WidthType.DXA },
                    columnWidths: [2200, ...(resultats || []).map(() => Math.floor(7186 / (resultats?.length || 1)))],
                    rows: [
                        new TableRow({ children: [
                                hCell("Indicateur (FCFA)", 2200),
                                ...(resultats || []).map(r => hCell(String(r.annee), Math.floor(7186 / (resultats?.length || 1))))
                            ]}),
                        ...[
                            { label: "CA Total",       key: "ca_total"      },
                            { label: "Marge brute",    key: "marge_brute"   },
                            { label: "EBITDA",         key: "ebitda"        },
                            { label: "EBIT",           key: "ebit"          },
                            { label: "Résultat net",   key: "resultat_net"  },
                            { label: "Trésorerie",     key: "tresorerie"    },
                        ].map((l, i) => new TableRow({ children: [
                                cell(l.label, { fill: i % 2 === 0 ? LGRAY : WHITE, bold: true, width: 2200 }),
                                ...(resultats || []).map(r => cell(
                                    formatNum(r[l.key as keyof typeof r] as number),
                                    { fill: i % 2 === 0 ? LGRAY : WHITE, width: Math.floor(7186 / (resultats?.length || 1)) }
                                ))
                            ]}))
                    ]
                }),

                new Paragraph({ children: [new PageBreak()] }),

                // ── PARTENAIRES FINANCIERS ─────────────────────────────────────────
                h1("7. Partenaires financiers"),
                sep(ORANGE),
                new Table({
                    width: { size: 9386, type: WidthType.DXA }, columnWidths: [2500, 1800, 2000, 1500, 1586],
                    rows: [
                        new TableRow({ children: [
                                hCell("Partenaire", 2500), hCell("Type", 1800),
                                hCell("Montant (FCFA)", 2000), hCell("Taux", 1500), hCell("Durée", 1586)
                            ]}),
                        ...(partenaires || []).map((p, i) => new TableRow({ children: [
                                cell(p.nom, { fill: i % 2 === 0 ? LGRAY : WHITE, bold: true, width: 2500 }),
                                cell(p.type_financement || '—', { width: 1800 }),
                                cell(formatNum(p.montant), { width: 2000 }),
                                cell(`${((p.taux_interet || 0) * 100).toFixed(1)}%`, { width: 1500 }),
                                cell(`${p.duree_annees || '—'} ans`, { width: 1586 }),
                            ]}))
                    ]
                }),

                space(),
                sep(TEAL),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 }, children: [
                        new TextRun({ text: `Document généré le ${new Date().toLocaleDateString('fr-FR')}`, font: "Arial", size: 18, color: DGRAY, italics: true })
                    ]}),
            ]
        }]
    })

    const buffer = await Packer.toBuffer(doc)
    const nom    = (projet.nom || 'BusinessModel').replace(/\s+/g, '_')
    const date   = new Date().toISOString().split('T')[0]

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${nom}_BusinessModel_${date}.docx"`,
        }
    })
}