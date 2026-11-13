import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.ml.recommendation.recipe_preprocessor import RecipePreprocessor

class ContentRecommender:
    """Content-based recommendation engine utilizing TF-IDF vectorization and cosine similarity."""

    def __init__(self, max_features: int = 1000):
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=(1, 2),
            sublinear_tf=True
        )
        self.recipe_ids: List[int] = []
        self.tfidf_matrix: np.ndarray = np.array([])
        self.is_fitted: bool = False

    def build_recipe_document(self, recipe: Dict[str, Any]) -> str:
        """Construct a rich text document for a recipe combining ingredients, title, cuisine, and tags."""
        ing_names = []
        for ing in recipe.get("ingredients", []):
            if isinstance(ing, dict):
                name = ing.get("ingredient_name") or ing.get("name") or ""
            else:
                name = str(ing)
            if name:
                ing_names.append(name)

        ing_text = RecipePreprocessor.tokenize_ingredient_corpus(ing_names)
        title = RecipePreprocessor.clean_text(recipe.get("title", ""))
        cuisine = RecipePreprocessor.clean_text(recipe.get("cuisine", ""))
        tags = " ".join([RecipePreprocessor.clean_text(t) for t in recipe.get("tags", [])])
        category = RecipePreprocessor.clean_text(recipe.get("category", ""))

        # Weight ingredients higher by repeating them in the document
        return f"{ing_text} {ing_text} {title} {cuisine} {category} {tags}"

    def fit(self, recipes: List[Dict[str, Any]]) -> "ContentRecommender":
        """Fit the TF-IDF vectorizer on the full recipe catalog."""
        if not recipes:
            return self

        self.recipe_ids = [r["id"] for r in recipes]
        documents = [self.build_recipe_document(r) for r in recipes]
        self.tfidf_matrix = self.vectorizer.fit_transform(documents)
        self.is_fitted = True
        return self

    def recommend_by_query(
        self,
        query_ingredients: List[str],
        top_k: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Compute cosine similarity of query ingredients against the recipe catalog.
        Returns:
            List of (recipe_id, similarity_score) sorted descending by score.
        """
        if not self.is_fitted or not query_ingredients:
            return []

        query_doc = RecipePreprocessor.tokenize_ingredient_corpus(query_ingredients)
        query_vec = self.vectorizer.transform([query_doc])
        sim_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        ranked_indices = np.argsort(sim_scores)[::-1][:top_k]
        results = [
            (self.recipe_ids[idx], float(sim_scores[idx]))
            for idx in ranked_indices
            if sim_scores[idx] > 0.0
        ]
        return results
