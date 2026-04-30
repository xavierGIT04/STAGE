# Guide d'intégration — Refonte KYA Business Model v2

## Fichiers livrés

| Fichier | Description |
|---------|-------------|
| `01_migration.sql` | Script SQL à exécuter dans Supabase |
| `02_types.ts` | Types TypeScript mis à jour |
| `03_SectionPartenaires.tsx` | Section Partenaires fusionnée avec onglets dynamiques |
| `04_SectionSegmentClientele.tsx` | Nouvelle section Segment Clientèle (3 onglets) |
| `05_parametres_page.tsx` | Page Paramètres globaux de l'entreprise |

---

## Étape 1 — Base de données (Supabase)

1. Ouvrez **Supabase Dashboard → SQL Editor**
2. Copiez/collez le contenu de `01_migration.sql`
3. Cliquez **Run**
4. Vérifiez le résultat de la requête SELECT finale (liste des colonnes)

> ⚠️ La migration est additive — aucune donnée existante n'est supprimée.

---

## Étape 2 — Types TypeScript

Remplacez **entièrement** le fichier :
```
src/lib/superbase/types.ts
```
par le contenu de `02_types.ts`.

---

## Étape 3 — Section Partenaires (fusionnée)

### 3a. Copier le composant
```
src/components/sections/SectionPartenaires.tsx  ← remplacer par 03_SectionPartenaires.tsx
```

### 3b. Supprimer l'ancien composant technique (maintenant intégré)
Le fichier `SectionPartenairesTechniques.tsx` peut être supprimé ou conservé.

### 3c. Mettre à jour la page projet
Dans `src/app/(dashboard)/projets/[id]/page.tsx` :

**Remplacer les imports :**
```tsx
// AVANT
import SectionPartenaires from '@/components/sections/SectionPartenaires'
import SectionPartenairesTechniques from '@/components/sections/SectionPartenairesTechniques'

// APRÈS
import SectionPartenaires from '@/components/sections/SectionPartenaires'
// (supprimer l'import SectionPartenairesTechniques)
```

**Mettre à jour le SECTIONS array :**
```tsx
// AVANT — 2 entrées séparées
{ id: 7,  label: 'Partenaires financiers'   },
{ id: 9,  label: 'Partenaires techniques'   },

// APRÈS — 1 seule entrée fusionnée
{ id: 7,  label: 'Partenaires'              },
// Supprimer id: 9
```

**Mettre à jour renderSection() :**
```tsx
// AVANT
case 7:  return <SectionPartenaires        projetId={id} onSave={() => markSectionOk(7)}  />
case 9:  return <SectionPartenairesTechniques projetId={id} onSave={() => markSectionOk(9)}  />

// APRÈS
case 7:  return <SectionPartenaires        projetId={id} onSave={() => markSectionOk(7)}  />
// Supprimer case 9
```

> ⚠️ Recoter les ids suivants (10→9, 11→10, 12→11, 13→12) si vous voulez garder une numérotation continue.

---

## Étape 4 — Section Segment Clientèle (nouvelle)

### 4a. Créer le fichier
```
src/components/sections/SectionSegmentClientele.tsx  ← copier 04_SectionSegmentClientele.tsx
```

### 4b. Enregistrer dans la page projet

**Ajouter l'import :**
```tsx
import SectionSegmentClientele from '@/components/sections/SectionSegmentClientele'
```

**Ajouter dans SECTIONS :**
```tsx
{ id: 14, label: 'Segment Clientèle' },
```

**Ajouter dans renderSection() :**
```tsx
case 14: return <SectionSegmentClientele projetId={id} onSave={() => markSectionOk(14)} />
```

**Mettre à jour le numéro dans le composant** (`SECTION_NUMBER = 14`).

---

## Étape 5 — Page Paramètres globaux

### 5a. Créer le dossier et la page
```
src/app/(dashboard)/parametres/page.tsx  ← copier 05_parametres_page.tsx
```

### 5b. Ajouter le lien dans la Navbar
Dans `src/app/(dashboard)/layout.tsx`, ajoutez un lien vers `/parametres` :

```tsx
import Link from 'next/link'

// Dans la nav, à côté du logo ou en bas :
<Link href="/parametres" style={{ fontSize: '13px', color: '#fff', textDecoration: 'none' }}>
  ⚙ Paramètres
</Link>
```

---

## Étape 6 — Auto-remplissage à la création d'un projet

Dans `src/app/(dashboard)/projets/nouveau/page.tsx`, **après la création du projet**, récupérez le profil global et insérez-le dans `entreprise_profil` :

```tsx
const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  // 1. Créer le projet
  const { data, error } = await supabase
    .from('projets')
    .insert([{ ...form, modele: modeleChoisi, statut: 'draft' }])
    .select().single()

  if (error || !data) { setError('Erreur création.'); setLoading(false); return }

  // 2. NOUVEAU : Cloner le profil global dans le projet
  const { data: profilGlobal } = await supabase
    .from('profil_entreprise_global')
    .select('*')
    .limit(1)
    .single()

  if (profilGlobal) {
    const { id: _, created_at, updated_at, ...profilSansId } = profilGlobal
    await supabase.from('entreprise_profil').insert([{
      ...profilSansId,
      projet_id: data.id,
    }])
  }

  router.push(`/projets/${data.id}`)
}
```

