from typing import List, Dict, Any, Optional
from backend.app.ml.substitution.ingredient_similarity import IngredientSimilarity

class SubstitutionEngine:
    """
    Intelligent culinary substitution engine.
    Matches alternatives based on:
    1. Culinary purpose (baking, frying, spreading, binding, thickening, umami)
    2. Multi-dimensional flavor & texture similarity
    3. Allergen and dietary hard exclusion safety
    4. Exact culinary conversion ratios
    """

    SUBSTITUTION_KNOWLEDGE_BASE: Dict[str, List[Dict[str, Any]]] = {
        "butter": [
            {
                "substitute": "olive oil",
                "purpose": "frying",
                "conversion": "3/4 cup olive oil per 1 cup butter",
                "taste_profile": "Fruity, rich, savory",
                "best_for": "Sautéing, skillet cooking, pasta, roasting",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Excellent for savory cooking; lower saturated fat than butter."
            },
            {
                "substitute": "coconut oil",
                "purpose": "baking",
                "conversion": "1:1 ratio solid coconut oil",
                "taste_profile": "Subtly sweet, rich, clean finish",
                "best_for": "Cookies, cakes, pie crusts, brownies",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Solidifies similarly to butter at room temperature."
            },
            {
                "substitute": "applesauce",
                "purpose": "baking",
                "conversion": "1/2 cup applesauce per 1 cup butter",
                "taste_profile": "Fruity, naturally sweet, moist",
                "best_for": "Muffins, quick breads, sponge cakes",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Greatly reduces fat and calories; keeps baked goods ultra tender."
            },
            {
                "substitute": "avocado",
                "purpose": "spreading",
                "conversion": "1:1 ratio mashed avocado",
                "taste_profile": "Creamy, mild, nutty",
                "best_for": "Toast, sandwiches, wraps",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Rich in healthy monounsaturated fats with zero dairy."
            },
            {
                "substitute": "ghee",
                "purpose": "frying",
                "conversion": "1:1 ratio",
                "taste_profile": "Deeply nutty, toasted butter flavor",
                "best_for": "High-heat searing, curries, roasting",
                "allergens": ["dairy"],
                "dietary": {"is_vegetarian": True, "is_vegan": False, "is_gluten_free": True},
                "notes": "Clarified butter with higher smoke point (485°F); milk solids removed."
            }
        ],
        "heavy cream": [
            {
                "substitute": "coconut cream",
                "purpose": "sauce",
                "conversion": "1:1 ratio chilled coconut cream",
                "taste_profile": "Creamy, rich, slight coconut aroma",
                "best_for": "Curries, creamy soups, vegan ganache",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Thick texture mimics 36% milkfat heavy cream perfectly."
            },
            {
                "substitute": "greek yogurt",
                "purpose": "thickening",
                "conversion": "1:1 ratio whisked with 1 tbsp water",
                "taste_profile": "Tangy, thick, velvety",
                "best_for": "Pasta sauces, cold dressings, dolloping",
                "allergens": ["dairy"],
                "dietary": {"is_vegetarian": True, "is_vegan": False, "is_gluten_free": True},
                "notes": "High in protein, add at low heat to prevent curdling."
            }
        ],
        "egg": [
            {
                "substitute": "flax egg",
                "purpose": "binding",
                "conversion": "1 tbsp ground flaxseed + 3 tbsp water per egg",
                "taste_profile": "Earthy, nutty, neutral",
                "best_for": "Pancakes, muffins, cookies, veggie patties",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Let sit 5 minutes to form a gel-like binding structure."
            },
            {
                "substitute": "applesauce",
                "purpose": "baking",
                "conversion": "1/4 cup unsweetened applesauce per egg",
                "taste_profile": "Subtly sweet, moist",
                "best_for": "Cakes, sweet muffins, brownies",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Acts as binder and moisture supplier in sweet baking."
            }
        ],
        "parmesan": [
            {
                "substitute": "nutritional yeast",
                "purpose": "savory",
                "conversion": "2/3 cup nutritional yeast per 1 cup grated parmesan",
                "taste_profile": "Cheesy, savory, nutty, umami-rich",
                "best_for": "Pasta finishing, popcorn, risottos, salads",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Dairy-free superfood loaded with B vitamins and umami."
            }
        ],
        "soy sauce": [
            {
                "substitute": "tamari",
                "purpose": "seasoning",
                "conversion": "1:1 ratio",
                "taste_profile": "Deep umami, rich, slightly thicker",
                "best_for": "Stir fry, marinades, sushi dipping",
                "allergens": ["soy"],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Traditional Japanese fermented soy with zero wheat."
            },
            {
                "substitute": "coconut aminos",
                "purpose": "seasoning",
                "conversion": "1:1 ratio",
                "taste_profile": "Savory-sweet, lower sodium, mild umami",
                "best_for": "Paleo cooking, clean stir-fries, dressings",
                "allergens": [],
                "dietary": {"is_vegetarian": True, "is_vegan": True, "is_gluten_free": True},
                "notes": "Soy-free and gluten-free alternative with 70% less sodium."
            }
        ]
    }

    @classmethod
    def find_substitutes(
        cls,
        ingredient_name: str,
        purpose: Optional[str] = "all-purpose",
        dietary_filter: Optional[str] = None,
        allergen_filter: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        target = ingredient_name.lower().strip()
        candidates = cls.SUBSTITUTION_KNOWLEDGE_BASE.get(target, [])

        results = []
        user_allergens = [a.lower().strip() for a in (allergen_filter or [])]

        for cand in candidates:
            # 1. Purpose check
            cand_purpose = cand["purpose"]
            if purpose and purpose != "all-purpose" and purpose.lower() != cand_purpose:
                # Rank matching purpose higher, but keep non-matching with penalty
                purpose_match_multiplier = 0.7
            else:
                purpose_match_multiplier = 1.0

            # 2. Safety filter: Allergens
            cand_allergens = [a.lower() for a in cand.get("allergens", [])]
            if any(ua in cand_allergens for ua in user_allergens):
                continue # Hard safety exclusion

            # 3. Safety filter: Dietary
            d_flags = cand.get("dietary", {})
            if dietary_filter:
                df = dietary_filter.lower().strip()
                if df in ["vegan"] and not d_flags.get("is_vegan", False):
                    continue
                if df in ["vegetarian", "veg"] and not d_flags.get("is_vegetarian", False):
                    continue
                if df in ["gluten-free", "gluten_free", "gf"] and not d_flags.get("is_gluten_free", False):
                    continue

            # 4. Compute Profile Similarity
            sim_score = IngredientSimilarity.compute_similarity(target, cand["substitute"])
            adjusted_score = round(sim_score * purpose_match_multiplier * 100, 1)

            results.append({
                "substitute_name": cand["substitute"],
                "similarity_score": adjusted_score,
                "conversion_ratio": cand["conversion"],
                "taste_profile": cand["taste_profile"],
                "best_used_for": cand["best_for"],
                "allergens": cand["allergens"],
                "dietary_flags": cand["dietary"],
                "notes": cand["notes"]
            })

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results
