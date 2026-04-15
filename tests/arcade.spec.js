const { test, expect } = require('@playwright/test');

test.describe('Mini-jeux-web Arcade - Tests de régression visuelle v2', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // S'assurer que le contenu principal est visible
    await page.waitForSelector('.games-grid', { state: 'visible' });
    // Attendre un court instant pour la stabilisation des polices
    await page.waitForTimeout(500);
  });

  test("Rendu visuel - Thème Sombre (Défaut)", async ({ page }) => {
    // Verification du Header isole
    await expect(page.locator('.header-content')).toHaveScreenshot('header-dark.png');

    // Verification de la zone des jeux isolee
    await expect(page.locator('.games-grid')).toHaveScreenshot('games-grid-dark.png');
  });

  test("Rendu visuel - Bascule de Thème (Clair)", async ({ page }) => {
    // Identifier le bouton de theme (il contient l'emoji soleil/lune)
    const themeBtn = page.locator('#theme-btn');

    // Cliquer pour passer en mode clair
    await themeBtn.click();

    // Attendre la stabilisation du changement de theme
    await page.waitForTimeout(300);

    // Verification du rendu global en mode clair
    await expect(page.locator('.games-grid')).toHaveScreenshot('games-grid-light.png');
    await expect(page.locator('.header-content')).toHaveScreenshot('header-light.png');
  });

  test("Affichage des jeux verrouillés", async ({ page }) => {
    // On s'assure qu'un jeu verrouille (ex: Mots Meles au debut) affiche bien son cadenas
    const wordSearch = page.locator('.game-card').filter({ hasText: 'Mots Mêlés' });
    await expect(wordSearch).toContainText('🔒'); // Verifier la presence de l'emoji cadenas
    await expect(wordSearch).toHaveScreenshot('locked-game-card.png');
  });

});

test.describe('Phase 32 - Optimisation UI Globale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true&tour=off');
    await page.waitForSelector('.games-grid', { state: 'visible' });
    await page.waitForTimeout(400);
  });

  async function openGameWithModal(page, gameName, selectedDiff = null) {
    const card = page.locator('.game-card').filter({ hasText: gameName });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    if (selectedDiff) {
      await page.locator(`.modal-diff-btn[data-diff="${selectedDiff}"]`).click();
    }
    await page.locator('#modal-btn-start').click();
    await expect(page.locator('.game-topbar')).toBeVisible({ timeout: 10000 });
  }

  test('Home - hero et grille optimisés', async ({ page }) => {
    await expect(page.locator('.hero')).toHaveScreenshot('ui-hero-optimized.png');
    await expect(page.locator('.games-grid .game-card').first()).toHaveScreenshot('ui-game-card-optimized.png');
  });

  test('Topbar - Capitales optimisée', async ({ page }) => {
    await openGameWithModal(page, 'Capitales');
    await expect(page.locator('[data-topbar-id="capitales-topbar"]')).toHaveScreenshot('ui-topbar-capitales.png');
  });

  test('Topbar - 421 optimisée', async ({ page }) => {
    await openGameWithModal(page, '421', 'solo');
    await expect(page.locator('[data-topbar-id="421-topbar"]')).toHaveScreenshot('ui-topbar-421.png');
  });

  test('Topbar - Suite Logique optimisée', async ({ page }) => {
    await openGameWithModal(page, 'Suite Logique', 'mixte');
    await expect(page.locator('[data-topbar-id="suite-logique-topbar"]')).toHaveScreenshot('ui-topbar-suite-logique.png');
  });

  test('Modal - actions alignées sur desktop/mobile', async ({ page }) => {
    await page.evaluate(() => {
      window.arcade.showGameOverModal({
        title: 'capitales',
        gameStatus: 'Partie Terminée !',
        icon: '🌍',
        stats: [
          { label: 'Score final', value: '4 / 10' },
          { label: 'Mode', value: 'Mixte' }
        ],
        score: 4,
        scoreType: 'points',
        onReplay: () => {},
        onQuit: () => {}
      });
    });
    await expect(page.locator('#game-over-modal .modal-actions')).toHaveScreenshot('ui-modal-actions-aligned.png');
  });
});

