from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.app.api.deps import get_db, get_optional_user
from backend.app.models.entities import (
    User, Recipe, RecipeIngredient, Ingredient, KitchenInventory,
    UserProfile, UserRating, UserInteraction, RecommendationHistory
)
from backend.app.schemas.schemas import (
    RecipeResponse, RecommendationRequest, RecommendationResponse, RecommendedRecipeItem
)
from backend.app.ml.recommendation.hybrid_recommender import HybridRecommender
from backend.app.ml.personalization.personalization_engine import PersonalizationEngine

router = APIRouter()
hybrid_engine = HybridRecommender()
personalization_engine = PersonalizationEngine()

def _format_recipe(r: Recipe) -> Dict[str, Any]:
    return {
        "id": r.id,
        "title": r.title,
        "description": r.description,
        "cuisine": r.cuisine,
        "category": r.category,
        "prep_time": r.prep_time,
        "cook_time": r.cook_time,
        "total_time": r.total_time,
        "servings": r.servings,
        "difficulty": r.difficulty,
        "instructions": r.instructions or [],
        "image_url": r.image_url,
        "tags": r.tags or [],
        "dietary_flags": r.dietary_flags or {},
        "allergens": r.allergens or [],
        "calories": r.calories or 0.0,
        "protein": r.protein or 0.0,
        "carbs": r.carbs or 0.0,
        "fat": r.fat or 0.0,
        "fiber": r.fiber or 0.0,
        "sugar": r.sugar or 0.0,
        "sodium": r.sodium or 0.0,
        "ingredients": [
            {
                "ingredient_name": ri.ingredient.name,
                "amount": ri.amount,
                "unit": ri.unit,
                "original_text": ri.original_text,
                "is_optional": ri.is_optional
            }
            for ri in r.ingredients
        ]
    }

@router.get("/", response_model=List[RecipeResponse])
def search_recipes(
    query: Optional[str] = None,
    cuisine: Optional[str] = None,
    category: Optional[str] = None,
    max_time: Optional[int] = None,
    dietary: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Recipe)
    if query:
        q = q.filter(Recipe.title.ilike(f"%{query}%"))
    if cuisine and cuisine.lower() != "all":
        q = q.filter(Recipe.cuisine.ilike(cuisine))
    if category and category.lower() != "all":
        q = q.filter(Recipe.category.ilike(category))
    if max_time:
        q = q.filter(Recipe.total_time <= max_time)

    recipes = q.all()
    formatted = [_format_recipe(r) for r in recipes]

    if dietary and dietary.lower() != "all":
        d = dietary.lower()
        if d == "vegetarian":
            formatted = [r for r in formatted if r["dietary_flags"].get("is_vegetarian")]
        elif d == "vegan":
            formatted = [r for r in formatted if r["dietary_flags"].get("is_vegan")]
        elif d in ["gluten-free", "gf"]:
            formatted = [r for r in formatted if r["dietary_flags"].get("is_gluten_free")]

    return formatted

