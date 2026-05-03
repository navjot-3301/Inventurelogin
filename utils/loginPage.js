// utils/loginPage.js
// ─────────────────────────────────────────────────────────────────────────────
// Page-Object helper for the Inventure / Auth0 login flow.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Locators ────────────────────────────────────────────────
    this.emailField     = page.getByLabel(/username or email address/i);
    this.continueBtn    = page.getByRole('button', { name: 'Continue', exact: true });
    this.passwordField  = page.locator('input[type="password"]');
    this.eyeIcon        = page.locator('button[aria-label="Show password"]');
    this.eyeIcon1       = page.locator('button[aria-label="Hide password"]');
    this.editEmailLink  = page.getByRole('link', { name: /edit/i });
    this.resetPwdLink   = page.getByRole('link', { name: /reset password/i });
    this.resendLink     = page.getByRole('button', { name: /resend/i });
    this.otpField       = page.getByLabel(/enter the code/i);
    this.mfaHeading     = page.getByRole('heading', { name: /verify your identity/i });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async screenshot(name) {
    const dir = process.env.SCREENSHOTS_DIR || 'screenshots';
    fs.mkdirSync(dir, { recursive: true });

    await this.page.screenshot({
      path: path.join(dir, `${name}_${Date.now()}.png`),
      fullPage: true,
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto(process.env.BASE_URL || '/');

    await this.page.waitForURL(
      url => url.hostname.includes('auth0.com') || url.hostname.includes('inventure'),
      { timeout: 30000 }
    );

    await this.screenshot('01_app_loading');
  }

  // ── Login Steps ───────────────────────────────────────────────────────────

  async enterEmail(email) {
    await this.emailField.waitFor({ state: 'visible' });
    await this.emailField.fill(email);

    await this.screenshot('02_email_entered');
    await this.continueBtn.click();
    await this.screenshot('03_after_email_continue');
  }

  async enterPassword(password) {
    await this.passwordField.waitFor({ state: 'visible' });
    await this.passwordField.fill(password);

    await this.screenshot('04_password_entered');
    await this.continueBtn.click();
    await this.screenshot('05_after_password_continue');
  }

 async togglePasswordVisibility() {
  await this.eyeIcon.click({ timeout: 10000 });
  await this.screenshot('04b_password_revealed');
}
async togglePasswordHide() {
  await this.eyeIcon.click({ timeout: 10000 });
  await this.screenshot('05b_password_hide');
}

  async enterOTP(otp) {
    await this.mfaHeading.waitFor({ state: 'visible' });

    await this.screenshot('06_mfa_screen');
    await this.otpField.fill(otp);

    await this.screenshot('07_otp_entered');
    await this.continueBtn.click();

    await this.screenshot('08_after_otp_continue');
  }

  async resendOTP() {
    await this.resendLink.waitFor({ state: 'visible' });
    await this.resendLink.click();

    await this.screenshot('06b_otp_resent');
  }

  // ── 🔥 NEW: PASSKEY HANDLING ───────────────────────────────────────────────

 async skipPasskeysIfPresent() {
  const skipPasskeys = this.page.getByRole('link', {
    name: /continue without passkeys/i
  });

  const skipButton = this.page.getByRole('button', {
    name: /continue without passkeys/i
  });

  try {
    // wait a bit longer because Auth0 is slow here
    await Promise.race([
      skipPasskeys.waitFor({ timeout: 10000 }),
      skipButton.waitFor({ timeout: 10000 })
    ]);

    const target =
      (await skipPasskeys.isVisible().catch(() => false))
        ? skipPasskeys
        : skipButton;

    if (await target.isVisible()) {
      await target.click();
      console.log('➡️ Skipped passkey enrollment');

      // wait for Auth0 redirect after click
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }

  } catch (e) {
    // Passkey screen not shown — normal flow continues
  }
}

  // ── 🔥 FIXED DASHBOARD WAIT (NO URL RELIANCE) ─────────────────────────────

  async waitForDashboard() {
    await this.page.waitForLoadState('networkidle').catch(() => {});

    await this.page.locator(
      'nav, aside, [class*="sidebar"], main'
    ).first().waitFor({
      state: 'visible',
      timeout: 30000
    });

    await this.screenshot('09_dashboard_loaded');
  }
  async clickCreateClient() {
  const createClientBtn = this.page.getByRole('button', {
    name: /create client/i
  });

  await createClientBtn.waitFor({ state: 'visible', timeout: 15000 });
  await createClientBtn.click();

  await this.screenshot('10_create_client_clicked');
}

  // ── Full Flow ──────────────────────────────────────────────────────────────

  async login(email, password, otp) {
    await this.goto();
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.enterOTP(otp);
    await this.skipPasskeysIfPresent();
    await this.waitForDashboard();
    await this.clickCreateClient();
  }
}

module.exports = { LoginPage };