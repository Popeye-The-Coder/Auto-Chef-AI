from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.api.deps import get_db, get_optional_user
from backend.app.models.entities import User, ShoppingList, Recipe, KitchenInventory
from backend.app.schemas.schemas import ShoppingItemCreate, ShoppingItemResponse
from backend.app.ml.recommendation.ingredient_matcher import IngredientMatcher

router = APIRouter()

@router.get("/", response_model=List[ShoppingItemResponse])
def get_shopping_list(
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    items = db.query(ShoppingList).filter(
        ShoppingList.user_id == current_user.id
    ).order_by(ShoppingList.is_purchased.asc(), ShoppingList.created_at.desc()).all()
    return items

@router.post("/", response_model=ShoppingItemResponse)
def add_shopping_item(
    item_in: ShoppingItemCreate,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    item = ShoppingList(
        user_id=current_user.id,
        ingredient_name=item_in.ingredient_name,
        quantity=item_in.quantity,
        unit=item_in.unit,
        is_purchased=False,
        source_recipe_id=item_in.source_recipe_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}/toggle", response_model=ShoppingItemResponse)
def toggle_purchased(
    item_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    item = db.query(ShoppingList).filter(
        ShoppingList.id == item_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shopping item not found")

    item.is_purchased = not item.is_purchased
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_shopping_item(
    item_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    item = db.query(ShoppingList).filter(
        ShoppingList.id == item_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shopping item not found")

    db.delete(item)
    db.commit()
    return {"success": True, "message": "Shopping item deleted"}

@router.post("/generate-from-recipe/{recipe_id}")
def generate_missing_from_recipe(
    recipe_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Calculates missing ingredients for the given recipe against user inventory and automatically adds to shopping list."""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Get user available inventory
    inv = db.query(KitchenInventory).filter(
        KitchenInventory.user_id == current_user.id,
        KitchenInventory.is_consumed == False
    ).all()
    user_ings = [item.ingredient.name for item in inv]

    rec_ings = [ri.ingredient.name for ri in recipe.ingredients]
    match_result = IngredientMatcher.match(user_ings, rec_ings)
    missing = match_result["missing_ingredients"]

    added = []
    for miss_name in missing:
        # Find amount from recipe
        amt = 1.0
        unit = "items"
        for ri in recipe.ingredients:
            if ri.ingredient.name == miss_name:
                amt = ri.amount
                unit = ri.unit
                break

        shop_item = ShoppingList(
            user_id=current_user.id,
            ingredient_name=miss_name,
            quantity=amt,
            unit=unit,
            source_recipe_id=recipe.id,
            is_purchased=False
        )
        db.add(shop_item)
        added.append(miss_name)

    db.commit()
    return {
        "success": True,
        "recipe_title": recipe.title,
        "missing_count": len(missing),
        "added_ingredients": added
    }
