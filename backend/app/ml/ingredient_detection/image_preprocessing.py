import cv2
import numpy as np
from PIL import Image, ImageOps
import io
from typing import Tuple, Optional

class ImagePreprocessor:
    """Preprocesses user uploaded ingredient photographs for YOLO inference and feature extraction."""

    TARGET_SIZE: Tuple[int, int] = (640, 640)

    @classmethod
    def load_and_orient(cls, image_bytes: bytes) -> Image.Image:
        """Load image from raw bytes and handle EXIF camera rotation."""
        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image)
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image

    @classmethod
    def letterbox(
        cls,
        img: np.ndarray,
        new_shape: Tuple[int, int] = (640, 640),
        color: Tuple[int, int, int] = (114, 114, 114)
    ) -> Tuple[np.ndarray, float, Tuple[int, int]]:
        """
        Resize and pad image while preserving aspect ratio (YOLO standard letterboxing).
        Returns:
            padded_image, scale_ratio, (pad_w, pad_h)
        """
        shape = img.shape[:2] # [height, width]
        r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])

        new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))
        dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]
        dw /= 2 # divide padding into 2 sides
        dh /= 2

        if shape[::-1] != new_unpad:
            img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)

        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
        return img, r, (dw, dh)

    @classmethod
    def enhance_contrast(cls, img_bgr: np.ndarray) -> np.ndarray:
        """Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) on luminance channel."""
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
