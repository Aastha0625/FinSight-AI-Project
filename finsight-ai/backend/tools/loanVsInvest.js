function compareLoanVsInvest({ loanOutstanding, loanInterestRate, investmentAmount, expectedReturnRate, years }) {
  // Simple compound comparison over the tenure 'years'
  const interestSaved = investmentAmount * (Math.pow(1 + (loanInterestRate / 100), years) - 1);
  const investmentReturns = investmentAmount * (Math.pow(1 + (expectedReturnRate / 100), years) - 1);
  
  const recommendation = investmentReturns > interestSaved ? "Invest" : "Prepay Loan";
  
  return {
    interestSaved: Math.round(interestSaved),
    investmentReturns: Math.round(investmentReturns),
    recommendation,
    summary: `Using ₹${investmentAmount}, investing yields ₹${Math.round(investmentReturns).toLocaleString()} vs saving ₹${Math.round(interestSaved).toLocaleString()} in loan interest over ${years} years. Recommendation: ${recommendation}.`
  };
}

module.exports = { compareLoanVsInvest };
