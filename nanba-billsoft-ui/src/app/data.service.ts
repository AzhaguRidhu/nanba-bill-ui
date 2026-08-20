import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Subject } from 'rxjs';
import { Bill, Customer, Expense, CategoryItem, ExpenseCategory, ItemMaster, DEFAULT_BILL_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from './models';

const BASE = 'https://localhost:60673/api';

const API = {
  customers:         `${BASE}/Customers`,
  bills:             `${BASE}/Bills`,
  expenses:          `${BASE}/Expenses`,
  billCategories:    `${BASE}/bill-categories`,
  expenseCategories: `${BASE}/expense-categories`,
  itemMasters:       `${BASE}/item-masters`,
};

@Injectable({ providedIn: 'root' })
export class DataService {

  private _customers:         Customer[]        = [];
  private _bills:             Bill[]            = [];
  private _expenses:          Expense[]         = [];
  private _billCategories:    CategoryItem[]    = [...DEFAULT_BILL_CATEGORIES];
  private _expenseCategories: ExpenseCategory[] = [...DEFAULT_EXPENSE_CATEGORIES];
  private _itemMasters:       ItemMaster[]      = [];

  /**
   * Emits once after all API data is loaded.
   * Components subscribe to re-run their load() when data arrives.
   */
  readonly ready$ = new Subject<void>();

  constructor(private http: HttpClient) {
    this.loadAll();
  }

  private loadAll(): void {
    forkJoin({
      customers:         this.http.get<Customer[]>(API.customers),
      bills:             this.http.get<Bill[]>(API.bills),
      expenses:          this.http.get<Expense[]>(API.expenses),
      billCategories:    this.http.get<CategoryItem[]>(API.billCategories),
      expenseCategories: this.http.get<ExpenseCategory[]>(API.expenseCategories),
      itemMasters:       this.http.get<ItemMaster[]>(API.itemMasters),
    }).subscribe({
      next: res => {
        this._customers.splice(0, this._customers.length, ...res.customers);
        this._bills.splice(0, this._bills.length, ...res.bills);
        this._expenses.splice(0, this._expenses.length, ...res.expenses);
        if (res.billCategories.length)
          this._billCategories.splice(0, this._billCategories.length, ...res.billCategories);
        if (res.expenseCategories.length)
          this._expenseCategories.splice(0, this._expenseCategories.length, ...res.expenseCategories);
        this._itemMasters.splice(0, this._itemMasters.length, ...res.itemMasters);
        this.ready$.next();
      },
      error: () => this.ready$.next()
    });
  }

  // ── Customers ────────────────────────────────────────────────────────

  getCustomers(): Customer[] { return this._customers; }

  saveCustomer(c: Customer): void {
    if (!c.id) { c.id = Date.now().toString(); c.createdAt = new Date().toISOString(); }
    const idx = this._customers.findIndex(x => x.id === c.id);
    idx >= 0 ? this._customers.splice(idx, 1, c) : this._customers.push(c);
    this.http.post(API.customers, c).subscribe({ error: () => {} });
  }

  deleteCustomer(id: string): void {
    const idx = this._customers.findIndex(c => c.id === id);
    if (idx >= 0) this._customers.splice(idx, 1);
    this.http.delete(`${API.customers}/${id}`).subscribe({ error: () => {} });
  }

  // ── Bills ────────────────────────────────────────────────────────────

  getBills(): Bill[] { return this._bills; }

  saveBill(b: Bill): void {
    const idx = this._bills.findIndex(x => x.id === b.id);
    idx >= 0 ? this._bills.splice(idx, 1, b) : this._bills.push(b);
    this.http.post(API.bills, b).subscribe({ error: () => {} });
  }

  deleteBill(id: string): void {
    const idx = this._bills.findIndex(b => b.id === id);
    if (idx >= 0) this._bills.splice(idx, 1);
    this.http.delete(`${API.bills}/${id}`).subscribe({ error: () => {} });
  }

  getBillById(id: string): Bill | undefined {
    return this._bills.find(b => b.id === id);
  }

  // ── Expenses ─────────────────────────────────────────────────────────

  getExpenses(): Expense[] { return this._expenses; }

  saveExpense(e: Expense): void {
    if (!e.id) e.id = Date.now().toString();
    const idx = this._expenses.findIndex(x => x.id === e.id);
    idx >= 0 ? this._expenses.splice(idx, 1, e) : this._expenses.push(e);
    this.http.post(API.expenses, e).subscribe({ error: () => {} });
  }

  deleteExpense(id: string): void {
    const idx = this._expenses.findIndex(e => e.id === id);
    if (idx >= 0) this._expenses.splice(idx, 1);
    this.http.delete(`${API.expenses}/${id}`).subscribe({ error: () => {} });
  }

  // ── Bill Categories ──────────────────────────────────────────────────

  getBillCategories(): CategoryItem[] { return this._billCategories; }

  saveBillCategory(c: CategoryItem): void {
    if (!c.id) c.id = Date.now().toString();
    const idx = this._billCategories.findIndex(x => x.id === c.id);
    idx >= 0 ? this._billCategories.splice(idx, 1, c) : this._billCategories.push(c);
    this.http.post(API.billCategories, c).subscribe({ error: () => {} });
  }

  deleteBillCategory(id: string): void {
    const idx = this._billCategories.findIndex(c => c.id === id);
    if (idx >= 0) this._billCategories.splice(idx, 1);
    this.http.delete(`${API.billCategories}/${id}`).subscribe({ error: () => {} });
  }

  // ── Expense Categories ───────────────────────────────────────────────

  getExpenseCategories(): ExpenseCategory[] { return this._expenseCategories; }

  saveExpenseCategory(c: ExpenseCategory): void {
    if (!c.id) c.id = Date.now().toString();
    const idx = this._expenseCategories.findIndex(x => x.id === c.id);
    idx >= 0 ? this._expenseCategories.splice(idx, 1, c) : this._expenseCategories.push(c);
    this.http.post(API.expenseCategories, c).subscribe({ error: () => {} });
  }

  deleteExpenseCategory(id: string): void {
    const idx = this._expenseCategories.findIndex(c => c.id === id);
    if (idx >= 0) this._expenseCategories.splice(idx, 1);
    this.http.delete(`${API.expenseCategories}/${id}`).subscribe({ error: () => {} });
  }

  // ── Item Masters ─────────────────────────────────────────────────────

  getItemMasters(): ItemMaster[] { return this._itemMasters; }

  getItemsByCategory(categoryId: string): ItemMaster[] {
    return this._itemMasters.filter(i => i.categoryId === categoryId);
  }

  saveItemMaster(item: ItemMaster): void {
    if (!item.id) item.id = Date.now().toString();
    const idx = this._itemMasters.findIndex(x => x.id === item.id);
    idx >= 0 ? this._itemMasters.splice(idx, 1, item) : this._itemMasters.push(item);
    this.http.post(API.itemMasters, item).subscribe({ error: () => {} });
  }

  deleteItemMaster(id: string): void {
    const idx = this._itemMasters.findIndex(i => i.id === id);
    if (idx >= 0) this._itemMasters.splice(idx, 1);
    this.http.delete(`${API.itemMasters}/${id}`).subscribe({ error: () => {} });
  }

  // ── Bill Number ──────────────────────────────────────────────────────

  generateBillNumber(): string {
    const now = new Date();

    return `NB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  }
  // ── Dashboard / Analytics ────────────────────────────────────────────

  getDashboardStats() {
    const bills    = this._bills;
    const today    = new Date().toISOString().split('T')[0];
    const expenses = this._expenses;
    const todayBills = bills.filter(b => b.billDate === today);
    return {
      todayBills:    todayBills.length,
      todaySales:    todayBills.reduce((s, b) => s + b.totalAmount, 0),
      totalSales:    bills.reduce((s, b) => s + b.totalAmount, 0),
      totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
      pendingAmount: bills.filter(b => b.paymentStatus !== 'Fully Paid').reduce((s, b) => s + b.balanceAmount, 0),
      creditAmount:  bills.filter(b => b.paymentStatus === 'Credit').reduce((s, b) => s + b.balanceAmount, 0),
      fullyPaid:     bills.filter(b => b.paymentStatus === 'Fully Paid').length,
      pendingBills:  bills.filter(b => b.paymentStatus !== 'Fully Paid').length
    };
  }

  getMonthlySales(): { month: string; amount: number }[] {
    const map: Record<string, number> = {};
    this._bills.forEach(b => {
      const m = b.billDate.substring(0, 7);
      map[m] = (map[m] || 0) + b.totalAmount;
    });
    return Object.entries(map).sort().slice(-6).map(([month, amount]) => ({ month, amount }));
  }

  getCategorySales(): { category: string; amount: number }[] {
    const map: Record<string, number> = {};
    this._bills.forEach(b => b.items.forEach(i => {
      map[i.category] = (map[i.category] || 0) + i.amount;
    }));
    return Object.entries(map).map(([category, amount]) => ({ category, amount }));
  }
}
