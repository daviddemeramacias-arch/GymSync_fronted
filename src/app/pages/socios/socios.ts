import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';

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

  constructor(private api: ApiService) {}

  async createUser() {
    try {
      const data = await firstValueFrom(this.api.createUser(this.user));
      this.msg = `Socio creado: ${data.user?.id || ''} — PIN inicial: ${data.pin || ''}`;
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async createPlan() {
    try {
      const data = await firstValueFrom(this.api.createPlan(this.plan));
      this.msg = 'Plan creado: ' + (data.plan?.id || '');
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async assign() {
    try {
      const data = await firstValueFrom(this.api.assignMembership(this.mem));
      this.msg = 'Membresía creada: ' + (data.membership?.id || '');
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }
}
