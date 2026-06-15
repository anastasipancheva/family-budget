import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { CategoryBudget, Stats, ShoppingItem } from '../../types';
import { BudgetComponent } from '../budget/budget.component';
import { GroceryPlanComponent } from '../grocery-plan/grocery-plan.component';

type SubTab = 'budget' | 'grocery';

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(ws: string): string {
  const start = new Date(ws + 'T12:00:00');
  const end = new Date(ws + 'T12:00:00');
  end.setDate(end.getDate() + 4);
  return `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}

function stepWeek(ws: string, dir: number): string {
  const d = new Date(ws + 'T12:00:00');
  d.setDate(d.getDate() + dir * 7);
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule, BudgetComponent, GroceryPlanComponent],
  template: `
<div class="space-y-4">
  <!-- Sub-tab switcher -->
  <div class="flex rounded-2xl overflow-hidden bg-card2 p-1 gap-1">
    <button (click)="subTab = 'budget'"
      [class]="subTab === 'budget' ? 'flex-1 py-2.5 text-sm font-semibold rounded-xl transition bg-y text-black' : 'flex-1 py-2.5 text-sm font-semibold rounded-xl transition text-t2 hover:text-t1'">
      🎯 Лимиты
    </button>
    <button (click)="subTab = 'grocery'"
      [class]="subTab === 'grocery' ? 'flex-1 py-2.5 text-sm font-semibold rounded-xl transition bg-y text-black' : 'flex-1 py-2.5 text-sm font-semibold rounded-xl transition text-t2 hover:text-t1'">
      🛒 Закупки
    </button>
  </div>

  @if (subTab === 'budget') {
    <app-budget [budgets]="budgets" [stats]="stats" [month]="month" (onRefresh)="onRefresh.emit()"></app-budget>
  }

  @if (subTab === 'grocery') {
    <!-- Week navigator -->
    <div class="flex items-center justify-between bg-card rounded-2xl px-4 py-3 border border-brd">
      <button (click)="changeWeek(-1)"
        class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-card2 text-t2 hover:text-t1 transition text-lg">‹</button>
      <div class="text-center">
        <p class="text-sm font-semibold text-t1">{{weekRangeLabel}}</p>
        @if (weekStart === todayWeek) {
          <p class="text-xs text-y">текущая неделя</p>
        }
      </div>
      <button (click)="changeWeek(1)"
        class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-card2 text-t2 hover:text-t1 transition text-lg">›</button>
    </div>

    @if (weekStart !== todayWeek) {
      <button (click)="goToToday()"
        class="w-full text-sm text-y hover:brightness-110 transition">
        → Вернуться к текущей неделе
      </button>
    }

    <app-grocery-plan [items]="shoppingItems" [weekStart]="weekStart" (onRefresh)="onRefresh.emit()"></app-grocery-plan>
  }
</div>
  `,
})
export class PlanningComponent {
  @Input() budgets: CategoryBudget[] = [];
  @Input() stats!: Stats;
  @Input() month!: string;
  @Input() shoppingItems: ShoppingItem[] = [];
  @Input() weekStart!: string;
  @Output() onWeekChange = new EventEmitter<string>();
  @Output() onRefresh = new EventEmitter<void>();

  subTab: SubTab = 'budget';
  todayWeek = getWeekStart(new Date());

  get weekRangeLabel() { return formatWeekRange(this.weekStart); }

  changeWeek(dir: number) { this.onWeekChange.emit(stepWeek(this.weekStart, dir)); }
  goToToday() { this.onWeekChange.emit(this.todayWeek); }
}
