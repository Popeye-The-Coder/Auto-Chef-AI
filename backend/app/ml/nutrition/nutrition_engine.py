import json
import os
from typing import List, Dict, Any, Optional
from backend.app.ml.nutrition.nutrition_preprocessor import NutritionPreprocessor

class NutritionEngine:
    """Calculates macro-nutrients and micro-nutrients using USDA FoodData Central values."""

    def __init__(self):
        self.nutrition_db: Dict[str, Dict[str, Any]] = {}
        self.load_usda_data()

    def load_usda_data(self):
        json_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../../datasets/nutrition/usda_nutrition.json")
        )
        if os.path.exists(json_path):
            try:
                with open(json_path, "r") as f:
                    self.nutrition_db = json.load(f)
            except Exception:
                self.nutrition_db = {}

    def estimate_recipe(
        self,
        ingredients: List[Dict[str, Any]],
        servings: int = 4
    ) -> Dict[str, Any]:
        """
        Calculates nutritional values for a recipe based on its ingredient items.
        Each item has: 'name', 'amount', 'unit'
        """
        servings = max(servings, 1)

        total_calories = 0.0
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0
        total_fiber = 0.0
        total_sugar = 0.0
        total_sodium = 0.0

        item_breakdown = []
        verified_count = 0

        for item in ingredients:
            name = item.get("name", "").lower().strip()
            amount = float(item.get("amount", 100.0))
            unit = str(item.get("unit", "g"))

            grams = NutritionPreprocessor.convert_to_grams(name, amount, unit)

            # Match in USDA database
            matched_data = None
            for key, val in self.nutrition_db.items():
                if key in name or name in key:
                    matched_data = val
                    break

            if matched_data:
                factor = grams / 100.0
                cals = matched_data.get("calories", 0.0) * factor
                prot = matched_data.get("protein", 0.0) * factor
                carb = matched_data.get("carbohydrates", 0.0) * factor
                fat = matched_data.get("fat", 0.0) * factor
                fib = matched_data.get("fiber", 0.0) * factor
                sug = matched_data.get("sugar", 0.0) * factor
                sod = matched_data.get("sodium", 0.0) * factor
                status = "USDA Verified"
                verified_count += 1
            else:
                # Fallback estimation based on vegetable/grain heuristic
                factor = grams / 100.0
                cals = 50.0 * factor
                prot = 2.0 * factor
                carb = 8.0 * factor
                fat = 1.0 * factor
                fib = 2.0 * factor
                sug = 2.0 * factor
                sod = 10.0 * factor
                status = "Algorithmic Estimate"

            total_calories += cals
            total_protein += prot
            total_carbs += carb
            total_fat += fat
            total_fiber += fib
            total_sugar += sug
            total_sodium += sod

            item_breakdown.append({
                "ingredient": name,
                "quantity_grams": round(grams, 1),
                "calories": round(cals, 1),
                "protein_g": round(prot, 1),
                "carbs_g": round(carb, 1),
                "fat_g": round(fat, 1),
                "verification": status
            })

        # Calculate per-serving metrics
        per_serving = {
            "calories": round(total_calories / servings, 1),
            "protein": round(total_protein / servings, 1),
            "carbohydrates": round(total_carbs / servings, 1),
            "fat": round(total_fat / servings, 1),
            "fiber": round(total_fiber / servings, 1),
            "sugar": round(total_sugar / servings, 1),
            "sodium": round(total_sodium / servings, 1)
        }

        total_macros = {
            "calories": round(total_calories, 1),
            "protein": round(total_protein, 1),
            "carbohydrates": round(total_carbs, 1),
            "fat": round(total_fat, 1),
            "fiber": round(total_fiber, 1),
            "sugar": round(total_sugar, 1),
            "sodium": round(total_sodium, 1)
        }

        # Health Labels
        health_labels = []
        ps_cal = per_serving["calories"]
        ps_prot = per_serving["protein"]
        ps_carb = per_serving["carbohydrates"]
        ps_fib = per_serving["fiber"]
        ps_sod = per_serving["sodium"]

        if ps_prot >= 25.0:
            health_labels.append("High Protein")
        if ps_cal <= 400.0:
            health_labels.append("Calorie Conscious")
        if ps_carb <= 15.0 and ps_prot >= 15.0:
            health_labels.append("Keto Friendly")
        if ps_fib >= 8.0:
            health_labels.append("High Fiber")
        if ps_sod <= 300.0:
            health_labels.append("Low Sodium")

        verification_ratio = round((verified_count / max(len(ingredients), 1)) * 100, 1)
        source_label = f"USDA FoodData Central ({verification_ratio}% matched)" if verified_count > 0 else "Algorithmic Culinary Estimate"

        return {
            "servings": servings,
            "per_serving": per_serving,
            "total": total_macros,
            "health_labels": health_labels,
            "source_verification": source_label,
            "nutrient_breakdown": item_breakdown
        }
