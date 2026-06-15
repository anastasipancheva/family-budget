import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Transaction, Stats, AppSettings, SavingsAccount, CategoryBudget, ShoppingItem } from './types';
import { ApiService } from './api.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { SavingsComponent } from './components/savings/savings.component';
import { PlanningComponent } from './components/planning/planning.component';
import { SettingsComponent } from './components/settings/settings.component';

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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashboardComponent,
    TransactionListComponent,
    TransactionFormComponent,
    SavingsComponent,
    PlanningComponent,
    SettingsComponent,
  ],
  template: `
@if (loading && !stats) {
  <div class="min-h-screen bg-bg flex items-center justify-center flex-col gap-4">
    <div class="w-16 h-16 rounded-full bg-y flex items-center justify-center animate-pulse">
      <span class="font-black text-black text-3xl">T</span>
    </div>
    <p class="text-t1 font-bold text-lg">Т-Расходы</p>
    <p class="text-t2 text-sm">Загрузка...</p>
    <p class="text-t3 text-xs mt-2">Сервер просыпается, подождите ~30 сек</p>
  </div>
} @else if (error) {
  <div class="min-h-screen bg-bg flex items-center justify-center p-6">
    <div class="text-center">
      <div class="w-14 h-14 rounded-full bg-card2 flex items-center justify-center mx-auto mb-4">
        <span class="text-2xl">⚠</span>
      </div>
      <p class="text-t2 mb-4 text-sm">{{error}}</p>
      <button (click)="load()" class="bg-y text-black font-bold px-6 py-2.5 rounded-2xl">Повторить</button>
    </div>
  </div>
} @else {
  <div class="min-h-screen bg-bg">
    <!-- Header -->
    <header class="bg-bg border-b border-brd sticky top-0 z-40">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-y flex items-center justify-center flex-shrink-0">
          <span class="font-black text-black text-base leading-none">T</span>
        </div>
        <span class="font-bold text-t1 flex-shrink-0">Т-Расходы</span>
        @if (showMonthNav) {
          <div class="flex items-center gap-1 ml-auto">
            <button (click)="stepMonth(-1)" class="w-8 h-8 flex items-center justify-center rounded-xl text-t2 hover:text-t1 hover:bg-card transition text-lg">‹</button>
            <span class="text-sm font-semibold text-t1 w-36 text-center">{{monthLabel}}</span>
            <button (click)="stepMonth(1)" class="w-8 h-8 flex items-center justify-center rounded-xl text-t2 hover:text-t1 hover:bg-card transition text-lg">›</button>
          </div>
        } @else {
          <div class="ml-auto"></div>
        }
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-2xl mx-auto px-4 py-5 pb-28">
      @if (tab === 'dashboard' && stats && settings) {
        <app-dashboard [stats]="stats" [settings]="settings" [month]="month" [onRefresh]="loadBound"></app-dashboard>
      }
      @if (tab === 'transactions' && settings) {
        <app-transaction-list [transactions]="transactions" [settings]="settings"
          (onDelete)="handleDelete($event)" (onFilter)="handleFilter($event)"></app-transaction-list>
      }
      @if (tab === 'savings') {
        <app-savings [accounts]="savings" (onRefresh)="load()"></app-savings>
      }
      @if (tab === 'planning' && stats) {
        <app-planning [budgets]="budgets" [stats]="stats" [month]="month"
          [shoppingItems]="shoppingItems" [weekStart]="weekStart"
          (onWeekChange)="handleWeekChange($event)" (onRefresh)="load()"></app-planning>
      }
      @if (tab === 'settings' && settings) {
        <app-settings [settings]="settings" (onSave)="handleSaveSettings($event)"></app-settings>
      }
    </main>

    <!-- FAB -->
    @if (tab !== 'settings' && tab !== 'savings') {
      <button (click)="showForm = true"
        class="fixed right-5 bottom-20 w-14 h-14 bg-y text-black rounded-full shadow-lg flex items-center justify-center text-3xl font-bold hover:brightness-110 active:scale-95 transition z-30 leading-none">
        +
      </button>
    }

    <!-- Bottom nav -->
    <nav class="fixed bottom-0 inset-x-0 bg-card border-t border-brd z-40">
      <div class="max-w-2xl mx-auto flex">
        @for (t of tabs; track t.key) {
          <button (click)="tab = t.key"
            [class]="'flex-1 py-3 flex flex-col items-center gap-0.5 transition ' + (tab === t.key ? 'text-y' : 'text-t3 hover:text-t2')">
            <span class="text-xl leading-none">{{t.icon}}</span>
            <span class="text-[10px] font-medium leading-none">{{t.label}}</span>
          </button>
        }
      </div>
    </nav>

    @if (showForm && settings) {
      <app-transaction-form [settings]="settings" (onAdd)="handleAdd($event)" (onClose)="showForm = false"></app-transaction-form>
    }
  </div>
}
  `,
})
export class App implements OnInit {
  tab: Tab = 'dashboard';
  month = toMonthStr(new Date());
  weekStart = getWeekStart(new Date());
  transactions: Transaction[] = [];
  stats: Stats | null = null;
  settings: AppSettings | null = null;
  savings: SavingsAccount[] = [];
  budgets: CategoryBudget[] = [];
  shoppingItems: ShoppingItem[] = [];
  showForm = false;
  loading = true;
  error = '';
  txFilter: Parameters<ApiService['getTransactions']>[0] = {};

  loadBound = () => this.load();

  tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard',    icon: '◈',  label: 'Обзор' },
    { key: 'transactions', icon: '≡',  label: 'Записи' },
    { key: 'savings',      icon: '◎',  label: 'Счета' },
    { key: 'planning',     icon: '⊞',  label: 'План' },
    { key: 'settings',     icon: '⚙',  label: 'Ещё' },
  ];

  get showMonthNav() { return this.tab === 'dashboard' || this.tab === 'transactions' || this.tab === 'planning'; }
  get monthLabel() {
    const [y, m] = this.month.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  async load() {
    try {
      this.error = '';
      const [st, sav, bud, shop, set] = await Promise.all([
        this.api.getStats(this.month),
        this.api.getSavings(),
        this.api.getBudget(this.month),
        this.api.getShoppingItems(this.weekStart),
        this.settings ? Promise.resolve(this.settings) : this.api.getSettings(),
      ]);
      this.stats = st; this.savings = sav; this.budgets = bud; this.shoppingItems = shop;
      if (!this.settings) this.settings = set;
      await this.loadTransactions();
    } catch {
      this.error = 'Не удалось подключиться к серверу.';
    } finally { this.loading = false; }
  }

  async loadTransactions(filter = this.txFilter) {
    this.transactions = await this.api.getTransactions({ month: this.month, ...filter });
  }

  async handleWeekChange(ws: string) {
    this.weekStart = ws;
    this.shoppingItems = await this.api.getShoppingItems(ws);
  }

  stepMonth(dir: number) {
    const [y, m] = this.month.split('-').map(Number);
    this.month = toMonthStr(new Date(y, m - 1 + dir, 1));
    this.loading = true;
    this.load();
  }

  async handleAdd(tx: Omit<Transaction, 'id' | 'createdAt'>) {
    await this.api.addTransaction(tx);
    await this.load();
  }

  async handleDelete(id: number) {
    await this.api.deleteTransaction(id);
    await this.load();
  }

  async handleSaveSettings(s: AppSettings) {
    this.settings = await this.api.saveSettings(s);
  }

  async handleFilter(filter: Parameters<ApiService['getTransactions']>[0]) {
    this.txFilter = filter;
    await this.loadTransactions(filter);
  }
}
