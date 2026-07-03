import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function InsuranceMeterChart({ recommendedCover, currentCover, gap, coveragePercent, status, segments }) {
  if (!segments) return null;

  const data = {
    labels: ['Coverage'],
    datasets: segments.map(seg => ({
      label: seg.label,
      data: [seg.value],
      backgroundColor: seg.color,
      barThickness: 24
    }))
  };

  const options = {
    indexAxis: 'y',
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
      x: { 
        stacked: true, 
        min: 0, max: Math.max(recommendedCover, currentCover),
        grid: { display: false },
        ticks: { display: false }
      },
      y: { stacked: true, display: false }
    }
  };

  const isAdequate = gap <= 0;

  return (
    <div className="bg-white border border-border rounded-xl p-6 mb-5">
      <h3 className="font-label-caps text-on-surface mb-6">INSURANCE COVERAGE ANALYSIS</h3>
      
      <div className="w-full h-[100px] mb-4">
        <Bar data={data} options={options} />
      </div>
      
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-surface-container-low p-3 rounded-lg text-center">
          <p className="text-[10px] font-label-caps text-text-muted mb-1">CURRENT COVER</p>
          <p className="font-data-mono text-green-600 font-bold">₹{currentCover?.toLocaleString('en-IN')}</p>
        </div>
        <div className="flex-1 bg-surface-container-low p-3 rounded-lg text-center">
          <p className="text-[10px] font-label-caps text-text-muted mb-1">GAP</p>
          {isAdequate ? (
            <p className="font-data-mono text-green-600 font-bold">Fully covered ✓</p>
          ) : (
            <p className="font-data-mono text-red-600 font-bold">₹{gap?.toLocaleString('en-IN')}</p>
          )}
        </div>
      </div>
      
      <div className={`p-3 rounded-lg border ${isAdequate ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
        <p className="text-xs font-bold text-center flex items-center justify-center gap-2">
          <span>{isAdequate ? '🛡️' : '⚠️'}</span> {status}
        </p>
      </div>
    </div>
  );
}
