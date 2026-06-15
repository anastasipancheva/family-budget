import { useState, useRef } from 'react';
import type { ShoppingItem } from '../types';
import { fmt } from './Dashboard';
import * as api from '../api';

interface Props { items: ShoppingItem[]; weekStart: string; onRefresh: () => void; }

const DAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const DAY_FULL  = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

function getDayDate(weekStart: string, dow: number): string {
  const d = new Date(weekStart + 'T12:00:00');
  d.setDate(d.getDate() + dow - 1);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

interface AddItemRowProps {
  weekStart: string; day: number;
  onAdd: (name: string, cost: number) => Promise<void>;
}

function AddItemRow({ onAdd }: AddItemRowProps) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const n = name.trim();
    if (!n) return;
    setLoading(true);
    try {
      await onAdd(n, +cost || 0);
      setName('');
      setCost('');
      nameRef.current?.focus();
    } finally { setLoading(false); }
  }

  return (
    <div className="flex gap-1.5 mt-2">
      <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
        placeholder="Товар…"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      <input type="number" value={cost} onChange={e => setCost(e.target.value)}
        placeholder="₽"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      <button onClick={submit} disabled={loading || !name.trim()}
        className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-indigo-700 transition">
        +
      </button>
    </div>
  );
}

export default function GroceryPlan({ items, weekStart, onRefresh }: Props) {
  const [view, setView] = useState<'week' | number>('week'); // 'week' or day number 1-5

  const byDay = (dow: number) => items.filter(i => i.dayOfWeek === dow);
  const dayTotal = (dow: number) => byDay(dow).reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0);
  const weekTotal = [1,2,3,4,5].reduce((s, d) => s + dayTotal(d), 0);
  const weekBought = items.filter(i => i.isBought).length;

  async function addItem(day: number, name: string, cost: number) {
    await api.addShoppingItem({ weekStart, dayOfWeek: day, name, estimatedCost: cost, isBought: false });
    onRefresh();
  }

  async function toggleBought(item: ShoppingItem) {
    await api.updateShoppingItem(item.id, { isBought: !item.isBought, actualCost: item.actualCost });
    onRefresh();
  }

  async function updateActualCost(item: ShoppingItem, cost: string) {
    await api.updateShoppingItem(item.id, { isBought: item.isBought, actualCost: cost ? +cost : undefined });
    onRefresh();
  }

  async function deleteItem(id: number) {
    await api.deleteShoppingItem(id);
    onRefresh();
  }

  function DayColumn({ dow }: { dow: number }) {
    const dayItems = byDay(dow);
    const estimated = dayItems.reduce((s, i) => s + i.estimatedCost, 0);
    const actual = dayItems.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0);
    const allDone = dayItems.length > 0 && dayItems.every(i => i.isBought);

    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-800">{DAY_FULL[dow]}</p>
            <p className="text-xs text-gray-400">{getDayDate(weekStart, dow)}</p>
          </div>
          {dayItems.length > 0 && (
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">{fmt(actual)}</p>
              {estimated !== actual && <p className="text-xs text-gray-400 line-through">{fmt(estimated)}</p>}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {dayItems.map(item => (
            <div key={item.id} className={`flex items-center gap-2 group rounded-lg px-1 py-0.5 ${item.isBought ? 'opacity-60' : ''}`}>
              <button onClick={() => toggleBought(item)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition
                  ${item.isBought ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}>
                {item.isBought && <span className="text-xs leading-none">✓</span>}
              </button>
              <span className={`flex-1 text-sm min-w-0 truncate ${item.isBought ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {item.name}
              </span>
              {item.isBought ? (
                <input type="number" defaultValue={item.actualCost ?? (item.estimatedCost || '')}
                  onBlur={e => updateActualCost(item, e.target.value)}
                  placeholder={item.estimatedCost > 0 ? String(item.estimatedCost) : undefined}
                  className="w-16 text-right text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-300" />
              ) : (
                <span className="text-xs text-gray-400 w-14 text-right flex-shrink-0">
                  {item.estimatedCost > 0 ? fmt(item.estimatedCost) : ''}
                </span>
              )}
              <button onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-red-400 w-5 h-5 flex items-center justify-center flex-shrink-0">
                ×
              </button>
            </div>
          ))}
        </div>

        {allDone && dayItems.length > 0 && (
          <p className="text-xs text-green-500 mt-2">✓ Всё куплено</p>
        )}

        <AddItemRow weekStart={weekStart} day={dow} onAdd={(name, cost) => addItem(dow, name, cost)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week summary */}
      <div className="bg-indigo-600 text-white rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm opacity-75">Итого на неделю</p>
          <p className="text-2xl font-bold">{fmt(weekTotal)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-75">Куплено</p>
          <p className="text-xl font-semibold">{weekBought} / {items.length}</p>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button onClick={() => setView('week')}
          className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition flex-shrink-0
            ${view === 'week' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
          Вся неделя
        </button>
        {[1,2,3,4,5].map(d => {
          const dayItems = byDay(d);
          const done = dayItems.filter(i => i.isBought).length;
          return (
            <button key={d} onClick={() => setView(d)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition flex-shrink-0
                ${view === d ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
              {DAY_NAMES[d]}
              {dayItems.length > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${done === dayItems.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {done}/{dayItems.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {view === 'week' ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(d => <DayColumn key={d} dow={d} />)}
        </div>
      ) : (
        <DayColumn dow={view as number} />
      )}
    </div>
  );
}
