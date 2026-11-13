import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat, Camera, Sparkles, Refrigerator, ShieldCheck,
  Activity, ArrowRight, CheckCircle2, Cpu
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-50 text-forest-950">
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-white shadow-soft">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <span className="font-serif font-bold text-2xl tracking-tight text-forest-950">AutoChef</span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 tracking-wide uppercase">AI Edition</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-forest-800 hover:text-forest-600 transition px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-bold px-5 py-2.5 rounded-xl bg-forest-800 text-white hover:bg-forest-900 transition shadow-soft flex items-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-100 text-forest-800 text-xs font-bold mb-6">
          <Sparkles className="w-4 h-4 text-forest-600" />
          <span>Machine Learning & Computer Vision Cooking Platform</span>
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-forest-950 max-w-4xl mx-auto leading-[1.15]">
          Turn what’s in your kitchen into <span className="text-forest-700 italic">extraordinary</span> meals.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-forest-800/80 max-w-2xl mx-auto font-normal">
          Snap a photo of your fridge ingredients. Our YOLO computer vision detects ingredients instantly,
          and intelligent hybrid ML recommends personalized recipes with zero food waste.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-forest-800 text-white font-bold text-base hover:bg-forest-900 transition shadow-elevated flex items-center justify-center gap-3"
          >
            <Camera className="w-5 h-5" />
            <span>Launch Demo Dashboard</span>
          </Link>
          <Link
            to="/ml-insights"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-forest-800 font-bold text-base border border-cream-300 hover:bg-cream-100 transition shadow-soft flex items-center justify-center gap-2"
          >
            <Cpu className="w-5 h-5 text-forest-600" />
            <span>Explore ML Models & Metrics</span>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-forest-700">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> YOLOv8 Object Detection</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> TF-IDF Hybrid Recommendations</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Collaborative Filtering</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Strict Allergen Safety</span>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="bg-white border-y border-cream-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold text-forest-950">Six Core AI & ML Engines in One App</h2>
            <p className="mt-2 text-forest-600 text-sm">Real algorithms running live on the Python backend, not static mockups.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-cream-50/80 border border-cream-200 shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mb-5">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-forest-950">YOLO Ingredient Vision</h3>
              <p className="mt-2 text-sm text-forest-700/80 leading-relaxed">
                Upload raw kitchen photos. Detect multiple vegetables, fruits, and pantry items with bounding boxes and actual confidence scores.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-cream-50/80 border border-cream-200 shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-forest-950">Intelligent Hybrid Matching</h3>
              <p className="mt-2 text-sm text-forest-700/80 leading-relaxed">
                TF-IDF vectorization and weighted set intersection prioritize recipes you can cook now while utilizing ingredients nearing expiration.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-cream-50/80 border border-cream-200 shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-forest-950">Allergy-Safe Personalization</h3>
              <p className="mt-2 text-sm text-forest-700/80 leading-relaxed">
                Hard backend exclusion rules guarantee allergens (peanuts, milk, eggs, gluten) are filtered before scoring and never suggested in substitutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-600 gap-4">
        <p>© 2026 AutoChef AI. All Machine Learning models trained with verified culinary corpora.</p>
        <div className="flex gap-6 font-semibold">
          <Link to="/ml-insights" className="hover:text-forest-900 transition">ML Insights</Link>
          <Link to="/recipes" className="hover:text-forest-900 transition">Recipes</Link>
          <Link to="/login" className="hover:text-forest-900 transition">Login</Link>
        </div>
      </footer>
    </div>
  );
};
