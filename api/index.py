import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "loan_default_gatekeeper (2).joblib")
bundle = joblib.load(MODEL_PATH)

MODEL_PATH = "loan_default_gatekeeper (2).joblib"
bundle = joblib.load(MODEL_PATH)

rf_model = bundle["model"]
scaler = bundle["scaler"]
FEATURE_NAMES = list(bundle["features"])

app = FastAPI(title="Loan Default Gatekeeper API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionRequest(BaseModel):
    features: dict[str, float]


def build_feature_row(raw: dict[str, float]) -> pd.DataFrame:
    """Computes the 4 derived financial ratios to match the 16-feature model."""
    row = {k: float(v) for k, v in raw.items()}

    total_income = row.get("ApplicantIncome", 0.0) + row.get("CoapplicantIncome", 0.0)
    loan_actual = row.get("LoanAmount", 0.0) * 1000.0
    term = row.get("Loan_Amount_Term", 360.0) or 360.0

    r = 0.085 / 12.0
    emi = (loan_actual * r * ((1 + r) ** term)) / (((1 + r) ** term) - 1)

    row["TotalIncome"] = total_income
    row["Estimated_EMI"] = emi
    row["EMI_to_Income_Ratio"] = emi / (total_income + 1.0)
    row["Loan_to_AnnualIncome"] = loan_actual / ((total_income * 12.0) + 1.0)

    missing = [f for f in FEATURE_NAMES if f not in row]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    return pd.DataFrame([row])[FEATURE_NAMES]


@app.get("/api/metadata")
def get_metadata():
    return {
        "model_type": type(rf_model).__name__,
        "num_features": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "classes": [int(c) for c in rf_model.classes_],
    }


@app.post("/api/predict")
def predict_default(payload: PredictionRequest):
    try:
        raw = {k: float(v) for k, v in payload.features.items()}
        total_income = raw.get("ApplicantIncome", 0.0) + raw.get("CoapplicantIncome", 0.0)

        if total_income <= 0:
            return {
                "prediction": 0,
                "label": "High Risk — Default (No Income)",
                "default_probability": 0.99,
                "no_default_probability": 0.01,
            }

        input_df = build_feature_row(raw)
        scaled_input = scaler.transform(input_df)

        pred = int(rf_model.predict(scaled_input)[0])
        proba = rf_model.predict_proba(scaled_input)[0]

        default_prob = float(proba[0])
        approval_prob = float(proba[1])

        return {
            "prediction": pred,
            "label": "Low Risk — Approved" if pred == 1 else "High Risk — Default",
            "default_probability": round(default_prob, 4),
            "no_default_probability": round(approval_prob, 4),
        }
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err)) from val_err
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc