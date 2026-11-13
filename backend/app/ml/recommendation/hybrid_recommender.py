from typing import List, Dict, Any, Optional
from backend.app.ml.recommendation.ingredient_matcher import IngredientMatcher
from backend.app.ml.recommendation.content_recommender import ContentRecommender

class HybridRecommender:
    """
    Production Hybrid Recommendation Engine.
    Combines:
    1. Exact & Token-level Ingredient Matching (Recall & Pantry Coverage)
    2. TF-IDF Cosine Similarity over Culinary Semantics
    3. Expiry Prioritization (boosting recipes using ingredients nearing expiration)
    4. Allergy & Dietary Profile Hard Exclusions (backend safety enforcement)
    """

    def __init__(
        self,
        weight_match: float = 0.50,
        weight_tfidf: float = 0.25,
        weight_rating: float = 0.15,
        weight_expiry: float = 0.10,
        missing_penalty: float = 0.05
    ):
        self.w_match = weight_match
        self.w_tfidf = weight_tfidf
        self.w_rating = weight_rating
        self.w_expiry = weight_expiry
        self.missing_penalty = missing_penalty
        self.content_engine = ContentRecommender()

    def fit(self, recipes: List[Dict[str, Any]]) -> "HybridRecommender":
        self.content_engine.fit(recipes)
        return self

    @staticmethod
    def passes_safety_filters(
        recipe: Dict[str, Any],
        dietary_preferences: Optional[List[str]] = None,
        allergies: Optional[List[str]] = None,
        max_time: Optional[int] = None
    ) -> bool:
        """
        Hard exclusions strictly enforced on backend.
        Never recommend a recipe that violates dietary rules or user allergies.
        """
        # Time filter
        if max_time and recipe.get("total_time", 999) > max_time:
            return False

        # Dietary preference filter
        if dietary_preferences:
            flags = recipe.get("dietary_flags", {})
            for pref in dietary_preferences:
                p = pref.lower().strip()
                if p in ["vegetarian", "veg"] and not flags.get("is_vegetarian", False):
                    return False
                if p == "vegan" and not flags.get("is_vegan", False):
                    return False
                if p in ["gluten-free", "gluten_free", "gf"] and not flags.get("is_gluten_free", False):
                    return False

        # Allergy filter
        if allergies:
            rec_allergens = [a.lower().strip() for a in recipe.get("allergens", [])]
            for user_allergy in allergies:
                ua = user_allergy.lower().strip()
                # Normalize peanut/nuts, milk/dairy, egg/eggs
                if ua in ["peanut", "peanuts", "nuts", "tree nuts"]:
                    if any(x in rec_allergens for x in ["peanut", "peanuts", "nuts"]):
                        return False
                elif ua in ["milk", "dairy"]:
                    if any(x in rec_allergens for x in ["milk", "dairy"]):
                        return False
                elif ua in ["egg", "eggs"]:
                    if any(x in rec_allergens for x in ["egg", "eggs"]):
                        return False
                elif ua in ["wheat", "gluten"]:
                    if any(x in rec_allergens for x in ["wheat", "gluten"]):
                        return False
                elif ua in ["soy", "soya"]:
                    if any(x in rec_allergens for x in ["soy", "soya"]):
                        return False
                elif ua in rec_allergens:
                    return False

        return True

    def rank(
        self,
        recipes: List[Dict[str, Any]],
        available_ingredients: List[str],
        expiring_ingredients: Optional[List[str]] = None,
        ratings_map: Optional[Dict[int, float]] = None,
        dietary_preferences: Optional[List[str]] = None,
        allergies: Optional[List[str]] = None,
        cuisine_filter: Optional[str] = None,
        max_time: Optional[int] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Compute real algorithmic hybrid ranking for candidate recipes.
        """
        if not recipes:
            return []

        expiring_set = set(e.lower().strip() for e in (expiring_ingredients or []))
        ratings = ratings_map or {}

        # Precompute TF-IDF similarity scores
        tfidf_scores = dict(self.content_engine.recommend_by_query(available_ingredients, top_k=len(recipes)))

        scored_results: List[Dict[str, Any]] = []

        for recipe in recipes:
            r_id = recipe["id"]

            # Safety filtering
            if not self.passes_safety_filters(recipe, dietary_preferences, allergies, max_time):
                continue

            # Cuisine filter
            if cuisine_filter and cuisine_filter.lower() != "all":
                if recipe.get("cuisine", "").lower() != cuisine_filter.lower():
                    continue

            # Extract recipe ingredient names
            rec_ing_names = [
                (ing.get("ingredient_name") or ing.get("name") or "") if isinstance(ing, dict) else str(ing)
                for ing in recipe.get("ingredients", [])
            ]

            # 1. Ingredient Matcher Evaluation
            match_metrics = IngredientMatcher.match(available_ingredients, rec_ing_names)
            match_ratio = match_metrics["match_ratio"]
            matching_ings = match_metrics["matching_ingredients"]
            missing_ings = match_metrics["missing_ingredients"]

            # 2. TF-IDF Cosine Similarity
            tfidf_sim = tfidf_scores.get(r_id, 0.0)

            # 3. Rating Score Normalized (0.0 to 1.0)
            avg_rating = ratings.get(r_id, 4.0)
            norm_rating = min(max(avg_rating / 5.0, 0.0), 1.0)

            # 4. Expiry Boost
            used_expiring = [ing for ing in matching_ings if ing.lower().strip() in expiring_set]
            expiry_boost = min(len(used_expiring) / max(len(expiring_set), 1), 1.0) if expiring_set else 0.0

            # 5. Hybrid Combined Score
            score = (
                (self.w_match * match_ratio) +
                (self.w_tfidf * tfidf_sim) +
                (self.w_rating * norm_rating) +
                (self.w_expiry * expiry_boost) -
                (self.missing_penalty * len(missing_ings))
            )
            final_score = max(round(float(score) * 100, 2), 0.0)

            # Human-readable ML Explanation
            reasons = []
            if match_ratio >= 0.8:
                reasons.append(f"Uses {int(match_ratio * 100)}% of required ingredients")
            elif match_ratio > 0.0:
                reasons.append(f"Matches {len(matching_ings)} ingredients from your kitchen")
            if used_expiring:
                reasons.append(f"Helps use {len(used_expiring)} expiring item(s)")
            if tfidf_sim > 0.3:
                reasons.append("High culinary profile match with your pantry")
            if len(missing_ings) == 0:
                reasons.append("Ready to cook right now (0 missing items)")
            elif len(missing_ings) <= 2:
                reasons.append(f"Only {len(missing_ings)} missing item(s): {', '.join(missing_ings)}")

            explanation = " • ".join(reasons) if reasons else "Recommended based on kitchen availability."

            scored_results.append({
                "recipe": recipe,
                "score": final_score,
                "match_percentage": round(match_ratio * 100, 1),
                "matching_ingredients": matching_ings,
                "missing_ingredients": missing_ings,
                "used_expiring_count": len(used_expiring),
                "tfidf_similarity": round(tfidf_sim, 4),
                "explanation": explanation,
                "algorithm": "hybrid_tfidf_matcher"
            })

        # Sort descending by hybrid score
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:top_k]
