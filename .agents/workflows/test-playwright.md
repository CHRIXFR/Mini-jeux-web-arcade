---
description: Exécuter les tests visuels Playwright pour les différentes résolutions
---

# Lancer les tests Playwright pour le projet Mini-jeux-web

Ce document explique comment exécuter les tests Playwright qui valident le rendu visuel et la non-régression de l'affichage sur différentes résolutions (PC plein écran, PC fenêtré, Tablettes et Mobiles).

## 1. Prérequis
Assurez-vous que les packages sont installés. Si Playwright n'a pas été exécuté depuis longtemps :
```cmd
npm i -D @playwright/test
npx playwright install
```

## 2. Lancer les tests en arrière-plan
Pour vérifier le code et générer des captures d'écran sans interface visuelle (mode headless par défaut) :
```cmd
// turbo
npx playwright test
```

> [!NOTE]  
> Le script `npx playwright test` lancera tout seul un serveur local (via `http-server` sur le port 8080) car cela est configuré dans le `playwright.config.js`. Aucune autre action n'est requise.

## 3. Lancer les tests avec interface graphique (UI Mode)
Si vous souhaitez voir Playwright cliquer sur les boutons, interagir avec la modale et vérifier visuellement chaque étape :
```cmd
npx playwright test --ui
```

## 4. Voir le rapport d'exécution HTML
À la fin de l'exécution, si un test a échoué (ou pour voir les captures d'écran), vous pouvez lancer le rapport d'analyse Playwright qui s'ouvrira dans votre navigateur :
```cmd
npx playwright show-report
```

## 5. Mettre à jour les captures de référence
Si vous avez intentionnellement modifié le design ou l'interface d'un jeu, il faut mettre à jour les captures de référence (snapshots), sinon les tests échoueront :
```cmd
npx playwright test --update-snapshots
```

## 6. Exécuter des tests ciblés
Pour gagner du temps, particulièrement en phase de développement, vous pouvez lancer uniquement les tests dont vous avez besoin :
```cmd
# Lancer les tests d'un fichier spécifique
npx playwright test tests/arcade.spec.js

# Lancer un test par son nom (ex: rendu du thème sombre)
npx playwright test -g "Thème Sombre"

# Lancer les tests sur une résolution précise
npx playwright test --project="Desktop PC Plein Écran"
```

## 7. Résolutions et Composants Testés
Les tests sont configurés (avec 1 worker local pour la stabilité) pour capturer spécifiquement le Header (`.header-content`) et la grille de jeux (`.game-wrapper`), à la fois en thème Sombre (défaut) et en thème Clair.

Les résolutions couvertes sont :
- **Desktop-chrome-1080p** (1920x1080)
- **Desktop-chrome-1440p** (2560x1440)
- **Desktop-chrome-2160** (3840x2160)
- **Mobile Galaxy A51** (Portrait / Paysage : 414x914 / 914x414)