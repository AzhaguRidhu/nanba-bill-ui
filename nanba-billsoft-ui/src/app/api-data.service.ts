import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Bill, Customer, Expense, CategoryItem,
  ExpenseCategory, ItemMaster
} from './models';

const BASE = 'http://localhost:5000/api';

/**
 * ApiDataService – mirrors every method signature of DataService exactly,
 * but delegates to the .NET Core / PostgreSQL backend via HTTP instead of
 * localStorage. Return types are Observable<T> equivalents of the original
 * synchronous T values.
 *
 * Usage: replace DataService with ApiDataService in component constructors.
 */
@Injectable({ providedIn: 'root' })
export class ApiDataService {

  constructor(private http: HttpClient) {}

  // ── Customers ──────────────────────────────────────────────────────────

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${BASE}/customers`);
  }

  saveCustomer(c: Customer): Observable<void> {
    return this.http.post<{ id: string }>(`${BASE}/customers`, c).pipe(map(() => void 0));
  }

  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/customers/${id}`);
  }

  // ── Bills ──────────────────────────────────────────────────────────────

  getBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${BASE}/bills`);
  }

  saveBill(b: Bill): Observable<void> {
    return this.http.post<{ id: string }>(`${BASE}/bills`, b).pipe(map(() => void 0));
  }

  deleteBill(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/bills/${id}`);
  }

  getBillById(id: string): Observable<Bill | undefined> {
    return this.http.get<Bill>(`${BASE}/bills/${id}`);
  }

  // ── Expenses ───────────────────────────────────────────────────────────

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${BASE}/expenses`);
  }

  saveExpense(e: Expense): Observable<void> {
    return this.http.post<{ id: string }>(`${BASE}/expenses`, e).pipe(map(() => void 0));
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/expenses/${id}`);
  }

  // ── Bill Categories ────────────────────────────────────────────────────

  getBillCategories(): Observable<CategoryItem[]> {
    return this.http.get<CategoryItem[]>(`${BASE}/bill-categories`);
  }

  saveBillCategory(c: CategoryItem): Observable<void> {
    return this.http.post<{ id: string }>(`${BASE}/bill-categories`, c).pipe(map(() => void 0));
  }

  deleteBillCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/bill-categories/${id}`);
  }

  // ── Expense Categories ─────────────────────────────────────────────────

  getExpenseCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(`${BASE}/expense-categories`);
  }

  saveExpenseCategory(c: ExpenseCategory): Observable<void> {
    return this.http.post<{ id: string }>(`${BASE}/expense-categories`, c).pipe(map(() => void 0));
  }

  deleteExpenseCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/expense-categories/${id}`);
  }

  // ── Item Masters ───────────────────────────────────────────────────────

  getItemMasters(): Observable<ItemMaster[]> {
    return this.http.get<ItemMaster[]>(`${BASE}/item-masters`);
  }

  getItemsByCategory(categoryId: string): Observable<ItemMaster[]> {
    return this.http.get<ItemMaster[]>(`${BASE}/item-masters/by-category/${categoryId}`);
  }

  saveItemMaster(item: ItemMaster): Observable<void> {
    return this.http.post<{ id: string }>(`${BASE}/item-masters`, item).pipe(map(() => void 0));
  }

  deleteItemMaster(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/item-masters/${id}`);
  }

  // ── Bill Number Generator ──────────────────────────────────────────────

  generateBillNumber(): Observable<string> {
    return this.http.get<{ billNumber: string }>(`${BASE}/bills/generate-number`).pipe(
      map(res => res.billNumber)
    );
  }

  // ── Dashboard Stats ────────────────────────────────────────────────────

  getDashboardStats(): Observable<{
    todayBills: number;
    todaySales: number;
    totalSales: number;
    totalExpenses: number;
    pendingAmount: number;
    creditAmount: number;
    fullyPaid: number;
    pendingBills: number;
  }> {
    return this.http.get<{
      todayBills: number;
      todaySales: number;
      totalSales: number;
      totalExpenses: number;
      pendingAmount: number;
      creditAmount: number;
      fullyPaid: number;
      pendingBills: number;
    }>(`${BASE}/bills/dashboard`);
  }

  // ── Monthly Sales (last 6 months) ──────────────────────────────────────

  getMonthlySales(): Observable<{ month: string; amount: number }[]> {
    return this.http.get<{ month: string; amount: number }[]>(`${BASE}/bills/monthly-sales`);
  }

  // ── Category Sales ─────────────────────────────────────────────────────

  getCategorySales(): Observable<{ category: string; amount: number }[]> {
    return this.http.get<{ category: string; amount: number }[]>(`${BASE}/bills/category-sales`);
  }
}
