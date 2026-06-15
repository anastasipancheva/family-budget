import { useState } from 'react';
import type { SavingsAccount, SavingsEntry } from '../types';
import * as api from '../api';
import { fmt } from './Dashboard';

const ENTRY_LABELS = { deposit: 'Пополнение', withdrawal: 'Снятие', interest: 'Проценты' };
const ENTRY_ICONS = { deposit: '➕', withdrawal: '➖', interest: '📈' };
const COLORS = ['#6366f1', '#22c55e', '#f97316', '#ec4899', '#06b6d4', '#8b5cf6', '#eab308'];

interface Props { accounts: SavingsAccount[]; onRefresh: () => void; }

function AccountForm({ onSave, onClose, initial }: {
  onSave: (a: Omit<SavingsAccount, 'id' | 'balance' | 'entries'>) => Promise<void>;
  onClose: () => void;
  initial?: Partial<SavingsAccount>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [bank, setBank] = useState(initial?.bank ?? '');
  const [rate, setRate] = useState(String(initial?.interestRate ?? ''));
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await onSave({ name, bank, interestRate: +rate || 0, color }); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">{initial?.id ? 'Редактировать счёт' : 'Новый накопительный счёт'}</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Название (напр. Тинькофф Про)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input value={bank} onChange={e => setBank(e.target.value)} placeholder="Банк"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div className="flex gap-2">
            <input type="number" min="0" step="0.1" value={rate} onChange={e => setRate(e.target.value)} placeholder="Ставка %"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <span className="self-center text-gray-500">% год.</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Цвет</p>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
            {loading ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}

function EntryForm({ accountId, onSave, onClose }: { accountId: number; onSave: () => void; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<'deposit' | 'withdrawal' | 'interest'>('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || +amount <= 0) return;
    setLoading(true);
    try {
      await api.addSavingsEntry(accountId, {
        date, amount: type === 'withdrawal' ? -Math.abs(+amount) : +amount,
        type, description: desc,
      });
      onSave(); onClose();
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Добавить движение</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(['deposit', 'withdrawal', 'interest'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-2 rounded-xl border text-sm font-medium transition
                  ${type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}>
                {ENTRY_ICONS[t]} {ENTRY_LABELS[t]}
              </button>
            ))}
          </div>
          <input type="number" required min="0.01" step="any" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Сумма, ₽" autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Описание (опционально)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          {type === 'interest' && <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">Проценты автоматически появятся в доходах основного бюджета.</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
            {loading ? 'Сохраняем...' : 'Добавить'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SavingsPage({ accounts, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<SavingsAccount | null>(null);
  const [entryFor, setEntryFor] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const totalSavings = accounts.reduce((s, a) => s + a.balance, 0);

  async function handleAddAccount(data: Omit<SavingsAccount, 'id' | 'balance' | 'entries'>) {
    await api.addSavingsAccount(data);
    onRefresh();
  }

  async function handleEditAccount(data: Omit<SavingsAccount, 'id' | 'balance' | 'entries'>) {
    if (!editAccount) return;
    await api.updateSavingsAccount(editAccount.id, data);
    onRefresh();
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить счёт со всей историей?')) return;
    await api.deleteSavingsAccount(id);
    onRefresh();
  }

  async function handleDeleteEntry(entryId: number) {
    if (!confirm('Удалить запись?')) return;
    await api.deleteSavingsEntry(entryId);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="bg-indigo-600 text-white rounded-2xl p-5">
        <p className="text-sm opacity-75">Всего на накопительных счетах</p>
        <p className="text-3xl font-bold mt-1">{fmt(totalSavings)}</p>
        <p className="text-sm opacity-75 mt-1">{accounts.length} {accounts.length === 1 ? 'счёт' : accounts.length < 5 ? 'счёта' : 'счетов'}</p>
      </div>

      {/* Accounts */}
      {accounts.map(acc => (
        <div key={acc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: acc.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{acc.name}</p>
                <p className="text-xs text-gray-400">{acc.bank}{acc.interestRate > 0 ? ` · ${acc.interestRate}% год.` : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{fmt(acc.balance)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEntryFor(acc.id)}
                className="flex-1 bg-indigo-50 text-indigo-700 text-sm font-semibold py-2 rounded-xl hover:bg-indigo-100 transition">
                + Добавить
              </button>
              <button onClick={() => setExpanded(expanded === acc.id ? null : acc.id)}
                className="flex-1 bg-gray-50 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-100 transition">
                {expanded === acc.id ? 'Свернуть' : `История (${acc.entries.length})`}
              </button>
              <button onClick={() => setEditAccount(acc)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition text-gray-500">
                ✏️
              </button>
              <button onClick={() => handleDelete(acc.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                🗑️
              </button>
            </div>
          </div>

          {/* History */}
          {expanded === acc.id && (
            <div className="border-t border-gray-100">
              {acc.entries.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">История пуста</p>
              ) : (
                acc.entries.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 group">
                    <span className="text-lg">{ENTRY_ICONS[e.type as keyof typeof ENTRY_ICONS]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.description || ENTRY_LABELS[e.type as keyof typeof ENTRY_LABELS]}</p>
                      <p className="text-xs text-gray-400">{new Date(e.date + 'T12:00:00').toLocaleDateString('ru-RU')}</p>
                    </div>
                    <span className={`text-sm font-semibold ${e.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {e.amount >= 0 ? '+' : ''}{fmt(e.amount)}
                    </span>
                    <button onClick={() => handleDeleteEntry(e.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-red-500 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50">
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add account button */}
      <button onClick={() => setShowAdd(true)}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition font-medium">
        + Добавить накопительный счёт
      </button>

      {showAdd && <AccountForm onSave={handleAddAccount} onClose={() => setShowAdd(false)} />}
      {editAccount && <AccountForm initial={editAccount} onSave={handleEditAccount} onClose={() => setEditAccount(null)} />}
      {entryFor && <EntryForm accountId={entryFor} onSave={onRefresh} onClose={() => setEntryFor(null)} />}
    </div>
  );
}
