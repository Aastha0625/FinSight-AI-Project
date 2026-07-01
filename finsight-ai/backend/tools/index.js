const { calculateSIPMaturity } = require('./sipCalculator');
const { checkInsuranceAdequacy } = require('./insuranceAdequacy');
const { compareLoanVsInvest } = require('./loanVsInvest');
const { planMonthlyCashflow } = require('./cashflowPlanner');
const { analyseGoalGap } = require('./goalGapAnalyser');

module.exports = {
  calculateSIPMaturity,
  checkInsuranceAdequacy,
  compareLoanVsInvest,
  planMonthlyCashflow,
  analyseGoalGap
};

// Simple test block to run if called directly
if (require.main === module) {
  console.log("=== Testing FinSight AI Financial Tools ===\n");

  const sip = calculateSIPMaturity({ monthlyAmount: 10000, annualReturnPercent: 12, years: 10 });
  console.log("1. SIP Calculator:", sip);
  
  const insurance = checkInsuranceAdequacy({ annualIncome: 1500000, currentCover: 5000000, yearsToRetirement: 25, dependents: 2 });
  console.log("\n2. Insurance Adequacy:", insurance);
  
  const loanInvest = compareLoanVsInvest({ loanOutstanding: 2000000, loanInterestRate: 8.5, investmentAmount: 500000, expectedReturnRate: 12, years: 5 });
  console.log("\n3. Loan vs Invest:", loanInvest);
  
  const cashflow = planMonthlyCashflow({ monthlyIncome: 100000, emis: [25000, 5000], sipAmounts: [15000, 5000], insurancePremiums: [2000] });
  console.log("\n4. Cashflow Planner:", cashflow);
  
  const goalGap = analyseGoalGap({ goalName: "Child Education", targetAmount: 5000000, targetYear: new Date().getFullYear() + 15, currentSIPAmount: 8000, expectedReturn: 12 });
  console.log("\n5. Goal Gap Analyser:", goalGap);
}
