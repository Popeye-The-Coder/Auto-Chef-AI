import React, { useState } from 'react';
import { RefreshCw, Search, Sparkles, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { mlService } from '../services/api';
import { SubstituteItem } from '../types';

export const SubstitutionPage: React.FC = () => {
  const [targetIngredient, setTargetIngredient] = useState('butter');
  const [purpose, setPurpose] = useState('baking');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [substitutes, setSubstitutes] = useState<SubstituteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const POPULAR_INGREDIENTS = ['butter', 'heavy cream', 'egg', 'parmesan', 'soy sauce'];
  const PURPOSES = [
    { id: 'all-purpose', label: 'All-Purpose' },
    { id: 'baking', label: 'Baking' },
    { id: 'frying', label: 'Frying & Sautéing' },
    { id: 'spreading', label: 'Spreading' },
    { id: 'sauce', label: 'Sauces' },
    { id: 'binding', label: 'Binding' }
  ];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetIngredient.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await mlService.substitute({
        ingredient_name: targetIngredient.trim(),
        purpose: purpose,
        dietary_filter: dietaryFilter || undefined
      });
      setSubstitutes(data.substitutes || []);
    } catch (err) {
      console.error(err);
      setSubstitutes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Context-Aware Culinary Ontology</span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-forest-950">Intelligent Ingredient Substitution</h1>
        <p className="text-sm text-forest-600 mt-1">
          Missing an ingredient? Find purpose-aware alternatives that preserve texture, moisture, and flavor without violating allergy restrictions.
        </p>
      </div>

      {/* Interactive Tool Controls */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6 sm:p-8 shadow-soft space-y-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-forest-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={targetIngredient}
              onChange={(e) => setTargetIngredient(e.target.value)}
              placeholder="e.g. butter, heavy cream, egg..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition shadow-soft flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Finding...' : 'Find Alternatives'}</span>
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-forest-500 uppercase shrink-0">Try:</span>
          {POPULAR_INGREDIENTS.map((item) => (
            <button
              key={item}
              onClick={() => {
                setTargetIngredient(item);
                handleSearch();
              }}
              className="px-3 py-1 rounded-lg bg-cream-100 text-forest-800 font-semibold hover:bg-forest-100 transition shrink-0 capitalize"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Purpose Context Selector */}
        <div className="pt-4 border-t border-cream-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-forest-700 mb-2">
            Cooking Purpose Context (Affects physics, smoke point, and fat ratio)
          </label>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPurpose(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  purpose === p.id
                    ? 'bg-forest-800 text-white border-forest-800 shadow-xs'
                    : 'bg-cream-50 text-forest-800 border-cream-300 hover:bg-cream-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Area */}
      {loading ? (
        <div className="p-12 text-center text-forest-600 animate-pulse">
          Computing semantic flavor & texture vectors...
        </div>
      ) : substitutes.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-serif font-bold text-xl text-forest-950">
            Recommended Substitutes for <span className="capitalize italic text-forest-700">{targetIngredient}</span> ({purpose})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {substitutes.map((sub, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-cream-200 p-6 shadow-soft hover:shadow-premium transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-forest-950 capitalize">
                      {sub.substitute_name}
                    </h3>
                    <p className="text-xs text-forest-600 mt-0.5">{sub.taste_profile}</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sub.similarity_score}% Match
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-forest-50/70 text-xs">
                  <span className="font-bold text-forest-800">Conversion Ratio:</span>{' '}
                  <span className="font-medium text-forest-900">{sub.conversion_ratio}</span>
                </div>

                <p className="text-xs text-forest-700 leading-relaxed">
                  <strong className="text-forest-900">Best for:</strong> {sub.best_used_for}
                </p>

                {sub.notes && (
                  <p className="text-[11px] text-forest-600 italic">
                    💡 {sub.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-cream-100">
                  {sub.dietary_flags?.is_vegan && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Vegan
                    </span>
                  )}
                  {sub.dietary_flags?.is_gluten_free && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                      Gluten-Free
                    </span>
                  )}
                  {sub.allergens?.length === 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                      Allergen-Free
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : hasSearched ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-cream-200">
          <AlertCircle className="w-8 h-8 text-forest-400 mx-auto mb-2" />
          <p className="font-serif font-bold text-base text-forest-900">No substitutes found</p>
          <p className="text-xs text-forest-600 mt-1">Try selecting 'All-Purpose' context or another staple ingredient.</p>
        </div>
      ) : null}
    </div>
  );
};
