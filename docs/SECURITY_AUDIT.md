# Revue totale code et securite

Date: 2026-04-28
Branche: `feat-security-audit-hardening`

## Synthese

Le projet est une arcade web statique composee de `index.html`, fichiers `games/*.js`, assets locaux, donnees JSON/SVG embarquees et tests Playwright. La revue a couvert les surfaces navigateur, supply chain, serveur statique local, stockage local, donnees externes, tests et deploiement GitHub Pages.

Aucun secret applicatif n'a ete trouve dans le depot. Les risques principaux etaient lies a l'injection DOM depuis donnees externes, au chargement de scripts CDN non totalement verrouille, au manque de headers de securite sur le serveur local de test, et a des lectures `localStorage` non tolerantes aux donnees corrompues.

## Constats traites

### Important - Changelog GitHub injecte via `innerHTML`

- Preuve: `index.html` recuperait les commits GitHub publics, filtrait les messages `News:`, puis injectait `cleanMessage` dans `li.innerHTML`.
- Risque: un message de commit contenant du HTML pouvait etre interprete comme DOM dans la modale changelog.
- Scenario: un commit `News: <img src=x onerror=...>` cree un noeud image et peut declencher du JavaScript selon le contexte navigateur.
- Correction: creation DOM explicite avec `textContent`/`createTextNode`, test Playwright avec payload HTML malveillant.

### Important - SVG de carte insere sans nettoyage

- Preuve: `games/capitales-map.js` chargeait `world-map.min.svg` et l'inserait via `worldWrap.innerHTML = svgText`.
- Risque: si le SVG local ou sa generation etait compromis, des balises ou attributs dangereux pouvaient entrer dans le DOM.
- Scenario: SVG contenant `<script>`, `onclick` ou `href="javascript:..."`.
- Correction: parsing via `DOMParser`, validation namespace/tag `svg`, suppression de tags actifs, suppression d'attributs `on*` et URLs dangereuses, insertion via `replaceChildren`.

### Important - Serveur Playwright sans headers securite

- Preuve: `scripts/playwright-static-server.js` servait les fichiers avec uniquement `Content-Type`.
- Risque: tests locaux moins proches d'un environnement durci et absence de garde-fous type MIME sniffing, framing, referrer et CSP.
- Scenario: une regression XSS ou de chargement externe peut passer sans signal de politique.
- Correction: ajout de `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` et `Content-Security-Policy`; remplacement de `url.parse` par `URL`.

### Moyen - `localStorage` corrompu bloque le rendu

- Preuve: `index.html` et `games/game-modal.js` appelaient `JSON.parse` directement pour certains records locaux.
- Risque: un utilisateur, une extension ou un test laissant du JSON invalide pouvait casser l'accueil ou une modale de lancement/fin.
- Scenario: `localStorage.setItem('arcade_hs_hangman', '{json-invalide')`.
- Correction: helper `safeJsonParse` avec fallback et avertissement console dans l'accueil et le systeme de modales; tests de non-regression accueil et modale.

### Moyen - CDN non epingle au maximum utile

- Preuve: `SortableJS` etait charge via `@latest`; plusieurs scripts externes n'avaient pas de `crossorigin`/`referrerpolicy`.
- Risque: mise a jour involontaire ou fuite de referrer plus large que necessaire.
- Correction: `SortableJS` epingle en `1.15.2`; `Driver.js` et `SortableJS` declarent `crossorigin="anonymous"` et `referrerpolicy="no-referrer"`; GoatCounter utilise une URL `https://` explicite.
- Reste: ajouter des attributs SRI apres verification des hash exacts CDN dans un environnement reseau sain.

## Surfaces revues

- Frontend: `index.html`, modale changelog/suggestion, store global `window.arcade`, rendu home, modal system.
- Jeux: focus sur `games/capitales-map.js`, lectures de donnees locales, patterns `innerHTML` restants.
- Donnees: `games/data/capitales.json`, `world-map.min.svg`, dictionnaire ODS et index blind-test.
- Supply chain: `package.json`, `package-lock.json`, dependency tree locale, vendor `games/vendor/js-chess-engine.js`, CDN.
- Runtime local: `scripts/playwright-static-server.js`.
- Tests: `tests/arcade.spec.js`, `tests/resolutions.spec.js`, snapshots et profils desktop/mobile.

## Backlog priorise

### Important

- Remplacer progressivement les templates `innerHTML` qui incorporent des donnees non constantes dans les jeux (`scrabble`, `echecs`, `mots-meles`, `uno`) par creation DOM ou echappement centralise.
- Calculer et ajouter SRI pour `driver.js`, `driver.css` et `SortableJS` apres telechargement/verrouillage des assets exacts.
- Mettre en place une verification CI de `npm audit --audit-level=low` avec une installation npm fonctionnelle.

### Moyen

- Centraliser `safeJsonParse` dans un utilitaire commun pour eviter les variantes locales.
- Rendre robustes les lectures historiques restantes, notamment `arcade_history_scrabble`.
- Documenter dans le README les domaines externes autorises: GitHub API, Formspree, GoatCounter, jsDelivr, Google Fonts, FlagCDN.
- Remplacer les handlers HTML inline a long terme pour permettre une CSP sans `'unsafe-inline'`.

### Mineur

- Ajouter une page ou section `SECURITY.md` avec politique de signalement.
- Ajouter une tache de revue periodique des gros assets generes et vendorises.
- Nettoyer les commentaires historiques obsoletes, dont la mention de remplacement GoatCounter.

## Verification effectuee

- RED: `.\node_modules\.bin\playwright.cmd test tests/arcade.spec.js --grep "Phase 36" --workers=1` a echoue avant corrections sur changelog, `localStorage`, SVG et headers.
- GREEN: `.\node_modules\.bin\playwright.cmd test tests/arcade.spec.js --grep "Phase 36" --workers=1` passe avec 20 tests.
- Multi-resolution: `.\node_modules\.bin\playwright.cmd test tests/resolutions.spec.js --workers=1` passe avec 12 tests, 12 ignores.
- Suite complete: `.\node_modules\.bin\playwright.cmd test` donne 174 tests passes, 18 ignores, 16 echecs historiques constates sur snapshots manquants/incoherents et tests fonctionnels existants (`header-*`, `games-grid-*`, cadenas `Mots Mêlés`, Scrabble).
- Limite: `npm audit --audit-level=low` et `npx` echouent localement car l'installation globale npm pointe vers `C:\Users\chjeu\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js` / `npx-cli.js` absents. Les tests ont ete lances via le binaire Playwright local.
