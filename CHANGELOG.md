# CHANGELOG — Darija Flashcards

Format : `[vX.Y] YYYY-MM-DD — Description`

---

## [v9.0] 2026-04-13 — Refactoring multi-fichiers

### Architecture
- Séparation en 6 fichiers : `index.html`, `style.css`, `data.js`, `audio.js`, `core.js`, `render.js`, `app.js`
- Ajout de 3 fichiers de documentation : `ARCHITECTURE.md`, `CHANGELOG.md`, `README.md`
- Blocs verrouillés documentés dans `ARCHITECTURE.md`

### Blocs verrouillés dans cette version
| Bloc | Fichier | Statut |
|---|---|---|
| CM (catégories) | data.js | 🔒 Verrouillé |
| DATA (285 cartes) | data.js | 🔒 Verrouillé |
| State S + localStorage | core.js | 🔒 Verrouillé |
| Audio enregistrement | audio.js | 🔒 Verrouillé |
| Export data: URI | core.js | 🔒 Verrouillé |
| renderQuiz + setF | render.js + core.js | 🔒 Verrouillé |
| completeDrag | core.js | 🔒 Verrouillé |
| Swipe handler #scene-btns | app.js | 🔒 Verrouillé |

---

## [v8.0] — Fichier monolithique (darija_flashcards-8.html)

### Fonctionnalités présentes
- 285 cartes en 19 catégories (salutations, politesse, questions, compliments, humour, famille, maison, ville, chiffres, fruits, religion, émotions, santé, métiers, pronoms, conjonctions, proverbes, alphabet, autres)
- Swipe gauche = À revoir / Swipe droite = Je sais
- Filtres : Toutes, par catégorie, À revoir, ✓ Je sais, ⭐ Favoris
- Barre de catégories collapsible (▼ Voir toutes / ▲ Réduire)
- Bouton ＋ pour créer des catégories personnalisées (avec couleur)
- Bouton Shuffle (toggle : actif = ordre aléatoire persistant)
- Étoile ⭐ favori sur chaque face de carte
- Bouton micro (enregistrement vocal, 1 par carte, remplace le précédent)
- Bouton play (gris si pas d'enregistrement, noir si disponible)
- Export JSON sans audios (data: URI — compatible Android/OnePlus)
- Export JSON avec audios (base64)
- Import JSON (restaure S + recs)
- Réinitialisation complète
- Onglet Édition : liste searchable, modifier/supprimer toutes les cartes
- Onglet Ressources : 16 liens pré-remplis, ajout/modif/suppression, drag-and-drop

### Bugs corrigés dans v8
- `setF` supprimée accidentellement → réinsérée systématiquement après `renderQuiz`
- `createObjectURL` → remplacé par `data: URI` pour Android
- `touchstart` + `stopPropagation` cassait `getUserMedia` → supprimé
- `const favSet` déclaré deux fois dans `renderQuiz` → fusionné en tête de fonction
- `opacity:'0'` non réinitialisé après swipe → `ci.style.opacity='1'` ajouté dans `renderQuiz`

---

## Règles pour les prochaines versions

1. **Avant toute modification** : lire `ARCHITECTURE.md` et identifier les blocs verrouillés
2. **Ne jamais modifier** un bloc verrouillé sans accord explicite
3. **Toujours documenter** les changements dans ce fichier
4. **Vérifier** que `setF` est présente après chaque modification de `renderQuiz`
5. **Ne jamais remplacer** `data: URI` par `createObjectURL` dans les exports
6. **Tester** sur Android après toute modification des boutons mic/play
