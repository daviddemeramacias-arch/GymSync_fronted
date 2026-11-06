import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.scss',
})
export class Notificaciones {
  notifs: any[] = [];
  msg = '';
  form: any = { gym_id: '', channel: 'WHATSAPP', type: 'CUSTOM', content: '', user_id: '' };
  token() { return localStorage.getItem('token') || ''; }
  base = 'http://localhost:3000/api/v1';

  async send() {
    try {
      const res = await fetch(`${this.base}/notifications/send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() }, body: JSON.stringify(this.form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.msg = 'Notificación enviada (mock)';
      await this.load();
    } catch (e: any) { this.msg = e.message; }
  }

  async load() {
    try {
      const res = await fetch(`${this.base}/notifications/logs?gym_id=${this.form.gym_id || ''}`, { headers: { Authorization: 'Bearer ' + this.token() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.notifs = data.notifications || [];
    } catch (e: any) { this.msg = e.message; }
  }
}
