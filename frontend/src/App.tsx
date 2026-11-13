import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { IngredientUploadPage } from './pages/IngredientUploadPage';
import { RecipeDiscoveryPage } from './pages/RecipeDiscoveryPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { KitchenInventoryPage } from './pages/KitchenInventoryPage';
import { SubstitutionPage } from './pages/SubstitutionPage';
import { NutritionAnalysisPage } from './pages/NutritionAnalysisPage';
import { MealPlannerPage } from './pages/MealPlannerPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { MLInsightsPage } from './pages/MLInsightsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public / Auth routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Main App Layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<IngredientUploadPage />} />
            <Route path="/recipes" element={<RecipeDiscoveryPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/inventory" element={<KitchenInventoryPage />} />
            <Route path="/substitutions" element={<SubstitutionPage />} />
            <Route path="/nutrition" element={<NutritionAnalysisPage />} />
            <Route path="/meal-planner" element={<MealPlannerPage />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/ml-insights" element={<MLInsightsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
