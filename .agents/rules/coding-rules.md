---
trigger: always_on
description: Règles de codage et standards de qualité pour le projet Mini-jeux-web
---

Ce document définit les standards que tout agent doit respecter lors de la modification ou de l'ajout de code dans ce projet.

## 1. Pré-check GitHub/Git (obligatoire avant édition)
- **Règle bloquante** : Vérifier la branche courante avant toute modification de fichier.
- Si la branche courante est `main`, **créer immédiatement une nouvelle branche de travail** puis seulement ensuite modifier les fichiers.
- Ne jamais développer directement sur `main`.
- Convention recommandée de nommage : `feat/...`, `fix/...`, `chore/...`.

## 2. Langue et commentaires
- **Code explicite > commentaires** : Ne pas commenter ce que fait un code déjà clair.
- **Commenter le pourquoi, pas le quoi** : Expliquer les choix techniques, contraintes métier, cas limites.
- Le français est autorisé dans les explications UI/métier, mais garder des identifiants techniques cohérents.

## 3. Standards JavaScript
- **Nommage** : `camelCase` (variables/fonctions), `PascalCase` (classes).
- **Déclarations** : `const` par défaut, `let` si mutation, `var` interdit.
- **Fonctions** : Une responsabilité par fonction, taille raisonnable.
- **Asynchronisme** : Encadrer les appels `fetch`/`async` avec `try...catch`.
- **État global** : Éviter les effets de bord; privilégier des entrées/sorties explicites.

## 4. Qualité HTML/CSS/UI
- **Sémantique HTML5** : Utiliser `<main>`, `<section>`, `<article>`, `<nav>`, etc.
- **Accessibilité** : Labels clairs, contraste suffisant, focus clavier exploitable.
- **Design cohérent Arcade** : Respect des variables CSS existantes et des composants réutilisables.
- **Responsive** : Vérifier rendu mobile portrait/paysage pour toute UI de jeu.

## 5. Maintenabilité et hygiène
- **DRY** : Mutualiser les logiques communes entre jeux quand pertinent.
- **Pas de debug résiduel** : Retirer `console.log`/traces temporaires avant finalisation.
- **Compatibilité** : Ne pas casser les contrats existants (`window.initX`, modales standard, topbar, etc.).

## 6. Création ou évolution d'un jeu (templates obligatoires)
Pour tout ajout ou modification d'un mini-jeu, utiliser conjointement :
- **Logique (JS)** : [js-game-template.md](file:///c:/Users/chjeu/Documents/Codes/Codex/Mini-jeux-web-arcade/.agents/rules/js-game-template.md)
- **Style (CSS)** : [css-game-template.md](file:///c:/Users/chjeu/Documents/Codes/Codex/Mini-jeux-web-arcade/.agents/rules/css-game-template.md)

Ces deux documents sont indissociables pour garantir la cohérence de l'Arcade.

## 7. Validation avant livraison
- Vérifier rapidement le flux du jeu concerné : lancement, gameplay, fin de partie, retour menu.
- Vérifier qu'aucune ressource ne fuit entre jeux (timers/listeners/RAF).
- Exécuter les tests/contrôles pertinents disponibles dans le projet quand possible.

