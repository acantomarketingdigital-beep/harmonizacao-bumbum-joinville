// Run with Playwright installed: node tests/verify.cjs [base URL] [report name]
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:4174';
const label = process.argv[3] || 'local';
const output = `test-results/${label}`;
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { base, assets: [], widths: [] };
  try {
    for (const width of [360, 375, 390, 414, 430, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 500 });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error' && !message.text().includes('favicon')) errors.push(message.text()); });
      // Prevent external navigation while testing contact event handlers.
      await page.route('https://wa.me/**', route => route.abort());
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.result-slide').count(), 3);
      assert.equal(await page.locator('.result-dot').count(), 3);
      const current = async n => {
        await page.waitForFunction(n => document.querySelectorAll('.result-dot')[n].getAttribute('aria-current') === 'true', n);
      };
      const ready = async selector => {
        await page.locator(selector).evaluate(async image => { await image.decode(); });
      };
      const swipe = async (selector, direction) => {
        const target = page.locator(selector);
        await target.scrollIntoViewIfNeeded();
        const b = await target.boundingBox();
        const startX = b.x + b.width * (direction === 'left' ? .8 : .2);
        const endX = b.x + b.width * (direction === 'left' ? .2 : .8);
        const y = b.y + Math.min(b.height / 2, 300);
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
        for (let step = 1; step <= 8; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX + (endX - startX) * step / 8, y }] });
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      };
      for (let n = 0; n < 3; n++) {
        await page.locator('.result-dot').nth(n).click();
        await current(n);
        await ready(`.result-slide[data-index="${n}"] img`);
        await page.locator('.result-track').evaluate(async track => {
          await Promise.all(track.getAnimations().map(animation => animation.finished));
        });
        const metrics = await page.locator(`.result-slide[data-index="${n}"] img`).evaluate(image => {
          const b = image.getBoundingClientRect();
          const v = document.querySelector('.result-viewport').getBoundingClientRect();
          return { naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: b.width, height: b.height, viewportHeight: v.height, left: b.left, right: b.right, fit: getComputedStyle(image).objectFit };
        });
        assert(metrics.naturalWidth > 0);
        assert(Math.abs(metrics.width / metrics.height - metrics.naturalWidth / metrics.naturalHeight) < .01);
        assert(Math.abs(metrics.viewportHeight - metrics.height) < 2, 'No oversized empty photo area');
        assert(metrics.left >= 0 && metrics.right <= width);
        assert.equal(metrics.fit, 'contain');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
        if (width === 390 || width === 1440) await page.locator('.result-sec').screenshot({ path: `${output}/${width}-slide-${n + 1}.png` });
        await page.locator('.result-slide').nth(n).click();
        await ready('#lbImg');
        assert.equal(await page.locator('#lbCount').textContent(), `${n + 1} de 3`);
        assert.equal(await page.locator('#lbImg').getAttribute('src'), `/assets/resultado-${n + 1}.webp`);
        if (width === 390) await page.screenshot({ path: `${output}/${width}-lightbox-${n + 1}.png` });
        await page.locator('#lbNext').click();
        assert.equal(await page.locator('#lbCount').textContent(), `${(n + 1) % 3 + 1} de 3`);
        await page.locator('#lbPrev').click();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.locator('#lbCount').textContent(), `${n + 1} de 3`);
        await page.locator('#lbClose').click();
        assert.equal(await page.locator('#lightbox').evaluate(el => el.open), false);
      }
      await page.locator('#resultNext').click(); await current(0);
      await page.locator('#resultPrev').click(); await current(2);
      await page.locator('.result-dot').nth(0).click();
      if (width < 500) {
        await swipe('.result-viewport', 'left'); await current(1);
        assert.equal(await page.locator('#lightbox').evaluate(el => el.open), false, 'Swipe must not open lightbox');
        await swipe('.result-viewport', 'right'); await current(0);
        await page.waitForTimeout(450); // Allow intentional swipe click suppression to expire.
      }
      await page.locator('.result-slide').nth(0).click();
      if (width < 500) {
        await swipe('#lbImg', 'left'); await current(1);
        await swipe('#lbImg', 'right'); await current(0);
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#lightbox').evaluate(el => el.open), false);
      assert.equal(await page.locator('body').evaluate(el => el.classList.contains('lb-open')), false);
      await page.locator('.start').first().click();
      await page.locator('#name').fill('Teste');
      await page.locator('#phone').fill('47999990000');
      await page.locator('#n1').click();
      await page.locator('[data-goal]').first().click();
      await page.locator('[data-time]').first().click();
      const contact = await page.locator('#wa').getAttribute('href');
      assert(contact.startsWith('https://wa.me/5547996650381?text='));
      // Exercise the existing handlers with navigation prevented; send no messages.
      await page.evaluate(() => {
        for (const id of ['wa', 'agency']) {
          const link = document.getElementById(id);
          link.addEventListener('click', e => e.preventDefault(), { once: true });
          link.click();
        }
      });
      const events = await page.evaluate(() => window.dataLayer);
      for (const name of ['quiz_start', 'quiz_step', 'lead', 'whatsapp_contact', 'agency_footer_click']) assert(events.some(e => e.event === name), name);
      assert.deepEqual(events.filter(e => e.event === 'quiz_step').map(e => e.step_number), [1, 2, 3]);
      for (const event of events.filter(e => ['quiz_start', 'quiz_step', 'lead', 'whatsapp_contact'].includes(e.event))) {
        assert.equal(event.procedure, 'harmonizacao_bumbum');
        assert.equal(event.clinic, 'incantare');
        assert.equal(event.city, 'joinville');
        assert.equal(event.source_page, 'harmonizacao-bumbum-incantare-joinville');
      }
      assert.deepEqual(errors, []);
      if (width === 360) {
        for (let n = 1; n <= 3; n++) {
          const response = await context.request.get(`${base}/assets/resultado-${n}.webp`);
          assert.equal(response.status(), 200);
          assert(response.headers()['content-type'].includes('image/webp'));
          const bytes = await response.body();
          assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
          assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
          assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
          assert.deepEqual(bytes, fs.readFileSync(`assets/resultado-${n}.webp`));
          report.assets.push({ path: `/assets/resultado-${n}.webp`, status: response.status(), type: response.headers()['content-type'], bytes: bytes.length });
        }
      }
      report.widths.push({ width, images: 3, carousel: 'pass', lightbox: 'pass', swipe: width < 500 ? 'pass' : 'n/a', quizAndTracking: 'pass', errors });
      console.log(`PASS ${width}px: photos, arrows, dots, lightbox, keyboard, touch, quiz, tracking`);
      await context.close();
    }
    fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
