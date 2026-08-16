import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Bill, BillItem, Customer, CATEGORIES, TERMS } from '../models';

declare const jspdf: any;
declare const html2canvas: any;

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.css'
})
export class BillsComponent implements OnInit {
  mode: 'list' | 'new' | 'view' = 'list';
  bills: Bill[] = [];
  filtered: Bill[] = [];
  search = '';
  statusFilter = '';
  viewBill: Bill | null = null;
  customers: Customer[] = [];
  categories = CATEGORIES;
  terms = TERMS;
  showPaymentModal = false;
  paymentAmount = 0;
  paymentType: any = 'advance';
  paymentNote = '';

  form: Partial<Bill> = {};
  items: BillItem[] = [];
  selectedCustomerId = '';
  billDiscount = 0;
  billCharges = 0;

  statuses = ['Pending', 'Advance Paid', 'Partially Paid', 'Fully Paid', 'Credit', 'Overdue'];

  constructor(private ds: DataService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.customers = this.ds.getCustomers();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.mode = 'list';
        this.loadList();
      } else if (id === 'new') {
        this.mode = 'new';
        this.initNew();
      } else {
        const bill = this.ds.getBillById(id);
        if (bill) {
          this.viewBill = { ...bill };
          this.mode = 'view';
        } else {
          this.mode = 'list';
          this.loadList();
        }
      }
    });
  }

  loadList() {
    this.bills = [...this.ds.getBills()].reverse();
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

  initNew() {
    this.form = {
      billDate: new Date().toISOString().split('T')[0],
      billNumber: this.ds.generateBillNumber(),
      subtotal: 0,
      totalAmount: 0
    };
    this.items = [];
    this.selectedCustomerId = '';
    this.billDiscount = 0;
    this.billCharges = 0;
    this.addItem();
  }

  onCustomerChange() {
    const c = this.customers.find(x => x.id === this.selectedCustomerId);
    if (c) {
      this.form.customerId = c.id;
      this.form.customerName = c.name;
      this.form.customerPlace = c.place;
      this.form.customerMobile = c.mobile;
      this.form.customerWhatsapp = c.whatsapp;
    }
  }

  addItem() {
    this.items.push({
      id: Date.now().toString() + Math.random(),
      category: CATEGORIES[0],
      itemName: '',
      description: '',
      quantity: 1,
      rate: 0,
      discount: 0,
      amount: 0
    });
  }

  removeItem(i: number) {
    if (this.items.length > 1) this.items.splice(i, 1);
    this.calcTotals();
  }

  calcItem(item: BillItem) {
    const gross = item.quantity * item.rate;
    item.amount = gross - item.discount;
    if (item.amount < 0) item.amount = 0;
    this.calcTotals();
  }

  calcTotals() {
    const subtotal = this.items.reduce((s, i) => s + i.amount, 0);
    const total = subtotal - (this.billDiscount || 0) + (this.billCharges || 0);
    this.form.subtotal = subtotal;
    this.form.totalAmount = total < 0 ? 0 : total;
  }

  saveBill() {
    if (!this.form.customerName) { alert('Please enter customer name'); return; }
    if (!this.items.length) { alert('Please add at least one item'); return; }
    this.calcTotals();
    const bill: Bill = {
      id: Date.now().toString(),
      billNumber: this.form.billNumber!,
      billDate: this.form.billDate!,
      customerId: this.form.customerId || '',
      customerName: this.form.customerName!,
      customerPlace: this.form.customerPlace || '',
      customerMobile: this.form.customerMobile || '',
      customerWhatsapp: this.form.customerWhatsapp || '',
      items: [...this.items],
      subtotal: this.form.subtotal || 0,
      discount: this.billDiscount || 0,
      charges: this.billCharges || 0,
      totalAmount: this.form.totalAmount || 0,
      paidAmount: 0,
      balanceAmount: this.form.totalAmount || 0,
      paymentStatus: 'Pending',
      payments: [],
      createdAt: new Date().toISOString()
    };
    this.ds.saveBill(bill);
    this.router.navigate(['/bills', bill.id]);
  }

  openPayment() {
    if (!this.viewBill) return;
    this.paymentAmount = this.viewBill.balanceAmount;
    this.paymentType = 'balance';
    this.paymentNote = '';
    this.showPaymentModal = true;
  }

  addPayment() {
    if (!this.viewBill || this.paymentAmount <= 0) return;
    const bill = { ...this.viewBill, items: [...this.viewBill.items], payments: [...(this.viewBill.payments || [])] };
    bill.payments.push({
      id: Date.now().toString(),
      billId: bill.id,
      amount: Number(this.paymentAmount),
      type: this.paymentType,
      date: new Date().toISOString().split('T')[0],
      note: this.paymentNote
    });
    bill.paidAmount = bill.payments.reduce((s, p) => s + Number(p.amount), 0);
    bill.balanceAmount = bill.totalAmount - bill.paidAmount;
    if (bill.balanceAmount <= 0) {
      bill.balanceAmount = 0;
      bill.paymentStatus = 'Fully Paid';
    } else if (this.paymentType === 'credit') {
      bill.paymentStatus = 'Credit';
    } else if (this.paymentType === 'advance') {
      bill.paymentStatus = 'Advance Paid';
    } else {
      bill.paymentStatus = 'Partially Paid';
    }
    this.ds.saveBill(bill);
    this.viewBill = bill;
    this.showPaymentModal = false;
  }

  deleteBill(id: string) {
    if (confirm('Delete this bill?')) {
      this.ds.deleteBill(id);
      this.router.navigate(['/bills']);
    }
  }

  async downloadPDF() {
    const el = document.getElementById('bill-print');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const img = canvas.toDataURL('image/png');
    const { jsPDF } = jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, 'PNG', 0, 0, w, h);
    pdf.save(`${this.viewBill?.billNumber}.pdf`);
  }

  async downloadJPEG() {
    const el = document.getElementById('bill-print');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.download = `${this.viewBill?.billNumber}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  }

  printBill() { window.print(); }

  getStatusClass(status: string): string {
    const map: any = {
      'Fully Paid': 'badge-success',
      'Pending': 'badge-warning',
      'Credit': 'badge-danger',
      'Advance Paid': 'badge-info',
      'Partially Paid': 'badge-orange',
      'Overdue': 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  }
}
