import type { Stats, AppSettings } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../types';

export const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const filtered = data.filter(d => d.value > 0);
  if (!filtered.length) return <p className="text-center text-gray-300 py-6 text-sm">Нет данных</p>;
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
    <svg viewBox="0 0 200 200" className="w-40 h-40">
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2" />)}
    </svg>
  );
}

interface Props {
  stats: Stats;
  settings: AppSettings;
  month: string;
  onAddCompensation: () => void;
}

function Card({ label, value, sub, color, negative }: { label: string; value: number; sub?: string; color: string; negative?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${negative && value < 0 ? 'text-red-500' : ''}`} style={negative && value < 0 ? {} : { color }}>
        {negative && value >= 0 ? '+' : ''}{fmt(value)}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ stats, settings, month, onAddCompensation }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const isCurrentMonth = today.startsWith(month);

  const workdaysInMonth = 20;
  const expectedCompensation = settings.compensationPerPerson * 2 * workdaysInMonth;
  const compReceived = stats.byCategory.find(c => c.category === 'Компенсация' && c.isIncome)?.amount ?? 0;

  const expenseSegments = stats.byCategory
    .filter(c => !c.isIncome && c.amount > 0)
    .map(c => ({ label: c.category, value: c.amount, color: CATEGORY_COLORS[c.category] ?? '#94a3b8' }));

  const incomeSegments = stats.byCategory
    .filter(c => c.isIncome && c.amount > 0)
    .map(c => ({ label: c.category, value: c.amount, color: CATEGORY_COLORS[c.category] ?? '#22c55e' }));

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Доходы" value={stats.totalIncome}
          sub={`план: ${fmt(settings.person1Salary + settings.person2Salary + expectedCompensation)}`} color="#22c55e" />
        <Card label="Расходы" value={stats.totalExpense} color="#ef4444" />
        <Card label="Баланс" value={stats.balance} color={stats.balance >= 0 ? '#6366f1' : '#ef4444'} negative />
        <Card label="Компенсации" value={compReceived}
          sub={`план: ${fmt(expectedCompensation)}`} color="#86efac" />
      </div>

      {/* Quick action */}
      {isCurrentMonth && (
        <button onClick={onAddCompensation}
          className="w-full flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-xl py-3 hover:bg-indigo-100 transition">
          🎫 Добавить компенсацию за сегодня (+{fmt(settings.compensationPerPerson * 2)})
        </button>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Expenses */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Расходы по категориям</h3>
          <div className="flex items-start gap-4">
            <DonutChart data={expenseSegments} />
            <div className="flex-1 space-y-1.5 min-w-0">
              {expenseSegments.map(s => (
                <div key={s.label} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-gray-600 truncate">{CATEGORY_ICONS[s.label] ?? '•'} {s.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 flex-shrink-0">{fmt(s.value)}</span>
                </div>
              ))}
              {!expenseSegments.length && <p className="text-xs text-gray-400">Нет расходов</p>}
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Доходы по источникам</h3>
          <div className="flex items-start gap-4">
            <DonutChart data={incomeSegments} />
            <div className="flex-1 space-y-1.5 min-w-0">
              {incomeSegments.map(s => (
                <div key={s.label} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-gray-600 truncate">{CATEGORY_ICONS[s.label] ?? '•'} {s.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 flex-shrink-0">{fmt(s.value)}</span>
                </div>
              ))}
              {!incomeSegments.length && <p className="text-xs text-gray-400">Нет доходов</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Compensation progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-700">🎫 Компенсации (4 нед × 5 дней)</h3>
          <span className="text-sm text-gray-500">{fmt(compReceived)} / {fmt(expectedCompensation)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-lime-400 transition-all"
            style={{ width: `${Math.min(100, expectedCompensation > 0 ? (compReceived / expectedCompensation) * 100 : 0)}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {Math.round(expectedCompensation > 0 ? (compReceived / expectedCompensation) * 100 : 0)}% от плана
        </p>
      </div>
    </div>
  );
}
