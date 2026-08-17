import { Injectable, signal } from '@angular/core';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'super' | 'user';
}

export interface AuthState {
  user: AppUser | null;
  isLoggedIn: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'nanba_users';
  private readonly SESSION_KEY = 'nanba_session';

  currentUser = signal<AppUser | null>(this.loadSession());

  private loadSession(): AppUser | null {
    const s = sessionStorage.getItem(this.SESSION_KEY);
    return s ? JSON.parse(s) : null;
  }

  private getUsers(): AppUser[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    const defaults: AppUser[] = [
      { id: '1', username: 'admin', password: 'admin123', name: 'Administrator', role: 'super' },
      { id: '2', username: 'user1', password: 'user123', name: 'Staff User', role: 'user' }
    ];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  private saveUsers(users: AppUser[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }

  login(username: string, password: string): AppUser | null {
    const user = this.getUsers().find(u => u.username === username && u.password === password);
    if (user) {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      this.currentUser.set(user);
    }
    return user ?? null;
  }

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    this.currentUser.set(null);
  }

  isSuper(): boolean {
    return this.currentUser()?.role === 'super';
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  getAllUsers(): AppUser[] {
    return this.getUsers();
  }

  createUser(user: Omit<AppUser, 'id'>): void {
    const users = this.getUsers();
    const newUser: AppUser = { ...user, id: Date.now().toString() };
    this.saveUsers([...users, newUser]);
  }

  deleteUser(id: string): void {
    this.saveUsers(this.getUsers().filter(u => u.id !== id));
  }

  updateUser(updated: AppUser): void {
    this.saveUsers(this.getUsers().map(u => u.id === updated.id ? updated : u));
  }
}
