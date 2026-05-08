// utils/loginPage.js
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');

class LoginPage {
  constructor(page, userIndex = 0) {
    this.page = page;
    this.userIndex = userIndex;

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

  async screenshot(name) {
    const dir = process.env.SCREENSHOTS_DIR || 'screenshots';
    fs.mkdirSync(dir, { recursive: true });

    await this.page.screenshot({
      path: path.join(dir, `${name}_${Date.now()}.png`),
      fullPage: true,
    });
  }

  async goto() {
    await this.page.goto(process.env.BASE_URL || '/');

    await this.page.waitForURL(
      url => url.hostname.includes('auth0.com') || url.hostname.includes('inventure'),
      { timeout: 30000 }
    );

    await this.screenshot('01_app_loading');
  }

  // ─────────────────────────────────────────────────────────────
  // Credentials resolver (parallel-safe)
  // ─────────────────────────────────────────────────────────────
  getCredentials() {
    const idx = this.userIndex + 1;

    const email = process.env[`TEST_EMAIL${idx}`];
    const password = process.env[`TEST_PASSWORD${idx}`];

    if (!email || !password) {
      throw new Error(`Missing TEST_EMAIL${idx} or TEST_PASSWORD${idx}`);
    }

    return { email, password };
  }

  // ─────────────────────────────────────────────────────────────
  // FIXED: Safe enterEmail (NO undefined crash)
  // ─────────────────────────────────────────────────────────────
  async enterEmail(email) {
    const creds = this.getCredentials();
    const value = email || creds.email;

    if (!value) {
      throw new Error(`Email is undefined for userIndex ${this.userIndex}`);
    }

    await this.emailField.waitFor({ state: 'visible' });
    await this.emailField.fill(value);

    await this.screenshot('02_email_entered');
    await this.continueBtn.click();
    await this.screenshot('03_after_email_continue');
  }

  // ─────────────────────────────────────────────────────────────
  // FIXED: Safe enterPassword
  // ─────────────────────────────────────────────────────────────
  async enterPassword(password) {
    const creds = this.getCredentials();
    const value = password || creds.password;

    if (!value) {
      throw new Error(`Password is undefined for userIndex ${this.userIndex}`);
    }

    await this.passwordField.waitFor({ state: 'visible' });
    await this.passwordField.fill(value);

    await this.screenshot('04_password_entered');
    await this.continueBtn.click();
    await this.screenshot('05_after_password_continue');
  }

  async enterOTP(otp) {
    await this.mfaHeading.waitFor({ state: 'visible' });

    await this.screenshot('06_mfa_screen');
    await this.otpField.fill(otp);

    await this.screenshot('07_otp_entered');
    await this.continueBtn.click();

    await this.screenshot('08_after_otp_continue');
  }

  async skipPasskeysIfPresent() {
    const skipPasskeys = this.page.getByRole('link', {
      name: /continue without passkeys/i
    });

    const skipButton = this.page.getByRole('button', {
      name: /continue without passkeys/i
    });

    if (await skipPasskeys.isVisible().catch(() => false)) {
      await skipPasskeys.click();
      return;
    }

    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      return;
    }
  }

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

  // ─────────────────────────────────────────────────────────────
  // FULL FLOW (safe for parallel runs)
  // ─────────────────────────────────────────────────────────────
  async login(email, password, otp) {
    const creds = this.getCredentials();

    await this.goto();
    await this.enterEmail(email || creds.email);
    await this.enterPassword(password || creds.password);
    await this.enterOTP(otp);
    await this.skipPasskeysIfPresent();
    await this.waitForDashboard();
    await this.clickCreateClient();
  }
}

module.exports = { LoginPage };