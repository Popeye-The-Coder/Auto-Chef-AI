import re
from typing import Tuple

class NutritionPreprocessor:
    """Parses kitchen units, volumes, and count measures into standard nutritional grams."""

    # Approximate culinary gram equivalents
    UNIT_TO_GRAMS = {
        "g": 1.0,
        "gram": 1.0,
        "grams": 1.0,
        "kg": 1000.0,
        "ml": 1.0, # approx 1g/ml for water/broth/vinegar
        "tbsp": 15.0,
        "tablespoon": 15.0,
        "tablespoons": 15.0,
        "tsp": 5.0,
        "teaspoon": 5.0,
        "teaspoons": 5.0,
        "cup": 240.0,
        "cups": 240.0,
        "oz": 28.35,
        "ounce": 28.35,
        "ounces": 28.35,
        "lb": 453.6,
        "pound": 453.6,
        "clove": 4.0,
        "cloves": 4.0,
        "slice": 35.0,
        "slices": 35.0,
        "can": 400.0,
        "cans": 400.0,
        "bulb": 40.0,
        "bunch": 50.0,
        "pinch": 0.5,
        "items": 100.0,
        "item": 100.0,
        "unit": 100.0
    }

    # Custom weights for common items when unit is 'items' or 'item'
    ITEM_WEIGHTS = {
        "avocado": 150.0,
        "cucumber": 200.0,
        "lemon": 65.0,
        "lime": 50.0,
        "onion": 120.0,
        "egg": 50.0,
        "bell pepper": 120.0,
        "tomato": 120.0,
        "sweet potato": 200.0,
        "chili": 15.0
    }

    @classmethod
    def convert_to_grams(cls, ingredient_name: str, amount: float, unit: str) -> float:
        norm_unit = unit.lower().strip()
        norm_name = ingredient_name.lower().strip()

        if norm_unit in ["item", "items", "unit", "units"]:
            # Check item specific weight
            for k, w in cls.ITEM_WEIGHTS.items():
                if k in norm_name:
                    return amount * w
            return amount * 100.0

        multiplier = cls.UNIT_TO_GRAMS.get(norm_unit, 1.0)
        return amount * multiplier
