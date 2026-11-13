import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.api.deps import get_db, get_optional_user
from backend.app.models.entities import User, Recipe, UserProfile, MLModelMetadata
from backend.app.schemas.schemas import (
    PreferencePredictRequest, PreferencePredictResponse,
    SubstitutionRequest, SubstitutionResponse, SubstituteItem,
    NutritionEstimateRequest, NutritionEstimateResponse,
    MLInsightsResponse, MLModuleMetrics
)
from backend.app.ml.preference_prediction.preference_predictor import PreferencePredictor
from backend.app.ml.substitution.substitution_engine import SubstitutionEngine
from backend.app.ml.nutrition.nutrition_engine import NutritionEngine

router = APIRouter()
preference_predictor = PreferencePredictor()
substitution_engine = SubstitutionEngine()
nutrition_engine = NutritionEngine()

@router.post("/predict-preference", response_model=PreferencePredictResponse)
def predict_user_preference(
    req: PreferencePredictRequest,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Executes actual Machine Learning (Random Forest / XGBoost) prediction
    to determine if the user will enjoy a specific recipe.
    """
    recipe = db.query(Recipe).filter(Recipe.id == req.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first() if current_user else None
    profile_dict = {
        "preferred_cuisines": profile.preferred_cuisines if profile else ["Italian", "Mexican"],
        "max_cooking_time": profile.max_cooking_time if profile else 60,
        "dietary_preferences": profile.dietary_preferences if profile else [],
        "allergies": profile.allergies if profile else []
    }

    recipe_dict = {
        "id": recipe.id,
        "title": recipe.title,
        "cuisine": recipe.cuisine,
        "total_time": recipe.total_time,
        "difficulty": recipe.difficulty,
        "calories": recipe.calories,
        "protein": recipe.protein,
        "carbs": recipe.carbs,
        "fat": recipe.fat,
        "dietary_flags": recipe.dietary_flags or {},
        "allergens": recipe.allergens or [],
        "ingredients": [{"name": ri.ingredient.name} for ri in recipe.ingredients]
    }

    prediction = preference_predictor.predict(
        user_profile=profile_dict,
        recipe=recipe_dict
    )

    return PreferencePredictResponse(
        recipe_id=prediction["recipe_id"],
        recipe_title=prediction["recipe_title"],
        predicted_enjoyment=prediction["predicted_enjoyment"],
        confidence_score=prediction["confidence_score"],
        algorithm=prediction["algorithm"],
        top_contributing_features=prediction["top_contributing_features"]
    )

@router.post("/substitute", response_model=SubstitutionResponse)
def get_ingredient_substitutes(
    req: SubstitutionRequest,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Executes Context-Aware NLP and Culinary Profile Substitution Engine.
    Respects cooking purpose (e.g. baking vs frying) and enforces dietary & allergy exclusions.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first() if current_user else None
    user_allergies = req.allergen_filter or (profile.allergies if profile else [])
    dietary = req.dietary_filter or (profile.dietary_preferences[0] if (profile and profile.dietary_preferences) else None)

    substitutes_data = substitution_engine.find_substitutes(
        ingredient_name=req.ingredient_name,
        purpose=req.purpose,
        dietary_filter=dietary,
        allergen_filter=user_allergies
    )

    items = [
        SubstituteItem(
            substitute_name=s["substitute_name"],
            similarity_score=s["similarity_score"],
            conversion_ratio=s["conversion_ratio"],
            taste_profile=s["taste_profile"],
            best_used_for=s["best_used_for"],
            allergens=s["allergens"],
            dietary_flags=s["dietary_flags"],
            notes=s["notes"]
        )
        for s in substitutes_data
    ]

    return SubstitutionResponse(
        target_ingredient=req.ingredient_name,
        purpose_context=req.purpose or "all-purpose",
        substitutes=items
    )

@router.post("/estimate-nutrition", response_model=NutritionEstimateResponse)
def estimate_nutrition(
    req: NutritionEstimateRequest,
    db: Session = Depends(get_db)
):
    """
    Calculates nutritional breakdown from USDA FoodData Central values
    for an entire recipe or custom ingredients list.
    """
    ing_items = []
    servings = req.servings

    if req.recipe_id:
        recipe = db.query(Recipe).filter(Recipe.id == req.recipe_id).first()
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        servings = recipe.servings or req.servings
        ing_items = [
            {"name": ri.ingredient.name, "amount": ri.amount, "unit": ri.unit}
            for ri in recipe.ingredients
        ]
    elif req.ingredients:
        ing_items = [
            {"name": item.ingredient_name, "amount": item.amount, "unit": item.unit}
            for item in req.ingredients
        ]

    result = nutrition_engine.estimate_recipe(ing_items, servings=servings)

    return NutritionEstimateResponse(
        servings=result["servings"],
        per_serving=result["per_serving"],
        total=result["total"],
        source_verification=result["source_verification"],
        health_labels=result["health_labels"],
        nutrient_breakdown=result["nutrient_breakdown"]
    )

@router.get("/insights", response_model=MLInsightsResponse)
def get_ml_insights(db: Session = Depends(get_db)):
    """
    Returns actual verified ML/DL metrics across all 6 core modules
    from actual database evaluation records.
    Never fabricates metrics.
    """
    metadata_records = db.query(MLModelMetadata).all()

    modules_out = [
        MLModuleMetrics(
            module_name=m.module_name,
            model_name=m.model_name,
            training_status=m.training_status,
            dataset_source=m.dataset_source,
            dataset_size=m.dataset_size,
            last_evaluated_at=m.last_evaluated_at,
            metrics=m.metrics or {},
            notes=m.notes
        )
        for m in metadata_records
    ]

    # Hardware detection
    import torch
    cuda_avail = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_avail else "CPU (Host System)"

    hardware_info = {
        "torch_version": torch.__version__,
        "cuda_available": cuda_avail,
        "device_name": device_name,
        "threads": os.cpu_count()
    }

    return MLInsightsResponse(
        modules=modules_out,
        hardware_status=hardware_info
    )

@router.post("/retrain-preferences")
def retrain_preference_model():
    """Trigger retraining of the Preference Prediction Random Forest & XGBoost models."""
    from backend.app.ml.preference_prediction.train_preference_model import train_and_evaluate
    try:
        train_and_evaluate()
        return {"success": True, "message": "Successfully retrained preference prediction models and updated evaluation metrics."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
