import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Stats, AppSettings } from '../../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../types';
import { ApiService } from '../../api.service';

export function fmt(n: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

interface DonutSeg { label: string; value: number; color: string; d: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="space-y-4">
  <!-- Summary cards -->
  <div class="grid grid-cols-2 gap-3">
    <div class="bg-card rounded-2xl p-4">
      <p class="text-xs text-t2 font-medium mb-1">Доходы</p>
      <p class="text-xl font-bold" style="color:#FFDD2D">{{fmt(stats.totalIncome)}}</p>
      <p class="text-xs text-t3 mt-0.5">план {{fmt(settings.person1Salary + settings.person2Salary + expectedComp)}}</p>
    </div>
    <div class="bg-card rounded-2xl p-4">
      <p class="text-xs text-t2 font-medium mb-1">Расходы</p>
      <p class="text-xl font-bold" style="color:#FF453A">{{fmt(stats.totalExpense)}}</p>
    </div>
    <div class="bg-card rounded-2xl p-4">
      <p class="text-xs text-t2 font-medium mb-1">Баланс</p>
      <p class="text-xl font-bold" [style.color]="stats.balance >= 0 ? '#FFDD2D' : '#FF453A'">{{fmt(stats.balance)}}</p>
      <p class="text-xs text-t3 mt-0.5">{{stats.balance >= 0 ? 'в плюсе' : 'в минусе'}}</p>
    </div>
    <div class="bg-card rounded-2xl p-4">
      <p class="text-xs text-t2 font-medium mb-1">Компенсации</p>
      <p class="text-xl font-bold" style="color:#86efac">{{fmt(compReceived)}}</p>
      <p class="text-xs text-t3 mt-0.5">план {{fmt(expectedComp)}}</p>
    </div>
  </div>

  <!-- Compensation widget -->
  @if (isCurrentMonth) {
    <div class="bg-card rounded-2xl p-4 space-y-3">
      <div class="flex items-center justify-between">
        <p class="font-semibold text-t1 text-sm">🎫 Компенсация за обед</p>
        <div class="flex rounded-xl overflow-hidden border border-brd text-xs">
          <button (click)="compPerson='person1'"
            [class]="compPerson==='person1' ? 'px-3 py-1.5 font-semibold transition bg-y text-black' : 'px-3 py-1.5 font-semibold transition text-t2 hover:text-t1'">
            {{settings.person1Name}}
          </button>
          <button (click)="compPerson='person2'"
            [class]="compPerson==='person2' ? 'px-3 py-1.5 font-semibold transition bg-y text-black' : 'px-3 py-1.5 font-semibold transition text-t2 hover:text-t1'">
            {{settings.person2Name}}
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <input type="number" min="0" step="any" [(ngModel)]="compSpent"
          [placeholder]="'Сумма, ₽ (лимит ' + fmt(settings.compensationPerPerson) + ')'"
          (keydown.enter)="handleCompAdd()"
          class="flex-1 bg-card2 border border-brd rounded-xl px-3 py-2.5 text-sm text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
        <input type="date" [(ngModel)]="compDate"
          class="bg-card2 border border-brd rounded-xl px-3 py-2.5 text-sm text-t1 focus:outline-none focus:border-y/60" />
        <button (click)="handleCompAdd()" [disabled]="compLoading || !compSpent || compSpentNum <= 0"
          class="bg-y text-black font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-40 hover:brightness-110 transition">
          {{compLoading ? '...' : 'OK'}}
        </button>
      </div>
      @if (compSpentNum > 0 && !compResult) {
        <div class="flex gap-2 text-xs flex-wrap">
          <span class="text-green-400 bg-green-400/10 rounded-lg px-2 py-1">+{{fmt(compPreview.comp)}} компенсация</span>
          @if (compPreview.over > 0) {
            <span class="text-orange-400 bg-orange-400/10 rounded-lg px-2 py-1">−{{fmt(compPreview.over)}} в Продукты</span>
          }
        </div>
      }
      @if (compResult) {
        <div class="flex gap-2 text-xs flex-wrap">
          <span class="text-green-400 bg-green-400/10 rounded-lg px-2 py-1">✓ +{{fmt(compResult.compAmount)}} добавлено</span>
          @if (compResult.overAmount > 0) {
            <span class="text-orange-400 bg-orange-400/10 rounded-lg px-2 py-1">✓ −{{fmt(compResult.overAmount)}} в Продукты</span>
          }
        </div>
      }
    </div>
  }

  <!-- Charts -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="bg-card rounded-2xl p-4">
      <p class="font-semibold text-t1 text-sm mb-3">Расходы</p>
      <div class="flex flex-col items-center gap-3">
        <ng-container *ngTemplateOutlet="donutChart; context: { segs: expenseSegs }"></ng-container>
        <div class="w-full space-y-1.5">
          @for (s of expenseSegs; track s.label) {
            <div class="flex justify-between items-center gap-2">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="w-2 h-2 rounded-full flex-shrink-0" [style.background]="s.color"></span>
                <span class="text-xs text-t2 truncate">{{catIcon(s.label)}} {{s.label}}</span>
              </div>
              <span class="text-xs font-semibold text-t1 flex-shrink-0">{{fmt(s.value)}}</span>
            </div>
          }
          @if (!expenseSegs.length) {
            <p class="text-xs text-t3 text-center">Нет расходов</p>
          }
        </div>
      </div>
    </div>

    <div class="bg-card rounded-2xl p-4">
      <p class="font-semibold text-t1 text-sm mb-3">Доходы</p>
      <div class="flex flex-col items-center gap-3">
        <ng-container *ngTemplateOutlet="donutChart; context: { segs: incomeSegs }"></ng-container>
        <div class="w-full space-y-1.5">
          @for (s of incomeSegs; track s.label) {
            <div class="flex justify-between items-center gap-2">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="w-2 h-2 rounded-full flex-shrink-0" [style.background]="s.color"></span>
                <span class="text-xs text-t2 truncate">{{catIcon(s.label)}} {{s.label}}</span>
              </div>
              <span class="text-xs font-semibold text-t1 flex-shrink-0">{{fmt(s.value)}}</span>
            </div>
          }
          @if (!incomeSegs.length) {
            <p class="text-xs text-t3 text-center">Нет доходов</p>
          }
        </div>
      </div>
    </div>
  </div>

  <!-- Compensation progress -->
  <div class="bg-card rounded-2xl p-4">
    <div class="flex justify-between items-center mb-2">
      <p class="text-sm font-semibold text-t1">Компенсации (4 нед × 5 дней)</p>
      <span class="text-xs text-t2">{{fmt(compReceived)}} / {{fmt(expectedComp)}}</span>
    </div>
    <div class="h-2 bg-card2 rounded-full overflow-hidden">
      <div class="h-full rounded-full bg-y transition-all" [style.width]="compPct + '%'"></div>
    </div>
    <p class="text-xs text-t3 mt-1">{{compPctRound}}% от плана</p>
  </div>
</div>

<ng-template #donutChart let-segs="segs">
  @if (segs.length) {
    <svg viewBox="0 0 200 200" class="w-36 h-36 flex-shrink-0">
      @for (p of buildPaths(segs); track p.label) {
        <path [attr.d]="p.d" [attr.fill]="p.color" />
      }
    </svg>
  } @else {
    <p class="text-center text-t3 py-6 text-sm">Нет данных</p>
  }
</ng-template>
  `,
})
export class DashboardComponent implements OnChanges {
  @Input() stats!: Stats;
  @Input() settings!: AppSettings;
  @Input() month!: string;
  @Input() onRefresh!: () => void;

  fmt = fmt;
  catIcon = (l: string) => CATEGORY_ICONS[l] ?? '•';

  expenseSegs: { label: string; value: number; color: string }[] = [];
  incomeSegs: { label: string; value: number; color: string }[] = [];

  expectedComp = 0;
  compReceived = 0;
  isCurrentMonth = false;
  compPct = 0;
  compPctRound = 0;

  // comp widget
  compPerson: 'person1' | 'person2' = 'person1';
  compSpent = '';
  compDate = new Date().toISOString().slice(0, 10);
  compLoading = false;
  compResult: { compAmount: number; overAmount: number } | null = null;

  get compSpentNum() { return +this.compSpent || 0; }
  get compPreview() {
    const limit = this.settings?.compensationPerPerson ?? 0;
    return { comp: Math.min(this.compSpentNum, limit), over: Math.max(0, this.compSpentNum - limit) };
  }

  constructor(private api: ApiService) {}

  ngOnChanges() {
    if (!this.stats || !this.settings) return;
    const today = new Date().toISOString().slice(0, 10);
    this.isCurrentMonth = today.startsWith(this.month);
    const workdays = 20;
    this.expectedComp = this.settings.compensationPerPerson * 2 * workdays;
    this.compReceived = this.stats.byCategory.find(c => c.category === 'Компенсация' && c.isIncome)?.amount ?? 0;
    this.expenseSegs = this.stats.byCategory.filter(c => !c.isIncome && c.amount > 0)
      .map(c => ({ label: c.category, value: c.amount, color: CATEGORY_COLORS[c.category] ?? '#555' }));
    this.incomeSegs = this.stats.byCategory.filter(c => c.isIncome && c.amount > 0)
      .map(c => ({ label: c.category, value: c.amount, color: CATEGORY_COLORS[c.category] ?? '#22c55e' }));
    this.compPct = Math.min(100, this.expectedComp > 0 ? (this.compReceived / this.expectedComp) * 100 : 0);
    this.compPctRound = Math.round(this.compPct);
  }

  buildPaths(data: { label: string; value: number; color: string }[]): DonutSeg[] {
    const filtered = data.filter(d => d.value > 0);
    if (!filtered.length) return [];
    const total = filtered.reduce((s, d) => s + d.value, 0);
    const cx = 100, cy = 100, r = 85, ir = 58;
    let angle = -Math.PI / 2;
    return filtered.map(seg => {
      const sweep = (seg.value / total) * Math.PI * 2;
      const s = angle, e = angle + sweep;
      angle += sweep;
      const large = sweep > Math.PI ? 1 : 0;
      const d = [
        `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)}`,
        `A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`,
        `L ${cx + ir * Math.cos(e)} ${cy + ir * Math.sin(e)}`,
        `A ${ir} ${ir} 0 ${large} 0 ${cx + ir * Math.cos(s)} ${cy + ir * Math.sin(s)}`,
        'Z',
      ].join(' ');
      return { ...seg, d };
    });
  }

  async handleCompAdd() {
    if (!this.compSpent || this.compSpentNum <= 0) return;
    this.compLoading = true;
    try {
      const res = await this.api.smartCompensation({ date: this.compDate, spent: this.compSpentNum, persons: 1, person: this.compPerson });
      this.compResult = res;
      this.compSpent = '';
      this.onRefresh();
      setTimeout(() => { this.compResult = null; }, 4000);
    } finally { this.compLoading = false; }
  }
}
