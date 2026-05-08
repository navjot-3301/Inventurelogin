// tests/happyPath.spec.js
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../utils/loginPage');
const { CreateClientPage } = require('../utils/createClientPage');
const { fetchOTPFromGmail } = require('../utils/otpHelper');

const path = require('path');

const unique = () => Date.now().toString().slice(-6);

const CLIENT = {
  groupName: `${unique()} Test Group`,
  groupId: `Test${unique()}`,
  legalName: `Test ${unique()} Techno`,
  license: 'FS-4.1 Category 1',
  bscFilePath: path.resolve(__dirname, '../fixtures/Business_chart.png'),
  primaryContact: `${unique()} Test client`,
  email: `qa.test+${unique()}@onebcg.com`,
  phone: '4365 4363',
  currency: 'MUR',
  nationality: 'Mauritius',
  bank: 'Bank of Baroda',
};

// ─────────────────────────────────────────────────────────────
// TC-HP-01 – Successful Login with Valid Credentials + MFA
// ─────────────────────────────────────────────────────────────

test('TC-HP-01: Successful login with valid email, password, and MFA OTP', async ({ page }, testInfo) => {

  // 🔥 parallel-safe user selection
  const userIndex = testInfo.workerIndex;

  const login = new LoginPage(page, userIndex);
  const createClient = new CreateClientPage(page);

  // Step 1-2: Navigate and wait for Auth0 redirect
  await login.goto();

  console.log('URL:', page.url());
  console.log('TITLE:', await page.title());

  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: /sign in to inventure/i }).click();

  await page.waitForURL(/auth0\.com/, { timeout: 30000 });

  // Step 3: Verify login UI
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  await expect(page.getByText(/log in to onebcg-inventure-dev/i)).toBeVisible();

  await expect(login.emailField).toBeVisible();
  await expect(login.continueBtn).toBeVisible();

  // Step 4-5: Enter email (parallel-safe via LoginPage)
  await login.enterEmail();

  const creds = login.getCredentials();
  await expect(page.getByText(creds.email)).toBeVisible();

  await expect(login.editEmailLink).toBeVisible();

  // Step 6-7: Enter password
  await login.enterPassword();

  await expect(login.mfaHeading).toBeVisible();
  await expect(page.getByText(/we've sent an email/i)).toBeVisible();

  // Step 8-9: OTP
  const otp = await fetchOTPFromGmail(page, null, null, userIndex);

  await login.enterOTP(otp);

  await login.skipPasskeysIfPresent();

  // Step 10: Dashboard
  await login.waitForDashboard();

  await expect(page).toHaveURL(/clients/);

  await expect(
    page.locator('nav, aside, [class*="sidebar"]').first()
  ).toBeVisible();

  // ─────────────────────────────────────────────────────────────
  // CREATE CLIENT FLOW
  // ─────────────────────────────────────────────────────────────

  await createClient.navigateToCreateClient();

  await expect(page).toHaveURL(/\/clients\/create/);
  await expect(page.getByText(/entity setup/i)).toBeVisible();

  await createClient.selectNewClientGroupYes();
  await createClient.enterClientGroupName(CLIENT.groupName);
  await createClient.enterGroupId(CLIENT.groupId);
  await createClient.selectRequestTypeNew();
  await createClient.enterLegalName(CLIENT.legalName);
  await createClient.selectLegalStructureLLC();
  await createClient.selectLicense(CLIENT.license);
  await createClient.uploadBusinessStructureChart(CLIENT.bscFilePath);
  await createClient.enterPrimaryContact(CLIENT.primaryContact);
  await createClient.enterEmail(CLIENT.email);
  await createClient.enterPhoneNumber(CLIENT.phone);
  await createClient.selectAccountingCurrency(CLIENT.currency);
  await createClient.selectNationalityOfShareholders(CLIENT.nationality);
  await createClient.selectInsuranceYes();
  await createClient.selectBank(CLIENT.bank);

  await createClient.configureTaxAndReporting();

  await expect(
    page.getByText(/17 of 17 required fields/i)
  ).toBeVisible();

  // Save Draft
  await createClient.saveDraft();

  await page.waitForURL(/\/entities|\/clients(?!\/create)/i, {
    timeout: 30000,
  });

  await page.reload();
  await page.waitForTimeout(5000);

  const clientRow = page
    .locator('div, tr, li')
    .filter({
      hasText: new RegExp(CLIENT.legalName, 'i'),
    })
    .first();

  await expect(clientRow).toBeVisible();

  // ─────────────────────────────────────────────────────────────
  // SEARCH CLIENT
  // ─────────────────────────────────────────────────────────────

  await page.reload();

  await createClient.searchClient(CLIENT.groupName);

  const searchResult = page
    .locator('[class*="row"], tr, li')
    .filter({ hasText: new RegExp(CLIENT.groupName, 'i') })
    .first();

  await expect(searchResult).toBeVisible();

  // ─────────────────────────────────────────────────────────────
  // OPEN DASHBOARD
  // ─────────────────────────────────────────────────────────────

  await createClient.openClientDashboard(CLIENT.legalName);

  await expect(page).toHaveURL(/\/dashboard/);

  const dashboard = page.getByRole('main');

  await expect(dashboard.getByText(CLIENT.groupName, { exact: false })).toBeVisible();
  await page.waitForLoadState('networkidle');

  await expect(
    dashboard.getByText(`${CLIENT.groupName} - ${CLIENT.legalName}`)
  ).toBeVisible();
 await expect(dashboard.getByText('Key details', { exact: true })).toBeVisible();
     await expect(dashboard.getByText('Contacts', { exact: true })).toBeVisible();
     await expect(dashboard.getByText('Documents', { exact: true })).toBeVisible();
});