# ARCHITECTURE — Darija Flashcards

## Structure du projet

```
darija-flashcards/
├── index.html       ← Structure HTML pure (ne contient aucune logique)
├── style.css        ← Tout le design visuel
├── data.js          ← Données statiques (catégories, cartes, ressources)
├── core.js          ← Logique métier (state, localStorage, navigation)
├── audio.js         ← Enregistrement vocal et lecture
├── render.js        ← Rendu dynamique de l'interface
├── app.js           ← Initialisation, event bindings, modales
├── ARCHITECTURE.md  ← Ce fichier
├── CHANGELOG.md     ← Historique des versions
└── README.md        ← Guide d'utilisation et de modification
```

---

## Ordre de chargement des scripts

```html
<script src="data.js"></script>    ← 1er : variables globales CM, DATA, RES_DEFAULT
<script src="audio.js"></script>   ← 2e  : recs, fonctions audio (dépend de pool/cur via core)
<script src="core.js"></script>    ← 3e  : S, pool, rebuildPool, setF, completeDrag
<script src="render.js"></script>  ← 4e  : renderQuiz, renderEdit, renderRes
<script src="app.js"></script>     ← 5e  : init, event bindings, modales
```

> ⚠️ L'ordre est critique. Ne pas modifier.

---

## Blocs verrouillés 🔒

Ces blocs ne doivent **jamais** être modifiés sans accord explicite.

### BLOC-1 · data.js › `CM` — Catégories de base
- 19 catégories statiques avec couleur bg/c
- Toute nouvelle catégorie de base doit être ajoutée ici
- Les catégories personnalisées de l'utilisateur sont dans `S.customCats` (core.js)

### BLOC-2 · data.js › `DATA` — 285 cartes de base
- Format : `{id, cat, fr, d, a, p, n}`
- `id` doit être unique et séquentiel (0 → 284)
- Les cartes perso de l'utilisateur sont dans `S.custom` (core.js)
- Les modifications utilisateur sur les cartes de base sont dans `S.overrides` (core.js)

### BLOC-3 · core.js › `S` — State et localStorage
- Clé localStorage : `darija_v2`
- Structure fixe : `{unk, knows, favs, overrides, custom, af, resCustom, resOrder, customCats}`
- `unk` = IDs "à revoir", `knows` = IDs "je sais", `favs` = IDs favoris
- Ne jamais renommer les champs sans migrer le localStorage

### BLOC-4 · audio.js — Enregistrement vocal
- Clé localStorage : `darija_recs_v1`
- Format : `{[cardId]: "data:audio/webm;base64,..."}`
- `stopAudioState()` doit être appelé à chaque changement de carte ou d'onglet

### BLOC-5 · core.js › `exportData / exportDataWithAudio`
- Utilise `data: URI` + `encodeURIComponent` — **ne pas remplacer par `createObjectURL`**
- `createObjectURL` génère des URL `blob://` rejetées par le navigateur Android OnePlus

### BLOC-6 · render.js › `renderQuiz` + core.js › `setF`
- `setF` est appelée par tous les boutons `onclick="setF('xxx')"` dans les catégories
- `setF` **doit toujours exister** — sa suppression casse tous les filtres
- `updateSceneBtns()` doit être appelé à la fin de `renderQuiz`

### BLOC-7 · core.js › `completeDrag`
- Gère la logique `knows/unk` à chaque swipe
- Glisser droite → ajoute à `knows`, retire de `unk`
- Glisser gauche → ajoute à `unk`, retire de `knows`

### BLOC-8 · app.js › swipe handler
- Le handler `pointerdown` de la scène vérifie `e.target.closest('#scene-btns')`
- Cette vérification **doit rester** pour que mic/play reçoivent leurs clics sans déclencher le swipe

---

## Blocs modifiables ✏️

| Fichier | Ce qu'on peut modifier |
|---|---|
| `style.css` | Couleurs, tailles, espacements, animations |
| `render.js` | Présentation des cartes, édition, ressources |
| `app.js` | Comportement des modales, textes, icônes |
| `index.html` | Structure HTML, ordre des modales |

---

## Flux de données

```
localStorage
    │
    ▼
loadState() → S  ──────────────────────────────────────┐
loadRecs()  → recs                                     │
    │                                                  │
    ▼                                                  │
rebuildPool()                                          │
    │ (filtre DATA + S.custom selon S.af)              │
    ▼                                                  │
pool[]                                                 │
    │                                                  │
    ▼                                                  │
renderQuiz() ──── getCM() ──── CM + S.customCats       │
    │                                                  │
    │ swipe → completeDrag() → S.unk / S.knows ────────┤
    │ étoile → S.favs ────────────────────────────────►│
    │ micro  → recs[cardId] ──────────────────────────►│
    │                                                  │
    ▼                                                  │
saveState() → localStorage ◄──────────────────────────┘
saveRecs()  → localStorage
```

---

## Variables globales importantes

| Variable | Fichier | Description |
|---|---|---|
| `CM` | data.js | Catégories de base (objet) |
| `DATA` | data.js | 285 cartes de base (tableau) |
| `RES_DEFAULT` | data.js | 16 ressources pré-remplies |
| `S` | core.js | État complet de l'utilisateur |
| `pool` | core.js | Cartes actuellement affichées |
| `cur` | core.js | Index de la carte courante |
| `fl` | core.js | Carte retournée (true = côté darija) |
| `sd` | core.js | Face de départ aléatoire ('fr' ou 'd') |
| `shuffleOn` | core.js | Shuffle activé |
| `recs` | audio.js | Enregistrements vocaux {id: dataURL} |
| `catsExpanded` | core.js | Barre de catégories déployée |
