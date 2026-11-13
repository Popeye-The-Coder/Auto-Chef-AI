import React, { useState, useEffect } from 'react';
import { Sliders, ShieldCheck, Check, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export const PreferencesPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [maxTime, setMaxTime] = useState<number>(45);
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setDietary(profile.dietary_preferences || []);
      setAllergies(profile.allergies || []);
      setCuisines(profile.preferred_cuisines || []);
      setMaxTime(profile.max_cooking_time || 45);
      setCalorieTarget(profile.calorie_target || 2000);
    }
  }, [profile]);

  const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Pescatarian'];
  const ALLERGY_OPTIONS = ['Peanut', 'Milk', 'Egg', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Tree Nuts'];
  const CUISINE_OPTIONS = ['Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American', 'French'];

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    const lower = item.toLowerCase();
    if (list.includes(lower)) {
      setList(list.filter(x => x !== lower));
    } else {
      setList([...list, lower]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await authService.updateProfile({
        dietary_preferences: dietary,
        allergies: allergies,
        preferred_cuisines: cuisines,
        max_cooking_time: maxTime,
        calorie_target: calorieTarget
      });
      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
          <Sliders className="w-3.5 h-3.5" />
          <span>Algorithmic Safety Profile</span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-forest-950">Dietary & Allergy Preferences</h1>
        <p className="text-sm text-forest-600 mt-1">
          Configure health lifestyle and hard exclusion constraints enforced by the recommendation engine.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-cream-200 p-8 shadow-soft space-y-8">
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Preferences saved! Recommendation models updated with your new profile.</span>
          </div>
        )}

        {/* Dietary Rules */}
        <div>
          <h3 className="font-serif font-bold text-lg text-forest-950 mb-2">Dietary Lifestyle</h3>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => {
              const active = dietary.includes(opt.toLowerCase());
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleItem(dietary, setDietary, opt)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-forest-800 text-white border-forest-800 shadow-xs'
                      : 'bg-cream-50 text-forest-800 border-cream-300 hover:bg-cream-100'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Allergy Exclusions */}
        <div className="p-5 rounded-2xl bg-terracotta-50/60 border border-terracotta-100">
          <div className="flex items-center gap-2 text-terracotta-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-serif font-bold text-lg">Hard Allergy Exclusions</h3>
          </div>
          <p className="text-xs text-terracotta-600 mb-4">
            These ingredients are strictly omitted on the backend before ranking calculations.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((opt) => {
              const active = allergies.includes(opt.toLowerCase());
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleItem(allergies, setAllergies, opt)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-terracotta-600 text-white border-terracotta-600 shadow-xs'
                      : 'bg-white text-forest-800 border-terracotta-200 hover:bg-terracotta-100'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorite Cuisines */}
        <div>
          <h3 className="font-serif font-bold text-lg text-forest-950 mb-2">Favorite Cuisines</h3>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((opt) => {
              const active = cuisines.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (cuisines.includes(opt)) {
                      setCuisines(cuisines.filter(x => x !== opt));
                    } else {
                      setCuisines([...cuisines, opt]);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                    active
                      ? 'bg-forest-700 text-white border-forest-700 shadow-xs'
                      : 'bg-cream-50 text-forest-800 border-cream-300 hover:bg-cream-100'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cooking Time & Calorie Target Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-cream-100">
          <div>
            <div className="flex justify-between text-xs font-bold text-forest-800 mb-1.5">
              <span>Max Weeknight Cooking Time</span>
              <span className="font-mono text-forest-600">{maxTime} mins</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={maxTime}
              onChange={(e) => setMaxTime(Number(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-forest-800 mb-1.5">
              <span>Daily Caloric Target</span>
              <span className="font-mono text-forest-600">{calorieTarget} kcal</span>
            </div>
            <input
              type="range"
              min="1200"
              max="3500"
              step="50"
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(Number(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-cream-100">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 px-6 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition shadow-soft flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
