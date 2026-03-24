import React, { useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Loader2 } from 'lucide-react';

const API_URL = 'https://nori-digital-twin.onrender.com/';

const SWEEP_VARIABLES = [
  { id: 'temperature', label: 'Temperature (°C)', defaultMin: 20, defaultMax: 35, defaultStep: 1 },
  { id: 'salinity', label: 'Salinity (ppt)', defaultMin: 15, defaultMax: 35, defaultStep: 1 },
  { id: 'pH', label: 'pH Level', defaultMin: 6.5, defaultMax: 9.0, defaultStep: 0.1 },
  { id: 'dissolved_oxygen', label: 'Dissolved O2 (mg/L)', defaultMin: 3, defaultMax: 10, defaultStep: 0.5 },
  { id: 'light_hours', label: 'Light Hours (hrs)', defaultMin: 6, defaultMax: 16, defaultStep: 1 },
  { id: 'stocking_density', label: 'Stocking Density (g/m²)', defaultMin: 1, defaultMax: 50, defaultStep: 2 },
  { id: 'nutrient_level', label: 'Nutrient Level (%)', defaultMin: 0, defaultMax: 100, defaultStep: 5 },
  { id: 'tidal_amplitude', label: 'Tidal Amplitude (m)', defaultMin: 0.1, defaultMax: 3.0, defaultStep: 0.2 },
  { id: 'tidal_frequency', label: 'Tidal Freq (cyc/day)', defaultMin: 0.5, defaultMax: 4.0, defaultStep: 0.5 },
];

const BASE_PARAMS = {
  temperature: 28.0, salinity: 25.0, pH: 7.8, dissolved_oxygen: 6.5, 
  light_hours: 12.0, stocking_density: 20.0, nutrient_level: 50.0, 
  tidal_amplitude: 1.5, tidal_frequency: 2.0
};

export default function SimulatorPanel() {
  const [sweepVar, setSweepVar] = useState(SWEEP_VARIABLES[0].id);
  const selectedConfig = SWEEP_VARIABLES.find(v => v.id === sweepVar);
  const [min, setMin] = useState(selectedConfig.defaultMin);
  const [max, setMax] = useState(selectedConfig.defaultMax);
  const [step, setStep] = useState(selectedConfig.defaultStep);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleSweepVarChange = (e) => {
    const val = e.target.value;
    setSweepVar(val);
    const cfg = SWEEP_VARIABLES.find(v => v.id === val);
    setMin(cfg.defaultMin);
    setMax(cfg.defaultMax);
    setStep(cfg.defaultStep);
    setData(null);
  };

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const payload = {
        base_params: BASE_PARAMS,
        sweep_variable: sweepVar,
        sweep_min: parseFloat(min),
        sweep_max: parseFloat(max),
        sweep_step: parseFloat(step)
      };
      const res = await axios.post(`${API_URL}/simulate`, payload);
      const processedResults = res.data.results.map(pt => ({
        ...pt,
        conf_low: Math.max(0, pt.predicted_growth * 0.85),
        conf_high: pt.predicted_growth * 1.15
      }));
      setData({ results: processedResults, optimal: res.data.optimal_value, optimalGrowth: res.data.optimal_growth });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-80 border border-border bg-surface p-8 rounded-sm shrink-0">
        <h2 className="text-sm font-medium text-primary mb-8">Simulation Config</h2>
        
        <div className="space-y-6 text-sm">
          <div>
            <label className="text-secondary text-xs mb-2 block">Variable to Sweep</label>
            <select 
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors appearance-none"
              value={sweepVar}
              onChange={handleSweepVarChange}
            >
              {SWEEP_VARIABLES.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-secondary text-xs mb-2 block">Min</label>
              <input type="number" value={min} onChange={(e) => setMin(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-primary focus:outline-none focus:border-secondary font-mono" />
            </div>
            <div>
              <label className="text-secondary text-xs mb-2 block">Max</label>
              <input type="number" value={max} onChange={(e) => setMax(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-primary focus:outline-none focus:border-secondary font-mono" />
            </div>
            <div className="col-span-2">
              <label className="text-secondary text-xs mb-2 block">Step Size</label>
              <input type="number" value={step} onChange={(e) => setStep(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-primary focus:outline-none focus:border-secondary font-mono" />
            </div>
          </div>

          <button 
            onClick={handleSimulate} disabled={loading}
            className="w-full mt-6 flex flex-row items-center justify-center py-2.5 border border-border bg-background hover:bg-border/50 text-white transition-colors duration-150 text-xs font-medium rounded-sm disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
            Run Simulation
          </button>
        </div>
      </div>

      <div className="flex-1 border border-border bg-surface p-8 rounded-sm min-h-[500px] flex flex-col">
        <h2 className="text-sm font-medium text-primary mb-8">Growth Trajectory</h2>

        {data ? (
          <div className="flex-1 animate-in fade-in duration-300 flex flex-col">
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.results} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#1a1a1a" />
                  <XAxis 
                    dataKey="value" 
                    stroke="#333" 
                    tick={{fill: '#666', fontSize: 11, fontFamily: 'monospace'}} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#333" 
                    tick={{fill: '#666', fontSize: 11, fontFamily: 'monospace'}} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '4px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#666', fontFamily: 'monospace', marginBottom: '4px' }}
                    cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  
                  {data.optimal && (
                    <ReferenceLine x={data.optimal} stroke="#00d4aa" strokeDasharray="3 3" label={{ position: 'top', value: 'Optimal', fill: '#00d4aa', fontSize: 11, fontFamily: 'monospace' }} />
                  )}
                  
                  <Area type="monotone" dataKey="conf_high" stroke="none" fill="#1a1a1a" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="predicted_growth" stroke="#fff" strokeWidth={1} fill="#111" />
                  <Area type="monotone" dataKey="conf_low" stroke="none" fill="#0d0d0d" fillOpacity={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
              <div>
                <p className="text-[11px] text-secondary uppercase tracking-widest mb-1">Optimal Value</p>
                <div className="flex items-baseline space-x-3 font-mono">
                  <span className="text-2xl font-light text-primary">{data.optimal}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-secondary uppercase tracking-widest mb-1">Max Yield</p>
                <span className="text-2xl font-light text-accent font-mono">{data.optimalGrowth} <span className="text-sm text-secondary">g/wk</span></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary opacity-60">
            <p className="text-sm">Enter parameters to simulate growth trajectory.</p>
          </div>
        )}
      </div>
    </div>
  );
}
