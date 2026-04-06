# Pointage Enterprise

Tableau de bord temps réel des présences — connecté à **Frappe HR**.

## Stack
- Next.js 15 · TypeScript 5 strict · React 19 · Tailwind CSS 3

---

## Installation

```bash
npm install
cp .env.example .env.local   # puis remplir les vraies valeurs
npm run dev
# → http://localhost:3000
```

---

## ⚙️ Configuration (.env.local)

```env
NEXT_PUBLIC_FRAPPE_URL=https://VOTRE-INSTANCE.frappe.cloud
NEXT_PUBLIC_FRAPPE_API_KEY=VOTRE_API_KEY
NEXT_PUBLIC_FRAPPE_API_SECRET=VOTRE_API_SECRET
```

Ces valeurs sont fournies par le dev Frappe HR.

---

## 🔄 Passer du mock au vrai Frappe

Dans `services/api.ts`, une seule ligne :

```ts
const USE_MOCK = false   // ← changer ici
```

---

## Architecture

```
├── .env.local              # Credentials Frappe (ne pas committer)
├── .env.example            # Template à partager
│
├── types/index.ts          # Types internes + types bruts Frappe
│
├── services/
│   ├── frappe.ts           # Client HTTP Frappe (auth + requêtes)
│   └── api.ts              # Logique métier + transformation Frappe → interne
│
├── hooks/
│   ├── usePresence.ts      # Polling snapshot toutes les 5s
│   └── useAnalytics.ts     # Données analytiques
│
└── components/
    ├── Header.tsx
    ├── Dashboard.tsx
    ├── PresenceCircle.tsx
    ├── EventLog.tsx
    ├── Analytics.tsx
    └── ui.tsx
```

---

## Comment les données Frappe sont transformées

Frappe expose deux endpoints que l'on consomme en parallèle :

| Endpoint Frappe | Ce qu'on lit |
|---|---|
| `GET /api/resource/Employee` | Liste des employés actifs |
| `GET /api/resource/Employee Checkin` | Checkins du jour (IN/OUT) |

La fonction `transformFrappeData()` dans `services/api.ts` calcule :

- `arrivalTime` = heure du **premier checkin IN** de la journée
- `departureTime` = heure du **dernier checkin OUT** de la journée
- `present = true` si le **dernier checkin** du jour est de type `IN`

---

## Ce que le dev Frappe doit vérifier

1. **Auto Attendance activé** sur les Shift Types
2. **Shift assigné** à chaque employé
3. **`attendance_device_id`** renseigné sur chaque fiche employé
4. User API créé avec droits lecture sur `Employee` et `Employee Checkin`
