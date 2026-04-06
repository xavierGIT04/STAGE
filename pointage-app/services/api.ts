/**
 * ─── API Service ──────────────────────────────────────────────────────────────
 *
 * Logique métier : transforme les données brutes Frappe HR
 * en structures internes utilisées par les composants.
 *
 * Source de données :
 *   MODE MOCK  → données fictives locales (USE_MOCK = true)
 *   MODE RÉEL  → Frappe HR via services/frappe.ts  (USE_MOCK = false)
 *
 * Pour passer en production :
 *   1. Remplir .env.local avec les vraies credentials
 *   2. Passer USE_MOCK à false
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
    Employee,
    BadgeEvent,
    DashboardStats,
    AnalyticsData,
    PresenceSnapshot,
    FrappeCheckin,
} from '@/types'
import {
    MOCK_EMPLOYEES,
    TOTAL_EMPLOYEES,
    ARRIVAL_THRESHOLD,
    DEPARTURE_THRESHOLD,
    timeToMinutes,
} from '@/data/mockData'
import { fetchFrappeEmployees, fetchFrappeCheckins } from '@/services/frappe'

// ─── Toggle ───────────────────────────────────────────────────────────────────
const USE_MOCK = false  // ← passer à false quand les credentials Frappe sont prêtes

// ─── Helpers date ─────────────────────────────────────────────────────────────

/** Retourne la date du jour au format "YYYY-MM-DD" */
function todayStr(): string {
    return new Date().toISOString().slice(0, 10)
}

/** Extrait "HH:mm" depuis un timestamp Frappe "YYYY-MM-DD HH:mm:ss" */
function toHHmm(frappeTime: string): string {
    return frappeTime.slice(11, 16)
}

/** Convertit un timestamp Frappe en ms Unix */
function toTimestamp(frappeTime: string): number {
    return new Date(frappeTime).getTime()
}

// =============================================================================
// TRANSFORMATEUR — Frappe → types internes
//
// Règles de calcul :
//   - arrivalTime   = heure du 1er checkin IN de la journée
//   - present       = true si le DERNIER checkin est IN (temps réel)
//   - departureTime = départ DÉFINITIF uniquement :
//       • Dernier log = OUT >= 17h30 → départ définitif confirmé
//       • Dernier log = OUT < 17h30 ET journée terminée → parti tôt
//       • Dernier log = OUT < 17h30 ET journée en cours → sortie temporaire (null)
//       • Dernier log = IN → toujours présent (null)
// =============================================================================

interface TransformResult {
    employees: Employee[]
    events:    BadgeEvent[]
}

function transformFrappeData(
    frappeEmployees: Awaited<ReturnType<typeof fetchFrappeEmployees>>,
    checkins: FrappeCheckin[],
    targetDate?: string,
): TransformResult {

    const now           = new Date()
    const nowMinutes    = now.getHours() * 60 + now.getMinutes()
    const today         = todayStr()
    const isToday       = !targetDate || targetDate === today
    const depThreshMin  = timeToMinutes(DEPARTURE_THRESHOLD)
    // Journée terminée si : on analyse un jour passé, OU l'heure actuelle >= 17h30
    const dayIsOver     = !isToday || nowMinutes >= depThreshMin

    // Index checkins par employé — ordre chronologique (asc)
    const checkinsByEmp = new Map<string, FrappeCheckin[]>()
    for (const c of checkins) {
        if (!checkinsByEmp.has(c.employee)) checkinsByEmp.set(c.employee, [])
        checkinsByEmp.get(c.employee)!.push(c)
    }

    const employees: Employee[] = frappeEmployees.map(fe => {
        const logs    = checkinsByEmp.get(fe.name) ?? []
        const firstIn = logs.find(l => l.log_type === 'IN')
        const lastLog = logs.at(-1)

        // ── Départ définitif uniquement ───────────────────────────────────────────
        let departureTime: string | null = null
        if (lastLog?.log_type === 'OUT') {
            const lastOutTime    = toHHmm(lastLog.time)
            const lastOutMinutes = timeToMinutes(lastOutTime)
            if (lastOutMinutes >= depThreshMin) {
                // OUT après 17h30 → départ définitif confirmé
                departureTime = lastOutTime
            } else if (dayIsOver) {
                // OUT avant 17h30 mais journée terminée → parti tôt (définitif)
                departureTime = lastOutTime
            }
            // Sinon : sortie temporaire en cours de journée → on ne marque pas de départ
        }

        return {
            id:            fe.name,
            matricule:     fe.attendance_device_id ?? fe.name,
            name:          fe.employee_name,
            dept:          fe.department,
            role:          fe.designation,
            arrivalTime:   firstIn ? toHHmm(firstIn.time) : null,
            departureTime,
            present:       lastLog?.log_type === 'IN',
        }
    })

    // Construire les événements (journal)
    const events: BadgeEvent[] = checkins
        .slice()
        .reverse()   // du plus récent au plus ancien
        .slice(0, 50)
        .map(c => ({
            id:         c.name,
            type:       c.log_type,
            employeeId: c.employee,
            name:       c.employee_name,
            dept:       c.department ?? '',
            time:       toHHmm(c.time),
            timestamp:  toTimestamp(c.time),
        }))


    return { employees, events }
}

