"""
═══════════════════════════════════════════════════════════════════════════════
  SIMULATEUR BIOMÉTRIQUE — Frappe HR
  Simule les pointages IN/OUT comme le ferait un vrai appareil biométrique
═══════════════════════════════════════════════════════════════════════════════

  Usage :
    python simulateur.py            → menu interactif
    python simulateur.py --auto     → simulation automatique toute la journée

  Prérequis :
    pip install requests
"""

import requests
import json
import time
import random
from datetime import datetime, timedelta
import argparse

# ─── Configuration Frappe ─────────────────────────────────────────────────────

FRAPPE_URL    = "https://pointage-demo.l.frappe.cloud"
API_KEY       = "9b8402da909c3dc"
API_SECRET    = "cb0c016bca52738"

HEADERS = {
    "Authorization": f"token {API_KEY}:{API_SECRET}",
    "Content-Type":  "application/json",
}

# ─── Employés (attendance_device_id → nom) ────────────────────────────────────

EMPLOYEES = {
    "EMP001": "Kofi Mensah",
    "EMP002": "Ama Asante",
    "EMP003": "Ama Kouassi",
    "EMP004": "Efua Boateng",
    "EMP005": "Kwame Osei",
    "EMP006": "Nana Adjei",
    "EMP007": "Abena Frimpong",
    "EMP008": "Kojo Appiah",
    "EMP009": "Adwoa Amponsah",
    "EMP0010": "Fiifi Quaye",
}

# ─── Endpoint Frappe ──────────────────────────────────────────────────────────

ENDPOINT = (
    f"{FRAPPE_URL}/api/method/"
    "hrms.hr.doctype.employee_checkin.employee_checkin"
    ".add_log_based_on_employee_field"
)

# ─── Fonction principale de badge ─────────────────────────────────────────────

