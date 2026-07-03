import React from 'react';
import SIPGrowthChart from './charts/SIPGrowthChart';
import LoanVsInvestChart from './charts/LoanVsInvestChart';
import CashflowDonutChart from './charts/CashflowDonutChart';
import GoalGapChart from './charts/GoalGapChart';
import InsuranceMeterChart from './charts/InsuranceMeterChart';

export default function AnalyticsTab({ financialSummary, analyticsData }) {
  const hasData = analyticsData && Object.values(analyticsData).some(v => v !== null);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in">
        <span className="material-symbols-outlined text-[64px] text-border mb-4">bar_chart</span>
        <h3 className="font-headline-sm text-on-surface mb-2">No analysis yet</h3>
        <p className="text-text-muted text-sm max-w-md">
          Ask questions in the chat — charts will appear here automatically as the AI analyses your documents.
        </p>
      </div>
    );
  }

  // Dynamic Health Score Calculation (Mirroring Dashboard)
  let calculatedScore = 40; // Base score
  const summary = financialSummary;
  
  if (summary?.sips?.length > 0) calculatedScore += 20;
  
  const totalMonthlySIP = summary?.totalMonthlySIP || 0;
  const totalMonthlyEMI = summary?.totalMonthlyEMI || 0;
  const surplus = summary?.totalMonthlySIP ? (100000 - totalMonthlySIP - totalMonthlyEMI) : 0;
  const totalInsuranceCover = summary?.totalInsuranceCover || 0;

  let cashflowStatus = 'Missing Data';
  let cashflowColor = '#9CA3AF';
  if (summary?.sips?.length > 0 || summary?.loans?.length > 0) {
    if (surplus > 20000) {
      cashflowStatus = 'Healthy';
      cashflowColor = '#16A34A';
      calculatedScore += 20;
    } else {
      cashflowStatus = 'High Stress';
      cashflowColor = '#EF4444';
      calculatedScore -= 10;
    }
  }

  let insuranceStatus = 'Missing Data';
  let insuranceColor = '#9CA3AF';
  if (summary?.policies?.length > 0) {
    if (totalInsuranceCover >= 5000000) {
      insuranceStatus = 'Adequate';
      insuranceColor = '#16A34A';
      calculatedScore += 20;
    } else {
      insuranceStatus = 'Underinsured';
      insuranceColor = '#F59E0B';
      calculatedScore += 5;
    }
  }
  
  let goalStatus = summary?.sips?.length > 0 ? 'On Track' : 'Needs Review';
  let goalColor = summary?.sips?.length > 0 ? '#16A34A' : '#F59E0B';

  // AI Overrides from deep analytics
  if (analyticsData?.cashflow) {
    cashflowStatus = analyticsData.cashflow.status;
    cashflowColor = analyticsData.cashflow.statusColor;
    if (analyticsData.cashflow.commitmentRatio < 35) calculatedScore += 5;
  }
  if (analyticsData?.insurance) {
    insuranceStatus = analyticsData.insurance.status;
    insuranceColor = analyticsData.insurance.gap > 0 ? '#EF4444' : '#16A34A';
  }
  if (analyticsData?.goalGap) {
    goalStatus = analyticsData.goalGap.onTrack ? "On Track" : "Needs Review";
    goalColor = analyticsData.goalGap.onTrack ? '#16A34A' : '#F59E0B';
  }

  const healthScore = summary ? Math.min(100, Math.max(0, calculatedScore)) : 0;
  let healthStatus = "Needs Attention";
  let healthColor = "#EF4444";
  let healthStroke = "stroke-red-500";
  if (healthScore > 70) { healthStatus = "HEALTHY"; healthColor = "#16A34A"; healthStroke = "stroke-green-600"; }
  else if (healthScore > 40) { healthStatus = "FAIR"; healthColor = "#F59E0B"; healthStroke = "stroke-orange-500"; }

  return (
    <div className="space-y-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      {/* Financial Health Score */}
      <div className="bg-white border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-8 shadow-sm">
        <div className="relative w-[120px] h-[120px] flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="60" cy="60" fill="transparent" r="54" stroke="#f1f3ff" strokeWidth="8"></circle>
            <circle className={`transition-all duration-1000 ${healthStroke}`} cx="60" cy="60" fill="transparent" r="54" strokeDasharray="339.292" strokeDashoffset={339.292 - (339.292 * healthScore) / 100} strokeWidth="8" strokeLinecap="round"></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-data-mono text-4xl font-bold" style={{ color: healthColor }}>{healthScore}</span>
            <span className="text-[10px] font-label-caps text-text-muted mt-1">{healthStatus}</span>
          </div>
        </div>
        <div className="flex-1 space-y-3 w-full text-center sm:text-left">
          <h3 className="font-label-caps text-text-secondary">FINANCIAL HEALTH SCORE</h3>
          <p className="text-sm text-on-surface-variant mb-4">Score updates dynamically as you ask more questions and we analyze different aspects of your finances.</p>
          
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]" style={{ color: cashflowColor }}>fiber_manual_record</span>
              <span>Cashflow: <strong style={{ color: cashflowColor }}>{cashflowStatus}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]" style={{ color: insuranceColor }}>fiber_manual_record</span>
              <span>Insurance: <strong style={{ color: insuranceColor }}>{insuranceStatus}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]" style={{ color: goalColor }}>fiber_manual_record</span>
              <span>Goals: <strong style={{ color: goalColor }}>{goalStatus}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Render Charts Dynamically */}
      {analyticsData.sip && <SIPGrowthChart {...analyticsData.sip} />}
      {analyticsData.loanVsInvest && <LoanVsInvestChart {...analyticsData.loanVsInvest} />}
      {analyticsData.cashflow && <CashflowDonutChart {...analyticsData.cashflow} />}
      {analyticsData.goalGap && <GoalGapChart {...analyticsData.goalGap} />}
      {analyticsData.insurance && <InsuranceMeterChart {...analyticsData.insurance} />}

    </div>
  );
}
