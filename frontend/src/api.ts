import type { Transaction, Stats, AppSettings, SavingsAccount, SavingsEntry, CategoryBudget } from './types';

const B = '/api';
const json = (r: Response) => r.json();

export const getTransactions = (params: {
  month?: string; isIncome?: boolean; category?: string; person?: string; search?: string;
}): Promise<Transaction[]> => {
  const q = new URLSearchParams();
  if (params.month) q.set('month', params.month);
  if (params.isIncome !== undefined) q.set('isIncome', String(params.isIncome));
  if (params.category) q.set('category', params.category);
  if (params.person) q.set('person', params.person);
  if (params.search) q.set('search', params.search);
  return fetch(`${B}/transactions?${q}`).then(json);
};

export const addTransaction = (t: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> =>
  fetch(`${B}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) }).then(json);

export const deleteTransaction = (id: number): Promise<void> =>
  fetch(`${B}/transactions/${id}`, { method: 'DELETE' }).then(() => {});

export const getStats = (month: string): Promise<Stats> =>
  fetch(`${B}/stats?month=${month}`).then(json);

export const getSettings = (): Promise<AppSettings> =>
  fetch(`${B}/settings`).then(json);

export const saveSettings = (s: AppSettings): Promise<AppSettings> =>
  fetch(`${B}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }).then(json);

export const addCompensation = (date: string): Promise<Transaction> =>
  fetch(`${B}/compensation/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date }) }).then(json);

export const getSavings = (): Promise<SavingsAccount[]> =>
  fetch(`${B}/savings`).then(json);

export const addSavingsAccount = (a: Omit<SavingsAccount, 'id' | 'balance' | 'entries'>): Promise<SavingsAccount> =>
  fetch(`${B}/savings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) }).then(json);

export const updateSavingsAccount = (id: number, a: Partial<SavingsAccount>): Promise<SavingsAccount> =>
  fetch(`${B}/savings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) }).then(json);

export const deleteSavingsAccount = (id: number): Promise<void> =>
  fetch(`${B}/savings/${id}`, { method: 'DELETE' }).then(() => {});

export const addSavingsEntry = (accountId: number, e: Omit<SavingsEntry, 'id' | 'savingsAccountId'>): Promise<SavingsEntry> =>
  fetch(`${B}/savings/${accountId}/entries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) }).then(json);

export const deleteSavingsEntry = (entryId: number): Promise<void> =>
  fetch(`${B}/savings/entries/${entryId}`, { method: 'DELETE' }).then(() => {});

export const getBudget = (month: string): Promise<CategoryBudget[]> =>
  fetch(`${B}/budget?month=${month}`).then(json);

export const getShoppingItems = (weekStart: string): Promise<import('./types').ShoppingItem[]> =>
  fetch(`${B}/grocery?weekStart=${weekStart}`).then(json);

export const addShoppingItem = (item: Omit<import('./types').ShoppingItem, 'id' | 'createdAt'>): Promise<import('./types').ShoppingItem> =>
  fetch(`${B}/grocery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(json);

export const updateShoppingItem = (id: number, u: { isBought: boolean; actualCost?: number | null }): Promise<import('./types').ShoppingItem> =>
  fetch(`${B}/grocery/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) }).then(json);

export const deleteShoppingItem = (id: number): Promise<void> =>
  fetch(`${B}/grocery/${id}`, { method: 'DELETE' }).then(() => {});

export const saveBudgetItem = (month: string, category: string, amount: number): Promise<void> =>
  fetch(`${B}/budget`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month, category, amount }) }).then(() => {});
