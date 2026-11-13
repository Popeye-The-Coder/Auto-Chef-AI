import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, Sparkles, AlertTriangle, Refrigerator, Clock,
  ArrowRight, ShieldCheck, Flame, Cpu, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recipeService, kitchenService, mlService } from '../services/api';
import { Recipe, InventoryItem, RecommendedRecipeItem } from '../types';
import { RecipeCard } from '../components/RecipeCard';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedRecipeItem[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<InventoryItem[]>([]);
  const [inventoryCount, setInventoryCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [recsRes, alertsRes, invRes] = await Promise.all([
          recipeService.recommend({ use_inventory: true, limit: 3 }),
          kitchenService.getExpiryAlerts(),
          kitchenService.getInventory()
        ]);
        setRecommendations(recsRes.recommendations || []);
        setExpiryAlerts(alertsRes || []);
        setInventoryCount(invRes.length || 0);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 text-white p-8 sm:p-10 shadow-elevated">
        <div className="absolute top-0 right-0 w-96 h-96 bg-forest-700/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-800 text-emerald-300 text-xs font-semibold mb-4 border border-forest-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Kitchen Assistant Active</span>
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl leading-tight">
            Hello, {user?.full_name ? user.full_name.split(' ')[0] : 'Chef'}!
          </h1>
          <p className="mt-2 text-forest-200 text-sm sm:text-base leading-relaxed">
            You currently have <span className="font-bold text-white">{inventoryCount} items</span> in your pantry.
            Snap a photo of new ingredients or discover tonight's recipe recommendations.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-bold text-xs uppercase tracking-wider transition shadow-soft"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Fridge / Ingredients</span>
            </Link>
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-800/80 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition border border-forest-700"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Personalized Recommendations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Expiry Alerts Notification Banner */}
      {expiryAlerts.length > 0 && (
        <div className="p-5 rounded-2xl bg-terracotta-50 border border-terracotta-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-soft">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-terracotta-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-terracotta-700">
                {expiryAlerts.length} ingredient(s) nearing expiration!
              </h4>
              <p className="text-xs text-terracotta-600 mt-0.5">
                {expiryAlerts.map(i => i.ingredient_name).join(', ')} should be used soon to avoid food waste.
              </p>
            </div>
          </div>
          <Link
            to="/inventory"
            className="text-xs font-bold px-4 py-2 rounded-xl bg-white text-terracotta-600 border border-terracotta-200 hover:bg-terracotta-100 transition whitespace-nowrap"
          >
            Manage Pantry
          </Link>
        </div>
      )}

      {/* Ready to Cook Tonight Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif font-bold text-2xl text-forest-950">Ready to Cook Tonight</h2>
            <p className="text-xs text-forest-600 mt-0.5">Matched directly to your pantry stock using Hybrid ML algorithms</p>
          </div>
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 hover:text-forest-600 transition"
          >
            <span>View All ({recommendations.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 bg-white rounded-2xl animate-pulse border border-cream-200" />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map(item => (
              <RecipeCard
                key={item.recipe.id}
                recipe={item.recipe}
                matchPercentage={item.match_percentage}
                explanation={item.explanation}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-2xl border border-cream-200">
            <Refrigerator className="w-12 h-12 text-forest-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-forest-900">Your kitchen is running low!</h3>
            <p className="text-xs text-forest-600 mt-1 max-w-sm mx-auto">
              Scan ingredients using the camera or manually add items to receive tailored recipe matches.
            </p>
            <Link
              to="/upload"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-white text-xs font-bold shadow-soft"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Ingredients</span>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Launchpad & ML Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/upload"
          className="p-5 rounded-2xl bg-white border border-cream-200 hover:border-forest-400 hover:shadow-soft transition flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-forest-950">AI Ingredient Scanner</h4>
            <p className="text-[11px] text-forest-600">YOLO Computer Vision</p>
          </div>
        </Link>

        <Link
          to="/substitutions"
          className="p-5 rounded-2xl bg-white border border-cream-200 hover:border-forest-400 hover:shadow-soft transition flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-forest-950">Smart Substitutions</h4>
            <p className="text-[11px] text-forest-600">Context-Aware NLP</p>
          </div>
        </Link>

        <Link
          to="/nutrition"
          className="p-5 rounded-2xl bg-white border border-cream-200 hover:border-forest-400 hover:shadow-soft transition flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-forest-950">Nutrition Studio</h4>
            <p className="text-[11px] text-forest-600">USDA Macro Calculator</p>
          </div>
        </Link>

        <Link
          to="/ml-insights"
          className="p-5 rounded-2xl bg-white border border-cream-200 hover:border-forest-400 hover:shadow-soft transition flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-forest-950">ML Performance</h4>
            <p className="text-[11px] text-forest-600">Evaluated Accuracy & IR</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