test.describe('Scrabble - Tests fonctionnels', () => {

  test.beforeEach(async ({ page }) => {
    // Mode test : tous les jeux sont débloqués et le bouton Aide joue + valide automatiquement
    await page.goto('/?test=true');
    await page.waitForSelector('.games-grid', { state: 'visible' });
    await page.waitForTimeout(500);
  });

  test("Scrabble - Chargement et déroulement d'une partie (2 tours)", async ({ page }) => {
    // 1. Ouvrir le Scrabble
    const scrabbleCard = page.locator('.game-card').filter({ hasText: 'Scrabble' });
    await scrabbleCard.click();

    // 2. Attendre la modale de difficulté puis choisir Débutant
    const diffModal = page.locator('#scr-diff-modal');
    await expect(diffModal).toBeVisible({ timeout: 10000 });
    await page.locator('.diff-btn[data-diff="beginner"]').click();

    // 3. Attendre la fin du chargement du dictionnaire
    const playBtn = page.locator('#scr-btn-play');
    await expect(playBtn).not.toBeDisabled({ timeout: 15000 });

    // 4. Vérifier le compteur initial du sac (102 - 14 lettres distribuées = 88)
    const bagCount = page.locator('#scr-bag-count');
    await expect(bagCount).toHaveText('88');

    // 5. Jouer le tour du joueur via le bouton Aide (place + valide automatiquement en mode test)
    const hintBtn = page.locator('#scr-btn-hint');
    await hintBtn.click();

    // 6. Attendre la fin du tour joueur + réponse de l'IA (~3-4 secondes au total)
    await page.waitForTimeout(4000);

    // 7. Vérifier que le score joueur a augmenté (> 0)
    const playerScore = page.locator('#scr-score-player');
    const playerScoreVal = parseInt(await playerScore.textContent());
    expect(playerScoreVal).toBeGreaterThan(0);

    // 8. Vérifier que le compteur du sac a diminué (< 88)
    const bagCountVal = parseInt(await bagCount.textContent());
    expect(bagCountVal).toBeLessThan(88);

    // 9. Capture d'écran de l'état du plateau après 1 tour complet
    await expect(page.locator('.scr-game-container')).toHaveScreenshot('scrabble-after-turn1.png');
  });

});

