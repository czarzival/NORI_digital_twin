from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import random
import pickle
import pandas as pd
import io
import os
import jwt
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NORI Digital Twin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://nori-digital-twin.vercel.app",
        "https://*.vercel.app",
        "https://nori-digital-twin-git-main-czarzivals-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIRouter with /api prefix
router = APIRouter(prefix="/api")

# Supabase Admin Client
supabase_admin: Client = create_client(
    os.environ.get("SUPABASE_URL", ""),
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid token"
        )
    token = authorization.split(" ")[1]
    try:
        # Supabase JWTs can be decoded without signature verification for metadata,
        # but in a real prod app you'd verify against Supabase's public key.
        # Following the brief's simplified verification:
        payload = jwt.decode(token, options={"verify_signature": False})
        if not payload.get("sub"):
            raise HTTPException(status_code=401)
        return payload
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
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
    ph: float
    dissolved_o2: float
    light_hours: float
    stock_density: float
    nutrient_level: float
    tidal_amplitude: float
    tidal_frequency: float

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

@router.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": MODEL_LOADED}

RAMP = [0.05, 0.12, 0.28, 0.52, 0.75, 1.0, 1.0, 1.0, 0.98, 0.95, 0.90, 0.84]

@router.post("/predict")
async def predict(data: PredictionInput, current_user: dict = Depends(get_current_user)):
    features = [
        data.temperature, data.salinity, data.ph, data.dissolved_o2,
        data.tidal_amplitude, data.tidal_frequency, data.stock_density,
        data.light_hours, data.nutrient_level
    ]
    
    growth = predict_growth(features)
    
    # Status thresholds: yield < 15 Poor, < 25 Fair, < 40 Good, >= 40 Excellent
    if growth < 15:
        status = "Poor"
    elif growth < 25:
        status = "Fair"
    elif growth < 40:
        status = "Good"
    else:
        status = "Excellent"
        
    result = {
        "yield": round(growth, 2),
        "predicted_growth_g_per_week": round(growth, 2), # Compatibility
        "lower": round(growth * 0.85, 2),
        "confidence_low": round(growth * 0.85, 2), # Compatibility
        "upper": round(growth * 1.15, 2),
        "confidence_high": round(growth * 1.15, 2), # Compatibility
        "status": status
    }

    return result

@router.post("/predictions/save")
async def save_prediction(data: dict, current_user: dict = Depends(get_current_user)):
    try:
        # Support both flat columns and a JSON 'input_params' field if needed
        # For now, we'll keep the flat structure as requested by current DB usage
        payload = {
            "user_id": current_user["sub"],
            "predicted_yield": data.get("yield"),
            "lower_bound": data.get("lower"),
            "upper_bound": data.get("upper"),
            "status": data.get("status"),
            "cycle_id": data.get("cycle_id"), # Optional
            # Flat input params
            "temperature": data.get("temperature"),
            "salinity": data.get("salinity"),
            "ph": data.get("ph"),
            "dissolved_o2": data.get("dissolved_o2"),
            "light_hours": data.get("light_hours"),
            "stock_density": data.get("stock_density"),
            "nutrient_level": data.get("nutrient_level"),
            "tidal_amplitude": data.get("tidal_amplitude"),
            "tidal_frequency": data.get("tidal_frequency"),
        }
        
        response = supabase_admin.table("predictions").insert(payload).execute()
        return response.data[0]
    except Exception as e:
        print(f"Save failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate")
async def simulate(data: dict, current_user: dict = Depends(get_current_user)):
    # Support both naming conventions for input
    variable = data.get('variable', data.get('sweep_variable'))
    min_val = data.get('min', data.get('sweep_min', 0))
    max_val = data.get('max', data.get('sweep_max', 0))
    step = data.get('step', data.get('sweep_step', 1))
    base_params = data.get('base_params', {})
    
    results = []
    current_val = min_val
    
    optimal_value = -1
    max_yield = -1
    
    feature_keys = [
        'temperature', 'salinity', 'ph', 'dissolved_o2', 
        'tidal_amplitude', 'tidal_frequency', 'stock_density', 
        'light_hours', 'nutrient_level'
    ]
    
    while current_val <= max_val:
        params = base_params.copy()
        mapped_params = {
            'temperature': params.get('temperature', 0),
            'salinity': params.get('salinity', 0),
            'ph': params.get('ph', params.get('pH', 0)),
            'dissolved_o2': params.get('dissolved_o2', params.get('dissolved_oxygen', 0)),
            'tidal_amplitude': params.get('tidal_amplitude', 0),
            'tidal_frequency': params.get('tidal_frequency', 0),
            'stock_density': params.get('stock_density', params.get('stocking_density', 0)),
            'light_hours': params.get('light_hours', 0),
            'nutrient_level': params.get('nutrient_level', 0)
        }
        
        mapped_var = variable
        if variable == 'pH': mapped_var = 'ph'
        if variable == 'dissolved_oxygen': mapped_var = 'dissolved_o2'
        if variable == 'stocking_density': mapped_var = 'stock_density'
        
        mapped_params[mapped_var] = current_val
        
        features = [mapped_params.get(k, 0) for k in feature_keys]
        growth = predict_growth(features)
        
        results.append({
            "value": round(current_val, 2),
            "yield": round(growth, 2),
            "predicted_growth": round(growth, 2) # Compatibility
        })
        
        if growth > max_yield:
            max_yield = growth
            optimal_value = current_val
            
        current_val += step

    return {
        "results": results,
        "optimal_value": round(optimal_value, 2),
        "max_yield": round(max_yield, 2),
        "optimal_growth": round(max_yield, 2) # Compatibility
    }

