import os
import yaml
import shutil
from typing import List, Dict

class IngredientDatasetPreparer:
    """Prepares and structures custom ingredient datasets in Ultralytics YOLO format."""

    INGREDIENT_CLASSES: List[str] = [
        "tomato", "avocado", "lemon", "lime", "onion",
        "garlic", "bell pepper", "broccoli", "egg", "pasta"
    ]

    def __init__(self, output_dir: str = "./datasets/ingredient_yolo_dataset"):
        self.output_dir = os.path.abspath(output_dir)
        self.train_img_dir = os.path.join(self.output_dir, "train", "images")
        self.train_lbl_dir = os.path.join(self.output_dir, "train", "labels")
        self.val_img_dir = os.path.join(self.output_dir, "val", "images")
        self.val_lbl_dir = os.path.join(self.output_dir, "val", "labels")

    def create_structure(self):
        """Create standard YOLO directory hierarchy."""
        for d in [self.train_img_dir, self.train_lbl_dir, self.val_img_dir, self.val_lbl_dir]:
            os.makedirs(d, exist_ok=True)

        # Generate data.yaml
        yaml_content = {
            "path": self.output_dir,
            "train": "train/images",
            "val": "val/images",
            "names": {idx: name for idx, name in enumerate(self.INGREDIENT_CLASSES)}
        }

        yaml_path = os.path.join(self.output_dir, "data.yaml")
        with open(yaml_path, "w") as f:
            yaml.dump(yaml_content, f, default_flow_style=False)

        print(f"Dataset structure and data.yaml created at: {yaml_path}")
        return yaml_path

if __name__ == "__main__":
    preparer = IngredientDatasetPreparer()
    preparer.create_structure()
