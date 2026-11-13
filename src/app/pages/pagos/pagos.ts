import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './pagos.html',
  styleUrl: './pagos.scss',
})
export class Pagos implements OnInit {
  payments: any[] = [];
  msg = '';
  isError = false;
  loading = false;
  gymId = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    this.loading = true;
    try {
      const data = await firstValueFrom(this.api.pendingPayments(this.gymId));
      this.payments = data.payments || [];
      this.msg = '';
      this.isError = false;
    } catch (e: any) {
      this.msg = errorMessage(e);
      this.isError = true;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async approve(id: string) {
    try {
      await firstValueFrom(this.api.approvePayment(id));
      await this.load();
    } catch (e: any) {
      this.msg = errorMessage(e);
      this.isError = true;
    } finally {
      this.cdr.detectChanges();
    }
  }

  async reject(id: string) {
    try {
      await firstValueFrom(this.api.rejectPayment(id, 'Rechazado por admin'));
      await this.load();
    } catch (e: any) {
      this.msg = errorMessage(e);
      this.isError = true;
    } finally {
      this.cdr.detectChanges();
    }
  }

  money(value: any): string {
    return Number(value || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
  }

  short(value: any): string {
    return value ? String(value).slice(0, 8) : '—';
  }

  methodLabel(method: string): string {
    const map: Record<string, string> = { CASH: 'Efectivo', TRANSFER: 'Transferencia', CARD: 'Tarjeta' };
    return map[method] || method;
  }
}
