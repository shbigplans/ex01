#!/usr/bin/env node
/* og-image.svg → og-image.png (1200×630), favicon.svg → favicon-192.png / favicon-512.png (Playwright 렌더링) */
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const IMG = path.resolve(__dirname, '../site/assets/img');
(async () => {
  const browser = await chromium.launch();
  const render = async (svgFile, w, h, out) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const svg = fs.readFileSync(path.join(IMG, svgFile), 'utf8');
    await page.setContent(`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700&family=Noto+Sans+KR:wght@400&family=IBM+Plex+Mono:wght@400&display=swap"><style>html,body{margin:0;background:#F7F4EE}svg{display:block;width:${w}px;height:${h}px}</style></head><body>${svg}</body></html>`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(IMG, out), clip: { x: 0, y: 0, width: w, height: h } });
    await page.close(); console.log('wrote', out);
  };
  await render('og-image.svg', 1200, 630, 'og-image.png');
  await render('favicon.svg', 192, 192, 'favicon-192.png');
  await render('favicon.svg', 512, 512, 'favicon-512.png');
  await browser.close();
})();
