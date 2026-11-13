from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from backend.app.api.deps import get_db, get_optional_user
from backend.app.models.entities import User, MealPlan, Recipe
from backend.app.schemas.schemas import MealPlanCreate, MealPlanResponse

router = APIRouter()

@router.get("/", response_model=List[MealPlanResponse])
def get_user_meal_plans(
    start_date: Optional[datetime] = None,
    days: int = 7,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    q = db.query(MealPlan).filter(MealPlan.user_id == current_user.id)
    if start_date:
        end_date = start_date + timedelta(days=days)
        q = q.filter(MealPlan.plan_date >= start_date, MealPlan.plan_date <= end_date)

    plans = q.order_by(MealPlan.plan_date.asc(), MealPlan.meal_type.asc()).all()

    return [
        MealPlanResponse(
            id=p.id,
            recipe_id=p.recipe_id,
            recipe_title=p.recipe.title,
            recipe_image=p.recipe.image_url,
            plan_date=p.plan_date,
            meal_type=p.meal_type,
            is_completed=p.is_completed,
            total_time=p.recipe.total_time,
            calories=p.recipe.calories or 0.0
        )
        for p in plans
    ]

@router.post("/", response_model=MealPlanResponse)
def create_meal_plan(
    plan_in: MealPlanCreate,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == plan_in.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    plan = MealPlan(
        user_id=current_user.id,
        recipe_id=recipe.id,
        plan_date=plan_in.plan_date,
        meal_type=plan_in.meal_type.lower(),
        is_completed=False
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return MealPlanResponse(
        id=plan.id,
        recipe_id=recipe.id,
        recipe_title=recipe.title,
        recipe_image=recipe.image_url,
        plan_date=plan.plan_date,
        meal_type=plan.meal_type,
        is_completed=plan.is_completed,
        total_time=recipe.total_time,
        calories=recipe.calories or 0.0
    )

@router.delete("/{plan_id}")
def delete_meal_plan(
    plan_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    plan = db.query(MealPlan).filter(MealPlan.id == plan_id, MealPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    db.delete(plan)
    db.commit()
    return {"success": True, "message": "Meal plan deleted"}
