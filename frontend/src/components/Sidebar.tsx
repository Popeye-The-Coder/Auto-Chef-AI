import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChefHat, LayoutDashboard, Camera, BookOpen, Sparkles,
  Refrigerator, Calendar, ShoppingCart, RefreshCw, Activity,
  Sliders, Cpu, HeartHandshake
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'AI Ingredient Vision', icon: Camera, badge: 'YOLO' },
    { to: '/recipes', label: 'Recipe Discovery', icon: BookOpen },
    { to: '/recommendations', label: 'Personalized For You', icon: Sparkles, badge: 'Hybrid ML' },
    { to: '/inventory', label: 'Kitchen Pantry', icon: Refrigerator },
    { to: '/meal-planner', label: 'Meal Planner', icon: Calendar },
    { to: '/shopping-list', label: 'Smart Shopping List', icon: ShoppingCart },
    { to: '/substitutions', label: 'Ingredient Substitutes', icon: RefreshCw },
    { to: '/nutrition', label: 'Nutrition Studio', icon: Activity },
    { to: '/ml-insights', label: 'ML Insights & Metrics', icon: Cpu, badge: 'Live AI' },
    { to: '/preferences', label: 'Dietary Preferences', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-forest-950/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-cream-200 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-6 flex items-center gap-3 border-b border-cream-200">
          <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-soft">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl tracking-tight text-forest-900 leading-none">AutoChef</h1>
            <p className="text-[10px] tracking-wider uppercase font-semibold text-forest-600 mt-1">Intelligent Cooking AI</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-forest-400">
            Core Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-forest-50 text-forest-800 font-semibold shadow-xs'
                      : 'text-forest-700/80 hover:bg-cream-100 hover:text-forest-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4.5 h-4.5 text-forest-600" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-cream-200 bg-cream-50/50">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs">
              <p className="font-semibold text-forest-900">ML Backend Active</p>
              <p className="text-[11px] text-forest-600">YOLOv8 & Hybrid Engine</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
