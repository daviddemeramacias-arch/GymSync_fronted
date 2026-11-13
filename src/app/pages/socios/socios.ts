import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-socios',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './socios.html',
  styleUrl: './socios.scss',
})
export class Socios implements OnInit {
  msg = '';
  isError = false;
  plans: any[] = [];
  user: any = { first_name: '', last_name: '', phone: '', email: '', gym_id: '' };
  plan: any = { name: '', description: '', price: 0, duration_days: 30, gym_id: '' };
  mem: any = { user_id: '', plan_id: '', gym_id: '' };

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {
    const gymId = this.auth.user()?.gym_id || '';
    this.user.gym_id = gymId;
    this.plan.gym_id = gymId;
    this.mem.gym_id = gymId;
  }

  ngOnInit() {
    this.loadPlans();
  }

  private setMsg(msg: string, isError = false) {
    this.msg = msg;
    this.isError = isError;
  }

  async loadPlans() {
    try {
      const data = await firstValueFrom(this.api.plans(this.user.gym_id));
      this.plans = data.plans || [];
    } catch {
      this.plans = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

  async createUser() {
    try {
      const data = await firstValueFrom(this.api.createUser(this.user));
      this.mem.user_id = data.user?.id || '';
      this.setMsg(`Socio creado: ${data.user?.id || ''} — PIN inicial: ${data.pin || ''}`);
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async createPlan() {
    try {
      const data = await firstValueFrom(this.api.createPlan(this.plan));
      this.setMsg('Plan creado: ' + (data.plan?.id || ''));
      await this.loadPlans();
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async assign() {
    try {
      const data = await firstValueFrom(this.api.assignMembership(this.mem));
      this.setMsg('Membresía creada: ' + (data.membership?.id || ''));
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }
}
