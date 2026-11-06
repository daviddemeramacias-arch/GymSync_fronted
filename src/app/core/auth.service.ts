import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  api = 'http://localhost:3000/api/v1';
  constructor(private http: HttpClient, private router: Router) {}
  token() { return localStorage.getItem('token') || ''; }
  setToken(t: string) { localStorage.setItem('token', t); }
  clear() { localStorage.removeItem('token'); }
  login(phone: string, pin: string) {
    return this.http.post<any>(this.api + '/auth/login-pin', { phone, pin });
  }
  logout() { this.clear(); this.router.navigate(['/']); }
  isAuth() { return !!this.token(); }
}
