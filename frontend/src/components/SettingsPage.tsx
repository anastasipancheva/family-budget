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

  function numField(label: string, key: keyof AppSettings, suffix = '₽') {
    return (
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</label>
        <div className="flex items-center gap-2 mt-1">
          <input type="number" value={form[key] as number} onChange={e => set(key, +e.target.value as AppSettings[typeof key])}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <span className="text-gray-400 text-sm">{suffix}</span>
        </div>
      </div>
    );
  }

  function txtField(label: string, key: keyof AppSettings) {
    return (
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</label>
        <input type="text" value={form[key] as string} onChange={e => set(key, e.target.value as AppSettings[typeof key])}
          className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>
    );
  }

  const monthlyComp = form.compensationPerPerson * 2 * 20;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-700">👤 Первый партнёр</h3>
        {txtField('Имя', 'person1Name')}
        {numField('Зарплата', 'person1Salary')}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-700">👤 Второй партнёр</h3>
        {txtField('Имя', 'person2Name')}
        {numField('Зарплата', 'person2Salary')}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-700">🎫 Компенсация</h3>
        {numField('На человека в рабочий день', 'compensationPerPerson')}
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
          На двоих в день: <strong>{(form.compensationPerPerson * 2).toLocaleString('ru-RU')} ₽</strong>
          {' '}· В месяц (20 раб. дней): <strong>{monthlyComp.toLocaleString('ru-RU')} ₽</strong>
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-700">🏠 Жильё</h3>
        {numField('Аренда', 'rentAmount')}
        {numField('Плановый бюджет на счётчики', 'utilitiesBudget')}
      </div>

      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
        <p className="text-sm font-semibold text-indigo-800 mb-1">📊 Итого план на месяц</p>
        <div className="space-y-1 text-sm text-indigo-700">
          <div className="flex justify-between"><span>Зарплаты</span><span>{(form.person1Salary + form.person2Salary).toLocaleString('ru-RU')} ₽</span></div>
          <div className="flex justify-between"><span>Компенсации</span><span>{monthlyComp.toLocaleString('ru-RU')} ₽</span></div>
          <div className="flex justify-between font-bold border-t border-indigo-200 pt-1 mt-1">
            <span>Всего доходов</span>
            <span>{(form.person1Salary + form.person2Salary + monthlyComp).toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="flex justify-between text-red-600"><span>Аренда + счётчики</span><span>−{(form.rentAmount + form.utilitiesBudget).toLocaleString('ru-RU')} ₽</span></div>
          <div className="flex justify-between font-bold text-indigo-900 border-t border-indigo-200 pt-1 mt-1">
            <span>Остаток</span>
            <span>{(form.person1Salary + form.person2Salary + monthlyComp - form.rentAmount - form.utilitiesBudget).toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
        {loading ? 'Сохраняем...' : saved ? '✓ Сохранено' : 'Сохранить настройки'}
      </button>
    </form>
  );
}
