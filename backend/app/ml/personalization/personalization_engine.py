from typing import List, Dict, Any, Optional
from backend.app.ml.personalization.interaction_processor import InteractionProcessor
from backend.app.ml.personalization.collaborative_filter import CollaborativeFilter
from backend.app.ml.recommendation.hybrid_recommender import HybridRecommender

class PersonalizationEngine:
    """
    Unified Personalization Engine.
    Handles active user personalized recommendations with Cold-Start mitigation:
    - Warm user (>2 interactions): Blends Item-Item Collaborative Filtering + Hybrid Content Engine
    - Cold user (0-2 interactions): Uses User Profile Dietary/Cuisine preferences + Pantry availability
    """

    def __init__(self):
        self.cf = CollaborativeFilter()
        self.is_ready = False

    def train_from_database_records(
        self,
        interactions: List[Dict[str, Any]],
        ratings: List[Dict[str, Any]]
    ) -> bool:
        if not interactions and not ratings:
            self.is_ready = False
            return False

        pivot, _, _ = InteractionProcessor.build_matrix(interactions, ratings)
        if pivot.empty:
            self.is_ready = False
            return False

        self.cf.train(pivot)
        self.is_ready = self.cf.is_trained
        return self.is_ready

    def personalize(
        self,
        user_id: int,
        all_recipes: List[Dict[str, Any]],
        user_profile: Optional[Dict[str, Any]] = None,
        available_ingredients: Optional[List[str]] = None,
        expiring_ingredients: Optional[List[str]] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized ranked recommendations.
        """
        candidate_ids = [r["id"] for r in all_recipes]
        cf_recs = dict(self.cf.recommend_for_user(user_id, candidate_recipe_ids=candidate_ids, top_k=len(all_recipes)))

        # Check if user is cold or warm
        is_warm_user = len(cf_recs) > 0

        # Safety & dietary profile
        dietary_prefs = user_profile.get("dietary_preferences", []) if user_profile else []
        allergies = user_profile.get("allergies", []) if user_profile else []
        preferred_cuisines = user_profile.get("preferred_cuisines", []) if user_profile else []
        max_time = user_profile.get("max_cooking_time", 60) if user_profile else None

        hybrid = HybridRecommender()
        hybrid.fit(all_recipes)

        results = []
        for recipe in all_recipes:
            r_id = recipe["id"]

            # Safety check
            if not HybridRecommender.passes_safety_filters(recipe, dietary_prefs, allergies, max_time):
                continue

            rec_ings = [ing["name"] if isinstance(ing, dict) else str(ing) for ing in recipe.get("ingredients", [])]
            match_stats = HybridRecommender.passes_safety_filters(recipe, dietary_prefs, allergies, max_time)

            # Match ratio
            from backend.app.ml.recommendation.ingredient_matcher import IngredientMatcher
            m = IngredientMatcher.match(available_ingredients or [], rec_ings)
            match_ratio = m["match_ratio"]

            # Cuisine boost if preferred
            cuisine_boost = 0.2 if recipe.get("cuisine") in preferred_cuisines else 0.0

            # Collaborative score
            cf_score = cf_recs.get(r_id, 0.0) / 5.0 # normalized 0-1

            if is_warm_user:
                # 40% CF, 40% Pantry Match, 20% Cuisine preference
                final_score = (0.40 * cf_score) + (0.40 * match_ratio) + (0.20 * cuisine_boost)
                strategy = "Collaborative-Content Hybrid"
                expl = f"Personalized to your taste profile ({int(cf_score * 100)}% taste match) and kitchen stock."
            else:
                # Cold start: 60% Pantry Match, 40% Cuisine preference
                final_score = (0.60 * match_ratio) + (0.40 * cuisine_boost)
                strategy = "Cold-Start Profile & Pantry"
                expl = "Recommended based on your preferred cuisines and available ingredients."

            results.append({
                "recipe": recipe,
                "score": round(final_score * 100, 2),
                "match_percentage": round(match_ratio * 100, 1),
                "matching_ingredients": m["matching_ingredients"],
                "missing_ingredients": m["missing_ingredients"],
                "explanation": expl,
                "algorithm": strategy
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
