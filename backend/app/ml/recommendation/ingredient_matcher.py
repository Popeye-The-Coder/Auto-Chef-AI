from typing import List, Dict, Set, Tuple, Any
from backend.app.ml.recommendation.recipe_preprocessor import RecipePreprocessor

class IngredientMatcher:
    """Computes exact and fuzzy semantic overlap between user pantry items and recipe ingredients."""

    @staticmethod
    def _is_match(user_item: str, recipe_item: str) -> bool:
        """Determines if a user item matches a recipe item based on token containment or exact match."""
        if user_item == recipe_item:
            return True
        u_tokens = set(user_item.split())
        r_tokens = set(recipe_item.split())
        # Check token subset or significant intersection
        if u_tokens and (u_tokens.issubset(r_tokens) or r_tokens.issubset(u_tokens)):
            return True
        return False

    @classmethod
    def match(cls, user_ingredients: List[str], recipe_ingredients: List[str]) -> Dict[str, Any]:
        """
        Evaluate matching metrics between user pantry and a recipe.
        Returns:
            match_ratio: recall of recipe ingredients (matched / total recipe ingredients)
            pantry_utilization: precision of user pantry (matched / total user ingredients)
            jaccard: intersection over union
            matching: list of recipe ingredient names matched
            missing: list of recipe ingredient names missing
        """
        user_norm = [RecipePreprocessor.normalize_ingredient_name(u) for u in user_ingredients]
        rec_norm = [RecipePreprocessor.normalize_ingredient_name(r) for r in recipe_ingredients]

        matched: List[str] = []
        missing: List[str] = []

        for original_r, norm_r in zip(recipe_ingredients, rec_norm):
            found = False
            for norm_u in user_norm:
                if cls._is_match(norm_u, norm_r):
                    matched.append(original_r)
                    found = True
                    break
            if not found:
                missing.append(original_r)

        total_recipe = max(len(recipe_ingredients), 1)
        total_user = max(len(user_ingredients), 1)

        match_ratio = len(matched) / total_recipe
        pantry_utilization = len(matched) / total_user
        union_size = max(len(set(rec_norm).union(set(user_norm))), 1)
        jaccard = len(matched) / union_size

        return {
            "match_ratio": round(match_ratio, 4),
            "pantry_utilization": round(pantry_utilization, 4),
            "jaccard_similarity": round(jaccard, 4),
            "matching_ingredients": matched,
            "missing_ingredients": missing,
            "is_fully_cookable": len(missing) == 0
        }
