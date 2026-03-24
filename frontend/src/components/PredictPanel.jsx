import React, { useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const INITIAL_PARAMS = {
  temperature: 28.0, salinity: 25.0, pH: 7.8, dissolved_oxygen: 6.5,
  light_hours: 12.0, stocking_density: 20.0, nutrient_level: 50.0,
  tidal_amplitude: 1.5, tidal_frequency: 2.0
};

const MAIN_CONFIG = [
  { key: 'temperature', label: 'Temperature (°C)', min: 20, max: 35, step: 0.1 },
  { key: 'salinity', label: 'Salinity (ppt)', min: 15, max: 35, step: 0.1 },
  { key: 'pH', label: 'pH Level', min: 6.5, max: 9.0, step: 0.1 },
  { key: 'dissolved_oxygen', label: 'Dissolved O2 (mg/L)', min: 3, max: 10, step: 0.1 },
  { key: 'light_hours', label: 'Light Hours (hrs)', min: 6, max: 16, step: 0.5 },
  { key: 'stocking_density', label: 'Stock Density (g/m²)', min: 1, max: 50, step: 1 },
  { key: 'nutrient_level', label: 'Nutrient Level (%)', min: 0, max: 100, step: 1 },
  { key: 'tidal_amplitude', label: 'Tidal Amplitude (m)', min: 0.1, max: 3.0, step: 0.1 },
  { key: 'tidal_frequency', label: 'Tidal Freq (cycles/d)', min: 0.5, max: 4.0, step: 0.5 },
];

export default function PredictPanel() {
  const [params, setParams] = useState(INITIAL_PARAMS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_URL}/predict`, params);
      setResult(data);
    } catch (err) {
      setError(err.message || 'API request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 border border-border bg-surface p-8 rounded-sm">
        <div className="mb-10 pt-2">
          <h2 className="text-sm font-medium text-primary">Environment Parameters</h2>
          <p className="text-xs text-secondary mt-2">Adjust environmental variables to predict harvest outcomes.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
          {MAIN_CONFIG.map(({ key, label, min, max, step }) => (
            <div key={key} className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary">{label}</span>
                <span className="text-primary font-mono">{params[key]}</span>
              </div>
              <input
                type="range"
                min={min} max={max} step={step}
                value={params[key]}
                onChange={(e) => setParams({ ...params, [key]: parseFloat(e.target.value) })}
                className="w-full accent-primary h-1 bg-border rounded-none cursor-pointer"
              />
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex justify-end">
          <button
            onClick={handlePredict} disabled={loading}
            className="px-6 py-2.5 bg-primary text-black hover:bg-white/90 transition-opacity duration-150 rounded-sm text-xs font-medium flex items-center disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin mr-2 w-4 h-4 text-black" />}
            {loading ? 'Predicting...' : 'Predict Growth'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-4 text-sm text-right">{error}</p>}
      </div>

      <div className="lg:w-80 border border-border bg-surface p-8 rounded-sm flex flex-col justify-start items-start">
        <h3 className="text-[11px] text-secondary mb-8 tracking-widest uppercase">Predicted Harvest</h3>
        
        {result ? (
          <div className="animate-in fade-in duration-300 w-full mt-4">
            <div className="flex items-baseline space-x-2 mb-8">
              <span className="text-5xl font-light text-primary tracking-tight font-mono">{result.predicted_growth_g_per_week}</span>
              <span className="text-secondary text-sm">g/wk</span>
            </div>
            
            <div className="space-y-6 pt-8 border-t border-border">
              <div>
                <span className="block text-[11px] uppercase tracking-wide text-secondary mb-2">Status</span>
                <span className={`text-sm ${
                  result.status === 'Optimal' ? 'text-accent' :
                  result.status === 'Good' ? 'text-primary' :
                  'text-secondary'
                }`}>
                  {result.status}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wide text-secondary mb-2">Confidence Interval</span>
                <span className="text-sm font-mono text-primary">{result.confidence_low} — {result.confidence_high} g</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center opacity-50 mt-10">
            <p className="text-sm text-secondary">Run prediction to view results.</p>
          </div>
        )}
      </div>
    </div>
  );
}
