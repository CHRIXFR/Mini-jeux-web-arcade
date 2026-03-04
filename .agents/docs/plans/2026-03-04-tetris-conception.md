# Conception du Mini-Jeu : Tetris Glassmorphism

## 1. Description Générale
Ajout du classique **Tetris** à l'Arcade Minimaliste. Le jeu sera le défi ultime de la plateforme, déblocable pour **1500 XP**. L'accent sera mis sur un gameplay dynamique et une esthétique premium en accord avec le reste de l'application.

## 2. Déblocage & Intégration
- **Coût de déblocage** : 1500 XP.
- **Accessibilité** : Jouable sur PC et Mobile.
- **Thème Visuel** : S'intègre aux thèmes Sombre et Clair avec des Tétrominos stylisés façon "Glassmorphism" (légère transparence, reflets vitrés, couleurs néons sur fond sombre).

## 3. Mécaniques de Jeu
- **Taille de la Grille (Matrice)** :
  - Standard : 10 colonnes x 20 lignes visibles (avec zone de buffer invisible en haut pour l'apparition).
- **Difficulté & Vitesse** :
  - Évolutive "Arcade" : La vitesse de chute des blocs (Gravity) augmente tous les X lignes complétées (ex: 10 lignes = Niveau suivant).
- **Prochaine Pièce (Next Piece)** :
  - Affichage classique de la seule pièce suivante à venir (pas de système de "Hold" ni de prévisions multiples pour conserver un feeling old-school/difficile).
- **Score (Basé sur les standards globaux)** :
  - 1 Ligne : Score de base x Niveau
  - 2 Lignes : Score supérieur x Niveau
  - 3 Lignes : Score fort x Niveau
  - 4 Lignes (Tetris !) : Score maximum x Niveau + Animation spéciale (ex: flash écran / shake).
- **Fin de partie (Game Over)** :
  - Lorsqu'une nouvelle pièce ne peut pas apparaitre (grille pleine jusqu'en haut).
  - XP gagnée proportionnellement au score/lignes netoyées.

## 4. Contrôles
- **PC (Clavier)** :
  - `Flèche Gauche / Droite` : Déplacement latéral.
  - `Flèche Haut` : Rotation horaire.
  - `Flèche Bas` : Chute accélérée (Soft Drop).
  - `Espace` : Chute instantanée (Hard Drop) *Optionnel mais recommandé*.
- **Mobile (Tactile hybride)** :
  - **Zone de jeu principale** : Swipes directionnels (gauche/droite pour bouger, bas pour drop) et Tap (pour tourner).
  - **Boutons Virtuels** : Discrets, situés sous/à côté de la grille pour ceux qui préfèrent des inputs précis (Gauche, Droite, Bas, Rotation).

## 5. Interface Visuelle (UI/UX)
- **Conteneur Principal** : `.tetris-game-container`
- **En-tête (Header)** : Affichage du Score, du Niveau actuel, et des Lignes complétées.
- **Grille (Playfield)** : `.tetris-grid` utilisant `var(--border)` pour délimiter les cases.
- **Look des Blocs (Glassmorphism)** :
  - Utilisation de `box-shadow` internes/externes et fonds semi-transparents.
  - Couleurs standards (I=Cyan, J=Bleu, L=Orange, O=Jaune, S=Vert, T=Violet, Z=Rouge).
- **Animations** :
  - Effet d'éclatement/décoloration lors d'une ligne complétée.
  - Tremblement de la grille (`shake`) sur un Hard Drop ou un Tetris (4 lignes).

## 6. Architecture Technique (Vanilla JS)
- `initTetris()` : Initialisation de la grille et des listeners.
- Boucle de jeu basée sur `requestAnimationFrame` pour une fluidité parfaite (plutôt que `setInterval`).
- Matrice 2D (`let playfield = []`) pour stocker l'état fixe des blocs.
- Objet `tetromino` actif géré indépendamment avant fixation.
- Persistance du High Score dans `window.arcade.state`.
