/**
 * Puppeteer TikTok demo recorder for World Cup Scout app.
 * Records a sequence: dashboard → click a match → scout report loading → scroll through report.
 *
 * Usage:
 *   node record-demo.js
 *
 * Output: recordings/worldcup-demo.mp4
 * Requires the dev server to be running: npm run dev
 */

import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const OUTPUT_DIR = resolve('./recordings');
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'worldcup-demo.mp4');

// iPhone 14 Pro viewport (TikTok 9:16)
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true };

const RECORDER_CONFIG = {
  followNewTab: false,
  fps: 30,
  videoFrame: { width: 390, height: 844 },
  videoCrf: 18,
  videoCodec: 'libx264',
  videoPreset: 'ultrafast',
  aspectRatio: '9:16',
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function smoothScroll(page, distance = 2000, duration = 3000) {
  const steps = 60;
  const stepSize = distance / steps;
  const stepDelay = duration / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollBy({ top: y, behavior: 'instant' }), stepSize);
    await sleep(stepDelay);
  }
}

(async () => {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('🎬 Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      `--window-size=${VIEWPORT.width},${VIEWPORT.height + 100}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  const recorder = new PuppeteerScreenRecorder(page, RECORDER_CONFIG);

  try {
    console.log(`📡 Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('⏺  Starting recording...');
    await recorder.start(OUTPUT_FILE);

    // --- Scene 1: Dashboard overview (8s) ---
    console.log('🏟  Scene 1: Dashboard overview');
    await sleep(8000);

    // --- Scene 2: Click the Matches tab if not already on it ---
    console.log('📋 Scene 2: Navigating to Matches tab');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent.trim().toLowerCase().includes('matches'));
      if (tab) tab.click();
    });
    await sleep(2000);

    // --- Scene 3: Click a Scout button on the first available match card ---
    console.log('🔍 Scene 3: Clicking scout button on first match');
    const scoutBtn = await page.waitForSelector('.scout-match-btn, button[class*="scout"]', {
      timeout: 10000,
    }).catch(() => null);

    if (scoutBtn) {
      await scoutBtn.click();
      console.log('✅ Scout button clicked');
    } else {
      // Fallback: click the Scout tab directly
      console.log('⚠️  No scout button found, clicking Scout tab directly');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const tab = btns.find(b => b.textContent.includes('Scout'));
        if (tab) tab.click();
      });
    }

    // --- Scene 4: Watch the agents work (15s) ---
    console.log('⚙️  Scene 4: Agent pipeline running (15s)');
    await sleep(5000);

    // Scroll to show loading progress if visible
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }));
    await sleep(10000);

    // --- Scene 5: Report rendered — scroll through it ---
    console.log('📜 Scene 5: Scrolling through the report');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(1000);

    // Slow cinematic scroll through the full report
    await smoothScroll(page, 5000, 12000);
    await sleep(2000);

    // Scroll back up for a clean ending
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(3000);

    console.log('⏹  Stopping recording...');
    await recorder.stop();

    console.log(`\n✅ Done! Video saved to:\n   ${OUTPUT_FILE}`);
    console.log('\n💡 Tips:');
    console.log('   • Re-run for a different match: edit APP_URL or click scout on a different card first.');
    console.log('   • Upload recordings/worldcup-demo.mp4 directly to TikTok (9:16, 30fps).');
  } catch (err) {
    console.error('❌ Recording failed:', err.message);
    await recorder.stop().catch(() => {});
  } finally {
    await browser.close();
  }
})();
