# 🎮 Arcade Minimaliste

Une collection de mini-jeux classiques, élégants et entièrement gratuits — jouables directement dans le navigateur, sans installation.

**[▶ Jouer maintenant](https://chrixfr.github.io/Mini-jeux-web-arcade/)**

---

## Jeux disponibles (Accès Immédiat 🚀)

| Jeu | Style | Description |
|---|---|---|
| 😵 **Le Pendu** | Classique | Devinez le mot avant que le pendu soit complet |
| 🔍 **Mots Mêlés** | Observation | Trouvez les mots cachés dans la grille |
| 🃏 **Paires** | Mémoire | Trouvez toutes les paires d'emojis contre la montre |
| 🧩 **Sudoku** | Réflexion | Le classique avec notes, indices et chronomètre |
| 💎 **Match-3** | Puzzle | Alignez des gemmes et déclenchez des combos spéciaux |
| 🌍 **Capitales** | Culture G | Testez vos connaissances sur les drapeaux et les pays |
| 🔡 **Scrabble** | Expert | Affrontez une IA avec l'historique de vos 10 dernières parties |
| 🧱 **Tetris** | Arcade | L'indémodable avec une esthétique moderne et fluide |
| 🕵️‍♂️ **Objets Cachés** | Observation | Retrouvez les objets perdus dans des décors générés par IA |
| 🎷 **Blind Test** | Musical | Devinez les musiques cultes jouées au synthétiseur 8-bits |
| 🐍 **Snake** | Arcade | Surélevez le défi avec des paliers de vitesse et des murs aléatoires |
| ☄️ **Neon Pulse** | Casse-briques | Détruisez les briques dans cette variante néon avec 10 niveaux et bonus |

## Fonctionnalités Clés

- **Accès Libre (Sans XP)** : Plus de barrières ! Tous les jeux sont débloqués par défaut pour un plaisir immédiat.
- **Tableau des Records Locaux** : Battez vos propres records (scores ou temps) sauvegardés directement dans votre navigateur.
- **Thèmes & Fonds Dynamiques** : 4 modes (Sombre, Clair, Néon, Océan) avec des fonds d'écran haute qualité via l'API d'**Unsplash**.
- **Guide Interactif (Driver.js)** : Un tour d'onboarding accompagne les nouveaux joueurs pour découvrir l'interface.
- **Changelog Dynamique** : Les nouveautés sont récupérées en temps réel via l'API GitHub pour vous tenir au courant.
- **Audio Immersif** : Synthétiseur intégré (Web Audio API) et playlists thématiques.
- **Respect de la Vie Privée** : Analytique légère (GoatCounter) sans cookies et stockage local uniquement.

## Stack technique

- **Vanilla JavaScript** (ES6+) — zéro dépendance, architecture modulaire par fichier.
- **Modern CSS** — Design System robuste, Glassmorphism et thèmes adaptatifs.
- **Driver.js** — Moteur de visite guidée pour l'accueil.
- **Unsplash API** — Chargement dynamique d'images de fond thématiques.
- **Dictionnaire ODS** — Intégré au format JSON pour le Scrabble, le Pendu et les Mots Mêlés.
- **Web Audio API** — Synthèse sonore et gestion audio haute performance.
- **Playwright** — Tests automatisés (non-régression visuelle et fonctionnelle).

## Lancer en local

```bash
git clone https://github.com/CHRIXFR/Mini-jeux-web-arcade.git
cd Mini-jeux-web-arcade
# Un serveur local est nécessaire pour le chargement des dictionnaires et fichiers JSON
npx serve .
```

## Licence

Projet open-source — libre d'utilisation, de modification et de contribution. ✨
