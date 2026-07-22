import React from 'react';
import SIPGrowthChart from './charts/SIPGrowthChart';
import LoanVsInvestChart from './charts/LoanVsInvestChart';
import CashflowDonutChart from './charts/CashflowDonutChart';
import GoalGapChart from './charts/GoalGapChart';
import InsuranceMeterChart from './charts/InsuranceMeterChart';

const CALCULATORS = [
  { id: 'sip', label: 'SIP Maturity', prompt: 'Calculate my SIP maturity.' },
  { id: 'loan', label: 'Loan Prepayment vs Invest', prompt: 'Compare prepaying my loan versus investing the money.' },
  { id: 'cashflow', label: 'Monthly Cashflow', prompt: 'Analyze my monthly cashflow and savings rate.' },
  { id: 'goal', label: 'Goal Gap Analysis', prompt: 'Analyze my goal gap.' },
  { id: 'insurance', label: 'Insurance Adequacy', prompt: 'Check if I am adequately insured.' }
];

export default function AnalyticsTab({ financialSummary, analyticsData, onGenerateClick, isLoading, analyticsFeedback }) {
  const hasData = analyticsData && Object.values(analyticsData).some(v => v !== null);

  return (
    <div className="space-y-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full relative">
      
      {/* ── Fixed Generator Buttons ── */}
      <div className="bg-surface-container-lowest border border-border rounded-xl p-5 mb-6 shadow-sm">
        <p className="font-label-caps text-xs text-text-muted mb-4 text-center">GENERATE ANALYTICS</p>
        <div className="flex flex-wrap justify-center gap-3">
          {CALCULATORS.map(calc => (
            <button
              key={calc.id}
              onClick={() => onGenerateClick && onGenerateClick(calc.prompt)}
              disabled={isLoading}
              className="px-4 py-2 bg-primary/10 text-primary font-label-caps text-[11px] md:text-xs rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20 hover:scale-105 active:scale-95"
            >
              {calc.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3 animate-pulse">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-primary font-label-caps text-sm">FinSight AI is crunching the numbers...</span>
        </div>
      )}

      {analyticsFeedback && !isLoading && (
        <div className="bg-surface-container-low border border-border rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 flex gap-3 text-text-secondary">
          <span className="material-symbols-outlined text-primary mt-0.5">info</span>
          <div>
            <p className="font-label-caps text-[11px] text-text-muted mb-1 uppercase tracking-widest">AI Feedback</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{analyticsFeedback}</p>
          </div>
        </div>
      )}

      {!hasData && !isLoading && !analyticsFeedback && (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center opacity-70">
          <span className="material-symbols-outlined text-[48px] text-border mb-4">analytics</span>
          <p className="text-text-muted text-sm">Click any button above to generate a chart based on your documents.</p>
        </div>
      )}

      {/* Render Charts Dynamically */}
      {analyticsData.sip && <SIPGrowthChart {...analyticsData.sip} />}
      {analyticsData.loanVsInvest && <LoanVsInvestChart {...analyticsData.loanVsInvest} />}
      {analyticsData.cashflow && <CashflowDonutChart {...analyticsData.cashflow} />}
      {analyticsData.goalGap && <GoalGapChart {...analyticsData.goalGap} />}
      {analyticsData.insurance && <InsuranceMeterChart {...analyticsData.insurance} />}

    </div>
  );
}
