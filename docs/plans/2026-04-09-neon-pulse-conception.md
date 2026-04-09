# Conception : Neon Pulse (Casse-briques)

## 1. Vision et Objectifs
**Neon Pulse** est un jeu de casse-briques moderne intégré à la Web Arcade. Il combine le gameplay classique d'Arkanoid avec une esthétique "Neon Cyber" et des effets visuels premium (glassmorphism, particules).

## 2. Expérience Utilisateur (UX)
- **Vibe** : Ambiance sombre, néons vibrants, traînées de lumière (trails) et secousse d'écran lors des impacts majeurs.
- **Accessibilité** : Jouable à la souris, au clavier et sur écran tactile (contrôles hybrides).
- **Audio** : Effets sonores synthétiques (Web Audio API) pour chaque impact et activation de bonus.

## 3. Mécaniques de Jeu
- **Niveaux** : Progression sur 10 niveaux aux motifs variés.
- **Vies** : 3 vies par niveau. En cas de perte d'une balle, une vie est déduite. À 0 vie, Game Over.
- **Briques** :
    - Classiques (1 coup).
    - Renforcées (2-3 coups, changement de teinte).
    - Incassables (obstacles).
- **Power-ups (Pastilles Néon)** :
    - **Multi-balles** : Fait apparaître 2 balles supplémentaires.
    - **Paddle Géant** : Élargit la raquette pour 15 secondes.
    - **Laser** : La balle devient une boule de feu détruisant tout sur son passage sans rebondir pendant 8 secondes.
- **Physique** : Angle de rebond dépendant du point d'impact sur le paddle (plus on tape sur les bords, plus l'angle est prononcé).

## 4. Architecture Technique
- **Canvas 2D** : Rendu graphique haute performance pour gérer les particules et les effets de lumière.
- **Moteur de collision** : Détection cercle/rectangle pour la balle, le paddle et les briques.
- **Système de particules** : Pool d'objets pour les explosions de briques afin d'optimiser les performances.

## 5. Intégration Arcade
- Utilisation des modales `window.arcade.showStartModal` et `window.arcade.showGameOverModal`.
- Enregistrement des scores (briques cassées) dans l'XP globale.
- Thème responsive (s'adapte à la taille de la fenêtre).
