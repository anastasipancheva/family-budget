import { useState } from 'react';
import type { AppSettings } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../types';

interface NewTx {
  date: string; amount: number; isIncome: boolean; category: string; description: string; person: string;
}
interface Props {
  settings: AppSettings;
  onAdd: (tx: NewTx) => Promise<void>;
  onClose: () => void;
}

export default function TransactionForm({ settings, onAdd, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [isIncome, setIsIncome] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [person, setPerson] = useState('shared');
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
    try {
      await onAdd({ date, amount: +amount, isIncome, category, description, person });
      onClose();
    } finally { setLoading(false); }
  }

  const personOptions = [
    { value: 'person1', label: settings.person1Name },
    { value: 'person2', label: settings.person2Name },
    { value: 'shared', label: 'Общее' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Новая запись</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income / Expense toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button type="button" onClick={() => toggleType(false)}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${!isIncome ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              − Расход
            </button>
            <button type="button" onClick={() => toggleType(true)}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${isIncome ? 'bg-green-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              + Доход
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide font-medium">Сумма, ₽</label>
            <input type="number" min="0.01" step="any" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0" required autoFocus
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide font-medium">Категория</label>
            <div className="grid grid-cols-3 gap-2 mt-1 max-h-52 overflow-y-auto pr-1">
              {categories.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl border text-xs font-medium transition
                    ${category === c ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <span className="text-lg">{CATEGORY_ICONS[c] ?? '•'}</span>
                  <span className="mt-0.5 text-center leading-tight">{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date + Person */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide font-medium">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide font-medium">Кто</label>
              <select value={person} onChange={e => setPerson(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {personOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide font-medium">Описание (опционально)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Например: Пятёрочка, обед…"
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <button type="submit" disabled={loading}
            className={`w-full font-semibold py-3 rounded-xl transition disabled:opacity-50 text-white
              ${isIncome ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
            {loading ? 'Сохраняем...' : `Добавить ${isIncome ? 'доход' : 'расход'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
