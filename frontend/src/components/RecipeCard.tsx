import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Flame, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  matchPercentage?: number;
  explanation?: string;
  onQuickAddPlan?: (recipeId: number) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  matchPercentage,
  explanation,
  onQuickAddPlan
}) => {
  return (
    <div className="group bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-soft hover:shadow-premium transition-all duration-300 flex flex-col">
      {/* Recipe image & badges */}
      <div className="relative h-48 w-full overflow-hidden bg-cream-100">
        <img
          src={recipe.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Cuisine badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {recipe.cuisine && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-forest-800 shadow-xs">
              {recipe.cuisine}
            </span>
          )}
          {recipe.dietary_flags.is_vegan && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              Vegan
            </span>
          )}
          {recipe.dietary_flags.is_vegetarian && !recipe.dietary_flags.is_vegan && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              Veg
            </span>
          )}
          {recipe.dietary_flags.is_gluten_free && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
              GF
            </span>
          )}
        </div>

        {/* Match score badge if present */}
        {matchPercentage !== undefined && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-forest-800 text-white shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{matchPercentage}% Match</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif font-bold text-lg text-forest-950 group-hover:text-forest-700 transition line-clamp-1">
            {recipe.title}
          </h3>
          <p className="text-xs text-forest-600/80 mt-1 line-clamp-2">
            {recipe.description || 'Delicious, nutritious home-cooked meal prepared with fresh ingredients.'}
          </p>

          {/* Explanation if present */}
          {explanation && (
            <p className="mt-2.5 text-[11px] text-forest-700 bg-forest-50 p-2 rounded-lg font-medium">
              💡 {explanation}
            </p>
          )}

          {/* Meta metrics */}
          <div className="flex items-center gap-4 mt-4 text-xs text-forest-700 font-medium">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-forest-500" />
              <span>{recipe.total_time} mins</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-forest-500" />
              <span>{recipe.servings} serv</span>
            </div>
            {recipe.calories > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{Math.round(recipe.calories)} kcal</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Link */}
        <div className="mt-5 pt-4 border-t border-cream-100 flex items-center justify-between">
          <Link
            to={`/recipes/${recipe.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 hover:text-forest-600 transition"
          >
            <span>View Recipe & Instructions</span>
            <ChevronRight className="w-4 h-4" />
          </Link>

          {onQuickAddPlan && (
            <button
              onClick={() => onQuickAddPlan(recipe.id)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-cream-100 text-forest-700 hover:bg-forest-100 transition"
            >
              + Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
