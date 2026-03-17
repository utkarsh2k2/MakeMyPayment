const appLoaderEl = document.getElementById("app-loader");
const appShellEl = document.getElementById("app-shell");
const statusMessageEl = document.getElementById("status-message");
const navButtons = Array.from(document.querySelectorAll(".bottom-tab-btn"));
const appScreens = Array.from(document.querySelectorAll(".app-screen"));
const openAddModalBtnEl = document.getElementById("open-add-modal-btn");
const closeAddModalBtnEl = document.getElementById("close-add-modal-btn");
const addModalEl = document.getElementById("add-modal");
const viewSubscriptionsBtnEl = document.getElementById("view-subscriptions-btn");
const deductionsAmountEl = document.getElementById("deductions-amount");
const homeActiveSubtextEl = document.getElementById("home-active-subtext");
const spendingAmountEl = document.getElementById("spending-amount");
const savingsDescriptionEl = document.getElementById("savings-description");
const subscriptionFormEl = document.getElementById("subscription-form");
const addPlatformSelectEl = document.getElementById("add-platform-select");
const addSubscriptionSelectEl = document.getElementById("add-subscription-select");
const subscriptionListsContainerEl = document.getElementById("subscription-lists-container");
const subscriptionListMonthlyEl = document.getElementById("subscription-list-monthly");
const subscriptionListYearlyEl = document.getElementById("subscription-list-yearly");
const subscriptionCountEl = document.getElementById("subscription-count");
const insightCardsEl = document.getElementById("insights");
const upcomingListEl = document.getElementById("upcoming-list");
const upcomingSummaryEl = document.getElementById("upcoming-summary");
const scanQrBtnEl = document.getElementById("scan-qr-btn");
const paymentMethodWrapEl = document.getElementById("payment-method-wrap");
const paymentMethodEl = document.getElementById("payment-method");
const paymentMessageEl = document.getElementById("payment-message");

// New Financial Guardian metric + category elements
const savingsWedgeAmountEl = document.getElementById("savings-wedge-amount");
const savingsWedgeSubtextEl = document.getElementById("savings-wedge-subtext");
const creditScoreValueEl = document.getElementById("credit-score-value");
const creditScoreLabelEl = document.getElementById("credit-score-label");
const creditScoreSubtextEl = document.getElementById("credit-score-subtext");
const fixedPanelEl = document.getElementById("subscription-list-fixed");
const lifestylePanelEl = document.getElementById("subscription-list-lifestyle");
const fixedTabBtnEl = document.getElementById("tab-fixed-obligations");
const lifestyleTabBtnEl = document.getElementById("tab-lifestyle-subs");
const fetchBillsBtnEl = document.getElementById("fetch-bills-btn");
const filterIncludeLoansEl = document.getElementById("filter-include-loans");
const filterIncludeUtilitiesEl = document.getElementById("filter-include-utilities");
const fetchBillsReviewEl = document.getElementById("fetch-bills-review");

const platformSubscriptions = {
  "Google Play": ["YouTube Premium", "Google One"],
  "Apple App Store": ["Spotify", "Apple Music", "iCloud+"],
  PhonePe: ["Jio Recharge", "Airtel Recharge", "Gold's Gym"],
  "Google Pay": ["Jio Recharge", "Airtel Broadband"],
  Paytm: ["Zomato Gold", "Disney+ Hotstar"],
  "Amazon Pay": ["Amazon Prime", "Swiggy One"],
  "Credit Card": ["ChatGPT Plus", "Notion AI", "Cursor AI"],
  CRED: ["Swiggy One"],
  BHIM: ["Gold's Gym"]
};

const suggestedSubscriptionsByCategory = {
  Wallets: ["Swiggy One", "Zomato Gold"],
  "Pay Later": ["Blinkit Plus", "Zomato Gold"],
  Cards: ["ChatGPT Plus", "Notion AI", "Cursor AI"]
};

const platformCategory = {
  "Paytm Wallet": "Wallets",
  MobiKwik: "Wallets",
  Freecharge: "Wallets",
  "Airtel Money": "Wallets",
  "Amazon Pay Later": "Pay Later",
  Simpl: "Pay Later",
  LazyPay: "Pay Later",
  "MobiKwik Zip": "Pay Later",
  "Flipkart Pay Later": "Pay Later",
  PostPe: "Pay Later",
  "Debit Card": "Cards",
  OneCard: "Cards",
  Slice: "Cards",
  "Amazon Pay UPI": "Wallets"
};

