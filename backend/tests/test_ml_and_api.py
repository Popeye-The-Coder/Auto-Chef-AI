import pytest
import os
import io
import json
from PIL import Image
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.entities import Recipe, User, Ingredient
from backend.app.ml.recommendation.recipe_preprocessor import RecipePreprocessor
from backend.app.ml.recommendation.ingredient_matcher import IngredientMatcher
from backend.app.ml.recommendation.hybrid_recommender import HybridRecommender
from backend.app.ml.personalization.collaborative_filter import CollaborativeFilter
from backend.app.ml.personalization.interaction_processor import InteractionProcessor
from backend.app.ml.preference_prediction.preference_predictor import PreferencePredictor
from backend.app.ml.preference_prediction.feature_engineering import PreferenceFeatureEngineer
from backend.app.ml.substitution.substitution_engine import SubstitutionEngine
from backend.app.ml.nutrition.nutrition_engine import NutritionEngine
from backend.app.ml.nutrition.nutrition_preprocessor import NutritionPreprocessor

client = TestClient(app)

# --- ML UNIT TESTS ---

def test_recipe_preprocessor_normalization():
    raw = "2 cups fresh ripe San Marzano tomatoes, chopped"
    norm = RecipePreprocessor.normalize_ingredient_name(raw)
    assert "tomato" in norm or "tomatoes" in norm
    assert "cup" not in norm
    assert "chopped" not in norm

def test_ingredient_matcher_exact_and_fuzzy():
    user_pantry = ["pasta", "tomato", "garlic", "olive oil"]
    recipe_ings = ["pasta", "crushed tomatoes", "garlic cloves", "olive oil", "fresh basil"]
    res = IngredientMatcher.match(user_pantry, recipe_ings)
    assert res["match_ratio"] >= 0.75 # 4 of 5 matched
    assert "fresh basil" in res["missing_ingredients"]
    assert res["is_fully_cookable"] is False

def test_hybrid_recommender_allergy_exclusion():
    # Recipe with peanut allergen
    test_recipe = {
        "id": 99,
        "title": "Peanut Satay Bowl",
        "cuisine": "Thai",
        "total_time": 20,
        "dietary_flags": {"is_vegetarian": True},
        "allergens": ["peanut"],
        "ingredients": [{"name": "peanuts"}, {"name": "noodles"}]
    }
    # User allergic to peanuts
    passes = HybridRecommender.passes_safety_filters(
        test_recipe,
        dietary_preferences=["vegetarian"],
        allergies=["peanut"]
    )
    assert passes is False, "Safety filter failed: peanut recipe recommended to peanut-allergic user!"

def test_hybrid_recommender_dietary_vegan_exclusion():
    # Recipe with dairy (vegetarian, but not vegan)
    test_recipe = {
        "id": 100,
        "title": "Cheese Pasta",
        "cuisine": "Italian",
        "total_time": 15,
        "dietary_flags": {"is_vegetarian": True, "is_vegan": False},
        "allergens": ["dairy"],
        "ingredients": [{"name": "pasta"}, {"name": "parmesan"}]
    }
    # Vegan user
    passes = HybridRecommender.passes_safety_filters(
        test_recipe,
        dietary_preferences=["vegan"],
        allergies=[]
    )
    assert passes is False, "Safety filter failed: non-vegan recipe passed vegan filter!"

def test_collaborative_filtering_cold_start():
    cf = CollaborativeFilter()
    # Empty / untrained matrix
    recs = cf.recommend_for_user(user_id=999)
    assert recs == []

