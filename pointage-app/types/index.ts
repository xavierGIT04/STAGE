// =============================================================================
// TYPES INTERNES — utilisés dans toute l'application
// =============================================================================

export interface Employee {
  id: string          // = Frappe "name" ex: "EMP-0001"
  matricule: string   // = attendance_device_id
  name: string        // = employee_name
  dept: string        // = department
  role: string        // = designation
  arrivalTime: string | null   // "HH:mm" — extrait du premier checkin IN du jour
  departureTime: string | null // "HH:mm" — extrait du dernier checkin OUT du jour
  present: boolean    // true si le dernier checkin du jour est IN
}

export interface BadgeEvent {
  id: string          // = Frappe "name" du Employee Checkin
  type: 'IN' | 'OUT' // = log_type
  employeeId: string  // = employee (Frappe ID)
  name: string        // = employee_name
  dept: string        // = department
  time: string        // "HH:mm" — extrait de "time"
  timestamp: number   // ms Unix
}

export interface DashboardStats {
  totalEmployees: number
  presentCount: number
  arrivedToday: number
  departedToday: number
  pendingArrival: number
  presenceRate: number // entier 0–100
}

export interface AnalyticsData {
  earlyArrivals: Employee[]    // arrivalTime < "07:30"
  lateArrivals: Employee[]     // arrivalTime >= "07:30"
  earlyDepartures: Employee[]  // departureTime < "17:30"
  lateDepartures: Employee[]   // departureTime >= "17:30"
}

export interface PresenceSnapshot {
  employees: Employee[]
  events: BadgeEvent[]
  stats: DashboardStats
}

// =============================================================================
// TYPES FRAPPE HR — réponses brutes de l'API Frappe
// =============================================================================

/** Réponse générique Frappe : { data: T } */
export interface FrappeListResponse<T> {
  data: T[]
}

/** Employee Checkin tel que retourné par Frappe */
export interface FrappeCheckin {
  name: string           // ID du document ex: "EMP-CHK-2024-00123"
  employee: string       // ex: "EMP-0001"
  employee_name: string  // ex: "Kofi Mensah"
  department: string     // ex: "IT"
  log_type: 'IN' | 'OUT'
  time: string           // ex: "2024-03-14 08:15:00"
}

/** Employee tel que retourné par Frappe */
export interface FrappeEmployee {
  name: string                     // ID Frappe ex: "EMP-0001"
  employee_name: string            // Nom complet
  department: string
  designation: string
  attendance_device_id: string     // Lien avec le badge physique / app mobile
}
