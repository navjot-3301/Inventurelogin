// tests/happyPath.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Happy Path test cases for the Inventure Dev4 Login Flow
// TC-HP-01 through TC-HP-05
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const { test, expect } = require('@playwright/test');
const { LoginPage }    = require('../utils/loginPage');
const { CreateClientPage } = require('../utils/createClientPage');
const { fetchOTPFromGmail } = require('../utils/otpHelper');


const EMAIL    = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;
const path = require('path');
const unique = () => Date.now().toString().slice(-6);
const CLIENT = {
  groupName: `${unique()} Test Group`,
  groupId: `Test${unique()}`,
  legalName: `AppSphere Techno`,
  license: 'FS-4.1 Category 1',
  bscFilePath: path.resolve(__dirname, '../fixtures/Business_chart.png'),
  primaryContact: `${unique()}Test client`,
  email: `qa.test+${unique()}@onebcg.com`,
  phone: '4365 4363',
  currency: 'MUR',
  nationality: 'Mauritius',
  bank: 'Bank of Baroda',
};
// ─────────────────────────────────────────────────────────────────────────────
// TC-HP-01 – Successful Login with Valid Credentials + MFA
// ─────────────────────────────────────────────────────────────────────────────
test('TC-HP-01: Successful login with valid email, password, and MFA OTP', async ({ page }) => {
  const login = new LoginPage(page);
  const createClient = new CreateClientPage(page);
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

  //── Create Client TESTS (TC-P01 → TC-P10) ─────────

   // TC-01: Navigate to Create Client page via sidebar
     await createClient.navigateToCreateClient();
     await expect(page).toHaveURL(/\/clients\/create/);
     await expect(page.getByText(/entity setup/i)).toBeVisible();
   
     // TC-02: Select "Yes" for new client group
     await createClient.selectNewClientGroupYes();
     await expect(page.getByLabel(/client group name/i)).toBeVisible();
   
     // TC-03: Enter Client Group Name
     await createClient.enterClientGroupName(CLIENT.groupName);
     await expect(page.getByLabel(/client group name/i)).toHaveValue(CLIENT.groupName);
   
     // TC-04: Enter Group ID Number
     await createClient.enterGroupId(CLIENT.groupId);
     await expect(page.getByLabel(/group id number/i)).toHaveValue(CLIENT.groupId);
   
     // TC-05: Select Request Type → New
     await createClient.selectRequestTypeNew();
   
     // TC-06: Enter Legal Name
     await createClient.enterLegalName(CLIENT.legalName);
     await expect(page.getByLabel(/legal name/i)).toHaveValue(CLIENT.legalName);
   
     // TC-07: Select Legal Structure → Limited Liability Company
     await createClient.selectLegalStructureLLC();
   
     // TC-08: Select License
     await createClient.selectLicense(CLIENT.license);
   
     // TC-09: Upload Business Structure Chart
     await createClient.uploadBusinessStructureChart(CLIENT.bscFilePath);
     await expect(page.getByText(/uploaded/i)).toBeVisible();
   
     // TC-10: Enter Primary Client Contact
     await createClient.enterPrimaryContact(CLIENT.primaryContact);
   
     // TC-11: Enter Email Address
     await createClient.enterEmail(CLIENT.email);
   
     // TC-12: Enter Phone Number
     await createClient.enterPhoneNumber(CLIENT.phone);
   
     // TC-13: Select Accounting Currency → MUR
     await createClient.selectAccountingCurrency(CLIENT.currency);
   
     // TC-14: Select Nationality of Shareholders → Mauritius
     await createClient.selectNationalityOfShareholders(CLIENT.nationality);
   
     // TC-15: Select Insurance → Yes
     await createClient.selectInsuranceYes();
   
     // TC-16: Select Bank → Bank of Baroda
     await createClient.selectBank(CLIENT.bank);
   
     // TC-17: Configure Tax & Reporting (FATCA + US Tax + Mauritian Tax)
     //        Verifies "17 of 17 required fields completed" counter
     await createClient.configureTaxAndReporting();
     await expect(page.getByText(/17 of 17 required fields/i)).toBeVisible();
   
     // TC-18: Save Draft → redirect to Entities list
     await createClient.saveDraft();
     await expect(page).toHaveURL(/\/entities|\/clients(?!\/create)/i);
      await page.reload();
     // New entity should appear at the top of the list

     await page.waitForTimeout(5000);

    await page.reload({waitUntil: 'networkidle'});

    const clientRow = page
    .locator('div', { hasText: new RegExp(CLIENT.legalName, 'i') })
    .first();
    await expect(clientRow).toBeVisible();

   
     // ── PART 3: Search & Open Client (TC-19 → TC-20) ─────────────────────────
     await page.reload();
     // TC-19: Search / filter the newly created client
     await createClient.searchClient(CLIENT.groupName);
     const searchResult = page.locator('[class*="row"], tr, li')
                             .filter({ hasText: new RegExp(CLIENT.groupName, 'i') })
                             .first();
     await expect(searchResult).toBeVisible();
     await expect(page.getByText(new RegExp(CLIENT.groupName, 'i'))).toBeVisible();
   
     // TC-20: Open client dashboard
     await createClient.openClientDashboard(CLIENT.legalName);
     await expect(page).toHaveURL(/\/dashboard/);
     const dashboard = page.getByRole('main');
     await expect(dashboard.getByText(CLIENT.groupName, { exact: false })).toBeVisible();
     await expect(dashboard.getByText(`${CLIENT.groupName} - ${CLIENT.legalName}`, { exact: true })).toBeVisible();
     // Verify key dashboard sections     
     await expect(dashboard.getByText('Key details', { exact: true })).toBeVisible();
     await expect(dashboard.getByText('Contacts', { exact: true })).toBeVisible();
     await expect(dashboard.getByText('Documents', { exact: true })).toBeVisible();
   });
   

