import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings
from backend.app.ml.preference_prediction.feature_engineering import PreferenceFeatureEngineer

class PreferencePredictor:
    """Predicts whether a user will enjoy a specific recipe with calibrated probabilities and feature explanations."""

    MODEL_FILE = os.path.join(settings.TRAINED_MODELS_DIR, "preference_rf_model.joblib")

    def __init__(self):
        self.model = None
        self.feature_names = PreferenceFeatureEngineer.FEATURE_NAMES
        self.load_model()

    def load_model(self):
        if os.path.exists(self.MODEL_FILE):
            try:
                self.model = joblib.load(self.MODEL_FILE)
            except Exception as e:
                self.model = None

    def is_ready(self) -> bool:
        return self.model is not None

    def predict(
        self,
        user_profile: Dict[str, Any],
        recipe: Dict[str, Any],
        user_history_stats: Optional[Dict[str, float]] = None,
        recipe_history_stats: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Predict enjoyment probability.
        If model is not yet trained, uses heuristic baseline and clearly marks status.
        """
        features = PreferenceFeatureEngineer.extract_features(
            user_profile=user_profile,
            recipe=recipe,
            user_history_stats=user_history_stats or {"avg_rating": 4.0},
            recipe_history_stats=recipe_history_stats or {"avg_rating": 4.2}
        )

        if self.model is not None:
            feat_arr = np.array(features).reshape(1, -1)
            pred_class = int(self.model.predict(feat_arr)[0])
            probs = self.model.predict_proba(feat_arr)[0]
            confidence = float(probs[1]) if len(probs) > 1 else float(probs[0])
            algo = "RandomForestClassifier"

            # Top feature importances
            importances = getattr(self.model, "feature_importances_", None)
            if importances is not None:
                feat_imp = {
                    name: round(float(imp), 4)
                    for name, imp in zip(self.feature_names, importances)
                }
                # Sort top 4
                top_features = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True)[:4])
            else:
                top_features = {}
        else:
            # Baseline heuristic
            cuisine_match = features[0]
            time_ratio = features[1]
            diff = features[2]
            confidence = 0.5 + (0.3 if cuisine_match > 0 else -0.1) - (0.1 if time_ratio > 1.2 else 0)
            confidence = max(0.1, min(0.95, confidence))
            pred_class = 1 if confidence >= 0.5 else 0
            algo = "Heuristic Baseline (Model Untrained)"
            top_features = {"cuisine_match": 0.45, "time_ratio": 0.30, "difficulty_level": 0.25}

        return {
            "recipe_id": recipe.get("id"),
            "recipe_title": recipe.get("title", ""),
            "predicted_enjoyment": bool(pred_class == 1),
            "confidence_score": round(confidence, 4),
            "algorithm": algo,
            "top_contributing_features": top_features
        }
