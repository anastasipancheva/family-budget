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

interface AddItemRowProps { weekStart: string; day: number; onAdd: (name: string, cost: number) => Promise<void>; }

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
      setName(''); setCost('');
      nameRef.current?.focus();
    } finally { setLoading(false); }
  }

  return (
    <div className="flex gap-1.5 mt-2">
      <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
        placeholder="Товар…"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="flex-1 min-w-0 bg-card2 border border-brd rounded-xl px-2.5 py-1.5 text-sm text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
      <input type="number" value={cost} onChange={e => setCost(e.target.value)}
        placeholder="₽"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-16 bg-card2 border border-brd rounded-xl px-2 py-1.5 text-sm text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
      <button onClick={submit} disabled={loading || !name.trim()}
        className="px-3 py-1.5 bg-y text-black font-bold rounded-xl text-sm disabled:opacity-40 hover:brightness-110 transition">
        +
      </button>
    </div>
  );
}

export default function GroceryPlan({ items, weekStart, onRefresh }: Props) {
  const [view, setView] = useState<'week' | number>('week');

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
      <div className="bg-card rounded-2xl p-4 border border-brd">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-t1">{DAY_FULL[dow]}</p>
            <p className="text-xs text-t3">{getDayDate(weekStart, dow)}</p>
          </div>
          {dayItems.length > 0 && (
            <div className="text-right">
              <p className="text-sm font-bold text-y">{fmt(actual)}</p>
              {estimated !== actual && <p className="text-xs text-t3 line-through">{fmt(estimated)}</p>}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          {dayItems.map(item => (
            <div key={item.id} className={`flex items-center gap-2 group rounded-xl px-2 py-1 ${item.isBought ? 'opacity-60' : ''}`}>
              <button onClick={() => toggleBought(item)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition
                  ${item.isBought ? 'bg-y border-y' : 'border-t3 hover:border-y'}`}>
                {item.isBought && <span className="text-black text-xs leading-none font-bold">✓</span>}
              </button>
              <span className={`flex-1 text-sm min-w-0 truncate ${item.isBought ? 'line-through text-t3' : 'text-t1'}`}>
                {item.name}
              </span>
              {item.isBought ? (
                <input type="number" defaultValue={item.actualCost ?? (item.estimatedCost || '')}
                  onBlur={e => updateActualCost(item, e.target.value)}
                  placeholder={item.estimatedCost > 0 ? String(item.estimatedCost) : undefined}
                  className="w-16 text-right text-xs bg-card2 border border-brd rounded-lg px-1.5 py-0.5 text-t1 focus:outline-none focus:border-y/60" />
              ) : (
                <span className="text-xs text-t3 w-14 text-right flex-shrink-0">
                  {item.estimatedCost > 0 ? fmt(item.estimatedCost) : ''}
                </span>
              )}
              <button onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition text-t3 hover:text-[#FF453A] w-5 h-5 flex items-center justify-center flex-shrink-0 text-base">
                ×
              </button>
            </div>
          ))}
        </div>

        {allDone && dayItems.length > 0 && (
          <p className="text-xs text-y mt-2">✓ Всё куплено</p>
        )}

        <AddItemRow weekStart={weekStart} day={dow} onAdd={(name, cost) => addItem(dow, name, cost)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week summary */}
      <div className="bg-card rounded-2xl p-4 border border-brd flex items-center justify-between">
        <div>
          <p className="text-sm text-t2">Итого на неделю</p>
          <p className="text-2xl font-bold text-y">{fmt(weekTotal)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-t2">Куплено</p>
          <p className="text-xl font-semibold text-t1">{weekBought} / {items.length}</p>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setView('week')}
          className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-shrink-0
            ${view === 'week' ? 'bg-y text-black' : 'bg-card border border-brd text-t2 hover:text-t1'}`}>
          Вся неделя
        </button>
        {[1,2,3,4,5].map(d => {
          const dayItems = byDay(d);
          const done = dayItems.filter(i => i.isBought).length;
          return (
            <button key={d} onClick={() => setView(d)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-shrink-0
                ${view === d ? 'bg-y text-black' : 'bg-card border border-brd text-t2 hover:text-t1'}`}>
              {DAY_NAMES[d]}
              {dayItems.length > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${done === dayItems.length ? 'bg-green-400/20 text-green-400' : 'bg-card2 text-t3'}`}>
                  {done}/{dayItems.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

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
