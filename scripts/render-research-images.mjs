import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
// Start `npm run dev` first. This renders local geometry; no generated stock imagery.
const output = new URL('../src/assets/research/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox','--enable-unsafe-swiftshader'] });
try {
  for (const type of (process.argv.slice(2).length ? process.argv.slice(2) : ['hand','simulation'])) {
    const page=await browser.newPage({viewport:{width:1500,height:960},deviceScaleFactor:1});
    await page.goto(new URL('/cv/', process.env.RENDER_BASE_URL || 'http://localhost:4321').href);
    await page.evaluate(async type => {
      const {renderResearchVisual}=await import('/scripts/research-visuals.ts');
      await renderResearchVisual(type);
    },type);
    await page.locator('#research-render').screenshot({path:new URL(`${type === 'hand' ? 'hand-carbon' : type}.png`,output).pathname});
    console.log(`Rendered ${type}`);
    await page.close();
  }
} finally { await browser.close(); }
