export type Statut = 'draft' | 'en_cours' | 'finalise' | 'archive'
export type TypeCalcul = 'fixe' | 'pourcentage'
export type TypeFinancement = 'emprunt' | 'fonds_propres' | 'subvention' | 'autre'
export type TypeConcurrent = 'direct' | 'indirect' | 'substitut'
export type Probabilite = 'faible' | 'moyenne' | 'elevee'
export type NiveauRisque = 'faible' | 'modere' | 'eleve' | 'critique'

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
    created_at: string
    updated_at: string
}

export interface EntrepriseProfil {
    id: string
    projet_id: string
    nom_entreprise?: string
    slogan?: string
    mission?: string
    vision?: string
    valeurs?: string
    certifications?: string
    annee_creation?: number
    localisation?: string
    effectif?: string
    expertise_cle?: string
}

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

export interface PartenaireFinancier {
    id: string
    projet_id: string
    nom: string
    type_financement?: TypeFinancement
    montant: number
    taux_interet: number
    duree_annees: number
    conditions?: string
}

export interface Concurrent {
    id: string
    projet_id: string
    nom: string
    type?: TypeConcurrent
    produit_solution?: string
    forces?: string
    faiblesses?: string
    notre_differenciation?: string
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

export interface RisqueProjet {
    id: string
    projet_id: string
    categorie?: string
    description: string
    probabilite?: Probabilite
    impact?: string
    niveau_risque?: NiveauRisque
    mesure_mitigation?: string
    responsable?: string
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