// utils/createClientPage.js
const path = require('path');
const fs   = require('fs');

class CreateClientPage {
  constructor(page) {
    this.page = page;

    // ── Sidebar ───────────────────────────────────────────────
    this.entitiesNavLink = page.getByRole('link', { name: /^entities$/i });
    this.createClientBtn = page.getByRole('button', { name: /create client/i })
      .or(page.getByRole('link', { name: /create client/i }));

    // ── Client Group Section ──────────────────────────────────
    this.newClientGroupSection = page.locator('text=Is this a new client group?').locator('..');
    this.newClientGroupYes = this.newClientGroupSection.getByText('Yes', { exact: true }).first();
    this.newClientGroupNo  = this.newClientGroupSection.getByText('No',  { exact: true }).first();

    this.clientGroupNameField = page.getByLabel(/client group name/i);
    this.groupIdField = page.getByLabel(/group id number/i);

    // ── Request Type ──────────────────────────────────────────
    this.requestTypeNew = page.getByText(/^new$/i).first();
    this.requestTypeExisting = page.getByText(/^existing$/i).first();

    // ── Core Fields ───────────────────────────────────────────
    this.legalNameField = page.getByLabel(/legal name/i);

    // ── Legal Structure ───────────────────────────────────────
    this.legalStructureLLC = page.getByText('Limited Liability Company', { exact: true });

    // ── License ───────────────────────────────────────────────
    this.licenseDropdown = page.locator('text=License')
      .locator('xpath=following::*[@role="combobox" or self::span][1]');

    // ── File Upload ──────────────────────────────────────────
    this.bscUploadBtn = page.locator('input[type="file"]').first();

    // ── Contact ──────────────────────────────────────────────
    this.primaryContactField = page.getByLabel(/primary client contact/i);

    this.emailAddressField = page.locator('text=Email Address')
      .locator('..')
      .locator('input');

    this.phoneNumberField = page.locator('text=Phone number')
      .locator('..')
      .locator('input')
      .first();

    // ── Financial Section ─────────────────────────────────────
    this.accountingCurrencyDropdown = page.locator('text=Accounting Reporting Currency')
      .locator('xpath=following::*[@role="combobox" or self::span][1]');

    this.nationalityShareholdersDropdown = page.locator('text=Nationality of Shareholders')
      .locator('xpath=following::*[@role="combobox" or self::span][1]');

    this.insuranceSection = page.locator('text=Insurance').locator('..');
    this.insuranceYes = this.insuranceSection.getByText('Yes', { exact: true }).first();

    this.bankDropdown = page.locator('text=Bank')
      .locator('xpath=following::*[@role="combobox" or self::span][1]');

    // ── Tax & Reporting ──────────────────────────────────────
    this.fatcaDropdown = this.page.locator('text=FATCA')
  .locator('xpath=following::button[1]');

    this.usTaxSection = page.locator('text=US Tax')
  .locator('xpath=ancestor::div[1]');

this.usTaxYes = this.usTaxSection.getByRole('radio', { name: /yes/i })
  .or(this.usTaxSection.getByText('Yes', { exact: true }));

    this.usTaxSection = page.locator('text=US Tax')
  .locator('xpath=ancestor::div[1]');

this.usTaxYes = this.usTaxSection.getByRole('radio', { name: /yes/i })
  .or(this.usTaxSection.getByText('Yes', { exact: true }));

  this.mauriTaxDropdown = page
  .locator('text=/Mauritian Tax Residence Certificate/i')
  .locator('xpath=ancestor::div[1]')
  .locator('button:visible')
  .first();

    // ── Actions ──────────────────────────────────────────────
    this.saveDraftBtn = page.getByRole('button', { name: /save draft/i });

    // ── Search ───────────────────────────────────────────────
    this.searchBar = page.getByPlaceholder(/search/i)
      .or(page.getByRole('searchbox'));
  

// ── Pagination ────────────────────────────────────────────
    // Footer label e.g. "Showing 1–10 of 274 entities"
    this.paginationFooter = page.locator(
      '[class*="pagination"] [class*="label"], [class*="pagination"] span, ' +
      '[class*="footer"] span, footer span, p'
    ).filter({ hasText: /showing/i }).first();
 
    // Next (›) arrow button
    this.nextArrow = page.locator(
      '[class*="pagination"] button, [class*="pager"] button, [role="navigation"] button'
    ).filter({ hasText: /›|next/i }).first();
 
    // Previous (‹) arrow button
    this.prevArrow = page.locator(
      '[class*="pagination"] button, [class*="pager"] button, [role="navigation"] button'
    ).filter({ hasText: /‹|prev/i }).first();
 
    // Ellipsis between page groups
    this.ellipsis = page.locator(
      '[class*="pagination"] span, [class*="pagination"] li, [class*="pagination"] button'
    ).filter({ hasText: /^[.…]{2,3}$|^\u2026$/ }).first();
  }


