const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

test.describe('Android familial et assets offline', () => {
  test('Capitales utilise des drapeaux locaux et aucune URL FlagCDN', async ({ page }) => {
    const capitalesSource = fs.readFileSync(path.join(ROOT, 'games', 'capitales.js'), 'utf8');
    expect(capitalesSource).not.toContain('flagcdn.com');

    await page.goto('/?test=true&tour=off');
    await page.waitForSelector('.games-grid', { state: 'visible' });
    await page.locator('.game-card').filter({ hasText: 'Capitales' }).click();
    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();

    const flag = page.locator('#cap-flag-pic img, #cap-flag-pic .cap-flag-fallback').first();
    await expect(flag).toBeVisible({ timeout: 10000 });

    const tagName = await flag.evaluate((node) => node.tagName.toLowerCase());
    if (tagName === 'img') {
      const src = await flag.getAttribute('src');
      expect(src).toMatch(/^images\/flags\/4x3\/[a-z]{2}\.svg$/);
    } else {
      await expect(flag).toContainText(/^[a-z]{2}$/i);
    }
  });

  test('Le script de synchronisation copie les drapeaux attendus', () => {
    const output = execFileSync(process.execPath, ['scripts/sync-flags.js', '--check'], {
      cwd: ROOT,
      encoding: 'utf8'
    });
    const report = JSON.parse(output);
    const countries = JSON.parse(fs.readFileSync(path.join(ROOT, 'games', 'data', 'capitales.json'), 'utf8'));

    expect(report.totalCountries).toBe(countries.length);
    expect(report.copiedCount).toBe(countries.length);
    expect(report.missing).toEqual([]);
    expect(fs.existsSync(path.join(ROOT, 'images', 'flags', 'flags-manifest.json'))).toBe(true);
  });

  test('La page install Android propose un APK familial hors Play Store', async ({ page }) => {
    await page.goto('/install.html');

    await expect(page.locator('h1')).toContainText('Installer Arcade Minimaliste');
    await expect(page.locator('#install-apk-link')).toHaveAttribute('href', 'dist/android/arcade-minimaliste.apk');
    await expect(page.locator('body')).toContainText('Autoriser l’installation depuis le navigateur');
    await expect(page.locator('body')).toContainText('Google Play n’est pas requis');
    await expect(page.getByAltText("QR code vers la page d'installation Android")).toHaveAttribute('src', 'images/install-qr.png');
  });

  test('Le service worker rend le hub et Capitales disponibles hors ligne apres preparation', async ({ page, context }) => {
    await page.goto('/install.html');
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await new Promise((resolve) => {
        if (registration.active && registration.active.state === 'activated') {
          resolve();
          return;
        }
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      });
    });

    await page.goto('/?source=offline-test');
    await page.waitForSelector('.games-grid', { state: 'visible' });
    await context.setOffline(true);

    await page.goto('/?source=offline-test-reload');
    await expect(page.locator('.games-grid')).toBeVisible({ timeout: 10000 });
    await page.locator('.game-card').filter({ hasText: 'Capitales' }).click();
    await expect(page.locator('#game-start-modal')).toBeVisible({ timeout: 10000 });
    await page.locator('#modal-btn-start').click();
    await expect(page.locator('#cap-flag-pic img')).toHaveAttribute('src', /^images\/flags\/4x3\/[a-z]{2}\.svg$/);
  });
});
