import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { AppSettings, Transaction } from '../../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_ICONS } from '../../types';

type NewTx = Omit<Transaction, 'id' | 'createdAt'>;

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" (click)="onClose.emit()">
  <div class="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto"
    (click)="$event.stopPropagation()">
    <!-- Handle -->
    <div class="w-10 h-1 bg-brd rounded-full mx-auto mb-4 sm:hidden"></div>

    <div class="flex justify-between items-center mb-5">
      <h2 class="text-lg font-bold text-t1">Новая запись</h2>
      <button (click)="onClose.emit()" class="w-8 h-8 flex items-center justify-center rounded-full bg-card2 text-t2 hover:text-t1 transition text-xl leading-none">×</button>
    </div>

    <form (ngSubmit)="handleSubmit()" class="space-y-4">
      <!-- Toggle -->
      <div class="flex rounded-2xl overflow-hidden bg-card2 p-1 gap-1">
        <button type="button" (click)="toggleType(false)"
          [class]="!isIncome ? 'flex-1 py-2.5 text-sm font-bold rounded-xl transition bg-[#FF453A] text-white' : 'flex-1 py-2.5 text-sm font-bold rounded-xl transition text-t2 hover:text-t1'">
          − Расход
        </button>
        <button type="button" (click)="toggleType(true)"
          [class]="isIncome ? 'flex-1 py-2.5 text-sm font-bold rounded-xl transition bg-green-500 text-white' : 'flex-1 py-2.5 text-sm font-bold rounded-xl transition text-t2 hover:text-t1'">
          + Доход
        </button>
      </div>

      <!-- Amount -->
      <div>
        <p class="text-xs text-t2 uppercase tracking-wide font-medium mb-1">Сумма</p>
        <div class="relative">
          <input type="number" min="0.01" step="any" [(ngModel)]="amount" name="amount"
            placeholder="0" required autofocus
            class="w-full bg-card2 border border-brd rounded-2xl px-4 py-3 text-3xl font-bold text-t1 placeholder-t3 focus:outline-none focus:border-y/60 pr-10" />
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-t3 text-lg">₽</span>
        </div>
      </div>

      <!-- Category -->
      <div>
        <p class="text-xs text-t2 uppercase tracking-wide font-medium mb-2">Категория</p>
        <div class="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
          @for (c of categories; track c) {
            <button type="button" (click)="category = c"
              [class]="category === c ? 'flex flex-col items-center py-2.5 px-1 rounded-2xl text-xs font-medium transition bg-y text-black' : 'flex flex-col items-center py-2.5 px-1 rounded-2xl text-xs font-medium transition bg-card2 text-t2 hover:text-t1'">
              <span class="text-lg mb-0.5">{{catIcon(c)}}</span>
              <span class="text-center leading-tight">{{c}}</span>
            </button>
          }
        </div>
      </div>

      <!-- Date + Person -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-xs text-t2 uppercase tracking-wide font-medium mb-1">Дата</p>
          <input type="date" [(ngModel)]="date" name="date" required
            class="w-full bg-card2 border border-brd rounded-2xl px-3 py-2.5 text-t1 text-sm focus:outline-none focus:border-y/60" />
        </div>
        <div>
          <p class="text-xs text-t2 uppercase tracking-wide font-medium mb-1">Кто</p>
          <select [(ngModel)]="person" name="person"
            class="w-full bg-card2 border border-brd rounded-2xl px-3 py-2.5 text-t1 text-sm focus:outline-none focus:border-y/60">
            <option value="person1">{{settings.person1Name}}</option>
            <option value="person2">{{settings.person2Name}}</option>
            <option value="shared">Общее</option>
          </select>
        </div>
      </div>

      <!-- Description -->
      <div>
        <p class="text-xs text-t2 uppercase tracking-wide font-medium mb-1">Описание (опционально)</p>
        <input type="text" [(ngModel)]="description" name="description"
          placeholder="Пятёрочка, обед…"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 text-sm placeholder-t3 focus:outline-none focus:border-y/60" />
      </div>

      <button type="submit" [disabled]="loading"
        [class]="'w-full font-bold py-3.5 rounded-2xl transition disabled:opacity-50 text-base ' + (isIncome ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-y text-black hover:brightness-110')">
        {{loading ? 'Сохраняем...' : (isIncome ? 'Добавить доход' : 'Добавить расход')}}
      </button>
    </form>
  </div>
</div>
  `,
})
export class TransactionFormComponent {
  @Input() settings!: AppSettings;
  @Output() onAdd = new EventEmitter<NewTx>();
  @Output() onClose = new EventEmitter<void>();

  catIcon = (l: string) => CATEGORY_ICONS[l] ?? '•';

  isIncome = false;
  category = EXPENSE_CATEGORIES[0];
  amount = '';
  date = new Date().toISOString().slice(0, 10);
  description = '';
  person = 'shared';
  loading = false;

  get categories() { return this.isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES; }

  toggleType(income: boolean) {
    this.isIncome = income;
    this.category = income ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0];
  }

  async handleSubmit() {
    if (!this.amount || +this.amount <= 0) return;
    this.loading = true;
    try {
      this.onAdd.emit({ date: this.date, amount: +this.amount, isIncome: this.isIncome, category: this.category, description: this.description, person: this.person });
      this.onClose.emit();
    } finally { this.loading = false; }
  }
}
