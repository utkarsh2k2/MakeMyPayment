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

- **Subscription Dashboard**
  - Displays cards for:
    - service name
    - amount
    - billing cycle
    - next billing date
    - remove button
  - Preloaded mock subscriptions:
    - Netflix
    - Spotify
    - Gym Membership
    - Cursor AI
- **Subscription Insights**
  - Example insights:
    - "You are paying ₹4200/month in subscriptions."
    - "3 subscriptions renew this week."
    - "Your subscription spending increased."
- **Upcoming Charges**
  - Lists subscriptions renewing in the next 7 days.
- **Add Subscription**
  - Form to add subscriptions dynamically.
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
