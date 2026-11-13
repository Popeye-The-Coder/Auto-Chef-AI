import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { shoppingService } from '../services/api';
import { ShoppingItem } from '../types';

export const ShoppingListPage: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New item input
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('items');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await shoppingService.getItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await shoppingService.addItem({
        ingredient_name: name.trim(),
        quantity,
        unit
      });
      setName('');
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await shoppingService.togglePurchased(id);
      setItems(items.map(i => i.id === id ? updated : i));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await shoppingService.deleteItem(id);
      setItems(items.filter(i => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = items.filter(i => !i.is_purchased).length;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Synchronized Grocery Checklist</span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-forest-950">Smart Shopping List</h1>
        <p className="text-sm text-forest-600 mt-1">
          Auto-populated with missing ingredients calculated from your chosen meal plans and recipes.
        </p>
      </div>

      {/* Add New Item Bar */}
      <div className="bg-white rounded-3xl border border-cream-200 p-5 shadow-soft">
        <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="Add grocery item (e.g. olive oil)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-xs text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-16 px-2 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-xs text-center text-forest-900"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-xs text-forest-900"
            >
              <option value="items">items</option>
              <option value="g">grams (g)</option>
              <option value="ml">ml</option>
              <option value="cloves">cloves</option>
              <option value="bunch">bunch</option>
            </select>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition flex items-center gap-1.5 shadow-soft shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* Shopping Items List */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cream-100">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-400">
            {pendingCount} item(s) remaining
          </span>
          <span className="text-xs text-forest-500 font-medium">
            Total {items.length} items
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-forest-600 animate-pulse">Loading grocery list...</div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                  item.is_purchased
                    ? 'bg-cream-50/50 border-cream-200 opacity-60'
                    : 'bg-white border-cream-200 hover:border-forest-300'
                }`}
              >
                <div
                  onClick={() => handleToggle(item.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                      item.is_purchased
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-cream-300 hover:border-forest-600'
                    }`}
                  >
                    {item.is_purchased && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span
                    className={`text-sm font-semibold capitalize ${
                      item.is_purchased
                        ? 'line-through text-forest-400'
                        : 'text-forest-950'
                    }`}
                  >
                    {item.ingredient_name}
                  </span>
                  <span className="text-xs font-mono text-forest-500 ml-2">
                    ({item.quantity} {item.unit})
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-forest-300 hover:text-terracotta-500 p-1 transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-serif font-bold text-base text-forest-900">Your shopping list is clear!</p>
            <p className="text-xs text-forest-600 mt-0.5">
              Generate missing ingredients from any recipe or meal plan to replenish your kitchen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
