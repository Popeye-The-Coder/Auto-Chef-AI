import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional

class InteractionProcessor:
    """Processes user interactions (cook, save, like, view, skip) into a normalized user-item rating matrix."""

    INTERACTION_WEIGHTS: Dict[str, float] = {
        "cook": 5.0,
        "save": 4.0,
        "like": 3.5,
        "view": 1.0,
        "skip": -2.0
    }

    @classmethod
    def build_matrix(
        cls,
        interactions: List[Dict[str, Any]],
        explicit_ratings: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[pd.DataFrame, Dict[int, int], Dict[int, int]]:
        """
        Creates a user-by-recipe interaction matrix.
        Combines explicit ratings (1-5) and implicit interaction events.
        """
        matrix_dict: Dict[Tuple[int, int], float] = {}

        # 1. Process explicit ratings
        for r in (explicit_ratings or []):
            u_id = r["user_id"]
            rec_id = r["recipe_id"]
            rating = float(r["rating"])
            matrix_dict[(u_id, rec_id)] = rating

        # 2. Process implicit interaction events
        for inter in (interactions or []):
            u_id = inter["user_id"]
            rec_id = inter["recipe_id"]
            itype = inter.get("interaction_type", "view")
            weight = cls.INTERACTION_WEIGHTS.get(itype, 1.0)
            existing = matrix_dict.get((u_id, rec_id))
            if existing is None:
                matrix_dict[(u_id, rec_id)] = max(weight, 0.0)
            else:
                # Blend implicit weight with explicit rating
                matrix_dict[(u_id, rec_id)] = max(existing, weight)

        if not matrix_dict:
            return pd.DataFrame(), {}, {}

        # Build DataFrame
        records = [{"user_id": u, "recipe_id": r, "score": s} for (u, r), s in matrix_dict.items()]
        df = pd.DataFrame(records)
        pivot = df.pivot(index="user_id", columns="recipe_id", values="score").fillna(0.0)

        user_map = {uid: idx for idx, uid in enumerate(pivot.index)}
        item_map = {rid: idx for idx, rid in enumerate(pivot.columns)}

        return pivot, user_map, item_map
