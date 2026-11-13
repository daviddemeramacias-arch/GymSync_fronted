import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

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
  isError = false;
  loading = false;
  difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  routine: any = { name: '', description: '', difficulty: 'BEGINNER', duration_weeks: 4, gym_id: '' };
  log: any = { user_id: '', exercise: '', sets: 3, reps: 12, weight: 0, gym_id: '' };
  assign: any = { routine_id: '', user_id: '' };
  sugUser = '';

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {
    const gymId = this.auth.user()?.gym_id || '';
    this.routine.gym_id = gymId;
    this.log.gym_id = gymId;
  }

  ngOnInit() {
    this.load();
  }

  private setMsg(msg: string, isError = false) {
    this.msg = msg;
    this.isError = isError;
  }

  async load() {
    this.loading = true;
    try {
      const data = await firstValueFrom(this.api.routines(this.routine.gym_id));
      this.routines = data.routines || [];
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async create() {
    try {
      await firstValueFrom(this.api.createRoutine(this.routine));
      this.setMsg('Rutina creada');
      await this.load();
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async assignRoutine() {
    try {
      await firstValueFrom(this.api.assignRoutine(this.assign.routine_id, this.assign.user_id));
      this.setMsg('Rutina asignada al socio');
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async addLog() {
    try {
      await firstValueFrom(this.api.addRoutineLog(this.log));
      this.setMsg('Progreso registrado');
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async suggest() {
    try {
      const data = await firstValueFrom(this.api.routineSuggestion(this.sugUser));
      this.setMsg(typeof data.suggestion === 'string' ? data.suggestion : JSON.stringify(data.suggestion));
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  difficultyLabel(value: string): string {
    const map: Record<string, string> = {
      BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado',
    };
    return map[value] || value;
  }

  short(value: any): string {
    return value ? String(value).slice(0, 8) : '—';
  }
}
