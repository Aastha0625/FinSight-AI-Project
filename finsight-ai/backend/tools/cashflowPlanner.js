function planMonthlyCashflow({ monthlyIncome, emis, sipAmounts, insurancePremiums }) {
  const sumArray = (arr) => arr.reduce((acc, curr) => acc + curr, 0);
  
  const totalEMI = sumArray(emis || []);
  const totalSIP = sumArray(sipAmounts || []);
  const totalPremium = sumArray(insurancePremiums || []);
  
  const totalCommitments = totalEMI + totalSIP + totalPremium;
  const surplus = monthlyIncome - totalCommitments;
  
  const commitmentRatio = (totalCommitments / monthlyIncome) * 100;
  
  let status = "Healthy";
  if (commitmentRatio > 70) status = "Highly Stressed";
  else if (commitmentRatio > 50) status = "Stressed";
  
  return {
    totalEMI,
    totalSIP,
    totalPremium,
    totalCommitments,
    surplus,
    commitmentRatio: Number(commitmentRatio.toFixed(2)),
    status,
    summary: `Your fixed monthly commitments are ₹${totalCommitments} (${commitmentRatio.toFixed(1)}% of income). This leaves a monthly surplus of ₹${surplus}. Cashflow status is ${status}.`
  };
}

module.exports = { planMonthlyCashflow };
