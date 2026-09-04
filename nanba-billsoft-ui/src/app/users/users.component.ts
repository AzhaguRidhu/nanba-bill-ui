import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, AppUser } from '../auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: AppUser[] = [];
  showForm = false;
  editUser: AppUser | null = null;
  formError = '';
  currentUserId = '';

  form: { name: string; username: string; password: string; role: 'super' | 'user' } = {
    name: '', username: '', password: '', role: 'user'
  };

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.currentUserId = this.auth.currentUser()?.id ?? '';
    this.load();
  }

  load() {
    this.auth.getAllUsers().subscribe({ next: u => this.users = u, error: () => {} });
  }

  openForm(user?: AppUser) {
    this.editUser = user ?? null;
    this.formError = '';
    this.form = user
      ? { name: user.name, username: user.username, password: '', role: user.role }
      : { name: '', username: '', password: '', role: 'user' };
    this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  saveUser() {
    if (!this.form.name.trim() || !this.form.username.trim()) {
      this.formError = 'Name and username are required.'; return;
    }
    if (!this.editUser && !this.form.password.trim()) {
      this.formError = 'Password is required for new users.'; return;
    }
    if (this.editUser) {
      const updated: AppUser = {
        ...this.editUser,
        name: this.form.name,
        username: this.form.username,
        role: this.form.role,
        password: this.form.password.trim() || this.editUser.password
      };
      this.auth.updateUser(updated).subscribe({ next: () => { this.closeForm(); this.load(); }, error: () => {} });
    } else {
      this.auth.createUser({ name: this.form.name, username: this.form.username, password: this.form.password, role: this.form.role })
        .subscribe({ next: () => { this.closeForm(); this.load(); }, error: () => {} });
    }
  }

  deleteUser(id: string) {
    if (confirm('Delete this user?')) {
      this.auth.deleteUser(id).subscribe({ next: () => this.load(), error: () => {} });
    }
  }
}
