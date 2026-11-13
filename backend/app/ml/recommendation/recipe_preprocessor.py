import re
import unicodedata
from typing import List, Set

class RecipePreprocessor:
    """Preprocesses and normalizes ingredient and recipe textual features for NLP and ML matching."""

    STOPWORDS: Set[str] = {
        "cup", "cups", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons",
        "g", "gram", "grams", "kg", "ml", "liter", "liters", "oz", "ounce", "ounces",
        "lb", "pound", "pounds", "pinch", "clove", "cloves", "slice", "slices", "can", "cans",
        "bunch", "fresh", "dried", "chopped", "diced", "minced", "sliced", "ground",
        "peeled", "cut", "crushed", "shredded", "grated", "ripe", "extra", "virgin",
        "large", "medium", "small", "whole", "halved", "optional", "to", "taste",
        "warm", "cold", "hot", "finely", "roughly", "about", "heaped"
    }

    @classmethod
    def clean_text(cls, text: str) -> str:
        """Strip accents, lowercase, and remove special characters."""
        if not text:
            return ""
        text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s-]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    @classmethod
    def normalize_ingredient_name(cls, raw_ingredient: str) -> str:
        """Extract the core ingredient noun phrase by stripping quantities, culinary adjectives, and plurals."""
        cleaned = cls.clean_text(raw_ingredient)
        tokens = cleaned.split()
        filtered = []
        for t in tokens:
            if t in cls.STOPWORDS or t.isnumeric():
                continue
            # Simple stemming for plurals
            if t.endswith("ies") and len(t) > 4:
                t = t[:-3] + "y"
            elif t.endswith("es") and len(t) > 4:
                t = t[:-2]
            elif t.endswith("s") and not t.endswith("ss") and len(t) > 3:
                t = t[:-1]
            filtered.append(t)
        if not filtered:
            return cleaned
        return " ".join(filtered)

    @classmethod
    def tokenize_ingredient_corpus(cls, ingredients_list: List[str]) -> str:
        """Join normalized ingredient tokens into a clean document for TF-IDF vectorization."""
        normalized = [cls.normalize_ingredient_name(ing) for ing in ingredients_list]
        return " ".join(normalized)
