import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Clock, Filter, X } from 'lucide-react';
import { recipeService } from '../services/api';
import { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';

export const RecipeDiscoveryPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDietary, setSelectedDietary] = useState('All');
  const [maxTime, setMaxTime] = useState<number>(60);

  const CUISINES = ['All', 'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American', 'French'];
  const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner'];
  const DIETARY = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free'];

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const data = await recipeService.search({
        query: query.trim() || undefined,
        cuisine: selectedCuisine,
        category: selectedCategory,
        max_time: maxTime,
        dietary: selectedDietary
      });
      setRecipes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [selectedCuisine, selectedCategory, selectedDietary, maxTime]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipes();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif font-bold text-3xl text-forest-950">Recipe Discovery Catalog</h1>
        <p className="text-sm text-forest-600 mt-1">
          Explore culinary recipes verified for nutritional composition and dietary safety.
        </p>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-soft space-y-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-forest-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes by name, ingredient, or culinary technique..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition shadow-soft"
          >
            Search
          </button>
        </form>

        {/* Cuisine Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-forest-500 uppercase mr-2 shrink-0">Cuisine:</span>
          {CUISINES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCuisine(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                selectedCuisine === c
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'bg-cream-100 text-forest-700 hover:bg-forest-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Category & Dietary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-cream-100 text-xs">
          <div>
            <label className="block font-bold text-forest-700 mb-1.5">Meal Course</label>
            <div className="flex gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-forest-700 text-white'
                      : 'bg-cream-100 text-forest-700 hover:bg-cream-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-forest-700 mb-1.5">Dietary Filter</label>
            <div className="flex gap-1.5">
              {DIETARY.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDietary(d)}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    selectedDietary === d
                      ? 'bg-forest-700 text-white'
                      : 'bg-cream-100 text-forest-700 hover:bg-cream-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold text-forest-700 mb-1">
              <span>Max Time</span>
              <span className="text-forest-600 font-mono">{maxTime} mins</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={maxTime}
              onChange={(e) => setMaxTime(Number(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-white border border-cream-200 animate-pulse" />
          ))}
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-3xl border border-cream-200">
          <p className="font-serif font-bold text-lg text-forest-900">No matching recipes found</p>
          <p className="text-xs text-forest-600 mt-1">Try loosening your dietary filters or cooking time constraints.</p>
        </div>
      )}
    </div>
  );
};
