---
description: Exécuter les tests visuels Playwright pour les différentes résolutions
---

# Lancer les tests Playwright pour le projet Mini-jeux-web

Ce document explique comment exécuter les tests Playwright qui valident le rendu visuel et la non-régression de l'affichage sur PC (1920x1080), Mobile Portrait et Mobile Paysage.

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

## 5. Captures d'écran (Screenshots)
Si les tests se terminent avec succès, les captures d'écran mises à jour se trouveront directement dans le répertoire suivant de votre projet :
`tests/screenshots/`

Vous pourrez y comparer le rendu sur les 3 configurations générées :
- `Desktop PC (1920x1080)`
- `Mobile Portrait (Galaxy S9+)`
- `Mobile Landscape (Galaxy S9+)`
