import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Bill, Payment } from '../models';

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
  showPaymentModal = false;
  selectedBill: Bill | null = null;
  paymentAmount = 0;
  paymentType: 'full' | 'balance' = 'balance';
  paymentNote = '';
  currentPage = 1;
  readonly pageSize = 10;
  sortColumn: 'billNumber' | 'customerName' | 'customerPlace' | 'billDate' | 'totalAmount' | 'paidAmount' | 'balanceAmount' | 'paymentStatus' = 'billDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private ds: DataService) {}

  ngOnInit() {
    this.load();
    this.ds.ready$.subscribe(() => this.load());
  }

  load() {
    this.ds.getBillsFromApi().subscribe({
      next: bills => {
        this.bills = [...bills]
          .filter(b => b.paymentStatus !== 'Fully Paid')
          .reverse();
        this.applyFilter();
      },
      error: () => {
        this.bills = [];
        this.applyFilter();
      }
    });
  }

  applyFilter() {
    let list = this.bills;
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(b => b.billNumber.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q));
    }
    if (this.statusFilter) list = list.filter(b => b.paymentStatus === this.statusFilter);
    this.filtered = this.sortBills(list);
    this.currentPage = 1;
  }

  getStatusClass(status: string): string {
    const map: any = { 'Pending': 'badge-warning', 'Credit': 'badge-danger', 'Advance Paid': 'badge-info', 'Partially Paid': 'badge-orange', 'Overdue': 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  sortBy(column: typeof this.sortColumn) {
    if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.filtered = this.sortBills(this.filtered);
    this.currentPage = 1;
  }

  private sortBills(bills: Bill[]): Bill[] {
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    return [...bills].sort((a, b) => {
      const first = a[this.sortColumn];
      const second = b[this.sortColumn];
      if (first === second) return 0;
      return (first < second ? -1 : 1) * direction;
    });
  }

  get paginatedBills() { return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pageStart() { return this.filtered.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get pageEnd() { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  goToPage(page: number) { this.currentPage = Math.min(Math.max(page, 1), this.totalPages); }

  openPayment(bill: Bill) {
    this.selectedBill = bill;
    this.paymentAmount = bill.balanceAmount;
    this.paymentType = 'balance';
    this.paymentNote = '';
    this.showPaymentModal = true;
  }

  onPaymentTypeChange() {
    if (this.selectedBill && this.paymentType === 'full') {
      this.paymentAmount = this.selectedBill.balanceAmount;
    }
  }

  addPayment() {
    if (!this.selectedBill || this.paymentAmount <= 0) return;

    const bill = { ...this.selectedBill };
    const payment: Payment = {
      id: Date.now().toString(),
      billId: bill.id,
      amount: this.paymentAmount,
      type: this.paymentType,
      date: new Date().toISOString().split('T')[0],
      note: this.paymentNote
    };
    bill.payments = [...(bill.payments || []), payment];
    bill.paidAmount = bill.payments.reduce((total, item) => total + item.amount, 0);
    bill.balanceAmount = Math.max(0, bill.totalAmount - bill.paidAmount);
    bill.paymentStatus = bill.balanceAmount === 0 ? 'Fully Paid' : 'Partially Paid';

    this.ds.saveBill(bill).subscribe({
      next: () => {
        this.showPaymentModal = false;
        this.selectedBill = null;
        this.load();
      },
      error: () => alert('Failed to save payment')
    });
  }

  get totalOutstanding() { return this.bills.reduce((s, b) => s + b.balanceAmount, 0); }
  get totalCredit() { return this.bills.filter(b => b.paymentStatus === 'Credit').reduce((s, b) => s + b.balanceAmount, 0); }
  get totalPending() { return this.bills.filter(b => b.paymentStatus === 'Pending').reduce((s, b) => s + b.balanceAmount, 0); }
}
