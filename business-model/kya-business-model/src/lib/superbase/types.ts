
export type Statut = 'draft' | 'en_cours' | 'finalise' | 'archive'
export type TypeCalcul = 'fixe' | 'pourcentage'
export type TypeFinancement = 'emprunt' | 'fonds_propres' | 'subvention' | 'autre'
export type TypeConcurrent = 'direct' | 'indirect' | 'substitut'
export type Probabilite = 'faible' | 'moyenne' | 'elevee'
export type NiveauRisque = 'faible' | 'modere' | 'eleve' | 'critique'
export type CategorieSegment = 'institution_publique' | 'institution_privee' | 'menage' | 'autre'
export type CategorieCanal = 'reseaux_sociaux' | 'autre'

// ─── PROJETS (mis à jour) ────────────────────────────────────
export interface Projet {
    id: string
    nom: string
    numero_projet?: string
    description?: string
    secteur?: string
    produit_principal?: string
    annee_demarrage?: number
    duree_projet?: number
    devise: string
    statut: Statut
    modele: string
    // NOUVEAUX CHAMPS
    promoteur?: string
    cout_total?: number
    pays_execution?: string
    created_at: string
    updated_at: string
}

// ─── PROFIL GLOBAL (nouveau) ─────────────────────────────────
export interface ProfilEntrepriseGlobal {
    id: string
    nom_entreprise?: string
    slogan?: string
    mission?: string
    vision?: string
    valeurs?: string
    notre_societe?: string
    notre_histoire?: string
    certifications?: string
    annee_creation?: number
    localisation?: string
    effectif?: string
    expertise_cle?: string
    created_at: string
    updated_at: string
}

// ─── PROFIL PAR PROJET (mis à jour) ──────────────────────────
export interface EntrepriseProfil {
    id: string
    projet_id: string
    nom_entreprise?: string
    slogan?: string
    mission?: string
    vision?: string
    valeurs?: string
    notre_societe?: string   // NOUVEAU
    notre_histoire?: string  // NOUVEAU
    certifications?: string
    annee_creation?: number
    localisation?: string
    effectif?: string
    expertise_cle?: string
}

// ─── PARTENAIRES FINANCIERS (mis à jour) ─────────────────────
export interface PartenaireFinancier {
    id: string
    projet_id: string
    nom: string
    type_financement?: TypeFinancement
    type_financement_libre?: string  // NOUVEAU — si type = 'autre'
    role_projet?: string             // NOUVEAU
    montant: number
    taux_interet: number
    duree_annees: number
    conditions?: string
}

// ─── CONCURRENTS (mis à jour) ────────────────────────────────
export interface Concurrent {
    id: string
    projet_id: string
    nom: string
    type?: TypeConcurrent
    produit_solution?: string
    forces?: string
    faiblesses?: string
    notre_differenciation?: string
    avantage_concurrentiel?: string  // NOUVEAU
}

// ─── RISQUES (mis à jour) ────────────────────────────────────
export interface RisqueProjet {
    id: string
    projet_id: string
    categorie?: string
    categorie_libre?: string  // NOUVEAU — si categorie = 'Autre'
    description: string
    probabilite?: Probabilite
    impact?: string
    niveau_risque?: NiveauRisque
    mesure_mitigation?: string
    responsable?: string
}

// ─── SEGMENTS CLIENTÈLE (nouveau) ───────────────────────────
export interface SegmentClientele {
    id: string
    projet_id: string
    libelle: string
    categorie?: CategorieSegment
    categorie_libre?: string  // si categorie = 'autre'
    created_at: string
}

// ─── RELATIONS CLIENTÈLE (nouveau) ──────────────────────────
export interface RelationClientele {
    id: string
    projet_id: string
    libelle: string
    created_at: string
}

// ─── CANAUX DISTRIBUTION (nouveau) ──────────────────────────
export interface CanalDistribution {
    id: string
    projet_id: string
    libelle: string
    categorie?: CategorieCanal
    categorie_libre?: string  // si categorie = 'autre'
    created_at: string
}

// ─── ONGLETS PARTENAIRES DYNAMIQUES (nouveau) ────────────────
export interface TypeOngletPartenaire {
    id: string
    projet_id: string
    label: string
    ordre: number
    created_at: string
}

// ─── PARTENAIRES CUSTOM (nouveau) ───────────────────────────
export interface PartenaireCustom {
    id: string
    projet_id: string
    onglet_id: string
    nom: string
    role?: string
    apport?: string
    contact?: string
    created_at: string
}

// ─── TYPES INCHANGÉS ─────────────────────────────────────────
export interface Produit {
    id: string
    projet_id: string
    nom: string
    description?: string
    proposition_valeur?: string
    unite_vente?: string
    marge_securite: number
}

export interface Composant {
    id: string
    produit_id: string
    libelle: string
    quantite: number
    prix_unitaire: number
    categorie?: string
}

export interface Hypothese {
    id: string
    projet_id: string
    cle: string
    valeur: number
    unite?: string
    section?: string
    description?: string
}

export interface Capex {
    id: string
    projet_id: string
    libelle: string
    montant: number
    taux_amortissement: number
    categorie?: string
}

export interface Opex {
    id: string
    projet_id: string
    libelle: string
    type_calcul: TypeCalcul
    valeur: number
    categorie?: string
}

export interface Revenu {
    id: string
    projet_id: string
    produit_id: string
    annee: number
    volume: number
    prix_unitaire_ht: number
}

export interface PartenaireTechnique {
    id: string
    projet_id: string
    nom: string
    type?: string
    role?: string
    apport?: string
    contact?: string
}

export interface ImpactProjet {
    id: string
    projet_id: string
    categorie?: string
    indicateur: string
    valeur?: string
    unite?: string
    description?: string
    odd?: string
}

export interface ResultatFinancier {
    id: string
    projet_id: string
    annee: number
    ca_total: number
    cout_revient: number
    marge_brute: number
    ebitda: number
    ebit: number
    resultat_net: number
    tresorerie: number
}
