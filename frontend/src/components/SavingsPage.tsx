import { useState } from 'react';
import type { SavingsAccount, SavingsEntry } from '../types';
import * as api from '../api';
import { fmt } from './Dashboard';

const ENTRY_LABELS = { deposit: 'Пополнение', withdrawal: 'Снятие', interest: 'Проценты' };
const ENTRY_ICONS = { deposit: '➕', withdrawal: '➖', interest: '📈' };
const COLORS = ['#FFDD2D', '#22c55e', '#f97316', '#ec4899', '#06b6d4', '#8b5cf6', '#6366f1'];

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-brd rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-t1">{initial?.id ? 'Редактировать счёт' : 'Новый счёт'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-card2 text-t2 hover:text-t1 transition text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Название (напр. Т-Сейф)"
            className="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
          <input value={bank} onChange={e => setBank(e.target.value)} placeholder="Банк"
            className="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
          <div className="flex gap-2 items-center">
            <input type="number" min="0" step="0.1" value={rate} onChange={e => setRate(e.target.value)} placeholder="Ставка %"
              className="flex-1 bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
            <span className="text-t2 text-sm">% год.</span>
          </div>
          <div>
            <p className="text-xs text-t2 mb-2">Цвет</p>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-offset-card ring-white' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-y text-black font-bold py-2.5 rounded-2xl hover:brightness-110 transition disabled:opacity-50">
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-brd rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-t1">Добавить движение</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-card2 text-t2 hover:text-t1 transition text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {(['deposit', 'withdrawal', 'interest'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-2 rounded-xl text-sm font-medium transition
                  ${type === t ? 'bg-y text-black' : 'bg-card2 text-t2 hover:text-t1'}`}>
                {ENTRY_ICONS[t]} {ENTRY_LABELS[t]}
              </button>
            ))}
          </div>
          <input type="number" required min="0.01" step="any" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Сумма, ₽" autoFocus
            className="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-xl font-bold text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required
            className="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 focus:outline-none focus:border-y/60" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Описание (опционально)"
            className="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
          {type === 'interest' && (
            <p className="text-xs text-y/80 bg-y/10 rounded-xl p-2.5">Проценты автоматически появятся в доходах основного бюджета.</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-y text-black font-bold py-2.5 rounded-2xl hover:brightness-110 transition disabled:opacity-50">
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
    await api.addSavingsAccount(data); onRefresh();
  }
  async function handleEditAccount(data: Omit<SavingsAccount, 'id' | 'balance' | 'entries'>) {
    if (!editAccount) return;
    await api.updateSavingsAccount(editAccount.id, data); onRefresh();
  }
  async function handleDelete(id: number) {
    if (!confirm('Удалить счёт со всей историей?')) return;
    await api.deleteSavingsAccount(id); onRefresh();
  }
  async function handleDeleteEntry(entryId: number) {
    if (!confirm('Удалить запись?')) return;
    await api.deleteSavingsEntry(entryId); onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="bg-card rounded-2xl p-5 border border-brd">
        <p className="text-sm text-t2">Всего на накопительных счетах</p>
        <p className="text-3xl font-bold mt-1 text-y">{fmt(totalSavings)}</p>
        <p className="text-sm text-t3 mt-1">
          {accounts.length} {accounts.length === 1 ? 'счёт' : accounts.length < 5 ? 'счёта' : 'счетов'}
        </p>
      </div>

      {/* Accounts */}
      {accounts.map(acc => (
        <div key={acc.id} className="bg-card rounded-2xl border border-brd overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: acc.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-t1">{acc.name}</p>
                <p className="text-xs text-t3">{acc.bank}{acc.interestRate > 0 ? ` · ${acc.interestRate}% год.` : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-t1">{fmt(acc.balance)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEntryFor(acc.id)}
                className="flex-1 bg-y text-black text-sm font-bold py-2 rounded-xl hover:brightness-110 transition">
                + Движение
              </button>
              <button onClick={() => setExpanded(expanded === acc.id ? null : acc.id)}
                className="flex-1 bg-card2 text-t2 text-sm font-semibold py-2 rounded-xl hover:text-t1 transition">
                {expanded === acc.id ? 'Свернуть' : `История (${acc.entries.length})`}
              </button>
              <button onClick={() => setEditAccount(acc)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-card2 hover:bg-brd transition text-t2">
                ✏️
              </button>
              <button onClick={() => handleDelete(acc.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-card2 hover:bg-[#FF453A]/20 text-t3 hover:text-[#FF453A] transition">
                🗑️
              </button>
            </div>
          </div>

          {expanded === acc.id && (
            <div className="border-t border-brd">
              {acc.entries.length === 0 ? (
                <p className="text-center text-t3 text-sm py-6">История пуста</p>
              ) : (
                acc.entries.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-brd last:border-0 group">
                    <span className="text-lg">{ENTRY_ICONS[e.type as keyof typeof ENTRY_ICONS]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1">{e.description || ENTRY_LABELS[e.type as keyof typeof ENTRY_LABELS]}</p>
                      <p className="text-xs text-t3">{new Date(e.date + 'T12:00:00').toLocaleDateString('ru-RU')}</p>
                    </div>
                    <span className={`text-sm font-semibold ${e.amount >= 0 ? 'text-green-400' : 'text-[#FF453A]'}`}>
                      {e.amount >= 0 ? '+' : ''}{fmt(e.amount)}
                    </span>
                    <button onClick={() => handleDeleteEntry(e.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-t3 hover:text-[#FF453A] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#FF453A]/10">
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}

      <button onClick={() => setShowAdd(true)}
        className="w-full border-2 border-dashed border-brd rounded-2xl py-4 text-t3 hover:border-y/50 hover:text-y transition font-medium text-sm">
        + Добавить накопительный счёт
      </button>

      {showAdd && <AccountForm onSave={handleAddAccount} onClose={() => setShowAdd(false)} />}
      {editAccount && <AccountForm initial={editAccount} onSave={handleEditAccount} onClose={() => setEditAccount(null)} />}
      {entryFor && <EntryForm accountId={entryFor} onSave={onRefresh} onClose={() => setEntryFor(null)} />}
    </div>
  );
}
