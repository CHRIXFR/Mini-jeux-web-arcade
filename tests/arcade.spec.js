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
