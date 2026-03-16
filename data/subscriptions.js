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
    nextBillingDate: addDays(today, 2)
  },
  {
    id: "spotify",
    serviceName: "Spotify",
    amount: 119,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 4)
  },
  {
    id: "gym-membership",
    serviceName: "Gym Membership",
    amount: 1800,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 6)
  },
  {
    id: "cursor-ai",
    serviceName: "Cursor AI",
    amount: 1632,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 14)
  }
];

module.exports = {
  subscriptions
};
