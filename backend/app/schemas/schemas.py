from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# --- User Profile Schemas ---
class UserProfileUpdate(BaseModel):
    dietary_preferences: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    disliked_ingredients: Optional[List[str]] = None
    preferred_cuisines: Optional[List[str]] = None
    max_cooking_time: Optional[int] = None
    skill_level: Optional[str] = None
    calorie_target: Optional[float] = None

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    dietary_preferences: List[str]
    allergies: List[str]
    disliked_ingredients: List[str]
    preferred_cuisines: List[str]
    max_cooking_time: int
    skill_level: str
    calorie_target: Optional[float]

    model_config = ConfigDict(from_attributes=True)

# --- Ingredient Schemas ---
class IngredientBase(BaseModel):
    name: str
    category: Optional[str] = None
    common_allergens: List[str] = []
    dietary_flags: Dict[str, Any] = {}
    default_unit: str = "g"
    average_shelf_life_days: int = 7

class IngredientCreate(IngredientBase):
    pass

class IngredientResponse(IngredientBase):
    id: int
    normalized_name: str

    model_config = ConfigDict(from_attributes=True)

# --- Detection Schemas ---
class DetectedItem(BaseModel):
    name: str
    confidence: float
    box: List[float] # [x1, y1, x2, y2]
    category: Optional[str] = "ingredient"
    confirmed: bool = True

class DetectionResult(BaseModel):
    detection_id: Optional[int] = None
    image_url: str
    detected_ingredients: List[DetectedItem]
    model_name: str
    inference_time_ms: float
    message: str

class ConfirmDetectionRequest(BaseModel):
    confirmed_ingredients: List[str]
    add_to_inventory: bool = True

# --- Recipe Schemas ---
class RecipeIngredientItem(BaseModel):
    ingredient_name: str
    amount: float
    unit: str
    original_text: Optional[str] = None
    is_optional: bool = False

class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    cuisine: Optional[str] = None
    category: Optional[str] = None
    prep_time: int
    cook_time: int
    total_time: int
    servings: int
    difficulty: str
    instructions: List[str]
    image_url: Optional[str] = None
    tags: List[str] = []
    dietary_flags: Dict[str, Any] = {}
    allergens: List[str] = []
    calories: float = 0.0
    protein: float = 0.0
    carbs: float = 0.0
    fat: float = 0.0
    fiber: float = 0.0
    sugar: float = 0.0
    sodium: float = 0.0

class RecipeResponse(RecipeBase):
    id: int
    ingredients: List[RecipeIngredientItem] = []

    model_config = ConfigDict(from_attributes=True)

# --- Recommendation Schemas ---
class RecommendationRequest(BaseModel):
    available_ingredients: Optional[List[str]] = None
    use_inventory: bool = True
    max_cooking_time: Optional[int] = None
    cuisine: Optional[str] = None
    dietary_preferences: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    algorithm: str = "hybrid" # "hybrid", "content", "collaborative"
    limit: int = 10

class RecommendedRecipeItem(BaseModel):
    recipe: RecipeResponse
    score: float
    match_percentage: float
    matching_ingredients: List[str]
    missing_ingredients: List[str]
    explanation: str
    algorithm: str

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendedRecipeItem]
    total_found: int
    algorithm_used: str
    filters_applied: Dict[str, Any]

# --- Inventory Schemas ---
class InventoryItemCreate(BaseModel):
    ingredient_name: str
    quantity: float = 1.0
    unit: str = "items"
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class InventoryItemUpdate(BaseModel):
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expiry_date: Optional[datetime] = None
    is_consumed: Optional[bool] = None

class InventoryItemResponse(BaseModel):
    id: int
    ingredient_id: int
    ingredient_name: str
    category: Optional[str]
    quantity: float
    unit: str
    purchase_date: datetime
    expiry_date: Optional[datetime]
    days_to_expiry: Optional[int]
    is_expired: bool
    is_nearing_expiry: bool
    is_consumed: bool

    model_config = ConfigDict(from_attributes=True)

# --- Meal Plan Schemas ---
class MealPlanCreate(BaseModel):
    recipe_id: int
    plan_date: datetime
    meal_type: str # breakfast, lunch, dinner, snack

class MealPlanResponse(BaseModel):
    id: int
    recipe_id: int
    recipe_title: str
    recipe_image: Optional[str]
    plan_date: datetime
    meal_type: str
    is_completed: bool
    total_time: int
    calories: float

    model_config = ConfigDict(from_attributes=True)

# --- Shopping List Schemas ---
class ShoppingItemCreate(BaseModel):
    ingredient_name: str
    quantity: float = 1.0
    unit: str = "items"
    source_recipe_id: Optional[int] = None

class ShoppingItemResponse(BaseModel):
    id: int
    ingredient_name: str
    quantity: float
    unit: str
    is_purchased: bool
    source_recipe_id: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- ML & Advanced Schemas ---
class PreferencePredictRequest(BaseModel):
    recipe_id: int

class PreferencePredictResponse(BaseModel):
    recipe_id: int
    recipe_title: str
    predicted_enjoyment: bool
    confidence_score: float # 0.0 to 1.0
    algorithm: str
    top_contributing_features: Dict[str, float]

class SubstitutionRequest(BaseModel):
    ingredient_name: str
    purpose: Optional[str] = "all-purpose" # baking, frying, spreading, binding, thickening, sauce
    dietary_filter: Optional[str] = None
    allergen_filter: Optional[List[str]] = None

class SubstituteItem(BaseModel):
    substitute_name: str
    similarity_score: float
    conversion_ratio: str
    taste_profile: str
    best_used_for: str
    allergens: List[str]
    dietary_flags: Dict[str, bool]
    notes: str

class SubstitutionResponse(BaseModel):
    target_ingredient: str
    purpose_context: str
    substitutes: List[SubstituteItem]

class NutritionEstimateRequest(BaseModel):
    recipe_id: Optional[int] = None
    ingredients: Optional[List[RecipeIngredientItem]] = None
    servings: int = 1

class NutritionEstimateResponse(BaseModel):
    servings: int
    per_serving: Dict[str, float]
    total: Dict[str, float]
    source_verification: str
    health_labels: List[str]
    nutrient_breakdown: List[Dict[str, Any]]

class MLModuleMetrics(BaseModel):
    module_name: str
    model_name: str
    training_status: str
    dataset_source: Optional[str]
    dataset_size: int
    last_evaluated_at: Optional[datetime]
    metrics: Dict[str, Any]
    notes: Optional[str]

class MLInsightsResponse(BaseModel):
    modules: List[MLModuleMetrics]
    hardware_status: Dict[str, Any]
