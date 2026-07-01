function checkInsuranceAdequacy({ annualIncome, currentCover, yearsToRetirement, dependents }) {
  // Recommended cover = annualIncome * min(yearsToRetirement, 20) * 0.7
  let recommendedCover = annualIncome * Math.min(yearsToRetirement, 20) * 0.7;
  
  if (dependents === 0) {
    recommendedCover = 0;
  }
  
  const gap = Math.max(0, recommendedCover - currentCover);
  const status = gap > 0 ? "Underinsured" : "Adequate";
  
  return {
    recommendedCover: Math.round(recommendedCover),
    currentCover,
    gap: Math.round(gap),
    status,
    summary: `Your recommended term insurance cover is ₹${Math.round(recommendedCover).toLocaleString()}. You currently have a gap of ₹${Math.round(gap).toLocaleString()} and are considered ${status}.`
  };
}

module.exports = { checkInsuranceAdequacy };
