# 🎮 Arcade Minimaliste

Une collection de mini-jeux classiques, élégants et entièrement gratuits — jouables directement dans le navigateur, sans installation.

**[▶ Jouer maintenant](https://chrixfr.github.io/Mini-jeux-web-arcade/)**

---

## Jeux disponibles

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
| 🎲 **421** | Dés / Arcade | Jouez en solo (score attack) ou en duel local 2 joueurs avec tie-break |
| 🃏 **UNO** | Cartes / Stratégie | Jouez en local 2/3/4 joueurs ou en solo contre une IA |
| 🧠 **Suite Logique** | Réflexion | Complétez des suites en mode forme, chiffre ou mixte sur 10 questions |
| ♟️ **Échecs** | Stratégie | Affrontez un joueur local ou une IA à 3 niveaux sur un échiquier interactif |

## Fonctionnalités Clés

- **Tableau des Records Locaux** : Battez vos propres records (scores ou temps) sauvegardés directement dans votre navigateur (mode solo).
- **Thèmes & Fonds Dynamiques** : 4 modes (Sombre, Clair, Néon, Océan) avec des fonds d'écran haute qualité via l'API d'**Unsplash**.
- **Guide Interactif (Driver.js)** : Un tour d'onboarding accompagne les nouveaux joueurs pour découvrir l'interface.
- **Changelog Dynamique** : Les nouveautés sont récupérées en temps réel via l'API GitHub pour vous tenir au courant.
- **Audio Immersif** : Synthétiseur intégré (Web Audio API) et playlists thématiques.
- **Optimisé Mobile** : Interface adaptive avec header masqué en jeu, bouton retour compact et viewport maximisé.
- **Topbar standardisée en jeu** : Tous les jeux partagent une barre commune (`icône + titre + difficulté + score/stat` selon le jeu).
- **UI globale optimisée (Phase 32)** : Hero d'accueil clarifié, cartes de jeux harmonisées, shell in-game stabilisé et responsive renforcé.
- **Mode Duel Local (421)** : Jouez à deux sur le même PC/mobile en pass-and-play, avec alternance par ronde et tie-break décisif.
- **UNO Multi + Solo IA** : UNO classique strict avec passation locale 2/3/4 joueurs et mode solo contre ordinateur.
- **Suite Logique (Forme/Chiffre/Mixte)** : Session courte en 10 questions, difficulté progressive, indice optionnel et score local.
- **Échecs (Local + IA)** : Mode 2 joueurs local pass-and-play, IA à 3 niveaux, historique des coups et fin de partie standardisée.
- **Respect de la Vie Privée** : Analytique légère (GoatCounter) sans cookies et stockage local uniquement.

## Stack technique

- **Vanilla JavaScript** (ES6+) — zéro dépendance, architecture modulaire par fichier.
- **Modern CSS** — Design System robuste, Glassmorphism, thèmes adaptatifs et `mobile.css` dédié au responsive.
- **Driver.js** — Moteur de visite guidée pour l'accueil.
- **Unsplash API** — Chargement dynamique d'images de fond thématiques.
- **Dictionnaire ODS** — Intégré au format JSON pour le Scrabble, le Pendu et les Mots Mêlés.
- **Web Audio API** — Synthèse sonore et gestion audio haute performance.
- **js-chess-engine (MIT)** — Moteur d'échecs permissif (règles + IA) utilisé pour le mode Échecs.
- **Playwright** — Tests automatisés (non-régression visuelle et fonctionnelle).
- **Tests dédiés 421** — Scénarios solo, duel local et tie-break validés en E2E.
- **Tests dédiés UNO** — Couverture des modes multi local, passation, carte action et tour IA.
- **Tests dédiés Suite Logique** — Couverture des 3 modes, alternance mixte, scoring, fin anticipée et persistance record.
- **Suites multi-résolutions** — Validation desktop 1080p/1440p/2160p + mobile Samsung A51 (412x914).

## Lancer en local

```bash
git clone https://github.com/CHRIXFR/Mini-jeux-web-arcade.git
cd Mini-jeux-web-arcade
# Un serveur local est nécessaire pour le chargement des dictionnaires et fichiers JSON
npx serve .
```

## Licence

Projet open-source — libre d'utilisation, de modification et de contribution. ✨
