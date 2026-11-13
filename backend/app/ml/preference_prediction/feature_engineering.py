import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple

class PreferenceFeatureEngineer:
    """
    Transforms User-Recipe interaction pairs into predictive ML feature vectors.
    Features:
    - cuisine_match: 1 if recipe cuisine matches user preferred cuisines, 0 otherwise
    - time_ratio: recipe total time / user max cooking time
    - difficulty_level: ordinal encoding (easy=1, medium=2, hard=3)
    - user_avg_rating: user historical rating baseline
    - recipe_avg_rating: global recipe popularity rating
    - calories_normalized: recipe calories / 1000
    - protein_g: recipe protein
    - carbs_g: recipe carbs
    - fat_g: recipe fat
    - num_ingredients: total ingredients in recipe
    - is_vegetarian: recipe flag
    - is_vegan: recipe flag
    - is_gluten_free: recipe flag
    """

    DIFFICULTY_MAP: Dict[str, int] = {
        "easy": 1,
        "medium": 2,
        "hard": 3
    }

    FEATURE_NAMES: List[str] = [
        "cuisine_match",
        "time_ratio",
        "difficulty_level",
        "user_avg_rating",
        "recipe_avg_rating",
        "calories_normalized",
        "protein_g",
        "carbs_g",
        "fat_g",
        "num_ingredients",
        "is_vegetarian",
        "is_vegan",
        "is_gluten_free"
    ]

    @classmethod
    def extract_features(
        cls,
        user_profile: Dict[str, Any],
        recipe: Dict[str, Any],
        user_history_stats: Dict[str, float],
        recipe_history_stats: Dict[str, float]
    ) -> List[float]:
        # Cuisine match
        user_cuisines = [c.lower() for c in user_profile.get("preferred_cuisines", [])]
        recipe_cuisine = str(recipe.get("cuisine", "")).lower()
        cuisine_match = 1.0 if recipe_cuisine in user_cuisines else 0.0

        # Time ratio
        max_time = max(float(user_profile.get("max_cooking_time", 60)), 15.0)
        rec_time = float(recipe.get("total_time", 30))
        time_ratio = min(rec_time / max_time, 2.5)

        # Difficulty
        diff_str = str(recipe.get("difficulty", "medium")).lower()
        diff_level = float(cls.DIFFICULTY_MAP.get(diff_str, 2))

        # User and recipe rating baseline
        u_avg = float(user_history_stats.get("avg_rating", 4.0))
        r_avg = float(recipe_history_stats.get("avg_rating", 4.2))

        # Nutritional features
        cal_norm = float(recipe.get("calories", 400.0)) / 1000.0
        protein = float(recipe.get("protein", 15.0))
        carbs = float(recipe.get("carbs", 45.0))
        fat = float(recipe.get("fat", 15.0))

        # Ingredients count
        num_ings = float(len(recipe.get("ingredients", [])))

        # Dietary flags
        d_flags = recipe.get("dietary_flags", {})
        is_veg = 1.0 if d_flags.get("is_vegetarian") else 0.0
        is_vegan = 1.0 if d_flags.get("is_vegan") else 0.0
        is_gf = 1.0 if d_flags.get("is_gluten_free") else 0.0

        return [
            cuisine_match,
            time_ratio,
            diff_level,
            u_avg,
            r_avg,
            cal_norm,
            protein,
            carbs,
            fat,
            num_ings,
            is_veg,
            is_vegan,
            is_gf
        ]
