# 🎮 Arcade Minimaliste

Une collection de mini-jeux classiques, élégants et entièrement gratuits — jouable directement dans le navigateur, sans installation.

**[▶ Jouer maintenant](https://chrixfr.github.io/Mini-jeux-web-arcade/)**

---

## Jeux disponibles

| Jeu | Déblocage | Description |
|---|---|---|
| 😵 **Le Pendu** | Gratuit | Devinez le mot avant que le pendu soit complet |
| 🔍 **Mots Mêlés** | 50 XP | Trouvez les mots cachés dans la grille |
| 🃏 **Paires** | 100 XP | Trouvez toutes les paires d'emojis contre la montre |
| 🧩 **Sudoku** | 250 XP | Le classique avec notes, indices et chronomètre |
| 💎 **Match-3** | 500 XP | Alignez des gemmes et déclenchez des combos spéciaux |
| 🌍 **Capitales** | 750 XP | Testez vos connaissances sur les drapeaux et les pays |
| 🔡 **Scrabble** | 1 000 XP | Affrontez une IA avec le dictionnaire ODS officiel |

## Fonctionnalités Clés

- **Système de progression** : Chaque partie rapporte de l'**XP** pour débloquer de nouveaux défis.
- **Changelog Dynamique** : Les nouveautés sont récupérées en temps réel via l'API GitHub (filtre tag `News:`).
- **Design Premium** : Interface optimisée (Glassmorphism, Dark/Light mode, animations fluides).
- **Standard de contribution** : Un [modèle CSS](.agents/rules/css-game-template.md) est disponible pour l'ajout cohérent de nouveaux jeux.

## Stack technique

- **Vanilla JavaScript** (ES6+) — zéro dépendance, architecture modulaire par fichier.
- **Modern CSS** — Utilisation intensive de variables CSS, Grid/Flexbox et Thème dynamique.
- **GitHub API Integration** — Récupération asynchrone des nouveautés pour le changelog.
- **Dictionnaire ODS** (Officiel du Scrabble) intégré au format JSON haute-performance.
- **Playwright** — Suite de tests automatisés pour la non-régression visuelle et fonctionnelle.

## Lancer en local

```bash
git clone https://github.com/CHRIXFR/Mini-jeux-web-arcade.git
cd Mini-jeux-web-arcade
# Un serveur local est nécessaire pour le chargement des dictionnaires (fichiers JSON)
npx serve .
```

## Licence

Projet open-source — libre d'utilisation et de modification.
