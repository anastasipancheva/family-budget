import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { AppSettings } from '../../types';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<form (ngSubmit)="handleSubmit()" class="space-y-4 max-w-lg mx-auto">
  <div class="bg-card rounded-2xl p-5 border border-brd space-y-4">
    <h3 class="font-semibold text-t1">👤 Первый партнёр</h3>
    <div>
      <label class="text-xs text-t2 uppercase tracking-wide font-medium">Имя</label>
      <input type="text" [(ngModel)]="form.person1Name" name="person1Name" (ngModelChange)="saved=false"
        class="mt-1 w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
    </div>
    <div>
      <label class="text-xs text-t2 uppercase tracking-wide font-medium">Зарплата</label>
      <div class="flex items-center gap-2 mt-1">
        <input type="number" [(ngModel)]="form.person1Salary" name="person1Salary" (ngModelChange)="saved=false"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <span class="text-t3 text-sm flex-shrink-0">₽</span>
      </div>
    </div>
  </div>

  <div class="bg-card rounded-2xl p-5 border border-brd space-y-4">
    <h3 class="font-semibold text-t1">👤 Второй партнёр</h3>
    <div>
      <label class="text-xs text-t2 uppercase tracking-wide font-medium">Имя</label>
      <input type="text" [(ngModel)]="form.person2Name" name="person2Name" (ngModelChange)="saved=false"
        class="mt-1 w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
    </div>
    <div>
      <label class="text-xs text-t2 uppercase tracking-wide font-medium">Зарплата</label>
      <div class="flex items-center gap-2 mt-1">
        <input type="number" [(ngModel)]="form.person2Salary" name="person2Salary" (ngModelChange)="saved=false"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <span class="text-t3 text-sm flex-shrink-0">₽</span>
      </div>
    </div>
  </div>

  <div class="bg-card rounded-2xl p-5 border border-brd space-y-4">
    <h3 class="font-semibold text-t1">🎫 Компенсация</h3>
    <div>
      <label class="text-xs text-t2 uppercase tracking-wide font-medium">На человека в рабочий день</label>
      <div class="flex items-center gap-2 mt-1">
        <input type="number" [(ngModel)]="form.compensationPerPerson" name="compensationPerPerson" (ngModelChange)="saved=false"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <span class="text-t3 text-sm flex-shrink-0">₽</span>
      </div>
    </div>
    <p class="text-xs text-t3 bg-card2 rounded-xl p-3">
      На двоих в день: <span class="text-y font-semibold">{{(form.compensationPerPerson * 2).toLocaleString('ru-RU')}} ₽</span>
      · В месяц (20 раб. дней): <span class="text-y font-semibold">{{monthlyComp.toLocaleString('ru-RU')}} ₽</span>
    </p>
  </div>

  <div class="bg-card rounded-2xl p-5 border border-brd space-y-4">
    <h3 class="font-semibold text-t1">🏠 Жильё</h3>
    <div>
      <label class="text-xs text-t2 uppercase tracking-wide font-medium">Аренда</label>
      <div class="flex items-center gap-2 mt-1">
        <input type="number" [(ngModel)]="form.rentAmount" name="rentAmount" (ngModelChange)="saved=false"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <span class="text-t3 text-sm flex-shrink-0">₽</span>
      </div>
    </div>
    <div>
      <label class="text-xs text-t2 uppercase tracking-wide font-medium">Плановый бюджет на счётчики</label>
      <div class="flex items-center gap-2 mt-1">
        <input type="number" [(ngModel)]="form.utilitiesBudget" name="utilitiesBudget" (ngModelChange)="saved=false"
          class="w-full bg-card2 border border-brd rounded-2xl px-4 py-2.5 text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <span class="text-t3 text-sm flex-shrink-0">₽</span>
      </div>
    </div>
  </div>

  <div class="bg-card rounded-2xl p-5 border border-y/20 space-y-2">
    <p class="text-sm font-semibold text-y mb-3">📊 Итого план на месяц</p>
    <div class="space-y-1.5 text-sm">
      <div class="flex justify-between text-t2">
        <span>Зарплаты</span>
        <span class="text-t1">{{(form.person1Salary + form.person2Salary).toLocaleString('ru-RU')}} ₽</span>
      </div>
      <div class="flex justify-between text-t2">
        <span>Компенсации</span>
        <span class="text-t1">{{monthlyComp.toLocaleString('ru-RU')}} ₽</span>
      </div>
      <div class="flex justify-between font-bold border-t border-brd pt-2 mt-1 text-y">
        <span>Всего доходов</span>
        <span>{{totalIncome.toLocaleString('ru-RU')}} ₽</span>
      </div>
      <div class="flex justify-between text-[#FF453A]">
        <span>Аренда + счётчики</span>
        <span>−{{totalExpense.toLocaleString('ru-RU')}} ₽</span>
      </div>
      <div class="flex justify-between font-bold border-t border-brd pt-2 mt-1">
        <span class="text-t1">Остаток</span>
        <span [class]="remainder >= 0 ? 'text-y' : 'text-[#FF453A]'">{{remainder.toLocaleString('ru-RU')}} ₽</span>
      </div>
    </div>
  </div>

  <button type="submit" [disabled]="loading"
    [class]="'w-full font-bold py-3.5 rounded-2xl transition disabled:opacity-50 text-base ' + (saved ? 'bg-green-500 text-white' : 'bg-y text-black hover:brightness-110')">
    {{loading ? 'Сохраняем...' : saved ? '✓ Сохранено' : 'Сохранить настройки'}}
  </button>
</form>
  `,
})
export class SettingsComponent implements OnChanges {
  @Input() settings!: AppSettings;
  @Output() onSave = new EventEmitter<AppSettings>();

  form: AppSettings = {} as AppSettings;
  saved = false;
  loading = false;

  ngOnChanges() {
    if (this.settings) this.form = { ...this.settings };
  }

  get monthlyComp() { return (this.form.compensationPerPerson ?? 0) * 2 * 20; }
  get totalIncome() { return (this.form.person1Salary ?? 0) + (this.form.person2Salary ?? 0) + this.monthlyComp; }
  get totalExpense() { return (this.form.rentAmount ?? 0) + (this.form.utilitiesBudget ?? 0); }
  get remainder() { return this.totalIncome - this.totalExpense; }

  async handleSubmit() {
    this.loading = true;
    try { this.onSave.emit({ ...this.form }); this.saved = true; } finally { this.loading = false; }
  }
}
