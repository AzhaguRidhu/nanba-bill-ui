import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Customer, Bill } from '../models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filtered: Customer[] = [];
  search = '';
  showModal = false;
  showHistoryModal = false;
  editing: Customer | null = null;
  historyCustomer: Customer | null = null;
  customerBills: Bill[] = [];
  currentPage = 1;
  readonly pageSize = 10;

  form: Customer = this.blank();

  constructor(private ds: DataService) {}

  ngOnInit() {
    this.load();
    this.ds.ready$.subscribe(() => this.load());
  }

  load() {
    this.customers = this.ds.getCustomers();
    this.applyFilter();
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered = this.customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.mobile.includes(q) || c.place.toLowerCase().includes(q)
    );
    this.currentPage = 1;
  }

  get paginatedCustomers() {
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pageStart() { return this.filtered.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get pageEnd() { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  goToPage(page: number) { this.currentPage = Math.min(Math.max(page, 1), this.totalPages); }

  blank(): Customer {
    return { id: '', name: '', place: '', whatsapp: '', mobile: '', createdAt: '' };
  }

  openAdd() { this.form = this.blank(); this.editing = null; this.showModal = true; }

  openEdit(c: Customer) { this.form = { ...c }; this.editing = c; this.showModal = true; }

  save() {
    if (!this.form.name || !this.form.mobile) return;
    if (!this.form.id) { this.form.id = Date.now().toString(); this.form.createdAt = new Date().toISOString(); }
    this.ds.saveCustomer(this.form);
    this.showModal = false;
    this.load();
  }

  delete(id: string) {
    if (confirm('Delete this customer?')) { this.ds.deleteCustomer(id); this.load(); }
  }

  viewHistory(c: Customer) {
    this.historyCustomer = c;
    this.customerBills = this.ds.getBills().filter(b => b.customerId === c.id);
    this.showHistoryModal = true;
  }

  getStatusClass(status: string): string {
    const map: any = { 'Fully Paid': 'badge-success', 'Pending': 'badge-warning', 'Credit': 'badge-danger', 'Advance Paid': 'badge-info', 'Partially Paid': 'badge-orange', 'Overdue': 'badge-danger' };
    return map[status] || 'badge-secondary';
  }
}
