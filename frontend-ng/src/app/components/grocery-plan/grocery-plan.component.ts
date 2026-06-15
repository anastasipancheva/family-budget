import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ShoppingItem } from '../../types';
import { ApiService } from '../../api.service';
import { fmt } from '../dashboard/dashboard.component';

const DAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const DAY_FULL  = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

@Component({
  selector: 'app-grocery-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="space-y-4">
  <!-- Week summary -->
  <div class="bg-card rounded-2xl p-4 border border-brd flex items-center justify-between">
    <div>
      <p class="text-sm text-t2">Итого на неделю</p>
      <p class="text-2xl font-bold text-y">{{fmt(weekTotal)}}</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-t2">Куплено</p>
      <p class="text-xl font-semibold text-t1">{{weekBought}} / {{items.length}}</p>
    </div>
  </div>

  <!-- Day tabs -->
  <div class="flex gap-1.5 overflow-x-auto pb-1">
    <button (click)="view = 'week'"
      [class]="view === 'week' ? 'px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-shrink-0 bg-y text-black' : 'px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-shrink-0 bg-card border border-brd text-t2 hover:text-t1'">
      Вся неделя
    </button>
    @for (d of days; track d) {
      <button (click)="view = d"
        [class]="view === d ? 'px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-shrink-0 bg-y text-black' : 'px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-shrink-0 bg-card border border-brd text-t2 hover:text-t1'">
        {{dayName(d)}}
        @if (byDay(d).length > 0) {
          <span [class]="'ml-1.5 text-xs px-1.5 py-0.5 rounded-full ' + (dayDone(d) === byDay(d).length ? 'bg-green-400/20 text-green-400' : 'bg-card2 text-t3')">
            {{dayDone(d)}}/{{byDay(d).length}}
          </span>
        }
      </button>
    }
  </div>

  @if (view === 'week') {
    <div class="space-y-3">
      @for (d of days; track d) {
        <ng-container *ngTemplateOutlet="dayCol; context: { dow: d }"></ng-container>
      }
    </div>
  } @else {
    <ng-container *ngTemplateOutlet="dayCol; context: { dow: view }"></ng-container>
  }
</div>

<ng-template #dayCol let-dow="dow">
  <div class="bg-card rounded-2xl p-4 border border-brd">
    <div class="flex items-center justify-between mb-3">
      <div>
        <p class="font-semibold text-t1">{{dayFull(dow)}}</p>
        <p class="text-xs text-t3">{{getDayDate(dow)}}</p>
      </div>
      @if (byDay(dow).length > 0) {
        <div class="text-right">
          <p class="text-sm font-bold text-y">{{fmt(dayActual(dow))}}</p>
          @if (dayEstimated(dow) !== dayActual(dow)) {
            <p class="text-xs text-t3 line-through">{{fmt(dayEstimated(dow))}}</p>
          }
        </div>
      }
    </div>

    <div class="space-y-1.5">
      @for (item of byDay(dow); track item.id) {
        <div [class]="'flex items-center gap-2 group rounded-xl px-2 py-1 ' + (item.isBought ? 'opacity-60' : '')">
          <button (click)="toggleBought(item)"
            [class]="'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ' + (item.isBought ? 'bg-y border-y' : 'border-t3 hover:border-y')">
            @if (item.isBought) {
              <span class="text-black text-xs leading-none font-bold">✓</span>
            }
          </button>
          <span [class]="'flex-1 text-sm min-w-0 truncate ' + (item.isBought ? 'line-through text-t3' : 'text-t1')">
            {{item.name}}
          </span>
          @if (item.isBought) {
            <input type="number" [defaultValue]="item.actualCost ?? (item.estimatedCost || '')"
              (blur)="updateActualCost(item, $event)"
              [placeholder]="item.estimatedCost > 0 ? item.estimatedCost.toString() : ''"
              class="w-16 text-right text-xs bg-card2 border border-brd rounded-lg px-1.5 py-0.5 text-t1 focus:outline-none focus:border-y/60" />
          } @else {
            <span class="text-xs text-t3 w-14 text-right flex-shrink-0">
              {{item.estimatedCost > 0 ? fmt(item.estimatedCost) : ''}}
            </span>
          }
          <button (click)="deleteItem(item.id)"
            class="opacity-0 group-hover:opacity-100 transition text-t3 hover:text-[#FF453A] w-5 h-5 flex items-center justify-center flex-shrink-0 text-base">
            ×
          </button>
        </div>
      }
    </div>

    @if (allDone(dow)) {
      <p class="text-xs text-y mt-2">✓ Всё куплено</p>
    }

    <!-- Add item row -->
    <div class="flex gap-1.5 mt-2">
      <input [(ngModel)]="addName[dow]" [name]="'name' + dow"
        placeholder="Товар…"
        (keydown.enter)="addItem(dow)"
        class="flex-1 min-w-0 bg-card2 border border-brd rounded-xl px-2.5 py-1.5 text-sm text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
      <input type="number" [(ngModel)]="addCost[dow]" [name]="'cost' + dow"
        placeholder="₽"
        (keydown.enter)="addItem(dow)"
        class="w-16 bg-card2 border border-brd rounded-xl px-2 py-1.5 text-sm text-t1 placeholder-t3 focus:outline-none focus:border-y/60" />
      <button (click)="addItem(dow)" [disabled]="!addName[dow]?.trim()"
        class="px-3 py-1.5 bg-y text-black font-bold rounded-xl text-sm disabled:opacity-40 hover:brightness-110 transition">
        +
      </button>
    </div>
  </div>
</ng-template>
  `,
})
export class GroceryPlanComponent {
  @Input() items: ShoppingItem[] = [];
  @Input() weekStart!: string;
  @Output() onRefresh = new EventEmitter<void>();

  fmt = fmt;
  days = [1, 2, 3, 4, 5];
  view: 'week' | number = 'week';
  addName: Record<number, string> = {};
  addCost: Record<number, string> = {};

  dayName = (d: number) => DAY_NAMES[d];
  dayFull = (d: number) => DAY_FULL[d];

  byDay(dow: number) { return this.items.filter(i => i.dayOfWeek === dow); }
  dayDone(dow: number) { return this.byDay(dow).filter(i => i.isBought).length; }
  allDone(dow: number) { const d = this.byDay(dow); return d.length > 0 && d.every(i => i.isBought); }
  dayEstimated(dow: number) { return this.byDay(dow).reduce((s, i) => s + i.estimatedCost, 0); }
  dayActual(dow: number) { return this.byDay(dow).reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0); }
  get weekTotal() { return this.days.reduce((s, d) => s + this.dayActual(d), 0); }
  get weekBought() { return this.items.filter(i => i.isBought).length; }

  getDayDate(dow: number) {
    const d = new Date(this.weekStart + 'T12:00:00');
    d.setDate(d.getDate() + dow - 1);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  constructor(private api: ApiService) {}

  async addItem(dow: number) {
    const name = (this.addName[dow] ?? '').trim();
    if (!name) return;
    await this.api.addShoppingItem({ weekStart: this.weekStart, dayOfWeek: dow, name, estimatedCost: +this.addCost[dow] || 0, isBought: false });
    this.addName[dow] = '';
    this.addCost[dow] = '';
    this.onRefresh.emit();
  }

  async toggleBought(item: ShoppingItem) {
    await this.api.updateShoppingItem(item.id, { isBought: !item.isBought, actualCost: item.actualCost });
    this.onRefresh.emit();
  }

  async updateActualCost(item: ShoppingItem, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    await this.api.updateShoppingItem(item.id, { isBought: item.isBought, actualCost: val ? +val : undefined });
    this.onRefresh.emit();
  }

  async deleteItem(id: number) {
    await this.api.deleteShoppingItem(id);
    this.onRefresh.emit();
  }
}
