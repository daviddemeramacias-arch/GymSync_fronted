import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './pagos.html',
  styleUrl: './pagos.scss',
})
export class Pagos {
  payments: any[] = [];
  msg = '';
  token() { return localStorage.getItem('token') || ''; }

  async load() {
    try {
      const res = await fetch('http://localhost:3000/api/v1/finance/payments/pending', { headers: { Authorization: 'Bearer ' + this.token() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.payments = data.payments || [];
    } catch (e: any) { this.msg = e.message; }
  }

  async approve(id: string) {
    try {
      const res = await fetch('http://localhost:3000/api/v1/finance/payments/' + id + '/approve', { method: 'PATCH', headers: { Authorization: 'Bearer ' + this.token(), 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error('Error');
      await this.load();
    } catch (e: any) { this.msg = e.message; }
  }

  async reject(id: string) {
    try {
      const res = await fetch('http://localhost:3000/api/v1/finance/payments/' + id + '/reject', { method: 'PATCH', headers: { Authorization: 'Bearer ' + this.token(), 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Rechazado por admin' }) });
      if (!res.ok) throw new Error('Error');
      await this.load();
    } catch (e: any) { this.msg = e.message; }
  }
}