// =============================================================================
// MOCK STATE — simule ce que Frappe renverrait
// =============================================================================
const _mockEmployees: Employee[] = MOCK_EMPLOYEES.map(e => ({ ...e }))
// Quelques employés présents pour la démo visuelle
;['EMP-0002','EMP-0003','EMP-0006','EMP-0010','EMP-0012','EMP-0014','EMP-0016'].forEach(id => {
    const emp = _mockEmployees.find(e => e.id === id)
    if (emp) emp.present = true
})

// Événements mock — représentatifs d'une vraie journée
const _mockEvents: BadgeEvent[] = [
    { id: 'CHK-001', type: 'IN',  employeeId: 'EMP-0001', name: 'Kofi Mensah',     dept: 'Direction',  time: '06:45', timestamp: Date.now() - 1000 * 60 * 200 },
    { id: 'CHK-002', type: 'IN',  employeeId: 'EMP-0013', name: 'Paa Kweku',       dept: 'Production', time: '06:30', timestamp: Date.now() - 1000 * 60 * 210 },
    { id: 'CHK-003', type: 'IN',  employeeId: 'EMP-0005', name: 'Kwame Osei',      dept: 'Logistique', time: '06:55', timestamp: Date.now() - 1000 * 60 * 195 },
    { id: 'CHK-004', type: 'IN',  employeeId: 'EMP-0012', name: 'Maame Dufie',     dept: 'Commercial', time: '07:00', timestamp: Date.now() - 1000 * 60 * 180 },
    { id: 'CHK-005', type: 'IN',  employeeId: 'EMP-0010', name: 'Adwoa Amponsah',  dept: 'IT',         time: '07:05', timestamp: Date.now() - 1000 * 60 * 175 },
    { id: 'CHK-006', type: 'IN',  employeeId: 'EMP-0002', name: 'Ama Asante',      dept: 'RH',         time: '07:10', timestamp: Date.now() - 1000 * 60 * 170 },
    { id: 'CHK-007', type: 'IN',  employeeId: 'EMP-0018', name: 'Akosua Ntiamoah', dept: 'Logistique', time: '07:10', timestamp: Date.now() - 1000 * 60 * 169 },
    { id: 'CHK-008', type: 'IN',  employeeId: 'EMP-0006', name: 'Akua Darko',      dept: 'Commercial', time: '07:15', timestamp: Date.now() - 1000 * 60 * 165 },
    { id: 'CHK-009', type: 'IN',  employeeId: 'EMP-0009', name: 'Kojo Appiah',     dept: 'Finance',    time: '07:20', timestamp: Date.now() - 1000 * 60 * 160 },
    { id: 'CHK-010', type: 'IN',  employeeId: 'EMP-0016', name: 'Araba Mensah',    dept: 'Finance',    time: '07:22', timestamp: Date.now() - 1000 * 60 * 158 },
    { id: 'CHK-011', type: 'IN',  employeeId: 'EMP-0003', name: 'Yao Kouassi',     dept: 'Finance',    time: '07:28', timestamp: Date.now() - 1000 * 60 * 152 },
    { id: 'CHK-012', type: 'IN',  employeeId: 'EMP-0014', name: 'Esi Amoah',       dept: 'Direction',  time: '07:29', timestamp: Date.now() - 1000 * 60 * 151 },
    { id: 'CHK-013', type: 'IN',  employeeId: 'EMP-0004', name: 'Efua Boateng',    dept: 'IT',         time: '07:35', timestamp: Date.now() - 1000 * 60 * 145 },
    { id: 'CHK-014', type: 'IN',  employeeId: 'EMP-0007', name: 'Nana Adjei',      dept: 'Production', time: '07:45', timestamp: Date.now() - 1000 * 60 * 135 },
    { id: 'CHK-015', type: 'IN',  employeeId: 'EMP-0008', name: 'Abena Frimpong',  dept: 'RH',         time: '08:02', timestamp: Date.now() - 1000 * 60 * 118 },
    { id: 'CHK-016', type: 'IN',  employeeId: 'EMP-0011', name: 'Fiifi Quaye',     dept: 'Logistique', time: '08:15', timestamp: Date.now() - 1000 * 60 * 105 },
    { id: 'CHK-017', type: 'IN',  employeeId: 'EMP-0017', name: 'Kofi Agyeman',    dept: 'IT',         time: '08:30', timestamp: Date.now() - 1000 * 60 * 90  },
    { id: 'CHK-018', type: 'OUT', employeeId: 'EMP-0001', name: 'Kofi Mensah',     dept: 'Direction',  time: '16:20', timestamp: Date.now() - 1000 * 60 * 60  },
    { id: 'CHK-019', type: 'OUT', employeeId: 'EMP-0013', name: 'Paa Kweku',       dept: 'Production', time: '16:55', timestamp: Date.now() - 1000 * 60 * 40  },
    { id: 'CHK-020', type: 'OUT', employeeId: 'EMP-0009', name: 'Kojo Appiah',     dept: 'Finance',    time: '17:25', timestamp: Date.now() - 1000 * 60 * 15  },
    { id: 'CHK-021', type: 'OUT', employeeId: 'EMP-0005', name: 'Kwame Osei',      dept: 'Logistique', time: '17:50', timestamp: Date.now() - 1000 * 60 * 5   },
]

