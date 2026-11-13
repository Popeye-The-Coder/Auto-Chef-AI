from fastapi import APIRouter

from backend.app.api.endpoints import (
    auth, users, ingredients, recipes, ml, kitchen, meal_plans, shopping
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Profiles"])
api_router.include_router(ingredients.router, prefix="/ingredients", tags=["Ingredients & Detection"])
api_router.include_router(recipes.router, prefix="/recipes", tags=["Recipes & Recommendations"])
api_router.include_router(ml.router, prefix="/ml", tags=["Machine Learning Core"])
api_router.include_router(kitchen.router, prefix="/kitchen", tags=["Kitchen & Inventory"])
api_router.include_router(meal_plans.router, prefix="/meal-plans", tags=["Meal Planning"])
api_router.include_router(shopping.router, prefix="/shopping-list", tags=["Shopping List"])
