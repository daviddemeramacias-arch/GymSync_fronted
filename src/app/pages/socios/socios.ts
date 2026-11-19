import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-socios',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass],
  templateUrl: './socios.html',
  styleUrl: './socios.scss',
})
export class Socios implements OnInit {
  msg = '';
  isError = false;
  loading = false;
  plans: any[] = [];
  socios: any[] = [];
  gyms: any[] = [];
  nextGymId = '';

  user: any = { first_name: '', last_name: '', phone: '', email: '', gym_id: '' };
  plan: any = { name: '', description: '', price: 0, duration_days: 30, gym_id: '' };
  mem: any = { user_id: '', plan_id: '', gym_id: '' };

  /** Fila que se está editando y su copia editable. */
  editingId = '';
  edit: any = { first_name: '', last_name: '', phone: '', email: '', plan_id: '' };

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {
    const gymId = this.auth.user()?.gym_id || '';
    this.user.gym_id = gymId;
    this.plan.gym_id = gymId;
    this.mem.gym_id = gymId;
  }

  async ngOnInit() {
    await this.loadGymSequence();
    this.loadPlans();
    this.loadSocios();
  }

  private setMsg(msg: string, isError = false) {
    this.msg = msg;
    this.isError = isError;
  }

  async loadGymSequence() {
    try {
      const data = await firstValueFrom(this.api.gyms());
      this.gyms = data.gyms || [];
      this.nextGymId = data.next_id || '001';
      // El alta arranca con el siguiente Gym ID libre, pero se puede editar.
      this.user.gym_id = this.nextGymId;
      this.syncGym(this.nextGymId);
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  syncGym(value: string) {
    this.plan.gym_id = value;
    this.mem.gym_id = value;
  }

  useNextGymId() {
    this.user.gym_id = this.nextGymId;
    this.syncGym(this.nextGymId);
  }

  async loadPlans() {
    try {
      const data = await firstValueFrom(this.api.plans());
      this.plans = data.plans || [];
    } catch {
      this.plans = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

  async loadSocios() {
    this.loading = true;
    try {
      const data = await firstValueFrom(this.api.socios());
      this.socios = data.socios || [];
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async createUser() {
    try {
      const data = await firstValueFrom(this.api.createUser(this.user));
      this.mem.user_id = data.user?.id || '';
      this.setMsg(`Socio creado: ${data.user?.id || ''} - PIN inicial: ${data.pin || ''}`);
      this.user = { first_name: '', last_name: '', phone: '', email: '', gym_id: this.user.gym_id };
      await this.loadGymSequence();
      await this.loadPlans();
      await this.loadSocios();
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
      await this.loadSocios();
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  openEdit(s: any) {
    this.editingId = s.id;
    this.edit = {
      first_name: s.first_name,
      last_name: s.last_name,
      phone: s.phone,
      email: s.email || '',
      plan_id: s.plan_id || '',
    };
  }

  closeEdit() {
    this.editingId = '';
  }

  async saveEdit(s: any) {
    try {
      await firstValueFrom(this.api.updateUser(s.id, {
        first_name: this.edit.first_name,
        last_name: this.edit.last_name,
        phone: this.edit.phone,
        email: this.edit.email || null,
      }));
      if (this.edit.plan_id && this.edit.plan_id !== s.plan_id && s.membership_id) {
        await firstValueFrom(this.api.updateMembershipPlan(s.membership_id, this.edit.plan_id));
      }
      this.setMsg('Socio actualizado correctamente');
      this.closeEdit();
      await this.loadSocios();
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async deactivate(s: any) {
    if (!confirm(`¿Dar de baja a ${s.first_name} ${s.last_name}? Se cancelará su membresía activa.`)) return;
    try {
      await firstValueFrom(this.api.deactivateUser(s.id));
      this.setMsg('Socio dado de baja');
      await this.loadSocios();
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async regeneratePin(s: any) {
    try {
      const data = await firstValueFrom(this.api.generatePin(s.id));
      this.setMsg(`Nuevo PIN para ${s.first_name} ${s.last_name}: ${data.pin} (entrégalo por WhatsApp)`);
      await this.loadSocios();
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  pinLabel(s: any): string {
    return s.has_pin ? '••••' : 'Sin PIN';
  }

  statusClass(status: string): string {
    return status === 'ACTIVE' ? 'ok' : status === 'INACTIVE' ? 'bad' : 'warn';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Activo', INACTIVE: 'Baja', OVERDUE: 'Moroso', FROZEN: 'Congelado', CANCELLED: 'Cancelado',
    };
    return map[status] || status;
  }

  formatDate(value: any): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-EC');
  }
}
