import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  kpis: any = {};
  aforo: number | null = null;
  pending: any[] = [];
  offline = false;
  loading = true;
  msg = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    this.loading = true;
    this.offline = false;
    this.msg = '';
    try {
      const [k, a, p] = await Promise.all([
        firstValueFrom(this.api.kpis()),
        firstValueFrom(this.api.aforo()),
        firstValueFrom(this.api.pendingPayments()),
      ]);
      this.kpis = k.kpis || {};
      this.aforo = a.aforo ?? 0;
      this.pending = (p.payments || []).slice(0, 5);
    } catch (e) {
      this.offline = true;
      this.msg = errorMessage(e);
      this.kpis = { users: 128, active_memberships: 104, revenue_month: 4820.5, pending_payments: 6 };
      this.aforo = 37;
      this.pending = [
        { id: 'demo-1111', user_id: 'ana-torres', amount: 45, method: 'TRANSFER', status: 'PENDING' },
        { id: 'demo-2222', user_id: 'luis-paredes', amount: 30, method: 'CASH', status: 'PENDING' },
      ];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  money(value: any): string {
    const n = Number(value || 0);
    return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
  }

  short(value: any): string {
    return value ? String(value).slice(0, 8) : '—';
  }

  statusClass(status: string): string {
    if (status === 'APPROVED' || status === 'ACTIVE') return 'ok';
    if (status === 'PENDING' || status === 'IN_REVIEW') return 'warn';
    return 'bad';
  }
}