def badge(device_id: str, log_type: str, timestamp: str = None) -> dict:
    """
    Envoie un pointage vers Frappe HR.

    Args:
        device_id  : attendance_device_id de l'employé (ex: "EMP001")
        log_type   : "IN" ou "OUT"
        timestamp  : "YYYY-MM-DD HH:MM:SS" — si None, utilise l'heure actuelle

    Returns:
        La réponse Frappe (dict)
    """
    if timestamp is None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    payload = {
        "employee_field_value": device_id,
        "timestamp":            timestamp,
        "log_type":             log_type,
        "device_id":            "SIMULATEUR-PYTHON",
        "employee_fieldname":   "attendance_device_id",
    }

    print(f"\n  ▶ Badge {log_type:3s} | {EMPLOYEES.get(device_id, device_id)} ({device_id}) | {timestamp}")

    try:
        res = requests.post(ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        res.raise_for_status()
        data = res.json()
        print(f"  ✅ Succès — Checkin ID : {data.get('message', {}).get('name', '?')}")
        return data
    except requests.exceptions.HTTPError as e:
        print(f"  ❌ Erreur HTTP {res.status_code} : {res.text}")
        raise
    except requests.exceptions.ConnectionError:
        print(f"  ❌ Impossible de joindre Frappe Cloud — vérifier l'URL")
        raise
    except Exception as e:
        print(f"  ❌ Erreur : {e}")
        raise


# ═══════════════════════════════════════════════════════════════════════════════
# MODE INTERACTIF — menu pour choisir l'employé et le type de pointage
# ═══════════════════════════════════════════════════════════════════════════════

def mode_interactif():
    print("\n" + "═" * 60)
    print("   SIMULATEUR BIOMÉTRIQUE — Mode interactif")
    print("═" * 60)

    while True:
        print("\n📋 Employés disponibles :")
        for i, (device_id, name) in enumerate(EMPLOYEES.items(), 1):
            print(f"   {i:2d}. {name:<25} ({device_id})")
        print(f"   {'0':>2}. Quitter")

        choix = input("\n→ Numéro de l'employé : ").strip()

        if choix == "0":
            print("\nAu revoir !\n")
            break

        try:
            idx = int(choix) - 1
            device_id = list(EMPLOYEES.keys())[idx]
        except (ValueError, IndexError):
            print("❌ Choix invalide")
            continue

        print(f"\n📌 Type de pointage pour {EMPLOYEES[device_id]} :")
        print("   1. IN  (Arrivée)")
        print("   2. OUT (Départ)")

        type_choix = input("→ Choix : ").strip()

        if type_choix == "1":
            log_type = "IN"
        elif type_choix == "2":
            log_type = "OUT"
        else:
            print("❌ Choix invalide")
            continue

        timestamp = input(
            "→ Heure (YYYY-MM-DD HH:MM:SS) ou Entrée pour maintenant : "
        ).strip()

        if not timestamp:
            timestamp = None

        try:
            badge(device_id, log_type, timestamp)
        except Exception:
            pass

        continuer = input("\n→ Autre pointage ? (o/n) : ").strip().lower()
        if continuer != "o":
            print("\nAu revoir !\n")
            break


# ═══════════════════════════════════════════════════════════════════════════════
# MODE AUTO — simule une journée complète réaliste
# ═══════════════════════════════════════════════════════════════════════════════

def mode_auto():
    """
    Simule une journée de travail complète.

    Pour chaque employé :
      - Arrivée entre 06h30 et 08h30 (heure aléatoire)
      - Départ entre 16h30 et 18h30 (heure aléatoire)

    Les pointages sont envoyés avec l'heure simulée du jour actuel.
    """
    print("\n" + "═" * 60)
    print("   SIMULATEUR BIOMÉTRIQUE — Mode automatique")
    print("   Simulation d'une journée complète")
    print("═" * 60)

    today = datetime.now().strftime("%Y-%m-%d")

    # ── Génère les horaires aléatoires ────────────────────────────────────────
    pointages = []

    for device_id, name in EMPLOYEES.items():
        # Arrivée : entre 06h30 et 08h30
        arrivee_min = datetime.strptime(f"{today} 06:30:00", "%Y-%m-%d %H:%M:%S")
        arrivee     = arrivee_min + timedelta(minutes=random.randint(0, 120))

        # Départ : entre 16h30 et 18h30
        depart_min = datetime.strptime(f"{today} 16:30:00", "%Y-%m-%d %H:%M:%S")
        depart     = depart_min + timedelta(minutes=random.randint(0, 120))

        pointages.append((arrivee, device_id, "IN"))
        pointages.append((depart,  device_id, "OUT"))

    # ── Trie par heure croissante (comme un vrai système) ─────────────────────
    pointages.sort(key=lambda x: x[0])

    print(f"\n📅 Simulation du {today}")
    print(f"   {len(EMPLOYEES)} employés — {len(pointages)} pointages à envoyer\n")

    succes  = 0
    echecs  = 0
    delai   = 0.5  # secondes entre chaque envoi (évite de surcharger Frappe)

    for heure, device_id, log_type in pointages:
        timestamp = heure.strftime("%Y-%m-%d %H:%M:%S")
        try:
            badge(device_id, log_type, timestamp)
            succes += 1
        except Exception:
            echecs += 1
        time.sleep(delai)

    # ── Résumé ────────────────────────────────────────────────────────────────
    print("\n" + "═" * 60)
    print(f"   ✅ Succès : {succes}")
    print(f"   ❌ Échecs : {echecs}")
    print(f"   📊 Total  : {len(pointages)}")
    print("═" * 60 + "\n")


# ═══════════════════════════════════════════════════════════════════════════════
# MODE TEMPS RÉEL — envoie des pointages aléatoires toutes les N secondes
# Pour démontrer le temps réel dans le frontend
# ═══════════════════════════════════════════════════════════════════════════════

def mode_temps_reel(intervalle: int = 10):
    """
    Envoie un pointage aléatoire toutes les `intervalle` secondes.
    Parfait pour démontrer la mise à jour temps réel du frontend.
    Ctrl+C pour arrêter.
    """
    print("\n" + "═" * 60)
    print("   SIMULATEUR BIOMÉTRIQUE — Mode temps réel")
    print(f"   Un pointage aléatoire toutes les {intervalle} secondes")
    print("   Ctrl+C pour arrêter")
    print("═" * 60)

    # Suivi de l'état IN/OUT de chaque employé
    etats = {device_id: "OUT" for device_id in EMPLOYEES}

    try:
        while True:
            # Choisit un employé au hasard
            device_id = random.choice(list(EMPLOYEES.keys()))

            # Alterne IN/OUT selon l'état actuel
            log_type         = "IN" if etats[device_id] == "OUT" else "OUT"
            etats[device_id] = log_type

            try:
                badge(device_id, log_type)
            except Exception:
                pass

            print(f"\n   ⏱  Prochain pointage dans {intervalle} secondes... (Ctrl+C pour arrêter)")
            time.sleep(intervalle)

    except KeyboardInterrupt:
        print("\n\n   Simulation arrêtée.\n")


# ═══════════════════════════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulateur biométrique Frappe HR")
    parser.add_argument("--auto",      action="store_true", help="Simulation automatique journée complète")
    parser.add_argument("--realtime",  action="store_true", help="Pointages aléatoires en temps réel")
    parser.add_argument("--intervalle", type=int, default=10, help="Secondes entre chaque pointage (mode temps réel)")
    args = parser.parse_args()

    if args.auto:
        mode_auto()
    elif args.realtime:
        mode_temps_reel(args.intervalle)
    else:
        # Menu principal
        print("\n" + "═" * 60)
        print("   SIMULATEUR BIOMÉTRIQUE — Frappe HR")
        print("═" * 60)
        print("\n   1. Mode interactif  (choisir manuellement)")
        print("   2. Mode automatique (journée complète)")
        print("   3. Mode temps réel  (pointages aléatoires continus)")

        choix = input("\n→ Choix : ").strip()

        if choix == "1":
            mode_interactif()
        elif choix == "2":
            mode_auto()
        elif choix == "3":
            intervalle = input("→ Intervalle en secondes (défaut 10) : ").strip()
            mode_temps_reel(int(intervalle) if intervalle.isdigit() else 10)
        else:
            print("❌ Choix invalide")
