import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Check, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export const OnboardingPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [dietary, setDietary] = useState<string[]>(profile?.dietary_preferences || []);
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies || []);
  const [cuisines, setCuisines] = useState<string[]>(profile?.preferred_cuisines || ['Italian', 'Mexican']);
  const [maxTime, setMaxTime] = useState<number>(profile?.max_cooking_time || 45);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({
        dietary_preferences: dietary,
        allergies: allergies,
        preferred_cuisines: cuisines,
        max_cooking_time: maxTime,
      });
      await refreshProfile();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-cream-200 shadow-premium p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white flex items-center justify-center mx-auto mb-3 shadow-soft">
            <ChefHat className="w-7 h-7" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-forest-950">Personalize Your AI Taste Profile</h2>
          <p className="text-xs text-forest-600 mt-1">Our recommendation algorithms tailor recipes strictly to these rules.</p>
        </div>

        <div className="space-y-8">
          {/* Dietary Preferences */}
          <div>
            <h3 className="text-sm font-bold text-forest-900 mb-2">Dietary Lifestyle</h3>
            <div className="flex flex-wrap gap-2.5">
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
          <div className="p-4 rounded-2xl bg-terracotta-50/60 border border-terracotta-100">
            <div className="flex items-center gap-2 mb-2 text-terracotta-700">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-sm font-bold">Strict Allergy Exclusions</h3>
            </div>
            <p className="text-[11px] text-terracotta-600 mb-3">
              Recipes with these allergens are strictly eliminated before AI scoring.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map((opt) => {
                const active = allergies.includes(opt.toLowerCase());
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleItem(allergies, setAllergies, opt)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                      active
                        ? 'bg-terracotta-600 text-white border-terracotta-600 shadow-xs'
                        : 'bg-white text-forest-800 border-terracotta-200 hover:bg-terracotta-100'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5" />}
                    <span>{opt} Allergy</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Cuisines */}
          <div>
            <h3 className="text-sm font-bold text-forest-900 mb-2">Favorite Cuisines</h3>
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

          {/* Max Cooking Time */}
          <div>
            <div className="flex justify-between text-xs font-bold text-forest-800 mb-2">
              <span>Maximum Weeknight Cooking Time</span>
              <span className="text-forest-600">{maxTime} minutes</span>
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

          <div className="pt-4 border-t border-cream-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 px-6 rounded-xl bg-forest-800 text-white font-bold text-sm hover:bg-forest-900 transition shadow-soft flex items-center justify-center gap-2"
            >
              <span>{saving ? 'Configuring AI Engine...' : 'Complete Profile & Enter Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
