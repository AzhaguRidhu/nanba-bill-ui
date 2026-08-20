import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Bill } from '../models';

@Component({
  selector: 'app-remaining',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './remaining.component.html',
  styleUrl: './remaining.component.css'
})
export class RemainingComponent implements OnInit {
  bills: Bill[] = [];
  filtered: Bill[] = [];
  search = '';
  statusFilter = '';
  statuses = ['Pending', 'Advance Paid', 'Partially Paid', 'Credit', 'Overdue'];

  constructor(private ds: DataService) {}

  ngOnInit() {
    this.load();
    this.ds.ready$.subscribe(() => this.load());
  }

  load() {
    this.bills = [...this.ds.getBills()].filter(b => b.paymentStatus !== 'Fully Paid').reverse();
    this.applyFilter();
  }

  applyFilter() {
    let list = this.bills;
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(b => b.billNumber.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q));
    }
    if (this.statusFilter) list = list.filter(b => b.paymentStatus === this.statusFilter);
    this.filtered = list;
  }

  getStatusClass(status: string): string {
    const map: any = { 'Pending': 'badge-warning', 'Credit': 'badge-danger', 'Advance Paid': 'badge-info', 'Partially Paid': 'badge-orange', 'Overdue': 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  get totalOutstanding() { return this.bills.reduce((s, b) => s + b.balanceAmount, 0); }
  get totalCredit() { return this.bills.filter(b => b.paymentStatus === 'Credit').reduce((s, b) => s + b.balanceAmount, 0); }
  get totalPending() { return this.bills.filter(b => b.paymentStatus === 'Pending').reduce((s, b) => s + b.balanceAmount, 0); }
}
