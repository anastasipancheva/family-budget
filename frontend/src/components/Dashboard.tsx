import { useState } from 'react';
import type { Stats, AppSettings } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../types';
import * as api from '../api';

export const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const filtered = data.filter(d => d.value > 0);
  if (!filtered.length) return <p className="text-center text-t3 py-6 text-sm">Нет данных</p>;
  const total = filtered.reduce((s, d) => s + d.value, 0);
  const cx = 100, cy = 100, r = 85, ir = 58;
  let angle = -Math.PI / 2;
  const paths = filtered.map(seg => {
    const sweep = (seg.value / total) * Math.PI * 2;
    const s = angle, e = angle + sweep;
    angle += sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const d = [
      `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)}`,
      `A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`,
      `L ${cx + ir * Math.cos(e)} ${cy + ir * Math.sin(e)}`,
      `A ${ir} ${ir} 0 ${large} 0 ${cx + ir * Math.cos(s)} ${cy + ir * Math.sin(s)}`,
      'Z',
    ].join(' ');
    return { d, ...seg };
  });
  return (
    <svg viewBox="0 0 200 200" className="w-36 h-36 flex-shrink-0">
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
    </svg>
  );
}

interface Props { stats: Stats; settings: AppSettings; month: string; onRefresh: () => void; }

function StatCard({ label, value, sub, valueColor }: { label: string; value: number; sub?: string; valueColor?: string }) {
  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-t2 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold" style={valueColor ? { color: valueColor } : { color: '#fff' }}>{fmt(value)}</p>
      {sub && <p className="text-xs text-t3 mt-0.5">{sub}</p>}
    </div>
  );
}

function CompWidget({ settings, onRefresh }: { settings: AppSettings; onRefresh: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [persons, setPersons] = useState(2);
  const [spent, setSpent] = useState('');
  const [date, setDate] = useState(today);
  const [result, setResult] = useState<{ compAmount: number; overAmount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const limit = settings.compensationPerPerson * persons;
  const spentNum = +spent || 0;
  const preview = { comp: Math.min(spentNum, limit), over: Math.max(0, spentNum - limit) };

  async function handleAdd() {
    if (!spent || spentNum <= 0) return;
    setLoading(true);
    try {
      const res = await api.smartCompensation({ date, spent: spentNum, persons });
      setResult(res); setSpent(''); onRefresh();
      setTimeout(() => setResult(null), 4000);
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-t1 text-sm">🎫 Компенсация за обед</p>
        <div className="flex rounded-xl overflow-hidden border border-brd text-xs">
          {[1, 2].map(n => (
            <button key={n} onClick={() => setPersons(n)}
              className={`px-3 py-1.5 font-semibold transition ${persons === n ? 'bg-y text-black' : 'text-t2 hover:text-t1'}`}>
              {n === 1 ? '1 чел.' : '2 чел.'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <input type="number" min="0" step="any" value={spent} onChange={e => setSpent(e.target.value)}
          placeholder={`Сумма, ₽ (лимит ${fmt(limit)})`}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-card2 border border-brd rounded-xl px-3 py-2.5 text-sm text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-card2 border border-brd rounded-xl px-3 py-2.5 text-sm text-t1 focus:outline-none focus:border-y/60" />
        <button onClick={handleAdd} disabled={loading || !spent || spentNum <= 0}
          className="bg-y text-black font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-40 hover:brightness-110 transition">
          {loading ? '...' : 'OK'}
        </button>
      </div>
      {spentNum > 0 && !result && (
        <div className="flex gap-2 text-xs flex-wrap">
          <span className="text-green-400 bg-green-400/10 rounded-lg px-2 py-1">+{fmt(preview.comp)} компенсация</span>
          {preview.over > 0 && <span className="text-orange-400 bg-orange-400/10 rounded-lg px-2 py-1">−{fmt(preview.over)} в Продукты</span>}
        </div>
      )}
      {result && (
        <div className="flex gap-2 text-xs flex-wrap">
          <span className="text-green-400 bg-green-400/10 rounded-lg px-2 py-1">✓ +{fmt(result.compAmount)} добавлено</span>
          {result.overAmount > 0 && <span className="text-orange-400 bg-orange-400/10 rounded-lg px-2 py-1">✓ −{fmt(result.overAmount)} в Продукты</span>}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ stats, settings, month, onRefresh }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const isCurrentMonth = today.startsWith(month);
  const workdays = 20;
  const expectedComp = settings.compensationPerPerson * 2 * workdays;
  const compReceived = stats.byCategory.find(c => c.category === 'Компенсация' && c.isIncome)?.amount ?? 0;

  const expenseSegs = stats.byCategory.filter(c => !c.isIncome && c.amount > 0)
    .map(c => ({ label: c.category, value: c.amount, color: CATEGORY_COLORS[c.category] ?? '#555' }));
  const incomeSegs = stats.byCategory.filter(c => c.isIncome && c.amount > 0)
    .map(c => ({ label: c.category, value: c.amount, color: CATEGORY_COLORS[c.category] ?? '#22c55e' }));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Доходы" value={stats.totalIncome}
          sub={`план ${fmt(settings.person1Salary + settings.person2Salary + expectedComp)}`} valueColor="#FFDD2D" />
        <StatCard label="Расходы" value={stats.totalExpense} valueColor="#FF453A" />
        <StatCard label="Баланс" value={stats.balance}
          sub={stats.balance >= 0 ? 'в плюсе' : 'в минусе'}
          valueColor={stats.balance >= 0 ? '#FFDD2D' : '#FF453A'} />
        <StatCard label="Компенсации" value={compReceived}
          sub={`план ${fmt(expectedComp)}`} valueColor="#86efac" />
      </div>

      {/* Compensation widget */}
      {isCurrentMonth && <CompWidget settings={settings} onRefresh={onRefresh} />}

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-4">
          <p className="font-semibold text-t1 text-sm mb-3">Расходы</p>
          <div className="flex items-start gap-3">
            <DonutChart data={expenseSegs} />
            <div className="flex-1 space-y-1.5 min-w-0">
              {expenseSegs.map(s => (
                <div key={s.label} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-t2 truncate">{CATEGORY_ICONS[s.label] ?? '•'} {s.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-t1 flex-shrink-0">{fmt(s.value)}</span>
                </div>
              ))}
              {!expenseSegs.length && <p className="text-xs text-t3">Нет расходов</p>}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4">
          <p className="font-semibold text-t1 text-sm mb-3">Доходы</p>
          <div className="flex items-start gap-3">
            <DonutChart data={incomeSegs} />
            <div className="flex-1 space-y-1.5 min-w-0">
              {incomeSegs.map(s => (
                <div key={s.label} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-t2 truncate">{CATEGORY_ICONS[s.label] ?? '•'} {s.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-t1 flex-shrink-0">{fmt(s.value)}</span>
                </div>
              ))}
              {!incomeSegs.length && <p className="text-xs text-t3">Нет доходов</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Compensation progress */}
      <div className="bg-card rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-t1">Компенсации (4 нед × 5 дней)</p>
          <span className="text-xs text-t2">{fmt(compReceived)} / {fmt(expectedComp)}</span>
        </div>
        <div className="h-2 bg-card2 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-y transition-all"
            style={{ width: `${Math.min(100, expectedComp > 0 ? (compReceived / expectedComp) * 100 : 0)}%` }} />
        </div>
        <p className="text-xs text-t3 mt-1">{Math.round(expectedComp > 0 ? (compReceived / expectedComp) * 100 : 0)}% от плана</p>
      </div>
    </div>
  );
}
