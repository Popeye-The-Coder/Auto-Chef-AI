import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from backend.app.api.deps import get_db, get_optional_user
from backend.app.core.config import settings
from backend.app.models.entities import User, Ingredient, KitchenInventory, IngredientDetection
from backend.app.schemas.schemas import (
    IngredientResponse, IngredientCreate, DetectionResult, ConfirmDetectionRequest, DetectedItem
)
from backend.app.ml.ingredient_detection.ingredient_detector import IngredientDetector
from backend.app.ml.ingredient_detection.image_preprocessing import ImagePreprocessor

router = APIRouter()
detector = IngredientDetector()

@router.get("/", response_model=List[IngredientResponse])
def list_ingredients(db: Session = Depends(get_db)):
    return db.query(Ingredient).order_by(Ingredient.name.asc()).all()

@router.post("/", response_model=IngredientResponse)
def create_ingredient(ing_in: IngredientCreate, db: Session = Depends(get_db)):
    norm_name = ing_in.name.lower().strip()
    existing = db.query(Ingredient).filter(Ingredient.normalized_name == norm_name).first()
    if existing:
        return existing

    ing = Ingredient(
        name=ing_in.name,
        normalized_name=norm_name,
        category=ing_in.category or "pantry",
        common_allergens=ing_in.common_allergens,
        dietary_flags=ing_in.dietary_flags,
        default_unit=ing_in.default_unit,
        average_shelf_life_days=ing_in.average_shelf_life_days
    )
    db.add(ing)
    db.commit()
    db.refresh(ing)
    return ing

@router.post("/upload", response_model=DetectionResult)
async def upload_ingredient_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
        )

    # Save to uploads directory
    unique_name = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    content = await file.read()
    if len(content) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 10MB limit.")

    with open(saved_path, "wb") as f:
        f.write(content)

    # Run ingredient detection
    try:
        detection_output = detector.detect_ingredients(saved_path, confidence_threshold=settings.CONFIDENCE_THRESHOLD)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

    # Record in database
    detection_record = IngredientDetection(
        user_id=current_user.id,
        image_filename=unique_name,
        detected_items=detection_output["detected_ingredients"],
        is_confirmed=False
    )
    db.add(detection_record)
    db.commit()
    db.refresh(detection_record)

    image_url = f"/uploads/{unique_name}"
    detected_items = [
        DetectedItem(
            name=item["name"],
            confidence=item["confidence"],
            box=item["box"],
            category=item.get("category", "ingredient"),
            confirmed=True
        )
        for item in detection_output["detected_ingredients"]
    ]

    return DetectionResult(
        detection_id=detection_record.id,
        image_url=image_url,
        detected_ingredients=detected_items,
        model_name=detection_output["model_name"],
        inference_time_ms=detection_output["inference_time_ms"],
        message=f"Successfully detected {len(detected_items)} ingredients using {detection_output['model_name']}."
    )

@router.post("/confirm")
def confirm_detected_ingredients(
    confirm_in: ConfirmDetectionRequest,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Confirm detected ingredients and add to user kitchen inventory."""
    added_to_inventory = []
    now = datetime.utcnow()

    for ing_name in confirm_in.confirmed_ingredients:
        norm_name = ing_name.lower().strip()
        ing = db.query(Ingredient).filter(Ingredient.normalized_name == norm_name).first()
        if not ing:
            ing = Ingredient(
                name=ing_name.capitalize(),
                normalized_name=norm_name,
                category="produce",
                average_shelf_life_days=7
            )
            db.add(ing)
            db.flush()

        if confirm_in.add_to_inventory:
            shelf_days = ing.average_shelf_life_days or 7
            inv_item = KitchenInventory(
                user_id=current_user.id,
                ingredient_id=ing.id,
                quantity=1.0,
                unit=ing.default_unit or "items",
                purchase_date=now,
                expiry_date=now + timedelta(days=shelf_days)
            )
            db.add(inv_item)
            added_to_inventory.append(ing.name)

    db.commit()
    return {
        "success": True,
        "confirmed_count": len(confirm_in.confirmed_ingredients),
        "added_to_inventory": added_to_inventory,
        "message": f"Confirmed {len(confirm_in.confirmed_ingredients)} ingredients and added to your inventory."
    }
