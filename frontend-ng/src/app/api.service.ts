import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, type HttpRequest } from '@angular/common/http';
import { firstValueFrom, timeout, type Observable } from 'rxjs';
import type { Transaction, Stats, AppSettings, SavingsAccount, SavingsEntry, CategoryBudget, ShoppingItem } from './types';

const B = '/api';
const TIMEOUT_MS = 15000;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private r<T>(obs: Observable<T>): Promise<T> {
    return firstValueFrom(obs.pipe(timeout(TIMEOUT_MS)));
  }

  getTransactions(params: { month?: string; isIncome?: boolean; category?: string; person?: string; search?: string } = {}): Promise<Transaction[]> {
    let p = new HttpParams();
    if (params.month) p = p.set('month', params.month);
    if (params.isIncome !== undefined) p = p.set('isIncome', String(params.isIncome));
    if (params.category) p = p.set('category', params.category);
    if (params.person) p = p.set('person', params.person);
    if (params.search) p = p.set('search', params.search);
    return this.r(this.http.get<Transaction[]>(`${B}/transactions`, { params: p }));
  }

  addTransaction(t: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    return this.r(this.http.post<Transaction>(`${B}/transactions`, t));
  }

  deleteTransaction(id: number): Promise<void> {
    return this.r(this.http.delete<void>(`${B}/transactions/${id}`));
  }

  getStats(month: string): Promise<Stats> {
    return this.r(this.http.get<Stats>(`${B}/stats`, { params: { month } }));
  }

  getSettings(): Promise<AppSettings> {
    return this.r(this.http.get<AppSettings>(`${B}/settings`));
  }

  saveSettings(s: AppSettings): Promise<AppSettings> {
    return this.r(this.http.put<AppSettings>(`${B}/settings`, s));
  }

  addCompensation(date: string): Promise<Transaction> {
    return this.r(this.http.post<Transaction>(`${B}/compensation/add`, { date }));
  }

  smartCompensation(params: { date: string; spent: number; persons: number; person?: string; description?: string }): Promise<{ compAmount: number; overAmount: number }> {
    return this.r(this.http.post<{ compAmount: number; overAmount: number }>(`${B}/compensation/smart`, params));
  }

  getSavings(): Promise<SavingsAccount[]> {
    return this.r(this.http.get<SavingsAccount[]>(`${B}/savings`));
  }

  addSavingsAccount(a: Omit<SavingsAccount, 'id' | 'balance' | 'entries'>): Promise<SavingsAccount> {
    return this.r(this.http.post<SavingsAccount>(`${B}/savings`, a));
  }

  updateSavingsAccount(id: number, a: Partial<SavingsAccount>): Promise<SavingsAccount> {
    return this.r(this.http.put<SavingsAccount>(`${B}/savings/${id}`, a));
  }

  deleteSavingsAccount(id: number): Promise<void> {
    return this.r(this.http.delete<void>(`${B}/savings/${id}`));
  }

  addSavingsEntry(accountId: number, e: Omit<SavingsEntry, 'id' | 'savingsAccountId'>): Promise<SavingsEntry> {
    return this.r(this.http.post<SavingsEntry>(`${B}/savings/${accountId}/entries`, e));
  }

  deleteSavingsEntry(entryId: number): Promise<void> {
    return this.r(this.http.delete<void>(`${B}/savings/entries/${entryId}`));
  }

  getBudget(month: string): Promise<CategoryBudget[]> {
    return this.r(this.http.get<CategoryBudget[]>(`${B}/budget`, { params: { month } }));
  }

  getShoppingItems(weekStart: string): Promise<ShoppingItem[]> {
    return this.r(this.http.get<ShoppingItem[]>(`${B}/grocery`, { params: { weekStart } }));
  }

  addShoppingItem(item: Omit<ShoppingItem, 'id' | 'createdAt'>): Promise<ShoppingItem> {
    return this.r(this.http.post<ShoppingItem>(`${B}/grocery`, item));
  }

  updateShoppingItem(id: number, u: { isBought: boolean; actualCost?: number | null }): Promise<ShoppingItem> {
    return this.r(this.http.put<ShoppingItem>(`${B}/grocery/${id}`, u));
  }

  deleteShoppingItem(id: number): Promise<void> {
    return this.r(this.http.delete<void>(`${B}/grocery/${id}`));
  }

  saveBudgetItem(month: string, category: string, amount: number): Promise<void> {
    return this.r(this.http.put<void>(`${B}/budget`, { month, category, amount }));
  }
}
