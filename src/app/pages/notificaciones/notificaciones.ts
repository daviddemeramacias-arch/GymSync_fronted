import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.scss',
})
export class Notificaciones implements OnInit {
  notifs: any[] = [];
  msg = '';
  form: any = { gym_id: '', channel: 'WHATSAPP', type: 'CUSTOM', content: '', user_id: '' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  async send() {
    try {
      await firstValueFrom(this.api.sendNotification(this.form));
      this.msg = 'Notificación enviada (mock)';
      await this.load();
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async load() {
    try {
      const data = await firstValueFrom(this.api.notificationLogs(this.form.gym_id));
      this.notifs = data.notifications || [];
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }
}
