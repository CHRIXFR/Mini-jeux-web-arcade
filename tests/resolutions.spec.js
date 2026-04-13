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

  test('Sudoku 2160p - bouton retour hors grille', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome-2160p', 'Test reserve au profil 2160p');

    const sudokuCard = page.locator('.game-card').filter({ hasText: 'Sudoku' });
    await expect(sudokuCard).toBeVisible();
    await sudokuCard.click();

    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();

    const backBtn = page.locator('.game-view > .btn-secondary');
    const grid = page.locator('#sudoku-grid');
    await expect(backBtn).toBeVisible();
    await expect(grid).toBeVisible();

    const backBox = await backBtn.boundingBox();
    const gridBox = await grid.boundingBox();

    expect(backBox).not.toBeNull();
    expect(gridBox).not.toBeNull();
    expect(backBox.x + backBox.width).toBeLessThanOrEqual(gridBox.x - 8);
  });

  test('Capitales mobile portrait - bouton question suivante visible sans scroll', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-samsung-a51-portrait', 'Test reserve au mobile A51 portrait');

    const capitalesCard = page.locator('.game-card').filter({ hasText: 'Capitales' });
    await expect(capitalesCard).toBeVisible();
    await capitalesCard.click();

    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();

    const firstOption = page.locator('#cap-options .cap-option-btn').first();
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();

    const nextBtn = page.locator('#cap-next-btn');
    await expect(nextBtn).toBeVisible({ timeout: 10000 });

    const inViewport = await nextBtn.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    expect(inViewport).toBeTruthy();

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('Blind test mobile portrait - bouton musique suivante visible sans scroll', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-samsung-a51-portrait', 'Test reserve au mobile A51 portrait');

    const blindTestCard = page.locator('.game-card').filter({ hasText: 'Blind Test' });
    await expect(blindTestCard).toBeVisible();
    await blindTestCard.click();

    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();

    const firstOption = page.locator('#bt-options .bt-option-btn').first();
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();

    const nextBtn = page.locator('#bt-next-btn');
    await expect(nextBtn).toBeVisible({ timeout: 10000 });

    const inViewport = await nextBtn.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    expect(inViewport).toBeTruthy();

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('Objets caches mobile portrait - scene visible sans scroll', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-samsung-a51-portrait', 'Test reserve au mobile A51 portrait');

    const objetsCard = page.locator('.game-card').filter({ hasText: 'Objets Cachés' });
    await expect(objetsCard).toBeVisible();
    await objetsCard.click();

    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();

    const scene = page.locator('#oc-scene');
    await expect(scene).toBeVisible({ timeout: 10000 });

    const inViewport = await scene.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    expect(inViewport).toBeTruthy();

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });
});
