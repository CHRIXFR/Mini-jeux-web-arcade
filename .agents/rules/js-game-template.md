---
trigger: always_on
---

# Template JS — Ajout d'un nouveau jeu

> [!IMPORTANT]
> Ce document doit être utilisé en complément de [css-game-template.md](file:///c:/Users/chjeu/Documents/Codes/Antigravity/Mini-jeux-web-arcade/.agents/rules/css-game-template.md) pour garantir une intégration visuelle et structurelle parfaite.

Guide pour le cycle de vie JavaScript et l'API de modales standardisées.

## Cycle de vie d'un jeu

Chaque jeu suit ce flux standardisé :

```
initMonJeu(container)  →  showStartScreen()  →  start() / newGame()  →  [gameplay]  →  showGameOverModal()
                                ↑                                            ↑                    │
                                └────────────── onReplay ───────────────────────                    │
                                                                                                    │
                                                            onQuit → window.arcade.renderHome() ←───┘
```

## Fonction d'initialisation

Chaque jeu expose une fonction globale `window.initMonJeu(container)` :

```javascript
window.initMonJeu = function (container) {
    const game = new MonJeu(container);
    game.showStartScreen();
};
```

> **Important :** Appeler `showStartScreen()` et NON `start()` à l'initialisation.

## Modale de démarrage — `arcade.showStartModal(config)`

```javascript
showStartScreen() {
    const self = this;
    this.renderLayout();
    window.arcade.showStartModal({
        title: 'Mon Jeu',
        icon: '🎮',
        description: 'Description courte du jeu.',
        controls: [
            { icon: '⌨️', desktop: 'Action au clavier', mobile: 'Action au toucher' }
        ],
        // Optionnel : difficulté
        difficulty: {
            options: [
                { value: 'easy', label: 'Facile' },
                { value: 'medium', label: 'Moyen' },
                { value: 'hard', label: 'Difficile' }
            ],
            default: 'medium'
        },
        onStart: function (diff) {
            self.difficulty = diff || 'medium';
            self.newGame();
        },
        onQuit: function () { window.arcade.renderHome(); }
    });
}
```

### Paramètres de `showStartModal`

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `title` | string | ✅ | Nom du jeu |
| `icon` | string | ✅ | Emoji du jeu |
| `description` | string | ✅ | Description en une phrase |
| `controls` | array | ✅ | Liste `{ icon, desktop, mobile }` |
| `difficulty` | object | ❌ | `{ options: [{value, label}], default }` |
| `onStart` | function | ✅ | Callback au clic "Commencer" |
| `onQuit` | function | ✅ | Callback au clic "Menu Principal" |

### Difficulté accessible in-game

Si le jeu a un sélecteur de difficulté, il doit aussi être accessible dans le header en jeu via un `<select>` :

```javascript
onStart: function (diff) {
    self.difficulty = diff || 'medium';
    const select = document.getElementById('xx-diff-select');
    if (select) select.value = self.difficulty;
    self.newGame();
}
```

## Modale de fin — `arcade.showGameOverModal(config)`

```javascript
showGameOverModal(xpGained) {
    const self = this;
    window.arcade.showGameOverModal({
        title: 'Game Over',
        icon: '💀',
        stats: [
            { label: 'Score', value: this.score },
            { label: 'Niveau', value: this.level }
        ],
        xpGained: xpGained,
        onReplay: function () { self.newGame(); },
        onQuit: function () { window.arcade.renderHome(); }
    });
}
```

### Paramètres de `showGameOverModal`

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `title` | string | ✅ | Titre (victoire, défaite, etc.) |
| `icon` | string | ✅ | Emoji contextuel |
| `stats` | array | ✅ | Liste `{ label, value }` |
| `xpGained` | number | ✅ | XP gagnés (0 si défaite) |
| `onReplay` | function | ✅ | Callback "Rejouer" |
| `onQuit` | function | ✅ | Callback "Menu Principal" |

## Gestion de l'Audio — `window.arcade.audio`

Le moteur audio gère les playlists (BGM) et les effets synthétiques.

### Musique (BGM) et Contextes

L'audio est basé sur des **contextes**. Lorsqu'un jeu démarre, il doit définir son contexte pour activer sa playlist dédiée (si elle existe) ou utiliser la playlist `base`.

```javascript
// Dans le constructeur ou au début de newGame()
window.arcade.audio.setContext('tetris'); 
```

> [!IMPORTANT]
> Les playlists sont **hardcodées** dans `games/audio.js`. Si vous ajoutez de nouveaux fichiers `.mp3`, vous devez impérativement les déclarer dans l'objet `playlists` de `audio.js`.

### Effets Sonores (Synthétiseur)

Privilégiez l'utilisation de `playTone` pour des effets légers et sans chargement réseau.

```javascript
// Exemple : Jouer un bip (Fréquence, Type, Durée, Volume)
window.arcade.audio.playTone(440, 'sine', 0.1, 0.2);
```

Des fonctions utilitaires peuvent être ajoutées dans `audio.js` (ex: `playMove()`, `playRotate()`) pour harmoniser les sons entre les jeux.


## Structure HTML du jeu

```html
<div class="[prefix]-game-container">
    <div class="[prefix]-header">
        <!-- Stats, timer, sélecteur difficulté -->
    </div>
    <div id="[prefix]-grid" class="[prefix]-grid"></div>
    <div class="[prefix]-controls">
        <!-- Boutons de contrôle -->
    </div>
</div>
```

## Conventions de nommage

- Préfixer tous les IDs et classes avec un identifiant court (ex: `hg-`, `scr-`, `pa-`)
- Utiliser `const self = this;` pour les callbacks de modales
- Exposer le jeu via `window._monJeuGame = this;` si des tests Playwright existent

## Checklist avant commit

- [ ] `showStartScreen()` utilise `arcade.showStartModal()`
- [ ] La modale de fin utilise `arcade.showGameOverModal()`
- [ ] Pas de modale HTML inline pour start/end (sauf cas spécifique)
- [ ] Callbacks `onReplay` et `onQuit` fonctionnels
- [ ] XP ajoutés via `window.arcade.addXP()` avant la modale de fin
- [ ] Difficulté synchronisée entre modale et select in-game (si applicable)
