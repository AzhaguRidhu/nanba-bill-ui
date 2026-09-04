import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { FormsModule } from '@angular/forms';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink,FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef;
  availableYears: number[] = [];
  filterYear = new Date().getFullYear();

  stats: any = {};
  recentBills: any[] = [];
  private salesChart: any;
  private categoryChart: any;
  private viewInitialized = false;

  constructor(public ds: DataService) {}

  ngOnInit() {
<<<<<<< HEAD
     this.buildAvailableYears();
    this.load();
    this.ds.yearReady$.subscribe(() => {
      this.updateDashboard();
      if (this.viewInitialized) {
        this.renderSalesChart();
        this.renderCategoryChart();
      }
    });
  }
  onYearChange() {
    this.load();
  }
  load() {
   this.ds.getBillsByYear(this.filterYear);
   this.updateDashboard();
=======
    this.load();
    this.ds.ready$.subscribe(() => this.load());
  }

  load() {
    this.stats = this.ds.getDashboardStats();
    this.recentBills = [...this.ds.getBills()].slice(-5).reverse();
>>>>>>> 4fe3bfc885ddd701758cf194cdc59830298fca75
  }

  private updateDashboard() {
    this.stats = this.ds.getDashboardStats();
    this.recentBills = [...this.ds.getBills()].slice(-5).reverse();
  }
  buildAvailableYears() {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    this.availableYears = Array.from(years).sort((a, b) => b - a);
    console.log('Available years:', this.availableYears);
  }
  ngAfterViewInit() {
    this.viewInitialized = true;
    this.renderSalesChart();
    this.renderCategoryChart();
  }

  renderSalesChart() {
    this.salesChart?.destroy();
    const data = this.ds.getMonthlySales();
    if (!data.length || !this.salesChartRef) return;
    this.salesChart = new Chart(this.salesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(d => d.month),
        datasets: [{ label: 'Sales (₹)', data: data.map(d => d.amount), backgroundColor: '#f59e0b', borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }

  renderCategoryChart() {
    this.categoryChart?.destroy();
    const data = this.ds.getCategorySales();
    if (!data.length || !this.categoryChartRef) return;
    this.categoryChart = new Chart(this.categoryChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.category),
        datasets: [{ data: data.map(d => d.amount), backgroundColor: ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  getStatusClass(status: string): string {
    const map: any = { 'Fully Paid': 'badge-success', 'Pending': 'badge-warning', 'Credit': 'badge-danger', 'Advance Paid': 'badge-info', 'Partially Paid': 'badge-orange', 'Overdue': 'badge-danger' };
    return map[status] || 'badge-secondary';
  }
}
