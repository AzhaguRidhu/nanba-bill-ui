import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { CategoryItem, ExpenseCategory, ItemMaster } from '../models';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.css'
})
export class MastersComponent implements OnInit {
  activeTab: 'bill' | 'items' | 'expense' = 'bill';

  billCategories: CategoryItem[] = [];
  expenseCategories: ExpenseCategory[] = [];

  // Search filters
  billSearch = '';
  itemSearch = '';
  expenseSearch = '';
  expenseTypeFilter = '';

  // Item master state
  selectedCategory: CategoryItem | null = null;

  // categoryItems is computed live from the cache so it always reflects
  // the latest data even after async API responses update _itemMasters.
  get categoryItems(): ItemMaster[] {
    if (!this.selectedCategory) return [];
    return this.ds.getItemsByCategory(this.selectedCategory.id);
  }

  // Modals
  showBillModal = false;
  showExpenseModal = false;
  showItemModal = false;

  editBillCat: CategoryItem | null = null;
  editExpenseCat: ExpenseCategory | null = null;
  editItem: ItemMaster | null = null;

  billForm: CategoryItem = this.blankBill();
  expenseForm: ExpenseCategory = this.blankExpense();
  itemForm: ItemMaster = this.blankItem();

  constructor(public ds: DataService) {}

  ngOnInit() {
    this.load();
    this.ds.ready$.subscribe(() => this.load());
  }

  load() {
    this.billCategories = this.ds.getBillCategories();
    this.expenseCategories = this.ds.getExpenseCategories();
  }

  // ---- Bill Categories ----
  blankBill(): CategoryItem { return { id: '', name: '', itemName: '', description: '', rate: 0 }; }

  openBillForm(c?: CategoryItem) {
    this.editBillCat = c ?? null;
    this.billForm = c ? { ...c } : this.blankBill();
    this.showBillModal = true;
  }

  saveBillCat() {
    if (!this.billForm.name.trim()) return;
    if (!this.billForm.id) this.billForm.id = Date.now().toString();
    this.ds.saveBillCategory(this.billForm);
    this.showBillModal = false;
    this.load();
  }

  deleteBillCat(id: string) {
    if (confirm('Delete this category? All items under it will also be removed.')) {
      this.ds.deleteBillCategory(id);
      this.ds.getItemMasters().filter(i => i.categoryId === id).forEach(i => this.ds.deleteItemMaster(i.id));
      if (this.selectedCategory?.id === id) {
        this.selectedCategory = null;
        this.activeTab = 'bill';
      }
      this.load();
    }
  }

  // ---- Item Master ----
  blankItem(): ItemMaster { return { id: '', categoryId: '', categoryName: '', itemName: '', description: '', rate: 0 }; }

  selectCategory(cat: CategoryItem) {
    this.selectedCategory = cat;
    this.activeTab = 'items';
  }

  openItemForm(item?: ItemMaster) {
    this.editItem = item ?? null;
    this.itemForm = item ? { ...item } : { ...this.blankItem(), categoryId: this.selectedCategory!.id, categoryName: this.selectedCategory!.name };
    this.showItemModal = true;
  }

  saveItem() {
    if (!this.itemForm.itemName.trim()) return;
    if (!this.itemForm.id) this.itemForm.id = Date.now().toString();
    this.ds.saveItemMaster(this.itemForm);
    this.showItemModal = false;
  }

  deleteItem(id: string) {
    if (confirm('Delete this item?')) {
      this.ds.deleteItemMaster(id);
    }
  }

  // ---- Expense Categories ----
  blankExpense(): ExpenseCategory { return { id: '', name: '', type: 'direct' }; }

  openExpenseForm(c?: ExpenseCategory) {
    this.editExpenseCat = c ?? null;
    this.expenseForm = c ? { ...c } : this.blankExpense();
    this.showExpenseModal = true;
  }

  saveExpenseCat() {
    if (!this.expenseForm.name.trim()) return;
    if (!this.expenseForm.id) this.expenseForm.id = Date.now().toString();
    this.ds.saveExpenseCategory(this.expenseForm);
    this.showExpenseModal = false;
    this.load();
  }

  deleteExpenseCat(id: string) {
    if (confirm('Delete this category?')) { this.ds.deleteExpenseCategory(id); this.load(); }
  }

  expenseTypeLabel(type: string): string {
    const map: Record<string, string> = { direct: 'Direct', fixed: 'Fixed', depreciation: 'Depreciation', printing: 'Printing' };
    return map[type] || type;
  }

  get filteredBillCategories(): CategoryItem[] {
    const q = this.billSearch.toLowerCase().trim();
    return q ? this.billCategories.filter(c => c.name.toLowerCase().includes(q)) : this.billCategories;
  }

  get filteredCategoryItems(): ItemMaster[] {
    const q = this.itemSearch.toLowerCase().trim();
    if (!q) return this.categoryItems;
    return this.categoryItems.filter(i =>
      i.itemName.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      String(i.rate).includes(q)
    );
  }

  get filteredExpenseCategories(): ExpenseCategory[] {
    const q = this.expenseSearch.toLowerCase().trim();
    return this.expenseCategories.filter(c =>
      (!q || c.name.toLowerCase().includes(q)) &&
      (!this.expenseTypeFilter || c.type === this.expenseTypeFilter)
    );
  }
}
