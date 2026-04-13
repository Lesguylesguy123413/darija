# Darija Flashcards · Fès

Application de flashcards pour apprendre le darija marocain.
Conçue pour fonctionner **sans serveur**, directement depuis un dossier local sur téléphone ou ordinateur.

---

## Installation

1. Copie les 7 fichiers dans un même dossier sur ton téléphone ou ordinateur :
   ```
   darija-flashcards/
   ├── index.html
   ├── style.css
   ├── data.js
   ├── audio.js
   ├── core.js
   ├── render.js
   └── app.js
   ```

2. Ouvre `index.html` dans ton navigateur (Chrome recommandé sur Android).

3. Sur Android : ouvre Chrome → tape l'adresse du fichier, ou utilise un gestionnaire de fichiers et appuie sur `index.html`.

> ⚠️ **Tous les fichiers doivent être dans le même dossier.** Si tu déplaces `index.html` seul, l'application ne fonctionnera pas.

---

## Fonctionnalités

### Onglet 🃏 Quiz

| Action | Résultat |
|---|---|
| Tap sur la carte | Retourner (FR ↔ Darija) |
| Swipe → droite | "Je sais" (retire de "À revoir") |
| Swipe ← gauche | "À revoir" |
| ⭐ (étoile) | Ajouter/retirer des favoris |
| 🎙 (micro) | Enregistrer ta voix pour cette carte |
| ▶ (play) | Réécouter ton enregistrement |
| Shuffle | Active/désactive l'ordre aléatoire (persistant) |

**Filtres disponibles :** Toutes · par catégorie · À revoir · ✓ Je sais · ⭐ Favoris

### Onglet ✏️ Édition
- Recherche dans toutes les cartes
- Modifier le texte français, darija, arabe, catégorie de n'importe quelle carte
- Créer des cartes personnalisées (bouton **+**)
- Supprimer ou réinitialiser les modifications

### Onglet 🔗 Ressources
- 16 liens pré-remplis (podcasts, dictionnaires, sites d'info, Reddit)
- Ajouter, modifier, supprimer des liens
- Réorganiser par glisser-déposer (mode ✏️ Éditer)

---

## Synchronisation multi-appareils

La progression est sauvegardée automatiquement dans le navigateur (`localStorage`).

Pour transférer sur un autre appareil :

1. Appuie sur **⇅ Sync** (en haut à droite du quiz)
2. **Exporter sans audios** → fichier JSON léger
3. **Exporter avec audios** → fichier JSON avec tous tes enregistrements vocaux
4. Transfère le fichier (WhatsApp, mail, Drive…)
5. Sur l'autre appareil → **⇅ Sync** → **Importer**

---

## Modifier le projet

### Ajouter des cartes de base
Édite `data.js`, dans le tableau `DATA`. Respecte le format :
```js
{id: 285, cat: 'salutations', fr: 'Bonjour le monde', d: 'Salam dunya', a: 'سلام دنيا', p: 'sa-lam dun-ya', n: 'Note optionnelle'},
```
- `id` : numéro unique (continuer la numérotation)
- `cat` : clé d'une catégorie dans `CM`
- `p` : prononciation phonétique
- `n` : note (optionnel)

### Modifier le design
Édite `style.css`. Les couleurs principales sont des variables CSS en haut du fichier :
```css
:root {
  --terra: #C4622D;   /* couleur principale terracotta */
  --know: #4D7A55;    /* vert "je sais" */
  --rev: #C4622D;     /* rouge "à revoir" */
  --card: #FFFDF5;    /* fond des cartes */
  --bg: #F2E8D0;      /* fond de l'application */
}
```

### Ajouter une catégorie de base
Dans `data.js`, dans l'objet `CM` :
```js
maCategorie: { l: 'Ma Catégorie', bg: '#F0F8FF', c: '#1A3A7A' },
```
- `l` : nom affiché
- `bg` : couleur de fond du badge
- `c` : couleur du texte du badge

---

## Architecture technique

Consulte `ARCHITECTURE.md` pour la carte complète des blocs, leurs dépendances et les règles de modification.

Consulte `CHANGELOG.md` pour l'historique des versions.

---

## Blocs à ne jamais modifier sans accord

- `CM` et `DATA` dans `data.js`
- `S` (state) et `completeDrag` dans `core.js`
- Tout le contenu de `audio.js`
- `setF` dans `core.js` (appelée par tous les boutons de catégorie)
- Les exports dans `core.js` (doivent utiliser `data: URI`, pas `createObjectURL`)
