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
    id: "youtube-premium",
    serviceName: "YouTube Premium",
    amount: 139,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 5),
    platform: "Google Pay"
  },
  {
    id: "amazon-prime",
    serviceName: "Amazon Prime",
    amount: 299,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 7),
    platform: "Amazon Pay"
  },
  {
    id: "disney-hotstar",
    serviceName: "Disney+ Hotstar",
    amount: 299,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 9),
    platform: "Paytm Wallet"
  },
  {
    id: "jio-recharge",
    serviceName: "Jio Recharge",
    amount: 399,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 11),
    platform: "PhonePe"
  },
  {
    id: "airtel-broadband",
    serviceName: "Airtel Broadband",
    amount: 999,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 13),
    platform: "Google Pay"
  },
  {
    id: "golds-gym",
    serviceName: "Gold's Gym",
    amount: 1800,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 16),
    platform: "BHIM"
  },
  {
    id: "swiggy-one",
    serviceName: "Swiggy One",
    amount: 149,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 18),
    platform: "CRED"
  },
  {
    id: "zomato-gold",
    serviceName: "Zomato Gold",
    amount: 149,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 21),
    platform: "Paytm"
  },
  {
    id: "chatgpt-plus",
    serviceName: "ChatGPT Plus",
    amount: 1660,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 24),
    platform: "Credit Card"
  },
  {
    id: "notion-ai",
    serviceName: "Notion AI",
    amount: 830,
    billingCycle: "Monthly",
    nextBillingDate: addDays(today, 27),
    platform: "Credit Card"
  }
];

module.exports = {
  subscriptions
};