test.describe('Phase 27 - Topbar standardisée', () => {
  async function launchGame(page, gameName) {
    const gameCard = page.locator('.game-card').filter({ hasText: gameName });
    await gameCard.click();
    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();
    await expect(page.locator('.game-topbar')).toBeVisible({ timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.games-grid', { state: 'visible' });
  });

  test('Topbar - Capitales (avec difficulté)', async ({ page }) => {
    await launchGame(page, 'Capitales');
    const topbar = page.locator('[data-topbar-id="capitales-topbar"]');
    await expect(topbar).toContainText('Jeu des Capitales');
    await expect(topbar).toContainText('Score');
    await expect(topbar.locator('[data-role="difficulty-select"]')).toBeVisible();
  });

  test('Topbar - Blind Test (sans difficulté)', async ({ page }) => {
    await launchGame(page, 'Blind Test 8-Bits');
    const topbar = page.locator('[data-topbar-id="blind-test-topbar"]');
    await expect(topbar).toContainText('Blind Test Musical');
    await expect(topbar).toContainText('Score');
    await expect(topbar.locator('[data-role="difficulty-select"]')).toHaveCount(0);
  });

  test('Topbar - Snake (stat niveau)', async ({ page }) => {
    await launchGame(page, 'Snake');
    const topbar = page.locator('[data-topbar-id="snake-topbar"]');
    await expect(topbar).toContainText('Snake');
    await expect(topbar).toContainText('Niveau');
    await expect(topbar.locator('[data-role="difficulty-select"]')).toHaveCount(0);
  });
});

test.describe('Phase 28 - Jeu 421', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true&tour=off');
    await page.waitForSelector('.games-grid', { state: 'visible' });
  });

  async function open421(page, mode = 'solo') {
    const gameCard = page.locator('.game-card').filter({ hasText: '421' });
    await expect(gameCard).toBeVisible();
    await gameCard.click();
    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    if (mode === 'duo') {
      await page.locator('.modal-diff-btn[data-diff="duo"]').click();
    }
    await page.locator('#modal-btn-start').click();
    await expect(page.locator('[data-topbar-id="421-topbar"]')).toBeVisible({ timeout: 10000 });
  }

  async function play421Turn(page) {
    await page.locator('#d421-roll-btn').click();
    await page.locator('#d421-validate-btn').click();
    await page.locator('#d421-next-btn').click();
  }

  test('421 - boucle complète jusqu\'à la modale de fin', async ({ page }) => {
    await open421(page, 'solo');

    const topbar = page.locator('[data-topbar-id="421-topbar"]');
    await expect(topbar).toContainText('421');

    const rollBtn = page.locator('#d421-roll-btn');
    const validateBtn = page.locator('#d421-validate-btn');
    const nextBtn = page.locator('#d421-next-btn');
    const die1 = page.locator('#d421-die-0');

    await rollBtn.click();
    await expect(page.locator('#d421-round-feedback')).toContainText('Combinaison');

    await die1.click();
    await expect(die1).toHaveClass(/is-held/);
    await die1.click();
    await expect(die1).not.toHaveClass(/is-held/);

    await validateBtn.click();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    for (let i = 2; i <= 10; i++) {
      await rollBtn.click();
      await validateBtn.click();
      await nextBtn.click();
    }

    await expect(page.locator('#game-over-modal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#game-over-modal')).toContainText('Score final');
    await expect(page.locator('#game-over-modal')).toContainText('421 obtenus');
  });

  test('421 duo - alternance et victoire affichée', async ({ page }) => {
    await open421(page, 'duo');

    await expect(page.locator('#d421-scoreboard')).toBeVisible();
    await expect(page.locator('[data-topbar-id="421-topbar"]')).toContainText('Duel local');
    await expect(page.locator('#d421-round-feedback')).toContainText('Au tour de Joueur 1');

    const queue = [];
    for (let i = 0; i < 10; i++) {
      queue.push(4, 2, 1); // J1
      queue.push(3, 3, 2); // J2
    }
    await page.evaluate((vals) => window._d421Game.setTestDiceQueue(vals), queue);

    await play421Turn(page); // J1
    await expect(page.locator('#d421-round-feedback')).toContainText('Au tour de Joueur 2');
    await play421Turn(page); // J2
    await expect(page.locator('#d421-round-feedback')).toContainText('Ronde 2/10');

    for (let i = 0; i < 18; i++) {
      await play421Turn(page);
    }

    await expect(page.locator('#game-over-modal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#game-over-modal')).toContainText('Joueur 1');
    await expect(page.locator('#game-over-modal')).toContainText('Mode');
    await expect(page.locator('#game-over-modal')).not.toContainText('tie-break');
  });

  test('421 duo - tie-break déclenché et résolu', async ({ page }) => {
    await open421(page, 'duo');

    const queue = [];
    for (let i = 0; i < 10; i++) {
      queue.push(6, 5, 4); // J1 (suite)
      queue.push(6, 5, 4); // J2 (suite)
    }
    queue.push(4, 2, 1); // Tie-break J1
    queue.push(2, 2, 1); // Tie-break J2
    await page.evaluate((vals) => window._d421Game.setTestDiceQueue(vals), queue);

    for (let i = 0; i < 20; i++) {
      await play421Turn(page);
    }

    await expect(page.locator('#d421-tiebreak-badge')).toBeVisible();
    await expect(page.locator('#d421-round-feedback')).toContainText('Tie-break');

    await play421Turn(page); // J1 tie-break
    await play421Turn(page); // J2 tie-break

    await expect(page.locator('#game-over-modal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#game-over-modal')).toContainText('tie-break');
    await expect(page.locator('#game-over-modal')).toContainText('Duel (tie-break');
  });
});

