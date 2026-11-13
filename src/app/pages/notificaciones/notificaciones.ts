import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.scss',
})
export class Notificaciones implements OnInit {
  notifs: any[] = [];
  msg = '';
  isError = false;
  loading = false;
  channels = ['WHATSAPP', 'EMAIL', 'PUSH'];
  types = [
    'CUSTOM', 'PIN_DELIVERY', 'PAYMENT_REMINDER', 'PAYMENT_CONFIRMED',
    'OVERDUE_ALERT', 'CHURN_ALERT', 'PROMO', 'WEEKLY_REPORT',
  ];
  form: any = { gym_id: '', channel: 'WHATSAPP', type: 'CUSTOM', content: '', user_id: '' };

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {
    this.form.gym_id = this.auth.user()?.gym_id || '';
  }

  ngOnInit() {
    this.load();
  }

  private setMsg(msg: string, isError = false) {
    this.msg = msg;
    this.isError = isError;
  }

  async send() {
    try {
      await firstValueFrom(this.api.sendNotification(this.form));
      this.setMsg('Notificación enviada (mock)');
      await this.load();
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async load() {
    this.loading = true;
    try {
      const data = await firstValueFrom(this.api.notificationLogs(this.form.gym_id));
      this.notifs = data.notifications || [];
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      CUSTOM: 'Personalizado',
      PIN_DELIVERY: 'Entrega de PIN',
      PAYMENT_REMINDER: 'Recordatorio de pago',
      PAYMENT_CONFIRMED: 'Pago confirmado',
      OVERDUE_ALERT: 'Alerta de mora',
      CHURN_ALERT: 'Riesgo de abandono',
      PROMO: 'Promoción',
      WEEKLY_REPORT: 'Reporte semanal',
    };
    return map[type] || type;
  }

  statusClass(status: string): string {
    if (status === 'SENT') return 'ok';
    if (status === 'PENDING') return 'warn';
    return 'bad';
  }

  date(value: any): string {
    return value ? new Date(value).toLocaleString('es-EC') : '—';
  }
}
