import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CashflowDonutChart({ breakdown, monthlyIncome, totalCommitments, surplus, commitmentRatio, status, statusColor }) {
  if (!breakdown || breakdown.length === 0) return null;

  const data = {
    labels: breakdown.map(b => b.label),
    datasets: [
      {
        data: breakdown.map(b => b.value),
        backgroundColor: breakdown.map(b => b.color),
        borderWidth: 0
      }
    ]
  };

  const options = {
    cutout: '72%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `₹${context.raw.toLocaleString('en-IN')}`
        }
      }
    }
  };

  let statusMsg = "";
  if (status === 'Healthy') statusMsg = "Less than 35% of income committed. Well balanced.";
  else if (status === 'Manageable') statusMsg = "35-50% committed. Monitor closely.";
  else statusMsg = "Over 50% committed. Consider restructuring.";

  return (
    <div className="bg-white border border-border rounded-xl p-6 mb-5">
      <h3 className="font-label-caps text-on-surface mb-6">MONTHLY CASHFLOW BREAKDOWN</h3>
      
      <div className="relative w-full h-[220px]">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-data-mono text-[28px] font-bold text-on-surface leading-none">{commitmentRatio}%</span>
          <span className="text-[11px] font-label-caps text-text-muted mt-1">COMMITTED</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        {breakdown.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
            <div className="flex-1 flex justify-between">
              <span className="text-xs text-text-secondary">{item.label}</span>
              <span className="text-xs font-bold font-data-mono">₹{item.value.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 rounded-lg flex flex-col border border-black/5" style={{ backgroundColor: `${statusColor}15` }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }}></span>
          <span className="font-bold text-sm" style={{ color: statusColor }}>{status}</span>
        </div>
        <p className="text-[11px] text-on-surface-variant ml-4">{statusMsg}</p>
      </div>
    </div>
  );
}
