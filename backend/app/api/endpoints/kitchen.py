from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from backend.app.api.deps import get_db, get_optional_user
from backend.app.models.entities import User, KitchenInventory, Ingredient
from backend.app.schemas.schemas import (
    InventoryItemResponse, InventoryItemCreate, InventoryItemUpdate
)

router = APIRouter()

def _format_inventory_item(item: KitchenInventory, now: datetime) -> dict:
    days_left = None
    is_exp = False
    is_near = False

    if item.expiry_date:
        days_left = (item.expiry_date - now).days
        is_exp = days_left < 0
        is_near = 0 <= days_left <= 3

    return {
        "id": item.id,
        "ingredient_id": item.ingredient_id,
        "ingredient_name": item.ingredient.name,
        "category": item.ingredient.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "purchase_date": item.purchase_date,
        "expiry_date": item.expiry_date,
        "days_to_expiry": days_left,
        "is_expired": is_exp,
        "is_nearing_expiry": is_near,
        "is_consumed": item.is_consumed
    }

@router.get("/inventory", response_model=List[InventoryItemResponse])
def get_user_inventory(
    include_consumed: bool = False,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    q = db.query(KitchenInventory).filter(KitchenInventory.user_id == current_user.id)
    if not include_consumed:
        q = q.filter(KitchenInventory.is_consumed == False)

    items = q.all()
    now = datetime.utcnow()
    return [_format_inventory_item(item, now) for item in items]

@router.post("/inventory", response_model=InventoryItemResponse)
def add_inventory_item(
    item_in: InventoryItemCreate,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    norm_name = item_in.ingredient_name.lower().strip()

    # Find or create ingredient
    ing = db.query(Ingredient).filter(Ingredient.normalized_name == norm_name).first()
    if not ing:
        ing = Ingredient(
            name=item_in.ingredient_name.capitalize(),
            normalized_name=norm_name,
            category="pantry",
            default_unit=item_in.unit
        )
        db.add(ing)
        db.flush()

    purchase_date = item_in.purchase_date or now
    expiry_date = item_in.expiry_date
    if not expiry_date:
        shelf_days = ing.average_shelf_life_days or 7
        expiry_date = purchase_date + timedelta(days=shelf_days)

    item = KitchenInventory(
        user_id=current_user.id,
        ingredient_id=ing.id,
        quantity=item_in.quantity,
        unit=item_in.unit,
        purchase_date=purchase_date,
        expiry_date=expiry_date,
        is_consumed=False
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _format_inventory_item(item, now)

@router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int,
    item_in: InventoryItemUpdate,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    item = db.query(KitchenInventory).filter(
        KitchenInventory.id == item_id,
        KitchenInventory.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    update_data = item_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(item, k, v)

    db.commit()
    db.refresh(item)
    return _format_inventory_item(item, datetime.utcnow())

@router.delete("/inventory/{item_id}")
def delete_inventory_item(
    item_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    item = db.query(KitchenInventory).filter(
        KitchenInventory.id == item_id,
        KitchenInventory.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    db.delete(item)
    db.commit()
    return {"success": True, "message": "Item deleted from kitchen inventory"}

@router.get("/expiry-alerts", response_model=List[InventoryItemResponse])
def get_expiry_alerts(
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Ordinary date-based rules for basic expiry alerts.
    Filters items expiring in <= 3 days or already expired.
    """
    items = db.query(KitchenInventory).filter(
        KitchenInventory.user_id == current_user.id,
        KitchenInventory.is_consumed == False,
        KitchenInventory.expiry_date != None
    ).all()

    now = datetime.utcnow()
    alerts = []
    for item in items:
        days_left = (item.expiry_date - now).days
        if days_left <= 3: # expiring soon or expired
            alerts.append(_format_inventory_item(item, now))

    alerts.sort(key=lambda x: (x["days_to_expiry"] is None, x["days_to_expiry"]))
    return alerts
