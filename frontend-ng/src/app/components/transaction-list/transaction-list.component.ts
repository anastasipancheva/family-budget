import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Transaction, AppSettings } from '../../types';
import { CATEGORY_ICONS, CATEGORY_COLORS, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../types';
import { fmt } from '../dashboard/dashboard.component';

type FilterType = 'all' | 'income' | 'expense';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="space-y-4">
  <!-- Search -->
  <div class="relative">
    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-t3 text-sm">🔍</span>
    <input type="search" [(ngModel)]="search" (ngModelChange)="doSearch($event)"
      placeholder="Поиск по описанию или категории…"
      class="w-full bg-card border border-brd rounded-2xl pl-9 pr-4 py-2.5 text-sm text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
  </div>

  <!-- Type tabs -->
  <div class="flex rounded-2xl overflow-hidden bg-card2 p-1 gap-1">
    @for (t of typeOptions; track t.value) {
      <button (click)="setType(t.value)"
        [class]="typeClass(t.value)">
        {{t.label}}
      </button>
    }
  </div>

  <!-- Filters row -->
  <div class="flex gap-2 overflow-x-auto pb-1">
    <select [(ngModel)]="filterCategory" (ngModelChange)="setCat($event)"
      class="bg-card border border-brd rounded-xl px-3 py-2 text-sm text-t1 focus:outline-none flex-shrink-0">
      <option value="">Все категории</option>
      @for (c of allCategories; track c) {
        <option [value]="c">{{catIcon(c)}} {{c}}</option>
      }
    </select>
    <select [(ngModel)]="filterPerson" (ngModelChange)="setPerson($event)"
      class="bg-card border border-brd rounded-xl px-3 py-2 text-sm text-t1 focus:outline-none flex-shrink-0">
      @for (o of personOptions; track o.value) {
        <option [value]="o.value">{{o.label}}</option>
      }
    </select>
    @if (hasFilters) {
      <button (click)="clearFilters()"
        class="bg-card border border-brd rounded-xl px-3 py-2 text-sm text-t2 hover:text-t1 flex-shrink-0 whitespace-nowrap transition">
        Сбросить ×
      </button>
    }
  </div>

  @if (transactions.length > 0) {
    <p class="text-xs text-t3">Найдено: {{transactions.length}} записей</p>
  }

  @if (transactions.length === 0) {
    <div class="text-center py-16 text-t3">
      <p class="text-4xl mb-3">📭</p>
      <p class="text-sm">Нет записей по выбранным фильтрам</p>
    </div>
  } @else {
    <div class="space-y-5">
      @for (date of dates; track date) {
        <div>
          <div class="flex justify-between items-center mb-2">
            <p class="text-xs text-t3 uppercase tracking-wide font-medium capitalize">{{dateLabel(date)}}</p>
            <span [class]="'text-xs font-semibold ' + (dayTotal(date) >= 0 ? 'text-green-400' : 'text-[#FF453A]')">
              {{dayTotal(date) >= 0 ? '+' : ''}}{{fmt(dayTotal(date))}}
            </span>
          </div>
          <div class="space-y-1.5">
            @for (tx of byDate.get(date)!; track tx.id) {
              <div class="bg-card rounded-2xl px-4 py-3 flex items-center gap-3 group border border-brd hover:border-brd/80 transition">
                <span class="text-xl w-8 text-center flex-shrink-0">{{catIcon(tx.category) || (tx.isIncome ? '💰' : '📦')}}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-t1 truncate">{{tx.description || tx.category}}</p>
                  <p class="text-xs text-t3">{{tx.category}}{{personName(tx.person) ? ' · ' + personName(tx.person) : ''}}</p>
                </div>
                <span class="font-semibold text-sm whitespace-nowrap" [style.color]="txColor(tx)">
                  {{tx.isIncome ? '+' : '−'}}{{fmt(tx.amount)}}
                </span>
                <button (click)="confirmDelete(tx.id)"
                  class="opacity-0 group-hover:opacity-100 transition ml-1 w-7 h-7 flex items-center justify-center rounded-xl text-t3 hover:text-[#FF453A] hover:bg-[#FF453A]/10"
                  title="Удалить">🗑️</button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  }
</div>
  `,
})
export class TransactionListComponent {
  @Input() transactions: Transaction[] = [];
  @Input() settings!: AppSettings;
  @Output() onDelete = new EventEmitter<number>();
  @Output() onFilter = new EventEmitter<{ isIncome?: boolean; category?: string; person?: string; search?: string }>();

  fmt = fmt;
  catIcon = (l: string) => CATEGORY_ICONS[l] ?? '';

  search = '';
  filterType: FilterType = 'all';
  filterCategory = '';
  filterPerson = '';

  typeOptions = [
    { value: 'all' as FilterType, label: 'Все' },
    { value: 'income' as FilterType, label: '+ Доходы' },
    { value: 'expense' as FilterType, label: '− Расходы' },
  ];

  get personOptions() {
    return [
      { value: '', label: 'Все' },
      { value: 'person1', label: this.settings?.person1Name ?? 'Партнёр 1' },
      { value: 'person2', label: this.settings?.person2Name ?? 'Партнёр 2' },
      { value: 'shared', label: 'Общее' },
    ];
  }

  get allCategories() {
    return this.filterType === 'income' ? INCOME_CATEGORIES
      : this.filterType === 'expense' ? EXPENSE_CATEGORIES
      : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  }

  get hasFilters() { return !!(this.filterCategory || this.filterPerson || this.search); }

  get byDate() {
    const map = new Map<string, Transaction[]>();
    for (const t of this.transactions) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return map;
  }

  get dates() { return [...this.byDate.keys()].sort((a, b) => b.localeCompare(a)); }

  typeClass(t: FilterType) {
    const active = this.filterType === t;
    if (!active) return 'flex-1 py-2 text-sm font-semibold rounded-xl transition text-t2 hover:text-t1';
    const color = t === 'income' ? 'bg-green-500 text-white' : t === 'expense' ? 'bg-[#FF453A] text-white' : 'bg-y text-black';
    return `flex-1 py-2 text-sm font-semibold rounded-xl transition ${color}`;
  }

  dateLabel(date: string) {
    return new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  dayTotal(date: string) {
    return (this.byDate.get(date) ?? []).reduce((s, t) => s + (t.isIncome ? t.amount : -t.amount), 0);
  }

  txColor(tx: Transaction) {
    return CATEGORY_COLORS[tx.category] ?? (tx.isIncome ? '#22c55e' : '#94a3b8');
  }

  personName(person: string) {
    if (person === 'person1') return this.settings?.person1Name ?? '';
    if (person === 'person2') return this.settings?.person2Name ?? '';
    return '';
  }

  emit() {
    this.onFilter.emit({
      isIncome: this.filterType === 'all' ? undefined : this.filterType === 'income',
      category: this.filterCategory || undefined,
      person: this.filterPerson || undefined,
      search: this.search || undefined,
    });
  }

  setType(t: FilterType) { this.filterType = t; this.filterCategory = ''; this.emit(); }
  setCat(c: string) { this.filterCategory = c; this.emit(); }
  setPerson(p: string) { this.filterPerson = p; this.emit(); }
  doSearch(s: string) { this.search = s; this.emit(); }

  clearFilters() {
    this.filterCategory = '';
    this.filterPerson = '';
    this.search = '';
    this.emit();
  }

  confirmDelete(id: number) {
    if (confirm('Удалить запись?')) this.onDelete.emit(id);
  }
}
