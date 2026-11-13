import React, { useState, useEffect } from 'react';
import { Activity, Plus, Trash2, PieChart as PieIcon, ShieldCheck, Flame } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { mlService, recipeService } from '../services/api';
import { Recipe } from '../types';

export const NutritionAnalysisPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | ''>('');
  const [servings, setServings] = useState<number>(2);

  // Custom ingredients
  const [customList, setCustomList] = useState<Array<{ ingredient_name: string; amount: number; unit: string }>>([
    { ingredient_name: 'pasta', amount: 200, unit: 'g' },
    { ingredient_name: 'tomato', amount: 300, unit: 'g' },
    { ingredient_name: 'olive oil', amount: 20, unit: 'ml' },
    { ingredient_name: 'garlic', amount: 3, unit: 'cloves' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(100);
  const [newItemUnit, setNewItemUnit] = useState('g');

  const [nutritionResult, setNutritionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    recipeService.search().then(setRecipes).catch(console.error);
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      if (selectedRecipeId) {
        const data = await mlService.estimateNutrition({
          recipe_id: Number(selectedRecipeId),
          servings: servings
        });
        setNutritionResult(data);
      } else {
        const data = await mlService.estimateNutrition({
          ingredients: customList,
          servings: servings
        });
        setNutritionResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [selectedRecipeId, servings]);

  const handleAddCustom = () => {
    if (!newItemName.trim()) return;
    setCustomList([...customList, { ingredient_name: newItemName.trim().toLowerCase(), amount: newItemAmount, unit: newItemUnit }]);
    setNewItemName('');
    setSelectedRecipeId('');
  };

  const handleRemoveCustom = (idx: number) => {
    setCustomList(customList.filter((_, i) => i !== idx));
    setSelectedRecipeId('');
  };

  // Pie chart data for macros
  const macroData = nutritionResult ? [
    { name: 'Protein', value: nutritionResult.per_serving.protein * 4, color: '#2D8158' },
    { name: 'Carbs', value: nutritionResult.per_serving.carbohydrates * 4, color: '#D97706' },
    { name: 'Fat', value: nutritionResult.per_serving.fat * 9, color: '#C24B27' },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
          <Activity className="w-3.5 h-3.5" />
          <span>USDA FoodData Central Nutritional Standard</span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-forest-950">Nutritional Studio & Macro Estimator</h1>
        <p className="text-sm text-forest-600 mt-1">
          Compute verified nutritional macro profiles, serving splits, and dietary tags based on empirical food data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-cream-200 p-6 shadow-soft space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-forest-700 mb-1.5">
                Select Recipe (Or build custom ingredients below)
              </label>
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-xs font-medium text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="">-- Custom Ingredient List --</option>
                {recipes.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.cuisine})</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-forest-700 mb-1">
                <span>Serving Portions</span>
                <span className="font-mono text-forest-900">{servings} portion(s)</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full accent-forest-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Custom Ingredients Builder */}
          <div className="pt-4 border-t border-cream-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest-700">
              Ingredients for Analysis
            </h4>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {customList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-cream-50 border border-cream-200 text-xs">
                  <span className="font-bold text-forest-900 capitalize">{item.ingredient_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-forest-600">{item.amount} {item.unit}</span>
                    <button
                      onClick={() => handleRemoveCustom(idx)}
                      className="text-forest-400 hover:text-terracotta-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add ingredient row */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Ingredient (e.g. broccoli)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-cream-300 text-xs"
              />
              <input
                type="number"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(Number(e.target.value))}
                className="w-16 px-2 py-2 rounded-xl border border-cream-300 text-xs text-center"
              />
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="px-2 py-2 rounded-xl border border-cream-300 text-xs"
              >
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="tbsp">tbsp</option>
                <option value="items">items</option>
              </select>
              <button
                onClick={handleAddCustom}
                className="p-2 rounded-xl bg-forest-800 text-white hover:bg-forest-900"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition shadow-soft"
            >
              Recalculate Macros
            </button>
          </div>
        </div>

        {/* Right Column: Nutrition Results & Visualizations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {nutritionResult && (
            <div className="space-y-6">
              {/* Macro Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-soft text-center">
                  <p className="text-[11px] font-bold text-forest-500 uppercase">Calories</p>
                  <p className="font-serif font-bold text-2xl text-forest-950 mt-1">
                    {nutritionResult.per_serving.calories}
                  </p>
                  <p className="text-[10px] text-forest-600 mt-0.5">kcal / serving</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-soft text-center">
                  <p className="text-[11px] font-bold text-forest-500 uppercase">Protein</p>
                  <p className="font-serif font-bold text-2xl text-forest-700 mt-1">
                    {nutritionResult.per_serving.protein}g
                  </p>
                  <p className="text-[10px] text-forest-600 mt-0.5">muscle recovery</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-soft text-center">
                  <p className="text-[11px] font-bold text-forest-500 uppercase">Carbohydrates</p>
                  <p className="font-serif font-bold text-2xl text-amber-700 mt-1">
                    {nutritionResult.per_serving.carbohydrates}g
                  </p>
                  <p className="text-[10px] text-forest-600 mt-0.5">energy supply</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-soft text-center">
                  <p className="text-[11px] font-bold text-forest-500 uppercase">Dietary Fat</p>
                  <p className="font-serif font-bold text-2xl text-terracotta-600 mt-1">
                    {nutritionResult.per_serving.fat}g
                  </p>
                  <p className="text-[10px] text-forest-600 mt-0.5">vital lipids</p>
                </div>
              </div>

              {/* Health Labels */}
              {nutritionResult.health_labels.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-soft flex items-center gap-3">
                  <span className="text-xs font-bold text-forest-800">Health Badges:</span>
                  <div className="flex flex-wrap gap-2">
                    {nutritionResult.health_labels.map((lbl: string) => (
                      <span key={lbl} className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        ✓ {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Macro Distribution Chart */}
              <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-soft">
                <h4 className="font-serif font-bold text-base text-forest-950 mb-1">
                  Caloric Energy Distribution
                </h4>
                <p className="text-xs text-forest-500 mb-4">Percentage of total calories contributed by macro</p>

                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-6 text-xs font-semibold text-forest-700">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-forest-600" /> Protein</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-600" /> Carbs</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-terracotta-600" /> Fat</span>
                </div>
              </div>

              {/* Itemized Nutritional Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-serif font-bold text-base text-forest-950">Itemized Verification Breakdown</h4>
                  <span className="text-xs text-forest-600 font-medium">{nutritionResult.source_verification}</span>
                </div>

                <div className="space-y-2">
                  {nutritionResult.nutrient_breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-cream-50/70 border border-cream-100 text-xs">
                      <div>
                        <span className="font-bold text-forest-950 capitalize">{item.ingredient}</span>
                        <span className="text-[10px] text-forest-500 ml-2">({item.quantity_grams}g)</span>
                      </div>
                      <div className="flex items-center gap-4 text-forest-700">
                        <span className="font-mono">{item.calories} kcal</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 font-semibold">
                          {item.verification}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
