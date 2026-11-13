import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './rutinas.html',
  styleUrl: './rutinas.scss',
})
export class Rutinas implements OnInit {
  routines: any[] = [];
  msg = '';
  routine: any = { name: '', gym_id: '' };
  log: any = { user_id: '', exercise: '', weight: 0 };
  sugUser = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      const data = await firstValueFrom(this.api.routines(this.routine.gym_id));
      this.routines = data.routines || [];
      this.msg = '';
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async create() {
    try {
      await firstValueFrom(this.api.createRoutine(this.routine));
      this.msg = 'Rutina creada';
      await this.load();
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async addLog() {
    try {
      await firstValueFrom(this.api.addRoutineLog(this.log));
      this.msg = 'Log registrado';
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async suggest() {
    try {
      const data = await firstValueFrom(this.api.routineSuggestion(this.sugUser));
      this.msg = typeof data.suggestion === 'string'
        ? data.suggestion
        : JSON.stringify(data.suggestion);
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }
}
