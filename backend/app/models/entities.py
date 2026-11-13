import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    inventory = relationship("KitchenInventory", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("UserRating", back_populates="user", cascade="all, delete-orphan")
    interactions = relationship("UserInteraction", back_populates="user", cascade="all, delete-orphan")
    meal_plans = relationship("MealPlan", back_populates="user", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingList", back_populates="user", cascade="all, delete-orphan")
    detections = relationship("IngredientDetection", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("RecommendationHistory", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    dietary_preferences = Column(JSON, default=list)  # e.g., ["vegetarian", "vegan", "gluten-free"]
    allergies = Column(JSON, default=list)            # e.g., ["peanut", "dairy", "egg"]
    disliked_ingredients = Column(JSON, default=list)
    preferred_cuisines = Column(JSON, default=list)   # e.g., ["Italian", "Mexican", "Indian"]
    max_cooking_time = Column(Integer, default=60)    # minutes
    skill_level = Column(String(50), default="intermediate") # beginner, intermediate, advanced
    calorie_target = Column(Float, nullable=True)     # daily target kcal
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="profile")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    normalized_name = Column(String(100), index=True, nullable=False)
    category = Column(String(50), index=True, nullable=True) # vegetable, fruit, dairy, meat, spice, etc.
    common_allergens = Column(JSON, default=list)             # e.g., ["milk", "nuts"]
    dietary_flags = Column(JSON, default=dict)                # {"is_vegetarian": True, "is_vegan": False, ...}
    default_unit = Column(String(20), default="g")
    average_shelf_life_days = Column(Integer, default=7)

    # Relationships
    nutrition = relationship("Nutrition", back_populates="ingredient", uselist=False, cascade="all, delete-orphan")
    recipe_links = relationship("RecipeIngredient", back_populates="ingredient")
    inventory_items = relationship("KitchenInventory", back_populates="ingredient")


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    cuisine = Column(String(100), index=True, nullable=True)
    category = Column(String(100), index=True, nullable=True) # breakfast, lunch, dinner, snack, dessert
    prep_time = Column(Integer, default=15) # minutes
    cook_time = Column(Integer, default=20) # minutes
    total_time = Column(Integer, default=35) # minutes
    servings = Column(Integer, default=4)
    difficulty = Column(String(50), default="medium") # easy, medium, hard
    instructions = Column(JSON, default=list) # ordered list of steps
    image_url = Column(String(500), nullable=True)
    tags = Column(JSON, default=list) # ["high-protein", "quick", "italian"]
    dietary_flags = Column(JSON, default=dict) # {"is_vegetarian": True, "is_vegan": False, "is_gluten_free": True}
    allergens = Column(JSON, default=list)     # ["dairy", "eggs", ...]
    
    # Pre-aggregated nutritional info per serving
    calories = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    fiber = Column(Float, default=0.0)
    sugar = Column(Float, default=0.0)
    sodium = Column(Float, default=0.0)

    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    ratings = relationship("UserRating", back_populates="recipe", cascade="all, delete-orphan")
    interactions = relationship("UserInteraction", back_populates="recipe", cascade="all, delete-orphan")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False, default=1.0)
    unit = Column(String(50), default="unit")
    original_text = Column(String(255), nullable=True) # e.g. "2 cloves fresh garlic, minced"
    is_optional = Column(Boolean, default=False)

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_links")


class Nutrition(Base):
    __tablename__ = "nutrition"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), unique=True, nullable=False)
    serving_size_g = Column(Float, default=100.0)
    calories = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    carbohydrates = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    fiber = Column(Float, default=0.0)
    sugar = Column(Float, default=0.0)
    sodium = Column(Float, default=0.0) # in mg
    source = Column(String(100), default="USDA FoodData Central") # verified, estimated, demo

    ingredient = relationship("Ingredient", back_populates="nutrition")


class KitchenInventory(Base):
    __tablename__ = "kitchen_inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Float, default=1.0)
    unit = Column(String(50), default="items")
    purchase_date = Column(DateTime, default=get_utc_now)
    expiry_date = Column(DateTime, nullable=True)
    is_consumed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="inventory")
    ingredient = relationship("Ingredient", back_populates="inventory_items")


class IngredientDetection(Base):
    __tablename__ = "ingredient_detections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_filename = Column(String(255), nullable=False)
    detected_items = Column(JSON, default=list) # [{name, confidence, box: [x1, y1, x2, y2], confirmed: bool}]
    is_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="detections")


class UserRating(Base):
    __tablename__ = "user_ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Float, nullable=False) # 1.0 to 5.0
    review = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="ratings")
    recipe = relationship("Recipe", back_populates="ratings")


class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    interaction_type = Column(String(50), nullable=False) # view, like, save, cook, skip
    weight = Column(Float, default=1.0) # view=1, like=2, save=3, cook=5, skip=-1
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="interactions")
    recipe = relationship("Recipe", back_populates="interactions")


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    algorithm_used = Column(String(50), default="hybrid") # content, collaborative, hybrid
    recommendation_score = Column(Float, nullable=False)
    matching_ingredients = Column(JSON, default=list)
    missing_ingredients = Column(JSON, default=list)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="recommendations")


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    plan_date = Column(DateTime, nullable=False)
    meal_type = Column(String(50), nullable=False) # breakfast, lunch, dinner, snack
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="meal_plans")
    recipe = relationship("Recipe")


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ingredient_name = Column(String(100), nullable=False)
    quantity = Column(Float, default=1.0)
    unit = Column(String(50), default="items")
    is_purchased = Column(Boolean, default=False)
    source_recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="shopping_items")


class MLModelMetadata(Base):
    __tablename__ = "ml_model_metadata"

    id = Column(Integer, primary_key=True, index=True)
    module_name = Column(String(100), unique=True, nullable=False) # e.g. "ingredient_detection", "recipe_recommender"
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), default="1.0.0")
    training_status = Column(String(50), default="Untrained") # Untrained, Trained, Demo Mode
    dataset_source = Column(String(255), nullable=True)
    dataset_size = Column(Integer, default=0)
    metrics = Column(JSON, default=dict) # accuracy, precision, recall, f1, mAP, ndcg, hit_rate
    last_evaluated_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
