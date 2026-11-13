import React from 'react';
import { Menu, Bell, User, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-cream-200 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-forest-700 hover:bg-cream-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline-block text-xs font-medium px-3 py-1 rounded-full bg-forest-50 text-forest-700 border border-forest-200">
          🌱 ML-Powered Culinary Intelligence
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/recommendations"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-forest-700 text-white hover:bg-forest-800 transition shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          What to cook today?
        </Link>

        {/* User profile dropdown / info */}
        <div className="flex items-center gap-3 border-l border-cream-200 pl-4">
          <Link to="/preferences" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs border border-forest-200">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-forest-900 leading-tight">
                {user?.full_name || 'Chef User'}
              </p>
              <p className="text-[10px] text-forest-600 capitalize">
                {profile?.dietary_preferences?.[0] || 'Omnivore'}
              </p>
            </div>
          </Link>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-forest-500 hover:text-terracotta-500 hover:bg-cream-100 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