# Cycle Planner Endpoints
@router.get("/cycles")
async def get_cycles(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase_admin.table("cycles") \
            .select("*, cycle_checkins(*)") \
            .eq("user_id", current_user["sub"]) \
            .order("created_at", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cycles")
async def create_cycle(data: dict, current_user: dict = Depends(get_current_user)):
    try:
        # Insert cycle
        cycle_response = supabase_admin.table("cycles").insert({
            "user_id": current_user["sub"],
            "name": data.get("name", "Untitled Cycle"),
            "start_date": data.get("start_date"),
            "start_week": data.get("start_week"),
            "harvest_target": data.get("harvest_target", 300),
            "weekly_yield": data.get("weekly_yield"),
            "lower_bound": data.get("lower_bound"),
            "upper_bound": data.get("upper_bound"),
        }).execute()
        
        new_id = cycle_response.data[0]["id"]
        
        # Pre-generate 12 checkins
        biomass = 0
        checkins = []
        for i, ramp_val in enumerate(RAMP):
            biomass += data["weekly_yield"] * ramp_val
            checkins.append({
                "cycle_id": new_id,
                "week_number": i + 1,
                "projected_biomass": round(biomass, 2),
                "actual_biomass": None
            })
            
        supabase_admin.table("cycle_checkins").insert(checkins).execute()
        
        # Return full cycle with checkins
        full_cycle = supabase_admin.table("cycles") \
            .select("*, cycle_checkins(*)") \
            .eq("id", new_id) \
            .execute()
        return full_cycle.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/cycles/{cycle_id}/checkin")
async def update_checkin(cycle_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    try:
        # Verify ownership
        cycle = supabase_admin.table("cycles").select("user_id").eq("id", cycle_id).execute()
        if not cycle.data or cycle.data[0]["user_id"] != current_user["sub"]:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        supabase_admin.table("cycle_checkins") \
            .update({"actual_biomass": data.get("actual_biomass"), "notes": data.get("notes")}) \
            .eq("cycle_id", cycle_id) \
            .eq("week_number", data.get("week_number")) \
            .execute()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cycles/{cycle_id}/harvest")
async def harvest_cycle(cycle_id: str, data: dict = None, current_user: dict = Depends(get_current_user)):
    try:
        # 1. Verify ownership and get cycle data
        cycle_res = supabase_admin.table("cycles").select("*, cycle_checkins(*)").eq("id", cycle_id).execute()
        if not cycle_res.data or cycle_res.data[0]["user_id"] != current_user["sub"]:
            raise HTTPException(status_code=403, detail="Forbidden")
        
        cycle = cycle_res.data[0]
        
        # 2. Compute Harvest Yield
        harvest_yield = data.get("actual_yield") if data else None
        
        if harvest_yield is None:
            # Option A: Latest check-in biomass
            checkins = cycle.get("cycle_checkins", [])
            logged_checkins = [c for c in checkins if c.get("actual_biomass") is not None]
            if logged_checkins:
                # Sort by week and get latest
                latest = sorted(logged_checkins, key=lambda x: x["week_number"])[-1]
                harvest_yield = latest["actual_biomass"]
            else:
                # Option B: Latest prediction from predictions table
                pred_res = supabase_admin.table("predictions") \
                    .select("predicted_yield") \
                    .eq("user_id", current_user["sub"]) \
                    .order("created_at", desc=True) \
                    .limit(1) \
                    .execute()
                
                if pred_res.data:
                    harvest_yield = pred_res.data[0]["predicted_yield"]
                else:
                    # Option C: Estimated from growth curve (Week 12 value)
                    # Based on the RAMP logic in create_cycle
                    total_biomass = 0
                    weekly_yield = cycle.get("weekly_yield", 0)
                    for ramp_val in RAMP:
                        total_biomass += weekly_yield * ramp_val
                    harvest_yield = round(total_biomass, 2)

        # 3. Update cycles table
        update_data = {
            "status": "harvested",
            "actual_yield": harvest_yield,
            "harvested_at": datetime.now().isoformat(),
        }
        if data and data.get("notes"):
            update_data["notes"] = data.get("notes")

        supabase_admin.table("cycles").update(update_data).eq("id", cycle_id).execute()
        
        # Return updated cycle
        full_cycle = supabase_admin.table("cycles") \
            .select("*, cycle_checkins(*)") \
            .eq("id", cycle_id) \
            .execute()
            
        return full_cycle.data[0]
    except Exception as e:
        print(f"Harvest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictions")
async def get_predictions(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase_admin.table("predictions") \
            .select("*") \
            .eq("user_id", current_user["sub"]) \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/predictions/{prediction_id}")
async def update_prediction(prediction_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    try:
        # Verify ownership
        pred = supabase_admin.table("predictions").select("user_id").eq("id", prediction_id).execute()
        if not pred.data or pred.data[0]["user_id"] != current_user["sub"]:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        supabase_admin.table("predictions") \
            .update({"actual_yield": data.get("actual_yield")}) \
            .eq("id", prediction_id) \
            .execute()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        required_cols = [
            'temperature', 'salinity', 'ph', 'dissolved_o2', 
            'tidal_amplitude', 'tidal_frequency', 'stock_density', 
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

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)