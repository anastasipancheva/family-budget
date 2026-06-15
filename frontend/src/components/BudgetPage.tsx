import { useState } from 'react';
import type { CategoryBudget, Stats } from '../types';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../types';
import { fmt } from './Dashboard';
import * as api from '../api';

interface Props { budgets: CategoryBudget[]; stats: Stats; month: string; onRefresh: () => void; }

export default function BudgetPage({ budgets, stats, month, onRefresh }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b.amount]));
  const actualMap = Object.fromEntries(
    stats.byCategory.filter(c => !c.isIncome).map(c => [c.category, c.amount])
  );

  const totalLimit = budgets.reduce((s, b) => s + b.amount, 0);
  const totalActual = stats.byCategory.filter(c => !c.isIncome).reduce((s, c) => s + c.amount, 0);

  function startEdit(cat: string) {
    setEditing(cat);
    setEditValue(String(budgetMap[cat] ?? ''));
  }

  async function saveEdit(cat: string) {
    setSaving(true);
    try {
      await api.saveBudgetItem(month, cat, +editValue || 0);
      onRefresh();
      setEditing(null);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-t3">
        Задайте максимальный лимит трат по каждой категории.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-brd">
          <p className="text-xs text-t2 uppercase tracking-wide font-medium">Установлено лимитов</p>
          <p className="text-xl font-bold text-t1 mt-1">{fmt(totalLimit)}</p>
          <p className="text-xs text-t3 mt-0.5">максимум трат</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-brd">
          <p className="text-xs text-t2 uppercase tracking-wide font-medium">Потрачено</p>
          <p className={`text-xl font-bold mt-1 ${totalLimit > 0 && totalActual > totalLimit ? 'text-[#FF453A]' : 'text-t1'}`}>
            {fmt(totalActual)}
          </p>
          {totalLimit > 0 && (
            <p className="text-xs mt-0.5 text-t3">
              {totalActual <= totalLimit
                ? `осталось ${fmt(totalLimit - totalActual)}`
                : `перерасход ${fmt(totalActual - totalLimit)}`}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {EXPENSE_CATEGORIES.map(cat => {
          const limit = budgetMap[cat] ?? 0;
          const actual = actualMap[cat] ?? 0;
          const pct = limit > 0 ? Math.min(100, (actual / limit) * 100) : 0;
          const over = limit > 0 && actual > limit;
          const isEditing = editing === cat;
          const color = CATEGORY_COLORS[cat] ?? '#FFDD2D';

          return (
            <div key={cat} className="bg-card rounded-2xl p-4 border border-brd">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg flex-shrink-0">{CATEGORY_ICONS[cat]}</span>
                <span className="flex-1 font-medium text-sm text-t1">{cat}</span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs text-t3">Потрачено</p>
                  <p className={`font-bold text-base ${over ? 'text-[#FF453A]' : 'text-t1'}`}>{fmt(actual)}</p>
                </div>
                <div className="text-t3 text-lg">→</div>
                <div className="text-right">
                  <p className="text-xs text-t3">Лимит (макс. трат)</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                        className="w-24 bg-card2 border border-y/60 rounded-xl px-2 py-1 text-sm font-bold text-t1 focus:outline-none text-right"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(cat); if (e.key === 'Escape') setEditing(null); }} />
                      <button onClick={() => saveEdit(cat)} disabled={saving}
                        className="text-xs bg-y text-black font-bold px-2 py-1.5 rounded-lg disabled:opacity-50">✓</button>
                      <button onClick={() => setEditing(null)} className="text-xs text-t3 px-1">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(cat)}
                      className="font-bold text-base text-right hover:text-y transition block w-full text-t1">
                      {limit > 0 ? fmt(limit) : <span className="text-sm text-t3 font-normal">+ задать лимит</span>}
                    </button>
                  )}
                </div>
              </div>

              {limit > 0 ? (
                <>
                  <div className="h-2 bg-card2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: over ? '#FF453A' : color }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-t3">{Math.round(pct)}% использовано</span>
                    <span className={`text-xs font-semibold ${over ? 'text-[#FF453A]' : 'text-green-400'}`}>
                      {over
                        ? `⚠️ перерасход ${fmt(actual - limit)}`
                        : `✓ ещё можно потратить ${fmt(limit - actual)}`}
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-2 bg-card2 rounded-full">
                  {actual > 0 && <div className="h-full w-full rounded-full" style={{ background: color }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
