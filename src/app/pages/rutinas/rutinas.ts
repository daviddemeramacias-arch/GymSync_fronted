import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './rutinas.html',
  styleUrl: './rutinas.scss',
})
export class Rutinas {
  routines: any[] = [];
  msg = '';
  routine: any = { name: '', gym_id: '' };
  log: any = { user_id: '', exercise: '', weight: 0 };
  sugUser = '';
  token() { return localStorage.getItem('token') || ''; }
  base = 'http://localhost:3000/api/v1';

  async load() {
    try {
      const res = await fetch(`${this.base}/routines?gym_id=${this.routine.gym_id || ''}`, { headers: { Authorization: 'Bearer ' + this.token() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.routines = data.routines || [];
    } catch (e: any) { this.msg = e.message; }
  }
  async create() {
    try {
      const res = await fetch(`${this.base}/routines`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() }, body: JSON.stringify(this.routine) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.msg = 'Rutina creada';
      await this.load();
    } catch (e: any) { this.msg = e.message; }
  }
  async addLog() {
    try {
      const res = await fetch(`${this.base}/routines/logs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() }, body: JSON.stringify(this.log) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.msg = 'Log registrado';
    } catch (e: any) { this.msg = e.message; }
  }
  async suggest() {
    try {
      const res = await fetch(`${this.base}/routines/suggestions?user_id=${this.sugUser}`, { headers: { Authorization: 'Bearer ' + this.token() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.msg = data.suggestion;
    } catch (e: any) { this.msg = e.message; }
  }
}
