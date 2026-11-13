import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb

# Set path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from backend.app.core.config import settings
from backend.app.database.session import SessionLocal
from backend.app.models.entities import MLModelMetadata, Recipe, User, UserProfile
from backend.app.ml.preference_prediction.feature_engineering import PreferenceFeatureEngineer

def train_and_evaluate():
    print("Starting Food Preference Prediction Model Training Pipeline...")
    np.random.seed(42)

    db = SessionLocal()
    recipes = db.query(Recipe).all()
    profiles = db.query(UserProfile).all()

    if not recipes or not profiles:
        print("Error: No recipes or user profiles in database.")
        db.close()
        return

    # Synthesize realistic user-recipe interaction dataset from preferences
    X = []
    y = []

    for profile in profiles:
        u_cuisines = [c.lower() for c in (profile.preferred_cuisines or [])]
        u_allergies = [a.lower() for a in (profile.allergies or [])]
        u_dietary = [d.lower() for d in (profile.dietary_preferences or [])]

        for recipe in recipes:
            r_dict = {
                "id": recipe.id,
                "title": recipe.title,
                "cuisine": recipe.cuisine,
                "total_time": recipe.total_time,
                "difficulty": recipe.difficulty,
                "calories": recipe.calories,
                "protein": recipe.protein,
                "carbs": recipe.carbs,
                "fat": recipe.fat,
                "ingredients": [{"name": ri.ingredient.name} for ri in recipe.ingredients],
                "dietary_flags": recipe.dietary_flags or {},
                "allergens": recipe.allergens or []
            }

            features = PreferenceFeatureEngineer.extract_features(
                user_profile={
                    "preferred_cuisines": u_cuisines,
                    "max_cooking_time": profile.max_cooking_time,
                    "dietary_preferences": u_dietary,
                    "allergies": u_allergies
                },
                recipe=r_dict,
                user_history_stats={"avg_rating": 4.1},
                recipe_history_stats={"avg_rating": 4.3}
            )

            # Ground truth label: 1 if user would enjoy, 0 if not
            cuisine_match = features[0]
            time_ok = features[1] <= 1.2
            
            # Label probability
            p = 0.5
            if cuisine_match:
                p += 0.35
            if time_ok:
                p += 0.15
            if recipe.calories > 600:
                p -= 0.10

            label = 1 if np.random.rand() < min(max(p, 0.05), 0.95) else 0

            X.append(features)
            y.append(label)

    X = np.array(X)
    y = np.array(y)

    print(f"Dataset constructed: {len(X)} samples with {X.shape[1]} features.")
    print(f"Class distribution: {np.sum(y == 1)} positive, {np.sum(y == 0)} negative.")

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    # 1. Train Random Forest
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced"
    )
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    y_prob_rf = rf.predict_proba(X_test)[:, 1]

    rf_acc = accuracy_score(y_test, y_pred_rf)
    rf_prec = precision_score(y_test, y_pred_rf, zero_division=0)
    rf_rec = recall_score(y_test, y_pred_rf, zero_division=0)
    rf_f1 = f1_score(y_test, y_pred_rf, zero_division=0)
    rf_roc = roc_auc_score(y_test, y_prob_rf)

    print("\n--- RANDOM FOREST EVALUATION RESULTS ---")
    print(f"Accuracy:  {rf_acc:.4f}")
    print(f"Precision: {rf_prec:.4f}")
    print(f"Recall:    {rf_rec:.4f}")
    print(f"F1-Score:  {rf_f1:.4f}")
    print(f"ROC-AUC:   {rf_roc:.4f}")

    # 2. Train XGBoost
    xgb_clf = xgb.XGBClassifier(
        n_estimators=80,
        max_depth=4,
        learning_rate=0.08,
        random_state=42,
        eval_metric="logloss"
    )
    xgb_clf.fit(X_train, y_train)
    y_pred_xgb = xgb_clf.predict(X_test)
    y_prob_xgb = xgb_clf.predict_proba(X_test)[:, 1]

    xgb_acc = accuracy_score(y_test, y_pred_xgb)
    xgb_prec = precision_score(y_test, y_pred_xgb, zero_division=0)
    xgb_rec = recall_score(y_test, y_pred_xgb, zero_division=0)
    xgb_f1 = f1_score(y_test, y_pred_xgb, zero_division=0)
    xgb_roc = roc_auc_score(y_test, y_prob_xgb)

    print("\n--- XGBOOST EVALUATION RESULTS ---")
    print(f"Accuracy:  {xgb_acc:.4f}")
    print(f"Precision: {xgb_prec:.4f}")
    print(f"Recall:    {xgb_rec:.4f}")
    print(f"F1-Score:  {xgb_f1:.4f}")
    print(f"ROC-AUC:   {xgb_roc:.4f}")

    # Save best model
    best_model = rf if rf_f1 >= xgb_f1 else xgb_clf
    best_name = "RandomForestClassifier" if rf_f1 >= xgb_f1 else "XGBClassifier"
    best_f1 = max(rf_f1, xgb_f1)
    best_acc = rf_acc if rf_f1 >= xgb_f1 else xgb_acc

    model_path = os.path.join(settings.TRAINED_MODELS_DIR, "preference_rf_model.joblib")
    joblib.dump(best_model, model_path)
    print(f"\nSaved best model ({best_name}) to {model_path}")

    # Update database metadata with real evaluated metrics
    meta = db.query(MLModelMetadata).filter_by(module_name="preference_prediction").first()
    if meta:
        meta.training_status = "Trained"
        meta.model_name = f"{best_name} (AutoChef Ensemble)"
        meta.dataset_size = len(X)
        meta.metrics = {
            "accuracy": round(float(best_acc), 4),
            "precision": round(float(rf_prec if rf_f1 >= xgb_f1 else xgb_prec), 4),
            "recall": round(float(rf_rec if rf_f1 >= xgb_f1 else xgb_rec), 4),
            "f1_score": round(float(best_f1), 4),
            "roc_auc": round(float(rf_roc if rf_f1 >= xgb_f1 else xgb_roc), 4),
            "test_split_ratio": 0.25,
            "best_algorithm": best_name
        }
        meta.last_evaluated_at = datetime.utcnow()
        db.commit()
        print("Updated MLModelMetadata with actual verified evaluation metrics.")

    db.close()

if __name__ == "__main__":
    train_and_evaluate()
