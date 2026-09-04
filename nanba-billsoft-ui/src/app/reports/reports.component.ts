import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { Bill, Expense } from '../models';

declare const Chart: any;

@Pipe({ name: 'sumProp', standalone: true })
export class SumPropPipe implements PipeTransform {
  transform(items: any[], prop: string): number {
    return (items || []).reduce((s: number, i: any) => s + (i[prop] || 0), 0);
  }
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SumPropPipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef;
  @ViewChild('expenseChart') expenseChartRef!: ElementRef;
  @ViewChild('yearlyChart') yearlyChartRef!: ElementRef;

  bills: Bill[] = [];
  expenses: Expense[] = [];
  activeReport = 'daily';
  filterMonth = new Date().toISOString().substring(0, 7);
  filterDate = new Date().toISOString().split('T')[0];
  filterYear = new Date().getFullYear();
  dailySearch = '';
  monthlySearch = '';
  dailyPage = 1;
  monthlyPage = 1;
  readonly reportPageSize = 10;
  customerSearch = '';
  customerPage = 1;
  customerSortColumn: 'name' | 'bills' | 'total' | 'paid' | 'balance' = 'name';
  customerSortDirection: 'asc' | 'desc' = 'asc';
  pendingSearch = '';
  pendingStatus = '';
  pendingPage = 1;
  pendingSortColumn: 'billNumber' | 'customerName' | 'billDate' | 'totalAmount' | 'paidAmount' | 'balanceAmount' | 'paymentStatus' = 'billDate';
  pendingSortDirection: 'asc' | 'desc' = 'desc';
  expenseSearch = '';
  expenseFromDate = '';
  expenseToDate = '';
  availableYears: number[] = [];
  private yearlyChartInstance: any = null;

  reports = [
    { key: 'daily', label: 'Daily Sales' },
    { key: 'monthly', label: 'Monthly Sales' },
    { key: 'yearly', label: 'Yearly Report' },
    { key: 'category', label: 'Category-wise' },
    { key: 'customer', label: 'Customer-wise' },
    { key: 'expense', label: 'Expense Report' },
    { key: 'profit', label: 'Profit Summary' },
    { key: 'pending', label: 'Pending Payments' }
  ];

  constructor(private ds: DataService) {}

  ngOnInit() {
    this.load();
    this.ds.ready$.subscribe(() => {
      this.load();
      this.renderCharts();
    });
  }

  load() {
     this.CurrentyearlyBills();
    this.ds.getExpensesall().subscribe(expenses => {
      this.expenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
      this.buildAvailableYears();
    });
  }

  CurrentyearlyBills() {
    const year = this.filterYear;

// Start of year
const fromDate = `${year}-01-01`;

// End of year
const toDate = `${year}-12-31`;

// Call your API
this.ds.getBillsByDateRange(fromDate, toDate).subscribe({
  next: bills => {
    this.bills = [...bills].reverse();
  }
});

  }

  ngAfterViewInit() {
    setTimeout(() => { this.renderCharts(); }, 100);
  }

  buildAvailableYears() {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    this.bills.forEach(b => years.add(+b.billDate.substring(0, 4)));
    this.expenses.forEach(e => years.add(+e.date.substring(0, 4)));
    this.availableYears = Array.from(years).sort((a, b) => b - a);
  }

  setReport(key: string) {
    this.activeReport = key;
    if (key === 'yearly') setTimeout(() => this.renderYearlyChart(), 100);
  }

