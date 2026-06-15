import { useState } from 'react';
import type { Transaction, AppSettings } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import { fmt } from './Dashboard';

interface Props {
  transactions: Transaction[];
  settings: AppSettings;
  onDelete: (id: number) => void;
  onFilter: (params: { isIncome?: boolean; category?: string; person?: string; search?: string }) => void;
}

function personName(person: string, s: AppSettings) {
  if (person === 'person1') return s.person1Name;
  if (person === 'person2') return s.person2Name;
  return '';
}

export default function TransactionList({ transactions, settings, onDelete, onFilter }: Props) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPerson, setFilterPerson] = useState('');

  function apply(overrides: Partial<{ type: typeof filterType; category: string; person: string; search: string }> = {}) {
    const t = overrides.type ?? filterType;
    const c = overrides.category ?? filterCategory;
    const p = overrides.person ?? filterPerson;
    const s = overrides.search ?? search;
    onFilter({
      isIncome: t === 'all' ? undefined : t === 'income',
      category: c || undefined,
      person: p || undefined,
      search: s || undefined,
    });
  }

  function setType(t: typeof filterType) { setFilterType(t); setFilterCategory(''); apply({ type: t, category: '' }); }
  function setCat(c: string) { setFilterCategory(c); apply({ category: c }); }
  function setPerson(p: string) { setFilterPerson(p); apply({ person: p }); }
  function doSearch(s: string) { setSearch(s); apply({ search: s }); }

  const allCategories = filterType === 'income' ? INCOME_CATEGORIES : filterType === 'expense' ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  // Group by date
  const byDate = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const arr = byDate.get(t.date) ?? [];
    arr.push(t);
    byDate.set(t.date, arr);
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  const personOptions = [
    { value: '', label: 'Все' },
    { value: 'person1', label: settings.person1Name },
    { value: 'person2', label: settings.person2Name },
    { value: 'shared', label: 'Общее' },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input type="search" value={search} onChange={e => doSearch(e.target.value)}
          placeholder="Поиск по описанию или категории…"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
      </div>

      {/* Type tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
        {(['all', 'income', 'expense'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2 text-sm font-medium transition ${filterType === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t === 'all' ? 'Все' : t === 'income' ? '+ Доходы' : '− Расходы'}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select value={filterCategory} onChange={e => setCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-shrink-0">
          <option value="">Все категории</option>
          {allCategories.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>
        <select value={filterPerson} onChange={e => setPerson(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-shrink-0">
          {personOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(filterCategory || filterPerson || search) && (
          <button onClick={() => { setFilterCategory(''); setFilterPerson(''); setSearch(''); apply({ category: '', person: '', search: '' }); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 bg-white flex-shrink-0 whitespace-nowrap">
            Сбросить ×
          </button>
        )}
      </div>

      {/* Count */}
      {transactions.length > 0 && (
        <p className="text-xs text-gray-400">Найдено: {transactions.length} записей</p>
      )}

      {/* List */}
      {transactions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>Нет записей по выбранным фильтрам</p>
        </div>
      ) : (
        <div className="space-y-5">
          {dates.map(date => {
            const items = byDate.get(date)!;
            const label = new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
            const dayTotal = items.reduce((s, t) => s + (t.isIncome ? t.amount : -t.amount), 0);
            return (
              <div key={date}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium capitalize">{label}</p>
                  <span className={`text-xs font-semibold ${dayTotal >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {dayTotal >= 0 ? '+' : ''}{fmt(dayTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map(tx => {
                    const color = CATEGORY_COLORS[tx.category] ?? (tx.isIncome ? '#22c55e' : '#94a3b8');
                    const name = personName(tx.person, settings);
                    return (
                      <div key={tx.id} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3 group">
                        <span className="text-xl w-8 text-center flex-shrink-0">{CATEGORY_ICONS[tx.category] ?? (tx.isIncome ? '💰' : '📦')}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{tx.description || tx.category}</p>
                          <p className="text-xs text-gray-400">
                            {tx.category}{name ? ` · ${name}` : ''}
                          </p>
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap" style={{ color }}>
                          {tx.isIncome ? '+' : '−'}{fmt(tx.amount)}
                        </span>
                        <button
                          onClick={() => confirm('Удалить запись?') && onDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 transition ml-1 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
                          title="Удалить">
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
