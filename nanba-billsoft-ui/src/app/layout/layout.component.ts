import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, DatePipe],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  sidebarOpen = true;

  navItems = [
    { path: '/dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
    { path: '/customers', icon: 'fa-users', label: 'Customers' },
    { path: '/bills', icon: 'fa-file-invoice', label: 'Bills' },
    { path: '/payments', icon: 'fa-credit-card', label: 'Payments' },
    { path: '/expenses', icon: 'fa-wallet', label: 'Expenses' },
    { path: '/remaining', icon: 'fa-clock', label: 'Remaining' },
    { path: '/reports', icon: 'fa-chart-bar', label: 'Reports' }
  ];

  today = new Date();
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
}
