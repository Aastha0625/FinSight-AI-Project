function compareLoanVsInvest({ loanOutstanding = 1000000, loanInterestRate = 9, investmentAmount = 500000, expectedReturnRate = 12, years = 5 }) {
  // Simple compound comparison over the tenure 'years'
  const interestSaved = investmentAmount * (Math.pow(1 + (loanInterestRate / 100), years) - 1);
  const investmentReturns = investmentAmount * (Math.pow(1 + (expectedReturnRate / 100), years) - 1);
  
  const recommendation = investmentReturns > interestSaved ? "INVEST" : "PREPAY";
  const reasoning = investmentReturns > interestSaved ? "Expected returns exceed loan interest." : "Loan interest exceeds expected returns.";
  
  return {
    scenarios: [
      { label: "Interest Saved (Prepay)", value: Math.round(interestSaved), color: "#EF4444" },
      { label: "Returns (Invest)", value: Math.round(investmentReturns), color: "#16A34A" }
    ],
    reasoning,
    interestSaved: Math.round(interestSaved),
    investmentReturns: Math.round(investmentReturns),
    recommendation,
    summary: `Using ₹${investmentAmount}, investing yields ₹${Math.round(investmentReturns).toLocaleString()} vs saving ₹${Math.round(interestSaved).toLocaleString()} in loan interest over ${years} years. Recommendation: ${recommendation}.`
  };
}

module.exports = { compareLoanVsInvest };
