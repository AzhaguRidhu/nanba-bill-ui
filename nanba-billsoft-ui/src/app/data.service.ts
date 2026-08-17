import { Injectable } from '@angular/core';
import { Bill, Customer, Expense, CategoryItem, ExpenseCategory, ItemMaster, DEFAULT_BILL_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from './models';

@Injectable({ providedIn: 'root' })
export class DataService {

  private get<T>(key: string): T[] {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getCustomers(): Customer[] { return this.get<Customer>('nb_customers'); }
  saveCustomer(c: Customer): void {
    const list = this.getCustomers();
    const idx = list.findIndex(x => x.id === c.id);
    idx >= 0 ? list.splice(idx, 1, c) : list.push(c);
    this.set('nb_customers', list);
  }
  deleteCustomer(id: string): void {
    this.set('nb_customers', this.getCustomers().filter(c => c.id !== id));
  }

  getBills(): Bill[] { return this.get<Bill>('nb_bills'); }
  saveBill(b: Bill): void {
    const list = this.getBills();
    const idx = list.findIndex(x => x.id === b.id);
    idx >= 0 ? list.splice(idx, 1, b) : list.push(b);
    this.set('nb_bills', list);
  }
  deleteBill(id: string): void {
    this.set('nb_bills', this.getBills().filter(b => b.id !== id));
  }
  getBillById(id: string): Bill | undefined {
    return this.getBills().find(b => b.id === id);
  }

  getExpenses(): Expense[] { return this.get<Expense>('nb_expenses'); }
  saveExpense(e: Expense): void {
    const list = this.getExpenses();
    const idx = list.findIndex(x => x.id === e.id);
    idx >= 0 ? list.splice(idx, 1, e) : list.push(e);
    this.set('nb_expenses', list);
  }
  deleteExpense(id: string): void {
    this.set('nb_expenses', this.getExpenses().filter(e => e.id !== id));
  }

  getBillCategories(): CategoryItem[] {
    const stored = localStorage.getItem('nb_bill_categories');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('nb_bill_categories', JSON.stringify(DEFAULT_BILL_CATEGORIES));
    return DEFAULT_BILL_CATEGORIES;
  }
  saveBillCategory(c: CategoryItem): void {
    const list = this.getBillCategories();
    const idx = list.findIndex(x => x.id === c.id);
    idx >= 0 ? list.splice(idx, 1, c) : list.push(c);
    localStorage.setItem('nb_bill_categories', JSON.stringify(list));
  }
  deleteBillCategory(id: string): void {
    const list = this.getBillCategories().filter(c => c.id !== id);
    localStorage.setItem('nb_bill_categories', JSON.stringify(list));
  }

  getExpenseCategories(): ExpenseCategory[] {
    const stored = localStorage.getItem('nb_expense_categories');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('nb_expense_categories', JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
    return DEFAULT_EXPENSE_CATEGORIES;
  }
  saveExpenseCategory(c: ExpenseCategory): void {
    const list = this.getExpenseCategories();
    const idx = list.findIndex(x => x.id === c.id);
    idx >= 0 ? list.splice(idx, 1, c) : list.push(c);
    localStorage.setItem('nb_expense_categories', JSON.stringify(list));
  }
  deleteExpenseCategory(id: string): void {
    const list = this.getExpenseCategories().filter(c => c.id !== id);
    localStorage.setItem('nb_expense_categories', JSON.stringify(list));
  }

  getItemMasters(): ItemMaster[] { return this.get<ItemMaster>('nb_item_masters'); }
  getItemsByCategory(categoryId: string): ItemMaster[] {
    return this.getItemMasters().filter(i => i.categoryId === categoryId);
  }
  saveItemMaster(item: ItemMaster): void {
    const list = this.getItemMasters();
    const idx = list.findIndex(x => x.id === item.id);
    idx >= 0 ? list.splice(idx, 1, item) : list.push(item);
    this.set('nb_item_masters', list);
  }
  deleteItemMaster(id: string): void {
    this.set('nb_item_masters', this.getItemMasters().filter(i => i.id !== id));
  }

  generateBillNumber(): string {
    const n = this.getBills().length + 1;
    return `NB-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
  }

  getDashboardStats() {
    const bills = this.getBills();
    const today = new Date().toISOString().split('T')[0];
    const expenses = this.getExpenses();
    const todayBills = bills.filter(b => b.billDate === today);
    return {
      todayBills: todayBills.length,
      todaySales: todayBills.reduce((s, b) => s + b.totalAmount, 0),
      totalSales: bills.reduce((s, b) => s + b.totalAmount, 0),
      totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
      pendingAmount: bills.filter(b => b.paymentStatus !== 'Fully Paid').reduce((s, b) => s + b.balanceAmount, 0),
      creditAmount: bills.filter(b => b.paymentStatus === 'Credit').reduce((s, b) => s + b.balanceAmount, 0),
      fullyPaid: bills.filter(b => b.paymentStatus === 'Fully Paid').length,
      pendingBills: bills.filter(b => b.paymentStatus !== 'Fully Paid').length
    };
  }

  getMonthlySales(): { month: string; amount: number }[] {
    const map: Record<string, number> = {};
    this.getBills().forEach(b => {
      const m = b.billDate.substring(0, 7);
      map[m] = (map[m] || 0) + b.totalAmount;
    });
    return Object.entries(map).sort().slice(-6).map(([month, amount]) => ({ month, amount }));
  }

  getCategorySales(): { category: string; amount: number }[] {
    const map: Record<string, number> = {};
    this.getBills().forEach(b => b.items.forEach(i => {
      map[i.category] = (map[i.category] || 0) + i.amount;
    }));
    return Object.entries(map).map(([category, amount]) => ({ category, amount }));
  }
}