test.describe('Phase 30 - Jeu UNO', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true&tour=off');
    await page.waitForSelector('.games-grid', { state: 'visible' });
  });

  async function openUno(page, mode = 'solo') {
    const gameCard = page.locator('.game-card').filter({ hasText: 'UNO' });
    await expect(gameCard).toBeVisible();
    await gameCard.click();
    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    if (mode !== 'solo') {
      await page.locator(`.modal-diff-btn[data-diff="${mode}"]`).click();
    }
    await page.locator('#modal-btn-start').click();
    await expect(page.locator('[data-topbar-id="uno-topbar"]')).toBeVisible({ timeout: 10000 });
  }

  test('UNO multi local 3 joueurs - passation obligatoire', async ({ page }) => {
    await openUno(page, 'multi3');
    await expect(page.locator('#uno-players-strip')).toBeVisible();

    await page.locator('#uno-btn-draw').click();
    await page.locator('#uno-btn-pass').click();

    const passOverlay = page.locator('#uno-pass-overlay');
    await expect(passOverlay).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#uno-pass-message')).toContainText('Joueur 2');
    await page.locator('#uno-btn-pass-continue').click();
    await expect(passOverlay).toBeHidden();
  });

  test('UNO multi local 2 joueurs - carte +2 applique une pioche et skip', async ({ page }) => {
    await page.goto('/?test=true&tour=off');
    await page.waitForSelector('.games-grid', { state: 'visible' });
    await page.locator('.game-card').filter({ hasText: 'UNO' }).click();
    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('.modal-diff-btn[data-diff="multi2"]').click();
    await page.evaluate(() => {
      window._unoGame.setTestDeck([
        'R:D2', 'B:5',
        'G:1', 'Y:1',
        'G:2', 'Y:2',
        'G:3', 'Y:3',
        'G:4', 'Y:4',
        'G:5', 'Y:5',
        'G:6', 'Y:6',
        'R:9',
        'B:7', 'B:8', 'B:9', 'Y:7'
      ]);
    });
    await page.locator('#modal-btn-start').click();
    await expect(page.locator('[data-topbar-id="uno-topbar"]')).toBeVisible({ timeout: 10000 });

    const cardBtn = page.locator('.uno-card-btn[data-card-code="R:D2"]').first();
    await expect(cardBtn).toBeVisible();
    const cardId = await cardBtn.getAttribute('data-card-id');
    await page.evaluate((id) => window._unoGame.playCardById(id), cardId);

    await expect(page.locator('#uno-player-count-1')).toHaveText('9');
    await expect(page.locator('#uno-pass-overlay')).toBeHidden();
    await expect(page.locator('[data-topbar-id="uno-topbar"]')).toContainText('Joueur 1');
  });

  test('UNO solo vs IA - enchainement tour joueur puis IA', async ({ page }) => {
    await openUno(page, 'solo');
    await expect(page.locator('#uno-pass-overlay')).toBeHidden();

    await page.locator('#uno-btn-draw').click();
    await page.locator('#uno-btn-pass').click();

    await expect(page.locator('#uno-hand')).toContainText('Tour de l\'IA');
    await expect(page.locator('#uno-status')).toContainText('IA');
  });
});

