function calculateSIPMaturity({ monthlyAmount, annualReturnPercent, years }) {
  const r = annualReturnPercent / 12 / 100;
  const n = years * 12;
  
  let futureValue = 0;
  if (r === 0) {
    futureValue = monthlyAmount * n;
  } else {
    // FV = P * [((1+r)^n - 1)/r] * (1+r)
    futureValue = monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }
  
  const totalInvested = monthlyAmount * n;
  const wealthGained = futureValue - totalInvested;
  
  return {
    futureValue: Math.round(futureValue),
    totalInvested: Math.round(totalInvested),
    wealthGained: Math.round(wealthGained),
    summary: `By investing ₹${monthlyAmount} monthly for ${years} years at ${annualReturnPercent}%, your investment will grow to ₹${Math.round(futureValue).toLocaleString()}.`
  };
}

module.exports = { calculateSIPMaturity };
