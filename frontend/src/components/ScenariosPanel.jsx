import React, { useState, useEffect } from 'react';
import { MAIN_CONFIG } from '../constants';
import { Trash2, TrendingUp, BarChart2 } from 'lucide-react';

export default function ScenariosPanel() {
  const [scenarios, setScenarios] = useState([]);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nori_scenarios');
    if (saved) {
      setScenarios(JSON.parse(saved));
    }
  }, []);

  const deleteScenario = (id) => {
    const updated = scenarios.filter(s => s.id !== id);
    setScenarios(updated);
    localStorage.setItem('nori_scenarios', JSON.stringify(updated));
  };

  const bestYield = scenarios.length > 0 ? Math.max(...scenarios.map(s => s.yield)) : 0;
  const worstYield = scenarios.length > 0 ? Math.min(...scenarios.map(s => s.yield)) : 0;

  const sortedScenarios = [...scenarios].sort((a, b) => b.yield - a.yield);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-primary">Scenario Comparison</h2>
          <p className="text-xs text-secondary mt-1">Review and compare saved environmental configurations.</p>
        </div>
        {scenarios.length > 1 && (
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center space-x-2 text-[11px] uppercase tracking-widest text-accent font-medium hover:opacity-80 transition-opacity"
          >
            <BarChart2 className="w-4 h-4" />
            <span>{showChart ? 'Show Cards' : 'Compare Visual'}</span>
          </button>
        )}
      </div>

      {scenarios.length === 0 ? (
        <div className="border border-dashed border-border p-20 text-center rounded-sm">
          <p className="text-secondary text-sm">No scenarios saved yet. Use the Predict page to save your first one.</p>
        </div>
      ) : showChart ? (
        <div className="border border-border bg-surface p-10 rounded-sm">
           <h3 className="text-xs text-secondary uppercase tracking-widest mb-10">Yield Comparison (g/wk)</h3>
           <div className="space-y-6">
             {sortedScenarios.map(s => (
               <div key={s.id} className="space-y-2">
                 <div className="flex justify-between text-[11px] uppercase tracking-wider">
                   <span className="text-primary">{s.name}</span>
                   <span className="text-accent font-mono">{s.yield.toFixed(2)}</span>
                 </div>
                 <div className="h-2 bg-border w-full rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-accent transition-all duration-1000" 
                    style={{ width: `${(s.yield / (bestYield || 1)) * 100}%` }}
                   />
                 </div>
               </div>
             ))}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {scenarios.map((s) => (
            <div 
              key={s.id} 
              className={`border p-6 bg-surface rounded-sm flex flex-col justify-between transition-all ${
                s.yield === bestYield && scenarios.length > 1 ? 'border-accent ring-1 ring-accent/20' : 'border-border'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-sm font-medium text-primary truncate mr-2">{s.name}</h3>
                  <button onClick={() => deleteScenario(s.id)} className="text-secondary hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-8">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-light text-primary font-mono">{s.yield.toFixed(1)}</span>
                    <span className="text-[10px] text-secondary">g/wk</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold ${
                    s.status === 'Optimal' ? 'text-accent' : 'text-secondary'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div className="space-y-2 mb-8">
                  {MAIN_CONFIG.slice(0, 5).map(cfg => (
                    <div key={cfg.key} className="flex justify-between text-[10px] font-mono">
                      <span className="text-secondary truncate w-24">{cfg.label.split(' ')[0]}</span>
                      <span className="text-primary">{s.params[cfg.key].toFixed(1)}</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-secondary/50 italic text-center pt-2">+ {MAIN_CONFIG.length - 5} more</div>
                </div>
              </div>

              {s.yield === bestYield && scenarios.length > 1 && worstYield < bestYield && (
                <div className="pt-4 border-t border-border flex items-center space-x-2">
                  <TrendingUp className="w-3 h-3 text-accent" />
                  <span className="text-[10px] text-accent font-medium">+{ (s.yield - worstYield).toFixed(1) } vs baseline</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
