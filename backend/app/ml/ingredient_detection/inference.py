import os
import sys
from typing import Dict, Any
from backend.app.ml.ingredient_detection.ingredient_detector import IngredientDetector

def run_inference(image_path: str, conf: float = 0.25) -> Dict[str, Any]:
    """Standalone CLI and service inference function."""
    detector = IngredientDetector()
    return detector.detect_ingredients(image_path, confidence_threshold=conf)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        results = run_inference(img_path)
        print("Inference results:", results)
    else:
        print("Usage: python inference.py <path_to_image>")
