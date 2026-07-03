import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GoalGapChart({ goalName, targetAmount, projectedValue, gap, progressPercent, additionalSIPNeeded, onTrack, yearsLeft }) {
  const data = {
    labels: ['Progress'],
    datasets: [
      {
        data: [progressPercent],
        backgroundColor: onTrack ? '#16A34A' : '#F59E0B',
        borderRadius: 4,
        barThickness: 24
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
          label: (context) => `${context.raw}% of goal reached`
        }
      }
    },
    scales: {
      x: { 
        min: 0, max: 100, 
        grid: { display: false },
        ticks: { callback: (value) => value + '%' }
      },
      y: { display: false }
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl p-6 mb-5">
      <h3 className="font-label-caps text-on-surface mb-6">{goalName?.toUpperCase() || 'GOAL'} — {yearsLeft} YEARS REMAINING</h3>
      
      <div className="w-full h-[100px] mb-4">
        <Bar data={data} options={options} />
      </div>
      
      <div className="grid grid-cols-2 divide-x divide-border border border-border rounded-lg mb-4">
        <div className="p-4 text-center">
          <p className="text-[10px] font-label-caps text-text-muted mb-1">CURRENT TRAJECTORY</p>
          <p className="font-data-mono text-on-surface">₹{projectedValue?.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-label-caps text-text-muted mb-1">YOUR GOAL</p>
          <p className="font-data-mono text-on-surface font-bold">₹{targetAmount?.toLocaleString('en-IN')}</p>
        </div>
      </div>
      
      {gap > 0 ? (
        <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
          <p className="text-xs text-orange-800 flex items-center gap-2">
            <span>⚠️</span> Increase SIP by <span className="font-bold">₹{additionalSIPNeeded?.toLocaleString('en-IN')}/month</span> to close this gap
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
          <p className="text-xs text-green-800 flex items-center gap-2">
            <span>✅</span> You are on track!
          </p>
        </div>
      )}
    </div>
  );
}
