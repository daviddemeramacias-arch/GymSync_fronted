import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

const LEGACY_GYM_ID = '00000000-0000-0000-0000-000000000001';

@Injectable({ providedIn: 'root' })
export class AuthService {
  api = 'http://localhost:3000/api/v1';
  constructor(private http: HttpClient, private router: Router) {}

  token() { return localStorage.getItem('token') || ''; }

  user(): any {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      // Sesiones anteriores al cambio siguen guardando el UUID viejo.
      if (u && (!u.gym_id || u.gym_id === LEGACY_GYM_ID)) u.gym_id = '001';
      else if (u && /^\d{1,3}$/.test(u.gym_id)) u.gym_id = u.gym_id.padStart(3, '0');
      return u;
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
