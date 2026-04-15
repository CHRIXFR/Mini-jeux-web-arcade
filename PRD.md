# Document de Conception Produit : Plateforme de Mini-Jeux Web - Arcade Minimaliste

## 1. Vision du projet
L'objectif est de proposer une application web moderne, fluide et élégante qui regroupe une collection de mini-jeux rejouables.
Le produit doit conserver une expérience "app-like", une identité visuelle forte, et une architecture simple à faire évoluer.

- Repository GitHub : [https://github.com/CHRIXFR/Mini-jeux-web-arcade](https://github.com/CHRIXFR/Mini-jeux-web-arcade)
- Application live : [https://chrixfr.github.io/Mini-jeux-web-arcade/](https://chrixfr.github.io/Mini-jeux-web-arcade/)

## 2. Objectifs produit (état actuel)
- Engagement : proposer des sessions courtes, variées et rejouables.
- Accessibilité : application gratuite, sans installation, utilisable sur mobile et desktop.
- Qualité perçue : interface premium avec animations, audio et interactions soignées.
- Évolutivité : architecture modulaire permettant d'ajouter rapidement de nouveaux jeux et des fonctionnalités transverses.

## 3. Principes UX/UI
### 3.1 Design visuel
- Esthétique minimaliste et moderne.
- Typographie principale : Outfit.
- Palette sobre avec gestion de thèmes.
- Thèmes visuels disponibles : Clair, Sombre, Violet Néon, Bleu Océan.

### 3.2 Interaction et animations
- Micro-animations discrètes pour confirmer les actions utilisateur.
- Feedback visuel cohérent (succès, erreur, transition) entre les jeux.

### 3.3 Accessibilité et ergonomie
- Interface adaptée aux formats desktop et mobile (portrait/paysage).
- Contrôles tactiles intégrés sur les jeux qui le nécessitent.
- Lisibilité et densité d'information optimisées en contexte de jeu.

### 3.4 Localisation
- Interface exclusivement en français.

## 4. Périmètre fonctionnel actuel
### 4.1 Hub d'accueil
- Grille de sélection des jeux avec accès direct.
- Entrée unique pour lancer les jeux et revenir au hub.

### 4.2 Cycle de vie standard d'un jeu
- Démarrage via écran de lancement/modal de départ.
- Session de jeu.
- Écran de fin/modal de fin avec relance possible.

### 4.3 Persistance locale
- Préférences et états utiles sauvegardés localement via `localStorage`.
- État global exposé dans `window.arcade`.

## 5. Catalogue des jeux (état actuel)
### 5.1 Le Pendu (Hangman)
- Gameplay : deviner un mot caché lettre par lettre avant complétion du pendu.
- Modes : thèmes de mots variés (animaux, pays, objets, etc.).
- Fonctionnalités : dessin progressif du pendu, clavier virtuel mobile.
- Statut : terminé et jouable sur desktop/mobile.

### 5.2 Mots Mêlés (Word Search)
- Gameplay : retrouver des mots dans une grille.
- Modes : niveaux de difficulté (taille de grille, temps limité).
- Fonctionnalités : génération dynamique des grilles en français.
- Statut : terminé.

### 5.3 Jeu de Paires (Memory)
- Gameplay : retrouver toutes les paires en un minimum d'essais.
- Modes : facile (12 cartes), moyen (16 cartes), difficile (36 cartes).
- Fonctionnalités : minuteur, suivi des essais, thèmes d'emojis.
- Statut : terminé.

### 5.4 Sudoku
- Gameplay : compléter une grille 9x9 selon les règles classiques.
- Modes : facile, moyen, difficile.
- Fonctionnalités : notes, surbrillance, erreurs en temps réel, chronomètre.
- Statut : terminé.

### 5.5 Match-3
- Gameplay : aligner des gemmes identiques.
- Modes : progression par maîtrise des combinaisons.
- Fonctionnalités :
  - Combo 4 : gemme ligne/colonne.
  - Combo 5 : gemme croix.
  - Combo 6 : gemme arc-en-ciel (nettoyage de couleur).
  - Double arc-en-ciel : nettoyage total de la grille.
  - Compteurs de combos en temps réel dans le header.
- Statut : terminé.

### 5.6 Scrabble Solo
- Gameplay : poser des lettres sur une grille 15x15 pour former des mots valides.
- Modes : IA 4 niveaux (débutant, intermédiaire, confirmé, pro).
- Fonctionnalités :
  - Validation stricte via dictionnaire ODS.
  - Comptage officiel des points (LT/LD/MT/MD) appliqué aux nouvelles tuiles.
  - Respect des règles de pose (étoile centrale au premier mot, rattachement obligatoire).
  - Bouton Aide avec suggestion valide (niveau confirmé) et prévisualisation.
  - Surbrillance visuelle des lettres posées par l'IA.
  - Écran de fin de partie avec score final et bonus de fin de sac.
  - Optimisations phase 15 : dictionnaire JSON, compteur de jetons restants, correction du biais de placement IA, isolation des simulations IA.
  - Jouable sur mobile.
- Statut : terminé.

#### Règles du jeu (standard)
1. Préparation : chaque joueur commence avec 7 lettres. Les jokers valent 0 point et remplacent n'importe quelle lettre.
2. Distribution officielle : 102 jetons lettres (9 A, 2 B, 2 C, 3 D, 15 E, 2 F, 2 G, 2 H, 8 I, 1 J, 1 K, 5 L, 3 M, 6 N, 6 O, 2 P, 1 Q, 6 R, 6 S, 6 T, 6 U, 2 V, 1 W, 1 X, 1 Y, 1 Z, 2 jokers).
3. Déroulement :
   - Premier mot sur l'étoile centrale.
   - Mots suivants rattachés aux lettres déjà présentes.
   - À chaque tour : poser, échanger, passer, ou demander de l'aide.
4. Score :
   - Bleu clair/foncé : lettre double/triple.
   - Rose/rouge : mot double/triple.
   - Bonus Scrabble : +50 points si 7 lettres posées en un tour.
5. Fin de partie : sac vide + un joueur sans lettres, ou deux tours de passes consécutifs de tous les joueurs. Les points des lettres restantes sont déduits.

### 5.7 Jeu des Capitales
- Gameplay : deviner le pays ou la capitale associée au drapeau affiché.
- Modes :
  - Nommer le pays.
  - Nommer la capitale.
  - Mode mixte aléatoire.
- Fonctionnalités :
  - Drapeaux chargés via `flagcdn.com`.
  - QCM à 5 choix (1 bonne réponse, 4 distracteurs).
  - Feedback visuel animé sur réponse correcte/incorrecte.
- Statut : terminé.

### 5.8 Tetris Glassmorphism
- Gameplay : gérer la chute des tétrominos, compléter des lignes, survivre à l'accélération.
- Modes : progression classique score + niveaux.
- Fonctionnalités :
  - Preview de la pièce suivante.
  - Contrôles clavier desktop + boutons tactiles mobile.
  - Effets sonores Web Audio et playlist de musiques de fond MP3.
  - Effets premium : secousse sur Tetris, flash lors des lignes complétées, modales début/fin personnalisées.
- Statut : terminé.

### 5.9 Objets Cachés
- Gameplay : retrouver des objets cibles dans une scène chargée avant la fin du temps.
- Modes : thèmes immersifs (cuisine, nature, espace).
- Fonctionnalités :
  - Assets V2 haute résolution (génération IA).
  - Chronomètre global avec bonus/malus de temps selon précision du clic.
  - Effets visuels (shake erreur, pop succès).
  - Difficulté progressive automatique.
  - Modales start/end standardisées et effets sonores.
- Statut : terminé.

### 5.10 Blind Test Musical
- Gameplay : identifier une musique jouée au synthétiseur 8-bits.
- Modes : film, animation, classique, mixte/pop/jeu-vidéo.
- Fonctionnalités :
  - Base de +40 partitions générées via Node.js (`gen-partition`).
  - QCM à 5 choix dynamiques.
  - Interruption propre de la boucle audio.
  - Animation d'onde CSS synchronisée avec le moteur audio (`playMelody`).
- Statut : terminé.

### 5.11 Snake
- Gameplay : faire grandir le serpent sans collision.
- Modes : progression dynamique par paliers.
- Fonctionnalités :
  - Difficulté évolutive tous les 5 fruits.
  - Obstacles/murs générés aléatoirement selon le niveau.
  - Style glassmorphism pour les conteneurs.
  - Contrôles hybrides clavier (`Flèches`/`ZQSD`) + D-Pad tactile.
- Statut : terminé.

### 5.12 Neon Pulse
- Gameplay : variante néon du casse-briques.
- Modes : 10 niveaux progressifs, objectif de progression (3 vies max).
- Fonctionnalités :
  - Effets glow et traînée dynamique de balle.
  - Bonus/malus aléatoires : multiballe, raquette géante, double lasers, vie supplémentaire rare.
  - Gestion audio dynamique via Web Audio API pour limiter latence et crashs.
- Statut : terminé.

### 5.13 Jeu de dés 421
- Gameplay : optimiser 3 dés sur un maximum de 3 lancers par manche.
- Modes :
  - Solo score-attack (10 manches, objectif 30 points).
  - Duel local 2 joueurs en pass-and-play (alternance par ronde sur le même appareil).
- Fonctionnalités :
  - Verrouillage manuel des dés (hold) entre les lancers.
  - Validation volontaire de manche + bonus "sec" x2 si validation au 1er lancer.
  - Évaluation déterministe des combinaisons (`421`, `Mac 1`, `Fiche`, `Baraque`, `Suite`, `Nénette`).
  - Tie-break décisif en duel en cas d'égalité (bonus sec désactivé pendant le tie-break).
  - Topbar standardisée (manche/score), panneau comparatif J1/J2, modales start/end unifiées.
- Persistance record local conservée uniquement pour le mode solo.
- Statut : terminé.

### 5.14 UNO
- Gameplay : se défausser de toutes ses cartes avant les autres selon les règles UNO classiques.
- Modes :
  - Solo contre IA (1 joueur humain vs 1 IA).
  - Multijoueur local pass-and-play (2, 3 ou 4 joueurs sur le même appareil).
- Fonctionnalités :
  - Deck UNO standard 108 cartes.
  - Cartes action gérées : `skip`, `reverse`, `draw2`, `wild`, `wild draw4`.
  - Règles v1 strictes : pas de stacking, pas de variantes 7-0/jump-in.
  - Écran de passation obligatoire en multi local pour masquer les mains.
  - Hook de test déterministe (`setTestDeck`) pour scénarios E2E.
  - Stats solo persistées localement (`victoires / parties`) sans leaderboard multi.
- Statut : terminé.

## 6. Fonctionnalités transverses (hors ajout de jeu)
### 6.1 Gestion des thèmes
- Commutateur manuel disponible dans l'interface.
- Variables CSS centralisées pour garantir la cohérence visuelle.
- Catalogue des thèmes : Clair, Sombre, Violet Néon, Bleu Océan.

### 6.2 Audio global
- Effets sonores contextuels dans plusieurs jeux.
- Lecture de musiques de fond (selon le jeu et le contexte).

### 6.3 Modale Changelog & Suggestions
- Modale accessible via avatar flottant.
- Onglet Nouveautés : historique des mises à jour produit.
- Onglet Suggérer : formulaire Formspree (`https://formspree.io/f/xqedogeo`) pour nouvelles idées.
- Soumission AJAX (`fetch` + `try...catch`) sans rechargement.
- Message de confirmation visuel après envoi.

### 6.4 Responsive & mobile
- Layout adaptatif via Grid/Flex.
- Optimisations dédiées mobile dans `mobile.css`.
- Ajustements ergonomiques en mode jeu (viewport, header, bouton retour).

### 6.5 Performance et qualité
- Optimisations d'assets et de chargement.
- Revue régulière de la qualité perçue et des performances Lighthouse.

## 7. Architecture technique & standards
### 7.1 Stack technique
- Langage : Vanilla JavaScript (ES6+).
- Styling : Vanilla CSS avec variables de design system.
- État : store global `window.arcade` + persistance locale `localStorage`.

### 7.2 Organisation et conventions
- Architecture modulaire orientée jeux + socle transverse.
- Normalisation des conventions de nommage et de structure.

### 7.3 Templates obligatoires
- Documents de référence : `js-game-template.md` et `css-game-template.md` (dans `.agents/rules/`).
- Règle d'or : un nouveau jeu est incomplet s'il ne respecte pas l'API de modales standardisées et le système responsive défini.

### 7.4 Tests
- Tests de non-régression visuelle automatisés avec Playwright.
- Vérification de compatibilité mobile/desktop sur les écrans cibles.

## 8. Processus d'évolution du produit
### 8.1 Ajouter un nouveau jeu
#### Critères produit
- Proposer un gameplay identifiable en moins de 30 secondes.
- Avoir une boucle de jeu claire (début, progression, fin).

#### Checklist technique
- Respect des templates JS/CSS obligatoires.
- Intégration au hub d'accueil.
- Compatibilité store global et persistance locale si nécessaire.

#### Checklist UX/UI
- Cohérence visuelle avec le design system.
- Feedback visuels/audio cohérents.
- Contrôles desktop + mobile selon le besoin.

#### Checklist tests
- Test manuel complet (début, fin, relance, retour hub).
- Ajout/maj des scénarios Playwright utiles.
- Validation responsive desktop/mobile.

### 8.2 Ajouter une fonctionnalité transverse
#### Critères produit
- Apporter une valeur mesurable à plusieurs jeux ou au hub.
- Ne pas dégrader la fluidité globale.

#### Analyse d'impact
- Cartographier les jeux et écrans impactés.
- Vérifier la compatibilité avec thèmes, audio, navigation et persistance.

#### Compatibilité multi-jeux
- Prévoir un comportement par défaut pour les jeux non adaptés immédiatement.
- Documenter le plan de migration si adaptation progressive.

#### Checklist tests
- Couvrir au minimum 3 jeux représentatifs + hub.
- Vérifier les régressions visuelles et ergonomiques.
- Valider la stabilité sur mobile.

## 9. Historique des décisions & roadmap
### 9.1 Vue chronologique complète (phases 1 à 32)
1. Phase 1 : Initialisation et design system (terminé).
2. Phase 2 : Mise en place du socle de progression initial + Sudoku (terminé).
3. Phase 3 : Développement de Mots Mêlés (terminé).
4. Phase 4 : Sélecteur de thème manuel + itération hub (terminé).
5. Phase 5 : Niveaux de difficulté de Mots Mêlés (terminé).
6. Phase 6 : Développement complet de Match-3 (combos + effets) (terminé).
7. Phase 7 : Développement de Le Pendu (terminé).
8. Phase 8 : Implémentation de Scrabble Solo (terminé).
9. Phase 9 : Développement du Jeu de Paires (terminé).
10. Phase 10 : Optimisation responsive (PC 1920x1080 / mobile) + automatisation Playwright (terminé).
11. Phase 11 : Améliorations Scrabble v2 (Aide, FR) + Lighthouse (terminé).
12. Phase 12 : Formulaire de suggestions intégré à la modale Changelog via Formspree (terminé).
13. Phase 13 : Création du Jeu des Capitales avec 3 modes + `flagcdn` (terminé).
14. Phase 14 : Optimisation avatar flottant (GIF vers MP4/JPEG) (terminé).
15. Phase 15 : Debug et amélioration Scrabble (fuite de lettres, compteur, placement IA, JSON dictionnaire) (terminé).
16. Phase 16 : Optimisation architecture CSS (découpage + minification) (terminé).
17. Phase 17 : Refonte UI/UX premium et ajout de deux thèmes visuels supplémentaires (Violet Néon, Bleu Océan) (terminé).
18. Phase 18 : Création et implémentation de Tetris Glassmorphism (terminé).
19. Phase 19 : Ajout gestion sons et musiques de fond (Web Audio + player MP3) (terminé).
20. Phase 20 : Amélioration interface d'accueil, sons jeux, préchargement ressources (terminé).
21. Phase 21 : Standardisation cycle de vie des jeux (modales start/end) + templates JS/CSS obligatoires (terminé).
22. Phase 22 : Implémentation Objets Cachés V2 (thèmes + assets IA) (terminé).
23. Phase 23 : Ajout Blind Test Musical (moteur audio, QCM, partitions) (terminé).
24. Phase 24 : Conception et implémentation Snake (glassmorphism + contrôles hybrides) (terminé).
25. Phase 25 : Création Neon Pulse (casse-briques), stabilisation audio, progression par niveaux/bonus (terminé).
26. Phase 26 : Optimisation mobile avec `mobile.css` (media queries, header masqué en jeu, bouton retour compact flottant, viewport maximisé) (terminé).
27. Phase 27 : Standardisation des titres et menus des jeux (terminé) : topbar unifiée sur les 12 jeux (`icône + titre + difficulté (si applicable) + score/stat`), optimisations responsive mobile portrait/paysage, validation Playwright multi-résolutions (1080p/1440p/2160p + Samsung A51 412x914).
28. Phase 28 : Ajout du jeu de dés 421 (terminé) : mode solo arcade en 10 manches, système hold + bonus sec, topbar/manches-score, intégration responsive desktop/mobile, scénario Playwright ciblé.
29. Phase 29 : Évolution 421 en mode 2 joueurs local (terminé) : alternance Joueur 1/Joueur 2 par ronde, sélection de mode dans la modale de départ, tie-break décisif sans bonus sec, tests Playwright duo + tie-break.
30. Phase 30 : Ajout du jeu UNO (terminé) : moteur unique règles classiques, mode solo contre IA, multi local 2/3/4 avec passation, intégration responsive et scénarios Playwright dédiés.
31. Phase 31 : Ajout du jeu Suite Logique (terminé) : modes `forme`, `chiffre` et `mixte` (alternance déterministe), session courte en 10 questions, 3 erreurs max, difficulté progressive, indice avec réduction de score, topbar/stat standardisée, record local et scénarios Playwright dédiés.
32. Phase 32 : Optimisation UI globale (terminé) : consolidation des tokens UI, refonte du hero et des cartes hub, normalisation topbar/shell in-game, harmonisation responsive desktop/mobile, extension des captures Playwright (hub + topbar jeux représentatifs).

### 9.2 Lecture par type de décision
#### Phases orientées ajout de jeux
- 3, 5, 6, 7, 8, 9, 13, 18, 22, 23, 24, 25, 28, 29, 30, 31.

#### Phases orientées fonctionnalités transverses / plateforme
- 1, 2, 4, 10, 12, 14, 16, 17, 19, 20, 21, 26, 32.

#### Phases orientées optimisation / qualité
- 10, 11, 15, 16, 20, 25, 26, 27, 32.

## 10. Idées futures (backlog)
### 10.1 Idées de nouveaux jeux
- Priorité en fonction de la complémentarité avec le catalogue actuel.
- Favoriser les concepts jouables en sessions courtes.

### 10.2 Idées de fonctionnalités transverses
- Améliorations de navigation, personnalisation et confort de jeu.
- Évolutions du hub et des standards de qualité globaux.
- Ameiloration de la prise en charge mobile.

### 10.3 Priorisation
- Utiliser une matrice Impact / Effort.
- Prioriser les sujets à fort impact transverse et faible complexité.

### 10.4 Critères d'entrée en roadmap
- Définition claire du besoin utilisateur.
- Estimation d'impact produit et technique.
- Plan de test minimum (manuel + régression visuelle si nécessaire).
