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

  const hasFilters = !!(filterCategory || filterPerson || search);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t3 text-sm">🔍</span>
        <input type="search" value={search} onChange={e => doSearch(e.target.value)}
          placeholder="Поиск по описанию или категории…"
          className="w-full bg-card border border-brd rounded-2xl pl-9 pr-4 py-2.5 text-sm text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
      </div>

      {/* Type tabs */}
      <div className="flex rounded-2xl overflow-hidden bg-card2 p-1 gap-1">
        {(['all', 'income', 'expense'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition
              ${filterType === t
                ? t === 'income' ? 'bg-green-500 text-white'
                : t === 'expense' ? 'bg-[#FF453A] text-white'
                : 'bg-y text-black'
                : 'text-t2 hover:text-t1'}`}>
            {t === 'all' ? 'Все' : t === 'income' ? '+ Доходы' : '− Расходы'}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select value={filterCategory} onChange={e => setCat(e.target.value)}
          className="bg-card border border-brd rounded-xl px-3 py-2 text-sm text-t1 focus:outline-none flex-shrink-0">
          <option value="">Все категории</option>
          {allCategories.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>
        <select value={filterPerson} onChange={e => setPerson(e.target.value)}
          className="bg-card border border-brd rounded-xl px-3 py-2 text-sm text-t1 focus:outline-none flex-shrink-0">
          {personOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterCategory(''); setFilterPerson(''); setSearch(''); apply({ category: '', person: '', search: '' }); }}
            className="bg-card border border-brd rounded-xl px-3 py-2 text-sm text-t2 hover:text-t1 flex-shrink-0 whitespace-nowrap transition">
            Сбросить ×
          </button>
        )}
      </div>

      {transactions.length > 0 && (
        <p className="text-xs text-t3">Найдено: {transactions.length} записей</p>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-16 text-t3">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Нет записей по выбранным фильтрам</p>
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
                  <p className="text-xs text-t3 uppercase tracking-wide font-medium capitalize">{label}</p>
                  <span className={`text-xs font-semibold ${dayTotal >= 0 ? 'text-green-400' : 'text-[#FF453A]'}`}>
                    {dayTotal >= 0 ? '+' : ''}{fmt(dayTotal)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map(tx => {
                    const color = CATEGORY_COLORS[tx.category] ?? (tx.isIncome ? '#22c55e' : '#94a3b8');
                    const name = personName(tx.person, settings);
                    return (
                      <div key={tx.id} className="bg-card rounded-2xl px-4 py-3 flex items-center gap-3 group border border-brd hover:border-brd/80 transition">
                        <span className="text-xl w-8 text-center flex-shrink-0">{CATEGORY_ICONS[tx.category] ?? (tx.isIncome ? '💰' : '📦')}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-t1 truncate">{tx.description || tx.category}</p>
                          <p className="text-xs text-t3">
                            {tx.category}{name ? ` · ${name}` : ''}
                          </p>
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap" style={{ color }}>
                          {tx.isIncome ? '+' : '−'}{fmt(tx.amount)}
                        </span>
                        <button
                          onClick={() => confirm('Удалить запись?') && onDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 transition ml-1 w-7 h-7 flex items-center justify-center rounded-xl text-t3 hover:text-[#FF453A] hover:bg-[#FF453A]/10"
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
