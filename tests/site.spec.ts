import { test, expect } from '@playwright/test';

test('research navigation, publication citations, and 3D controls work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Victor Melbye');
  await expect(page.locator('#scene-controls')).toBeVisible();
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  await page.getByRole('slider').fill('70');
  await expect(page.getByRole('slider')).toHaveValue('70');
  await expect(page.locator('#scene-angle')).toHaveText('+14°');
  await page.getByRole('button', { name: 'Contact points' }).click();
  await expect(page.getByRole('button', { name: 'Contact points' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Target orientation' }).click();
  await expect(page.getByRole('button', { name: 'Target orientation' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Reset camera and trajectory' }).click();
  await expect(page.getByRole('slider')).toHaveValue('0');
  await page.locator('summary').first().click();
  await expect(page.locator('pre').first()).toBeVisible();
  await page.locator('.research-card').first().click();
  await expect(page).toHaveURL(/research\/deformable-manipulation\//);
  await expect(page.getByRole('link', { name: 'Read the related paper' })).toHaveAttribute('href', 'https://doi.org/10.1109/ICCMA63715.2024.10843928');
  await page.getByRole('link', { name: 'CV', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Current appointment' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile layout stays within viewport and navigation remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/cv/', '/research/deformable-manipulation/', '/research/dexterous-manipulation/', '/research/simulation-and-learning/']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await expect(page.getByRole('navigation')).toBeVisible();
  }
});

test('reduced motion starts paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  await expect(page.getByRole('slider')).toHaveValue('0');
});

test('the fallback remains useful without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: any[]) {
      if (String(args[0]).includes('webgl')) return null;
      return (original as any).apply(this, args);
    } as any;
  });
  await page.goto('/');
  await expect(page.locator('#scene-fallback')).toBeVisible();
  await expect(page.locator('#scene-controls')).toBeHidden();
  await expect(page.locator('#scene-hint')).toContainText('Static preview');
});


test('mobile workbench defers 3D until requested and keeps the controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const sceneRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('robot-scene')) sceneRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('#scene-fallback')).toBeVisible();
  await expect(page.locator('#scene-viewport canvas')).toHaveCount(0);
  expect(sceneRequests).toEqual([]);
  await page.getByRole('button', { name: 'Load 3D model' }).click();
  await expect(page.locator('#scene-viewport canvas')).toBeVisible();
  await expect(page.locator('#scene-fallback')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  await page.getByRole('slider').fill('70');
  await expect(page.locator('#scene-angle')).toHaveText('+14°');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});


test('workbench hotspots support keyboard exploration and correct destinations', async ({ page }) => {
  await page.goto('/');
  const hand = page.getByRole('button', { name: 'Explore the Shadow Hand', exact: true });
  await hand.focus();
  await page.keyboard.press('Enter');
  await expect(hand).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Explore dexterous manipulation' })).toHaveAttribute('href', '/research/dexterous-manipulation/');
  await page.keyboard.press('Escape');
  await expect(page.locator('#workbench-details')).toBeHidden();
  await expect(hand).toBeFocused();
  await page.getByRole('button', { name: 'Explore cable manipulation', exact: true }).click();
  await page.locator('#workbench-details').getByRole('link', { name: 'Explore cable manipulation' }).click();
  await expect(page).toHaveURL(/research\/deformable-manipulation\//);
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore simulation tools', exact: true }).click();
  await expect(page.locator('#workbench-details').getByRole('link')).toHaveAttribute('href', '/#projects');
  await expect(page.getByRole('link', { name: 'Send email' })).toHaveAttribute('href', 'mailto:vims@mmmi.sdu.dk');
});

test('mobile hotspots work before 3D loads, and model failures keep the preview useful', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let modelRequests = 0;
  await page.route('**/shadow-hand.glb', route => { modelRequests++; return route.abort(); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the Shadow Hand', exact: true }).click();
  await expect(page.locator('#workbench-details')).toBeVisible();
  expect(modelRequests).toBe(0);
  await page.getByRole('button', { name: 'Close workbench detail' }).click();
  await page.getByRole('button', { name: 'Load 3D model' }).click();
  await expect(page.getByRole('button', { name: 'Retry 3D preview' })).toBeVisible();
  await expect(page.locator('#scene-fallback')).toBeVisible();
  await expect(page.locator('#scene-controls')).toBeHidden();
  await page.getByRole('button', { name: 'Explore cable manipulation', exact: true }).click();
  await expect(page.locator('#workbench-details').getByRole('link')).toHaveAttribute('href', '/research/deformable-manipulation/');
  expect(modelRequests).toBe(1);
});

test('opening and switching workbench details keeps the hero text in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [900, 1440]) {
    await page.setViewportSize({ width, height: 1200 });
    await page.goto('/');
    await expect(page.locator('#scene-viewport canvas')).toBeVisible();
    const position = () => page.locator('.hero-copy').evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + scrollX, y: rect.top + scrollY };
    });
    const initial = await position();
    for (const name of ['Explore the Shadow Hand', 'Explore cable manipulation', 'Explore simulation tools']) {
      await page.getByRole('button', { name, exact: true }).click();
      await expect(page.locator('#workbench-details')).toBeVisible();
      expect(await position()).toEqual(initial);
    }
    await page.getByRole('button', { name: 'Close workbench detail' }).click();
    await expect(page.locator('#workbench-details')).toBeHidden();
    expect(await position()).toEqual(initial);
  }
});
