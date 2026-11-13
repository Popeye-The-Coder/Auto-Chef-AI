import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Refrigerator, Plus, Trash2, AlertTriangle, Check,
  Sparkles, Calendar, Clock, ArrowRight
} from 'lucide-react';
import { kitchenService } from '../services/api';
import { InventoryItem } from '../types';

export const KitchenInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Item form
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('items');
  const [expiryDays, setExpiryDays] = useState(7);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await kitchenService.getInventory(false);
      setInventory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiryDays);

      await kitchenService.addInventoryItem({
        ingredient_name: name.trim(),
        quantity,
        unit,
        expiry_date: expDate.toISOString()
      });
      setName('');
      fetchInventory();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await kitchenService.deleteInventoryItem(id);
      setInventory(inventory.filter(i => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkConsumed = async (id: number) => {
    try {
      await kitchenService.updateInventoryItem(id, { is_consumed: true });
      setInventory(inventory.filter(i => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
            <Refrigerator className="w-3.5 h-3.5" />
            <span>Smart Kitchen Pantry</span>
          </div>
          <h1 className="font-serif font-bold text-3xl text-forest-950">Kitchen Inventory & Stock</h1>
          <p className="text-sm text-forest-600 mt-1">
            Track ingredients available in your kitchen. Recipes are prioritized automatically based on items nearing expiration.
          </p>
        </div>

        <Link
          to="/recommendations"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition shadow-soft self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>Cook With My Pantry</span>
        </Link>
      </div>

      {/* Add Item Card */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-soft">
        <h3 className="font-serif font-bold text-base text-forest-950 mb-4">Add Ingredient to Kitchen</h3>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Ingredient name (e.g. cherry tomatoes)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-xs text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-xs text-center text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-xs text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="items">items</option>
              <option value="g">grams (g)</option>
              <option value="ml">milliliters (ml)</option>
              <option value="cloves">cloves</option>
              <option value="slices">slices</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-forest-800 text-white font-bold text-xs hover:bg-forest-900 transition flex items-center justify-center gap-1.5 shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Stock</span>
            </button>
          </div>
        </form>
      </div>

      {/* Inventory Items Grid */}
      {loading ? (
        <div className="p-12 text-center text-forest-600 animate-pulse">Loading kitchen stock...</div>
      ) : inventory.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => {
            const isExp = item.is_expired;
            const isNear = item.is_nearing_expiry;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-white border transition shadow-soft flex flex-col justify-between ${
                  isExp
                    ? 'border-rose-300 bg-rose-50/20'
                    : isNear
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-cream-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif font-bold text-lg text-forest-950 capitalize">
                      {item.ingredient_name}
                    </h4>

                    {/* Expiry Badge */}
                    {item.days_to_expiry !== undefined && item.days_to_expiry !== null && (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isExp
                            ? 'bg-rose-100 text-rose-800'
                            : isNear
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isExp ? (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Expired</span>
                          </>
                        ) : isNear ? (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>{item.days_to_expiry}d left</span>
                          </>
                        ) : (
                          <>
                            <span>{item.days_to_expiry} days</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono font-semibold text-forest-600 mt-2">
                    In Stock: <strong className="text-forest-900">{item.quantity} {item.unit}</strong>
                  </p>
                  <p className="text-[11px] text-forest-400 capitalize mt-0.5">
                    Category: {item.category || 'Kitchen Staple'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-cream-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleMarkConsumed(item.id)}
                    className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:text-emerald-700 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Consumed</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-forest-400 hover:text-terracotta-500 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-3xl border border-cream-200">
          <p className="font-serif font-bold text-lg text-forest-900">Your pantry is currently empty</p>
          <p className="text-xs text-forest-600 mt-1">Scan or add ingredients above to enable instant recipe matching.</p>
        </div>
      )}
    </div>
  );
};
