import { useState } from 'react';
import type { AppSettings, Transaction } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../types';

interface NewTx { date: string; amount: number; isIncome: boolean; category: string; description: string; person: string; }
interface Props {
  settings: AppSettings;
  onAdd: (tx: NewTx) => Promise<void>;
  onClose: () => void;
  initial?: Transaction;
}

export default function TransactionForm({ settings, onAdd, onClose, initial }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [isIncome, setIsIncome] = useState(initial?.isIncome ?? false);
  const [category, setCategory] = useState(initial?.category ?? EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [date, setDate] = useState(initial?.date ?? today);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [person, setPerson] = useState(initial?.person ?? 'shared');
  const [loading, setLoading] = useState(false);

  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function toggleType(income: boolean) {
    setIsIncome(income);
    setCategory(income ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || +amount <= 0) return;
    setLoading(true);
    try { await onAdd({ date, amount: +amount, isIncome, category, description, person }); onClose(); }
    finally { setLoading(false); }
  }

  const personOptions = [
    { value: 'person1', label: settings.person1Name },
    { value: 'person2', label: settings.person2Name },
    { value: 'shared', label: 'Общее' },
  ];

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-brd rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-t1">{isEdit ? 'Редактировать запись' : 'Новая запись'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-card2 text-t2 hover:text-t1 transition text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle */}
          <div className="flex rounded-2xl overflow-hidden bg-card2 p-1 gap-1">
            <button type="button" onClick={() => toggleType(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition ${!isIncome ? 'bg-[#FF453A] text-white' : 'text-t2 hover:text-t1'}`}>
              − Расход
            </button>
            <button type="button" onClick={() => toggleType(true)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition ${isIncome ? 'bg-green-500 text-white' : 'text-t2 hover:text-t1'}`}>
              + Доход
            </button>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs text-t2 uppercase tracking-wide font-medium mb-1">Сумма</p>
            <div className="relative">
              <input type="number" min="0.01" step="any" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0" required autoFocus={!isEdit}
                className="w-full bg-card2 border border-brd rounded-2xl px-4 py-3 text-3xl font-bold text-t1 placeholder-t3 focus:outline-none focus:border-y/60 pr-10" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-t3 text-lg">₽</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-xs text-t2 uppercase tracking-wide font-medium mb-2">Категория</p>
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-2xl text-xs font-medium transition
                    ${category === c ? 'bg-y text-black' : 'bg-card2 text-t2 hover:text-t1'}`}>
                  <span className="text-lg mb-0.5">{CATEGORY_ICONS[c] ?? '•'}</span>
                  <span className="text-center leading-tight">{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date + Person */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-t2 uppercase tracking-wide font-medium mb-1">Дата</p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full bg-card2 border border-brd rounded-2xl px-3 py-2.5 text-t1 text-sm focus:outline-none focus:border-y/60" />
            </div>
            <div>
              <p className="text-xs text-t2 uppercase tracking-wide font-medium mb-1">Кто</p>
              <select value={person} onChange={e => setPerson(e.target.value)}
                className="w-full bg-card2 border border-brd rounded-2xl px-3 py-2.5 text-t1 text-sm focus:outline-none focus:border-y/60">
                {personOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-t2 uppercase tracking-wide font-medium mb-1">Описание (опционально)</p>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Пятёрочка, обед…"
              className="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 text-sm placeholder-t3 focus:outline-none focus:border-y/60" />
          </div>

          <button type="submit" disabled={loading}
            className={`w-full font-bold py-3.5 rounded-2xl transition disabled:opacity-50 text-base
              ${isIncome ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-y text-black hover:brightness-110'}`}>
            {loading ? 'Сохраняем...' : isEdit ? 'Сохранить изменения' : `Добавить ${isIncome ? 'доход' : 'расход'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
