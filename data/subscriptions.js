function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0];
}

const today = new Date();

const subscriptions = [
  {
    id: "netflix",
    serviceName: "Netflix",
    amount: 649,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 2),
    platform: "Google Play"
  },
  {
    id: "spotify",
    serviceName: "Spotify",
    amount: 119,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 4),
    platform: "Apple App Store"
  },
  {
    id: "gym-membership",
    serviceName: "Gym Membership",
    amount: 1800,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 6),
    platform: "UPI"
  },
  {
    id: "cursor-ai",
    serviceName: "Cursor AI",
    amount: 1632,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 14),
    platform: "Credit Card"
  }
];

module.exports = {
  subscriptions
};
