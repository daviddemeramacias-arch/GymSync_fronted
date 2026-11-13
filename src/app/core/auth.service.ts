import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  api = 'http://localhost:3000/api/v1';
  constructor(private http: HttpClient, private router: Router) {}

  token() { return localStorage.getItem('token') || ''; }

  user(): any {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }

  setToken(t: string) { localStorage.setItem('token', t); }

  setSession(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user || null));
  }

  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  login(phone: string, pin: string) {
    return this.http.post<any>(this.api + '/auth/login-pin', { phone, pin });
  }

  logout() { this.clear(); this.router.navigate(['/']); }

  isAuth() { return !!this.token(); }
}
