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
      <div className="flex rounded-2xl overflow-hidden bg-card2 p-1 gap-1">
        <button onClick={() => setSubTab('budget')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${subTab === 'budget' ? 'bg-y text-black' : 'text-t2 hover:text-t1'}`}>
          🎯 Лимиты
        </button>
        <button onClick={() => setSubTab('grocery')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${subTab === 'grocery' ? 'bg-y text-black' : 'text-t2 hover:text-t1'}`}>
          🛒 Закупки
        </button>
      </div>

      {subTab === 'budget' && (
        <BudgetPage budgets={budgets} stats={stats} month={month} onRefresh={onRefresh} />
      )}

      {subTab === 'grocery' && (
        <>
          {/* Week navigator */}
          <div className="flex items-center justify-between bg-card rounded-2xl px-4 py-3 border border-brd">
            <button onClick={() => onWeekChange(stepWeek(weekStart, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-card2 text-t2 hover:text-t1 transition text-lg">‹</button>
            <div className="text-center">
              <p className="text-sm font-semibold text-t1">{formatWeekRange(weekStart)}</p>
              {weekStart === todayWeek && <p className="text-xs text-y">текущая неделя</p>}
            </div>
            <button onClick={() => onWeekChange(stepWeek(weekStart, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-card2 text-t2 hover:text-t1 transition text-lg">›</button>
          </div>

          {weekStart !== todayWeek && (
            <button onClick={() => onWeekChange(todayWeek)}
              className="w-full text-sm text-y hover:brightness-110 transition">
              → Вернуться к текущей неделе
            </button>
          )}

          <GroceryPlan items={shoppingItems} weekStart={weekStart} onRefresh={onRefresh} />
        </>
      )}
    </div>
  );
}
