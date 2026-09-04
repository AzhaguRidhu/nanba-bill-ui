import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { ExpenseSumPipe } from './expense-sum.pipe';
import { Expense, ExpenseCategory } from '../models';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpenseSumPipe],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  filtered: Expense[] = [];
  expenseMasterCategories: ExpenseCategory[] = [];
  activeTab: 'direct' | 'fixed' | 'depreciation' | 'printing' = 'direct';
  showModal = false;
  editing: Expense | null = null;
  currentPage = 1;
  readonly pageSize = 10;
  sortColumn: 'name' | 'amount' | 'date' | 'note' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  form: Expense = this.blank();
  customExpenseName = '';

  tabs = [
    { key: 'direct', label: 'Direct Expenses', icon: 'fa-box' },
    { key: 'fixed', label: 'Fixed Expenses', icon: 'fa-building' },
    { key: 'depreciation', label: 'Depreciation', icon: 'fa-gears' },
    { key: 'printing', label: 'Printing Expenses', icon: 'fa-print' }
  ];

  constructor(private ds: DataService) {}

  ngOnInit() {
    this.load();
    this.ds.ready$.subscribe(() => this.load());
  }

  load() {
    this.ds.getExpensesall().subscribe(expenses => {
      this.expenses = [...expenses].reverse();
      this.applyFilter();
    });
    this.expenseMasterCategories = this.ds.getExpenseCategories();
  }

  filteredMasterCategories() {
    return this.expenseMasterCategories.filter(c => c.type === this.form.category);
  }

  applyFilter() {
    this.filtered = this.sortExpenses(this.expenses.filter(e => e.category === this.activeTab));
    this.currentPage = 1;
  }

  setTab(tab: any) { this.activeTab = tab; this.applyFilter(); }

  sortBy(column: typeof this.sortColumn) {
    if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.filtered = this.sortExpenses(this.filtered);
    this.currentPage = 1;
  }

  private sortExpenses(expenses: Expense[]): Expense[] {
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    return [...expenses].sort((a, b) => {
      const first = a[this.sortColumn];
      const second = b[this.sortColumn];
      if (first === second) return 0;
      return (first < second ? -1 : 1) * direction;
    });
  }

  get paginatedExpenses() { return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pageStart() { return this.filtered.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get pageEnd() { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  goToPage(page: number) { this.currentPage = Math.min(Math.max(page, 1), this.totalPages); }

  blank(): Expense {
    return { id: '', category: 'direct', name: '', amount: 0, date: new Date().toISOString().split('T')[0], note: '' };
  }

  openAdd() { this.form = { ...this.blank(), category: this.activeTab }; this.customExpenseName = ''; this.editing = null; this.showModal = true; }
  openEdit(e: Expense) { this.form = { ...e }; this.customExpenseName = ''; this.editing = e; this.showModal = true; }

  save() {
    const name = this.form.name === '__custom__' ? this.customExpenseName.trim() : this.form.name;
    if (!name || this.form.amount <= 0) return;
    this.form.name = name;
    if (!this.form.id) this.form.id = Date.now().toString();
    this.ds.saveExpense(this.form).subscribe({
      next: () => {
        this.showModal = false;
        this.load();
      },
      error: () => alert('Failed to save expense')
    });
  }

  delete(id: string) {
    if (confirm('Delete this expense?')) { this.ds.deleteExpense(id); this.load(); }
  }

  get tabTotal() { return this.filtered.reduce((s, e) => s + e.amount, 0); }
  get grandTotal() { return this.expenses.reduce((s, e) => s + e.amount, 0); }
}
