---
trigger: always_on
description: Règles de codage et standards de qualité pour le projet Mini-jeux-web
---

Ce document définit les standards que tout agent doit respecter lors de la modification ou de l'ajout de code dans ce projet.

## 0. Utilisation des Modèles d'IA et Modes de Travail
En tant qu'assistant IA, vous DEVEZ guider l'utilisateur sur la meilleure approche technique :
- **Mode Planning (Gemini ou Claude)** : Toujours proposer ou utiliser ce mode pour démarrer une nouvelle fonctionnalité complexe, créer l'architecture ou rédiger les plans (PRD).
- **Codage Principal (Claude 4.6 Sonnet recommandé)** : Conseiller à l'utilisateur de basculer sur un modèle performant en code pour le gros de l'implémentation.
- **Mode Fast (Gemini)** : À privilégier pour les itérations très rapides, les petites corrections de bugs ciblées ou le lancement de tests isolés.
*Note comportementale : Suggérer proactivement le changement de modèle ou de mode si la tâche demandée y est plus adaptée (ex: "Je vous conseille de passer en mode Fast avec Gemini pour ce petit correctif...").*

## 1. Langue et Commentaires
- **Code Explicite > Commentaires** : Ne pas commenter ce que fait le code si celui-ci est déjà explicite par son nommage.
  - *Mauvais* : `i++; // Incrémente i`
  - *Bon* : Favoriser des noms de variables clairs comme `tentativesRestantes` au lieu de `tr`.
- **Le "Pourquoi" plutôt que le "Quoi"** : Un commentaire doit expliquer une décision complexe ou une règle métier métier particulière, pas traduire la syntaxe.

## 2. Standards JavaScript
- **Nommage** : Utiliser le `camelCase` pour les variables et fonctions, et le `PascalCase` pour les classes. Les noms techniques restent en anglais (standard universel), mais leur explication est en français.
- **Déclarations** : Utiliser `const` par défaut, `let` seulement si la valeur change. Ne jamais utiliser `var`.
- **Fonctions** : Privilégier les fonctions courtes avec une seule responsabilité.
- **Asynchronisme** : Toujours encapsuler les appels `fetch` ou `async` dans des blocs `try...catch` pour une gestion d'erreur propre.

## 3. Qualité Web (HTML/CSS)
- **Sémantique** : Utiliser des balises HTML5 sémantiques (`<main>`, `<section>`, `<article>`, `<nav>`).
- **Design Premium** : Les interfaces doivent être modernes (gradients subtils, ombres douces, micro-animations au survol).
- **Accessibilité** : S'assurer que les boutons ont des rôles clairs et que les contrastes sont suffisants.

## 4. Maintenance
- **DRY (Don't Repeat Yourself)** : Si une logique est utilisée dans deux jeux différents, envisager de la déplacer dans un utilitaire commun.
- **Nettoyage** : Supprimer systématiquement les `console.log` de debug avant de finaliser une tâche.

## 5. Création de Jeux (Templates obligatoires)
Pour tout ajout ou modification d'un mini-jeu, vous DEVEZ utiliser conjointement :
- **Logique (JS)** : [js-game-template.md](file:///c:/Users/chjeu/Documents/Codes/Antigravity/Mini-jeux-web-arcade/.agents/rules/js-game-template.md)
- **Style (CSS)** : [css-game-template.md](file:///c:/Users/chjeu/Documents/Codes/Antigravity/Mini-jeux-web-arcade/.agents/rules/css-game-template.md)
Ces deux documents sont indissociables pour garantir la cohérence de l'Arcade.

## 6. Gestion des Branches (Workflow Git)
- **Proposer une branche** : Pour toute nouvelle fonctionnalité, refactoring majeur ou modification complexe, proposez systématiquement à l'utilisateur de créer une branche dédiée (ex: `feat-mon-jeu` ou `fix-bug-score`).
- **Préserver le Main** : Éviter de coder directement sur `main` pour des travaux de longue haleine. Consulter la règle [git-branches.md](file:///c:/Users/chjeu/Documents/Codes/Antigravity/Mini-jeux-web/.agents/rules/git-branches.md) pour les détails.
