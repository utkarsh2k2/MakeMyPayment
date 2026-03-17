const express = require("express");
const path = require("path");
const { subscriptions } = require("./data/subscriptions");

const app = express();
const PORT = process.env.PORT || 3000;
const PLATFORM_LABELS = [
  "PhonePe",
  "Google Play",
  "Apple App Store",
  "Google Pay",
  "Paytm",
  "BHIM",
  "Amazon Pay UPI",
  "CRED",
  "Amazon Pay",
  "Paytm Wallet",
  "MobiKwik",
  "Freecharge",
  "Airtel Money",
  "Amazon Pay Later",
  "Simpl",
  "LazyPay",
  "MobiKwik Zip",
  "Flipkart Pay Later",
  "PostPe",
  "Credit Card",
  "Debit Card",
  "OneCard",
  "Slice"
];
const AUTO_DETECT_CATALOG = [
  {
    serviceName: "YouTube Premium",
    amount: 129,
    nextBillingInDays: 3,
    platform: "Google Play"
  },
  {
    serviceName: "iCloud+",
    amount: 75,
    nextBillingInDays: 5,
    platform: "Apple App Store"
  },
  {
    serviceName: "Amazon Prime",
    amount: 299,
    nextBillingInDays: 8,
    platform: "Amazon Pay"
  }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function addDaysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function detectPlatformFromService(serviceName) {
  const value = String(serviceName || "").toLowerCase();
  if (value.includes("youtube") || value.includes("netflix") || value.includes("disney")) {
    return "Google Play";
  }
  if (value.includes("spotify") || value.includes("apple")) {
    return "Apple App Store";
  }
  if (value.includes("jio")) {
    return "PhonePe";
  }
  if (value.includes("airtel")) {
    return "Google Pay";
  }
  if (value.includes("gym")) {
    return "BHIM";
  }
  if (value.includes("swiggy")) {
    return "CRED";
  }
  if (value.includes("zomato")) {
    return "Paytm";
  }
  if (value.includes("prime")) {
    return "Amazon Pay";
  }
  if (value.includes("notion")) {
    return "OneCard";
  }
  if (value.includes("chatgpt")) {
    return "Credit Card";
  }
  if (value.includes("phonepe")) {
    return "PhonePe";
  }
  return "Credit Card";
}

function normalizePlatform(platform, serviceName) {
  const clean = String(platform || "").trim();
  if (!clean) {
    return detectPlatformFromService(serviceName);
  }
  return PLATFORM_LABELS.includes(clean) ? clean : detectPlatformFromService(serviceName);
}

function supportsPauseByPlatform(platform) {
  const method = String(platform || "").toLowerCase();
  return (
    method.includes("upi") ||
    method.includes("autopay") ||
    method.includes("phonepe") ||
    method.includes("google pay") ||
    method.includes("paytm") ||
    method.includes("bhim") ||
    method.includes("cred")
  );
}

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
    return !subscription.isPaused && billingDate >= today && billingDate <= limit;
  });
}

function buildInsights() {
  const totalMonthlySpend = subscriptions.reduce(
    (sum, subscription) => sum + Number(subscription.amount || 0),
    0
  );
  const activeMonthlySpend = subscriptions.reduce((sum, subscription) => {
    if (subscription.isPaused) {
      return sum;
    }
    return sum + Number(subscription.amount || 0);
  }, 0);
  const renewalsThisWeek = getUpcomingSubscriptions(7).length;
  const previousMonthSpend = 3700;
  const spendingIncreased = activeMonthlySpend > previousMonthSpend;

  return {
    totalMonthlySpend: activeMonthlySpend,
    renewalsThisWeek,
    spendingIncreased,
    messages: [
      `You are paying \u20b9${activeMonthlySpend}/month in subscriptions.`,
      `${renewalsThisWeek} subscriptions renew this week.`,
      spendingIncreased
        ? "Your subscription spending increased."
        : "Your subscription spending decreased."
    ]
  };
}

subscriptions.forEach((subscription) => {
  subscription.platform = normalizePlatform(subscription.platform, subscription.serviceName);
  subscription.isPaused = Boolean(subscription.isPaused);
});

app.get("/api/subscriptions", (_req, res) => {
  res.json(subscriptions);
});

app.post("/api/subscriptions", (req, res) => {
  const { serviceName, amount, billingCycle, nextBillingDate, platform } = req.body;

  if (!serviceName || !amount || !nextBillingDate) {
    return res.status(400).json({ error: "Service, amount and billing date are required." });
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
    billingCycle: String(billingCycle || "Monthly").trim() || "Monthly",
    nextBillingDate,
    platform: normalizePlatform(platform, serviceName),
    isPaused: false
  };

  subscriptions.push(newSubscription);
  return res.status(201).json(newSubscription);
});

app.post("/api/subscriptions/auto-detect", (_req, res) => {
  const existingNames = new Set(
    subscriptions.map((subscription) => subscription.serviceName.trim().toLowerCase())
  );

  const detected = AUTO_DETECT_CATALOG.filter(
    (candidate) => !existingNames.has(candidate.serviceName.toLowerCase())
  ).map((candidate) => ({
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    serviceName: candidate.serviceName,
    amount: candidate.amount,
    billingCycle: "Monthly",
    nextBillingDate: addDaysFromToday(candidate.nextBillingInDays),
    platform: candidate.platform,
    isPaused: false
  }));

  subscriptions.push(...detected);
  return res.status(201).json({
    detected,
    addedCount: detected.length
  });
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

app.patch("/api/subscriptions/:id/pause", (req, res) => {
  const { id } = req.params;
  const subscription = subscriptions.find((item) => item.id === id);

  if (!subscription) {
    return res.status(404).json({ error: "Subscription not found." });
  }

  if (!supportsPauseByPlatform(subscription.platform)) {
    return res.status(400).json({
      error: "Pause is available only for UPI or autopay subscriptions."
    });
  }

  subscription.isPaused = true;
  return res.json(subscription);
});

app.get("/api/upcoming-charges", (_req, res) => {
  res.json(getUpcomingSubscriptions(7));
});

app.get("/api/insights", (_req, res) => {
  res.json(buildInsights());
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  // Railway provides PORT at runtime, fallback is for local dev.
  console.log(`Subscription Intelligence server running on port ${PORT}`);
});