  async screenshot(name) {
    const dir = process.env.SCREENSHOTS_DIR || 'screenshots';
    fs.mkdirSync(dir, { recursive: true });
    await this.page.screenshot({
      path: path.join(dir, `cc_${name}_${Date.now()}.png`),
      fullPage: true,
    });
  }

  // ✅ FIXED DROPDOWN HANDLER (robust + flexible)
  async selectDropdownOption({ trigger, optionText, type = 'simple' }) {
    await trigger.waitFor({ state: 'visible', timeout: 10000 });
    await trigger.click();

    // wait for dropdown list to appear
    const option = this.page.locator(
      `[role="option"]:has-text("${optionText}"),
       li:has-text("${optionText}"),
       div:has-text("${optionText}")`
    ).last();

    // handle searchable dropdowns
    const input = this.page.locator('input:focus');
    if (await input.isVisible().catch(() => false)) {
      await input.fill(optionText);
    }

    await option.waitFor({ state: 'visible', timeout: 10000 });

    try {
      await option.click({ force: true });
    } catch (e) {
      await this.screenshot('dropdown_error');
      throw e;
    }

    // checkbox dropdown case
    if (type === 'checkbox') {
      const doneBtn = this.page.getByRole('button', { name: /done/i });
      if (await doneBtn.isVisible().catch(() => false)) {
        await doneBtn.click();
      }
    }
  }

  // ── Navigation ─────────────────────────────────────────────
  async navigateToCreateClient() {
    await this.createClientBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.createClientBtn.click();
    await this.page.waitForURL(/clients\/create/i);
  }

  // ── Client Group ──────────────────────────────────────────
  async selectNewClientGroupYes() {
    await this.newClientGroupYes.waitFor({ state: 'visible', timeout: 10000 });
    await this.newClientGroupYes.click({ force: true });
  }

  async enterClientGroupName(name) {
    await this.clientGroupNameField.fill(name);
  }

  async enterGroupId(id) {
    await this.groupIdField.fill(id);
  }

  // ── Request Type ──────────────────────────────────────────
  async selectRequestTypeNew() {
    await this.requestTypeNew.click({ force: true });
  }

  // ── Core Fields ───────────────────────────────────────────
  async enterLegalName(name) {
    await this.legalNameField.fill(name);
  }

  async selectLegalStructureLLC() {
    await this.legalStructureLLC.waitFor({ state: 'visible' });
    await this.legalStructureLLC.click();
  }

  // ── License ───────────────────────────────────────────────
  async selectLicense(licenseText) {
    await this.selectDropdownOption({
      trigger: this.licenseDropdown,
      optionText: licenseText,
      type: 'checkbox'
    });
  }

  // ── Upload ───────────────────────────────────────────────
  async uploadBusinessStructureChart(filePath) {
    await this.bscUploadBtn.setInputFiles(filePath);
    await this.page.getByText(/uploaded/i).first().waitFor({ state: 'visible' });
  }

  // ── Contact ──────────────────────────────────────────────
  async enterPrimaryContact(name) {
    await this.primaryContactField.fill(name);
  }

  async enterEmail(email) {
    await this.emailAddressField.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailAddressField.fill(email);
  }

  async enterPhoneNumber(phone) {
    await this.phoneNumberField.waitFor({ state: 'visible', timeout: 10000 });
    await this.phoneNumberField.fill(phone);
  }

  // ── Financial ────────────────────────────────────────────
  async selectAccountingCurrency(currency) {
    await this.selectDropdownOption({
      trigger: this.accountingCurrencyDropdown,
      optionText: currency
    });
  }

  async selectNationalityOfShareholders(nationality) {
    await this.selectDropdownOption({
      trigger: this.nationalityShareholdersDropdown,
      optionText: nationality
    });
  }

  async selectInsuranceYes() {
    await this.insuranceYes.click({ force: true });
  }

  async selectBank(bankName) {
    await this.selectDropdownOption({
      trigger: this.bankDropdown,
      optionText: bankName
    });
  }

  // ── Tax & Reporting ──────────────────────────────────────
  async configureTaxAndReporting() {
    await this.selectDropdownOption({
  trigger: this.fatcaDropdown,
  optionText: 'Exempt'
});
    await this.usTaxYes.click({ force: true });
    await this.selectDropdownOption({
  trigger: this.mauriTaxDropdown,
  optionText: 'Required'
});
    await this.page.getByText(/17 of 17 required fields/i).waitFor();
  }

  // ── Save ────────────────────────────────────────────────
  async saveDraft() {
    await this.saveDraftBtn.click();
    await this.page.waitForURL(/entities|clients/);
  }

  // ── Search ──────────────────────────────────────────────
  async searchClient(text) {
    await this.searchBar.fill(text);
    await this.page.waitForLoadState('networkidle');
  }

  // ── Open Dashboard ──────────────────────────────────────
  async openClientDashboard(clientName) {
    await this.page.getByText(new RegExp(clientName, 'i')).first().click();
    await this.page.waitForURL(/dashboard/);
  }
}
 
module.exports = { CreateClientPage };