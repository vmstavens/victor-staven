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
  await page.getByRole('button', { name: 'Contact normals' }).click();
  await expect(page.getByRole('button', { name: 'Contact normals' })).toHaveAttribute('aria-pressed', 'false');
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
