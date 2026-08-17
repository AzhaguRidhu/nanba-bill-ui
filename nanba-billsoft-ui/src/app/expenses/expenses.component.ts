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

  form: Expense = this.blank();
  customExpenseName = '';

  tabs = [
    { key: 'direct', label: 'Direct Expenses', icon: 'fa-box' },
    { key: 'fixed', label: 'Fixed Expenses', icon: 'fa-building' },
    { key: 'depreciation', label: 'Depreciation', icon: 'fa-gears' },
    { key: 'printing', label: 'Printing Expenses', icon: 'fa-print' }
  ];

  constructor(private ds: DataService) {}

  ngOnInit() { this.load(); }

  load() {
    this.expenses = this.ds.getExpenses();
    this.expenseMasterCategories = this.ds.getExpenseCategories();
    this.applyFilter();
  }

  filteredMasterCategories() {
    return this.expenseMasterCategories.filter(c => c.type === this.form.category);
  }

  applyFilter() {
    this.filtered = this.expenses.filter(e => e.category === this.activeTab);
  }

  setTab(tab: any) { this.activeTab = tab; this.applyFilter(); }

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
    this.ds.saveExpense(this.form);
    this.showModal = false;
    this.load();
  }

  delete(id: string) {
    if (confirm('Delete this expense?')) { this.ds.deleteExpense(id); this.load(); }
  }

  get tabTotal() { return this.filtered.reduce((s, e) => s + e.amount, 0); }
  get grandTotal() { return this.expenses.reduce((s, e) => s + e.amount, 0); }
}
