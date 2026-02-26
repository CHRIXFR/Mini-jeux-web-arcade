---
description: Procédure de test de performance et d'accessibilité avec Lighthouse
---

Ce document définit la procédure pour tester le projet localement et analyser sa qualité via Lighthouse.

## 1. Lancement du Serveur Local
Comme le projet utilise des requêtes `fetch` (dictionnaires), il doit être servi par un serveur HTTP.

1.  Ouvrir un terminal dans la racine du projet.
2.  Lancer un serveur rapide avec Node.js (via `npx`) :
    ```powershell
    npx serve .
    ```
    *Note : Si `serve` n'est pas installé, npx le téléchargera temporairement.*
3.  Noter l'URL locale fournie (généralement `http://localhost:3000`).

## 2. Analyse Lighthouse
1.  Ouvrir le navigateur (Chrome ou Edge) à l'adresse du serveur local.
2.  Ouvrir les **Outils de développement** (F12 ou clic droit > Inspecter).
3.  Aller dans l'onglet **Lighthouse**.
4.  Paramètres recommandés :
    - **Mode** : Navigation (Default)
    - **Device** : Desktop (pour les jeux)
    - **Categories** : Performance, Accessibility, Best Practices, SEO.
5.  Cliquer sur **"Analyze page load"**.

## 3. Rapport et Améliorations
Une fois le test terminé :
- Identifier les scores inférieurs à 90.
- Relever les suggestions d'amélioration (ex: compression d'images, labels ARIA manquants, ressources bloquantes).
- Proposer un plan d'action pour corriger les points critiques relevés par l'extension.
