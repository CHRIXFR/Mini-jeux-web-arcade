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
| 🔡 **Scrabble** | 1 000 XP | Affrontez une IA avec le dictionnaire ODS officiel |

## Système de progression

Chaque partie rapporte de l'**XP** qui permet de débloquer les jeux suivants. L'XP est sauvegardé localement dans votre navigateur.

> 💡 Astuce développeur : ajoutez `?test=true` à l'URL pour débloquer tous les jeux immédiatement.

## Stack technique

- **Vanilla JavaScript** (ES6+) — aucune dépendance, aucune librairie
- **Vanilla CSS** — variables CSS, thème sombre/clair, responsive
- **Dictionnaire ODS** (Officiel du Scrabble) intégré via un cache partagé
- **Accessibilité** — Navigation clavier (Sudoku) et labels ARIA

## Lancer en local

```bash
git clone https://github.com/CHRIXFR/Mini-jeux-web-arcade.git
cd Mini-jeux-web-arcade
# Un serveur local est nécessaire pour le chargement des dictionnaires
npx serve .
```

## Licence

Projet open-source — libre d'utilisation et de modification.
