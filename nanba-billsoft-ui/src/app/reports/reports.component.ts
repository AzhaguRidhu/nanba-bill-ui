import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { Bill, Expense } from '../models';

declare const Chart: any;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef;
  @ViewChild('expenseChart') expenseChartRef!: ElementRef;

  bills: Bill[] = [];
  expenses: Expense[] = [];
  activeReport = 'daily';
  filterMonth = new Date().toISOString().substring(0, 7);
  filterDate = new Date().toISOString().split('T')[0];

  reports = [
    { key: 'daily', label: 'Daily Sales' },
    { key: 'monthly', label: 'Monthly Sales' },
    { key: 'category', label: 'Category-wise' },
    { key: 'customer', label: 'Customer-wise' },
    { key: 'expense', label: 'Expense Report' },
    { key: 'profit', label: 'Profit Summary' },
    { key: 'pending', label: 'Pending Payments' }
  ];

  constructor(private ds: DataService) {}

  ngOnInit() {
    this.bills = this.ds.getBills();
    this.expenses = this.ds.getExpenses();
  }

  ngAfterViewInit() {
    setTimeout(() => { this.renderCharts(); }, 100);
  }

  renderCharts() {
    if (this.monthlyChartRef) {
      const data = this.ds.getMonthlySales();
      new Chart(this.monthlyChartRef.nativeElement, {
        type: 'line',
        data: { labels: data.map(d => d.month), datasets: [{ label: 'Sales (₹)', data: data.map(d => d.amount), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
    if (this.expenseChartRef) {
      const cats = ['direct', 'fixed', 'depreciation', 'printing'];
      const labels = ['Direct', 'Fixed', 'Depreciation', 'Printing'];
      const data = cats.map(c => this.expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0));
      new Chart(this.expenseChartRef.nativeElement, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Expenses (₹)', data, backgroundColor: ['#ef4444','#3b82f6','#8b5cf6','#10b981'], borderRadius: 6 }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
  }

  get dailyBills() { return this.bills.filter(b => b.billDate === this.filterDate); }
  get dailySales() { return this.dailyBills.reduce((s, b) => s + b.totalAmount, 0); }

  get monthlyBills() { return this.bills.filter(b => b.billDate.startsWith(this.filterMonth)); }
  get monthlySales() { return this.monthlyBills.reduce((s, b) => s + b.totalAmount, 0); }

  get categoryData() {
    const map: Record<string, { count: number; amount: number }> = {};
    this.bills.forEach(b => b.items.forEach(i => {
      if (!map[i.category]) map[i.category] = { count: 0, amount: 0 };
      map[i.category].count++;
      map[i.category].amount += i.amount;
    }));
    return Object.entries(map).map(([cat, v]) => ({ category: cat, ...v }));
  }

  get customerData() {
    const map: Record<string, { name: string; bills: number; total: number; paid: number; balance: number }> = {};
    this.bills.forEach(b => {
      if (!map[b.customerId || b.customerName]) map[b.customerId || b.customerName] = { name: b.customerName, bills: 0, total: 0, paid: 0, balance: 0 };
      const c = map[b.customerId || b.customerName];
      c.bills++; c.total += b.totalAmount; c.paid += b.paidAmount; c.balance += b.balanceAmount;
    });
    return Object.values(map);
  }

  get totalSales() { return this.bills.reduce((s, b) => s + b.totalAmount, 0); }
  get totalExpenses() { return this.expenses.reduce((s, e) => s + e.amount, 0); }
  get profit() { return this.totalSales - this.totalExpenses; }

  get pendingBills() { return this.bills.filter(b => b.paymentStatus !== 'Fully Paid'); }

  getStatusClass(status: string): string {
    const map: any = { 'Fully Paid': 'badge-success', 'Pending': 'badge-warning', 'Credit': 'badge-danger', 'Advance Paid': 'badge-info', 'Partially Paid': 'badge-orange', 'Overdue': 'badge-danger' };
    return map[status] || 'badge-secondary';
  }
}
