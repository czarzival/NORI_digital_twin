import React, { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost, apiPatch } from '../lib/api';
import { Calendar, Target, Activity, Loader2, Info, Plus, ChevronRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function CyclePlannerPanel({ currentYield: initialYield, result }) {
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  // New Cycle Form State
  const [newName, setNewName] = useState('Cycle ' + (cycles.length + 1));
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [harvestTarget, setHarvestTarget] = useState(300);
  const [weeklyYield, setWeeklyYield] = useState(initialYield || 25);

  useEffect(() => {
    fetchCycles();

    // Realtime subscription for cycle updates (e.g. harvest status)
    const channel = supabase
      .channel('realtime:cycles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cycles' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setCycles(prev => {
              const exists = prev.find(c => c.id === payload.new.id);
              if (exists) {
                return prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c);
              }
              return [payload.new, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet('/cycles');
      setCycles(data);
      if (data.length > 0 && !selectedCycleId) {
        setSelectedCycleId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch cycles', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      // Calculate week number from date (simplified for this demo)
      const startWeek = Math.ceil((new Date(startDate).getDate() + 6) / 7) + (new Date(startDate).getMonth() * 4);
      
      const payload = {
        name: newName,
        start_date: startDate,
        start_week: startWeek,
        harvest_target: harvestTarget,
        weekly_yield: result?.yield || weeklyYield,
        lower_bound: result?.lower || (weeklyYield * 0.85),
        upper_bound: result?.upper || (weeklyYield * 1.15)
      };

      const { data } = await apiPost('/cycles', payload);
      setCycles([data, ...cycles]);
      setSelectedCycleId(data.id);
      setShowNewForm(false);
    } catch (err) {
      console.error('Failed to create cycle', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogBiomass = async (cycleId, weekNumber, actualBiomass) => {
    try {
      await apiPatch(`/cycles/${cycleId}/checkin`, {
        week_number: weekNumber,
        actual_biomass: parseFloat(actualBiomass)
      });
      fetchCycles(); // Refresh to show update
    } catch (err) {
      console.error('Failed to log biomass', err);
    }
  };

  const handleHarvest = async (cycleId, actualYield) => {
    setActionLoading(true);
    try {
      const { data } = await apiPost(`/cycles/${cycleId}/harvest`, {
        actual_yield: actualYield ? parseFloat(actualYield) : null
      });
      // Update local state directly for instant feedback
      setCycles(prev => prev.map(c => c.id === cycleId ? data : c));
    } catch (err) {
      console.error('Failed to harvest', err);
    } finally {
      setActionLoading(false);
    }
  };

  const selectedCycle = useMemo(() => 
    cycles.find(c => c.id === selectedCycleId), 
    [cycles, selectedCycleId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] animate-in fade-in duration-500">
      {/* Left Panel: Saved Cycles */}
      <div className="lg:w-[280px] shrink-0 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] text-labels uppercase tracking-[0.2em]">Saved Cycles</h2>
          <button 
            onClick={() => { setShowNewForm(true); setSelectedCycleId(null); }}
            className="p-1 hover:bg-white/5 rounded-sm transition-colors text-accent"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {cycles.length === 0 ? (
          <p className="text-[#555] text-[12px] font-mono italic">No cycles yet. Start one on the right.</p>
        ) : (
          <div className="space-y-2">
            {cycles.map(cycle => (
              <button
                key={cycle.id}
                onClick={() => { setSelectedCycleId(cycle.id); setShowNewForm(false); }}
                className={`w-full text-left p-4 rounded-sm border transition-all flex flex-col gap-1 ${
                  selectedCycleId === cycle.id 
                    ? 'bg-surface border-accent border-l-2' 
                    : 'bg-surface/50 border-border hover:border-border/80'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[13px] text-[#e8e8e6] font-medium truncate">{cycle.name}</span>
                  <span className={`text-[9px] uppercase tracking-tighter px-1.5 py-0.5 rounded-sm ${
                    cycle.status === 'active' ? 'bg-[#0f2a1f] text-accent' : 'bg-[#1a1a1a] text-[#666]'
                  }`}>
                    {cycle.status === 'harvested' ? 'Completed' : cycle.status}
                  </span>
                </div>
                <span className="text-[11px] text-[#666] font-mono">
                  Started {new Date(cycle.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel: Detail or Form */}
      <div className="flex-1 bg-surface border border-border rounded-sm p-8">
        {showNewForm || !selectedCycle ? (
          <div className="max-w-md mx-auto space-y-8 py-4">
            <h2 className="text-[10px] text-labels uppercase tracking-[0.2em] mb-10 text-center">Plan New Growth Cycle</h2>
            <form onSubmit={handleCreateCycle} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-labels uppercase tracking-widest">Cycle Name</label>
                <input 
                  type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#111] border-[0.5px] border-white/15 text-[#e8e8e6] font-mono text-[13px] px-[14px] py-[10px] rounded-[4px] focus:border-accent/50 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-labels uppercase tracking-widest">Start Date</label>
                <input 
                  type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#111] border-[0.5px] border-white/15 text-[#e8e8e6] font-mono text-[13px] px-[14px] py-[10px] rounded-[4px] focus:border-accent/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-labels uppercase tracking-widest">Target (g/m²)</label>
                  <input 
                    type="number" value={harvestTarget} onChange={(e) => setHarvestTarget(parseInt(e.target.value))}
                    className="w-full bg-[#111] border-[0.5px] border-white/15 text-[#e8e8e6] font-mono text-[13px] px-[14px] py-[10px] rounded-[4px] focus:border-accent/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-labels uppercase tracking-widest">Weekly Yield</label>
                  <input 
                    type="number" step="0.1" value={weeklyYield} onChange={(e) => setWeeklyYield(parseFloat(e.target.value))}
                    className="w-full bg-[#111] border-[0.5px] border-white/15 text-[#e8e8e6] font-mono text-[13px] px-[14px] py-[10px] rounded-[4px] focus:border-accent/50 focus:outline-none"
                  />
                </div>
              </div>

              {result && (
                <div className="p-4 bg-[#0f2a1f] border border-accent/20 rounded-sm">
                  <p className="text-[10px] text-accent font-mono leading-relaxed">
                    Auto-filled from latest prediction: <strong>{result.yield.toFixed(1)} g/wk</strong>
                  </p>
                </div>
              )}

              <button 
                type="submit" disabled={actionLoading}
                className="w-full py-3 border border-accent text-accent hover:bg-accent/5 transition-all rounded-sm text-[11px] uppercase tracking-widest font-bold flex justify-center items-center"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Start Growth Cycle
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#e8e8e6]">{selectedCycle.name}</h2>
                <p className="text-[11px] text-[#666] font-mono uppercase tracking-widest">
                  Target: {selectedCycle.harvest_target} g/m² · Yield: {selectedCycle.weekly_yield.toFixed(1)} g/wk
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest ${
                  selectedCycle.status === 'active' ? 'bg-[#0f2a1f] text-accent border border-accent/20' : 'bg-[#1a1a1a] text-[#666] border border-white/5'
                }`}>
                  {selectedCycle.status === 'harvested' ? 'Completed' : selectedCycle.status}
                </span>
              </div>
            </div>

            {/* 12-week Projection Chart */}
            <div className="space-y-4">
              <h3 className="text-[10px] text-labels uppercase tracking-[0.2em] mb-6">12-Week Growth Projection</h3>
              <div className="space-y-3">
                {selectedCycle.cycle_checkins
                  .sort((a, b) => a.week_number - b.week_number)
                  .map((checkin, i) => {
                    const isPassed = i < 4; // Mock logic for "has week passed"
                    return (
                      <div key={checkin.id} className="flex items-center gap-4 group">
                        <div className="w-10 text-[10px] text-[#555] font-mono">Wk {checkin.week_number}</div>
                        <div className="flex-1 relative h-6 bg-[#0d0d0d] rounded-sm overflow-hidden border border-white/5">
                          {/* Projected Bar */}
                          <div 
                            className="absolute h-full bg-[#1dce8a]/20 transition-all duration-700 ease-out"
                            style={{ width: `${Math.min(100, (checkin.projected_biomass / (selectedCycle.harvest_target * 1.5)) * 100)}%` }}
                          />
                          {/* Actual Bar */}
                          {checkin.actual_biomass && (
                            <div 
                              className="absolute h-full bg-[#1dce8a] transition-all duration-700 ease-out"
                              style={{ width: `${Math.min(100, (checkin.actual_biomass / (selectedCycle.harvest_target * 1.5)) * 100)}%` }}
                            />
                          )}
                          {/* Target Threshold Marker */}
                          <div 
                            className="absolute top-0 h-full w-[1px] border-l border-dashed border-[#f0a500]/50 z-10"
                            style={{ left: `${(selectedCycle.harvest_target / (selectedCycle.harvest_target * 1.5)) * 100}%` }}
                          />
                        </div>
                        <div className="w-32 flex items-center justify-between text-[11px] font-mono">
                          {checkin.actual_biomass ? (
                            <span className={`${
                              checkin.actual_biomass < checkin.projected_biomass * 0.85 ? 'text-[#f0a500]' : 
                              checkin.actual_biomass >= checkin.projected_biomass ? 'text-accent' : 'text-[#888]'
                            }`}>
                              {checkin.actual_biomass.toFixed(1)} g
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[#333]">{checkin.projected_biomass.toFixed(1)} g</span>
                              {selectedCycle.status === 'active' && checkin.week_number <= 5 && (
                                <LogInput onLog={(val) => handleLogBiomass(selectedCycle.id, checkin.week_number, val)} />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {selectedCycle.status === 'active' && (
              <div className="pt-10 border-t border-border">
                <HarvestAction onHarvest={(val) => handleHarvest(selectedCycle.id, val)} />
              </div>
            )}
            
            {selectedCycle.status === 'harvested' && (
              <div className="p-6 bg-[#1a1a1a] rounded-sm border border-accent/20 flex justify-between items-center animate-in zoom-in-95 duration-500">
                <div>
                  <p className="text-[10px] text-accent uppercase tracking-widest mb-1 font-bold">Harvest Completed</p>
                  <p className="text-2xl font-mono text-white">{selectedCycle.actual_yield?.toFixed(2)} <span className="text-sm text-secondary">g/wk</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#666] uppercase tracking-widest mb-1">Harvest Date</p>
                  <p className="text-xs text-[#e8e8e6] font-mono">{new Date(selectedCycle.harvested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LogInput({ onLog }) {
  const [val, setVal] = useState('');
  const [show, setShow] = useState(false);

  if (!show) return <button onClick={() => setShow(true)} className="text-[9px] text-[#555] hover:text-accent uppercase tracking-widest transition-colors">Log</button>;

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1 duration-200">
      <input 
        type="number" autoFocus className="w-16 bg-[#000] border border-border text-[10px] px-1 py-0.5 text-accent focus:outline-none focus:border-accent/50 rounded-sm"
        value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onLog(val)}
      />
      <button onClick={() => onLog(val)} className="text-accent hover:text-white transition-colors"><CheckCircle2 className="w-3 h-3" /></button>
    </div>
  );
}

function HarvestAction({ onHarvest }) {
  const [show, setShow] = useState(false);
  const [val, setVal] = useState('');

  if (!show) {
    return (
      <button 
        onClick={() => setShow(true)}
        className="px-6 py-2 border border-[#f0a500] text-[#f0a500] hover:bg-[#f0a500]/5 text-[11px] uppercase tracking-widest font-bold rounded-sm transition-all"
      >
        Mark as Harvested
      </button>
    );
  }

  return (
    <div className="p-6 border border-dashed border-[#f0a500]/30 rounded-sm bg-[#f0a500]/5 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-[#f0a500]" />
        <p className="text-[11px] text-[#f0a500] font-mono">Record the final actual yield for this cycle.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-[200px]">
          <input 
            type="number" placeholder="Final yield (g/wk)" 
            className="w-full bg-[#111] border border-white/10 text-[#e8e8e6] font-mono text-[12px] px-3 py-2 rounded-sm focus:border-[#f0a500]/50 outline-none"
            value={val} onChange={(e) => setVal(e.target.value)}
          />
        </div>
        <button 
          onClick={() => onHarvest(val)}
          className="bg-[#f0a500] text-black px-6 py-2 text-[11px] uppercase tracking-widest font-bold rounded-sm hover:bg-white transition-all"
        >
          Confirm Harvest
        </button>
        <button onClick={() => setShow(false)} className="text-[#666] text-[11px] uppercase tracking-widest">Cancel</button>
      </div>
    </div>
  );
}
