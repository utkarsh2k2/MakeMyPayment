const subscriptionListEl = document.getElementById("subscription-list");
const subscriptionCountEl = document.getElementById("subscription-count");
const insightCardsEl = document.getElementById("insight-cards");
const upcomingListEl = document.getElementById("upcoming-list");
const subscriptionFormEl = document.getElementById("subscription-form");
const scanQrBtnEl = document.getElementById("scan-qr-btn");
const paymentMethodWrapEl = document.getElementById("payment-method-wrap");
const paymentMethodEl = document.getElementById("payment-method");
const paymentMessageEl = document.getElementById("payment-message");

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

function renderSubscriptions(subscriptions) {
  subscriptionCountEl.textContent = `${subscriptions.length} active`;

  if (!subscriptions.length) {
    subscriptionListEl.innerHTML =
      '<p class="muted">No subscriptions yet. Add one below.</p>';
    return;
  }

  subscriptionListEl.innerHTML = subscriptions
    .map(
      (subscription) => `
      <article class="subscription-card">
        <h3>${subscription.serviceName}</h3>
        <p class="subscription-meta"><strong>${formatMoney(
          subscription.amount
        )}</strong> • ${subscription.billingCycle}</p>
        <p class="subscription-meta">Next billing: ${formatDate(
          subscription.nextBillingDate
        )}</p>
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
    .map((message) => `<article class="insight-card">${message}</article>`)
    .join("");
}

function renderUpcomingCharges(charges) {
  if (!charges.length) {
    upcomingListEl.innerHTML =
      "<li><span class='muted'>No renewals in the next 7 days.</span></li>";
    return;
  }

  upcomingListEl.innerHTML = charges
    .map(
      (charge) => `
      <li>
        <strong>${charge.serviceName}</strong><br />
        ${formatMoney(charge.amount)} • ${formatDate(charge.nextBillingDate)}
      </li>
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
    subscriptionListEl.innerHTML = `<p class="muted">${error.message}</p>`;
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
  } catch (error) {
    alert(error.message);
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
  } catch (error) {
    alert(error.message);
  }
});

scanQrBtnEl.addEventListener("click", () => {
  paymentMethodWrapEl.classList.toggle("hidden");
  paymentMessageEl.textContent = paymentMethodWrapEl.classList.contains("hidden")
    ? ""
    : "Choose a method to simulate QR payment flow.";
});

paymentMethodEl.addEventListener("change", () => {
  const selected = paymentMethodEl.value;
  paymentMessageEl.textContent = selected
    ? `${selected} selected for simulated QR payment.`
    : "Choose a method to simulate QR payment flow.";
});

loadDashboard();
