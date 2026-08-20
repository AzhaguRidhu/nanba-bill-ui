import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Bill, BillItem, Customer, CategoryItem, ItemMaster, TERMS } from '../models';

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
  billCategories: CategoryItem[] = [];
  itemsForCategory: Record<string, ItemMaster[]> = {}; // categoryId -> items
  terms = TERMS;
  showPaymentModal = false;
  showShareMenu = false;
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
    this.loadMasterData();
    // Re-load master data once API resolves so dropdowns are populated
    this.ds.ready$.subscribe(() => this.loadMasterData());

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

  private loadMasterData() {
    this.customers = this.ds.getCustomers();
    this.billCategories = this.ds.getBillCategories();
    this.itemsForCategory = {};
    this.billCategories.forEach(c => {
      this.itemsForCategory[c.id] = this.ds.getItemsByCategory(c.id);
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
      category: this.billCategories[0]?.name || '',
      itemName: this.billCategories[0]?.itemName || '',
      description: this.billCategories[0]?.description || '',
      quantity: 1,
      rate: this.billCategories[0]?.rate || 0,
      discount: 0,
      amount: this.billCategories[0]?.rate || 0
    });
    this.calcTotals();
  }

  onCategoryChange(item: BillItem) {
    // clear item selection when category changes
    item.itemName = '';
    item.description = '';
    item.rate = 0;
    item.amount = 0;
    this.calcTotals();
  }

  getItemsForBillItem(item: BillItem): ItemMaster[] {
    const cat = this.billCategories.find(c => c.name === item.category);
    return cat ? (this.itemsForCategory[cat.id] || []) : [];
  }

  onItemSelect(billItem: BillItem) {
    const items = this.getItemsForBillItem(billItem);
    const master = items.find(i => i.itemName === billItem.itemName);
    if (master) {
      billItem.description = master.description;
      billItem.rate = master.rate;
      this.calcItem(billItem);
    }
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

  pdfLoading = false;

  async downloadPDF() {
    const el = document.getElementById('bill-print');
    if (!el) return;
    this.pdfLoading = true;
    const h2c = (window as any).html2canvas;
    const jpdf = (window as any).jspdf;
    if (!h2c || !jpdf) { this.pdfLoading = false; return; }
    const canvas = await h2c(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = jpdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(`${this.viewBill?.billNumber}.pdf`);
    this.pdfLoading = false;
  }

  async downloadJPEG() {
    const el = document.getElementById('bill-print');
    if (!el) return;
    const h2c = (window as any).html2canvas;
    if (!h2c) return;
    const canvas = await h2c(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${this.viewBill?.billNumber}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  }

  printBill() {
    const el = document.getElementById('bill-print');
    if (!el) return;
    const existing = document.getElementById('bill-print-portal');
    if (existing) existing.remove();
    const portal = document.createElement('div');
    portal.id = 'bill-print-portal';
    portal.innerHTML = `<div class="bill-paper">${el.innerHTML}</div>`;
    document.body.appendChild(portal);
    window.print();
    setTimeout(() => portal.remove(), 1000);
  }

  toggleShareMenu(e: Event) {
    e.stopPropagation();
    this.showShareMenu = !this.showShareMenu;
    if (this.showShareMenu) {
      const close = () => { this.showShareMenu = false; document.removeEventListener('click', close); };
      setTimeout(() => document.addEventListener('click', close), 0);
    }
  }

  shareWhatsApp() {
    this.showShareMenu = false;
    if (!this.viewBill) return;
    const b = this.viewBill;
    const msg = `*${b.billNumber}* — Nanba Printing & Design%0A` +
      `Customer: ${b.customerName}%0A` +
      `Date: ${b.billDate}%0A` +
      `Total: ₹${b.totalAmount}%0A` +
      `Paid: ₹${b.paidAmount}%0A` +
      `Balance: ₹${b.balanceAmount}%0A` +
      `Status: ${b.paymentStatus}`;
    const phone = (b.customerWhatsapp || b.customerMobile || '').replace(/\D/g, '');
    const url = phone ? `https://wa.me/91${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  }

  async shareImage() {
    this.showShareMenu = false;
    const el = document.getElementById('bill-print');
    if (!el) return;
    const h2c = (window as any).html2canvas;
    if (!h2c) return;
    const canvas = await h2c(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    canvas.toBlob(async (blob: Blob | null) => {
      if (!blob) return;
      const file = new File([blob], `${this.viewBill?.billNumber}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Bill ${this.viewBill?.billNumber}`,
          text: `Bill from Nanba Printing & Design`,
          files: [file]
        });
      } else {
        // fallback: download the image
        const link = document.createElement('a');
        link.download = `${this.viewBill?.billNumber}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }, 'image/png');
  }

  copyBillLink() {
    this.showShareMenu = false;
    const url = `${window.location.origin}/bills/${this.viewBill?.id}`;
    navigator.clipboard.writeText(url).then(() => alert('Bill link copied!'));
  }

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
