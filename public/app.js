const appLoaderEl = document.getElementById("app-loader");
const appShellEl = document.getElementById("app-shell");
const statusMessageEl = document.getElementById("status-message");
const navButtons = Array.from(document.querySelectorAll(".bottom-tab-btn"));
const appScreens = Array.from(document.querySelectorAll(".app-screen"));
const openAddModalBtnEl = document.getElementById("open-add-modal-btn");
const closeAddModalBtnEl = document.getElementById("close-add-modal-btn");
const addModalEl = document.getElementById("add-modal");
const viewSubscriptionsBtnEl = document.getElementById("view-subscriptions-btn");
const homeActiveSubtextEl = document.getElementById("home-active-subtext");
const subscriptionFormEl = document.getElementById("subscription-form");
const addPlatformSelectEl = document.getElementById("add-platform-select");
const addSubscriptionSelectEl = document.getElementById("add-subscription-select");
const subscriptionListEl = document.getElementById("subscription-list");
const subscriptionCountEl = document.getElementById("subscription-count");
const insightCardsEl = document.getElementById("insights");
const upcomingListEl = document.getElementById("upcoming-list");
const upcomingSummaryEl = document.getElementById("upcoming-summary");
const scanQrBtnEl = document.getElementById("scan-qr-btn");
const paymentMethodWrapEl = document.getElementById("payment-method-wrap");
const paymentMethodEl = document.getElementById("payment-method");
const paymentMessageEl = document.getElementById("payment-message");

const SUBSCRIPTION_CATALOG = {
  PhonePe: [
    { name: "Jio Recharge", amount: 399, billingInDays: 8 },
    { name: "Gold's Gym", amount: 1800, billingInDays: 13 }
  ],
  "Google Pay": [
    { name: "Netflix", amount: 649, billingInDays: 4 },
    { name: "YouTube Premium", amount: 139, billingInDays: 10 }
  ],
  Paytm: [
    { name: "Zomato Gold", amount: 149, billingInDays: 9 },
    { name: "Airtel Recharge", amount: 349, billingInDays: 15 }
  ],
  BHIM: [
    { name: "Gold's Gym", amount: 1800, billingInDays: 13 },
    { name: "Airtel Recharge", amount: 349, billingInDays: 15 }
  ],
  "Amazon Pay UPI": [
    { name: "Amazon Prime", amount: 299, billingInDays: 7 },
    { name: "Swiggy One", amount: 149, billingInDays: 12 }
  ],
  CRED: [
    { name: "Swiggy One", amount: 149, billingInDays: 12 },
    { name: "ChatGPT Plus", amount: 1660, billingInDays: 24 }
  ],
  "Amazon Pay": [{ name: "Amazon Prime", amount: 299, billingInDays: 7 }],
  "Paytm Wallet": [{ name: "Disney+ Hotstar", amount: 299, billingInDays: 11 }],
  MobiKwik: [{ name: "Zomato Gold", amount: 149, billingInDays: 9 }],
  Freecharge: [{ name: "Jio Recharge", amount: 399, billingInDays: 8 }],
  "Airtel Money": [{ name: "Airtel Recharge", amount: 349, billingInDays: 15 }],
  "Amazon Pay Later": [{ name: "Amazon Prime", amount: 299, billingInDays: 7 }],
  Simpl: [{ name: "Zomato Gold", amount: 149, billingInDays: 9 }],
  LazyPay: [{ name: "Swiggy One", amount: 149, billingInDays: 12 }],
  "MobiKwik Zip": [{ name: "YouTube Premium", amount: 139, billingInDays: 10 }],
  "Flipkart Pay Later": [{ name: "Disney+ Hotstar", amount: 299, billingInDays: 11 }],
  PostPe: [{ name: "Notion AI", amount: 830, billingInDays: 26 }],
  "Credit Card": [
    { name: "ChatGPT Plus", amount: 1660, billingInDays: 24 },
    { name: "Notion AI", amount: 830, billingInDays: 26 }
  ],
  "Debit Card": [{ name: "Netflix", amount: 649, billingInDays: 4 }],
  OneCard: [{ name: "Notion AI", amount: 830, billingInDays: 26 }],
  Slice: [{ name: "ChatGPT Plus", amount: 1660, billingInDays: 24 }],
  "Google Play": [
    { name: "Netflix", amount: 649, billingInDays: 4 },
    { name: "YouTube Premium", amount: 139, billingInDays: 10 }
  ],
  "Apple App Store": [
    { name: "Spotify", amount: 119, billingInDays: 6 },
    { name: "Apple Music", amount: 99, billingInDays: 14 }
  ]
};

