import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Bill } from '../models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit {
  bills: Bill[] = [];
  filtered: Bill[] = [];
  search = '';
  statusFilter = '';
  statuses = ['Pending', 'Advance Paid', 'Partially Paid', 'Fully Paid', 'Credit', 'Overdue'];
  showModal = false;
  selectedBill: Bill | null = null;
  paymentAmount = 0;
  paymentType: any = 'balance';
  paymentNote = '';
  fromDate = new Date().toISOString().split('T')[0];
  toDate = new Date().toISOString().split('T')[0];
  currentPage = 1;
  readonly pageSize = 10;
  sortColumn: 'billNumber' | 'customerName' | 'billDate' | 'totalAmount' | 'paidAmount' | 'balanceAmount' | 'paymentStatus' = 'billDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  constructor(private ds: DataService) {
      const today = new Date();

        // subtract 15 days
    const past = new Date();
    past.setDate(today.getDate() - 15);

<<<<<<< HEAD
    // format as YYYY-MM-DD for <input type="date">
    this.fromDate = past.toISOString().split('T')[0];
    this.toDate   = today.toISOString().split('T')[0];
  }

=======
>>>>>>> 4fe3bfc885ddd701758cf194cdc59830298fca75
  ngOnInit() {
    this.load();
    this.ds.ready$.subscribe(() => this.load());
  }

  load() {
<<<<<<< HEAD

     this.ds.getBillsFromApi().subscribe(bills => {
      this.bills = [...bills].reverse();
      this.applyFilter();
    });
=======
    this.bills = [...this.ds.getBills()].reverse();
    this.applyFilter();
>>>>>>> 4fe3bfc885ddd701758cf194cdc59830298fca75
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
    applydatefilter() {
    this.ds.getBillsByDateRange(this.fromDate, this.toDate).subscribe({
      next: bills => {
        this.bills = [...bills].reverse();
        this.applyFilter();
      }
    });
  }

  openPayment(bill: Bill) {
    this.selectedBill = bill;
    this.paymentAmount = bill.balanceAmount;
    this.paymentType = 'balance';
    this.paymentNote = '';
    this.showModal = true;
  }

  addPayment() {
    if (!this.selectedBill || this.paymentAmount <= 0) return;
    const bill = { ...this.selectedBill };
    bill.payments = [...(bill.payments || []), { id: Date.now().toString(), billId: bill.id, amount: this.paymentAmount, type: this.paymentType, date: new Date().toISOString().split('T')[0], note: this.paymentNote }];
    bill.paidAmount = bill.payments.reduce((s, p) => s + p.amount, 0);
    bill.balanceAmount = bill.totalAmount - bill.paidAmount;
    if (bill.balanceAmount <= 0) { bill.balanceAmount = 0; bill.paymentStatus = 'Fully Paid'; }
    else if (this.paymentType === 'credit') bill.paymentStatus = 'Credit';
    else if (bill.paidAmount > 0) bill.paymentStatus = bill.paidAmount < bill.totalAmount ? 'Partially Paid' : 'Fully Paid';
    if (this.paymentType === 'advance' && bill.paidAmount < bill.totalAmount) bill.paymentStatus = 'Advance Paid';
 

        this.ds.saveBill(bill).subscribe({
    next: () => {
     this.showModal = false;
    this.load();
    },
    error: () => alert('Failed to save bill')
  });
  }

  getStatusClass(status: string): string {
    const map: any = { 'Fully Paid': 'badge-success', 'Pending': 'badge-warning', 'Credit': 'badge-danger', 'Advance Paid': 'badge-info', 'Partially Paid': 'badge-orange', 'Overdue': 'badge-danger' };
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

  get totalCollected() { return this.bills.reduce((s, b) => s + b.paidAmount, 0); }
  get totalPending() { return this.bills.filter(b => b.paymentStatus !== 'Fully Paid').reduce((s, b) => s + b.balanceAmount, 0); }
  get totalCredit() { return this.bills.filter(b => b.paymentStatus === 'Credit').reduce((s, b) => s + b.balanceAmount, 0); }
}
