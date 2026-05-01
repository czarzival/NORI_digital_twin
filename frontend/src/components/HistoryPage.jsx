import React, { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPatch } from '../lib/api';
import { Loader2, CheckCircle2, Edit2 } from 'lucide-react';

export default function HistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet('/predictions');
      setPredictions(data);
    } catch (err) {
      console.error('Failed to fetch predictions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActual = async (id, value) => {
    try {
      await apiPatch(`/predictions/${id}`, { actual_yield: parseFloat(value) });
      fetchPredictions();
    } catch (err) {
      console.error('Failed to update actual yield', err);
    }
  };

  const stats = useMemo(() => {
    if (predictions.length === 0) return { total: 0, avg: 0, logged: 0 };
    const logged = predictions.filter(p => p.actual_yield !== null).length;
    const avg = predictions.reduce((acc, p) => acc + p.predicted_yield, 0) / predictions.length;
    return { total: predictions.length, avg, logged };
  }, [predictions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-[10px] text-labels uppercase tracking-[0.2em]">Prediction History</h1>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-[#1a1a1a] rounded-sm px-3.5 py-2 border border-white/5 flex items-baseline gap-2">
            <span className="text-[10px] text-[#666] uppercase tracking-widest">Total predictions</span>
            <span className="text-[13px] text-[#e8e8e6] font-mono">{stats.total}</span>
          </div>
          <div className="bg-[#1a1a1a] rounded-sm px-3.5 py-2 border border-white/5 flex items-baseline gap-2">
            <span className="text-[10px] text-[#666] uppercase tracking-widest">Avg yield</span>
            <span className="text-[13px] text-accent font-mono">{stats.avg.toFixed(1)} g/wk</span>
          </div>
          <div className="bg-[#1a1a1a] rounded-sm px-3.5 py-2 border border-white/5 flex items-baseline gap-2">
            <span className="text-[10px] text-[#666] uppercase tracking-widest">Actuals logged</span>
            <span className="text-[13px] text-[#e8e8e6] font-mono">{stats.logged}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-white/5">
                <th className="p-4 text-[10px] text-[#666] uppercase tracking-widest font-normal">Date</th>
                <th className="p-4 text-[10px] text-[#666] uppercase tracking-widest font-normal">Yield</th>
                <th className="p-4 text-[10px] text-[#666] uppercase tracking-widest font-normal">Bounds</th>
                <th className="p-4 text-[10px] text-[#666] uppercase tracking-widest font-normal">Status</th>
                <th className="p-4 text-[10px] text-[#666] uppercase tracking-widest font-normal">Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {predictions.map(pred => (
                <tr key={pred.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4">
                    <div className="text-[12px] text-[#e8e8e6]">{new Date(pred.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-[10px] text-[#666] font-mono">{new Date(pred.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-[13px] font-mono text-[#e8e8e6]">{pred.predicted_yield.toFixed(1)} <span className="text-[10px] text-[#555]">g/wk</span></span>
                  </td>
                  <td className="p-4">
                    <div className="text-[11px] text-[#666] font-mono">
                      {pred.lower_bound.toFixed(1)} – {pred.upper_bound.toFixed(1)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest ${
                      pred.status === 'Excellent' ? 'bg-[#0f2a1f] text-accent' : 
                      pred.status === 'Good' ? 'bg-[#1a1a1a] text-[#888]' : 
                      pred.status === 'Fair' ? 'bg-[#2a1f00] text-[#f0a500]' : 'bg-[#2a0f0f] text-[#e24b4a]'
                    }`}>
                      {pred.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <ActualYieldCell 
                      initialValue={pred.actual_yield} 
                      onUpdate={(val) => handleUpdateActual(pred.id, val)} 
                    />
                  </td>
                </tr>
              ))}
              {predictions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-[#555] font-mono text-xs italic">No predictions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActualYieldCell({ initialValue, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || '');

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input 
          type="number" autoFocus className="w-20 bg-black border border-border text-[12px] px-2 py-1 text-accent focus:outline-none focus:border-accent/50 rounded-sm font-mono"
          value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onUpdate(value)}
          onBlur={() => setIsEditing(false)}
        />
        <button onClick={() => { onUpdate(value); setIsEditing(false); }} className="text-accent hover:text-white transition-colors">
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 cursor-pointer group/cell" onClick={() => setIsEditing(true)}>
      {initialValue !== null ? (
        <span className="text-[13px] font-mono text-accent">{initialValue.toFixed(1)}</span>
      ) : (
        <span className="text-[12px] text-[#444]">—</span>
      )}
      <Edit2 className="w-3 h-3 text-[#333] group-hover/cell:text-[#666] opacity-0 group-hover:opacity-100 transition-all" />
    </div>
  );
}
