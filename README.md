# Inventure – Playwright Happy Path Tests

End-to-end login flow tests for **Inventure Dev4** using [Playwright](https://playwright.dev/) (JavaScript).

---

## Project Structure

```
inventure-playwright/
├── .env                        # Local secrets (git-ignored)
├── .env.example                # Template – copy to .env
├── playwright.config.js        # Playwright configuration
├── package.json
├── tests/
│   └── happyPath.spec.js       # TC-HP-01 through TC-HP-05
├── utils/
│   ├── loginPage.js            # Page-Object for Auth0 login flow
│   └── otpHelper.js            # Gmail OTP retrieval helper
├── screenshots/                # Auto-created – one PNG per step
├── videos/                     # Auto-created – one MP4 per test
└── .github/
    └── workflows/
        └── playwright.yml      # GitHub Actions CI pipeline
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-org>/inventure-playwright.git
cd inventure-playwright

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install chromium --with-deps

# 4. Configure environment
cp .env.example .env
# Edit .env and fill in all values
```

---

## Environment Variables (`.env`)

| Variable | Description |
|----------|-------------|
| `BASE_URL` | App URL – `https://inventuredev4.inventure.mu` |
| `AUTH0_DOMAIN` | Auth0 domain |
| `TEST_EMAIL` | Registered test user email |
| `TEST_PASSWORD` | Test user password |
| `GMAIL_USER` | Gmail address used to receive OTP |
| `GMAIL_PASSWORD` | Gmail App Password (not your account password) |
| `HEADLESS` | `true` / `false` |
| `SLOW_MO` | Milliseconds between actions (default `0`) |
| `SCREENSHOTS_DIR` | Output folder for screenshots |
| `VIDEOS_DIR` | Output folder for videos |

> **Tip:** Generate a Gmail App Password at  
> Google Account → Security → 2-Step Verification → App passwords

---

## Running Tests

```bash
# All happy path tests (headless)
npm test

# Headed mode (watch the browser)
npm run test:headed

# Debug mode (step through)
npm run test:debug

# Only happy path spec
npm run test:happy

# Open HTML report after a run
npm run test:report
```

---

## Screenshots & Videos

- **Screenshots** are saved to `screenshots/` after every test step automatically.
- **Videos** are saved to `videos/` as `.webm` files, one per test.
- Both are uploaded as **GitHub Actions artifacts** on every CI run (retained 14 days).

---

## Test Cases

| TC ID | Description | Priority |
|-------|-------------|----------|
| TC-HP-01 | Successful login – email → password → MFA OTP | P0 |
| TC-HP-02 | Login after toggling password visibility | P1 |
| TC-HP-03 | Post-login page and sidebar navigation verified | P1 |
| TC-HP-04 | Resend OTP and login successfully | P1 |
| TC-HP-05 | Session reuse – no re-login for active session | P1 |

---

## CI / GitHub Actions

The workflow at `.github/workflows/playwright.yml` runs on every push and PR to `main`.

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

- `BASE_URL`
- `AUTH0_DOMAIN`
- `TEST_EMAIL`
- `TEST_PASSWORD`
- `GMAIL_USER`
- `GMAIL_PASSWORD`

Artifacts (report, screenshots, videos, traces) are uploaded automatically after each run.
