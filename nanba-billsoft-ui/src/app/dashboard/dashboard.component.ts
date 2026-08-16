import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../data.service';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef;

  stats: any = {};
  recentBills: any[] = [];

  constructor(public ds: DataService) {}

  ngOnInit() {
    this.stats = this.ds.getDashboardStats();
    this.recentBills = this.ds.getBills().slice(-5).reverse();
  }

  ngAfterViewInit() {
    this.renderSalesChart();
    this.renderCategoryChart();
  }

  renderSalesChart() {
    const data = this.ds.getMonthlySales();
    if (!data.length || !this.salesChartRef) return;
    new Chart(this.salesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(d => d.month),
        datasets: [{ label: 'Sales (₹)', data: data.map(d => d.amount), backgroundColor: '#f59e0b', borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }

  renderCategoryChart() {
    const data = this.ds.getCategorySales();
    if (!data.length || !this.categoryChartRef) return;
    new Chart(this.categoryChartRef.nativeElement, {
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
