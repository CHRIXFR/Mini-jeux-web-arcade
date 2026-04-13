const { test, expect } = require('@playwright/test');

test.describe('Validation multi-resolutions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/?test=true&tour=off');
    await page.waitForSelector('.games-grid', { state: 'visible' });
    await page.addStyleTag({
      content: `
        #dynamic-bg { display: none !important; }
        #avatar-changelog { display: none !important; }
        *, *::before, *::after { animation: none !important; transition: none !important; }
      `
    });
  });

  test('Accueil - rendu general', async ({ page }) => {
    await expect(page.locator('#app-container')).toBeVisible();

    const metrics = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      scrollH: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
    }));

    expect(metrics.scrollW).toBeLessThanOrEqual(metrics.innerW + 1);
    expect(metrics.scrollH).toBeGreaterThan(0);
  });

  test('Topbar - rendu en jeu', async ({ page }) => {
    const capitalesCard = page.locator('.game-card').filter({ hasText: 'Capitales' });
    await expect(capitalesCard).toBeVisible();
    await capitalesCard.scrollIntoViewIfNeeded();
    await capitalesCard.click();

    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();

    const topbar = page.locator('[data-topbar-id="capitales-topbar"]');
    await expect(topbar).toBeVisible({ timeout: 10000 });

    const bounds = await topbar.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.height).toBeGreaterThan(30);
  });
});