@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe_detail(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _format_recipe(recipe)

@router.post("/recommend", response_model=RecommendationResponse)
def recommend_recipes(
    req: RecommendationRequest,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Executes real Algorithmic Hybrid Recipe Recommendation.
    Uses TF-IDF Vectorization, Cosine Similarity, Ingredient Overlap Matcher, and Expiry Priority.
    """
    all_db_recipes = db.query(Recipe).all()
    formatted_recipes = [_format_recipe(r) for r in all_db_recipes]

    # Fit TF-IDF engine
    hybrid_engine.fit(formatted_recipes)

    # 1. Determine available ingredients
    available = []
    expiring = []
    if req.use_inventory and current_user:
        inv_items = db.query(KitchenInventory).filter(
            KitchenInventory.user_id == current_user.id,
            KitchenInventory.is_consumed == False
        ).all()
        now = datetime.utcnow()
        for item in inv_items:
            ing_name = item.ingredient.name
            available.append(ing_name)
            if item.expiry_date and (item.expiry_date - now).days <= 3:
                expiring.append(ing_name)

    if req.available_ingredients:
        available.extend(req.available_ingredients)

    available = list(set(available))

    # 2. Get user preferences
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first() if current_user else None
    dietary = req.dietary_preferences or (profile.dietary_preferences if profile else [])
    allergies = req.allergies or (profile.allergies if profile else [])
    max_time = req.max_cooking_time or (profile.max_cooking_time if profile else None)

    # 3. Calculate average ratings for recipes
    ratings_records = db.query(UserRating).all()
    ratings_map = {}
    for r in ratings_records:
        ratings_map.setdefault(r.recipe_id, []).append(r.rating)
    avg_ratings = {k: sum(v)/len(v) for k, v in ratings_map.items()}

    # 4. Execute Hybrid ML ranking
    ranked_results = hybrid_engine.rank(
        recipes=formatted_recipes,
        available_ingredients=available,
        expiring_ingredients=expiring,
        ratings_map=avg_ratings,
        dietary_preferences=dietary,
        allergies=allergies,
        cuisine_filter=req.cuisine,
        max_time=max_time,
        top_k=req.limit
    )

    # 5. Record recommendations in database history
    if current_user and ranked_results:
        for res in ranked_results[:3]: # record top 3
            rec_hist = RecommendationHistory(
                user_id=current_user.id,
                recipe_id=res["recipe"]["id"],
                algorithm_used=res["algorithm"],
                recommendation_score=res["score"],
                matching_ingredients=res["matching_ingredients"],
                missing_ingredients=res["missing_ingredients"]
            )
            db.add(rec_hist)
        db.commit()

    recs_out = [
        RecommendedRecipeItem(
            recipe=r["recipe"],
            score=r["score"],
            match_percentage=r["match_percentage"],
            matching_ingredients=r["matching_ingredients"],
            missing_ingredients=r["missing_ingredients"],
            explanation=r["explanation"],
            algorithm=r["algorithm"]
        )
        for r in ranked_results
    ]

    return RecommendationResponse(
        recommendations=recs_out,
        total_found=len(recs_out),
        algorithm_used="Hybrid TF-IDF & Weighted Ingredient Matcher",
        filters_applied={
            "available_ingredients_count": len(available),
            "expiring_ingredients": expiring,
            "dietary_enforced": dietary,
            "allergies_enforced": allergies,
            "cuisine": req.cuisine
        }
    )

@router.get("/user/personalized", response_model=RecommendationResponse)
def get_personalized_recommendations(
    top_k: int = 10,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Executes Collaborative Filtering & User Profile Personalization Engine.
    Learns from past user interactions (view, like, save, cook) and ratings.
    """
    all_recipes = [_format_recipe(r) for r in db.query(Recipe).all()]
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first() if current_user else None
    profile_dict = {
        "dietary_preferences": profile.dietary_preferences if profile else [],
        "allergies": profile.allergies if profile else [],
        "preferred_cuisines": profile.preferred_cuisines if profile else [],
        "max_cooking_time": profile.max_cooking_time if profile else 60
    }

    # Gather user inventory
    inv_items = db.query(KitchenInventory).filter(
        KitchenInventory.user_id == current_user.id,
        KitchenInventory.is_consumed == False
    ).all()
    available_ings = [item.ingredient.name for item in inv_items]

    # Gather all system interactions and ratings
    interactions = [
        {"user_id": i.user_id, "recipe_id": i.recipe_id, "interaction_type": i.interaction_type}
        for i in db.query(UserInteraction).all()
    ]
    ratings = [
        {"user_id": r.user_id, "recipe_id": r.recipe_id, "rating": r.rating}
        for r in db.query(UserRating).all()
    ]

    # Train CF engine dynamically on latest records
    personalization_engine.train_from_database_records(interactions, ratings)

    personalized_results = personalization_engine.personalize(
        user_id=current_user.id,
        all_recipes=all_recipes,
        user_profile=profile_dict,
        available_ingredients=available_ings,
        top_k=top_k
    )

    recs_out = [
        RecommendedRecipeItem(
            recipe=r["recipe"],
            score=r["score"],
            match_percentage=r["match_percentage"],
            matching_ingredients=r["matching_ingredients"],
            missing_ingredients=r["missing_ingredients"],
            explanation=r["explanation"],
            algorithm=r["algorithm"]
        )
        for r in personalized_results
    ]

    return RecommendationResponse(
        recommendations=recs_out,
        total_found=len(recs_out),
        algorithm_used=personalization_engine.cf.is_trained and "Item-Item Collaborative Filtering + Hybrid" or "Cold-Start Preference Matching",
        filters_applied={"user_id": current_user.id, "pantry_items_used": len(available_ings)}
    )

@router.post("/{recipe_id}/rate")
def rate_recipe(
    recipe_id: int,
    rating: float = Query(..., ge=1.0, le=5.0),
    review: Optional[str] = None,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    existing = db.query(UserRating).filter(
        UserRating.user_id == current_user.id,
        UserRating.recipe_id == recipe_id
    ).first()

    if existing:
        existing.rating = rating
        existing.review = review
    else:
        new_rating = UserRating(
            user_id=current_user.id,
            recipe_id=recipe_id,
            rating=rating,
            review=review
        )
        db.add(new_rating)

    db.commit()
    return {"success": True, "message": f"Recorded rating {rating} for recipe {recipe_id}"}

@router.post("/{recipe_id}/interact")
def record_interaction(
    recipe_id: int,
    interaction_type: str = Query(..., pattern="^(view|like|save|cook|skip)$"),
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    weight_map = {"view": 1.0, "like": 2.0, "save": 3.0, "cook": 5.0, "skip": -1.0}
    interaction = UserInteraction(
        user_id=current_user.id,
        recipe_id=recipe_id,
        interaction_type=interaction_type,
        weight=weight_map.get(interaction_type, 1.0)
    )
    db.add(interaction)
    db.commit()
    return {"success": True, "interaction": interaction_type, "recipe_id": recipe_id}
