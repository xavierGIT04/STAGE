import type { Employee } from '@/types'

export const TOTAL_EMPLOYEES = 47
export const ARRIVAL_THRESHOLD   = '07:30'
export const DEPARTURE_THRESHOLD = '17:30'

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// IDs en string pour coller avec Frappe (ex: "EMP-0001")
export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'EMP-0001', matricule: 'DEV-001', name: 'Kofi Mensah',     dept: 'Direction',  role: 'Directeur Général',    arrivalTime: '06:45', departureTime: '16:20', present: false },
  { id: 'EMP-0002', matricule: 'DEV-002', name: 'Ama Asante',      dept: 'RH',         role: 'DRH',                  arrivalTime: '07:10', departureTime: null,    present: false },
  { id: 'EMP-0003', matricule: 'DEV-003', name: 'Yao Kouassi',     dept: 'Finance',    role: 'Comptable',            arrivalTime: '07:28', departureTime: null,    present: false },
  { id: 'EMP-0004', matricule: 'DEV-004', name: 'Efua Boateng',    dept: 'IT',         role: 'Développeur',          arrivalTime: '07:35', departureTime: null,    present: false },
  { id: 'EMP-0005', matricule: 'DEV-005', name: 'Kwame Osei',      dept: 'Logistique', role: 'Responsable Stock',    arrivalTime: '06:55', departureTime: '17:50', present: false },
  { id: 'EMP-0006', matricule: 'DEV-006', name: 'Akua Darko',      dept: 'Commercial', role: 'Commercial',           arrivalTime: '07:15', departureTime: null,    present: false },
  { id: 'EMP-0007', matricule: 'DEV-007', name: 'Nana Adjei',      dept: 'Production', role: 'Chef de ligne',        arrivalTime: '07:45', departureTime: null,    present: false },
  { id: 'EMP-0008', matricule: 'DEV-008', name: 'Abena Frimpong',  dept: 'RH',         role: 'Assistante RH',        arrivalTime: '08:02', departureTime: null,    present: false },
  { id: 'EMP-0009', matricule: 'DEV-009', name: 'Kojo Appiah',     dept: 'Finance',    role: 'Auditeur',             arrivalTime: '07:20', departureTime: '17:25', present: false },
  { id: 'EMP-0010', matricule: 'DEV-010', name: 'Adwoa Amponsah',  dept: 'IT',         role: 'Administrateur',       arrivalTime: '07:05', departureTime: null,    present: false },
  { id: 'EMP-0011', matricule: 'DEV-011', name: 'Fiifi Quaye',     dept: 'Logistique', role: 'Magasinier',           arrivalTime: '08:15', departureTime: null,    present: false },
  { id: 'EMP-0012', matricule: 'DEV-012', name: 'Maame Dufie',     dept: 'Commercial', role: 'Commerciale',          arrivalTime: '07:00', departureTime: null,    present: false },
  { id: 'EMP-0013', matricule: 'DEV-013', name: 'Paa Kweku',       dept: 'Production', role: 'Opérateur',            arrivalTime: '06:30', departureTime: '16:55', present: false },
  { id: 'EMP-0014', matricule: 'DEV-014', name: 'Esi Amoah',       dept: 'Direction',  role: 'Assistante de Dir.',   arrivalTime: '07:29', departureTime: null,    present: false },
  { id: 'EMP-0015', matricule: 'DEV-015', name: 'Kwesi Tetteh',    dept: 'RH',         role: 'Chargé RH',            arrivalTime: '07:50', departureTime: null,    present: false },
  { id: 'EMP-0016', matricule: 'DEV-016', name: 'Araba Mensah',    dept: 'Finance',    role: 'DAF',                  arrivalTime: '07:22', departureTime: null,    present: false },
  { id: 'EMP-0017', matricule: 'DEV-017', name: 'Kofi Agyeman',    dept: 'IT',         role: 'Support technique',    arrivalTime: '08:30', departureTime: null,    present: false },
  { id: 'EMP-0018', matricule: 'DEV-018', name: 'Akosua Ntiamoah', dept: 'Logistique', role: 'Responsable livraison', arrivalTime: '07:10', departureTime: null,   present: false },
]
