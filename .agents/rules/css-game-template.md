---
trigger: always_on
---

# Template CSS — Ajout d'un nouveau jeu

> [!IMPORTANT]
> Ce document doit être utilisé en complément de [js-game-template.md](file:///c:/Users/chjeu/Documents/Codes/Codex/Mini-jeux-web-arcade/.agents/rules/js-game-template.md) pour garantir un fonctionnement et un design cohérents.

Ce document sert de guide pour maintenir la cohérence du style lors de l'ajout d'un nouveau jeu ou composant dans l'Arcade.

## Variables CSS disponibles

Toujours utiliser les variables du Design System (définies dans `:root` de `style.css`) :

| Variable | Usage |
|----------|-------|
| `--bg-color` | Fond principal |
| `--card-bg` | Fond des cartes / panneaux |
| `--card-bg-alt` | Fond secondaire (sections surélevées en mode sombre) |
| `--text-primary` | Texte principal |
| `--text-secondary` | Texte secondaire / labels |
| `--accent` | Couleur d'accentuation (indigo) |
| `--accent-glow` | Ombre de l'accent |
| `--accent-cyan` | Cyan (spécifique IA) |
| `--border` | Bordures |
| `--success` | Succès / correct |
| `--error` | Erreur / incorrect |
| `--warning` | Avertissement / indice |
| `--radius` | Border-radius des cartes (16px) |
| `--btn-radius` | Border-radius des boutons (10px) |
| `--btn-height` | Hauteur standard des boutons (42px) |
| `--transition` | Transition standard (0.3s cubic-bezier) |

## Classes de boutons réutilisables

**Ne PAS recréer de styles de boutons from scratch.** Toujours utiliser les classes existantes :

- **`.btn-primary`** — Action principale (fond accent, texte blanc)
- **`.btn-secondary`** — Action secondaire (transparent, bordure)
- **`.control-btn`** — Contrôle de jeu (fond card-bg, bordure)

Ces trois classes héritent automatiquement d'un socle commun (`font-family`, `font-weight`, `border-radius`, `cursor`, `transition`, `outline`).

### État actif
```css
.control-btn.active {
    background: var(--accent);
    border-color: var(--accent);
}
```

### Couleurs de feedback
```css
/* Bonne réponse */
.mon-btn.correct {
    background: var(--success) !important;
    color: white !important;
}

/* Mauvaise réponse */
.mon-btn.wrong {
    background: var(--error) !important;
    color: white !important;
    animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
}
```

## Classes de modales standardisées

Les modales de jeu (start et game over) sont gérées par `game-modal.js`. **Ne PAS recréer de modales custom.**

Les classes suivantes sont disponibles et déjà stylées dans `style.css` :

| Classe | Usage |
|--------|-------|
| `.modal-overlay` | Overlay plein écran avec flou |
| `.modal-content` | Conteneur de la modale |
| `.modal-game-icon` | Icône emoji du jeu (3.5rem) |
| `.modal-description` | Description du jeu |
| `.modal-section-label` | Label de section (CONTRÔLES, DIFFICULTÉ) |
| `.modal-controls-list` | Liste des contrôles adaptatifs |
| `.modal-difficulty-selector` | Groupe de boutons de difficulté |
| `.modal-diff-btn` | Bouton de difficulté individuel |
| `.modal-stats-grid` | Grille de statistiques de fin |
| `.modal-stat-row` | Ligne de statistique |
| `.modal-actions` | Groupe de boutons d'action |
| `.hs-badge` | Badge de meilleur score affiché sur les cartes |

## Structure CSS d'un nouveau jeu

```css
/* ========================================================================
   N. JEU : [NOM DU JEU]
   ======================================================================== */

/* Conteneur principal */
.[prefix]-game-container {
    max-width: 600px;
    margin: 0 auto;
}

/* En-tête du jeu (stats, titre, contrôles) */
.[prefix]-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: var(--card-bg);
    padding: 1rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
}

/* Labels de stats — Pattern commun */
.[prefix]-stat-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
}

.[prefix]-stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--accent);
}

/* Grille de jeu */
.[prefix]-grid {
    display: grid;
    gap: 4px;
    background: var(--border);
    border: 4px solid var(--border);
    margin-bottom: 2rem;
    aspect-ratio: 1;
}

/* Cellule de jeu */
.[prefix]-cell {
    background: var(--bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s ease;
}

.[prefix]-cell.selected {
    background: var(--accent);
    color: white;
}
```

## Responsive — Media queries à respecter

> [!IMPORTANT]
> Les styles **desktop** vont dans `style.css`. Les styles **mobiles/responsifs** vont dans **`mobile.css`**.
> Ne JAMAIS ajouter de `@media` query dans `style.css`.

Le layout en jeu utilise 3 breakpoints :

1. **Desktop ≥ 1200px** — Layout 2 colonnes (grille à gauche, contrôles à droite) → `style.css`
2. **Mobile paysage ≤ 950px landscape** — Layout compact → `mobile.css`
3. **Mobile portrait ≤ 600px** — Layout 1 colonne empilée → `mobile.css`

Pour chaque nouveau jeu, ajouter les styles desktop dans `style.css` et les media queries dans `mobile.css` :

**Dans `style.css` :**
```css
.[prefix]-game-container {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 400px;
    gap: 2.5rem;
    align-items: start;
    max-width: 1600px;
}
```

**Dans `mobile.css` :**
```css
@media (max-width: 600px) {
    .[prefix]-game-container {
        grid-template-columns: 1fr;
        gap: 0.5rem;
        padding: 0.5rem;
    }
}
```

### Optimisations mobiles automatiques

Grâce à `mobile.css`, les éléments suivants sont **automatiquement gérés** en mode jeu sur mobile :

- Le **header global** est masqué (`body.in-game header { display: none }`)
- Le **bouton retour** est transformé en icône compacte flottante
- Le **footer** est masqué
- Le **texte d'aide contrôles** (`[class$="-controls-help"]`) est masqué
- Les **glass-panel** ont un padding réduit
- Les **modales de jeu** (`.modal-content`) sont contraintes en mobile paysage (largeur/hauteur + scroll interne)

## Thème clair

Si un composant utilise `var(--card-bg-alt)` (fond légèrement plus clair en mode sombre), il s'adapte automatiquement au mode clair grâce à la variable. Pour des overrides spécifiques :

```css
.light-mode .[prefix]-special {
    background: var(--card-bg);
}
```

## Checklist avant commit

- [ ] Toutes les couleurs utilisent des variables CSS (pas de `#hex` hardcodé)
- [ ] Les boutons utilisent `.btn-primary` ou `.btn-secondary`
- [ ] L'en-tête de section `/* === N. JEU : ... === */` est ajouté dans `style.css`
- [ ] Les styles desktop sont dans `style.css`, les media queries mobiles dans `mobile.css`
- [ ] Le jeu fonctionne en thème sombre ET clair
- [ ] Test sur mobile (F12 → Device Toolbar) : le jeu rentre dans le viewport sans scroll
- [ ] Test du jeu en mode manuel