  renderCharts() {
    if (this.monthlyChartRef) {
      const data = this.ds.getMonthlySales();
      new Chart(this.monthlyChartRef.nativeElement, {
        type: 'line',
        data: { labels: data.map(d => d.month), datasets: [{ label: 'Sales (₹)', data: data.map(d => d.amount), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
    if (this.expenseChartRef) {
      const cats = ['direct', 'fixed', 'depreciation', 'printing'];
      const labels = ['Direct', 'Fixed', 'Depreciation', 'Printing'];
      const data = cats.map(c => this.expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0));
      new Chart(this.expenseChartRef.nativeElement, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Expenses (₹)', data, backgroundColor: ['#ef4444','#3b82f6','#8b5cf6','#10b981'], borderRadius: 6 }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
  }

  renderYearlyChart() {
    if (!this.yearlyChartRef) return;
    if (this.yearlyChartInstance) { this.yearlyChartInstance.destroy(); }
    const months = this.yearlyMonthlyData;
    const labels = months.map(m => m.monthLabel);
    this.yearlyChartInstance = new Chart(this.yearlyChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Sales (₹)', data: months.map(m => m.sales), backgroundColor: 'rgba(245,158,11,0.85)', borderRadius: 6 },
          { label: 'Expenses (₹)', data: months.map(m => m.expenses), backgroundColor: 'rgba(239,68,68,0.75)', borderRadius: 6 },
          { label: 'Profit (₹)', data: months.map(m => m.profit), backgroundColor: 'rgba(22,163,74,0.75)', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  onYearChange() {
    setTimeout(() => this.renderYearlyChart(), 50);
  }

  get yearlyBills() { return this.bills.filter(b => b.billDate.startsWith(String(this.filterYear))); }
  get yearlyExpenses() { return this.expenses.filter(e => e.date.startsWith(String(this.filterYear))); }

  get yearlySales() { return this.yearlyBills.reduce((s, b) => s + b.totalAmount, 0); }
  get yearlyExpenseTotal() { return this.yearlyExpenses.reduce((s, e) => s + e.amount, 0); }
  get yearlyProfit() { return this.yearlySales - this.yearlyExpenseTotal; }
  get yearlyPaidAmount() { return this.yearlyBills.reduce((s, b) => s + b.paidAmount, 0); }
  get yearlyBalanceAmount() { return this.yearlyBills.reduce((s, b) => s + b.balanceAmount, 0); }

  get yearlyMonthlyData() {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return Array.from({ length: 12 }, (_, i) => {
      const mm = String(i + 1).padStart(2, '0');
      const prefix = `${this.filterYear}-${mm}`;
      const mBills = this.yearlyBills.filter(b => b.billDate.startsWith(prefix));
      const mExp = this.yearlyExpenses.filter(e => e.date.startsWith(prefix));
      const sales = mBills.reduce((s, b) => s + b.totalAmount, 0);
      const expenses = mExp.reduce((s, e) => s + e.amount, 0);
      return {
        monthLabel: MONTHS[i],
        month: prefix,
        bills: mBills.length,
        sales,
        expenses,
        profit: sales - expenses,
        paid: mBills.reduce((s, b) => s + b.paidAmount, 0),
        balance: mBills.reduce((s, b) => s + b.balanceAmount, 0)
      };
    });
  }

  get yearlyCategoryData() {
    const map: Record<string, { count: number; amount: number }> = {};
    this.yearlyBills.forEach(b => b.items.forEach(i => {
      if (!map[i.category]) map[i.category] = { count: 0, amount: 0 };
      map[i.category].count++;
      map[i.category].amount += i.amount;
    }));
    return Object.entries(map).map(([cat, v]) => ({ category: cat, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }

  pdfLoading = false;
  today = new Date();

  private async generatePDF(elementId: string, filename: string) {
    this.pdfLoading = true;
    const el = document.getElementById(elementId);
    if (!el) { this.pdfLoading = false; return; }
    const h2c = (window as any).html2canvas;
    const jpdf = (window as any).jspdf;
    if (!h2c || !jpdf) { this.pdfLoading = false; return; }
    const excludedElements = Array.from(el.querySelectorAll('.pdf-exclude')) as HTMLElement[];
    const previousDisplays = excludedElements.map(element => element.style.display);
    excludedElements.forEach(element => element.style.display = 'none');
    try {
      const canvas = await h2c(el, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const { jsPDF } = jpdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'JPEG', 0, y === 0 ? 0 : -(imgH - remaining), imgW, imgH, undefined, 'FAST');
        remaining -= pageH;
        if (remaining > 0) { pdf.addPage(); y += pageH; }
      }
      pdf.save(filename);
    } finally {
      excludedElements.forEach((element, index) => element.style.display = previousDisplays[index]);
      this.pdfLoading = false;
    }
  }

  downloadMonthlyPDF() {
    this.generatePDF('monthly-report-print', `Monthly-Report-${this.filterMonth}.pdf`);
  }

  downloadYearlyPDF() {
    this.generatePDF('yearly-report-print', `Yearly-Report-${this.filterYear}.pdf`);
  }

  downloadExpensePDF() {
    this.generatePDF('expense-report-print', `Expense-Report-${this.expenseFromDate || 'all'}-${this.expenseToDate || 'all'}.pdf`);
  }

  async shareYearlyReport() {
    const el = document.getElementById('yearly-report-print');
    if (!el) return;
    const fn = (window as any).html2canvas;
    if (!fn) return;
    const canvas = await fn(el, { scale: 2 });
    canvas.toBlob(async (blob: Blob | null) => {
      if (!blob) return;
      const file = new File([blob], `Yearly-Report-${this.filterYear}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `Yearly Report ${this.filterYear}`, files: [file] });
      } else {
        const link = document.createElement('a');
        link.download = `Yearly-Report-${this.filterYear}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }, 'image/png');
  }

  get dailyBills() { return this.filterBills(this.bills.filter(b => b.billDate === this.filterDate), this.dailySearch); }
  get paginatedDailyBills() { return this.paginate(this.dailyBills, this.dailyPage); }
  get dailyTotalPages() { return this.totalPages(this.dailyBills); }
  get dailyPageStart() { return this.pageStart(this.dailyBills, this.dailyPage); }
  get dailyPageEnd() { return this.pageEnd(this.dailyBills, this.dailyPage); }
  get dailySales() { return this.dailyBills.reduce((s, b) => s + b.totalAmount, 0); }

  get monthlyBills() { return this.filterBills(this.bills.filter(b => b.billDate.startsWith(this.filterMonth)), this.monthlySearch); }
  get paginatedMonthlyBills() { return this.paginate(this.monthlyBills, this.monthlyPage); }
  get monthlyTotalPages() { return this.totalPages(this.monthlyBills); }
  get monthlyPageStart() { return this.pageStart(this.monthlyBills, this.monthlyPage); }
  get monthlyPageEnd() { return this.pageEnd(this.monthlyBills, this.monthlyPage); }
  get monthlySales() { return this.monthlyBills.reduce((s, b) => s + b.totalAmount, 0); }

  onDailyFilterChange() { this.dailyPage = 1; }
  onMonthlyFilterChange() { this.monthlyPage = 1; }

  goToDailyPage(page: number) {
    this.dailyPage = this.clampPage(page, this.dailyTotalPages);
  }

  goToMonthlyPage(page: number) {
    this.monthlyPage = this.clampPage(page, this.monthlyTotalPages);
  }

  private filterBills(bills: Bill[], search: string): Bill[] {
    const query = search.trim().toLowerCase();
    if (!query) return bills;
    return bills.filter(b => [b.billNumber, b.customerName, b.customerPlace]
      .some(value => value?.toLowerCase().includes(query)));
  }

  private paginate<T>(records: T[], page: number): T[] {
    const start = (this.clampPage(page, this.totalPages(records)) - 1) * this.reportPageSize;
    return records.slice(start, start + this.reportPageSize);
  }

  private totalPages(records: unknown[]): number {
    return Math.max(1, Math.ceil(records.length / this.reportPageSize));
  }

  private pageStart(records: unknown[], page: number): number {
    return records.length ? (this.clampPage(page, this.totalPages(records)) - 1) * this.reportPageSize + 1 : 0;
  }

  private pageEnd(records: unknown[], page: number): number {
    return Math.min(this.clampPage(page, this.totalPages(records)) * this.reportPageSize, records.length);
  }

  private clampPage(page: number, totalPages: number): number {
    return Math.min(Math.max(page, 1), totalPages);
  }

  get filteredExpenses() {
    const query = this.expenseSearch.trim().toLowerCase();
    return this.expenses.filter(expense => {
      const matchesSearch = !query || [expense.name, expense.category, expense.note]
        .some(value => value?.toLowerCase().includes(query));
      const matchesFrom = !this.expenseFromDate || expense.date >= this.expenseFromDate;
      const matchesTo = !this.expenseToDate || expense.date <= this.expenseToDate;
      return matchesSearch && matchesFrom && matchesTo;
    });
  }

  get filteredExpenseTotal() {
    return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  get categoryData() {
    const map: Record<string, { count: number; amount: number }> = {};
    this.bills.forEach(b => b.items.forEach(i => {
      if (!map[i.category]) map[i.category] = { count: 0, amount: 0 };
      map[i.category].count++;
      map[i.category].amount += i.amount;
    }));
    return Object.entries(map).map(([cat, v]) => ({ category: cat, ...v }));
  }

  private get allCustomerData() {
    const map: Record<string, { name: string; bills: number; total: number; paid: number; balance: number }> = {};
    this.bills.forEach(b => {
      if (!map[b.customerId || b.customerName]) map[b.customerId || b.customerName] = { name: b.customerName, bills: 0, total: 0, paid: 0, balance: 0 };
      const c = map[b.customerId || b.customerName];
      c.bills++; c.total += b.totalAmount; c.paid += b.paidAmount; c.balance += b.balanceAmount;
    });
    return Object.values(map);
  }

  get customerData() {
    const query = this.customerSearch.trim().toLowerCase();
    const filtered = this.allCustomerData.filter(customer => !query || customer.name.toLowerCase().includes(query));
    return this.sortRecords(filtered, this.customerSortColumn, this.customerSortDirection);
  }

  get paginatedCustomerData() { return this.paginate(this.customerData, this.customerPage); }
  get customerTotalPages() { return this.totalPages(this.customerData); }
  get customerPageStart() { return this.pageStart(this.customerData, this.customerPage); }
  get customerPageEnd() { return this.pageEnd(this.customerData, this.customerPage); }

  onCustomerFilterChange() { this.customerPage = 1; }

  sortCustomerBy(column: typeof this.customerSortColumn) {
    if (this.customerSortColumn === column) this.customerSortDirection = this.customerSortDirection === 'asc' ? 'desc' : 'asc';
    else { this.customerSortColumn = column; this.customerSortDirection = 'asc'; }
    this.customerPage = 1;
  }

  goToCustomerPage(page: number) {
    this.customerPage = this.clampPage(page, this.customerTotalPages);
  }

  get totalSales() { return this.bills.reduce((s, b) => s + b.totalAmount, 0); }
  get totalExpenses() { return this.expenses.reduce((s, e) => s + e.amount, 0); }
  get profit() { return this.totalSales - this.totalExpenses; }

  get pendingBills() {
    const query = this.pendingSearch.trim().toLowerCase();
    const filtered = this.bills.filter(b => {
      const matchesSearch = !query || [b.billNumber, b.customerName, b.customerPlace]
        .some(value => value?.toLowerCase().includes(query));
      const matchesStatus = !this.pendingStatus || b.paymentStatus === this.pendingStatus;
      return b.paymentStatus !== 'Fully Paid' && matchesSearch && matchesStatus;
    });
    return this.sortRecords(filtered, this.pendingSortColumn, this.pendingSortDirection);
  }

  get paginatedPendingBills() { return this.paginate(this.pendingBills, this.pendingPage); }
  get pendingTotalPages() { return this.totalPages(this.pendingBills); }
  get pendingPageStart() { return this.pageStart(this.pendingBills, this.pendingPage); }
  get pendingPageEnd() { return this.pageEnd(this.pendingBills, this.pendingPage); }

  onPendingFilterChange() { this.pendingPage = 1; }

  sortPendingBy(column: typeof this.pendingSortColumn) {
    if (this.pendingSortColumn === column) this.pendingSortDirection = this.pendingSortDirection === 'asc' ? 'desc' : 'asc';
    else { this.pendingSortColumn = column; this.pendingSortDirection = 'asc'; }
    this.pendingPage = 1;
  }

  goToPendingPage(page: number) {
    this.pendingPage = this.clampPage(page, this.pendingTotalPages);
  }

  private sortRecords(records: any[], column: string, direction: 'asc' | 'desc') {
    const multiplier = direction === 'asc' ? 1 : -1;
    return [...records].sort((first, second) => {
      const firstValue = first[column];
      const secondValue = second[column];
      if (firstValue === secondValue) return 0;
      if (typeof firstValue === 'number' && typeof secondValue === 'number') return (firstValue - secondValue) * multiplier;
      return String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * multiplier;
    });
  }

  getStatusClass(status: string): string {
    const map: any = { 'Fully Paid': 'badge-success', 'Pending': 'badge-warning', 'Credit': 'badge-danger', 'Advance Paid': 'badge-info', 'Partially Paid': 'badge-orange', 'Overdue': 'badge-danger' };
    return map[status] || 'badge-secondary';
  }
}
