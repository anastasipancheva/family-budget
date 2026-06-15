import { useEffect, useState, useCallback } from 'react';
import type { Transaction, Stats, AppSettings, SavingsAccount, CategoryBudget, ShoppingItem } from './types';
import * as api from './api';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import SavingsPage from './components/SavingsPage';
import PlanningPage from './components/PlanningPage';
import SettingsPage from './components/SettingsPage';

type Tab = 'dashboard' | 'transactions' | 'savings' | 'planning' | 'settings';

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function toMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [month, setMonth] = useState(() => toMonthStr(new Date()));
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [txFilter, setTxFilter] = useState<Parameters<typeof api.getTransactions>[0]>({});

  const loadTransactions = useCallback(async (filter = txFilter) => {
    const txs = await api.getTransactions({ month, ...filter });
    setTransactions(txs);
  }, [month, txFilter]);

  const load = useCallback(async () => {
    try {
      setError('');
      const [st, sav, bud, shop, set] = await Promise.all([
        api.getStats(month),
        api.getSavings(),
        api.getBudget(month),
        api.getShoppingItems(weekStart),
        settings ? Promise.resolve(settings) : api.getSettings(),
      ]);
      setStats(st); setSavings(sav); setBudgets(bud); setShoppingItems(shop);
      if (!settings) setSettings(set);
      await loadTransactions();
    } catch {
      setError('Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен.');
    } finally { setLoading(false); }
  }, [month, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLoading(true); load(); }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadShopping(ws: string) {
    const shop = await api.getShoppingItems(ws);
    setShoppingItems(shop);
  }

  async function handleWeekChange(ws: string) {
    setWeekStart(ws);
    await loadShopping(ws);
  }

  function stepMonth(dir: number) {
    const [y, m] = month.split('-').map(Number);
    setMonth(toMonthStr(new Date(y, m - 1 + dir, 1)));
  }

  async function handleAdd(tx: Omit<Transaction, 'id' | 'createdAt'>) {
    await api.addTransaction(tx);
    await load();
  }

  async function handleDelete(id: number) {
    await api.deleteTransaction(id);
    await load();
  }

  async function handleSaveSettings(s: AppSettings) {
    const saved = await api.saveSettings(s);
    setSettings(saved);
  }

  async function handleAddCompensation() {
    await api.addCompensation(new Date().toISOString().slice(0, 10));
    await load();
  }

  async function handleFilter(filter: Parameters<typeof api.getTransactions>[0]) {
    setTxFilter(filter);
    await loadTransactions(filter);
  }

  const [y, m] = month.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;

  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard',    icon: '📊', label: 'Обзор' },
    { key: 'transactions', icon: '📋', label: 'Записи' },
    { key: 'savings',      icon: '🏦', label: 'Счета' },
    { key: 'planning',     icon: '🎯', label: 'Планирование' },
    { key: 'settings',     icon: '⚙️', label: 'Настройки' },
  ];

  const showMonthNav = tab === 'dashboard' || tab === 'transactions' || tab === 'planning';

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 flex-col gap-3">
        <div className="text-4xl animate-pulse">💰</div><p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={load} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition">Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="font-bold text-base text-gray-800 flex-shrink-0">💰 Бюджет</h1>
          {showMonthNav && (
            <div className="flex items-center gap-1">
              <button onClick={() => stepMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500 text-lg">‹</button>
              <span className="text-sm font-semibold w-36 text-center">{monthLabel}</span>
              <button onClick={() => stepMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500 text-lg">›</button>
            </div>
          )}
          {!showMonthNav && <div className="flex-1" />}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {tab === 'dashboard' && stats && settings && (
          <Dashboard stats={stats} settings={settings} month={month} onRefresh={load} />
        )}
        {tab === 'transactions' && settings && (
          <TransactionList transactions={transactions} settings={settings} onDelete={handleDelete} onFilter={handleFilter} />
        )}
        {tab === 'savings' && (
          <SavingsPage accounts={savings} onRefresh={load} />
        )}
        {tab === 'planning' && stats && (
          <PlanningPage
            budgets={budgets} stats={stats} month={month}
            shoppingItems={shoppingItems} weekStart={weekStart}
            onWeekChange={handleWeekChange} onRefresh={load}
          />
        )}
        {tab === 'settings' && settings && (
          <SettingsPage settings={settings} onSave={handleSaveSettings} />
        )}
      </main>

      {tab !== 'settings' && tab !== 'savings' && (
        <button onClick={() => setShowForm(true)}
          className="fixed right-5 bottom-20 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-indigo-700 active:scale-95 transition z-30 leading-none">
          +
        </button>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs font-medium transition
                ${tab === key ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className="text-lg leading-none">{icon}</span>
              <span className="leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showForm && settings && (
        <TransactionForm settings={settings} onAdd={handleAdd} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
