const { chromium } = require('@playwright/test');

const OTP_SENDER = 'noreply@inventure.com';
const testEmail = process.env.TEST_EMAIL;
const OTP_SUBJECT_KEYWORD = 'Inventure Portal';
const OTP_CODE_REGEX = /\b(\d{6})\b/;

const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 60000;

async function fetchOTPFromGmail(gmailUser, gmailPassword) {
  const user = gmailUser || process.env.GMAIL_USER;
  const password = gmailPassword || process.env.GMAIL_PASSWORD;

  if (!user || !password) {
    throw new Error('GMAIL_USER and GMAIL_PASSWORD must be set');
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 🔐 Login
    await page.goto('https://mail.google.com/');

    await page.getByLabel(/email or phone/i).fill(user);
    await page.getByRole('button', { name: /next/i }).click();

    await page.getByLabel(/enter your password/i).waitFor({ timeout: 10000 });
    await page.getByLabel(/enter your password/i).fill(password);
    await page.getByRole('button', { name: /next/i }).click();

    await page.waitForURL(/mail\.google\.com/, { timeout: 30000 });

    const searchQuery = `to:${testEmail}`;
    const deadline = Date.now() + MAX_WAIT_MS;

    const searchBox = page.locator('input[aria-label="Search mail"]');

    while (Date.now() < deadline) {

      // 🔍 Search mail
      await searchBox.fill(searchQuery);
      await searchBox.press('Enter');

      // ⏳ wait for inbox to render properly
      await page.waitForSelector('div[role="main"]', { timeout: 15000 });
      await page.waitForTimeout(3000);

      // 📬 stable row selection (NO .zA)
      const rows = page.locator('div[role="main"] tr');

      const emailRow = rows.filter({
        hasText: OTP_SUBJECT_KEYWORD
      }).first();

      const count = await emailRow.count();
      console.log(`📬 Matching rows: ${count}`);

      if (count > 0) {

        await emailRow.scrollIntoViewIfNeeded();
        await emailRow.click({ timeout: 10000 });

        // 📧 wait for email body
        const body = page.locator('div.a3s');

        await body.first().waitFor({ timeout: 10000 });

        const bodyText = await body.first().innerText();
        console.log('📧 Email body:', bodyText);

        const match = bodyText.match(OTP_CODE_REGEX);

        if (match) {
          const otp = match[1];
          console.log('🔐 OTP extracted:', otp);
          return otp;
        } else {
          console.log('⚠️ OTP not found, retrying...');
        }
      }

      await page.waitForTimeout(POLL_INTERVAL_MS);
    }

    throw new Error(`OTP email not found after ${MAX_WAIT_MS / 1000}s`);

  } finally {
    await browser.close();
  }
}

module.exports = { fetchOTPFromGmail };