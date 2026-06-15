import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { SavingsAccount, SavingsEntry } from '../../types';
import { ApiService } from '../../api.service';
import { fmt } from '../dashboard/dashboard.component';

const ENTRY_LABELS: Record<string, string> = { deposit: 'Пополнение', withdrawal: 'Снятие', interest: 'Проценты' };
const ENTRY_ICONS: Record<string, string> = { deposit: '➕', withdrawal: '➖', interest: '📈' };
const COLORS = ['#FFDD2D', '#22c55e', '#f97316', '#ec4899', '#06b6d4', '#8b5cf6', '#6366f1'];

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="space-y-4">
  <!-- Total -->
  <div class="bg-card rounded-2xl p-5 border border-brd">
    <p class="text-sm text-t2">Всего на накопительных счетах</p>
    <p class="text-3xl font-bold mt-1 text-y">{{fmt(totalSavings)}}</p>
    <p class="text-sm text-t3 mt-1">{{accounts.length}} {{accountsWord}}</p>
  </div>

  <!-- Accounts -->
  @for (acc of accounts; track acc.id) {
    <div class="bg-card rounded-2xl border border-brd overflow-hidden">
      <div class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex-shrink-0" [style.background]="acc.color"></div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-t1">{{acc.name}}</p>
            <p class="text-xs text-t3">{{acc.bank}}{{acc.interestRate > 0 ? ' · ' + acc.interestRate + '% год.' : ''}}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-lg text-t1">{{fmt(acc.balance)}}</p>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button (click)="entryFor = acc.id"
            class="flex-1 bg-y text-black text-sm font-bold py-2 rounded-xl hover:brightness-110 transition">
            + Движение
          </button>
          <button (click)="toggleExpand(acc.id)"
            class="flex-1 bg-card2 text-t2 text-sm font-semibold py-2 rounded-xl hover:text-t1 transition">
            {{expanded === acc.id ? 'Свернуть' : 'История (' + acc.entries.length + ')'}}
          </button>
          <button (click)="editAccount = acc"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-card2 hover:bg-brd transition text-t2">
            ✏️
          </button>
          <button (click)="handleDelete(acc.id)"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-card2 hover:bg-[#FF453A]/20 text-t3 hover:text-[#FF453A] transition">
            🗑️
          </button>
        </div>
      </div>

      @if (expanded === acc.id) {
        <div class="border-t border-brd">
          @if (!acc.entries.length) {
            <p class="text-center text-t3 text-sm py-6">История пуста</p>
          }
          @for (e of acc.entries; track e.id) {
            <div class="flex items-center gap-3 px-4 py-3 border-b border-brd last:border-0 group">
              <span class="text-lg">{{entryIcon(e.type)}}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-t1">{{e.description || entryLabel(e.type)}}</p>
                <p class="text-xs text-t3">{{formatEntryDate(e.date)}}</p>
              </div>
              <span [class]="'text-sm font-semibold ' + (e.amount >= 0 ? 'text-green-400' : 'text-[#FF453A]')">
                {{e.amount >= 0 ? '+' : ''}}{{fmt(e.amount)}}
              </span>
              <button (click)="handleDeleteEntry(e.id)"
                class="opacity-0 group-hover:opacity-100 transition text-t3 hover:text-[#FF453A] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#FF453A]/10">
                🗑️
              </button>
            </div>
          }
        </div>
      }
    </div>
  }

  <button (click)="showAdd = true"
    class="w-full border-2 border-dashed border-brd rounded-2xl py-4 text-t3 hover:border-y/50 hover:text-y transition font-medium text-sm">
    + Добавить накопительный счёт
  </button>
</div>

<!-- Account form modal -->
@if (showAdd || editAccount) {
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
    (click)="closeAccountForm()">
    <div class="bg-card w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl" (click)="$event.stopPropagation()">
      <div class="w-10 h-1 bg-brd rounded-full mx-auto mb-4 sm:hidden"></div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-bold text-lg text-t1">{{editAccount ? 'Редактировать счёт' : 'Новый счёт'}}</h2>
        <button (click)="closeAccountForm()" class="w-8 h-8 flex items-center justify-center rounded-full bg-card2 text-t2 hover:text-t1 transition text-xl leading-none">×</button>
      </div>
      <form (ngSubmit)="submitAccount()" class="space-y-3">
        <input required [(ngModel)]="accName" name="accName" placeholder="Название (напр. Т-Сейф)"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <input [(ngModel)]="accBank" name="accBank" placeholder="Банк"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <div class="flex gap-2 items-center">
          <input type="number" min="0" step="0.1" [(ngModel)]="accRate" name="accRate" placeholder="Ставка %"
            class="flex-1 bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
          <span class="text-t2 text-sm">% год.</span>
        </div>
        <div>
          <p class="text-xs text-t2 mb-2">Цвет</p>
          <div class="flex gap-2">
            @for (c of colorOptions; track c) {
              <button type="button" (click)="accColor = c"
                [class]="'w-7 h-7 rounded-full transition ' + (accColor === c ? 'ring-2 ring-offset-2 ring-offset-card ring-white' : '')"
                [style.background]="c"></button>
            }
          </div>
        </div>
        <button type="submit" [disabled]="accLoading"
          class="w-full bg-y text-black font-bold py-2.5 rounded-2xl hover:brightness-110 transition disabled:opacity-50">
          {{accLoading ? 'Сохраняем...' : 'Сохранить'}}
        </button>
      </form>
    </div>
  </div>
}

<!-- Entry form modal -->
@if (entryFor !== null) {
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
    (click)="entryFor = null">
    <div class="bg-card w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl" (click)="$event.stopPropagation()">
      <div class="w-10 h-1 bg-brd rounded-full mx-auto mb-4 sm:hidden"></div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-bold text-lg text-t1">Добавить движение</h2>
        <button (click)="entryFor = null" class="w-8 h-8 flex items-center justify-center rounded-full bg-card2 text-t2 hover:text-t1 transition text-xl leading-none">×</button>
      </div>
      <form (ngSubmit)="submitEntry()" class="space-y-3">
        <div class="grid grid-cols-3 gap-1.5">
          @for (t of entryTypes; track t.value) {
            <button type="button" (click)="entryType = t.value"
              [class]="entryType === t.value ? 'py-2 rounded-xl text-sm font-medium transition bg-y text-black' : 'py-2 rounded-xl text-sm font-medium transition bg-card2 text-t2 hover:text-t1'">
              {{t.icon}} {{t.label}}
            </button>
          }
        </div>
        <input type="number" required min="0.01" step="any" [(ngModel)]="entryAmount" name="entryAmount"
          placeholder="Сумма, ₽" autofocus
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-xl font-bold text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <input type="date" [(ngModel)]="entryDate" name="entryDate" required
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 focus:outline-none focus:border-y/60" />
        <input [(ngModel)]="entryDesc" name="entryDesc" placeholder="Описание (опционально)"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        @if (entryType === 'interest') {
          <p class="text-xs text-y/80 bg-y/10 rounded-xl p-2.5">Проценты автоматически появятся в доходах основного бюджета.</p>
        }
        <button type="submit" [disabled]="entryLoading"
          class="w-full bg-y text-black font-bold py-2.5 rounded-2xl hover:brightness-110 transition disabled:opacity-50">
          {{entryLoading ? 'Сохраняем...' : 'Добавить'}}
        </button>
      </form>
    </div>
  </div>
}
  `,
})
export class SavingsComponent {
  @Input() accounts: SavingsAccount[] = [];
  @Output() onRefresh = new EventEmitter<void>();

  fmt = fmt;
  colorOptions = COLORS;

  showAdd = false;
  editAccount: SavingsAccount | null = null;
  entryFor: number | null = null;
  expanded: number | null = null;

  // account form
  accName = ''; accBank = ''; accRate = ''; accColor = COLORS[0]; accLoading = false;

  // entry form
  entryType: 'deposit' | 'withdrawal' | 'interest' = 'deposit';
  entryAmount = '';
  entryDate = new Date().toISOString().slice(0, 10);
  entryDesc = '';
  entryLoading = false;

  entryTypes = [
    { value: 'deposit' as const, icon: '➕', label: 'Пополнение' },
    { value: 'withdrawal' as const, icon: '➖', label: 'Снятие' },
    { value: 'interest' as const, icon: '📈', label: 'Проценты' },
  ];

  get totalSavings() { return this.accounts.reduce((s, a) => s + a.balance, 0); }
  get accountsWord() {
    const n = this.accounts.length;
    return n === 1 ? 'счёт' : n < 5 ? 'счёта' : 'счетов';
  }

  entryIcon(t: string) { return ENTRY_ICONS[t] ?? ''; }
  entryLabel(t: string) { return ENTRY_LABELS[t] ?? t; }
  formatEntryDate(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('ru-RU'); }

  toggleExpand(id: number) { this.expanded = this.expanded === id ? null : id; }

  openEditAccount(acc: SavingsAccount) {
    this.editAccount = acc;
    this.accName = acc.name;
    this.accBank = acc.bank;
    this.accRate = String(acc.interestRate);
    this.accColor = acc.color;
  }

  closeAccountForm() {
    this.showAdd = false;
    this.editAccount = null;
    this.accName = ''; this.accBank = ''; this.accRate = ''; this.accColor = COLORS[0];
  }

  constructor(private api: ApiService) {}

  async submitAccount() {
    this.accLoading = true;
    try {
      const data = { name: this.accName, bank: this.accBank, interestRate: +this.accRate || 0, color: this.accColor };
      if (this.editAccount) {
        await this.api.updateSavingsAccount(this.editAccount.id, data);
      } else {
        await this.api.addSavingsAccount(data);
      }
      this.onRefresh.emit();
      this.closeAccountForm();
    } finally { this.accLoading = false; }
  }

  async handleDelete(id: number) {
    if (!confirm('Удалить счёт со всей историей?')) return;
    await this.api.deleteSavingsAccount(id);
    this.onRefresh.emit();
  }

  async handleDeleteEntry(entryId: number) {
    if (!confirm('Удалить запись?')) return;
    await this.api.deleteSavingsEntry(entryId);
    this.onRefresh.emit();
  }

  async submitEntry() {
    if (!this.entryAmount || +this.entryAmount <= 0 || this.entryFor === null) return;
    this.entryLoading = true;
    try {
      const amount = this.entryType === 'withdrawal' ? -Math.abs(+this.entryAmount) : +this.entryAmount;
      await this.api.addSavingsEntry(this.entryFor, { date: this.entryDate, amount, type: this.entryType, description: this.entryDesc });
      this.onRefresh.emit();
      this.entryFor = null;
      this.entryAmount = ''; this.entryDesc = '';
    } finally { this.entryLoading = false; }
  }
}
