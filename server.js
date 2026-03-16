const express = require("express");
const path = require("path");
const { subscriptions } = require("./data/subscriptions");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function parseDateOnly(dateValue) {
  const parsed = new Date(dateValue);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function getUpcomingSubscriptions(days = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);

  return subscriptions.filter((subscription) => {
    const billingDate = parseDateOnly(subscription.nextBillingDate);
    return billingDate >= today && billingDate <= limit;
  });
}

function buildInsights() {
  const totalMonthlySpend = subscriptions.reduce(
    (sum, subscription) => sum + Number(subscription.amount || 0),
    0
  );
  const renewalsThisWeek = getUpcomingSubscriptions(7).length;
  const previousMonthSpend = 3700;
  const spendingIncreased = totalMonthlySpend > previousMonthSpend;

  return {
    totalMonthlySpend,
    renewalsThisWeek,
    spendingIncreased,
    messages: [
      `You are paying \u20b9${totalMonthlySpend}/month in subscriptions.`,
      `${renewalsThisWeek} subscriptions renew this week.`,
      spendingIncreased
        ? "Your subscription spending increased."
        : "Your subscription spending decreased."
    ]
  };
}

app.get("/api/subscriptions", (_req, res) => {
  res.json(subscriptions);
});

app.post("/api/subscriptions", (req, res) => {
  const { serviceName, amount, billingCycle, nextBillingDate } = req.body;

  if (!serviceName || !amount || !billingCycle || !nextBillingDate) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number." });
  }

  const parsedDate = new Date(nextBillingDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: "Invalid next billing date." });
  }

  const newSubscription = {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    serviceName: String(serviceName).trim(),
    amount: parsedAmount,
    billingCycle: String(billingCycle).trim(),
    nextBillingDate
  };

  subscriptions.push(newSubscription);
  return res.status(201).json(newSubscription);
});

app.delete("/api/subscriptions/:id", (req, res) => {
  const { id } = req.params;
  const index = subscriptions.findIndex((subscription) => subscription.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Subscription not found." });
  }

  subscriptions.splice(index, 1);
  return res.status(204).send();
});

app.get("/api/upcoming-charges", (_req, res) => {
  res.json(getUpcomingSubscriptions(7));
});

app.get("/api/insights", (_req, res) => {
  res.json(buildInsights());
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  // Railway provides PORT at runtime, fallback is for local dev.
  console.log(`Subscription Intelligence server running on port ${PORT}`);
});
