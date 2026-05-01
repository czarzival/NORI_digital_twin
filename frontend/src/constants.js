export const API_URL = '/api';

export const MAIN_CONFIG = [
  { key: 'temperature', label: 'Temperature (°C)', min: 20, max: 35, step: 0.1, optimalMin: 22, optimalMax: 28 },
  { key: 'salinity', label: 'Salinity (ppt)', min: 15, max: 35, step: 0.1, optimalMin: 20, optimalMax: 35 },
  { key: 'ph', label: 'pH Level', min: 6.5, max: 9.0, step: 0.1, optimalMin: 7.5, optimalMax: 8.5 },
  { key: 'dissolved_o2', label: 'Dissolved O2 (mg/L)', min: 3, max: 10, step: 0.1, optimalMin: 5, optimalMax: 9 },
  { key: 'light_hours', label: 'Light Hours (hrs)', min: 6, max: 16, step: 0.5, optimalMin: 12, optimalMax: 15 },
  { key: 'stock_density', label: 'Stock Density (g/m²)', min: 1, max: 50, step: 1, optimalMin: 15, optimalMax: 25 },
  { key: 'nutrient_level', label: 'Nutrient Level (%)', min: 0, max: 100, step: 1, optimalMin: 40, optimalMax: 70 },
  { key: 'tidal_amplitude', label: 'Tidal Amplitude (m)', min: 0.1, max: 3.0, step: 0.1, optimalMin: 1.0, optimalMax: 2.5 },
  { key: 'tidal_frequency', label: 'Tidal Freq (cycles/d)', min: 0.5, max: 4.0, step: 0.5, optimalMin: 1.5, optimalMax: 3.0 },
];

export const INITIAL_PARAMS = {
  temperature: 28.0, salinity: 25.0, ph: 7.8, dissolved_o2: 6.5,
  light_hours: 12.0, stock_density: 20.0, nutrient_level: 50.0,
  tidal_amplitude: 1.5, tidal_frequency: 2.0
};

export const BIOMASS_GROWTH_CURVE = [0.1, 0.25, 0.5, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 0.95, 0.9, 0.85];
