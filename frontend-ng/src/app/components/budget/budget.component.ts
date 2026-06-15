import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { CategoryBudget, Stats } from '../../types';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../../types';
import { ApiService } from '../../api.service';
import { fmt } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="space-y-4">
  <p class="text-xs text-t3">Задайте максимальный лимит трат по каждой категории.</p>

  <div class="grid grid-cols-2 gap-3">
    <div class="bg-card rounded-2xl p-4 border border-brd">
      <p class="text-xs text-t2 uppercase tracking-wide font-medium">Установлено лимитов</p>
      <p class="text-xl font-bold text-t1 mt-1">{{fmt(totalLimit)}}</p>
      <p class="text-xs text-t3 mt-0.5">максимум трат</p>
    </div>
    <div class="bg-card rounded-2xl p-4 border border-brd">
      <p class="text-xs text-t2 uppercase tracking-wide font-medium">Потрачено</p>
      <p [class]="'text-xl font-bold mt-1 ' + (totalLimit > 0 && totalActual > totalLimit ? 'text-[#FF453A]' : 'text-t1')">
        {{fmt(totalActual)}}
      </p>
      @if (totalLimit > 0) {
        <p class="text-xs mt-0.5 text-t3">
          {{totalActual <= totalLimit ? 'осталось ' + fmt(totalLimit - totalActual) : 'перерасход ' + fmt(totalActual - totalLimit)}}
        </p>
      }
    </div>
  </div>

  <div class="space-y-3">
    @for (cat of expenseCategories; track cat) {
      <div class="bg-card rounded-2xl p-4 border border-brd">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg flex-shrink-0">{{catIcon(cat)}}</span>
          <span class="flex-1 font-medium text-sm text-t1">{{cat}}</span>
        </div>
        <div class="flex items-center justify-between gap-2 mb-3">
          <div>
            <p class="text-xs text-t3">Потрачено</p>
            <p [class]="'font-bold text-base ' + (isOver(cat) ? 'text-[#FF453A]' : 'text-t1')">{{fmt(actual(cat))}}</p>
          </div>
          <div class="text-t3 text-lg">→</div>
          <div class="text-right">
            <p class="text-xs text-t3">Лимит (макс. трат)</p>
            @if (editing === cat) {
              <div class="flex items-center gap-1 mt-0.5">
                <input type="number" [(ngModel)]="editValue" [name]="'edit_' + cat"
                  class="w-24 bg-card2 border border-y/60 rounded-xl px-2 py-1 text-sm font-bold text-t1 focus:outline-none text-right"
                  autofocus
                  (keydown.enter)="saveEdit(cat)" (keydown.escape)="editing = null" />
                <button (click)="saveEdit(cat)" [disabled]="saving"
                  class="text-xs bg-y text-black font-bold px-2 py-1.5 rounded-lg disabled:opacity-50">✓</button>
                <button (click)="editing = null" class="text-xs text-t3 px-1">✕</button>
              </div>
            } @else {
              <button (click)="startEdit(cat)"
                class="font-bold text-base text-right hover:text-y transition block w-full text-t1">
                @if (limit(cat) > 0) {
                  {{fmt(limit(cat))}}
                } @else {
                  <span class="text-sm text-t3 font-normal">+ задать лимит</span>
                }
              </button>
            }
          </div>
        </div>
        @if (limit(cat) > 0) {
          <div class="h-2 bg-card2 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all"
              [style.width]="pct(cat) + '%'"
              [style.background]="isOver(cat) ? '#FF453A' : catColor(cat)"></div>
          </div>
          <div class="flex justify-between mt-1.5">
            <span class="text-xs text-t3">{{pctRound(cat)}}% использовано</span>
            <span [class]="'text-xs font-semibold ' + (isOver(cat) ? 'text-[#FF453A]' : 'text-green-400')">
              {{isOver(cat) ? '⚠️ перерасход ' + fmt(actual(cat) - limit(cat)) : '✓ ещё можно потратить ' + fmt(limit(cat) - actual(cat))}}
            </span>
          </div>
        } @else {
          <div class="h-2 bg-card2 rounded-full">
            @if (actual(cat) > 0) {
              <div class="h-full w-full rounded-full" [style.background]="catColor(cat)"></div>
            }
          </div>
        }
      </div>
    }
  </div>
</div>
  `,
})
export class BudgetComponent {
  @Input() budgets: CategoryBudget[] = [];
  @Input() stats!: Stats;
  @Input() month!: string;
  @Output() onRefresh = new EventEmitter<void>();

  fmt = fmt;
  expenseCategories = EXPENSE_CATEGORIES;
  catIcon = (c: string) => CATEGORY_ICONS[c] ?? '';
  catColor = (c: string) => CATEGORY_COLORS[c] ?? '#FFDD2D';

  editing: string | null = null;
  editValue = '';
  saving = false;

  get budgetMap() { return Object.fromEntries(this.budgets.map(b => [b.category, b.amount])); }
  get actualMap() {
    return Object.fromEntries((this.stats?.byCategory ?? []).filter(c => !c.isIncome).map(c => [c.category, c.amount]));
  }
  get totalLimit() { return this.budgets.reduce((s, b) => s + b.amount, 0); }
  get totalActual() { return (this.stats?.byCategory ?? []).filter(c => !c.isIncome).reduce((s, c) => s + c.amount, 0); }

  limit(cat: string) { return this.budgetMap[cat] ?? 0; }
  actual(cat: string) { return this.actualMap[cat] ?? 0; }
  isOver(cat: string) { return this.limit(cat) > 0 && this.actual(cat) > this.limit(cat); }
  pct(cat: string) { const l = this.limit(cat); return l > 0 ? Math.min(100, (this.actual(cat) / l) * 100) : 0; }
  pctRound(cat: string) { return Math.round(this.pct(cat)); }

  startEdit(cat: string) { this.editing = cat; this.editValue = String(this.limit(cat) || ''); }

  constructor(private api: ApiService) {}

  async saveEdit(cat: string) {
    this.saving = true;
    try {
      await this.api.saveBudgetItem(this.month, cat, +this.editValue || 0);
      this.onRefresh.emit();
      this.editing = null;
    } finally { this.saving = false; }
  }
}
