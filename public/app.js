const subscriptionListEl = document.getElementById("subscription-list");
const subscriptionCountEl = document.getElementById("subscription-count");
const insightCardsEl = document.getElementById("insights");
const upcomingListEl = document.getElementById("upcoming-list");
const subscriptionFormEl = document.getElementById("subscription-form");
const toggleAddBtnEl = document.getElementById("toggle-add-btn");
const autoDetectBtnEl = document.getElementById("auto-detect-btn");
const statusMessageEl = document.getElementById("status-message");
const addSubscriptionSectionEl = document.getElementById("add-subscription");

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

function getDaysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function showStatus(message, tone = "success") {
  statusMessageEl.textContent = message;
  statusMessageEl.style.color = tone === "error" ? "#ff8fa1" : "#6ce6b6";
}

function renderSubscriptions(subscriptions) {
  subscriptionCountEl.textContent = `${subscriptions.length} active`;

  if (!subscriptions.length) {
    subscriptionListEl.innerHTML = '<p class="empty-state">No subscriptions yet.</p>';
    return;
  }

  const byNearestBilling = [...subscriptions].sort(
    (a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate)
  );

  subscriptionListEl.innerHTML = byNearestBilling
    .map(
      (subscription) => `
      <article class="subscription-card">
        <div class="subscription-top">
          <h3>${escapeHtml(subscription.serviceName)}</h3>
          <span class="platform-pill">${escapeHtml(subscription.platform || "Credit Card")}</span>
        </div>
        <div class="meta-grid">
          <p class="meta-row"><span>Cost / month</span><strong>${formatMoney(subscription.amount)}</strong></p>
          <p class="meta-row"><span>Next billing</span><strong>${formatDate(subscription.nextBillingDate)}</strong></p>
          <p class="meta-row"><span>Key platform</span><strong>${escapeHtml(subscription.platform || "Credit Card")}</strong></p>
        </div>
        <footer>
          <button class="remove-btn" data-id="${subscription.id}" type="button">Remove</button>
        </footer>
      </article>
    `
    )
    .join("");
}

function renderInsights(insights) {
  insightCardsEl.innerHTML = insights.messages
    .map((message) => `<p class="insight-pill">${escapeHtml(message)}</p>`)
    .join("");
}

function renderUpcomingCharges(charges) {
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
        <strong>${escapeHtml(charge.serviceName)}</strong>
        <span>${formatMoney(charge.amount)} / month</span>
        <span class="${getDaysUntil(charge.nextBillingDate) <= 2 ? "highlight-text" : ""}">
          Bills on ${formatDate(charge.nextBillingDate)} (${getDaysUntil(charge.nextBillingDate)} day${getDaysUntil(charge.nextBillingDate) === 1 ? "" : "s"})
        </span>
      </article>
    `
    )
    .join("");
}

async function loadDashboard() {
  try {
    const [subscriptions, insights, upcomingCharges] = await Promise.all([
      requestJSON("/api/subscriptions"),
      requestJSON("/api/insights"),
      requestJSON("/api/upcoming-charges")
    ]);

    renderSubscriptions(subscriptions);
    renderInsights(insights);
    renderUpcomingCharges(upcomingCharges);
  } catch (error) {
    subscriptionListEl.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    showStatus("Could not load dashboard data.", "error");
  }
}

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
    await loadDashboard();
    showStatus("Subscription added.");
    addSubscriptionSectionEl.classList.add("hidden");
    toggleAddBtnEl.textContent = "Add Subscription";
  } catch (error) {
    showStatus(error.message, "error");
  }
});

subscriptionListEl.addEventListener("click", async (event) => {
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

toggleAddBtnEl.addEventListener("click", () => {
  addSubscriptionSectionEl.classList.toggle("hidden");
  const isHidden = addSubscriptionSectionEl.classList.contains("hidden");
  toggleAddBtnEl.textContent = isHidden ? "Add Subscription" : "Close";
  if (!isHidden) {
    addSubscriptionSectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

autoDetectBtnEl.addEventListener("click", async () => {
  autoDetectBtnEl.disabled = true;
  autoDetectBtnEl.textContent = "Detecting...";

  try {
    const detectionResult = await requestJSON("/api/subscriptions/auto-detect", {
      method: "POST"
    });
    await loadDashboard();
    if (!detectionResult.addedCount) {
      showStatus("No new subscriptions found this time.");
    } else {
      showStatus(`Auto-detected ${detectionResult.addedCount} subscription(s).`);
    }
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    autoDetectBtnEl.disabled = false;
    autoDetectBtnEl.textContent = "Auto-detect subscriptions";
  }
});

loadDashboard();
