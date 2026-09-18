import { test, expect } from '@playwright/test';

const LIVE_URL = process.env.JARVIS_LIVE_URL;

test.describe('Games Experience 2.0', () => {
  test('redesigned hub presents Tetris as the featured launch path and adds JARVIS Circuit without dropping existing games', async ({ page }) => {
    if (!LIVE_URL) throw new Error('JARVIS_LIVE_URL is required');

    await page.goto(new URL(LIVE_URL).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nav[data-app="snake"]')).toBeVisible({ timeout: 30_000 });
    await page.locator('.nav[data-app="snake"]').click();

    await expect(page.locator('.arcade')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#games-experience-v2')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#games-experience-v2 h2')).toHaveText('TETRIS');
    await expect(page.locator('#games-feature-play')).toHaveText('PLAY TETRIS');

    await expect(page.locator('.game-card')).toHaveCount(8);
    await expect(page.locator('#tetrisGame').locator('..')).toHaveClass(/game-card/);
    await expect(page.locator('#tetBoard')).toBeVisible();

    await page.locator('#games-feature-play').click();
    await expect(page.locator('#tetReset')).toBeFocused();
    await expect(page.locator('#tetBoard')).toBeVisible();

    const snake = page.locator('#snakeGame').locator('..');
    await expect(snake).toBeVisible();
    await expect(snake.locator('h3')).toHaveText('🐍 Snake');
    await expect(page.locator('#snakeCanvas')).toBeVisible();
    await page.locator('#snakeReset').click();
    await expect(page.locator('#snakeV2Score')).toHaveText('SCORE 0');
    await expect(page.locator('#snakeV2Best')).toHaveText('BEST 0');
    await expect(page.locator('#snakeV2State')).toHaveText('PLAYING · SURVIVE');
    await expect(snake.locator('[data-snake="up"]')).toBeVisible();
    await expect(snake.locator('[data-snake="left"]')).toBeVisible();
    await expect(snake.locator('[data-snake="down"]')).toBeVisible();
    await expect(snake.locator('[data-snake="right"]')).toBeVisible();

    const canvasSize = await page.locator('#snakeCanvas').evaluate(el => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    expect(canvasSize.width).toBeGreaterThanOrEqual(300);
    expect(Math.abs(canvasSize.width - canvasSize.height)).toBeLessThanOrEqual(1);

    await page.locator('#snakeCanvas').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 150, clientY: 150 });
    await page.locator('#snakeCanvas').dispatchEvent('pointerup', { pointerType: 'touch', clientX: 190, clientY: 150 });
    await page.waitForTimeout(130);
    await expect(page.locator('#snakeV2State')).toHaveText('PLAYING · SURVIVE');

    await page.locator('#snakeReset').click();
    await expect(page.locator('#snakeV2Score')).toHaveText('SCORE 0');
    await expect(page.locator('#snakeV2State')).toHaveText('PLAYING · SURVIVE');


    const two = page.locator('#twoGame').locator('..');
    await expect(two).toBeVisible();
    await expect(two.locator('h3')).toHaveText('🔢 2048');
    await expect(page.locator('#twoV2Score')).toHaveText('SCORE 0');
    await expect(page.locator('#twoV2Best')).toHaveText('BEST 0');
    await expect(page.locator('#twoV2State')).toHaveText('PLAYING · MERGE');
    await expect(two.locator('#jarvis2048Pad')).toBeVisible();
    await expect(two.locator('#jarvis2048Pad [data-dir="ArrowUp"]')).toBeVisible();
    await expect(two.locator('#jarvis2048Pad [data-dir="ArrowLeft"]')).toBeVisible();
    await expect(two.locator('#jarvis2048Pad [data-dir="ArrowDown"]')).toBeVisible();
    await expect(two.locator('#jarvis2048Pad [data-dir="ArrowRight"]')).toBeVisible();
    await expect(two.locator('#jarvis2048Pad')).toHaveCount(1);
    const twoSize = await page.locator('#twoBoard').evaluate(el => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    expect(twoSize.width).toBeGreaterThanOrEqual(300);
    expect(Math.abs(twoSize.width - twoSize.height)).toBeLessThanOrEqual(2);

    await page.locator('#twoBoard').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 150, clientY: 150 });
    await page.locator('#twoBoard').dispatchEvent('pointerup', { pointerType: 'touch', clientX: 105, clientY: 150 });
    await expect(page.locator('#twoV2State')).toHaveText('PLAYING · MERGE');

    const reaction = page.locator('#jarvisReactionGame');
    await expect(reaction).toBeVisible();
    await expect(reaction.locator('h3')).toHaveText('⚡ JARVIS Reaction');
    await expect(page.locator('#reactionTarget')).toHaveText('WAIT');
    await expect(page.locator('#reactionState')).toHaveText('PRESS START TO TEST');
    await expect(page.locator('#reactionBest')).toHaveText('BEST ---');

    await page.locator('#reactionStart').click();
    await expect.poll(async () => page.locator('#reactionState').textContent(), {timeout:5000}).toBe('NOW · TAP');
    await page.locator('#reactionTarget').click();
    await expect(page.locator('#reactionState')).toHaveText('REACTION CAPTURED · RUN AGAIN');
    await expect(page.locator('#reactionScore')).toHaveText(/LAST \d+MS/);
    await expect(page.locator('#reactionBest')).toHaveText(/BEST \d+MS/);

    const circuit = page.locator('#jarvisCircuitGame');
    await expect(circuit).toBeVisible();
    await expect(circuit.locator('h3')).toHaveText('🏎️ JARVIS Circuit');
    await expect(page.locator('#circuitCanvas')).toBeVisible();
    await expect(page.locator('#circuitBest')).toHaveText(/BEST \d+/);
    await expect(page.locator('#circuitStatus')).toHaveText('PRESS START TO RACE');

    const leftControl = circuit.locator('[data-circuit="left"]');
    const rightControl = circuit.locator('[data-circuit="right"]');
    await expect(leftControl).toBeVisible();
    await expect(rightControl).toBeVisible();
    const controlY = await circuit.locator('.circuit-controls').evaluate(el => {
      const left = el.querySelector('[data-circuit="left"]');
      const right = el.querySelector('[data-circuit="right"]');
      if (!(left instanceof HTMLElement) || !(right instanceof HTMLElement)) {
        throw new Error('Circuit controls not found');
      }
      return {
        left: left.getBoundingClientRect().y,
        right: right.getBoundingClientRect().y
      };
    });
    expect(Math.abs(controlY.left - controlY.right)).toBeLessThanOrEqual(1);

    await page.locator('#circuitReset').click();
    await expect(page.locator('#circuitStatus')).toHaveText('RACING · DODGE + COLLECT');
    await expect(page.locator('#circuitScore')).toHaveText('SCORE 0');
    await page.keyboard.press('ArrowRight');
    await leftControl.click();
    await expect.poll(async () => page.locator('#circuitDistance').textContent()).not.toBe('DIST 0M');

    await circuit.evaluate(node => node.remove());
    await expect(page.locator('.game-card')).toHaveCount(8);
    await expect(page.locator('#jarvisCircuitGame')).toBeVisible();
    await expect(page.locator('#circuitStatus')).toHaveText('PRESS START TO RACE');
    await page.locator('#circuitReset').click();
    await expect(page.locator('#circuitStatus')).toHaveText('RACING · DODGE + COLLECT');
    await expect(page.locator('#circuitScore')).toHaveText('SCORE 0');
  });
});
