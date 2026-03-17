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

// Mock telco bundles for Savings Wedge logic.
const TELCO_BUNDLES = [
  {
    provider: "JioFiber",
    planName: "JioFiber Postpaid",
    includedServices: ["Netflix", "Amazon Prime", "Disney+ Hotstar"]
  },
  {
    provider: "Airtel Thanks",
    planName: "Airtel Thanks Platinum",
    includedServices: ["Amazon Prime", "Disney+ Hotstar"]
  }
];

// In-memory collection of \"fetched\" bills for the Fetch my Bills flow.
let fetchedBills = [];

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
    const isTrackedFixed =
      subscription.category === "fixed" ? subscription.isTracked !== false : true;
    return !subscription.isPaused && isTrackedFixed && billingDate >= today && billingDate <= limit;
  });
}

function buildInsights() {
  const active = subscriptions.filter((s) => {
    if (s.category === "fixed") {
      return !s.isPaused && s.isTracked !== false;
    }
    return !s.isPaused;
  });
  const activeMonthlySpend = active.reduce((sum, subscription) => {
    return sum + Number(subscription.amount || 0);
  }, 0);
  const renewalsThisWeek = getUpcomingSubscriptions(7).length;

  const duplicateSubs = active.filter((s) => s.isDuplicate);
  const potentialSavings = duplicateSubs.reduce(
    (sum, s) => sum + Number(s.amount || 0),
    0
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const HIGH_RISK_WINDOW_DAYS = 5;

  const guardianUniverse = active.filter(
    (s) => s.category === "fixed" && s.isTracked !== false && (s.type === "EMI" || s.type === "Insurance")
  );
  const highImpactDueSoon = guardianUniverse.filter((s) => {
    const due = parseDateOnly(s.nextBillingDate);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= HIGH_RISK_WINDOW_DAYS && s.cibilImpact === "high";
  });

  const penaltyPerHighRisk = 20;
  const baseScore = 100;
  const rawScore = baseScore - highImpactDueSoon.length * penaltyPerHighRisk;
  const creditSafetyScore = Math.max(40, Math.min(100, rawScore));

  let creditLabel = "Healthy";
  if (creditSafetyScore < 70) {
    creditLabel = "At risk";
  } else if (creditSafetyScore < 85) {
    creditLabel = "Watchlist";
  }

  return {
    totalMonthlySpend: activeMonthlySpend,
    renewalsThisWeek,
    potentialSavings,
    creditSafetyScore,
    creditLabel,
    highImpactDueSoonCount: highImpactDueSoon.length,
    messages: [
      `You are paying \u20b9${activeMonthlySpend}/month in subscriptions.`,
      `${renewalsThisWeek} subscriptions renew this week.`,
      highImpactDueSoon.length > 0
        ? `${highImpactDueSoon.length} high impact EMI/insurance payments are due soon.`
        : "No high impact EMI/insurance payments in the next few days."
    ]
  };
}

function deriveSourceSystem(subscription) {
  const billingSource = String(subscription.billingSource || "").toUpperCase();
  const rail = String(subscription.paymentRail || "").toUpperCase();

  if (billingSource === "BBPS") return "BBPS";
  if (billingSource === "BANK_EMI" || billingSource === "CARD_MANDATE") return "CARD_SI";
  if (rail === "UPI_AUTOPAY") return "UPI_AUTO";
  return "AA";
}

function deriveControlType(subscription) {
  const rail = String(subscription.paymentRail || "").toUpperCase();
  const billingSource = String(subscription.billingSource || "").toUpperCase();
  const mcc = String(subscription.mcc || "");
  const isIrrevocable = Boolean(subscription.isIrrevocable) || mcc === "7322";

  if (isIrrevocable) {
    return "BANK_ONLY";
  }

  if (rail === "UPI_AUTOPAY") {
    return "USER_REVOCABLE";
  }

  if (billingSource === "BANK_EMI" || billingSource === "CARD_MANDATE") {
    return "REDIRECT_LINK";
  }

  return "USER_REVOCABLE";
}

function findSubscriptionForBill(bill) {
  // Prefer direct id match when bill originates from subscriptions
  const byId = subscriptions.find((subscription) => String(subscription.id) === String(bill.id));
  if (byId) {
    return byId;
  }

  // Fallback: match by service name + amount + billing date
  return subscriptions.find((subscription) => {
    return (
      String(subscription.serviceName).trim().toLowerCase() ===
        String(bill.serviceName).trim().toLowerCase() &&
      Number(subscription.amount || 0) === Number(bill.amount || 0) &&
      String(subscription.nextBillingDate) === String(bill.nextBillingDate)
    );
  });
}

function createSubscriptionFromBill(bill) {
  const base = {
    id: String(bill.id || `${Date.now()}-${Math.floor(Math.random() * 10000)}`),
    serviceName: String(bill.serviceName || "").trim(),
    amount: Number(bill.amount || 0),
    billingCycle: String(bill.billingCycle || "Monthly").trim() || "Monthly",
    nextBillingDate: bill.nextBillingDate || addDaysFromToday(5),
    platform: normalizePlatform(bill.platform || "Auto-debit", bill.serviceName),
    isPaused: false,
    category: bill.category || "fixed",
    type: bill.type || "EMI",
    paymentRail: bill.paymentRail || "CARD",
    isIrrevocable: Boolean(bill.isIrrevocable),
    isDuplicate: Boolean(bill.isDuplicate),
    cibilImpact: bill.cibilImpact || "high",
    mcc: bill.mcc || null,
    cancellationUrl: bill.cancellationUrl || null,
    billingSource: bill.billingSource || "BBPS",
    isTracked: true
  };

  return {
    ...base,
    sourceSystem: deriveSourceSystem(base),
    controlType: deriveControlType(base)
  };
}

subscriptions.forEach((subscription) => {
  subscription.platform = normalizePlatform(subscription.platform, subscription.serviceName);
  subscription.isPaused = Boolean(subscription.isPaused);
  subscription.sourceSystem = subscription.sourceSystem || deriveSourceSystem(subscription);
  subscription.controlType = subscription.controlType || deriveControlType(subscription);
  if (subscription.category === "fixed") {
    if (typeof subscription.isTracked === "undefined") {
      subscription.isTracked = false;
    }
  } else if (typeof subscription.isTracked === "undefined") {
    subscription.isTracked = true;
  }
});

app.get("/api/subscriptions", (_req, res) => {
  res.json(subscriptions);
});

app.post("/api/subscriptions", (req, res) => {
  const {
    serviceName,
    amount,
    billingCycle,
    nextBillingDate,
    platform,
    category,
    type
  } = req.body;

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

  const normalizedPlatform = normalizePlatform(platform, serviceName);

  const isTelcoDuplicate = TELCO_BUNDLES.some((bundle) =>
    bundle.includedServices.some(
      (svc) => svc.toLowerCase() === String(serviceName).trim().toLowerCase()
    )
  );

  const base = {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    serviceName: String(serviceName).trim(),
    amount: parsedAmount,
    billingCycle: String(billingCycle || "Monthly").trim() || "Monthly",
    nextBillingDate,
    platform: normalizedPlatform,
    isPaused: false,
    category: category || "lifestyle",
    type: type || "Subscription",
    paymentRail:
      normalizedPlatform && normalizedPlatform.toLowerCase().includes("upi")
        ? "UPI_AUTOPAY"
        : "CARD",
    isIrrevocable: false,
    isDuplicate: isTelcoDuplicate,
    cibilImpact: "low",
    mcc: null,
    cancellationUrl: null,
    billingSource:
      normalizedPlatform && normalizedPlatform.toLowerCase().includes("upi")
        ? "UPI_AUTOPAY"
        : "CARD_MANDATE"
  };

  const newSubscription = {
    ...base,
    sourceSystem: deriveSourceSystem(base),
    controlType: deriveControlType(base)
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
  ).map((candidate) => {
    const normalizedPlatform = normalizePlatform(candidate.platform, candidate.serviceName);
    const isTelcoDuplicate = TELCO_BUNDLES.some((bundle) =>
      bundle.includedServices.some(
        (svc) => svc.toLowerCase() === candidate.serviceName.toLowerCase()
      )
    );

    const base = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      serviceName: candidate.serviceName,
      amount: candidate.amount,
      billingCycle: "Monthly",
      nextBillingDate: addDaysFromToday(candidate.nextBillingInDays),
      platform: normalizedPlatform,
      isPaused: false,
      category: "lifestyle",
      type: "Subscription",
      paymentRail:
        normalizedPlatform && normalizedPlatform.toLowerCase().includes("upi")
          ? "UPI_AUTOPAY"
          : "CARD",
      isIrrevocable: false,
      isDuplicate: isTelcoDuplicate,
      cibilImpact: "low",
      mcc: null,
      cancellationUrl: null,
      billingSource:
        normalizedPlatform && normalizedPlatform.toLowerCase().includes("upi")
          ? "UPI_AUTOPAY"
          : "CARD_MANDATE"
    };

    return {
      ...base,
      sourceSystem: deriveSourceSystem(base),
      controlType: deriveControlType(base)
    };
  });

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

app.patch("/api/subscriptions/:id/unpause", (req, res) => {
  const { id } = req.params;
  const subscription = subscriptions.find((item) => item.id === id);

  if (!subscription) {
    return res.status(404).json({ error: "Subscription not found." });
  }

  if (!supportsPauseByPlatform(subscription.platform)) {
    return res.status(400).json({
      error: "Unpause is available only for UPI or autopay subscriptions."
    });
  }

  subscription.isPaused = false;
  return res.json(subscription);
});

// Simulated NPCI UPI AutoPay revoke flow.
app.patch("/api/subscriptions/:id/revoke-upi", (req, res) => {
  const { id } = req.params;
  const subscription = subscriptions.find((item) => item.id === id);

  if (!subscription) {
    return res.status(404).json({ error: "Subscription not found." });
  }

  const rail = String(subscription.paymentRail || "").toUpperCase();
  if (rail !== "UPI_AUTOPAY") {
    return res.status(400).json({
      error: "Revoke is available only for UPI AutoPay mandates."
    });
  }

  subscription.isPaused = true;
  subscription.revokedViaUpi = true;

  return res.json({
    ...subscription,
    message: "NPCI UPI AutoPay mandate revoke simulated."
  });
});

// Simulated BBPS / Account Aggregator fetch-my-bills flow.
app.post("/api/fetch-bills", (req, res) => {
  const body = req.body || {};
  const includeLoans = body.includeLoans !== false;
  const includeUtilities = body.includeUtilities !== false;

  const candidates = subscriptions.filter((subscription) => {
    if (subscription.category !== "fixed") return false;
    const type = String(subscription.type || "");
    if (type === "EMI" || type === "Card") {
      return includeLoans;
    }
    if (type === "Insurance" || type === "Utility") {
      return includeUtilities;
    }
    return false;
  });

  fetchedBills = candidates.map((subscription) => ({
    id: subscription.id,
    serviceName: subscription.serviceName,
    amount: subscription.amount,
    billingCycle: subscription.billingCycle,
    nextBillingDate: subscription.nextBillingDate,
    category: subscription.category,
    type: subscription.type,
    cibilImpact: subscription.cibilImpact,
    paymentRail: subscription.paymentRail,
    billingSource: subscription.billingSource,
    sourceSystem: subscription.sourceSystem,
    controlType: subscription.controlType
  }));

  return res.json({
    bills: fetchedBills,
    addedCount: fetchedBills.length,
    source: "BBPS_AA_SIMULATED"
  });
});

// Returns the most recent set of fetched bills for review.
app.get("/api/fetched-bills", (_req, res) => {
  res.json(fetchedBills);
});

// Optional: GET /api/fetch-bills returns the latest fetch summary for manual tests.
app.get("/api/fetch-bills", (_req, res) => {
  res.json({
    bills: fetchedBills,
    addedCount: fetchedBills.length,
    source: "BBPS_AA_SIMULATED"
  });
});

// Track selected fetched bills and return a summary.
app.post("/api/fetched-bills/track", (req, res) => {
  const { billIds } = req.body || {};
  if (!Array.isArray(billIds)) {
    return res.status(400).json({ error: "billIds must be an array." });
  }

  const idSet = new Set(billIds.map((id) => String(id)));
  const selected = fetchedBills.filter((bill) => idSet.has(String(bill.id)));

  const trackedCount = selected.length;
  let createdCount = 0;
  const highImpactCount = selected.filter((bill) => bill.cibilImpact === "high").length;

  selected.forEach((bill) => {
    const existing = findSubscriptionForBill(bill);
    if (existing) {
      if (existing.category === "fixed") {
        existing.isTracked = true;
      }
    } else {
      const newSubscription = createSubscriptionFromBill(bill);
      subscriptions.push(newSubscription);
      createdCount += 1;
    }
  });

  const message =
    trackedCount > 0
      ? createdCount > 0
        ? `Added ${createdCount} new bill${createdCount !== 1 ? "s" : ""} (${trackedCount} tracked) to Guardian. Keep enough balance to protect your CIBIL.`
        : `All selected bills were already in Guardian. We’ll keep monitoring them for CIBIL protection.`
      : "No bills were selected to track.";

  return res.json({
    trackedCount,
    createdCount,
    highImpactCount,
    message
  });
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
