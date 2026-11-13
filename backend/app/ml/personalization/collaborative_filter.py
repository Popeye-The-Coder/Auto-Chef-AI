import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD

class CollaborativeFilter:
    """
    Collaborative filtering engine for AutoChef.
    Supports:
    1. Item-Item Collaborative Filtering (Cosine similarity of recipe interaction profiles)
    2. User-User Collaborative Filtering (Neighborhood-based taste clustering)
    3. Truncated SVD Matrix Factorization for latent culinary preferences
    """

    def __init__(self, n_components: int = 5):
        self.n_components = n_components
        self.user_item_matrix: Optional[pd.DataFrame] = None
        self.item_similarity_df: Optional[pd.DataFrame] = None
        self.user_similarity_df: Optional[pd.DataFrame] = None
        self.svd_reconstructed: Optional[pd.DataFrame] = None
        self.is_trained: bool = False

    def train(self, user_item_matrix: pd.DataFrame) -> "CollaborativeFilter":
        """Train the collaborative filtering similarity matrices and latent factors."""
        if user_item_matrix.empty or user_item_matrix.shape[0] < 2 or user_item_matrix.shape[1] < 2:
            self.is_trained = False
            return self

        self.user_item_matrix = user_item_matrix

        # 1. Item-Item Cosine Similarity
        # Columns are recipes, so transpose to get item-by-user matrix
        item_matrix = user_item_matrix.T.values
        item_sim = cosine_similarity(item_matrix)
        self.item_similarity_df = pd.DataFrame(
            item_sim,
            index=user_item_matrix.columns,
            columns=user_item_matrix.columns
        )

        # 2. User-User Cosine Similarity
        user_sim = cosine_similarity(user_item_matrix.values)
        self.user_similarity_df = pd.DataFrame(
            user_sim,
            index=user_item_matrix.index,
            columns=user_item_matrix.index
        )

        # 3. Matrix Factorization via TruncatedSVD
        try:
            n_comp = min(self.n_components, user_item_matrix.shape[0] - 1, user_item_matrix.shape[1] - 1)
            if n_comp >= 1:
                svd = TruncatedSVD(n_components=n_comp, random_state=42)
                reduced = svd.fit_transform(user_item_matrix.values)
                reconstructed = svd.inverse_transform(reduced)
                self.svd_reconstructed = pd.DataFrame(
                    reconstructed,
                    index=user_item_matrix.index,
                    columns=user_item_matrix.columns
                )
        except Exception:
            self.svd_reconstructed = None

        self.is_trained = True
        return self

    def recommend_for_user(
        self,
        user_id: int,
        candidate_recipe_ids: Optional[List[int]] = None,
        top_k: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Recommend candidate recipes for a specific user.
        If user is unknown or has no interactions (Cold Start), returns empty list.
        """
        if not self.is_trained or self.user_item_matrix is None or user_id not in self.user_item_matrix.index:
            return []

        user_vector = self.user_item_matrix.loc[user_id]
        interacted_items = user_vector[user_vector > 0].index.tolist()

        if not interacted_items:
            return []

        # Predict score for each candidate recipe using Item-Item similarity
        candidates = candidate_recipe_ids or [c for c in self.user_item_matrix.columns if c not in interacted_items]
        predictions: List[Tuple[int, float]] = []

        for candidate_id in candidates:
            if candidate_id in interacted_items:
                continue

            if candidate_id not in self.item_similarity_df.columns:
                continue

            # Weight ratings by similarities to interacted items
            sim_scores = self.item_similarity_df.loc[candidate_id, interacted_items]
            user_ratings = user_vector[interacted_items]

            sim_sum = np.sum(np.abs(sim_scores.values))
            if sim_sum > 0:
                pred_rating = np.dot(sim_scores.values, user_ratings.values) / sim_sum
            else:
                pred_rating = 0.0

            if pred_rating > 0:
                predictions.append((int(candidate_id), float(round(pred_rating, 4))))

        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:top_k]

    def get_similar_recipes(self, recipe_id: int, top_k: int = 5) -> List[Tuple[int, float]]:
        """Get top-k recipes with similar interaction patterns to the target recipe."""
        if not self.is_trained or self.item_similarity_df is None or recipe_id not in self.item_similarity_df.index:
            return []

        sim_series = self.item_similarity_df.loc[recipe_id].drop(recipe_id)
        top_similar = sim_series.nlargest(top_k)
        return [(int(r_id), float(round(score, 4))) for r_id, score in top_similar.items()]