def test_preference_predictor_output_contract():
    predictor = PreferencePredictor()
    dummy_profile = {
        "preferred_cuisines": ["Italian"],
        "max_cooking_time": 45,
        "dietary_preferences": ["vegetarian"],
        "allergies": []
    }
    dummy_recipe = {
        "id": 1,
        "title": "Tomato Basil Pasta",
        "cuisine": "Italian",
        "total_time": 25,
        "difficulty": "easy",
        "calories": 420.0,
        "protein": 14.0,
        "carbs": 60.0,
        "fat": 12.0,
        "dietary_flags": {"is_vegetarian": True},
        "allergens": []
    }
    pred = predictor.predict(dummy_profile, dummy_recipe)
    assert "predicted_enjoyment" in pred
    assert "confidence_score" in pred
    assert 0.0 <= pred["confidence_score"] <= 1.0
    assert "algorithm" in pred

def test_substitution_context_awareness():
    # Test butter substitution for baking vs frying
    subs_baking = SubstitutionEngine.find_substitutes("butter", purpose="baking")
    subs_names_baking = [s["substitute_name"] for s in subs_baking]
    assert "applesauce" in subs_names_baking or "coconut oil" in subs_names_baking

    subs_frying = SubstitutionEngine.find_substitutes("butter", purpose="frying")
    subs_names_frying = [s["substitute_name"] for s in subs_frying]
    assert "olive oil" in subs_names_frying or "ghee" in subs_names_frying

def test_substitution_allergen_enforcement():
    # User allergic to dairy looking for heavy cream substitute
    subs = SubstitutionEngine.find_substitutes(
        "heavy cream",
        purpose="sauce",
        allergen_filter=["dairy"]
    )
    for s in subs:
        assert "dairy" not in s["allergens"], f"Allergen leak: {s['substitute_name']} contains dairy!"
    assert any(s["substitute_name"] == "coconut cream" for s in subs)

def test_nutrition_calculation():
    engine = NutritionEngine()
    ingredients = [
        {"name": "pasta", "amount": 200.0, "unit": "g"},
        {"name": "tomato", "amount": 400.0, "unit": "g"},
        {"name": "olive oil", "amount": 30.0, "unit": "ml"}
    ]
    res = engine.estimate_recipe(ingredients, servings=2)
    assert res["servings"] == 2
    assert res["per_serving"]["calories"] > 100.0
    assert "source_verification" in res
    assert len(res["nutrient_breakdown"]) == 3

# --- API INTEGRATION TESTS ---

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_recipe_search_endpoint():
    response = client.get("/api/v1/recipes/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "title" in data[0]

def test_recipe_detail_endpoint():
    response = client.get("/api/v1/recipes/1")
    assert response.status_code == 200
    recipe = response.json()
    assert recipe["id"] == 1
    assert "instructions" in recipe
    assert len(recipe["ingredients"]) > 0

def test_recommendation_endpoint():
    payload = {
        "available_ingredients": ["tomato", "pasta", "garlic", "basil", "olive oil"],
        "use_inventory": False,
        "limit": 5
    }
    response = client.post("/api/v1/recipes/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert data["total_found"] > 0
    top = data["recommendations"][0]
    assert top["score"] > 0.0
    assert len(top["matching_ingredients"]) > 0

def test_ml_insights_endpoint():
    response = client.get("/api/v1/ml/insights")
    assert response.status_code == 200
    data = response.json()
    assert "modules" in data
    assert len(data["modules"]) >= 4
    # Check that metrics are present for trained modules
    rec_mod = next((m for m in data["modules"] if m["module_name"] == "recipe_recommendation"), None)
    assert rec_mod is not None
    assert rec_mod["training_status"] == "Trained"
    assert "precision@1" in rec_mod["metrics"]

def test_image_upload_detection_endpoint():
    # Create synthetic test RGB image with a red patch (tomato)
    img = Image.new("RGB", (300, 300), color=(255, 255, 255))
    for x in range(50, 250):
        for y in range(50, 250):
            img.putpixel((x, y), (220, 30, 30))

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)

    files = {"file": ("test_tomato.jpg", img_byte_arr, "image/jpeg")}
    response = client.post("/api/v1/ingredients/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "detected_ingredients" in data
    assert "inference_time_ms" in data
    assert data["inference_time_ms"] >= 0.0
