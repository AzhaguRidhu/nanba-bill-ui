import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;
  showPwd = false;

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  onLogin() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.username.trim(), this.password).subscribe(user => {
      this.loading = false;
      if (user) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Invalid username or password.';
      }
    });
  }
}
