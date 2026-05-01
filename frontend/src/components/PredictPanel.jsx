import React, { useState, useEffect } from 'react';
import { apiPost } from '../lib/api';
import { Loader2, Info, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { MAIN_CONFIG, INITIAL_PARAMS } from '../constants';
import { calculateSensitivity, getTopLeverDelta } from '../modelUtils';
import GrowthChart from './GrowthChart';

export default function PredictPanel({ currentParams: propParams, onParamsChange }) {
  const [params, setParams] = useState(propParams || INITIAL_PARAMS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Feature 3 states
  const [importance, setImportance] = useState([]);
  const [topLever, setTopLever] = useState(null);
  const [showImportance, setShowImportance] = useState(false);

  useEffect(() => {
    if (propParams) setParams(propParams);
  }, [propParams]);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiPost('/predict', params);
      setResult(data);
      
      // Feature 3: Local Sensitivity (18 calls + 1 for delta)
      const sensitivity = await calculateSensitivity(params);
      setImportance(sensitivity);
      
      const topParam = sensitivity[0];
      const yieldVal = data.yield || data.predicted_growth_g_per_week;
      if (topParam) {
        const leverData = await getTopLeverDelta(params, topParam.key, yieldVal);
        setTopLever({
          label: topParam.label,
          importance: topParam.importance,
          ...leverData
        });
      }

      if (onParamsChange) onParamsChange(params, yieldVal);
    } catch (err) {
      setError('Prediction failed. Check model endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (val, config) => {
    if (val >= config.optimalMin && val <= config.optimalMax) return 'bg-accent';
    return 'bg-amber-500';
  };

  const getIntervalInsight = (width) => {
    if (width <= 8) return `Interval is narrow (${width.toFixed(1)}g/wk). High confidence — parameters are well within the training distribution.`;
    if (width <= 14) return `Interval is moderate (${width.toFixed(1)}g/wk). Parameters are near the training centre — predictions are reliable.`;
    return `Interval is wide (${width.toFixed(1)}g/wk). Parameters are far from the training centre — treat this prediction with caution.`;
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="border border-border bg-surface p-8 rounded-sm">
        <h2 className="text-[10px] text-labels uppercase tracking-widest mb-10">Environment Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {MAIN_CONFIG.map((config) => (
            <div key={config.key} className="space-y-4">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center group relative">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(params[config.key], config)}`} />
                  <span className="text-secondary">{config.label}</span>
                </div>
                <span className="text-primary font-mono">{params[config.key].toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={config.min} max={config.max} step={config.step}
                value={params[config.key]}
                onChange={(e) => setParams({ ...params, [config.key]: parseFloat(e.target.value) })}
                className="w-full accent-accent h-1 bg-border rounded-none cursor-pointer"
              />
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex justify-end">
          <button
            onClick={handlePredict} disabled={loading}
            className="px-10 py-3 bg-accent text-black hover:bg-white transition-all rounded-sm text-[11px] uppercase tracking-widest font-bold flex items-center disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
            {loading ? 'Calculating...' : 'Predict Growth'}
          </button>
        </div>
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-sm">
            <p className="text-[#e24b4a] text-xs font-mono">{error}</p>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      {result && (
        <div className={`space-y-6 ${loading ? 'animate-pulse opacity-60' : ''}`}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="border border-border bg-surface p-6 rounded-sm">
              <span className="block text-[10px] text-labels uppercase tracking-widest mb-2">Predicted Yield</span>
              <span className="text-2xl font-mono text-accent">{result.yield.toFixed(1)}</span>
              <span className="text-[10px] text-secondary ml-1">g/wk</span>
            </div>
            <div className="border border-border bg-surface p-6 rounded-sm">
              <span className="block text-[10px] text-labels uppercase tracking-widest mb-2">Lower Bound</span>
              <span className="text-2xl font-mono text-primary">{result.lower.toFixed(1)}</span>
            </div>
            <div className="border border-border bg-surface p-6 rounded-sm">
              <span className="block text-[10px] text-labels uppercase tracking-widest mb-2">Upper Bound</span>
              <span className="text-2xl font-mono text-primary">{result.upper.toFixed(1)}</span>
            </div>
            <div className="border border-border bg-surface p-6 rounded-sm">
              <span className="block text-[10px] text-labels uppercase tracking-widest mb-2">Interval Width</span>
              <span className={`text-2xl font-mono ${(result.upper - result.lower) > 14 ? 'text-amber-500' : 'text-primary'}`}>
                {(result.upper - result.lower).toFixed(1)}
              </span>
            </div>
            <div className="border border-border bg-surface p-6 rounded-sm">
              <span className="block text-[10px] text-labels uppercase tracking-widest mb-2">Status</span>
              <span className={`text-xl font-bold uppercase tracking-wider ${
                result.status === 'Excellent' ? 'text-accent' : 
                result.status === 'Good' ? 'text-blue-400' : 
                result.status === 'Fair' ? 'text-amber-500' : 'text-red-500'
              }`}>
                {result.status}
              </span>
            </div>
          </div>

          <div className="border border-border bg-surface p-8 rounded-sm">
            <span className="block text-[10px] text-labels uppercase tracking-widest mb-6">Confidence Band Visualisation</span>
            
            {/* Outer Wrapper */}
            <div className="relative pt-6 pb-5 px-0 h-[65px]">
              
              {/* Predicted Label (Above) */}
              <div 
                className="absolute top-0 text-[11px] font-bold text-accent whitespace-nowrap transition-all duration-400"
                style={{ left: `${(result.yield / 60) * 100}%`, transform: 'translateX(-50%)' }}
              >
                {result.yield.toFixed(1)} g/wk
              </div>

              {/* Track */}
              <div className="relative h-5 bg-[#1a1a1a] rounded-sm mt-1">
                {/* Band Fill */}
                <div 
                  className="absolute h-full bg-accent/15 transition-all duration-400 ease-in-out"
                  style={{ 
                    left: `${(result.lower / 60) * 100}%`, 
                    width: `${((result.upper - result.lower) / 60) * 100}%` 
                  }}
                />
                
                {/* Predicted Marker */}
                <div 
                  className="absolute top-[-2px] h-[calc(100%+4px)] w-[2px] bg-accent z-10 transition-all duration-400 ease-in-out"
                  style={{ left: `${(result.yield / 60) * 100}%`, transform: 'translateX(-50%)' }}
                />
              </div>

              {/* Lower Bound Label (Below) */}
              <div 
                className="absolute bottom-0 text-[10px] text-secondary whitespace-nowrap transition-all duration-400"
                style={{ 
                  left: `${(result.lower / 60) * 100}%`, 
                  transform: `translateX(${(result.upper - result.lower) < 5 ? '-120%' : '-50%'})`
                }}
              >
                {result.lower.toFixed(1)} g
              </div>

              {/* Upper Bound Label (Below) */}
              <div 
                className="absolute bottom-0 text-[10px] text-secondary whitespace-nowrap transition-all duration-400"
                style={{ 
                  left: `${(result.upper / 60) * 100}%`, 
                  transform: `translateX(${(result.upper - result.lower) < 5 ? '20%' : '-50%'})`
                }}
              >
                {result.upper.toFixed(1)} g
              </div>
            </div>

            <div className="mt-8 flex justify-between text-[9px] text-secondary font-mono tracking-widest uppercase">
              <span>0 g/wk</span>
              <span>30 g/wk</span>
              <span>60 g/wk</span>
            </div>

            <p className="mt-8 text-[10px] text-[#555] font-mono leading-relaxed">
              * Confidence interval (CI) represents the model's range of certainty. Intervals widen when input parameters deviate from the training baseline.
            </p>

            <div className="mt-8 p-4 bg-[#0f2a1f] border border-accent/30 rounded-sm">
               <p className="text-[11px] text-accent font-mono italic">
                 "{getIntervalInsight(result.upper - result.lower)}"
               </p>
            </div>
          </div>
          
          <GrowthChart result={result} />
        </div>
      )}

      {/* Feature 3: Model Explainability Panel */}
      {result && (
        <div className="border border-border bg-surface rounded-sm overflow-hidden">
          <button 
            onClick={() => setShowImportance(!showImportance)}
            className="w-full px-8 py-5 flex justify-between items-center hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-4 h-4 text-accent" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-medium">Parameter influence ▾</span>
            </div>
            {showImportance ? <ChevronUp className="w-4 h-4 text-secondary" /> : <ChevronDown className="w-4 h-4 text-secondary" />}
          </button>
          
          <div 
            className={`px-8 transition-all duration-500 ease-in-out overflow-hidden ${showImportance ? 'max-h-[800px] pb-8' : 'max-h-0'}`}
          >
            <div className="space-y-6 pt-4">
              <div className="space-y-5 max-w-2xl">
                {importance.map((imp, idx) => (
                  <div key={imp.key} className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="text-primary mr-2">{imp.label}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-[8px] font-bold rounded-sm">top driver</span>
                        )}
                      </div>
                      <span className="text-secondary font-mono">{imp.importance.toFixed(1)}%</span>
                    </div>
                    <div className="h-[6px] bg-[#1a1a1a] rounded-[3px] w-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-400 ${idx < 3 ? 'bg-accent' : 'bg-[#2a5c42]'} ${loading ? 'animate-pulse opacity-40' : ''}`}
                        style={{ width: `${imp.importance}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {topLever && (
                <div className="pt-6 border-t border-border space-y-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-secondary uppercase tracking-widest">Top levers:</span>
                    <div className="flex space-x-2">
                      {importance.slice(0, 3).map(imp => (
                        <span key={imp.key} className="px-2 py-0.5 bg-[#0f2a1f] text-accent text-[10px] font-mono border border-accent/10 rounded-sm">
                          {imp.label.split(' ')[0]} {imp.importance.toFixed(1)}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#0f2a1f] border border-accent/30 rounded-sm">
                    <p className="text-[11px] text-accent font-mono italic">
                      "{topLever.label} is the top driver right now ({topLever.importance.toFixed(1)}%). 
                      Increasing to its optimal range could add ~{Math.abs(topLever.delta).toFixed(1)} g/wk. 
                      {importance[1]?.label} and {importance[2]?.label} follow."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
