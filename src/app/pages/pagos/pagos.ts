import { Component, OnInit } from '@angular/core';
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
  gymId = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      const data = await firstValueFrom(this.api.pendingPayments(this.gymId));
      this.payments = data.payments || [];
      this.msg = '';
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async approve(id: string) {
    try {
      await firstValueFrom(this.api.approvePayment(id));
      await this.load();
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async reject(id: string) {
    try {
      await firstValueFrom(this.api.rejectPayment(id, 'Rechazado por admin'));
      await this.load();
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }
}