const SUBSCRIPTION_DETAILS = {
  "YouTube Premium": { amount: 139, billingInDays: 10, billingCycle: "Monthly" },
  "Google One": { amount: 130, billingInDays: 14, billingCycle: "Monthly" },
  Spotify: { amount: 119, billingInDays: 6, billingCycle: "Monthly" },
  "Apple Music": { amount: 99, billingInDays: 16, billingCycle: "Monthly" },
  "iCloud+": { amount: 2490, billingInDays: 365, billingCycle: "Yearly" },
  "Jio Recharge": { amount: 399, billingInDays: 8, billingCycle: "Monthly" },
  "Airtel Recharge": { amount: 349, billingInDays: 12, billingCycle: "Monthly" },
  "Airtel Broadband": { amount: 999, billingInDays: 13, billingCycle: "Monthly" },
  "Gold's Gym": { amount: 1800, billingInDays: 13, billingCycle: "Monthly" },
  "Amazon Prime": { amount: 299, billingInDays: 7, billingCycle: "Monthly" },
  "Swiggy One": { amount: 149, billingInDays: 11, billingCycle: "Monthly" },
  "Zomato Gold": { amount: 149, billingInDays: 9, billingCycle: "Monthly" },
  "Disney+ Hotstar": { amount: 299, billingInDays: 9, billingCycle: "Monthly" },
  "ChatGPT Plus": { amount: 1660, billingInDays: 24, billingCycle: "Monthly" },
  "Notion AI": { amount: 830, billingInDays: 26, billingCycle: "Monthly" },
  "Cursor AI": { amount: 1632, billingInDays: 20, billingCycle: "Monthly" },
  "Blinkit Plus": { amount: 199, billingInDays: 15, billingCycle: "Monthly" }
};

