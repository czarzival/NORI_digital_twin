import React, { useState } from 'react';
import { findOptimalConditions } from '../modelUtils';
import { MAIN_CONFIG, INITIAL_PARAMS } from '../constants';
import { Loader2, ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function OptimisePanel({ currentParams, onApply }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleOptimise = async () => {
    setLoading(true);
    try {
      const res = await findOptimalConditions(currentParams || INITIAL_PARAMS);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border border-border bg-surface p-8 rounded-sm">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-sm font-medium text-primary">Optimal Target Engine</h2>
            <p className="text-xs text-secondary mt-2">Iteratively solves for the highest yield across all 9 dimensions.</p>
          </div>
          <button
            onClick={handleOptimise}
            disabled={loading}
            className="px-6 py-2 bg-accent text-black hover:bg-white/90 transition-all rounded-sm text-xs font-medium flex items-center disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
            {loading ? 'Optimising...' : 'Find Optimal Conditions'}
          </button>
        </div>

        {results && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-border bg-background/50 rounded-sm">
                <span className="text-[10px] uppercase tracking-widest text-secondary block mb-1">Optimal Yield</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-light text-accent font-mono">{results.optimalYield.toFixed(2)}</span>
                  <span className="text-secondary text-xs">g/wk</span>
                </div>
              </div>
              <div className="p-6 border border-border bg-background/50 rounded-sm">
                <span className="text-[10px] uppercase tracking-widest text-secondary block mb-1">Potential Uplift</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-light text-primary font-mono">+{results.gap.toFixed(2)}</span>
                  <span className="text-secondary text-xs">g/wk</span>
                </div>
                <p className="text-[10px] text-secondary mt-2">You're leaving {results.gap.toFixed(1)} g/wk on the table.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-medium">Parameter</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-medium text-right">Current</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-medium text-right">Optimal</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-medium text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {MAIN_CONFIG.map(config => {
                    const current = (currentParams || INITIAL_PARAMS)[config.key];
                    const optimal = results.optimalParams[config.key];
                    const diff = optimal - current;
                    
                    return (
                      <tr key={config.key} className="group hover:bg-white/[0.02]">
                        <td className="py-4 text-xs text-primary">{config.label}</td>
                        <td className="py-4 text-xs text-secondary text-right font-mono">{current.toFixed(2)}</td>
                        <td className="py-4 text-xs text-accent text-right font-mono">{optimal.toFixed(2)}</td>
                        <td className="py-4 text-xs text-right font-mono">
                          <div className="flex items-center justify-end space-x-1">
                            {diff > 0.01 ? (
                              <>
                                <ArrowUp className="w-3 h-3 text-accent" />
                                <span className="text-accent">+{diff.toFixed(2)}</span>
                              </>
                            ) : diff < -0.01 ? (
                              <>
                                <ArrowDown className="w-3 h-3 text-secondary" />
                                <span className="text-secondary">{diff.toFixed(2)}</span>
                              </>
                            ) : (
                              <>
                                <Minus className="w-3 h-3 text-secondary/50" />
                                <span className="text-secondary/50">0.00</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => onApply && onApply(results.optimalParams)}
                className="px-6 py-2 border border-accent/30 text-accent hover:bg-accent/10 transition-all rounded-sm text-[11px] uppercase tracking-widest font-medium"
              >
                Apply Optimal Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
