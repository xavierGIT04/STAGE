-- ============================================================
-- PROJETS
create table projets (
  id uuid default gen_random_uuid() primary key,
  nom text not null,
  numero_projet text,
  description text,
  secteur text,
  produit_principal text,
  annee_demarrage integer,
  duree_projet integer,
  devise text default 'FCFA',
  statut text default 'draft',
  modele text default 'lancement_produit',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- QUI SOMMES NOUS
create table entreprise_profil (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  nom_entreprise text,
  slogan text,
  mission text,
  vision text,
  valeurs text,
  certifications text,
  annee_creation integer,
  localisation text,
  effectif text,
  expertise_cle text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- PRODUITS
create table produits (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  nom text not null,
  description text,
  proposition_valeur text,
  unite_vente text,
  marge_securite numeric default 0.1,
  created_at timestamp with time zone default now()
);

-- COMPOSANTS
create table composants (
  id uuid default gen_random_uuid() primary key,
  produit_id uuid references produits(id) on delete cascade,
  libelle text not null,
  quantite numeric default 1,
  prix_unitaire numeric default 0,
  categorie text,
  created_at timestamp with time zone default now()
);

-- HYPOTHESES
create table hypotheses (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  cle text not null,
  valeur numeric,
  unite text,
  section text,
  description text,
  created_at timestamp with time zone default now()
);

-- CAPEX
create table capex (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  libelle text not null,
  montant numeric default 0,
  taux_amortissement numeric default 0.1,
  categorie text,
  created_at timestamp with time zone default now()
);

-- OPEX
create table opex (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  libelle text not null,
  type_calcul text default 'fixe',
  valeur numeric default 0,
  categorie text,
  created_at timestamp with time zone default now()
);

-- REVENUS
create table revenus (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  produit_id uuid references produits(id) on delete cascade,
  annee integer,
  volume integer default 0,
  prix_unitaire_ht numeric default 0,
  created_at timestamp with time zone default now()
);

-- PARTENAIRES FINANCIERS
create table partenaires_financiers (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  nom text not null,
  type_financement text,
  montant numeric default 0,
  taux_interet numeric default 0,
  duree_annees integer default 0,
  conditions text,
  created_at timestamp with time zone default now()
);

-- CONCURRENTS
create table concurrents (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  nom text not null,
  type text,
  produit_solution text,
  forces text,
  faiblesses text,
  notre_differenciation text,
  created_at timestamp with time zone default now()
);

-- RESULTATS FINANCIERS (cache des calculs)
create table resultats_financiers (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  annee integer,
  ca_total numeric default 0,
  cout_revient numeric default 0,
  marge_brute numeric default 0,
  ebitda numeric default 0,
  ebit numeric default 0,
  resultat_net numeric default 0,
  tresorerie numeric default 0,
  created_at timestamp with time zone default now()
);

-- Partenaires techniques
create table partenaires_techniques (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  nom text not null,
  type text,
  role text,
  apport text,
  contact text,
  created_at timestamp with time zone default now()
);

-- Impacts du projet
create table impacts_projet (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  categorie text,
  indicateur text not null,
  valeur text,
  unite text,
  description text,
  odd text,
  created_at timestamp with time zone default now()
);

-- Risques du projet
create table risques_projet (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  categorie text,
  description text not null,
  probabilite text,
  impact text,
  niveau_risque text,
  mesure_mitigation text,
  responsable text,
  created_at timestamp with time zone default now()
);

-- LOG DES MODIFICATIONS
create table logs_modifications (
  id uuid default gen_random_uuid() primary key,
  projet_id uuid references projets(id) on delete cascade,
  table_modifiee text,
  champ text,
  ancienne_valeur text,
  nouvelle_valeur text,
  created_at timestamp with time zone default now()
);


-- MISE A JOUR AUTOMATIQUE updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_projets_updated_at
  before update on projets
  for each row execute function update_updated_at();

create trigger update_entreprise_updated_at
  before update on entreprise_profil
  for each row execute function update_updated_at();



-- ────────────────────────────────────────────────────────────
-- 1. TABLE : profil_entreprise_global
--    Données partagées entre tous les projets
-- ────────────────────────────────────────────────────────────
create table if not exists profil_entreprise_global (
  id               uuid default gen_random_uuid() primary key,
  nom_entreprise   text,
  slogan           text,
  mission          text,
  vision           text,
  valeurs          text,
  notre_societe    text,
  notre_histoire   text,
  certifications   text,
  annee_creation   integer,
  localisation     text,
  effectif         text,
  expertise_cle    text,
  created_at       timestamp with time zone default now(),
  updated_at       timestamp with time zone default now()
);

create trigger update_profil_global_updated_at
  before update on profil_entreprise_global
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 2. MODIFICATIONS : entreprise_profil (par projet)
--    Ajout des champs 'notre_societe' et 'notre_histoire'
-- ────────────────────────────────────────────────────────────
alter table entreprise_profil
  add column if not exists notre_societe  text,
  add column if not exists notre_histoire text;

-- ────────────────────────────────────────────────────────────
-- 3. MODIFICATIONS : projets
--    Ajout promoteur, cout_total, pays_execution
-- ────────────────────────────────────────────────────────────
alter table projets
  add column if not exists promoteur        text,
  add column if not exists cout_total       numeric default 0,
  add column if not exists pays_execution   text;

-- ────────────────────────────────────────────────────────────
-- 4. MODIFICATIONS : hypotheses
--    Aucune modif DB — les nouvelles hypothèses sont des lignes
--    avec de nouvelles clés ('taux_retention', 'taux_conversion_premium')
--    Elles s'insèrent via l'interface sans changement de schéma.
-- ────────────────────────────────────────────────────────────
-- (pas de DDL nécessaire — la table hypotheses est key/value)

-- ────────────────────────────────────────────────────────────
-- 5. MODIFICATIONS : concurrents
--    Ajout 'avantage_concurrentiel'
-- ────────────────────────────────────────────────────────────
alter table concurrents
  add column if not exists avantage_concurrentiel text;

-- ────────────────────────────────────────────────────────────
-- 6. MODIFICATIONS : partenaires_financiers
--    Ajout 'role_projet' + 'type_financement_libre'
-- ────────────────────────────────────────────────────────────
alter table partenaires_financiers
  add column if not exists role_projet            text,
  add column if not exists type_financement_libre text;

-- ────────────────────────────────────────────────────────────
-- 7. MODIFICATIONS : risques_projet
--    Ajout 'categorie_libre' pour le cas "Autre"
-- ────────────────────────────────────────────────────────────
alter table risques_projet
  add column if not exists categorie_libre text;

-- ────────────────────────────────────────────────────────────
-- 8. NOUVELLE TABLE : segments_clientele
--    Onglet "Cible"
-- ────────────────────────────────────────────────────────────
create table if not exists segments_clientele (
  id              uuid default gen_random_uuid() primary key,
  projet_id       uuid references projets(id) on delete cascade,
  libelle         text not null,
  categorie       text,          -- 'institution_publique'|'institution_privee'|'menage'|'autre'
  categorie_libre text,          -- saisie si categorie = 'autre'
  created_at      timestamp with time zone default now()
);

-- ────────────────────────────────────────────────────────────
-- 9. NOUVELLE TABLE : relations_clientele
--    Onglet "Relation Clientèle"
-- ────────────────────────────────────────────────────────────
create table if not exists relations_clientele (
  id         uuid default gen_random_uuid() primary key,
  projet_id  uuid references projets(id) on delete cascade,
  libelle    text not null,
  created_at timestamp with time zone default now()
);

-- ────────────────────────────────────────────────────────────
-- 10. NOUVELLE TABLE : canaux_distribution
--     Onglet "Canaux de Distribution"
-- ────────────────────────────────────────────────────────────
create table if not exists canaux_distribution (
  id              uuid default gen_random_uuid() primary key,
  projet_id       uuid references projets(id) on delete cascade,
  libelle         text not null,
  categorie       text,          -- 'reseaux_sociaux'|'autre'
  categorie_libre text,          -- saisie si categorie = 'autre'
  created_at      timestamp with time zone default now()
);

-- ────────────────────────────────────────────────────────────
-- 11. NOUVELLE TABLE : types_onglets_partenaires
--     Permet d'ajouter dynamiquement de nouveaux onglets
-- ────────────────────────────────────────────────────────────
create table if not exists types_onglets_partenaires (
  id         uuid default gen_random_uuid() primary key,
  projet_id  uuid references projets(id) on delete cascade,
  label      text not null,
  ordre      integer default 0,
  created_at timestamp with time zone default now()
);

-- ────────────────────────────────────────────────────────────
-- 12. NOUVELLE TABLE : partenaires_custom
--     Partenaires appartenant à un onglet dynamique
-- ────────────────────────────────────────────────────────────
create table if not exists partenaires_custom (
  id         uuid default gen_random_uuid() primary key,
  projet_id  uuid references projets(id) on delete cascade,
  onglet_id  uuid references types_onglets_partenaires(id) on delete cascade,
  nom        text not null,
  role       text,
  apport     text,
  contact    text,
  created_at timestamp with time zone default now()
);

-- ────────────────────────────────────────────────────────────
-- RLS : activer Row Level Security si vous utilisez auth
-- ────────────────────────────────────────────────────────────
-- alter table profil_entreprise_global enable row level security;
-- alter table segments_clientele enable row level security;
-- alter table relations_clientele enable row level security;
-- alter table canaux_distribution enable row level security;
-- alter table types_onglets_partenaires enable row level security;
-- alter table partenaires_custom enable row level security;

-- ────────────────────────────────────────────────────────────
-- VÉRIFICATION : lister les nouvelles colonnes
-- ────────────────────────────────────────────────────────────
select table_name, column_name, data_type
from information_schema.columns
where table_name in (
  'projets','concurrents','partenaires_financiers',
  'risques_projet','entreprise_profil',
  'segments_clientele','relations_clientele',
  'canaux_distribution','types_onglets_partenaires',
  'partenaires_custom','profil_entreprise_global'
)
order by table_name, ordinal_position;


-- ============================================================
-- MIGRATION V2 — Moteur financier générique
-- À exécuter dans Supabase SQL Editor
-- Toutes les instructions sont idempotentes (IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 1 : TABLE projets — prorata temporis
-- ─────────────────────────────────────────────────────────────
alter table projets
  add column if not exists prorata_annee1 numeric default 1.0
    check (prorata_annee1 between 0 and 1);

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 2 : TABLE capex — colonnes amortissement enrichies
-- ─────────────────────────────────────────────────────────────
alter table capex
  add column if not exists methode_amort       text    default 'lineaire',
  add column if not exists duree_amortissement integer,
  add column if not exists annee_acquisition   integer,
  add column if not exists valeur_residuelle   numeric default 0;

-- Contrainte de valeur sur la méthode
alter table capex
  drop constraint if exists capex_methode_amort_check;
alter table capex
  add constraint capex_methode_amort_check
    check (methode_amort in ('lineaire','degressif','non_amorti'));

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 3 : TABLE opex — type_calcul enrichi + nouvelles colonnes
-- ─────────────────────────────────────────────────────────────
-- Mise à jour de la contrainte type_calcul pour inclure les nouveaux types
alter table opex
  drop constraint if exists opex_type_calcul_check;

alter table opex
  add column if not exists taux_croissance_annuel numeric default 0,
  add column if not exists annee_debut            integer,
  add column if not exists annee_fin              integer,
  add column if not exists produit_id             uuid references produits(id) on delete set null;

-- Contrainte mise à jour (inclut pct_capex, par_unite, manuel)
alter table opex
  add constraint opex_type_calcul_check
    check (type_calcul in ('fixe','pct_ca','pct_capex','par_unite','manuel'));

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 4 : NOUVELLE TABLE opex_annuel
--           (saisie manuelle année par année pour type_calcul = 'manuel')
-- ─────────────────────────────────────────────────────────────
create table if not exists opex_annuel (
  id         uuid    default gen_random_uuid() primary key,
  opex_id    uuid    references opex(id) on delete cascade,
  projet_id  uuid    references projets(id) on delete cascade,
  annee      integer not null,
  valeur     numeric default 0,
  created_at timestamp with time zone default now(),
  unique (opex_id, annee)
);

create index if not exists idx_opex_annuel_opex_id   on opex_annuel(opex_id);
create index if not exists idx_opex_annuel_projet_id on opex_annuel(projet_id);

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 5 : TABLE partenaires_financiers — méthode remboursement
-- ─────────────────────────────────────────────────────────────
alter table partenaires_financiers
  add column if not exists methode_remb   text    default 'capital_constant',
  add column if not exists differe_annees integer default 0;

alter table partenaires_financiers
  drop constraint if exists pf_methode_remb_check;
alter table partenaires_financiers
  add constraint pf_methode_remb_check
    check (methode_remb in ('capital_constant','annuite_constante','in_fine'));

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 6 : TABLE composants — taux de croissance du prix
-- ─────────────────────────────────────────────────────────────
alter table composants
  add column if not exists taux_croissance_prix numeric default 0;

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 7 : TABLE resultats_financiers — colonnes v2 manquantes
-- ─────────────────────────────────────────────────────────────
alter table resultats_financiers
  -- OPEX ventilé
  add column if not exists charges_personnel    numeric default 0,
  add column if not exists charges_marketing    numeric default 0,
  add column if not exists charges_rd           numeric default 0,
  add column if not exists charges_coord        numeric default 0,
  add column if not exists autres_charges       numeric default 0,
  add column if not exists total_opex           numeric default 0,
  -- Détail fiscal
  add column if not exists dotation_amort       numeric default 0,
  add column if not exists frais_financiers     numeric default 0,
  add column if not exists ebt                  numeric default 0,
  add column if not exists is_normal            numeric default 0,
  add column if not exists is_minimum           numeric default 0,
  add column if not exists impots               numeric default 0,
  -- CAF et trésorerie
  add column if not exists caf                        numeric default 0,
  add column if not exists remboursement_capital      numeric default 0,
  add column if not exists flux_net_exploitation      numeric default 0,
  add column if not exists flux_net_investissement    numeric default 0,
  add column if not exists flux_net_financement       numeric default 0,
  add column if not exists flux_tresorerie_annuel     numeric default 0,
  add column if not exists tresorerie_cumulee         numeric default 0,
  -- Bilan
  add column if not exists valeur_nette_comptable     numeric default 0,
  add column if not exists capitaux_propres           numeric default 0,
  add column if not exists dettes_financieres         numeric default 0,
  -- Unicité
  add column if not exists taux_encaissement         numeric default 1.0;

-- Contrainte d'unicité projet/année (évite les doublons lors du recalcul)
alter table resultats_financiers
  drop constraint if exists resultats_financiers_projet_annee_unique;
alter table resultats_financiers
  add constraint resultats_financiers_projet_annee_unique
    unique (projet_id, annee);

create index if not exists idx_resultats_projet_annee
  on resultats_financiers(projet_id, annee);

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 8 : NOUVELLE TABLE kpis_projet — cache des KPIs agrégés
-- ─────────────────────────────────────────────────────────────
create table if not exists kpis_projet (
  id                    uuid default gen_random_uuid() primary key,
  projet_id             uuid references projets(id) on delete cascade unique,
  van                   numeric,
  tri                   numeric,
  payback_annees        numeric,
  marge_brute_moy       numeric,
  marge_nette_moy       numeric,
  marge_ebitda_moy      numeric,
  total_capex           numeric,
  total_financement     numeric,
  seuil_rentabilite_ca  numeric,
  calcule_le            timestamp with time zone default now()
);

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 9 : TABLE hypotheses — contrainte d'unicité
--           (évite les doublons sur la même clé)
-- ─────────────────────────────────────────────────────────────
alter table hypotheses
  drop constraint if exists hypotheses_projet_cle_unique;
alter table hypotheses
  add constraint hypotheses_projet_cle_unique
    unique (projet_id, cle);

create index if not exists idx_hypotheses_projet_cle
  on hypotheses(projet_id, cle);

-- ─────────────────────────────────────────────────────────────
-- ÉTAPE 10 : VÉRIFICATION FINALE
-- ─────────────────────────────────────────────────────────────
select
  table_name,
  count(*) as nb_colonnes
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'projets','capex','opex','opex_annuel',
    'composants','partenaires_financiers',
    'resultats_financiers','kpis_projet','hypotheses'
  )
group by table_name
order by table_name;
