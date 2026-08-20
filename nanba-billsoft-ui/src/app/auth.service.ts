import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';

const BASE = 'https://localhost:60673/api';
const USERS_URL = `${BASE}/Users`;

export interface AppUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'super' | 'user';
}

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SESSION_KEY = 'nanba_session';

  currentUser = signal<AppUser | null>(this.loadSession());

  constructor(private http: HttpClient) {}

  private loadSession(): AppUser | null {
    const s = sessionStorage.getItem(this.SESSION_KEY);
    return s ? JSON.parse(s) : null;
  }

  // ── Auth ─────────────────────────────────────────────────────────────

  login(username: string, password: string): Observable<AppUser | null> {
    return this.http.post<AppUser>(`${USERS_URL}/login`, { username, password }).pipe(
      tap(user => {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      }),
      catchError(() => of(null))
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    this.currentUser.set(null);
  }

  isSuper(): boolean {
    return this.currentUser()?.role === 'super';
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  // ── User Management ───────────────────────────────────────────────────

  getAllUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(USERS_URL);
  }

  createUser(user: Omit<AppUser, 'id'>): Observable<AppUser> {
    return this.http.post<AppUser>(USERS_URL, user);
  }

  updateUser(user: AppUser): Observable<AppUser> {
    return this.http.put<AppUser>(`${USERS_URL}/${user.id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${USERS_URL}/${id}`);
  }
}
