import math
import numpy as np
from typing import List, Dict, Any, Set

class RecommendationEvaluator:
    """Computes ranking and information retrieval metrics: Precision@K, Recall@K, NDCG@K, HitRate@K."""

    @staticmethod
    def precision_at_k(recommended_ids: List[int], ground_truth_ids: Set[int], k: int) -> float:
        if k <= 0:
            return 0.0
        top_k = recommended_ids[:k]
        hits = len(set(top_k).intersection(ground_truth_ids))
        return hits / float(k)

    @staticmethod
    def recall_at_k(recommended_ids: List[int], ground_truth_ids: Set[int], k: int) -> float:
        if not ground_truth_ids:
            return 0.0
        top_k = recommended_ids[:k]
        hits = len(set(top_k).intersection(ground_truth_ids))
        return hits / float(len(ground_truth_ids))

    @staticmethod
    def hit_rate_at_k(recommended_ids: List[int], ground_truth_ids: Set[int], k: int) -> float:
        top_k = recommended_ids[:k]
        return 1.0 if len(set(top_k).intersection(ground_truth_ids)) > 0 else 0.0

    @staticmethod
    def ndcg_at_k(recommended_ids: List[int], ground_truth_ids: Set[int], k: int) -> float:
        if not ground_truth_ids or k <= 0:
            return 0.0
        top_k = recommended_ids[:k]
        dcg = 0.0
        for i, item_id in enumerate(top_k):
            if item_id in ground_truth_ids:
                dcg += 1.0 / math.log2(i + 2) # i + 2 because index is 0-based

        # Ideal DCG
        ideal_hits = min(len(ground_truth_ids), k)
        idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
        if idcg == 0:
            return 0.0
        return dcg / idcg

    @classmethod
    def evaluate_benchmark(
        cls,
        eval_cases: List[Dict[str, Any]],
        recommender_fn,
        k_values: List[int] = [3, 5, 10]
    ) -> Dict[str, Any]:
        """
        Runs evaluation over test benchmark cases.
        Each test case has:
            "available_ingredients": List[str]
            "ground_truth_recipes": Set[int]
        """
        results = {}
        for k in k_values:
            precisions = []
            recalls = []
            hit_rates = []
            ndcgs = []

            for case in eval_cases:
                available = case["available_ingredients"]
                ground_truth = set(case["ground_truth_recipes"])
                recommendations = recommender_fn(available, top_k=k)
                rec_ids = [r["recipe"]["id"] if isinstance(r, dict) and "recipe" in r else r["id"] for r in recommendations]

                precisions.append(cls.precision_at_k(rec_ids, ground_truth, k))
                recalls.append(cls.recall_at_k(rec_ids, ground_truth, k))
                hit_rates.append(cls.hit_rate_at_k(rec_ids, ground_truth, k))
                ndcgs.append(cls.ndcg_at_k(rec_ids, ground_truth, k))

            results[f"precision@{k}"] = round(float(np.mean(precisions)), 4)
            results[f"recall@{k}"] = round(float(np.mean(recalls)), 4)
            results[f"hit_rate@{k}"] = round(float(np.mean(hit_rates)), 4)
            results[f"ndcg@{k}"] = round(float(np.mean(ndcgs)), 4)

        return results
