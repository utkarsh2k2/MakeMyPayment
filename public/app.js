const appLoaderEl = document.getElementById("app-loader");
const appShellEl = document.getElementById("app-shell");
const statusMessageEl = document.getElementById("status-message");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const openAddModalBtnEl = document.getElementById("open-add-modal-btn");
const closeAddModalBtnEl = document.getElementById("close-add-modal-btn");
const addModalEl = document.getElementById("add-modal");
const subscriptionFormEl = document.getElementById("subscription-form");
const subscriptionListEl = document.getElementById("subscription-list");
const subscriptionCountEl = document.getElementById("subscription-count");
const insightCardsEl = document.getElementById("insights");
const upcomingListEl = document.getElementById("upcoming-list");
const upcomingSummaryEl = document.getElementById("upcoming-summary");
const scanQrBtnEl = document.getElementById("scan-qr-btn");
const paymentMethodWrapEl = document.getElementById("payment-method-wrap");
const paymentMethodEl = document.getElementById("payment-method");
const paymentMessageEl = document.getElementById("payment-message");

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
  return method.includes("upi") || method.includes("autopay") || method.includes("phonepe");
}

function formatPlatformBadge(platform) {
  const value = String(platform || "").toLowerCase();
  if (value.includes("card")) {
    return "Card";
  }
  if (
    value.includes("upi") ||
    value.includes("autopay") ||
    value.includes("phonepe") ||
    value.includes("paytm") ||
    value.includes("bhim")
  ) {
    return "UPI";
  }
  if (
    value.includes("app store") ||
    value.includes("google play") ||
    value.includes("apple") ||
    value.includes("play")
  ) {
    return "App Store";
  }
  return platform || "Card";
}

function renderInsights() {
  const insightCards = [
    { icon: "\u20b9", value: "\u20b94,200", label: "spent this month" },
    { icon: "W", value: "3 renewals", label: "this week" },
    { icon: "D", value: "\u20b92,300", label: "due in next 7 days" }
  ];

  insightCardsEl.innerHTML = insightCards
    .map(
      (card) => `
        <article class="insight-card">
          <p class="insight-icon">${escapeHtml(card.icon)}</p>
          <p class="insight-value">${escapeHtml(card.value)}</p>
          <p class="insight-label">${escapeHtml(card.label)}</p>
        </article>
      `
    )
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
                    ${subscription.isPaused ? "Paused" : "Pause"}
                  </button>`
                : ""
            }
            <button class="remove-btn" data-id="${subscription.id}" type="button">Remove</button>
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

function activateTab(targetPanelId) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.target === targetPanelId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.id === targetPanelId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

function openAddModal() {
  addModalEl.hidden = false;
  requestAnimationFrame(() => {
    addModalEl.classList.add("is-open");
  });
  document.body.classList.add("modal-open");
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

    renderSubscriptions(subscriptions);
    renderInsights();
    renderUpcomingCharges(upcomingCharges);
  } catch (error) {
    subscriptionListEl.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    showStatus("Could not load dashboard data.", "error");
  }
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.target);
  });
});

openAddModalBtnEl.addEventListener("click", openAddModal);
closeAddModalBtnEl.addEventListener("click", closeAddModal);

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
  const formData = new FormData(subscriptionFormEl);
  const payload = Object.fromEntries(formData.entries());

  try {
    await requestJSON("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    subscriptionFormEl.reset();
    closeAddModal();
    await loadDashboard();
    showStatus("Subscription added.");
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
    showStatus("Subscription removed.");
  } catch (error) {
    showStatus(error.message, "error");
  }
});

scanQrBtnEl.addEventListener("click", () => {
  paymentMethodWrapEl.classList.toggle("hidden");
  paymentMessageEl.textContent = paymentMethodWrapEl.classList.contains("hidden")
    ? ""
    : "Choose a payment method to continue the QR simulation.";
});

paymentMethodEl.addEventListener("change", () => {
  const method = paymentMethodEl.value;
  paymentMessageEl.textContent = method
    ? `${method} selected for QR simulation.`
    : "Choose a payment method to continue the QR simulation.";
});

async function initializeApp() {
  await Promise.all([loadDashboard(), wait(1800)]);
  appLoaderEl.classList.add("is-hidden");
  appShellEl.classList.add("is-ready");
  appShellEl.removeAttribute("aria-hidden");
  window.setTimeout(() => {
    appLoaderEl.hidden = true;
  }, 380);
}

initializeApp();
