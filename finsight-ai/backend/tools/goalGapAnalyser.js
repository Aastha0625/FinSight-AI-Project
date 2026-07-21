const { calculateSIPMaturity } = require('./sipCalculator');

function analyseGoalGap({ goalName = "My Goal", targetAmount = 5000000, targetYear = new Date().getFullYear() + 10, currentSIPAmount = 0, currentPortfolioValue = 0, expectedReturn = 12 }) {
  const currentYear = new Date().getFullYear();
  
  // Handle if AI passes targetYear as an absolute year (2036) or an offset (10)
  let years = targetYear;
  if (targetYear > 2000) {
    years = targetYear - currentYear;
  }
  
  if (years <= 0) {
    return {
      projectedValue: 0, gap: targetAmount, additionalSIPNeeded: 0, onTrack: false,
      summary: `The target timeframe (${years} years) must be in the future.`
    };
  }
  
  const sipResult = calculateSIPMaturity({
    monthlyAmount: currentSIPAmount,
    annualReturnPercent: expectedReturn,
    years
  });
  
  const r = expectedReturn / 100;
  const corpusFutureValue = currentPortfolioValue * Math.pow(1 + r, years);
  
  const projectedValue = sipResult.futureValue + corpusFutureValue;
  const gap = Math.max(0, targetAmount - projectedValue);
  const onTrack = gap <= 0;
  
  const progressPercent = Math.min(100, Math.round((projectedValue / targetAmount) * 100));
  
  let additionalSIPNeeded = 0;
  if (gap > 0) {
    const r = expectedReturn / 12 / 100;
    const n = years * 12;
    additionalSIPNeeded = gap / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  }
  
  return {
    goalName,
    targetAmount,
    yearsLeft: years,
    progressPercent,
    projectedValue: Math.round(projectedValue),
    gap: Math.round(gap),
    additionalSIPNeeded: Math.round(additionalSIPNeeded),
    onTrack,
    summary: onTrack 
      ? `Great job! You are on track to achieve ₹${targetAmount.toLocaleString()} for ${goalName}.`
      : `You have a shortfall of ₹${Math.round(gap).toLocaleString()} for ${goalName}. Increase your SIP by ₹${Math.round(additionalSIPNeeded).toLocaleString()} monthly to stay on track.`
  };
}

module.exports = { analyseGoalGap };
