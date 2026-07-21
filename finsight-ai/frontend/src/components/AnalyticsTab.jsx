import React from 'react';
import SIPGrowthChart from './charts/SIPGrowthChart';
import LoanVsInvestChart from './charts/LoanVsInvestChart';
import CashflowDonutChart from './charts/CashflowDonutChart';
import GoalGapChart from './charts/GoalGapChart';
import InsuranceMeterChart from './charts/InsuranceMeterChart';

export default function AnalyticsTab({ financialSummary, analyticsData, suggestions, onSuggestionClick, isLoading }) {
  const hasData = analyticsData && Object.values(analyticsData).some(v => v !== null);

  if (!hasData && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in">
        <span className="material-symbols-outlined text-[64px] text-border mb-4">bar_chart</span>
        <h3 className="font-headline-sm text-on-surface mb-2">No analysis yet</h3>
        <p className="text-text-muted text-sm max-w-md mb-8">
          Select an option below or ask in chat to generate visual analytics.
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
          {suggestions && suggestions.map(s => (
            <button
              key={s}
              onClick={() => onSuggestionClick && onSuggestionClick(s)}
              className="px-4 py-2 border border-primary text-primary font-label-caps text-sm rounded-full hover:bg-privacy-bg transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full relative">
      {isLoading && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3 animate-pulse">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-primary font-label-caps text-sm">FinSight AI is crunching the numbers...</span>
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
