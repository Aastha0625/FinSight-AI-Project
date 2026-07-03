import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LoanVsInvestChart({ scenarios, interestSaved, investmentReturns, recommendation, reasoning }) {
  if (!scenarios || scenarios.length === 0) return null;

  const data = {
    labels: scenarios.map(s => s.label),
    datasets: [
      {
        data: scenarios.map(s => s.value),
        backgroundColor: scenarios.map(s => s.color),
        borderRadius: 4,
        barThickness: 32
      }
    ]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `₹${context.raw.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { display: false },
      y: { grid: { display: false } }
    }
  };

  const isInvest = recommendation?.toUpperCase() === 'INVEST';
  const bannerColor = isInvest ? 'bg-privacy-bg text-green-700' : 'bg-red-50 text-red-700';

  return (
    <div className="bg-white border border-border rounded-xl p-6 mb-5">
      <h3 className="font-label-caps text-on-surface mb-6">PREPAY LOAN VS INVEST COMPARISON</h3>
      <div className="w-full h-[160px] mb-4">
        <Bar data={data} options={options} />
      </div>
      <div className={`${bannerColor} p-4 rounded-lg border border-black/5 flex items-center gap-3`}>
        <span className="text-[20px]">{isInvest ? '📈' : '🛑'}</span>
        <p className="text-sm font-body-md">
          Recommendation: <span className="font-bold">{recommendation}</span>. {reasoning}
        </p>
      </div>
    </div>
  );
}
