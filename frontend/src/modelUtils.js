import { apiPost } from './lib/api';
import { MAIN_CONFIG } from './constants';

export const predictYield = async (params) => {
  try {
    const { data } = await apiPost('/predict', params);
    return data;
  } catch (err) {
    console.error('Prediction failed', err);
    throw err;
  }
};

/**
 * Feature 4: Sensitivity / Feature Importance
 * Calculate sensitivity of the model output to each parameter at the current state.
 */
export const calculateSensitivity = async (currentParams) => {
  const sensitivityResults = await Promise.all(MAIN_CONFIG.map(async (config) => {
    const { key, min, max, label } = config;
    const step = (max - min) * 0.05;
    
    const [upRes, downRes] = await Promise.all([
      predictYield({ ...currentParams, [key]: Math.min(max, currentParams[key] + step) }),
      predictYield({ ...currentParams, [key]: Math.max(min, currentParams[key] - step) })
    ]);
    
    const delta = Math.abs((upRes.yield || upRes.predicted_growth_g_per_week) - (downRes.yield || downRes.predicted_growth_g_per_week));
    return { key, label, sensitivity: delta };
  }));
  
  const total = sensitivityResults.reduce((acc, s) => acc + s.sensitivity, 0) || 1;
  const importance = sensitivityResults.map(s => ({
    ...s,
    importance: (s.sensitivity / total) * 100
  })).sort((a, b) => b.importance - a.importance);

  return importance;
};

export const getTopLeverDelta = async (currentParams, topParamKey, currentYield) => {
  const config = MAIN_CONFIG.find(c => c.key === topParamKey);
  if (!config) return { delta: 0, optimalValue: 0 };
  
  const optVal = (config.optimalMin + config.optimalMax) / 2;
  const result = await predictYield({ ...currentParams, [topParamKey]: optVal });
  const yieldVal = result.yield || result.predicted_growth_g_per_week;
  return {
    delta: yieldVal - currentYield,
    optimalValue: optVal
  };
};
