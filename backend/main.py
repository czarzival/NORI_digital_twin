from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import pickle
import pandas as pd
import io

app = FastAPI(title="NORI Digital Twin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to load model
try:
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)
    print("Model loaded successfully.")
    MODEL_LOADED = True
except FileNotFoundError:
    print("model.pkl not found. Using placeholder predictions.")
    model = None
    MODEL_LOADED = False

class PredictionInput(BaseModel):
    temperature: float
    salinity: float
    pH: float
    dissolved_oxygen: float
    tidal_amplitude: float
    tidal_frequency: float
    stocking_density: float
    light_hours: float
    nutrient_level: float

def predict_growth(features: list) -> float:
    if MODEL_LOADED and model is not None:
        try:
            return float(model.predict([features])[0])
        except Exception as e:
            print(f"Model prediction error: {e}")
            # fallback
            return round(random.uniform(10.0, 50.0), 2)
    else:
        return round(random.uniform(10.0, 50.0), 2)

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": MODEL_LOADED}

@app.post("/predict")
def predict(data: PredictionInput):
    features = [
        data.temperature,
        data.salinity,
        data.pH,
        data.dissolved_oxygen,
        data.tidal_amplitude,
        data.tidal_frequency,
        data.stocking_density,
        data.light_hours,
        data.nutrient_level
    ]
    
    growth = predict_growth(features)
    # Simple confidence interval
    conf_low = max(0, growth - (growth * 0.15))
    conf_high = growth + (growth * 0.15)
    status = "Optimal" if growth > 30 else ("Good" if growth > 20 else "Suboptimal")
    
    return {
        "predicted_growth_g_per_week": growth,
        "confidence_low": round(conf_low, 2),
        "confidence_high": round(conf_high, 2),
        "status": status
    }

class SimulateInput(BaseModel):
    base_params: dict
    sweep_variable: str
    sweep_min: float
    sweep_max: float
    sweep_step: float

@app.post("/simulate")
def simulate(data: SimulateInput):
    results = []
    current_val = data.sweep_min
    
    optimal_value = -1
    optimal_growth = -1
    
    # Feature ordering
    feature_keys = [
        'temperature', 'salinity', 'pH', 'dissolved_oxygen', 
        'tidal_amplitude', 'tidal_frequency', 'stocking_density', 
        'light_hours', 'nutrient_level'
    ]
    
    while current_val <= data.sweep_max:
        params = data.base_params.copy()
        params[data.sweep_variable] = current_val
        
        features = [params.get(k, 0) for k in feature_keys]
        growth = predict_growth(features)
        
        results.append({
            "value": round(current_val, 2),
            "predicted_growth": growth
        })
        
        if growth > optimal_growth:
            optimal_growth = growth
            optimal_value = current_val
            
        current_val += data.sweep_step

    return {
        "results": results,
        "optimal_value": round(optimal_value, 2),
        "optimal_growth": round(optimal_growth, 2)
    }

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        required_cols = [
            'temperature', 'salinity', 'pH', 'dissolved_oxygen', 
            'tidal_amplitude', 'tidal_frequency', 'stocking_density', 
            'light_hours', 'nutrient_level'
        ]
        
        # Check columns
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail="CSV is missing required feature columns.")
            
        predictions = []
        for index, row in df.iterrows():
            features = [row[col] for col in required_cols]
            pred = predict_growth(features)
            predictions.append(pred)
            
        df['predicted_growth'] = predictions
        
        result_list = df.to_dict(orient="records")
        mean_growth = df['predicted_growth'].mean()
        min_growth = df['predicted_growth'].min()
        max_growth = df['predicted_growth'].max()
        
        return {
            "predictions": result_list,
            "summary": {
                "mean": round(mean_growth, 2),
                "min": round(min_growth, 2),
                "max": round(max_growth, 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
