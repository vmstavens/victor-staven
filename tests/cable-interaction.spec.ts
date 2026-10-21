import { test, expect, type Page } from '@playwright/test';
import * as THREE from 'three';

async function cableScreenPoints(page: Page) {
  // Project initial cable positions for real pointer input. Keep Three.js in the
  // test process so this works with both development and production previews.
  const bounds = (await page.locator('#scene-viewport canvas').boundingBox())!;
  const camera = new THREE.PerspectiveCamera(30, bounds.width / bounds.height, .1, 50);
  camera.position.set(5.3, 4.5, 8.2); camera.lookAt(0, .72, 0);
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(30) / 2) * Math.max(1, 1.55 / camera.aspect)));
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return [[2.21, .85, .82], [4, 1, 2]].map(position => {
    const point = new THREE.Vector3(...position).project(camera);
    return { x: bounds.x + (point.x + 1) * bounds.width / 2, y: bounds.y + (1 - point.y) * bounds.height / 2 };
  });
}

test('dragging cable does not orbit or open research details, and reset restores it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#cable-controls')).toBeVisible();
  await page.locator('#scene-viewport canvas').scrollIntoViewIfNeeded();
  const monitor = page.locator('[data-workbench-object="monitor"]');
  const cable = page.locator('[data-workbench-object="cable"]');
  const initialMonitor = await monitor.boundingBox(); const initialCable = await cable.boundingBox();
  const [start, end] = await cableScreenPoints(page);
  await page.mouse.move(start.x, start.y); await page.mouse.down();
  await expect(page.locator('#cable-status')).toContainText('Cable grabbed');
  await page.mouse.move(end.x, end.y, { steps: 24 });
  await expect.poll(async () => Math.abs((await cable.boundingBox())!.x - initialCable!.x)).toBeGreaterThan(10);
  await page.mouse.up();
  await expect(page.locator('#workbench-details')).toBeHidden();
  expect((await monitor.boundingBox())!.x).toBeCloseTo(initialMonitor!.x, 0);
  expect((await monitor.boundingBox())!.y).toBeCloseTo(initialMonitor!.y, 0);
  await page.getByRole('button', { name: 'Reset cable', exact: true }).click();
  await expect(page.locator('#cable-status')).toHaveText('Cable reset on table.');
  await expect.poll(async () => Math.abs((await cable.boundingBox())!.x - initialCable!.x)).toBeLessThan(1);
});

test('keyboard cable movement releases with Escape', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const move = page.getByRole('button', { name: 'Move cable', exact: true });
  await move.click(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#cable-status')).toContainText('Cable held');
  await page.keyboard.press('Escape');
  await expect(move).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#cable-status')).toHaveText('Cable released.');
});

test('touch mode allows a cable drag and restores page scrolling on reset', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Load 3D model' }).click();
  await page.getByRole('button', { name: 'Move cable', exact: true }).click();
  await page.locator('#scene-viewport canvas').scrollIntoViewIfNeeded();
  const canvas=page.locator('#scene-viewport canvas');
  await expect(canvas).toHaveCSS('touch-action', 'none');
  const [start,end]=await cableScreenPoints(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{x:start.x,y:start.y}] });
  await expect(page.locator('#cable-status')).toContainText('Cable grabbed');
  for(let i=1;i<=10;i++) await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/10,y:start.y+(end.y-start.y)*i/10}]});
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#cable-status')).toContainText('Cable released');
  await page.getByRole('button', { name: 'Reset cable', exact: true }).click();
  await expect(canvas).toHaveCSS('touch-action','pan-y');
  await context.close();
});
