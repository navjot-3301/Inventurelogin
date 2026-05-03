// tests/happyPath.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Happy Path test cases for the Inventure Dev4 Login Flow
// TC-HP-01 through TC-HP-05
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const { test, expect } = require('@playwright/test');
const { LoginPage }    = require('../utils/loginPage');
const { fetchOTPFromGmail } = require('../utils/otpHelper');

const EMAIL    = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

// ─────────────────────────────────────────────────────────────────────────────
// TC-HP-01 – Successful Login with Valid Credentials + MFA
// ─────────────────────────────────────────────────────────────────────────────
test('TC-HP-01: Successful login with valid email, password, and MFA OTP', async ({ page }) => {
  const login = new LoginPage(page);

  // Step 1-2: Navigate and wait for Auth0 redirect
  await login.goto();
  await page.getByRole('button', { name: /sign in to inventure/i }).click();
  await page.waitForURL(/auth0\.com/, { timeout: 30_000 });

  // Step 3: Verify login page UI
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  await expect(page.getByText(/log in to onebcg-inventure-dev/i)).toBeVisible();
  await expect(login.emailField).toBeVisible();
  await expect(login.continueBtn).toBeVisible();

  // Step 4-5: Enter email and continue
  await login.enterEmail(EMAIL);
  await expect(page.getByText(EMAIL)).toBeVisible();           // email shown read-only
  await expect(login.editEmailLink).toBeVisible();             // Edit link present

  // Step 6-7: Enter password and continue
  await login.enterPassword(PASSWORD);
  await expect(login.mfaHeading).toBeVisible();               // MFA screen
  await expect(page.getByText(/we've sent an email/i)).toBeVisible();

  // Step 8-9: Fetch OTP from Gmail and enter it
  const otp = await fetchOTPFromGmail();
  await login.enterOTP(otp);

  // 🔑 THIS IS NOW HANDLED INSIDE PAGE OBJECT
   await login.skipPasskeysIfPresent();
  // Step 10-11: Verify dashboard loads
   await login.waitForDashboard();
  // only then optionally verify URL loosely
   await expect(page.url()).toMatch(/clients/);
   await expect(page.locator('nav, aside, [class*="sidebar"]').first()).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-HP-02 – Login with Password Visibility Toggled On
// ─────────────────────────────────────────────────────────────────────────────
test('TC-HP-02: Login after toggling password visibility with the eye icon', async ({ page }) => {
  const login = new LoginPage(page);

  // Navigate and enter email
  await login.goto();
  await page.getByRole('button', { name: /sign in to inventure/i }).click();
  await login.enterEmail(EMAIL);

  // Enter password then toggle visibility
  await login.passwordField.waitFor({ state: 'visible' });
  await login.passwordField.fill(PASSWORD);

  // Password should be masked by default
  await expect(login.passwordField).toHaveAttribute('type', 'password');

  // Click eye icon — password becomes visible
  await login.togglePasswordVisibility();
 // await expect(login.passwordField).toHaveAttribute('type', 'text');
  // Click eye icon — password becomes hide again
  await login.togglePasswordHide();
  await expect(login.passwordField).toHaveAttribute('type', 'password');

  // Submit password
  await login.continueBtn.click();
  await login.screenshot('05_after_password_continue');

  // MFA step
  await expect(login.mfaHeading).toBeVisible();
  const otp = await fetchOTPFromGmail();
await login.enterOTP(otp);
  // 🔑 THIS IS NOW HANDLED INSIDE PAGE OBJECT
   await login.skipPasskeysIfPresent();
  // Step 10-11: Verify dashboard loads
   await login.waitForDashboard();
  // only then optionally verify URL loosely
   await expect(page.url()).toMatch(/clients/);
   await expect(page.locator('nav, aside, [class*="sidebar"]').first()).toBeVisible();
});


// ─────────────────────────────────────────────────────────────────────────────
// TC-HP-03 – Login and Redirect to Post-Login Page (Create Client)
// ─────────────────────────────────────────────────────────────────────────────
test('TC-HP-03: Successful login redirects to correct post-login page with full sidebar', async ({ page }) => {
  const login = new LoginPage(page);

  // Full login
  await login.goto();
  await page.getByRole('button', { name: /sign in to inventure/i }).click();
  await login.enterEmail(EMAIL);
  await login.enterPassword(PASSWORD);
  const otp = await fetchOTPFromGmail();
  await login.enterOTP(otp);
  await login.skipPasskeysIfPresent();
  await login.waitForDashboard();
  await login.clickCreateClient();
  // Verify URL
  const url = page.url();
  expect(url).toMatch(/inventuredev4\.inventure\.mu\/(dashboard|clients\/create)/);

  // Verify sidebar sections — PLATFORM
  const sidebar = page.locator('aside');
  await expect(sidebar.getByText(/platform/i)).toBeVisible();
  await expect(sidebar.getByRole('button', { name: /entities/i })).toBeVisible();

  // OPERATIONS
  await expect(page.getByText(/operations/i)).toBeVisible();
  await expect(page.getByText(/compliance/i)).toBeVisible();
  await expect(page.getByText(/transaction/i)).toBeVisible();
  await expect(page.getByText(/requests/i)).toBeVisible();
  await expect(page.getByText(/documents/i)).toBeVisible();

  // ADMIN
  await expect(page.getByText(/admin/i)).toBeVisible();
  await expect(page.getByText(/user roles/i)).toBeVisible();


  // EXTERNAL LINKS
  await expect(page.getByText(/audit log/i)).toBeVisible();
  await expect(page.getByText(/google drive/i)).toBeVisible();
  await expect(page.getByText(/allvue/i)).toBeVisible();

  // Page content loads (no blank/error state)
  await expect(page.locator('main, [class*="content"], [class*="page"]').first()).toBeVisible();
  await login.screenshot('10_post_login_page');
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-HP-04 – Resend OTP and Login Successfully
// ─────────────────────────────────────────────────────────────────────────────
test('TC-HP-04: Successful login after requesting a new OTP via Resend', async ({ page }) => {
  const login = new LoginPage(page);

  // Step 1: Complete email + password
  await login.goto();
  await page.getByRole('button', { name: /sign in to inventure/i }).click();
  await login.enterEmail(EMAIL);
  await login.enterPassword(PASSWORD);

  // Step 2: MFA screen appears – click Resend
  await expect(login.mfaHeading).toBeVisible();
  await login.resendOTP();

  // Confirmation that code was resent
  await expect(
    page.getByText(/new code|resent|sent/i)
  ).toBeVisible({ timeout: 10_000 });

  // Step 3-4: Fetch the new OTP from Gmail and enter it
  const otp = await fetchOTPFromGmail();
  await login.enterOTP(otp);
  // 🔑 THIS IS NOW HANDLED INSIDE PAGE OBJECT
   await login.skipPasskeysIfPresent();
  // Step 10-11: Verify dashboard loads
   await login.waitForDashboard();
  // only then optionally verify URL loosely
   await expect(page.url()).toMatch(/clients/);
   await expect(page.locator('nav, aside, [class*="sidebar"]').first()).toBeVisible();
});

