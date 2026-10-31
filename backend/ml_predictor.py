
from pathlib import Path
import math

import joblib
import numpy as np
import pandas as pd


MODEL_DIR = Path(__file__).resolve().parent / "models"

model = joblib.load(MODEL_DIR / "random_forest_model.pkl")
feature_columns = joblib.load(MODEL_DIR / "feature_columns.pkl")
job_role_encoder = joblib.load(MODEL_DIR / "job_role_encoder.pkl")

NUMERIC_FEATURES = [
    "years_exp",
    "skills_matched",
    "education_score",
    "keyword_density",
]


def get_supported_roles():
    return list(job_role_encoder.categories_[0])


def predict_candidate(
    years_exp,
    skills_matched,
    education_score,
    keyword_density,
    job_role,
):
    supported_roles = get_supported_roles()

    if job_role not in supported_roles:
        raise ValueError(
            f"Unsupported job role: {job_role}. "
            f"Supported roles: {supported_roles}"
        )

    raw_values = {
        "years_exp": years_exp,
        "skills_matched": skills_matched,
        "education_score": education_score,
        "keyword_density": keyword_density,
    }

    numeric_values = []

    for name in NUMERIC_FEATURES:
        value = raw_values[name]

        if value is None or isinstance(value, bool):
            raise ValueError(f"Missing or invalid feature: {name}")

        try:
            number = float(value)
        except (TypeError, ValueError) as error:
            raise ValueError(
                f"Invalid numeric feature: {name}"
            ) from error

        if not math.isfinite(number):
            raise ValueError(
                f"Non-finite numeric feature: {name}"
            )

        if number < 0:
            raise ValueError(
                f"Negative numeric feature: {name}"
            )

        numeric_values.append(number)

    role_encoded = job_role_encoder.transform(
        pd.DataFrame({"job_role": [job_role]})
    )

    if hasattr(role_encoded, "toarray"):
        role_encoded = role_encoded.toarray()

    combined = np.hstack([
        np.array([numeric_values], dtype=float),
        role_encoded,
    ])

    input_df = pd.DataFrame(
        combined,
        columns=feature_columns,
    )

    prediction = int(model.predict(input_df)[0])

    probabilities = model.predict_proba(input_df)[0]

    class_probabilities = {
        int(label): round(float(prob) * 100, 2)
        for label, prob in zip(
            model.classes_,
            probabilities,
        )
    }

    return {
        "prediction": prediction,
        "prediction_label": (
            "Shortlisted"
            if prediction == 1
            else "Not Shortlisted"
        ),
        "shortlist_probability": class_probabilities.get(1),
        "model": "Random Forest",
        "note": (
            "Experimental prediction only. "
            "Not a final hiring decision."
        ),
    }
