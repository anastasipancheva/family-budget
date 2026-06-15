import { useState } from 'react';
import type { AppSettings } from '../types';

interface Props { settings: AppSettings; onSave: (s: AppSettings) => Promise<void>; }

export default function SettingsPage({ settings, onSave }: Props) {
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await onSave(form); setSaved(true); } finally { setLoading(false); }
  }

  const inputCls = 'w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60';

  function numField(label: string, key: keyof AppSettings, suffix = '₽') {
    return (
      <div>
        <label className="text-xs text-t2 uppercase tracking-wide font-medium">{label}</label>
        <div className="flex items-center gap-2 mt-1">
          <input type="number" value={form[key] as number}
            onChange={e => set(key, +e.target.value as AppSettings[typeof key])}
            className={inputCls} />
          <span className="text-t3 text-sm flex-shrink-0">{suffix}</span>
        </div>
      </div>
    );
  }

  function txtField(label: string, key: keyof AppSettings) {
    return (
      <div>
        <label className="text-xs text-t2 uppercase tracking-wide font-medium">{label}</label>
        <input type="text" value={form[key] as string}
          onChange={e => set(key, e.target.value as AppSettings[typeof key])}
          className={`mt-1 ${inputCls}`} />
      </div>
    );
  }

  const monthlyComp = form.compensationPerPerson * 2 * 20;
  const totalIncome = form.person1Salary + form.person2Salary + monthlyComp;
  const totalExpense = form.rentAmount + form.utilitiesBudget;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <div className="bg-card rounded-2xl p-5 border border-brd space-y-4">
        <h3 className="font-semibold text-t1">👤 Первый партнёр</h3>
        {txtField('Имя', 'person1Name')}
        {numField('Зарплата', 'person1Salary')}
      </div>

      <div className="bg-card rounded-2xl p-5 border border-brd space-y-4">
        <h3 className="font-semibold text-t1">👤 Второй партнёр</h3>
        {txtField('Имя', 'person2Name')}
        {numField('Зарплата', 'person2Salary')}
      </div>

      <div className="bg-card rounded-2xl p-5 border border-brd space-y-4">
        <h3 className="font-semibold text-t1">🎫 Компенсация</h3>
        {numField('На человека в рабочий день', 'compensationPerPerson')}
        <p className="text-xs text-t3 bg-card2 rounded-xl p-3">
          На двоих в день: <span className="text-y font-semibold">{(form.compensationPerPerson * 2).toLocaleString('ru-RU')} ₽</span>
          {' '}· В месяц (20 раб. дней): <span className="text-y font-semibold">{monthlyComp.toLocaleString('ru-RU')} ₽</span>
        </p>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-brd space-y-4">
        <h3 className="font-semibold text-t1">🏠 Жильё</h3>
        {numField('Аренда', 'rentAmount')}
        {numField('Плановый бюджет на счётчики', 'utilitiesBudget')}
      </div>

      <div className="bg-card rounded-2xl p-5 border border-y/20 space-y-2">
        <p className="text-sm font-semibold text-y mb-3">📊 Итого план на месяц</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-t2">
            <span>Зарплаты</span>
            <span className="text-t1">{(form.person1Salary + form.person2Salary).toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="flex justify-between text-t2">
            <span>Компенсации</span>
            <span className="text-t1">{monthlyComp.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="flex justify-between font-bold border-t border-brd pt-2 mt-1 text-y">
            <span>Всего доходов</span>
            <span>{totalIncome.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="flex justify-between text-[#FF453A]">
            <span>Аренда + счётчики</span>
            <span>−{totalExpense.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="flex justify-between font-bold border-t border-brd pt-2 mt-1">
            <span className="text-t1">Остаток</span>
            <span className={totalIncome - totalExpense >= 0 ? 'text-y' : 'text-[#FF453A]'}>
              {(totalIncome - totalExpense).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className={`w-full font-bold py-3.5 rounded-2xl transition disabled:opacity-50 text-base
          ${saved ? 'bg-green-500 text-white' : 'bg-y text-black hover:brightness-110'}`}>
        {loading ? 'Сохраняем...' : saved ? '✓ Сохранено' : 'Сохранить настройки'}
      </button>
    </form>
  );
}