---

## Étape 7 — Modifications des sections existantes

### SectionInformations.tsx — Ajout de 3 champs

Dans l'état `form`, ajouter :
```tsx
const [form, setForm] = useState({
  // ... champs existants ...
  promoteur:      projet.promoteur || '',
  cout_total:     projet.cout_total || 0,
  pays_execution: projet.pays_execution || '',
})
```

Dans le JSX, ajouter une section supplémentaire après les champs existants :
```tsx
{/* Nouveaux champs */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
  <div>
    <label style={labelStyle}>Promoteur du projet</label>
    <input
      type="text" value={form.promoteur}
      onChange={e => setForm({ ...form, promoteur: e.target.value })}
      placeholder="Ex : KYA-Energy Group"
      style={inputStyle}
    />
  </div>
  <div>
    <label style={labelStyle}>Coût total du projet (FCFA)</label>
    <input
      type="number" value={form.cout_total}
      onChange={e => setForm({ ...form, cout_total: parseFloat(e.target.value) })}
      style={inputStyle}
    />
  </div>
  <div>
    <label style={labelStyle}>Pays d'exécution</label>
    <input
      type="text" value={form.pays_execution}
      onChange={e => setForm({ ...form, pays_execution: e.target.value })}
      placeholder="Ex : Togo"
      style={inputStyle}
    />
  </div>
</div>
```

### SectionHypotheses.tsx — Ajout de 2 hypothèses

Dans la section `'Volumes & Croissance'` de `STRUCTURE`, ajouter après `taux_croissance` :
```tsx
{
  cle: 'taux_retention',
  label: 'Taux de rétention annuel',
  unite: '%',
  description: 'Ex : 85 pour 85%. Part des clients conservés d\'une année à l\'autre.',
  defaut: 0.85, affichage: 85, estPourcentage: true,
  step: 1, min: 0, max: 100
},
{
  cle: 'taux_conversion_premium',
  label: 'Taux de conversion premium',
  unite: '%',
  description: 'Ex : 20 pour 20%. Part des clients basiques qui passent en offre premium.',
  defaut: 0.20, affichage: 20, estPourcentage: true,
  step: 0.5, min: 0, max: 100
},
```

### SectionConcurrents.tsx — Zone "Avantage concurrentiel"

Avant les boutons d'action, ajouter une zone de texte globale :
```tsx
{/* Zone avantage concurrentiel global */}
<div style={{ backgroundColor: '#E1F5EE', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F6E56', margin: '0 0 10px' }}>
    🏆 Notre avantage concurrentiel global
  </p>
  <textarea
    value={avantageGlobal}
    onChange={e => setAvantageGlobal(e.target.value)}
    placeholder="Décrivez en quoi votre offre est globalement supérieure à la concurrence..."
    rows={4}
    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, borderColor: '#169B86' }}
  />
</div>
```

Ajouter le state et la sauvegarde dans le composant :
```tsx
const [avantageGlobal, setAvantageGlobal] = useState('')

// Dans fetchData, récupérer depuis un champ projet ou une table dédiée
// Option simple : stocker dans hypotheses avec cle='avantage_concurrentiel'
```

### SectionRisques.tsx — Catégorie "Autre" avec saisie libre

Dans la partie `categorie` du formulaire de risque, remplacer le `<select>` seul par :
```tsx
<div>
  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>Catégorie</label>
  <select value={r.categorie || ''}
          onChange={e => update(r.id, 'categorie', e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
    <option value="">Choisir</option>
    <option value="Financier">Financier</option>
    <option value="Technique">Technique</option>
    <option value="Marché">Marché</option>
    <option value="Réglementaire">Réglementaire</option>
    <option value="Opérationnel">Opérationnel</option>
    <option value="Environnemental">Environnemental</option>
    <option value="Autre">Autre</option>
  </select>
  {/* NOUVEAU : saisie libre si "Autre" */}
  {r.categorie === 'Autre' && (
    <input
      type="text"
      value={r.categorie_libre || ''}
      onChange={e => update(r.id, 'categorie_libre', e.target.value)}
      placeholder="Précisez la catégorie..."
      style={{ ...inputStyle, marginTop: '6px', borderColor: '#F0A02B' }}
    />
  )}
</div>
```

---

## Récapitulatif des fichiers à modifier

```
src/lib/superbase/types.ts                          ← REMPLACER
src/components/sections/SectionPartenaires.tsx      ← REMPLACER
src/components/sections/SectionSegmentClientele.tsx ← CRÉER
src/app/(dashboard)/parametres/page.tsx             ← CRÉER
src/app/(dashboard)/projets/[id]/page.tsx           ← MODIFIER (imports, SECTIONS, renderSection)
src/app/(dashboard)/projets/nouveau/page.tsx        ← MODIFIER (clonage profil global)
src/components/sections/SectionInformations.tsx     ← MODIFIER (3 nouveaux champs)
src/components/sections/SectionHypotheses.tsx       ← MODIFIER (2 nouvelles hypothèses)
src/components/sections/SectionConcurrents.tsx      ← MODIFIER (zone avantage global)
src/components/sections/SectionRisques.tsx          ← MODIFIER (saisie libre si "Autre")
src/app/(dashboard)/layout.tsx                      ← MODIFIER (lien Paramètres)
```
