import axios from 'axios';
import {
  User, UserProfile, Recipe, DetectionResult, RecommendedRecipeItem,
  InventoryItem, MealPlanItem, ShoppingItem, SubstituteItem, MLInsights
} from '../types';

const API_BASE = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('autochef_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login/json', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, fullName?: string) => {
    const res = await api.post('/auth/register', { email, password, full_name: fullName });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  getProfile: async (): Promise<UserProfile> => {
    const res = await api.get('/users/profile');
    return res.data;
  },
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await api.put('/users/profile', data);
    return res.data;
  },
};

// Ingredients & Detection
export const ingredientService = {
  listAll: async () => {
    const res = await api.get('/ingredients/');
    return res.data;
  },
  uploadAndDetect: async (file: File): Promise<DetectionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/ingredients/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  confirmDetection: async (confirmedIngredients: string[], addToInventory = true) => {
    const res = await api.post('/ingredients/confirm', {
      confirmed_ingredients: confirmedIngredients,
      add_to_inventory: addToInventory,
    });
    return res.data;
  },
};

// Recipes & Recommendations
export const recipeService = {
  search: async (params?: { query?: string; cuisine?: string; category?: string; max_time?: number; dietary?: string }): Promise<Recipe[]> => {
    const res = await api.get('/recipes/', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Recipe> => {
    const res = await api.get(`/recipes/${id}`);
    return res.data;
  },
  recommend: async (params: {
    available_ingredients?: string[];
    use_inventory?: boolean;
    max_cooking_time?: number;
    cuisine?: string;
    dietary_preferences?: string[];
    allergies?: string[];
    algorithm?: string;
    limit?: number;
  }) => {
    const res = await api.post('/recipes/recommend', params);
    return res.data;
  },
  getPersonalized: async (topK = 10) => {
    const res = await api.get('/recipes/user/personalized', { params: { top_k: topK } });
    return res.data;
  },
  rate: async (recipeId: number, rating: number, review?: string) => {
    const res = await api.post(`/recipes/${recipeId}/rate`, null, { params: { rating, review } });
    return res.data;
  },
  recordInteraction: async (recipeId: number, type: 'view' | 'like' | 'save' | 'cook' | 'skip') => {
    const res = await api.post(`/recipes/${recipeId}/interact`, null, { params: { interaction_type: type } });
    return res.data;
  },
};

// ML Services
export const mlService = {
  predictPreference: async (recipeId: number) => {
    const res = await api.post('/ml/predict-preference', { recipe_id: recipeId });
    return res.data;
  },
  substitute: async (params: { ingredient_name: string; purpose?: string; dietary_filter?: string; allergen_filter?: string[] }) => {
    const res = await api.post('/ml/substitute', params);
    return res.data;
  },
  estimateNutrition: async (params: { recipe_id?: number; ingredients?: any[]; servings?: number }) => {
    const res = await api.post('/ml/estimate-nutrition', params);
    return res.data;
  },
  getInsights: async (): Promise<MLInsights> => {
    const res = await api.get('/ml/insights');
    return res.data;
  },
  retrainPreferences: async () => {
    const res = await api.post('/ml/retrain-preferences');
    return res.data;
  },
};

// Kitchen & Inventory
export const kitchenService = {
  getInventory: async (includeConsumed = false): Promise<InventoryItem[]> => {
    const res = await api.get('/kitchen/inventory', { params: { include_consumed: includeConsumed } });
    return res.data;
  },
  addInventoryItem: async (data: { ingredient_name: string; quantity: number; unit: string; expiry_date?: string }) => {
    const res = await api.post('/kitchen/inventory', data);
    return res.data;
  },
  updateInventoryItem: async (id: number, data: Partial<InventoryItem>) => {
    const res = await api.put(`/kitchen/inventory/${id}`, data);
    return res.data;
  },
  deleteInventoryItem: async (id: number) => {
    const res = await api.delete(`/kitchen/inventory/${id}`);
    return res.data;
  },
  getExpiryAlerts: async (): Promise<InventoryItem[]> => {
    const res = await api.get('/kitchen/expiry-alerts');
    return res.data;
  },
};

// Meal Planning
export const mealPlanService = {
  getPlans: async (startDate?: string, days = 7): Promise<MealPlanItem[]> => {
    const res = await api.get('/meal-plans/', { params: { start_date: startDate, days } });
    return res.data;
  },
  addPlan: async (data: { recipe_id: number; plan_date: string; meal_type: string }) => {
    const res = await api.post('/meal-plans/', data);
    return res.data;
  },
  deletePlan: async (id: number) => {
    const res = await api.delete(`/meal-plans/${id}`);
    return res.data;
  },
};

// Shopping List
export const shoppingService = {
  getItems: async (): Promise<ShoppingItem[]> => {
    const res = await api.get('/shopping-list/');
    return res.data;
  },
  addItem: async (data: { ingredient_name: string; quantity: number; unit: string; source_recipe_id?: number }) => {
    const res = await api.post('/shopping-list/', data);
    return res.data;
  },
  togglePurchased: async (id: number) => {
    const res = await api.put(`/shopping-list/${id}/toggle`);
    return res.data;
  },
  deleteItem: async (id: number) => {
    const res = await api.delete(`/shopping-list/${id}`);
    return res.data;
  },
  generateFromRecipe: async (recipeId: number) => {
    const res = await api.post(`/shopping-list/generate-from-recipe/${recipeId}`);
    return res.data;
  },
};