const delay = (ms = 250) => new Promise(r => setTimeout(r, ms))

// =============================================================================
// SNAPSHOT — appelé en polling toutes les 5s
// =============================================================================
export async function getPresenceSnapshot(): Promise<PresenceSnapshot> {

    // ── MODE MOCK ──────────────────────────────────────────────────────────────
    if (USE_MOCK) {
        await delay(200)
        const presentCount  = _mockEmployees.filter(e => e.present).length
        const arrivedToday  = _mockEmployees.filter(e => e.arrivalTime).length
        const departedToday = _mockEmployees.filter(e => e.departureTime).length
        const stats: DashboardStats = {
            totalEmployees: TOTAL_EMPLOYEES,
            presentCount,
            arrivedToday,
            departedToday,
            pendingArrival: TOTAL_EMPLOYEES - arrivedToday,
            presenceRate:   Math.round(presentCount / TOTAL_EMPLOYEES * 100),
        }
        return {
            employees: _mockEmployees.map(e => ({ ...e })),
            events:    [..._mockEvents].reverse(),
            stats,
        }
    }

    // ── MODE FRAPPE ────────────────────────────────────────────────────────────
    const today = todayStr()

    // Les deux appels Frappe en parallèle pour minimiser la latence
    const [frappeEmployees, checkins] = await Promise.all([
        fetchFrappeEmployees(),
        fetchFrappeCheckins(today),
    ])

    const { employees, events } = transformFrappeData(frappeEmployees, checkins, today)

    const presentCount  = employees.filter(e => e.present).length
    const arrivedToday  = employees.filter(e => e.arrivalTime).length
    const departedToday = employees.filter(e => e.departureTime).length
    const total         = employees.length

    const stats: DashboardStats = {
        totalEmployees: total,
        presentCount,
        arrivedToday,
        departedToday,
        pendingArrival: total - arrivedToday,
        presenceRate:   total === 0 ? 0 : Math.round(presentCount / total * 100),
    }

    return { employees, events, stats }
}

