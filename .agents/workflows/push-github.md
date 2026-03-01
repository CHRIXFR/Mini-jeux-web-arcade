---
description: Comment pousser les modifications sur GitHub correctement sur ce système
---

// turbo-all
Ce projet utilise PowerShell sur Windows. Voici les règles impératives à suivre pour les commandes Git :

0. **Test et Validation OBLIGATOIRES AVANT Push** :
   - L'agent n'a **JAMAIS LE DROIT** de lancer un `git push` sans preuve qu'un test a été effectué (ex: exécution de statuts, tests manuels ou `/test-lighthouse`).

1. **Syntaxe PowerShell** : Ne jamais utiliser `&&` pour enchaîner les commandes. Utiliser le point-virgule `;` à la place.
   - Exemple : `git add . ; git commit -m "Message" ; git push origin main`

2. **Langue des messages** : Les messages de commit (`commit -m`) DOIVENT être rédigés en **Français**, en restant brefs et descriptifs.

3. **Vérification** : Toujours vérifier le nom de la branche avec `git branch --show-current` avant de pousser si un doute subsiste.

4. **Performance (Éviter le spam de statut)** : Pour la commande `git push`, utiliser un délai `WaitMsBeforeAsync` de **10000ms** (10 secondes). Cela permet à la commande de se terminer de manière synchrone et évite de multiplier les notifications de vérification d'état en arrière-plan.
