---
trigger: always_on
---

# Template CSS — Ajout d'un nouveau jeu

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

Le layout en jeu utilise 3 breakpoints :

1. **Desktop ≥ 1200px** — Layout 2 colonnes (grille à gauche, contrôles à droite)
2. **Mobile paysage ≤ 950px landscape** — Layout 2 colonnes compactes
3. **Mobile portrait ≤ 600px** — Layout 1 colonne empilée

Pour chaque nouveau jeu, ajouter les sélecteurs dans les media queries existantes de la section 12 :

```css
/* Dans @media (min-width: 1200px) */
.[prefix]-game-container {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 400px;
    gap: 2.5rem;
    align-items: start;
    max-width: 1600px;
}

.[prefix]-grid {
    grid-column: 1;
    grid-row: 1 / 20;
    height: min(80vh, 900px);
    width: auto !important;
}

.[prefix]-header { grid-column: 2; }
.[prefix]-controls { grid-column: 2; }
```

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
- [ ] L'en-tête de section `/* === N. JEU : ... === */` est ajouté
- [ ] Les media queries desktop/mobile sont prises en compte
- [ ] Le jeu fonctionne en thème sombre ET clair
- [ ] Test du jeu en mode manuel