import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const RAMP = [0.05, 0.12, 0.28, 0.52, 0.75, 1.0, 1.0, 1.0, 0.98, 0.95, 0.90, 0.84];
const HARVEST_THRESHOLD = 300;

export default function GrowthChart({ result }) {
  const { chartData, peakBiomass, harvestWeek } = useMemo(() => {
    if (!result) return { chartData: null, peakBiomass: 0, harvestWeek: null };

    const { yield: predYield, lower, upper } = result;
    
    const biomass = [0];
    const lowerBiomass = [0];
    const upperBiomass = [0];
    
    let firstHarvestWk = null;

    for (let w = 1; w <= 12; w++) {
      const rampVal = RAMP[w - 1];
      biomass[w] = biomass[w - 1] + predYield * rampVal;
      lowerBiomass[w] = lowerBiomass[w - 1] + lower * rampVal;
      upperBiomass[w] = upperBiomass[w - 1] + upper * rampVal;

      if (firstHarvestWk === null && biomass[w] >= HARVEST_THRESHOLD) {
        firstHarvestWk = w;
      }
    }

    const labels = Array.from({ length: 13 }, (_, i) => i);

    const data = {
      labels,
      datasets: [
        {
          label: 'Projected biomass',
          data: biomass,
          borderColor: '#1dce8a',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#1dce8a',
          tension: 0.4,
          z: 10,
        },
        {
          label: 'Upper bound',
          data: upperBiomass,
          borderColor: 'rgba(29, 206, 138, 0.2)',
          backgroundColor: 'rgba(29, 206, 138, 0.08)',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: '+1',
          tension: 0.4,
        },
        {
          label: 'Lower bound',
          data: lowerBiomass,
          borderColor: 'rgba(29, 206, 138, 0.2)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.4,
        },
      ],
    };

    return {
      chartData: data,
      peakBiomass: biomass[12],
      harvestWeek: firstHarvestWk,
    };
  }, [result]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#111',
        titleFont: { family: 'monospace' },
        bodyFont: { family: 'monospace' },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            yMin: HARVEST_THRESHOLD,
            yMax: HARVEST_THRESHOLD,
            borderColor: 'rgba(240, 165, 0, 0.5)',
            borderWidth: 1,
            borderDash: [6, 4],
            label: {
              display: true,
              content: 'Harvest target',
              position: 'end',
              backgroundColor: 'transparent',
              color: '#f0a500',
              font: { size: 10, family: 'monospace' },
              yAdjust: -10,
            },
          },
          line2: harvestWeek ? {
            type: 'line',
            xMin: harvestWeek,
            xMax: harvestWeek,
            borderColor: 'rgba(29, 206, 138, 0.4)',
            borderWidth: 1,
            borderDash: [4, 4],
            label: {
              display: true,
              content: `Wk ${harvestWeek}`,
              position: 'start',
              backgroundColor: 'transparent',
              color: '#1dce8a',
              font: { size: 10, family: 'monospace' },
              xAdjust: 10,
            },
          } : undefined,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Week', color: '#666', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#666', font: { size: 10, family: 'monospace' } },
        border: { color: 'rgba(255,255,255,0.08)' },
      },
      y: {
        title: { display: true, text: 'Biomass (g/m²)', color: '#666', font: { size: 10 } },
        min: 0,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#666', font: { size: 10, family: 'monospace' } },
        border: { color: 'rgba(255,255,255,0.08)' },
      },
    },
  };

  if (!result) return null;

  return (
    <div className="mt-6 border-[0.5px] border-border bg-surface p-4 rounded-lg animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] text-labels uppercase tracking-[0.1em]">12-week growth projection</span>
        <div className="flex gap-2">
          <div className="bg-[#1a1a1a] rounded px-[10px] py-1 text-[11px] flex items-center gap-[6px] border border-border/50">
            <span className="text-secondary">Peak biomass</span>
            <span className="text-primary font-mono">{peakBiomass.toFixed(1)} g/m²</span>
          </div>
          <div className="bg-[#1a1a1a] rounded px-[10px] py-1 text-[11px] flex items-center gap-[6px] border border-border/50">
            <span className="text-secondary">Harvest at wk</span>
            <span className="text-accent font-mono font-bold">{harvestWeek || `>12`}</span>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <Line data={chartData} options={options} />
      </div>

      <div className="flex flex-row mt-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-[2px] bg-[#1dce8a]"></div>
          <span className="text-[10px] text-secondary">Projected biomass</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-[2px] border-t border-dashed border-[#1dce8a]/40"></div>
          <span className="text-[10px] text-secondary">Confidence band</span>
        </div>
      </div>
    </div>
  );
}
