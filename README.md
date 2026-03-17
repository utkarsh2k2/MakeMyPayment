# Subscription Intelligence

A small full-stack, mobile-first web dashboard for tracking recurring subscriptions and upcoming charges.

## Tech Stack

- Node.js
- Express
- HTML
- CSS
- Vanilla JavaScript
- In-memory JSON storage (no database)

## Features

- **Financial Guardian & Optimizer**
  - Primary view that splits recurring payments into:
    - **Fixed Obligations**: EMIs, insurance premiums, utilities and other high-stakes bills.
    - **Lifestyle Subs**: OTT, gyms, memberships and SaaS tools.
  - Uses a unified bill model with fields like `bill_type`, `sourceSystem` (BBPS/AA/UPI_AUTO/CARD_SI), `cibilImpact`, `controlType` (USER_REVOCABLE/REDIRECT_LINK/BANK_ONLY), `mcc`, `due_date`, and `cancellationUrl`.

- **Credit Safety Score (Guardian)**
  - Estimates a **Credit Safety Score** out of 100 based on:
    - High-impact EMIs and insurance bills due in the next few days.
    - Their configured CIBIL impact level (`cibilImpact`).
  - Shows a short label (Healthy / Watchlist / At risk) and **CIBIL protection alerts** when high-impact EMIs/insurance are due within 5 days.
  - This score is an internal heuristic to support better repayment behaviour, not an official bureau score.

- **Savings Wedge (Bundle Optimizer)**
  - Detects OTT subscriptions that are already included in common telco bundles (e.g. JioFiber, Airtel Thanks) using a small in-memory catalog.
  - Marks such items as `isDuplicate` and surfaces:
    - A **Potential Savings Found** monthly amount.
    - Per-card guidance like **“Included in JioFiber”** plus a **Switch to bundle** helper action.

- **Control-gap aware actions**
  - Each bill is tagged with a `paymentRail`, `billingSource`, `mcc` and derived `controlType`:
    - **USER_REVOCABLE**: UPI AutoPay mandates that can be revoked (simulated NPCI revoke flow).
    - **REDIRECT_LINK**: Card/EMI mandates managed via bank or SI hubs like SIHub/Mandate HQ; the UI opens a **Secure cancellation link** instead of cancelling directly.
    - **BANK_ONLY**: Loan EMIs with MCC 7322 or explicit `isIrrevocable` where only the lender/bank can make changes; UI shows **Manage via bank** and never offers cancel.

- **Fetch my Bills (Simulated BBPS/AA)**
  - A **Fetch my bills** button in the Fixed Obligations tab simulates fetching EMIs and insurance via BBPS/Account Aggregator.
  - For this demo, the backend seeds a representative set of EMIs/insurance/utility bills and returns a mock list from `/api/fetch-bills` while the dashboard reads everything from `/api/subscriptions`.

- **Subscription Dashboard & Upcoming Charges**
  - Shows all recurring payments with:
    - service name
    - amount
    - billing cycle
    - next billing date
    - platform/payment rail badge
    - context-aware actions (Pause/Revoke, Secure cancellation link, Manage via bank, Remove).
  - Highlights upcoming charges in the next 7 days and totals the amount due this week.

- **Add Subscription (Simulated AA/BBPS onboarding)**
  - Form to add new recurring payments using a gateway + catalog approach with auto-filled amount, cycle and billing date.
  - New subscriptions are normalised onto the same unified bill model and classified as lifestyle by default.

- **QR Payment Launcher (UI Simulation)**
  - "Scan QR" button reveals a payment method dropdown:
    - Google Pay
    - PhonePe
    - Paytm
    - Bank UPI
    - Credit Card

## Project Structure

```text
subscription-intelligence/
├── data/
│   └── subscriptions.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── package.json
├── server.js
└── README.md
```

## Run Locally

**Requirements:** Node.js 18 or later.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open:
   ```text
   http://localhost:3000
   ```

**VS Code / Cursor:**
- **Tasks:** Run `Tasks: Run Task` → choose **Preview: Server + Browser** to start the server and open the app in your browser.
- **Debug:** Use the **Launch Server + Open Browser** configuration to start the server and auto-open the preview.

> The app listens on `process.env.PORT` (with local fallback to `3000`).

## Deploy on Railway

1. Push this project to a GitHub repository.
2. Go to [Railway](https://railway.app/) and create a new project.
3. Choose **Deploy from GitHub repo** and select your repository.
4. Railway auto-detects Node.js using `package.json`.
5. Ensure the start command is:
   ```bash
   npm start
   ```
6. Deploy. Railway will automatically set `PORT`, and the app already uses it.

## Notes

- Data is stored in memory only.
- Restarting the server resets all added subscriptions to mock defaults.
