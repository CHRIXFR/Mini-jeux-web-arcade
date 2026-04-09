# Conception : Jeu Snake Glassmorphism

## 1. Identité Visuelle & UI
- **Esthétique** : Style "Glassmorphism" avec des éléments semi-transparents, des ombres douces et des contours arrondis.
- **Le Serpent** : Segments avec effet verre poli.
- **La Pomme** : Élément avec un léger effet de lueur (glow).
- **Interface Moteur** : Intégration complète aux standards de l'Arcade (modales Start/End standardisées, intégration de la musique et des sons, compatibilité thème clair/sombre).

## 2. Boucle de Jeu (Mode Campagne)
- **Niveaux** : Le jeu progresse par niveaux.
- **Objectif du Niveau** : Le joueur doit manger un nombre défini de pommes pour passer au niveau supérieur.
- **Progression** : À chaque changement de niveau, la grille se réinitialise, la vitesse du serpent augmente légèrement, et de nouveaux obstacles (murs avec esthétique glassmorphism) apparaissent.
- **Sauvegarde** : Le menu d'accueil affichera le "Niveau Max" atteint par le joueur, stocké via le score.
- **XP** : Le jeu est débloqué par défaut (Coût 0 XP, suite aux retours des joueurs tests sur l'ensemble de l'Arcade).

## 3. Contrôles
- **PC** : Flèches directionnelles et touches WASD / ZQSD.
- **Mobile** : Boutons tactiles affichés à l'écran sous forme de croix directionnelle stylisée (D-Pad), utilisant également le design Glassmorphism pour s'intégrer harmonieusement.

## 4. Architecture Technique
- **Langage** : Vanilla JavaScript avec boucle `requestAnimationFrame()`.
- **Ressources** : Fichiers `snake.js` et `snake.css`, respectant les `js-game-template.md` et `css-game-template.md`.
- **État** : Store global simple stocké dans `window.arcade` pour gérer l'état et sauvegarder le niveau maximal.
