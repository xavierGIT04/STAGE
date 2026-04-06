import type { FrappeListResponse, FrappeCheckin, FrappeEmployee } from '@/types'

async function proxyFetch<T>(frappePath: string): Promise<T> {
    // ✅ On encode UNE seule fois le path complet
    const proxyUrl = `/api/frappe?path=${encodeURIComponent(frappePath)}`

    const res = await fetch(proxyUrl, { cache: 'no-store' })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(`Proxy Frappe → ${res.status}: ${err.error ?? ''}`)
    }

    return await res.json() as Promise<T>
}

// ✅ Construction propre du path sans double encodage
function resourcePath(doctype: string, params: Record<string, string>): string {
    const base = `/api/resource/${encodeURIComponent(doctype)}`
    const qs = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&')
    return qs ? `${base}?${qs}` : base
}

export async function fetchFrappeEmployees(): Promise<FrappeEmployee[]> {
    const path = resourcePath('Employee', {
        fields:  JSON.stringify(['name', 'employee_name', 'department', 'designation', 'attendance_device_id']),
        filters: JSON.stringify([['status', '=', 'Active']]),
        limit:   '500',
    })
    const json = await proxyFetch<FrappeListResponse<FrappeEmployee>>(path)
    return json.data
}

export async function fetchFrappeCheckins(date: string): Promise<FrappeCheckin[]> {
    const from = `${date} 00:00:00`
    const to   = `${date} 23:59:59`

    const path = resourcePath('Employee Checkin', {
        fields:   JSON.stringify(['name', 'employee', 'employee_name', 'log_type', 'time']),
        filters:  JSON.stringify([['time', 'Between', [from, to]]]),
        order_by: 'time asc',
        limit:    '1000',
    })
    const json = await proxyFetch<FrappeListResponse<FrappeCheckin>>(path)
    return json.data
}