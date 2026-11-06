import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-socios',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './socios.html',
  styleUrl: './socios.scss',
})
export class Socios {
  msg = '';
  user: any = { first_name: '', last_name: '', phone: '', gym_id: '' };
  plan: any = { name: '', price: 0, duration_days: 30, gym_id: '' };
  mem: any = { user_id: '', plan_id: '', gym_id: '' };

  token() { return localStorage.getItem('token') || ''; }

  async createUser() {
    try {
      const res = await fetch('http://localhost:3000/api/v1/members/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() },
        body: JSON.stringify(this.user),
      });
      const data = await res.json();
    } catch (e: any) {
      this.msg = `Modo demo: socio ${this.user.first_name} ${this.user.last_name} (no persistido). PIN demo: 1234`;
    }
  }

  async createPlan() {
    try {
      const res = await fetch('http://localhost:3000/api/v1/members/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() },
        body: JSON.stringify(this.plan),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.msg = 'Plan creado: ' + (data.plan?.id || '');
    } catch (e: any) { this.msg = e.message; }
  }

  async assign() {
    try {
      const res = await fetch('http://localhost:3000/api/v1/members/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() },
        body: JSON.stringify(this.mem),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.msg = 'Membresía creada: ' + (data.membership?.id || '');
    } catch (e: any) { this.msg = e.message; }
  }
}
