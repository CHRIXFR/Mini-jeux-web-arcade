---
trigger: model_decision
description: Règle pour proposer la création de branches GitHub lors de nouvelles fonctionnalités ou modifications importantes.
---

# Gestion des Branches et Workflow Git

Avant de commencer toute modification significative du code (nouvelle fonctionnalité, refonte de composant, correction de bug complexe), vous devez évaluer si une branche dédiée est nécessaire.

## 1. Quand proposer une branche ?
Vous DEVEZ proposer à l'utilisateur de créer une nouvelle branche dans les cas suivants :
- **Nouvelle fonctionnalité** : Ajout d'un nouveau jeu, d'une nouvelle page ou d'un module majeur.
- **Refactoring important** : Modification de la structure de navigation, changement de bibliothèque CSS ou restructuration de la logique commune.
- **Expérimentation** : Test d'un nouveau design ou d'une nouvelle technologie.
- **Tâche multi-étapes** : Toute modification qui nécessite plusieurs tours d'interaction et qui pourrait laisser le `main` dans un état instable temporairement.

## 2. Comment proposer ?
La proposition doit être proactive et se faire **AVANT** d'écrire le code. 
- *Exemple* : "Cette modification touche au cœur de la navigation. Préférez-vous que je crée une branche dédiée (ex: `feat-navigation-refactor`) pour travailler en toute sécurité avant de fusionner sur `main` ?"

## 3. Workflow de création
Si l'utilisateur accepte :
1. Vérifier la branche actuelle : `git branch --show-current`.
2. Créer et basculer sur la nouvelle branche : `git checkout -b <nom-de-la-branche>`.
3. Informer l'utilisateur que vous travaillez désormais sur cette branche.

## 4. Branche Main
Les corrections mineures (typos, bugs simples de CSS, mise à jour de documentation) peuvent continuer à être faites directement sur `main`, sauf si l'utilisateur demande explicitement une branche.
