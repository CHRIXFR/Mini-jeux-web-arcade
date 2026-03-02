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
