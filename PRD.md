# Document de Conception Produit : Platforme de Mini-Jeux Web - Arcade Minimaliste

## 1. Vision du Projet
L'objectif est de créer une application web moderne et élégante regroupant une collection de mini-jeux captivants. L'expérience doit être fluide ("app-like"), visuellement impressionnante et facile à étendre avec de nouveaux jeux.

- **Repository GitHub** : [https://github.com/CHRIXFR/Mini-jeux-web-arcade](https://github.com/CHRIXFR/Mini-jeux-web-arcade)
- **Application Live** : [https://chrixfr.github.io/Mini-jeux-web-arcade/](https://chrixfr.github.io/Mini-jeux-web-arcade/)

## 2. Objectifs Principaux
- **Engagement** : Proposer des jeux classiques avec une interface premium et un système de progression.
- **Accessibilité** : Entièrement gratuit, sans téléchargement, utilisable sur mobile et desktop.
- **Progression** : Inciter l'utilisateur à jouer pour débloquer de nouveaux contenus.
- **Évolutivité** : Architecture modulaire permettant d'ajouter un nouveau jeu facilement.

## 3. Expérience Utilisateur (UX) & Design
Conformément aux standards de haute qualité :
- **Esthétique "Minimaliste"** : Design épuré, typographie premium (Outfit), et palette de couleurs sobres.
- **Animations** : Micro-animations discrètes pour les interactions et gains d'XP (toasts).
- **Thème** : Choix manuel entre **Thème Sombre** et **Thème Clair** via un commutateur situé près de la barre XP.
- **Langue** : Interface exclusivement en **Français**.

## 4. Fonctionnalités Détaillées

### 4.1 Page d'Accueil (Game Hub) & Progression
- **Sélection de Jeux** : Grille avec icônes. Les jeux non débloqués apparaissent avec un état "verrouillé".
- **Système de Points (XP)** : Les points s'accumulent en jouant et en gagnant.
- **Déblocage de Contenu** : Les nouveaux jeux se débloquent automatiquement ou manuellement une fois le palier d'XP atteint.
- **Barre de Progression** : Affichage du niveau actuel et du total d'XP en haut de l'écran.

### 4.2 Jeu : Le Pendu (Hangman)
- **Déblocage** : Disponible par défaut (**0 XP**).
- **Gameplay** : Deviner un mot caché lettre par lettre avant que le pendu ne soit complet.
- **Fonctionnalités** :
    - Thèmes de mots variés (Animaux, Pays, Objets, etc.).
    - Interface visuelle avec dessin progressif du pendu.
    - Clavier virtuel pour une utilisation mobile facilitée.

### 4.3 Jeu : Mots Mêlés (Word Search)
- **Déblocage** : Coût de **50 XP**.
- **Niveaux de difficulté** : Ajout de niveaux (ex: Taille de grille, temps limité).
- **Génération** : Grilles dynamiques en français.

### 4.4 Jeu : Jeu de Paires (Memory)
- **Déblocage** : Coût de **100 XP**.
- **Niveaux de difficulté** : Facile (12 cartes), Moyen (16 cartes), Difficile (36 cartes).
- **Fonctionnalités** : Minuteur, suivi des essais, thèmes d'emojis.

### 4.5 Jeu : Sudoku
- **Déblocage** : Coût de **250 XP**.
- **Niveaux de difficulté** : Facile, Moyen, Difficile.
- **Fonctions** : Notes, surbrillance, erreurs en temps réel, chrono.

### 4.6 Jeu : Match-3
- **Déblocage** : Coût de **500 XP**.
- **Gameplay** : Aligner des gemmes identiques.
- **Combos Spéciaux** : 
    - **Combo 4** : Création de gemmes Ligne/Colonne.
    - **Combo 5** : Création de gemmes Croix.
    - **Combo 6** : Création de gemmes Arc-en-ciel (nettoyage de couleur).
    - **Double Arc-en-ciel** : Nettoyage total de la grille.
- **Interface** : Compteurs de combos en temps réel dans le header.

### 4.7 Jeu : Scrabble Solo
- **Déblocage** : Coût de **1000 XP**.
- **Statut** : Terminé.
- **Gameplay** : Placer des lettres sur un plateau 15x15 pour former des mots.
- **Fonctionnalités** :
    - Dictionnaire Officiel du Scrabble (ODS) intégré pour validation stricte.
    - Comptage officiel des points (Cases Lettre/Mot Double/Triple appliquées aux nouvelles tuiles).
    - Règle du premier mot (passage par l'étoile centrale) et rattachement obligatoire.
    - **IA Intégrée** : 4 niveaux de difficulté (Débutant, Intermédiaire, Confirmé, Pro).
    - **Feedback Visuel** : Surbrillance néon cyan des lettres posées par l'IA.
    - **Interface localisée** : Labels du plateau en français (MT, MD, LT, LD).
    - **Aide Intégrée** : Un bouton "Aide" (suggestion d'un mot valide via l'IA niveau Confirmé) avec pré-visualisation sur le plateau.
    - **Fin de Partie** : Écran de fin stylisé avec score final, bonus de fin de sac et gestion des passes successifs.
    - **Accessibilité** : Entièrement jouable sur mobile (clavier virtuel et adaptation du chevalet).

#### Règles du Jeu (Standard)
1. **Préparation** : Chaque joueur commence avec 7 lettres. Les jokers ("blancs") valent 0 point mais remplacent n'importe quelle lettre.
    - L’ensemble de lettres comprend précisément 102 jetons lettres avec leur répartition officielle : 9 A, 2 B, 2 C, 3 D, 15 E, 2 F, 2 G, 2 H, 8 I, 1 J, 1 K, 5 L, 3 M, 6 N, 6 O, 2 P, 1 Q, 6 R, 6 S, 6 T, 6 U, 2 V, 1 W, 1 X, 1 Y, 1 Z et 2 jokers. 
2. **Déroulement** : 
   - Le premier mot doit couvrir la case centrale (étoile).
   - Les mots suivants doivent être rattachés à des lettres déjà présentes.
   - À chaque tour, on peut poser un mot, échanger des lettres, passer, ou demander de l'Aide.

3. **Score** :
   - Cases Bleu clair/foncé : Lettre compte double/triple.
   - Cases Rose/Rouge : Mot compte double/triple.
   - Bonus "Scrabble" : +50 points si les 7 lettres sont posées d'un coup.

4. **Fin de partie** : Se termine quand le sac est vide et qu'un joueur n'a plus de lettres, ou après deux tours de passes consécutifs par tous les joueurs. Les points des lettres restantes sont déduits du score final.

## 5. Choix Techniques & Outils de Développement
- **Langage** : **Vanilla JavaScript** (ES6+).
- **Styling** : **Vanilla CSS** avec variables CSS pour le thème (système de design robuste).
- **État** : Store global simple stocké dans `window.arcade` pour la persistance locale (`localStorage`).
- **Responsive Design** : Layout adaptatif (Grid/Flex) avec optimisation spécifique pour 1920x1080 (PC) et modes mobiles portrait/paysage.
- **Tests** : Suite de tests de non-régression visuelle automatisée avec **Playwright**.
- **Performance** : Code audité 100% via Lighthouse & Revue de Code stricte.
- **Mode Test (Dev Only)** : Possibilité de débloquer tous les contenus via le paramètre URL `?test=true`.

## 6. Feuille de Route (Roadmap)
1. **Phase 1** : Initialisation et Design System (Terminé).
2. **Phase 2** : Système de points et Sudoku (Terminé).
3. **Phase 3** : Développement du Mots Mêlés (Terminé).
4. **Phase 4** : Sélecteur de thème manuel et déblocage XP (Terminé).
5. **Phase 5** : Niveaux de difficulté au Mots Mêlés (Terminé).
6. **Phase 6** : Développement complet de Match-3 avec combos et effets (Terminé).
7. **Phase 7** : Développement du jeu Le Pendu (Terminé).
8. **Phase 8** : Implémentation du Scrabble Solo (Terminé).
9. **Phase 9** : Développement du Jeu de Paires (Terminé).
10. **Phase 10** : Optimisation Responsive (PC 1920x1080 / Mobile) et automatisation des tests visuels Playwright (Terminé).
11. **Phase 11** : Améliorations Scrabble v2 (Bouton Aide, Traduction FR) et Lighthouse (Terminé).

