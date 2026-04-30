-- ============================================================
-- KYA BUSINESS MODEL — MIGRATION v2
-- À exécuter dans Supabase SQL Editor (ordre important)
-- ============================================================

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
