import os
import sys
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.database.session import SessionLocal
from backend.app.models.entities import Recipe, MLModelMetadata
from backend.app.ml.recommendation.hybrid_recommender import HybridRecommender
from backend.app.ml.recommendation.recommendation_evaluator import RecommendationEvaluator

def run_recipe_recommender_evaluation():
    print("Evaluating Recipe Recommendation Engine on Culinary Benchmark...")
    db = SessionLocal()
    recipes = db.query(Recipe).all()

    recipe_dicts = []
    for r in recipes:
        recipe_dicts.append({
            "id": r.id,
            "title": r.title,
            "cuisine": r.cuisine,
            "category": r.category,
            "total_time": r.total_time,
            "dietary_flags": r.dietary_flags or {},
            "allergens": r.allergens or [],
            "ingredients": [{"name": ri.ingredient.name} for ri in r.ingredients]
        })

    hybrid = HybridRecommender()
    hybrid.fit(recipe_dicts)

    # Benchmark evaluation scenarios with known relevant recipes
    eval_cases = [
        # Italian pasta lover
        {
            "available_ingredients": ["pasta", "tomato", "garlic", "basil", "parmesan", "olive oil"],
            "ground_truth_recipes": [1, 8] # Classic Creamy Tomato Basil Pasta, Garlic Tomato Soup
        },
        # Vegan salad & curry
        {
            "available_ingredients": ["chickpeas", "avocado", "cucumber", "tomato", "lemon", "olive oil"],
            "ground_truth_recipes": [2, 9] # Avocado Chickpea Salad, Burrito Bowl
        },
        # Mexican fajita cook
        {
            "available_ingredients": ["chicken breast", "bell pepper", "onion", "lime", "olive oil"],
            "ground_truth_recipes": [4] # Chicken Fajita Skillet
        },
        # Asian stir fry
        {
            "available_ingredients": ["tofu", "broccoli", "soy sauce", "garlic", "ginger", "sesame oil"],
            "ground_truth_recipes": [5] # Crispy Tofu & Broccoli
        },
        # Breakfast toast
        {
            "available_ingredients": ["bread", "avocado", "egg", "lemon"],
            "ground_truth_recipes": [6, 10] # Avocado Toast, Omelette
        },
        # Seafood dinner
        {
            "available_ingredients": ["salmon", "butter", "lemon", "garlic", "olive oil"],
            "ground_truth_recipes": [7] # Pan-Seared Salmon
        }
    ]

    def recommender_fn(ingredients, top_k):
        return hybrid.rank(
            recipes=recipe_dicts,
            available_ingredients=ingredients,
            top_k=top_k
        )

    metrics = RecommendationEvaluator.evaluate_benchmark(
        eval_cases=eval_cases,
        recommender_fn=recommender_fn,
        k_values=[1, 3, 5]
    )

    print("\n--- HYBRID RECOMMENDER BENCHMARK EVALUATION RESULTS ---")
    for k, v in metrics.items():
        print(f"{k}: {v}")

    # Update MLModelMetadata
    meta = db.query(MLModelMetadata).filter_by(module_name="recipe_recommendation").first()
    if meta:
        meta.training_status = "Trained"
        meta.metrics = metrics
        meta.dataset_size = len(recipes)
        meta.last_evaluated_at = datetime.utcnow()
        db.commit()
        print("Updated MLModelMetadata for recipe_recommendation with actual evaluated IR metrics.")

    db.close()

if __name__ == "__main__":
    run_recipe_recommender_evaluation()
