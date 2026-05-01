import React, { useState } from 'react';
import { apiPost } from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Loader2, Info } from 'lucide-react';
import { MAIN_CONFIG, INITIAL_PARAMS } from '../constants';

export default function SimulatorPanel() {
  const [sweepVar, setSweepVar] = useState(MAIN_CONFIG[0].key);
  const selectedConfig = MAIN_CONFIG.find(v => v.key === sweepVar);
  const [min, setMin] = useState(selectedConfig.min);
  const [max, setMax] = useState(selectedConfig.max);
  const [step, setStep] = useState(selectedConfig.step * 10);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleSweepVarChange = (e) => {
    const val = e.target.value;
    setSweepVar(val);
    const cfg = MAIN_CONFIG.find(v => v.key === val);
    setMin(cfg.min);
    setMax(cfg.max);
    setStep(cfg.step * 5);
    setData(null);
  };

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const payload = {
        base_params: INITIAL_PARAMS,
        sweep_variable: sweepVar,
        sweep_min: parseFloat(min),
        sweep_max: parseFloat(max),
        sweep_step: parseFloat(step)
      };
      const res = await apiPost('/simulate', payload);
      
      const results = res.data.results;
      const smoothed = results.map((pt, i) => {
        if (i === 0 || i === results.length - 1) return pt;
        const prev = results[i-1].predicted_growth;
        const next = results[i+1].predicted_growth;
        const current = pt.predicted_growth;
        return {
          ...pt,
          predicted_growth: (prev + current + next) / 3,
          conf_low: Math.max(0, pt.predicted_growth * 0.85),
          conf_high: pt.predicted_growth * 1.15
        };
      });

      setData({ 
        results: smoothed, 
        optimal: res.data.optimal_value, 
        optimalGrowth: res.data.optimal_growth,
        label: selectedConfig.label
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      <div className="lg:w-80 border border-border bg-surface p-8 rounded-sm shrink-0">
        <h2 className="text-[10px] text-labels uppercase tracking-[0.2em] mb-8">Simulation Config</h2>
        
        <div className="space-y-6 text-[11px]">
          <div>
            <label className="text-secondary uppercase tracking-widest mb-2 block">Variable to Sweep</label>
            <select 
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-primary focus:outline-none focus:border-accent transition-colors appearance-none font-mono"
              value={sweepVar}
              onChange={handleSweepVarChange}
            >
              {MAIN_CONFIG.map(v => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-secondary uppercase tracking-widest mb-2 block">Min</label>
              <input type="number" value={min} onChange={(e) => setMin(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-primary focus:outline-none focus:border-accent font-mono" />
            </div>
            <div>
              <label className="text-secondary uppercase tracking-widest mb-2 block">Max</label>
              <input type="number" value={max} onChange={(e) => setMax(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-primary focus:outline-none focus:border-accent font-mono" />
            </div>
            <div className="col-span-2">
              <label className="text-secondary uppercase tracking-widest mb-2 block">Step Size</label>
              <input type="number" value={step} onChange={(e) => setStep(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-primary focus:outline-none focus:border-accent font-mono" />
            </div>
          </div>

          <button 
            onClick={handleSimulate} disabled={loading}
            className="w-full mt-6 flex flex-row items-center justify-center py-3 bg-accent text-black hover:bg-white transition-all text-[11px] uppercase tracking-widest font-bold rounded-sm disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
            Run Simulation
          </button>
        </div>
      </div>

      <div className="flex-1 border border-border bg-surface p-8 rounded-sm min-h-[500px] flex flex-col">
        <h2 className="text-[10px] text-labels uppercase tracking-[0.2em] mb-8">Growth Trajectory</h2>

        {data ? (
          <div className="flex-1 animate-in fade-in duration-500 flex flex-col">
            <div className="flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.results} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="value" 
                    stroke="rgba(255,255,255,0.1)" 
                    tick={{fill: '#666', fontSize: 10, fontFamily: 'monospace'}} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                    label={{ 
                      value: data.label, 
                      position: 'insideBottom', 
                      offset: -20, 
                      fill: '#666', 
                      fontSize: 11, 
                      fontFamily: 'Courier New, monospace' 
                    }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.1)" 
                    tick={{fill: '#666', fontSize: 10, fontFamily: 'monospace'}} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-10}
                    label={{ 
                      value: 'Yield (g/wk)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      offset: -10,
                      fill: '#666', 
                      fontSize: 11, 
                      fontFamily: 'Courier New, monospace' 
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#1dce8a' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  />
                  
                  {data.optimal && (
                    <ReferenceLine 
                      x={data.optimal} 
                      stroke="#1dce8a" 
                      strokeDasharray="4 4" 
                    />
                  )}
                  
                  <Area type="monotone" dataKey="conf_high" stroke="none" fill="rgba(29, 206, 138, 0.05)" />
                  <Area type="monotone" dataKey="predicted_growth" stroke="#1dce8a" strokeWidth={2} fill="rgba(29, 206, 138, 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border flex flex-col space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-secondary uppercase tracking-widest mb-1">Optimal {data.label.split(' ')[0]}</p>
                  <div className="flex items-baseline space-x-3 font-mono">
                    <span className="text-3xl font-light text-primary">{data.optimal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-secondary uppercase tracking-widest mb-1">Peak Yield</p>
                  <span className="text-3xl font-light text-accent font-mono">{data.optimalGrowth.toFixed(2)} <span className="text-xs text-secondary">g/wk</span></span>
                </div>
              </div>

              <div className="bg-[#0f2a1f] p-4 rounded-sm border border-accent/20 flex items-start space-x-3">
                <Info className="w-4 h-4 text-accent mt-0.5" />
                <p className="text-[11px] text-accent leading-relaxed font-mono italic">
                  "Holding all other parameters at current values, {data.label.split(' ')[0]} peaks at {data.optimal.toFixed(1)} with a yield of {data.optimalGrowth.toFixed(2)} g/wk."
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary opacity-30 text-center">
            <p className="text-[11px] uppercase tracking-widest">Select variable and run sweep<br/>to visualize response curve</p>
          </div>
        )}
      </div>
    </div>
  );
}
