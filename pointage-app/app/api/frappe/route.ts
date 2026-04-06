import { NextRequest, NextResponse } from 'next/server'

const FRAPPE_URL    = process.env.NEXT_PUBLIC_FRAPPE_URL ?? ''
const FRAPPE_KEY    = process.env.NEXT_PUBLIC_FRAPPE_API_KEY ?? ''
const FRAPPE_SECRET = process.env.NEXT_PUBLIC_FRAPPE_API_SECRET ?? ''

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const path = searchParams.get('path')

        if (!path) return NextResponse.json({ error: 'Path manquant' }, { status: 400 })

        // ✅ Décoder le path avant de construire l'URL finale
        const fullUrl = `${FRAPPE_URL}${decodeURIComponent(path)}`
        console.log("Appel vers Frappe :", fullUrl)

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Authorization': `token ${FRAPPE_KEY}:${FRAPPE_SECRET}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('[Proxy] Erreur Frappe:', data)
            return NextResponse.json({ error: data.message || 'Erreur Frappe' }, { status: response.status })
        }

        return NextResponse.json(data)

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('[Proxy] Erreur critique:', msg)
        return NextResponse.json({ error: msg }, { status: 502 })
    }
}