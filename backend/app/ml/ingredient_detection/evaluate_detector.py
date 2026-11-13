import os
import sys
from typing import Dict, Any

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from backend.app.core.config import settings

def evaluate_detector(model_path: str = "yolov8n.pt", data_yaml: str = "./datasets/ingredient_yolo_dataset/data.yaml") -> Dict[str, Any]:
    """Evaluates YOLO detector on validation set and returns precision, recall, and mAP."""
    try:
        from ultralytics import YOLO
        if not os.path.exists(data_yaml):
            return {"status": "Dataset not yet configured for validation evaluation"}

        model = YOLO(model_path)
        metrics = model.val(data=data_yaml)
        return {
            "precision": float(metrics.box.mp),
            "recall": float(metrics.box.mr),
            "map50": float(metrics.box.map50),
            "map50_95": float(metrics.box.map)
        }
    except Exception as e:
        return {"error": str(e), "status": "Evaluation requires trained weights and validation dataset."}

if __name__ == "__main__":
    res = evaluate_detector()
    print("Evaluation result:", res)
