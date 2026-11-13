import React, { useState, useEffect } from 'react';
import { Sparkles, Sliders, CheckCircle2, Clock, Filter, ArrowRight } from 'lucide-react';
import { recipeService } from '../services/api';
import { RecommendedRecipeItem } from '../types';
import { RecipeCard } from '../components/RecipeCard';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendedRecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [algorithm, setAlgorithm] = useState<'hybrid' | 'personalized'>('hybrid');
  const [maxTime, setMaxTime] = useState<number>(60);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [algoLabel, setAlgoLabel] = useState<string>('');

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      if (algorithm === 'hybrid') {
        const data = await recipeService.recommend({
          use_inventory: true,
          max_cooking_time: maxTime,
          limit: 12
        });
        setRecommendations(data.recommendations || []);
        setTotalFound(data.total_found || 0);
        setAlgoLabel(data.algorithm_used);
      } else {
        const data = await recipeService.getPersonalized(12);
        setRecommendations(data.recommendations || []);
        setTotalFound(data.total_found || 0);
        setAlgoLabel(data.algorithm_used);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [algorithm, maxTime]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Algorithmic Ranking Engine</span>
          </div>
          <h1 className="font-serif font-bold text-3xl text-forest-950">Intelligent Recipe Recommendations</h1>
          <p className="text-sm text-forest-600 mt-1 max-w-xl">
            Ranked using TF-IDF culinary vectors, pantry overlap, and collaborative filtering.
          </p>
        </div>

        {/* Algorithm Switcher */}
        <div className="flex bg-cream-100 p-1.5 rounded-2xl border border-cream-200 self-start sm:self-auto">
          <button
            onClick={() => setAlgorithm('hybrid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              algorithm === 'hybrid'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-forest-700 hover:text-forest-900'
            }`}
          >
            Hybrid TF-IDF & Pantry
          </button>
          <button
            onClick={() => setAlgorithm('personalized')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              algorithm === 'personalized'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-forest-700 hover:text-forest-900'
            }`}
          >
            Collaborative Filtering
          </button>
        </div>
      </div>

      {/* Active Model Indicator */}
      <div className="p-4 rounded-2xl bg-white border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-soft">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-forest-900">Active Engine:</span>
          <span className="font-mono text-forest-700 bg-cream-100 px-2.5 py-0.5 rounded-lg border border-cream-200">
            {algoLabel || (algorithm === 'hybrid' ? 'Hybrid TF-IDF & Weighted Ingredient Matcher' : 'Collaborative Filter')}
          </span>
        </div>

        <div className="flex items-center gap-4 text-forest-600">
          <span>Results: <strong className="text-forest-900">{totalFound}</strong> recipes</span>
          <div className="flex items-center gap-2">
            <span>Max Cooking:</span>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={maxTime}
              onChange={(e) => setMaxTime(Number(e.target.value))}
              className="w-24 accent-forest-700 cursor-pointer"
            />
            <span className="font-mono text-forest-900">{maxTime}m</span>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-white border border-cream-200 animate-pulse" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((item) => (
            <div key={item.recipe.id} className="relative">
              <RecipeCard
                recipe={item.recipe}
                matchPercentage={item.match_percentage}
                explanation={item.explanation}
              />
              {/* Score pill */}
              <div className="mt-2 text-right">
                <span className="text-[11px] font-mono text-forest-600 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-100">
                  ML Score: {item.score} / 100
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-3xl border border-cream-200">
          <p className="font-serif font-bold text-lg text-forest-900">No matching recipes found</p>
          <p className="text-xs text-forest-600 mt-1">Try adjusting the cooking time or adding more ingredients to your pantry.</p>
        </div>
      )}
    </div>
  );
};