// =============================================================================
// ANALYTICS — ventilation horaire pour une date donnée
// =============================================================================
export async function getAnalytics(date?: string): Promise<AnalyticsData> {

    // ── MODE MOCK ──────────────────────────────────────────────────────────────
    if (USE_MOCK) {
        await delay(300)
        // La logique de departureTime dans mockData respecte déjà les règles
        // (seuls les vrais départs définitifs ont une departureTime non nulle)
        return {
            earlyArrivals:   _mockEmployees.filter(e => e.arrivalTime   && timeToMinutes(e.arrivalTime)   <  timeToMinutes(ARRIVAL_THRESHOLD)),
            lateArrivals:    _mockEmployees.filter(e => e.arrivalTime   && timeToMinutes(e.arrivalTime)   >= timeToMinutes(ARRIVAL_THRESHOLD)),
            earlyDepartures: _mockEmployees.filter(e => e.departureTime && timeToMinutes(e.departureTime) <  timeToMinutes(DEPARTURE_THRESHOLD)),
            lateDepartures:  _mockEmployees.filter(e => e.departureTime && timeToMinutes(e.departureTime) >= timeToMinutes(DEPARTURE_THRESHOLD)),
        }
    }

    // ── MODE FRAPPE ────────────────────────────────────────────────────────────
    const targetDate = date ?? todayStr()

    const [frappeEmployees, checkins] = await Promise.all([
        fetchFrappeEmployees(),
        fetchFrappeCheckins(targetDate),
    ])

    const { employees } = transformFrappeData(frappeEmployees, checkins, targetDate)

    return {
        earlyArrivals:   employees.filter(e => e.arrivalTime   && timeToMinutes(e.arrivalTime)   < timeToMinutes(ARRIVAL_THRESHOLD)),
        lateArrivals:    employees.filter(e => e.arrivalTime   && timeToMinutes(e.arrivalTime)  >= timeToMinutes(ARRIVAL_THRESHOLD)),
        earlyDepartures: employees.filter(e => e.departureTime && timeToMinutes(e.departureTime) < timeToMinutes(DEPARTURE_THRESHOLD)),
        lateDepartures:  employees.filter(e => e.departureTime && timeToMinutes(e.departureTime) >= timeToMinutes(DEPARTURE_THRESHOLD)),
    }
}

// =============================================================================
// MOVEMENTS — checkins pour une date donnée (pour le sélecteur de date)
// =============================================================================
export async function getMovements(date: string): Promise<BadgeEvent[]> {

    // ── MODE MOCK ──────────────────────────────────────────────────────────────
    if (USE_MOCK) {
        await delay(300)
        const today = todayStr()
        // Retourne les vrais events mock si c'est aujourd'hui, sinon simule un historique
        if (date === today) {
            return [..._mockEvents].reverse()
        }
        // Pour les autres jours, génère des données aléatoires simulées
        const names = _mockEmployees.map(e => ({ id: e.id, name: e.name, dept: e.dept }))
        const events: BadgeEvent[] = []
        names.slice(0, Math.floor(Math.random() * 8) + 6).forEach((emp, i) => {
            const hIn  = String(6 + Math.floor(Math.random() * 3)).padStart(2, '0')
            const mIn  = String(Math.floor(Math.random() * 60)).padStart(2, '0')
            const hOut = String(16 + Math.floor(Math.random() * 3)).padStart(2, '0')
            const mOut = String(Math.floor(Math.random() * 60)).padStart(2, '0')
            events.push({ id: `${date}-IN-${i}`,  type: 'IN',  employeeId: emp.id, name: emp.name, dept: emp.dept, time: `${hIn}:${mIn}`,   timestamp: 0 })
            events.push({ id: `${date}-OUT-${i}`, type: 'OUT', employeeId: emp.id, name: emp.name, dept: emp.dept, time: `${hOut}:${mOut}`, timestamp: 0 })
        })
        return events.sort((a, b) => a.time.localeCompare(b.time)).reverse()
    }

    // ── MODE FRAPPE ────────────────────────────────────────────────────────────
    const [frappeEmployees, checkins] = await Promise.all([
        fetchFrappeEmployees(),
        fetchFrappeCheckins(date),
    ])
    // On utilise transformFrappeData pour avoir la logique départ correcte
    const { events: evts } = transformFrappeData(frappeEmployees, checkins, date)
    return evts

}
