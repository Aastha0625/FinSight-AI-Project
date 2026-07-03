function checkInsuranceAdequacy({ annualIncome = 1200000, currentCover = 5000000, yearsToRetirement = 20, dependents = 2 }) {
  // Recommended cover = annualIncome * min(yearsToRetirement, 20) * 0.7
  let recommendedCover = annualIncome * Math.min(yearsToRetirement, 20) * 0.7;
  
  if (dependents === 0) {
    recommendedCover = 0;
  }
  
  const gap = Math.max(0, recommendedCover - currentCover);
  const status = gap > 0 ? "Underinsured" : "Adequately Insured";
  
  const coveragePercent = recommendedCover > 0 ? Math.min(100, Math.round((currentCover / recommendedCover) * 100)) : 100;
  
  const segments = [
    { label: "Current Cover", value: currentCover, color: "#16A34A" },
    { label: "Gap", value: Math.max(0, gap), color: "#FEE2E2" }
  ];
  
  return {
    coveragePercent,
    segments,
    recommendedCover: Math.round(recommendedCover),
    currentCover,
    gap: Math.round(gap),
    status,
    summary: `Your recommended term insurance cover is ₹${Math.round(recommendedCover).toLocaleString()}. You currently have a gap of ₹${Math.round(gap).toLocaleString()} and are considered ${status}.`
  };
}

module.exports = { checkInsuranceAdequacy };
