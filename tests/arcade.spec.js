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
