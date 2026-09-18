const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:4174';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = [];
  try {
    for (const blockedStorage of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      // Isolate UI/dataLayer tests from live analytics and external messaging.
      await context.route(/googletagmanager\.com|google-analytics\.com|facebook\.(com|net)|wa\.me/, route => route.abort());
      if (blockedStorage) await context.addInitScript(() => {
        Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage disabled'); } });
        Object.defineProperty(crypto, 'randomUUID', { value: undefined });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => dialog.dismiss());
      await page.goto(base + '/?utm_source=facebook&utm_medium=paid_social&utm_campaign=evento&utm_content=criativo_a&utm_term=joinville&fbclid=test_click&email=private%40example.com');
      const events = () => page.evaluate(() => dataLayer.filter(item => ['quiz_start', 'quiz_step', 'lead', 'whatsapp_contact', 'agency_footer_click'].includes(item.event)));
      assert.equal((await events()).length, 0);
      assert(!page.url().includes('email='));
      assert.equal(await page.locator('head script').evaluateAll(scripts => scripts.filter(s => s.textContent.includes("'GTM-P5TKFJZM'")).length), 1);
      assert.equal(await page.locator('body > noscript').count(), 1);
      await page.locator('#n1').click();
      assert.equal((await events()).length, 0, 'Invalid form is not a start, step or lead');
      await page.locator('.start').first().dblclick();
      await page.locator('#name').fill('Teste Privacidade');
      await page.locator('#phone').fill('47999990000');
      // Duplicate script execution must not register another listener.
      await page.addScriptTag({ url: base + '/assets/quiz.js' });
      await page.locator('#n1').click();
      await page.evaluate(() => document.querySelector('#n1').click());
      await page.locator('[data-goal]').first().click();
      await page.evaluate(() => document.querySelector('[data-goal]').click());
      await page.locator('[data-time]').first().click();
      await page.evaluate(() => document.querySelector('[data-time]').click());
      let list = await events();
      assert.equal(list.filter(e => e.event === 'quiz_start').length, 1);
      assert.deepEqual(list.filter(e => e.event === 'quiz_step').map(e => [e.step_number, e.step_name]), [[1, 'identificacao'], [2, 'objetivo'], [3, 'prazo']]);
      assert.equal(list.filter(e => e.event === 'lead').length, 1);
      const href = await page.locator('#wa').getAttribute('href');
      assert(href.startsWith('https://wa.me/5547996650381?text='));
      assert(!decodeURIComponent(href).includes('Teste Privacidade'));
      assert(!href.includes('47999990000'));
      // Run actual registered handlers; suppress navigation and messages.
      await page.evaluate(() => {
        ['wa', 'agency'].forEach(id => document.getElementById(id).addEventListener('click', e => e.preventDefault()));
        document.getElementById('wa').click();
        document.getElementById('wa').click();
        document.getElementById('agency').click();
        document.getElementById('agency').click();
      });
      list = await events();
      assert.equal(list.filter(e => e.event === 'whatsapp_contact').length, 1);
      assert.equal(list.filter(e => e.event === 'agency_footer_click').length, 1);
      await page.waitForTimeout(1100);
      await page.evaluate(() => document.getElementById('wa').click());
      list = await events();
      assert.equal(list.filter(e => e.event === 'whatsapp_contact').length, 2, 'A later opening is a new contact');
      const ids = list.filter(e => e.event_id).map(e => e.event_id);
      assert.equal(ids.length, 3);
      assert.equal(new Set(ids).size, 3);
      for (const e of list) {
        assert.equal(e.procedure, 'harmonizacao_bumbum');
        assert.equal(e.clinic, 'incantare');
        assert.equal(e.city, 'joinville');
        assert.equal(e.source_page, 'harmonizacao-bumbum-incantare-joinville');
        assert.equal(e.utm_source, 'facebook');
        assert.equal(e.fbclid, 'test_click');
        assert(!JSON.stringify(e).includes('Teste Privacidade'));
        assert(!JSON.stringify(e).includes('47999990000'));
        assert(!('phone' in e) && !('name' in e));
      }
      await page.goto(base);
      if (!blockedStorage) assert.equal(await page.evaluate(() => __incantareTrackingContext.utm_source), 'facebook');
      await page.locator('#name').fill('Novo Teste');
      assert.equal((await events()).filter(e => e.event === 'quiz_start').length, 1, 'Direct form interaction is tracked in a new quiz');
      assert.deepEqual(errors, []);
      report.push({ blockedStorage, events: list, errors, result: 'PASS' });
      await context.close();
    }
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/tracking.json', JSON.stringify({ base, report }, null, 2));
    console.log('PASS: full funnel, invalid inputs, duplicate clicks/listeners, new openings, attribution, PII, storage failure, UUID fallback');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
