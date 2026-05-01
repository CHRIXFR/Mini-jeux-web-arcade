const { test, expect } = require('@playwright/test');

test.describe('Audio global', () => {
  test('la musique de fond demarre depuis une URL directe sans attendre le cache', async ({ page }) => {
    await page.addInitScript(() => {
      window.__audioEvents = [];
      const NativeAudio = window.Audio;
      window.Audio = function FakeAudio() {
        const player = new NativeAudio();
        Object.defineProperty(player, 'src', {
          get() {
            return this.__src || '';
          },
          set(value) {
            this.__src = value;
            window.__audioEvents.push({ type: 'src', value });
          }
        });
        player.play = () => {
          window.__audioEvents.push({ type: 'play', src: player.src });
          return Promise.resolve();
        };
        player.pause = () => {
          window.__audioEvents.push({ type: 'pause', src: player.src });
        };
        return player;
      };
      window.fetch = async (...args) => {
        window.__audioEvents.push({ type: 'fetch', url: String(args[0]) });
        await new Promise((resolve) => setTimeout(resolve, 250));
        return new Response(new Blob(['fake-mp3'], { type: 'audio/mpeg' }), { status: 200 });
      };
    });

    await page.goto('/?test=true&tour=off');
    await page.waitForSelector('.games-grid', { state: 'visible' });
    await page.evaluate(() => { window.__audioEvents = []; });
    await page.locator('#audio-btn').click();

    const events = await page.evaluate(() => window.__audioEvents);
    const firstPlayIndex = events.findIndex((event) => event.type === 'play');
    const firstFetchIndex = events.findIndex((event) => event.type === 'fetch' && event.url.startsWith('sons/'));
    const firstPlay = events[firstPlayIndex];

    expect(firstPlayIndex).toBeGreaterThanOrEqual(0);
    expect(firstPlay.src).toMatch(/^sons\/base\/.+\.mp3$/);
    if (firstFetchIndex >= 0) {
      expect(firstPlayIndex).toBeLessThan(firstFetchIndex);
    }
  });
});
