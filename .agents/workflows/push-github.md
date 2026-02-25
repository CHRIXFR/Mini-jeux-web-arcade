---
description: Comment pousser les modifications sur GitHub correctement sur ce système
---

Ce projet utilise PowerShell sur Windows. Voici les règles impératives à suivre pour les commandes Git :

1. **Syntaxe PowerShell** : Ne jamais utiliser `&&` pour enchaîner les commandes. Utiliser le point-virgule `;` à la place.
   - Exemple : `git add . ; git commit -m "Message" ; git push origin main`

2. **Langue des messages** : Les messages de commit (`commit -m`) DOIVENT être rédigés en **Français**, en restant brefs et descriptifs.

3. **Vérification** : Toujours vérifier le nom de la branche avec `git branch --show-current` avant de pousser si un doute subsiste.
