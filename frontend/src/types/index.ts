export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  dietary_preferences: string[];
  allergies: string[];
  disliked_ingredients: string[];
  preferred_cuisines: string[];
  max_cooking_time: number;
  skill_level: string;
  calorie_target?: number;
}

export interface RecipeIngredient {
  ingredient_name: string;
  amount: number;
  unit: string;
  original_text?: string;
  is_optional?: boolean;
}

export interface Recipe {
  id: number;
  title: string;
  description?: string;
  cuisine?: string;
  category?: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  instructions: string[];
  image_url?: string;
  tags: string[];
  dietary_flags: {
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
  };
  allergens: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  ingredients: RecipeIngredient[];
}

export interface DetectedItem {
  name: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2]
  category?: string;
  confirmed?: boolean;
}

export interface DetectionResult {
  detection_id?: number;
  image_url: string;
  detected_ingredients: DetectedItem[];
  model_name: string;
  inference_time_ms: number;
  message: string;
}

export interface RecommendedRecipeItem {
  recipe: Recipe;
  score: number;
  match_percentage: number;
  matching_ingredients: string[];
  missing_ingredients: string[];
  explanation: string;
  algorithm: string;
}

export interface InventoryItem {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  category?: string;
  quantity: number;
  unit: string;
  purchase_date: string;
  expiry_date?: string;
  days_to_expiry?: number;
  is_expired: boolean;
  is_nearing_expiry: boolean;
  is_consumed: boolean;
}

export interface MealPlanItem {
  id: number;
  recipe_id: number;
  recipe_title: string;
  recipe_image?: string;
  plan_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  is_completed: boolean;
  total_time: number;
  calories: number;
}

export interface ShoppingItem {
  id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  is_purchased: boolean;
  source_recipe_id?: number;
  created_at: string;
}

export interface SubstituteItem {
  substitute_name: string;
  similarity_score: number;
  conversion_ratio: string;
  taste_profile: string;
  best_used_for: string;
  allergens: string[];
  dietary_flags: Record<string, boolean>;
  notes: string;
}

export interface MLModuleMetric {
  module_name: string;
  model_name: string;
  training_status: string;
  dataset_source?: string;
  dataset_size: number;
  last_evaluated_at?: string;
  metrics: Record<string, any>;
  notes?: string;
}

export interface MLInsights {
  modules: MLModuleMetric[];
  hardware_status: {
    torch_version: string;
    cuda_available: boolean;
    device_name: string;
    threads: number;
  };
}
