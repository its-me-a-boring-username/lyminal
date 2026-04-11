export const TIERS = ["free", "paid_1", "paid_2"];

export function normalizeTier(value) {
  if (value === "paid_1" || value === "paid_2") return value;
  return "free";
}

export function getCapabilities(tier) {
  const normalized = normalizeTier(tier);
  return {
    tier: normalized,
    isPaid: normalized !== "free",
    isPro: normalized === "paid_2",
    maxGoals: normalized === "free" ? 1 : 5,
    canUsePlan: normalized !== "free",
    canUseFind: normalized === "paid_2",
    canDownloadFullReport: normalized !== "free",
  };
}
