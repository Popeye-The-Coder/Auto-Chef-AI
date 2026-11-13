import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock, Users, Flame, ChevronLeft, Heart, Bookmark,
  CheckCircle2, ShoppingCart, Star, Sparkles, AlertCircle, Play, Pause, RotateCcw
} from 'lucide-react';
import { recipeService, mlService, shoppingService } from '../services/api';
import { Recipe } from '../types';

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferencePrediction, setPreferencePrediction] = useState<any>(null);
  const [missingAdded, setMissingAdded] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  // Cooking timer
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      try {
        const data = await recipeService.getById(Number(id));
        setRecipe(data);
        setTimerSeconds(data.cook_time * 60);

        // Fetch ML preference prediction
        try {
          const pred = await mlService.predictPreference(data.id);
          setPreferencePrediction(pred);
        } catch (e) {
          console.warn('ML preference prediction note:', e);
        }

        // Record view interaction
        recipeService.recordInteraction(data.id, 'view').catch(() => {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleAddMissingToShopping = async () => {
    if (!recipe) return;
    try {
      await shoppingService.generateFromRecipe(recipe.id);
      setMissingAdded(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRate = async (stars: number) => {
    if (!recipe) return;
    setUserRating(stars);
    try {
      await recipeService.rate(recipe.id, stars);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInteract = async (type: 'like' | 'save' | 'cook') => {
    if (!recipe) return;
    try {
      await recipeService.recordInteraction(recipe.id, type);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-forest-600 animate-pulse">Loading culinary recipe details...</div>;
  }

  if (!recipe) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-cream-200">
        <p className="font-serif font-bold text-lg text-forest-900">Recipe not found</p>
        <Link to="/recipes" className="mt-3 inline-block text-xs font-bold text-forest-700 underline">
          Return to catalog
        </Link>
      </div>
    );
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button & quick actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-900 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleInteract('like')}
            className="p-2 rounded-xl bg-white border border-cream-200 text-forest-700 hover:text-rose-500 hover:bg-rose-50 transition shadow-xs"
            title="Like recipe"
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInteract('save')}
            className="p-2 rounded-xl bg-white border border-cream-200 text-forest-700 hover:text-amber-500 hover:bg-amber-50 transition shadow-xs"
            title="Save to favorites"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInteract('cook')}
            className="px-4 py-2 rounded-xl bg-forest-800 text-white text-xs font-bold hover:bg-forest-900 transition shadow-soft flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>I Cooked This</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-cream-200 bg-white shadow-premium">
        <div className="h-72 sm:h-96 w-full relative">
          <img
            src={recipe.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80'}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent" />

          {/* Hero text overlay */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                {recipe.cuisine} Cuisine
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md capitalize">
                {recipe.difficulty} Level
              </span>
              {recipe.dietary_flags.is_vegetarian && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/80 backdrop-blur-md">
                  Vegetarian
                </span>
              )}
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl leading-tight">
              {recipe.title}
            </h1>
          </div>
        </div>

        {/* Recipe Quick Stats Bar */}
        <div className="p-6 bg-cream-50/50 border-t border-cream-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-[11px] font-bold text-forest-500 uppercase">Prep Time</p>
            <p className="font-serif font-bold text-lg text-forest-900">{recipe.prep_time} mins</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-forest-500 uppercase">Cook Time</p>
            <p className="font-serif font-bold text-lg text-forest-900">{recipe.cook_time} mins</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-forest-500 uppercase">Total Time</p>
            <p className="font-serif font-bold text-lg text-forest-900">{recipe.total_time} mins</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-forest-500 uppercase">Yield</p>
            <p className="font-serif font-bold text-lg text-forest-900">{recipe.servings} Servings</p>
          </div>
        </div>
      </div>

      {/* ML Preference Prediction Card */}
      {preferencePrediction && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-forest-50 to-cream-100 border border-forest-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-forest-700 text-emerald-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-forest-600">
                  ML Food Preference Prediction
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-forest-200 text-forest-800">
                  {preferencePrediction.algorithm}
                </span>
              </div>
              <h4 className="font-serif font-bold text-forest-950 text-base mt-0.5">
                {preferencePrediction.predicted_enjoyment
                  ? 'High Match: You are predicted to love this recipe!'
                  : 'Moderate Match for your taste profile'}
              </h4>
              <p className="text-xs text-forest-700 mt-0.5">
                Model confidence: <span className="font-mono font-bold">{Math.round(preferencePrediction.confidence_score * 100)}%</span>
              </p>
            </div>
          </div>

          {/* Top contributing features */}
          {preferencePrediction.top_contributing_features && (
            <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-forest-700 bg-white/80 p-2 rounded-xl border border-cream-300">
              {Object.entries(preferencePrediction.top_contributing_features).map(([feat, val]: any) => (
                <span key={feat} className="px-2 py-0.5 rounded bg-cream-100">
                  {feat.replace('_', ' ')}: {val}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nutrition Macro Panel */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-soft">
        <h3 className="font-serif font-bold text-lg text-forest-950 mb-1">
          Nutritional Facts <span className="text-xs font-sans font-normal text-forest-600">(per serving)</span>
        </h3>
        <p className="text-xs text-forest-500 mb-4">Values aggregated from USDA FoodData Central standards.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="p-3 rounded-xl bg-cream-100">
            <p className="text-[11px] font-bold text-forest-500 uppercase">Calories</p>
            <p className="font-serif font-bold text-base text-forest-900 mt-1">{Math.round(recipe.calories)} kcal</p>
          </div>
          <div className="p-3 rounded-xl bg-cream-100">
            <p className="text-[11px] font-bold text-forest-500 uppercase">Protein</p>
            <p className="font-serif font-bold text-base text-forest-900 mt-1">{recipe.protein}g</p>
          </div>
          <div className="p-3 rounded-xl bg-cream-100">
            <p className="text-[11px] font-bold text-forest-500 uppercase">Carbs</p>
            <p className="font-serif font-bold text-base text-forest-900 mt-1">{recipe.carbs}g</p>
          </div>
          <div className="p-3 rounded-xl bg-cream-100">
            <p className="text-[11px] font-bold text-forest-500 uppercase">Fat</p>
            <p className="font-serif font-bold text-base text-forest-900 mt-1">{recipe.fat}g</p>
          </div>
          <div className="p-3 rounded-xl bg-cream-100">
            <p className="text-[11px] font-bold text-forest-500 uppercase">Fiber</p>
            <p className="font-serif font-bold text-base text-forest-900 mt-1">{recipe.fiber}g</p>
          </div>
          <div className="p-3 rounded-xl bg-cream-100">
            <p className="text-[11px] font-bold text-forest-500 uppercase">Sugar</p>
            <p className="font-serif font-bold text-base text-forest-900 mt-1">{recipe.sugar}g</p>
          </div>
          <div className="p-3 rounded-xl bg-cream-100">
            <p className="text-[11px] font-bold text-forest-500 uppercase">Sodium</p>
            <p className="font-serif font-bold text-base text-forest-900 mt-1">{recipe.sodium}mg</p>
          </div>
        </div>
      </div>

      {/* Ingredients & Instructions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ingredients Checklist (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-cream-200 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-100">
            <h3 className="font-serif font-bold text-xl text-forest-950">Ingredients</h3>
            <span className="text-xs font-bold text-forest-600">{recipe.ingredients.length} items</span>
          </div>

          <ul className="space-y-2.5">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-forest-800">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
                <span className="font-medium">
                  {ing.original_text || `${ing.amount} ${ing.unit} ${ing.ingredient_name}`}
                </span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-cream-100">
            <button
              onClick={handleAddMissingToShopping}
              disabled={missingAdded}
              className="w-full py-3 px-4 rounded-xl bg-cream-100 hover:bg-forest-100 text-forest-800 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 text-forest-600" />
              <span>{missingAdded ? 'Added to Shopping List!' : 'Add Missing to Shopping List'}</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Instructions & Timer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-cream-200 p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-cream-100">
            <h3 className="font-serif font-bold text-xl text-forest-950">Instructions</h3>

            {/* Interactive Cooking Timer */}
            <div className="flex items-center gap-2 bg-cream-100 px-3 py-1.5 rounded-xl border border-cream-300">
              <Clock className="w-3.5 h-3.5 text-forest-600" />
              <span className="font-mono font-bold text-xs text-forest-900">
                {formatTimer(timerSeconds)}
              </span>
              <button
                onClick={() => setTimerActive(!timerActive)}
                className="p-1 rounded-md bg-forest-800 text-white hover:bg-forest-900"
              >
                {timerActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                onClick={() => {
                  setTimerActive(false);
                  setTimerSeconds(recipe.cook_time * 60);
                }}
                className="p-1 rounded-md text-forest-600 hover:bg-cream-200"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {recipe.instructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3.5 rounded-2xl bg-cream-50/50 border border-cream-100">
                <span className="w-7 h-7 rounded-full bg-forest-800 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-forest-900 leading-relaxed pt-0.5">
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* User Rating Widget */}
          <div className="pt-6 border-t border-cream-100 flex items-center justify-between">
            <span className="text-xs font-bold text-forest-700">Rate this recipe:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="p-1 text-forest-300 hover:text-amber-400 transition"
                >
                  <Star
                    className={`w-5 h-5 ${
                      (userRating !== null && star <= userRating)
                        ? 'fill-amber-400 text-amber-400'
                        : ''
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
