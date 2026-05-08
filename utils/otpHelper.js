const OTP_CODE_REGEX = /\b(\d{6})\b/;

const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 60000;

async function fetchOTPFromGmail(page, gmailUser, gmailPassword, workerIndex = 0) {
  const user = gmailUser || process.env.GMAIL_USER;
  const password = gmailPassword || process.env.GMAIL_PASSWORD;

  const testEmail =
    process.env[`TEST_EMAIL${workerIndex + 1}`] || process.env.TEST_EMAIL;

  if (!user || !password || !testEmail) {
    throw new Error(`Missing credentials for worker ${workerIndex}`);
  }

  const context = page.context();
  const otpPage = await context.newPage();

  try {
    // 🔐 Open Gmail
    await otpPage.goto('https://mail.google.com/', {
      waitUntil: 'networkidle',
    });

    // Login
    await otpPage.getByLabel(/email or phone/i).fill(user);
    await otpPage.getByRole('button', { name: /next/i }).click();

    await otpPage.getByLabel(/enter your password/i).waitFor({ timeout: 15000 });
    await otpPage.getByLabel(/enter your password/i).fill(password);
    await otpPage.getByRole('button', { name: /next/i }).click();

    await otpPage.waitForSelector('div[role="main"]', { timeout: 30000 });

    const searchBox = otpPage.locator('input[aria-label="Search mail"]');
    await searchBox.waitFor({ state: 'visible', timeout: 60000 });

    // 🔥 ONLY EMAIL SEARCH (as you requested)
    await searchBox.fill(`to:${testEmail}`);
    await searchBox.press('Enter');

    const deadline = Date.now() + MAX_WAIT_MS;

    while (Date.now() < deadline) {
      await otpPage.waitForTimeout(POLL_INTERVAL_MS);

      const rows = otpPage.locator('div[role="main"] tr');
      const count = await rows.count();

      if (count === 0) {
        console.log(`📭 Worker ${workerIndex}: waiting for emails...`);
        continue;
      }

      // 🔥 ALWAYS TAKE LATEST EMAIL FIRST (CRITICAL FIX)
      for (let i = 0; i < Math.min(count, 10); i++) {
        const row = rows.nth(i);

        const text = await row.innerText().catch(() => '');

        // We DO NOT check subject anymore
        // Only ensure it's a real email row
        if (!text || text.trim().length === 0) continue;

        await row.click();

        const body = otpPage.locator('div.a3s').first();
        await body.waitFor({ timeout: 15000 });

        const bodyText = await body.innerText();

        const match = bodyText.match(OTP_CODE_REGEX);

        if (match) {
          const otp = match[1];

          console.log(
            `🔐 Worker ${workerIndex} OTP for ${testEmail}: ${otp}`
          );

          return otp;
        }

        console.log(
          `⚠️ Worker ${workerIndex}: No OTP in this email, checking next...`
        );

        await otpPage.goBack().catch(() => {});
      }
    }

    throw new Error(`OTP not found for ${testEmail} after ${MAX_WAIT_MS / 1000}s`);
  } finally {
    await otpPage.close();
  }
}

module.exports = { fetchOTPFromGmail };