let latestSubscriptions = [];
let latestFetchedBills = [];

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function requestJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = "Something went wrong.";
    try {
      const body = await response.json();
      message = body.error || message;
    } catch (_err) {
      // No JSON body available.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatMoney(amount) {
  return `\u20b9${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

function addDaysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().split("T")[0];
}

function getSubscriptionsForPlatform(platform) {
  const direct = platformSubscriptions[platform];
  if (direct && direct.length > 0) {
    return { subscriptions: direct, isSuggested: false };
  }
  const category = platformCategory[platform];
  const suggested = category
    ? suggestedSubscriptionsByCategory[category] || []
    : suggestedSubscriptionsByCategory.Cards;
  return { subscriptions: suggested, isSuggested: true };
}

function formatBillingAmount(amount, billingCycle) {
  const cycle = String(billingCycle || "").toLowerCase();
  const suffix =
    cycle.includes("month") || cycle === ""
      ? "/month"
      : cycle.includes("year")
      ? "/year"
      : "";
  return `${formatMoney(amount)}${suffix}`;
}

function getMonthlyAmount(amount, billingCycle) {
  const cycle = String(billingCycle || "").toLowerCase();
  const amt = Number(amount || 0);
  return cycle.includes("year") ? amt / 12 : amt;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showStatus(message, tone = "success") {
  statusMessageEl.textContent = message;
  statusMessageEl.style.color = tone === "error" ? "#ff9eb0" : "#6de0b8";
}

function supportsPause(platform) {
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

function formatPlatformBadge(platform) {
  const value = String(platform || "").trim();
  if (!value) {
    return "Credit Card";
  }
  if (value === "UPI") {
    return "PhonePe";
  }
  if (value === "Card") {
    return "Credit Card";
  }
  if (value === "App Store") {
    return "Google Play";
  }
  return value;
}

function renderInsights(monthlySpend, renewalsThisWeek, pausedCount) {
  const insightLines = [
    `${formatMoney(monthlySpend)} spent monthly on subscriptions`,
    `${renewalsThisWeek} subscription${renewalsThisWeek !== 1 ? "s" : ""} renewing this week`
  ];
  if (pausedCount > 0) {
    insightLines.push(`${pausedCount} subscription${pausedCount !== 1 ? "s" : ""} paused`);
  }

  insightCardsEl.innerHTML = insightLines
    .map((line) => `<p class="insight-pill">${escapeHtml(line)}</p>`)
    .join("");
}

function renderSubscriptionCard(subscription) {
  const canPause = supportsPause(subscription.platform);
  const platformLabel = formatPlatformBadge(subscription.platform);
  const isIrrevocable = Boolean(subscription.isIrrevocable) || String(subscription.mcc || "") === "7322";
  const isUpiAutoPay = String(subscription.paymentRail || "").toUpperCase() === "UPI_AUTOPAY";
  const isCardMandate = String(subscription.paymentRail || "").toUpperCase() === "CARD";
  const hasCancellationUrl = Boolean(subscription.cancellationUrl);

  let primaryActionsHtml = "";

  if (isIrrevocable) {
    primaryActionsHtml = `
      <button class="ghost-btn manage-bank-btn" data-url="${escapeHtml(
        subscription.cancellationUrl || "https://www.rbi.org.in/"
      )}" type="button">
        Manage via bank
      </button>
    `;
  } else if (isUpiAutoPay) {
    primaryActionsHtml = `
      <button class="pause-btn revoke-upi-btn" data-id="${subscription.id}" type="button">
        Revoke UPI mandate
      </button>
    `;
  } else if (isCardMandate && hasCancellationUrl) {
    primaryActionsHtml = `
      <a class="ghost-btn secure-cancel-link" href="${escapeHtml(
        subscription.cancellationUrl
      )}" target="_blank" rel="noopener noreferrer">
        Secure cancellation link
      </a>
    `;
  } else if (canPause && !subscription.isPaused) {
    primaryActionsHtml = `<button class="pause-btn" data-id="${subscription.id}" type="button">Pause Auto-debit</button>`;
  } else if (canPause && subscription.isPaused) {
    primaryActionsHtml = `<button class="unpause-btn" data-id="${subscription.id}" type="button">Unpause</button>`;
  }

  const duplicateBadge = subscription.isDuplicate
    ? `<span class="paused-chip">Included in ${escapeHtml(
        subscription.telcoBundleProvider || "telco bundle"
      )}</span>`
    : "";

  const switchToBundleButton = subscription.isDuplicate
    ? `<button class="ghost-btn switch-bundle-btn" data-id="${subscription.id}" type="button">
        Switch to bundle
      </button>`
    : "";

  return `
    <article class="subscription-card">
      <div class="card-top">
        <h3>${escapeHtml(subscription.serviceName)}</h3>
        <p class="card-amount">${formatBillingAmount(
          subscription.amount,
          subscription.billingCycle
        )}</p>
      </div>
      <div class="card-bottom">
        <p class="next-billing">Next billing: ${formatDate(subscription.nextBillingDate)}</p>
        <span class="platform-pill">${escapeHtml(platformLabel)}</span>
      </div>
      ${subscription.isPaused ? '<span class="paused-chip">Paused</span>' : ""}
      ${duplicateBadge}
      <footer class="card-actions">
        ${primaryActionsHtml}
        ${
          !isIrrevocable
            ? `<button class="remove-btn" data-id="${subscription.id}" type="button">Remove</button>`
            : ""
        }
        ${switchToBundleButton}
      </footer>
    </article>
  `;
}

function renderSubscriptions(subscriptions) {
  const activeCount = subscriptions.filter((subscription) => {
    if (subscription.category === "fixed") {
      return !subscription.isPaused && subscription.isTracked !== false;
    }
    return !subscription.isPaused;
  }).length;
  subscriptionCountEl.textContent = `${activeCount} active`;

  const sorted = [...subscriptions].sort(
    (a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate)
  );

  const fixed = sorted.filter((s) => s.category === "fixed" && s.isTracked !== false);
  const lifestyle = sorted.filter((s) => s.category !== "fixed");

  fixedPanelEl.innerHTML = fixed.length
    ? fixed.map(renderSubscriptionCard).join("")
    : '<p class="empty-state">No fixed obligations in Guardian yet. Use “Fetch my bills” to pull EMIs and insurance from your billers.</p>';
  lifestylePanelEl.innerHTML = lifestyle.length
    ? lifestyle.map(renderSubscriptionCard).join("")
    : '<p class="empty-state">No lifestyle subscriptions yet.</p>';
}

function renderUpcomingCharges(charges) {
  const weekTotal = charges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  upcomingSummaryEl.textContent = charges.length
    ? `${formatMoney(weekTotal)} due this week (${charges.length} charge${charges.length !== 1 ? "s" : ""})`
    : "No charges this week";

  if (!charges.length) {
    upcomingListEl.innerHTML = "<p class='empty-state'>No charges in the next 7 days.</p>";
    return;
  }

  const byDate = [...charges].sort(
    (a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate)
  );

  upcomingListEl.innerHTML = byDate
    .map(
      (charge) => `
        <article class="upcoming-item">
          <div class="upcoming-top">
            <strong>${escapeHtml(charge.serviceName)}</strong>
            <span>${formatBillingAmount(charge.amount, charge.billingCycle)}</span>
          </div>
          <p class="upcoming-date">Bills on ${formatDate(charge.nextBillingDate)}</p>
        </article>
      `
    )
    .join("");
}

async function renderSubscriptionOptions() {
  const selectedPlatform = addPlatformSelectEl.value;
  addSubscriptionSelectEl.innerHTML = "";
  addSubscriptionSelectEl.disabled = true;

  if (!selectedPlatform) {
    addSubscriptionSelectEl.innerHTML = "<option value=''>Select platform first</option>";
    return;
  }

  addSubscriptionSelectEl.innerHTML = "<option value=''>Fetching subscriptions...</option>";
  await wait(500);

  const existingNames = new Set(
    latestSubscriptions.map((s) => String(s.serviceName).trim().toLowerCase())
  );

  addSubscriptionSelectEl.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select subscription";
  addSubscriptionSelectEl.append(defaultOption);

  const { subscriptions: subscriptionNames, isSuggested } = getSubscriptionsForPlatform(selectedPlatform);

  if (isSuggested) {
    const noDetectedOption = document.createElement("option");
    noDetectedOption.value = "";
    noDetectedOption.textContent = "No subscriptions detected";
    noDetectedOption.disabled = true;
    addSubscriptionSelectEl.append(noDetectedOption);
  }

  const enabled = [];
  const disabled = [];

  subscriptionNames.forEach((name) => {
    const details = SUBSCRIPTION_DETAILS[name];
    if (!details) return;
    const alreadyAdded = existingNames.has(name.trim().toLowerCase());
    const optionData = { name, details, alreadyAdded };
    if (alreadyAdded) {
      disabled.push(optionData);
    } else {
      enabled.push(optionData);
    }
  });

  [...enabled, ...disabled].forEach(({ name, details, alreadyAdded }) => {
    const option = document.createElement("option");
    option.value = name;
    const suffix = details.billingCycle === "Yearly" ? "/year" : "/month";
    option.textContent = alreadyAdded
      ? `${name} • ${formatMoney(details.amount)}${suffix} (Already added)`
      : `${name} • ${formatMoney(details.amount)}${suffix}`;
    if (alreadyAdded) {
      option.disabled = true;
    }
    addSubscriptionSelectEl.append(option);
  });

  addSubscriptionSelectEl.disabled = false;
}

function activateScreen(screenId) {
  navButtons.forEach((button) => {
    const isActive = button.dataset.screen === screenId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  appScreens.forEach((screen) => {
    const isActive = screen.id === screenId;
    screen.classList.toggle("is-active", isActive);
    screen.hidden = !isActive;
  });
}

function openAddModal() {
  addModalEl.hidden = false;
  requestAnimationFrame(() => {
    addModalEl.classList.add("is-open");
  });
  document.body.classList.add("modal-open");
  addPlatformSelectEl.value = "";
  renderSubscriptionOptions();
}

function closeAddModal() {
  addModalEl.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  window.setTimeout(() => {
    if (!addModalEl.classList.contains("is-open")) {
      addModalEl.hidden = true;
    }
  }, 220);
}

async function loadDashboard() {
  try {
    const [subscriptions, upcomingCharges, insights] = await Promise.all([
      requestJSON("/api/subscriptions"),
      requestJSON("/api/upcoming-charges"),
      requestJSON("/api/insights")
    ]);
    latestSubscriptions = subscriptions;

    const activeSubscriptions = subscriptions.filter((s) => !s.isPaused);
    const pausedSubscriptions = subscriptions.filter((s) => s.isPaused);
    const monthlySpend = activeSubscriptions.reduce(
      (sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle),
      0
    );
    const pausedSavings = pausedSubscriptions.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const weekTotal = upcomingCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    deductionsAmountEl.textContent =
      upcomingCharges.length > 0
        ? `${formatMoney(weekTotal)} will be debited this week`
        : "No charges due this week";
    homeActiveSubtextEl.textContent =
      upcomingCharges.length > 0
        ? `Across ${upcomingCharges.length} subscription${upcomingCharges.length !== 1 ? "s" : ""} renewing this week`
        : "No subscriptions renewing this week";

    // Savings wedge (duplicate OTT & bundles)
    const duplicateSubs = activeSubscriptions.filter((s) => s.isDuplicate);
    const duplicateSavings = duplicateSubs.reduce(
      (sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle),
      0
    );
    savingsWedgeAmountEl.textContent = duplicateSubs.length
      ? `${formatMoney(duplicateSavings)} / month`
      : "—";
    savingsWedgeSubtextEl.textContent = duplicateSubs.length
      ? `We found ${duplicateSubs.length} subscription${
          duplicateSubs.length !== 1 ? "s" : ""
        } already included in telco bundles.`
      : "No obvious bundle duplicates yet. We’ll flag Netflix/OTT that your JioFiber or Airtel plan already covers.";

    // Credit Safety Score (Financial Guardian)
    if (insights && typeof insights.creditSafetyScore === "number") {
      creditScoreValueEl.textContent = `${insights.creditSafetyScore}/100`;
      creditScoreLabelEl.textContent = insights.creditLabel || "Credit safety";
      if (insights.highImpactDueSoonCount > 0) {
        creditScoreSubtextEl.textContent = `CIBIL protection alert: ${insights.highImpactDueSoonCount} high‑impact EMI/insurance bill${
          insights.highImpactDueSoonCount !== 1 ? "s" : ""
        } due in next 5 days.`;
      } else {
        creditScoreSubtextEl.textContent =
          "On‑time EMIs and insurance payments keep your CIBIL profile protected.";
      }
    } else {
      creditScoreValueEl.textContent = "—";
      creditScoreSubtextEl.textContent =
        "We’ll compute your credit safety once EMIs and insurance premiums are detected.";
    }

    renderSubscriptions(subscriptions);
    renderInsights(monthlySpend, upcomingCharges.length, pausedSubscriptions.length);
    renderUpcomingCharges(upcomingCharges);
  } catch (error) {
    fixedPanelEl.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    lifestylePanelEl.innerHTML = "";
    showStatus("Could not load dashboard data.", "error");
  }
}

function classifyImpactTag(bill) {
  if (bill.cibilImpact === "high") return "high";
  if (bill.cibilImpact === "medium") return "medium";
  return "low";
}

function renderFetchedBillsReview() {
  if (!fetchBillsReviewEl) return;

  const count = latestFetchedBills.length;

  if (!count) {
    fetchBillsReviewEl.innerHTML =
      "<p class=\"empty-state\">No new bills detected from your linked billers. We’ll keep watching for EMIs, insurance and utilities.</p>";
    fetchBillsReviewEl.classList.remove("hidden");
    return;
  }

  const highImpactCount = latestFetchedBills.filter((bill) => bill.cibilImpact === "high").length;

  const itemsHtml = latestFetchedBills
    .map((bill) => {
      const impact = classifyImpactTag(bill);
      const impactLabel =
        impact === "high" ? "High impact" : impact === "medium" ? "Medium impact" : "Low impact";

      const impactClass =
        impact === "high" ? "fetch-tag fetch-tag-high" : impact === "medium" ? "fetch-tag fetch-tag-medium" : "fetch-tag";

      const typeLabel = bill.type || "Bill";

      return `
        <article class="fetch-bill-card">
          <div class="fetch-bill-main">
            <strong>${escapeHtml(bill.serviceName)}</strong>
            <span>${formatBillingAmount(bill.amount, bill.billingCycle)}</span>
          </div>
          <div class="fetch-bill-meta">
            <div class="fetch-bill-tags">
              <span class="fetch-tag">${escapeHtml(typeLabel)}</span>
              <span class="${impactClass}">${escapeHtml(impactLabel)}</span>
            </div>
            <label class="fetch-track-toggle">
              <input type="checkbox" class="fetch-track-checkbox" data-id="${escapeHtml(
                bill.id
              )}" checked />
              <span>Track in Guardian</span>
            </label>
          </div>
          <p class="upcoming-date">Due on ${formatDate(bill.nextBillingDate)}</p>
        </article>
      `;
    })
    .join("");

  fetchBillsReviewEl.innerHTML = `
    <header class="fetch-bills-header">
      <h4>We found ${count} bill${count !== 1 ? "s" : ""}</h4>
      <p class="fetch-bills-summary">
        ${highImpactCount > 0 ? `${highImpactCount} marked as high impact for CIBIL protection.` : "All bills are low impact for CIBIL."}
      </p>
    </header>
    <div class="fetch-bill-list">
      ${itemsHtml}
    </div>
    <div class="fetch-bills-actions">
      <button id="confirm-fetch-bills-btn" class="primary-btn" type="button">
        Add selected bills to Guardian
      </button>
      <small>You can always adjust these later from Fixed Obligations.</small>
    </div>
  `;

  fetchBillsReviewEl.classList.remove("hidden");
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateScreen(button.dataset.screen);
  });
});

openAddModalBtnEl.addEventListener("click", openAddModal);
closeAddModalBtnEl.addEventListener("click", closeAddModal);
viewSubscriptionsBtnEl.addEventListener("click", () => {
  activateScreen("subscriptions-screen");
});
addPlatformSelectEl.addEventListener("change", () => {
  addSubscriptionSelectEl.value = "";
  renderSubscriptionOptions();
});

addModalEl.addEventListener("click", (event) => {
  if (event.target === addModalEl) {
    closeAddModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && addModalEl.classList.contains("is-open")) {
    closeAddModal();
  }
});

subscriptionFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedPlatform = addPlatformSelectEl.value;
  const selectedSubscription = addSubscriptionSelectEl.value;
  const { subscriptions: availableSubscriptions } = getSubscriptionsForPlatform(selectedPlatform);
  const isValidSelection = availableSubscriptions.includes(selectedSubscription);
  const match = SUBSCRIPTION_DETAILS[selectedSubscription];

  if (!selectedPlatform || !selectedSubscription || !isValidSelection || !match) {
    showStatus("Please select a valid platform and subscription.", "error");
    return;
  }

  const payload = {
    serviceName: selectedSubscription,
    amount: match.amount,
    billingCycle: match.billingCycle || "Monthly",
    nextBillingDate: addDaysFromToday(match.billingInDays),
    platform: selectedPlatform
  };

  try {
    await requestJSON("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    subscriptionFormEl.reset();
    closeAddModal();
    await loadDashboard();
    renderSubscriptionOptions();
    showStatus("Subscription added.");
    activateScreen("subscriptions-screen");
  } catch (error) {
    showStatus(error.message, "error");
  }
});

subscriptionListsContainerEl.addEventListener("click", async (event) => {
  const pauseBtn = event.target.closest(".pause-btn");
  if (pauseBtn) {
    try {
      await requestJSON(`/api/subscriptions/${pauseBtn.dataset.id}/pause`, {
        method: "PATCH"
      });
      await loadDashboard();
      showStatus("Subscription paused.");
    } catch (error) {
      showStatus(error.message, "error");
    }
    return;
  }

  const unpauseBtn = event.target.closest(".unpause-btn");
  if (unpauseBtn) {
    try {
      await requestJSON(`/api/subscriptions/${unpauseBtn.dataset.id}/unpause`, {
        method: "PATCH"
      });
      await loadDashboard();
      showStatus("Subscription unpaused.");
    } catch (error) {
      showStatus(error.message, "error");
    }
    return;
  }

  const revokeUpiBtn = event.target.closest(".revoke-upi-btn");
  if (revokeUpiBtn) {
    try {
      const response = await requestJSON(`/api/subscriptions/${revokeUpiBtn.dataset.id}/revoke-upi`, {
        method: "PATCH"
      });
      await loadDashboard();
      const message =
        (response && response.message) ||
        "UPI AutoPay mandate revoke simulated via NPCI sandbox.";
      showStatus(message);
    } catch (error) {
      showStatus(error.message, "error");
    }
    return;
  }

  const switchBundleBtn = event.target.closest(".switch-bundle-btn");
  if (switchBundleBtn) {
    const subscription = latestSubscriptions.find((s) => s.id === switchBundleBtn.dataset.id);
    if (subscription) {
      const provider = subscription.telcoBundleProvider || "your telco app";
      showStatus(
        `Switch to bundle: Claim OTT inside ${provider} and then cancel the paid version from its app/bank mandate hub.`
      );
    }
    return;
  }

  const manageBankBtn = event.target.closest(".manage-bank-btn");
  if (manageBankBtn) {
    const url = manageBankBtn.dataset.url;
    if (url) {
      window.open(url, "_blank", "noopener");
    }
    showStatus("Loan/EMI changes must be managed directly with your bank.");
    return;
  }

  const removeBtn = event.target.closest(".remove-btn");
  if (!removeBtn) {
    return;
  }

  try {
    await requestJSON(`/api/subscriptions/${removeBtn.dataset.id}`, {
      method: "DELETE"
    });
    await loadDashboard();
    showStatus("Subscription management updated.");
  } catch (error) {
    showStatus(error.message, "error");
  }
});

scanQrBtnEl.addEventListener("click", () => {
  paymentMethodWrapEl.classList.toggle("hidden");
  paymentMessageEl.textContent = paymentMethodWrapEl.classList.contains("hidden")
    ? ""
    : "Select a payment method to simulate QR transfer.";
});

paymentMethodEl.addEventListener("change", () => {
  paymentMessageEl.textContent = paymentMethodEl.value
    ? `${paymentMethodEl.value} selected for QR simulation.`
    : "Select a payment method to simulate QR transfer.";
});

// Guardian category tabs
fixedTabBtnEl.addEventListener("click", () => {
  fixedTabBtnEl.classList.add("is-active");
  lifestyleTabBtnEl.classList.remove("is-active");
  document.getElementById("fixed-obligations-panel").classList.add("is-active");
  document.getElementById("fixed-obligations-panel").hidden = false;
  document.getElementById("lifestyle-subs-panel").classList.remove("is-active");
  document.getElementById("lifestyle-subs-panel").hidden = true;
});

lifestyleTabBtnEl.addEventListener("click", () => {
  lifestyleTabBtnEl.classList.add("is-active");
  fixedTabBtnEl.classList.remove("is-active");
  document.getElementById("lifestyle-subs-panel").classList.add("is-active");
  document.getElementById("lifestyle-subs-panel").hidden = false;
  document.getElementById("fixed-obligations-panel").classList.remove("is-active");
  document.getElementById("fixed-obligations-panel").hidden = true;
});

// Fetch my bills – simulated BBPS / Account Aggregator
fetchBillsBtnEl.addEventListener("click", async () => {
  try {
    const filters = {
      includeLoans: !filterIncludeLoansEl || filterIncludeLoansEl.checked,
      includeUtilities: !filterIncludeUtilitiesEl || filterIncludeUtilitiesEl.checked
    };

    const response = await requestJSON("/api/fetch-bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters)
    });

    latestFetchedBills = response && Array.isArray(response.bills) ? response.bills : [];
    const count =
      response && typeof response.addedCount === "number"
        ? response.addedCount
        : latestFetchedBills.length;

    renderFetchedBillsReview();

    showStatus(
      count
        ? `We found ${count} bill${count !== 1 ? "s" : ""} from simulated BBPS & AA.`
        : "No new bills detected from your linked billers."
    );
    activateScreen("subscriptions-screen");
    fixedTabBtnEl.click();
  } catch (error) {
    showStatus(error.message, "error");
  }
});

if (fetchBillsReviewEl) {
  fetchBillsReviewEl.addEventListener("click", async (event) => {
    const confirmBtn = event.target.closest("#confirm-fetch-bills-btn");
    if (!confirmBtn) {
      return;
    }

    const checkboxes = Array.from(
      fetchBillsReviewEl.querySelectorAll(".fetch-track-checkbox")
    );
    const selectedIds = checkboxes
      .filter((input) => input.checked)
      .map((input) => input.dataset.id);

    try {
      const response = await requestJSON("/api/fetched-bills/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billIds: selectedIds })
      });

      await loadDashboard();

      const message =
        (response && response.message) ||
        (selectedIds.length
          ? `Tracked ${selectedIds.length} bill${selectedIds.length !== 1 ? "s" : ""} in Guardian.`
          : "No bills were selected to track.");

      showStatus(message);
      fetchBillsReviewEl.classList.add("hidden");
    } catch (error) {
      showStatus(error.message, "error");
    }
  });
}

async function initializeApp() {
  await Promise.all([loadDashboard(), wait(1800)]);
  activateScreen("home-screen");
  appLoaderEl.classList.add("is-hidden");
  appShellEl.classList.add("is-ready");
  appShellEl.removeAttribute("aria-hidden");
  window.setTimeout(() => {
    appLoaderEl.hidden = true;
  }, 380);
}

initializeApp();
