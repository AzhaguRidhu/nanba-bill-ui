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
    if (this.auth.isLoggedIn()) this.navigateAfterLogin();
  }

  onLogin() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.username.trim(), this.password).subscribe(user => {
      this.loading = false;
      if (user) {
        this.navigateAfterLogin();
      } else {
        this.error = 'Invalid username or password.';
      }
    });
<<<<<<< HEAD
  }

  private navigateAfterLogin() {
    this.router.navigate([this.auth.isSuper() ? '/dashboard' : '/bills/new']);
=======
>>>>>>> 4fe3bfc885ddd701758cf194cdc59830298fca75
  }
}
