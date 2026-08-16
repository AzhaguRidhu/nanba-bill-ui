import { Pipe, PipeTransform } from '@angular/core';
import { Expense } from '../models';

@Pipe({ name: 'expenseSum', standalone: true })
export class ExpenseSumPipe implements PipeTransform {
  transform(expenses: Expense[], category: string): number {
    return expenses.filter(e => e.category === category).reduce((s, e) => s + e.amount, 0);
  }
}
