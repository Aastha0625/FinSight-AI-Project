import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SIPGrowthChart({ yearlyBreakdown, monthlyAmount, annualReturnPercent, years, futureValue, totalInvested, wealthGained }) {
  if (!yearlyBreakdown || yearlyBreakdown.length === 0) return null;

  const data = {
    labels: yearlyBreakdown.map(d => d.year),
    datasets: [
      {
        label: 'Portfolio Value',
        data: yearlyBreakdown.map(d => d.portfolioValue),
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22,163,74,0.08)',
        fill: 'origin',
        tension: 0.4
      },
      {
        label: 'Amount Invested',
        data: yearlyBreakdown.map(d => d.invested),
        borderColor: '#3B82F6',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ₹${context.raw.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: { display: false },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl p-6 mb-5">
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-label-caps text-on-surface">SIP GROWTH PROJECTION — {years} YEAR VIEW</h3>
        <div className="bg-privacy-bg px-3 py-1 rounded border border-primary/20">
          <p className="text-[10px] text-primary font-label-caps">WEALTH GAINED</p>
          <p className="font-data-mono text-primary font-bold">₹{wealthGained?.toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div className="w-full h-[260px]">
        <Line data={data} options={options} />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6 text-center border-t border-border pt-4">
        <div>
          <p className="text-[10px] font-label-caps text-text-muted mb-1">Total Invested</p>
          <p className="font-data-mono text-blue-600 font-medium">₹{totalInvested?.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-[10px] font-label-caps text-text-muted mb-1">Portfolio Value</p>
          <p className="font-data-mono text-green-600 font-medium">₹{futureValue?.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-[10px] font-label-caps text-text-muted mb-1">Wealth Gained</p>
          <p className="font-data-mono text-green-600 font-bold">₹{wealthGained?.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}
