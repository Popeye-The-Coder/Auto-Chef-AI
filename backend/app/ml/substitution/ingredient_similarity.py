from typing import Dict, Any, List, Optional
import numpy as np

class IngredientSimilarity:
    """Computes culinary profile similarity based on flavor, fat, moisture, and texture dimensions."""

    # Culinary vector space: [sweet, savory/umami, salty, sour, bitter, fat_richness, moisture_viscosity]
    CULINARY_VECTORS: Dict[str, List[float]] = {
        "butter": [0.1, 0.2, 0.2, 0.0, 0.0, 0.9, 0.2],
        "olive oil": [0.0, 0.3, 0.0, 0.1, 0.2, 0.95, 0.4],
        "coconut oil": [0.3, 0.0, 0.0, 0.0, 0.0, 0.95, 0.3],
        "applesauce": [0.7, 0.0, 0.0, 0.3, 0.0, 0.0, 0.8],
        "ghee": [0.1, 0.3, 0.0, 0.0, 0.0, 0.98, 0.1],
        "margarine": [0.1, 0.1, 0.3, 0.0, 0.0, 0.85, 0.2],
        "egg": [0.1, 0.4, 0.1, 0.0, 0.0, 0.6, 0.7],
        "flax egg": [0.2, 0.2, 0.0, 0.0, 0.1, 0.4, 0.7],
        "heavy cream": [0.3, 0.2, 0.1, 0.0, 0.0, 0.85, 0.6],
        "coconut cream": [0.4, 0.1, 0.0, 0.0, 0.0, 0.85, 0.6],
        "greek yogurt": [0.2, 0.2, 0.1, 0.5, 0.0, 0.4, 0.7],
        "milk": [0.3, 0.1, 0.1, 0.0, 0.0, 0.3, 0.9],
        "oat milk": [0.4, 0.1, 0.1, 0.0, 0.0, 0.2, 0.9],
        "soy milk": [0.2, 0.2, 0.1, 0.0, 0.0, 0.3, 0.9],
        "almond milk": [0.2, 0.1, 0.0, 0.0, 0.1, 0.2, 0.9],
        "soy sauce": [0.1, 0.9, 0.9, 0.1, 0.1, 0.0, 0.8],
        "tamari": [0.1, 0.95, 0.85, 0.1, 0.1, 0.0, 0.8],
        "coconut aminos": [0.4, 0.7, 0.6, 0.1, 0.0, 0.0, 0.8],
        "parmesan": [0.1, 0.9, 0.8, 0.2, 0.1, 0.7, 0.1],
        "nutritional yeast": [0.1, 0.85, 0.4, 0.1, 0.2, 0.1, 0.0],
        "tofu": [0.1, 0.3, 0.0, 0.0, 0.0, 0.3, 0.6],
        "chicken breast": [0.0, 0.6, 0.1, 0.0, 0.0, 0.2, 0.5]
    }

    @classmethod
    def compute_similarity(cls, ing1: str, ing2: str) -> float:
        v1 = cls.CULINARY_VECTORS.get(ing1.lower().strip())
        v2 = cls.CULINARY_VECTORS.get(ing2.lower().strip())
        if not v1 or not v2:
            return 0.5

        a = np.array(v1)
        b = np.array(v2)
        denom = (np.linalg.norm(a) * np.linalg.norm(b))
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)
