function planMonthlyCashflow({ monthlyIncome = 100000, emis = [25000], sipAmounts = [15000], insurancePremiums = [2000] }) {
  const sumArray = (arr) => arr.reduce((acc, curr) => acc + curr, 0);
  
  const totalEMI = sumArray(emis || []);
  const totalSIP = sumArray(sipAmounts || []);
  const totalPremium = sumArray(insurancePremiums || []);
  
  const totalCommitments = totalEMI + totalSIP + totalPremium;
  const surplus = monthlyIncome - totalCommitments;
  
  const commitmentRatio = (totalCommitments / monthlyIncome) * 100;
  
  let status = "Healthy";
  let statusColor = "#16A34A";
  if (commitmentRatio > 50) { status = "High Stress"; statusColor = "#EF4444"; }
  else if (commitmentRatio >= 35) { status = "Manageable"; statusColor = "#F59E0B"; }
  
  const breakdown = [
    { label: "EMIs", value: totalEMI, color: "#EF4444" },
    { label: "SIPs", value: totalSIP, color: "#16A34A" },
    { label: "Insurance", value: totalPremium, color: "#3B82F6" },
    { label: "Surplus", value: Math.max(0, surplus), color: "#E5E7EB" }
  ];
  
  return {
    breakdown,
    monthlyIncome,
    statusColor,
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
