export interface Transaction {
  id: number;
  date: string;
  amount: number;
  isIncome: boolean;
  category: string;
  description: string;
  person: string; // person1 | person2 | shared
  createdAt: string;
}

export interface SavingsAccount {
  id: number;
  name: string;
  bank: string;
  interestRate: number;
  color: string;
  balance: number;
  entries: SavingsEntry[];
}

export interface SavingsEntry {
  id: number;
  savingsAccountId: number;
  date: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'interest';
  description: string;
}

export interface ShoppingItem {
  id: number;
  weekStart: string;
  dayOfWeek: number; // 1=Пн..5=Пт
  name: string;
  estimatedCost: number;
  isBought: boolean;
  actualCost?: number;
  createdAt: string;
}

export interface CategoryBudget {
  id: number;
  month: string;
  category: string;
  amount: number;
}

export interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { category: string; isIncome: boolean; amount: number }[];
}

export interface AppSettings {
  id: number;
  person1Name: string;
  person2Name: string;
  person1Salary: number;
  person2Salary: number;
  compensationPerPerson: number;
  rentAmount: number;
  utilitiesBudget: number;
}

export const INCOME_CATEGORIES = [
  'Зарплата', 'Компенсация', 'Проценты по вкладу', 'Фриланс', 'Подарок', 'Прочий доход',
];

export const EXPENSE_CATEGORIES = [
  'Аренда', 'ЖКХ и счётчики', 'Продукты', 'Транспорт', 'Кафе и рестораны',
  'Развлечения', 'Одежда', 'Здоровье', 'Подписки', 'Накопления', 'Прочее',
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Зарплата': '💼',
  'Компенсация': '🎫',
  'Проценты по вкладу': '📈',
  'Фриланс': '💻',
  'Подарок': '🎁',
  'Прочий доход': '💰',
  'Аренда': '🏠',
  'ЖКХ и счётчики': '💡',
  'Продукты': '🛒',
  'Транспорт': '🚗',
  'Кафе и рестораны': '☕',
  'Развлечения': '🎭',
  'Одежда': '👗',
  'Здоровье': '💊',
  'Подписки': '📱',
  'Накопления': '🏦',
  'Прочее': '📦',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Зарплата': '#22c55e',
  'Компенсация': '#86efac',
  'Проценты по вкладу': '#4ade80',
  'Фриланс': '#16a34a',
  'Подарок': '#bbf7d0',
  'Прочий доход': '#6ee7b7',
  'Аренда': '#ef4444',
  'ЖКХ и счётчики': '#f97316',
  'Продукты': '#eab308',
  'Транспорт': '#3b82f6',
  'Кафе и рестораны': '#f59e0b',
  'Развлечения': '#8b5cf6',
  'Одежда': '#ec4899',
  'Здоровье': '#06b6d4',
  'Подписки': '#6366f1',
  'Накопления': '#14b8a6',
  'Прочее': '#94a3b8',
};
