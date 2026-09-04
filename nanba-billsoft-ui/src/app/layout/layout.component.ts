import { Component, computed } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, DatePipe],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  sidebarOpen = window.innerWidth > 768;
  today = new Date();

  private allNavItems = [
    { path: '/dashboard', icon: 'fa-gauge-high', label: 'Dashboard', superOnly: true },
    { path: '/customers', icon: 'fa-users', label: 'Customers', superOnly: true },
    { path: '/bills', icon: 'fa-file-invoice', label: 'Bills', superOnly: true },
    { path: '/bills/new', icon: 'fa-plus', label: 'New Bill Creation', superOnly: false, userOnly: true },
    { path: '/payments', icon: 'fa-credit-card', label: 'Payments', superOnly: true },
    { path: '/expenses', icon: 'fa-wallet', label: 'Expenses', superOnly: true },
    { path: '/remaining', icon: 'fa-clock', label: 'Remaining Balance', superOnly: false, userOnly: true },
    { path: '/reports', icon: 'fa-chart-bar', label: 'Reports', superOnly: true },
    { path: '/users', icon: 'fa-users-gear', label: 'Users', superOnly: true },
    { path: '/masters', icon: 'fa-layer-group', label: 'Masters', superOnly: true }
  ];

  navItems = computed(() => {
    const isSuper = this.auth.isSuper();
    return this.allNavItems.filter(item => item.userOnly ? !isSuper : item.superOnly ? isSuper : true);
  });

  currentUser = computed(() => this.auth.currentUser());

  constructor(private auth: AuthService, private router: Router) {}

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  closeSidebarOnMobile() {
    if (window.innerWidth <= 768) this.sidebarOpen = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