let latestSubscriptions = [];

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
  return `\u20b9${Number(amount).toLocaleString("en-IN")}`;
}

function addDaysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().split("T")[0];
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

function renderInsights() {
  const insightLines = [
    "\u20b95,800 spent monthly on subscriptions",
    "3 subscriptions renewing this week",
    "2 subscriptions unused recently"
  ];

  insightCardsEl.innerHTML = insightLines
    .map((line) => `<p class="insight-pill">${escapeHtml(line)}</p>`)
    .join("");
}

function renderSubscriptions(subscriptions) {
  const activeCount = subscriptions.filter((subscription) => !subscription.isPaused).length;
  subscriptionCountEl.textContent = `${activeCount} active`;

  if (!subscriptions.length) {
    subscriptionListEl.innerHTML = '<p class="empty-state">No subscriptions yet.</p>';
    return;
  }

  const byNearestBilling = [...subscriptions].sort(
    (a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate)
  );

  subscriptionListEl.innerHTML = byNearestBilling
    .map((subscription) => {
      const canPause = supportsPause(subscription.platform);
      const platformLabel = formatPlatformBadge(subscription.platform);
      return `
        <article class="subscription-card">
          <div class="card-top">
            <h3>${escapeHtml(subscription.serviceName)}</h3>
            <p class="card-amount">${formatMoney(subscription.amount)}</p>
          </div>
          <div class="card-bottom">
            <p class="next-billing">Next billing: ${formatDate(subscription.nextBillingDate)}</p>
            <span class="platform-pill">${escapeHtml(platformLabel)}</span>
          </div>
          ${subscription.isPaused ? '<span class="paused-chip">Paused</span>' : ""}
          <footer class="card-actions">
            ${
              canPause
                ? `<button
                    class="pause-btn"
                    data-id="${subscription.id}"
                    type="button"
                    ${subscription.isPaused ? "disabled" : ""}
                  >
                    ${subscription.isPaused ? "Paused" : "Pause Auto-debit"}
                  </button>`
                : ""
            }
            <button class="remove-btn" data-id="${subscription.id}" type="button">Manage</button>
          </footer>
        </article>
      `;
    })
    .join("");
}

function renderUpcomingCharges(charges) {
  upcomingSummaryEl.textContent = "\u20b93,200 due this week";

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
            <span>${formatMoney(charge.amount)}</span>
          </div>
          <p class="upcoming-date">Bills on ${formatDate(charge.nextBillingDate)}</p>
        </article>
      `
    )
    .join("");
}

function renderSubscriptionOptions() {
  const selectedPlatform = addPlatformSelectEl.value;
  const platformItems = SUBSCRIPTION_CATALOG[selectedPlatform] || [];
  const existingNames = new Set(
    latestSubscriptions.map((subscription) => String(subscription.serviceName).toLowerCase())
  );

  addSubscriptionSelectEl.innerHTML = "";

  if (!selectedPlatform) {
    addSubscriptionSelectEl.disabled = true;
    addSubscriptionSelectEl.innerHTML = "<option value=''>Select platform first</option>";
    return;
  }

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select subscription";
  addSubscriptionSelectEl.append(defaultOption);

  platformItems.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = `${item.name} • ${formatMoney(item.amount)}`;
    if (existingNames.has(item.name.toLowerCase())) {
      option.disabled = true;
      option.textContent = `${option.textContent} (Added)`;
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
    const [subscriptions, upcomingCharges] = await Promise.all([
      requestJSON("/api/subscriptions"),
      requestJSON("/api/upcoming-charges")
    ]);
    latestSubscriptions = subscriptions;

    renderSubscriptions(subscriptions);
    renderInsights();
    renderUpcomingCharges(upcomingCharges);
    const activeCount = subscriptions.filter((subscription) => !subscription.isPaused).length;
    homeActiveSubtextEl.textContent = `Across ${activeCount} active subscriptions`;
  } catch (error) {
    subscriptionListEl.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    showStatus("Could not load dashboard data.", "error");
  }
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
addPlatformSelectEl.addEventListener("change", renderSubscriptionOptions);

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
  const match = (SUBSCRIPTION_CATALOG[selectedPlatform] || []).find(
    (item) => item.name === selectedSubscription
  );

  if (!selectedPlatform || !selectedSubscription || !match) {
    showStatus("Please select a valid platform and subscription.", "error");
    return;
  }

  const payload = {
    serviceName: match.name,
    amount: match.amount,
    billingCycle: "Monthly",
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

subscriptionListEl.addEventListener("click", async (event) => {
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
