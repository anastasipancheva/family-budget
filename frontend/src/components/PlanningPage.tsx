import { useState } from 'react';
import type { CategoryBudget, Stats, ShoppingItem } from '../types';
import BudgetPage from './BudgetPage';
import GroceryPlan from './GroceryPlan';

interface Props {
  budgets: CategoryBudget[];
  stats: Stats;
  month: string;
  shoppingItems: ShoppingItem[];
  weekStart: string;
  onWeekChange: (ws: string) => void;
  onRefresh: () => void;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(ws: string): string {
  const start = new Date(ws + 'T12:00:00');
  const end = new Date(ws + 'T12:00:00');
  end.setDate(end.getDate() + 4);
  const s = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const e = end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${s} — ${e}`;
}

function stepWeek(ws: string, dir: number): string {
  const d = new Date(ws + 'T12:00:00');
  d.setDate(d.getDate() + dir * 7);
  return d.toISOString().slice(0, 10);
}

type SubTab = 'budget' | 'grocery';

export default function PlanningPage({ budgets, stats, month, shoppingItems, weekStart, onWeekChange, onRefresh }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('budget');

  const todayWeek = getWeekStart(new Date());

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
        <button onClick={() => setSubTab('budget')}
          className={`flex-1 py-2.5 text-sm font-semibold transition ${subTab === 'budget' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
          🎯 Лимиты
        </button>
        <button onClick={() => setSubTab('grocery')}
          className={`flex-1 py-2.5 text-sm font-semibold transition ${subTab === 'grocery' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
          🛒 Закупки
        </button>
      </div>

      {subTab === 'budget' && (
        <BudgetPage budgets={budgets} stats={stats} month={month} onRefresh={onRefresh} />
      )}

      {subTab === 'grocery' && (
        <>
          {/* Week navigator */}
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <button onClick={() => onWeekChange(stepWeek(weekStart, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg">‹</button>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">{formatWeekRange(weekStart)}</p>
              {weekStart === todayWeek && <p className="text-xs text-indigo-500">текущая неделя</p>}
            </div>
            <button onClick={() => onWeekChange(stepWeek(weekStart, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg">›</button>
          </div>

          {weekStart !== todayWeek && (
            <button onClick={() => onWeekChange(todayWeek)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-800 transition">
              → Вернуться к текущей неделе
            </button>
          )}

          <GroceryPlan items={shoppingItems} weekStart={weekStart} onRefresh={onRefresh} />
        </>
      )}
    </div>
  );
}
