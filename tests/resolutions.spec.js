const { test, expect } = require('@playwright/test');

test.describe('Validation multi-resolutions', () => {
  test('Accueil - rendu general', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.games-grid', { state: 'visible' });
    await page.waitForTimeout(500);
    await expect(page.locator('#app-container')).toHaveScreenshot('home-multi-res.png');
  });

  test('Topbar - rendu en jeu', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.games-grid', { state: 'visible' });

    const capitalesCard = page.locator('.game-card').filter({ hasText: 'Capitales' });
    await capitalesCard.click();

    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();

    const topbar = page.locator('[data-topbar-id="capitales-topbar"]');
    await expect(topbar).toBeVisible({ timeout: 10000 });
    await expect(topbar).toHaveScreenshot('capitales-topbar-multi-res.png');
  });
});
