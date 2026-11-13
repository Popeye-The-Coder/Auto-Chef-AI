import React, { useState, useEffect } from 'react';
import {
  Calendar as CalIcon, Plus, Trash2, CheckCircle2,
  Clock, Flame, ShoppingCart, Sparkles
} from 'lucide-react';
import { mealPlanService, recipeService, shoppingService } from '../services/api';
import { MealPlanItem, Recipe } from '../types';

export const MealPlannerPage: React.FC = () => {
  const [plans, setPlans] = useState<MealPlanItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Add plan modal / form state
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | ''>('');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [shoppingGenerated, setShoppingGenerated] = useState(false);

  const DAYS = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

  const fetchMealPlans = async () => {
    setLoading(true);
    try {
      const [plansData, recipesData] = await Promise.all([
        mealPlanService.getPlans(),
        recipeService.search()
      ]);
      setPlans(plansData);
      setRecipes(recipesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId) return;

    try {
      const planDate = new Date();
      planDate.setDate(planDate.getDate() + selectedDayOffset);

      await mealPlanService.addPlan({
        recipe_id: Number(selectedRecipeId),
        plan_date: planDate.toISOString(),
        meal_type: selectedMealType
      });
      fetchMealPlans();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlan = async (id: number) => {
    try {
      await mealPlanService.deletePlan(id);
      setPlans(plans.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateShoppingList = async () => {
    setShoppingGenerated(true);
    for (const plan of plans) {
      try {
        await shoppingService.generateFromRecipe(plan.recipe_id);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
            <CalIcon className="w-3.5 h-3.5" />
            <span>AI Guided Schedule</span>
          </div>
          <h1 className="font-serif font-bold text-3xl text-forest-950">Personalized Weekly Meal Planner</h1>
          <p className="text-sm text-forest-600 mt-1">
            Organize breakfast, lunch, and dinner. Automatically populate missing ingredients into your shopping list.
          </p>
        </div>

        <button
          onClick={handleGenerateShoppingList}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition shadow-soft self-start sm:self-auto"
        >
          <ShoppingCart className="w-4 h-4 text-emerald-300" />
          <span>{shoppingGenerated ? 'List Updated!' : 'Auto-Generate Shopping List'}</span>
        </button>
      </div>

      {/* Plan Assignment Box */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-soft">
        <h3 className="font-serif font-bold text-base text-forest-950 mb-3">Schedule a Meal</h3>
        <form onSubmit={handleAddPlan} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-forest-600 mb-1">Target Day</label>
            <select
              value={selectedDayOffset}
              onChange={(e) => setSelectedDayOffset(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-50/50 text-xs font-medium text-forest-900"
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-forest-600 mb-1">Meal Course</label>
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-50/50 text-xs font-medium text-forest-900 capitalize"
            >
              {MEAL_TYPES.map(m => (
                <option key={m} value={m} className="capitalize">{m}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-forest-600 mb-1">Select Recipe</label>
            <select
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-50/50 text-xs font-medium text-forest-900"
            >
              <option value="">-- Choose Recipe --</option>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.title} ({r.total_time}m)</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-forest-800 text-white font-bold text-xs hover:bg-forest-900 transition flex items-center justify-center gap-1.5 shadow-soft h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Plan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Planned Meals List */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-xl text-forest-950">Active Meal Itinerary</h3>

        {loading ? (
          <div className="p-8 text-center text-forest-600 animate-pulse">Loading itinerary...</div>
        ) : plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-cream-200 p-5 shadow-soft flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={plan.recipe_image || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80'}
                    alt={plan.recipe_title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                      {plan.meal_type}
                    </span>
                    <h4 className="font-serif font-bold text-base text-forest-950 mt-1 line-clamp-1">
                      {plan.recipe_title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-forest-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {plan.total_time}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        {Math.round(plan.calories)} kcal
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-forest-400 hover:text-terracotta-500 p-1"
                  title="Remove from plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-3xl border border-cream-200">
            <CalIcon className="w-8 h-8 text-forest-300 mx-auto mb-2" />
            <p className="font-serif font-bold text-base text-forest-900">No scheduled meals yet</p>
            <p className="text-xs text-forest-600 mt-1">Assign recipes to breakfast, lunch, or dinner above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
