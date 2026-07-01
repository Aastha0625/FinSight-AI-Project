const { calculateSIPMaturity } = require('./sipCalculator');

function analyseGoalGap({ goalName, targetAmount, targetYear, currentSIPAmount, expectedReturn }) {
  const currentYear = new Date().getFullYear();
  const years = targetYear - currentYear;
  
  if (years <= 0) {
    return {
      projectedValue: 0, gap: targetAmount, additionalSIPNeeded: 0, onTrack: false,
      summary: `The target year ${targetYear} must be in the future.`
    };
  }
  
  const sipResult = calculateSIPMaturity({
    monthlyAmount: currentSIPAmount,
    annualReturnPercent: expectedReturn,
    years
  });
  
  const projectedValue = sipResult.futureValue;
  const gap = Math.max(0, targetAmount - projectedValue);
  const onTrack = gap <= 0;
  
  let additionalSIPNeeded = 0;
  if (gap > 0) {
    const r = expectedReturn / 12 / 100;
    const n = years * 12;
    additionalSIPNeeded = gap / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  }
  
  return {
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
