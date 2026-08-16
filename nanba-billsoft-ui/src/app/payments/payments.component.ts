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

  constructor(private ds: DataService) {}

  ngOnInit() { this.load(); }

  load() {
    this.bills = this.ds.getBills().reverse();
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
    this.ds.saveBill(bill);
    this.showModal = false;
    this.load();
  }

  getStatusClass(status: string): string {
    const map: any = { 'Fully Paid': 'badge-success', 'Pending': 'badge-warning', 'Credit': 'badge-danger', 'Advance Paid': 'badge-info', 'Partially Paid': 'badge-orange', 'Overdue': 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  get totalCollected() { return this.bills.reduce((s, b) => s + b.paidAmount, 0); }
  get totalPending() { return this.bills.filter(b => b.paymentStatus !== 'Fully Paid').reduce((s, b) => s + b.balanceAmount, 0); }
  get totalCredit() { return this.bills.filter(b => b.paymentStatus === 'Credit').reduce((s, b) => s + b.balanceAmount, 0); }
}