test.describe('Phase 31 - Jeu Suite Logique', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true&tour=off');
    await page.waitForSelector('.games-grid', { state: 'visible' });
  });

  async function openSuiteLogique(page, mode = 'mixte', beforeStart = null) {
    const gameCard = page.locator('.game-card').filter({ hasText: 'Suite Logique' });
    await expect(gameCard).toBeVisible();
    await gameCard.click();
    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    if (beforeStart) {
      await beforeStart();
    }
    if (mode !== 'mixte') {
      await page.locator(`.modal-diff-btn[data-diff="${mode}"]`).click();
    }
    await page.locator('#modal-btn-start').click();
    await expect(page.locator('[data-topbar-id="suite-logique-topbar"]')).toBeVisible({ timeout: 10000 });
  }

  test('Suite Logique - modale de démarrage avec 3 modes', async ({ page }) => {
    const gameCard = page.locator('.game-card').filter({ hasText: 'Suite Logique' });
    await gameCard.click();
    await expect(page.locator('#game-start-modal')).toBeVisible();
    await expect(page.locator('.modal-diff-btn[data-diff="forme"]')).toBeVisible();
    await expect(page.locator('.modal-diff-btn[data-diff="chiffre"]')).toBeVisible();
    await expect(page.locator('.modal-diff-btn[data-diff="mixte"]')).toBeVisible();
  });

  test('Suite Logique - mode mixte alterne forme puis chiffre', async ({ page }) => {
    await openSuiteLogique(page, 'mixte');

    await expect(page.locator('#sl-mode-value')).toContainText('Mixte');
    const firstMode = await page.evaluate(() => window._suiteLogiqueGame.state.currentQuestion.mode);
    expect(firstMode).toBe('shape');

    await page.locator('.sl-option-btn').first().click();
    await page.locator('#sl-next-btn').click();

    const secondMode = await page.evaluate(() => window._suiteLogiqueGame.state.currentQuestion.mode);
    expect(secondMode).toBe('number');
  });

  test('Suite Logique - partie complète 10 questions + record local', async ({ page }) => {
    await openSuiteLogique(page, 'chiffre', async () => {
      await page.evaluate(() => {
        const questions = Array.from({ length: 10 }).map((_, idx) => {
          const start = 2 + idx;
          return {
            mode: 'number',
            difficulty: idx < 3 ? 'easy' : (idx < 7 ? 'medium' : 'hard'),
            sequence: [start, start + 2, start + 4, start + 6, start + 8],
            answer: start + 10,
            options: [start + 10, start + 11, start + 9, start + 12],
            explanation: 'Règle: +2',
            hint: 'Écart constant'
          };
        });
        window._suiteLogiqueGame.setTestQuestionQueue(questions);
        window._suiteLogiqueGame.setTestElapsedQueue(Array(10).fill(2));
      });
    });

    for (let i = 0; i < 10; i++) {
      await page.locator('.sl-option-btn').first().click();
      await page.locator('#sl-next-btn').click();
    }

    await expect(page.locator('#game-over-modal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#game-over-modal')).toContainText('Score final');

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('arcade_hs_suite-logique');
      return raw ? JSON.parse(raw) : null;
    });
    expect(saved).not.toBeNull();
    expect(saved.score).toBe(150);
  });

  test('Suite Logique - fin anticipée après 3 erreurs', async ({ page }) => {
    await openSuiteLogique(page, 'chiffre', async () => {
      await page.evaluate(() => {
        const questions = Array.from({ length: 5 }).map(() => ({
          mode: 'number',
          sequence: [10, 12, 14, 16, 18],
          answer: 20,
          options: [20, 21, 22, 23],
          explanation: 'Règle: +2',
          hint: 'Écart constant'
        }));
        window._suiteLogiqueGame.setTestQuestionQueue(questions);
        window._suiteLogiqueGame.setTestElapsedQueue([2, 2, 2, 2, 2]);
      });
    });

    for (let i = 0; i < 3; i++) {
      await page.locator('.sl-option-btn').nth(1).click();
      await page.locator('#sl-next-btn').click();
    }

    await expect(page.locator('#game-over-modal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#game-over-modal')).toContainText('Erreurs');
    await expect(page.locator('#game-over-modal')).toContainText('3 / 3');
  });

  test('Suite Logique - indice réduit le gain de points', async ({ page }) => {
    await openSuiteLogique(page, 'chiffre', async () => {
      await page.evaluate(() => {
        window._suiteLogiqueGame.setTestQuestionQueue([{
          mode: 'number',
          sequence: [1, 3, 5, 7, 9],
          answer: 11,
          options: [11, 12, 13, 14],
          explanation: 'Règle: +2',
          hint: 'Écart constant'
        }]);
        window._suiteLogiqueGame.setTestElapsedQueue([2]);
      });
    });
    await page.locator('#sl-hint-btn').click();
    await page.locator('.sl-option-btn').first().click();

    await expect(page.locator('[data-topbar-id="suite-logique-topbar"]')).toContainText('7 pts');
  });
});
