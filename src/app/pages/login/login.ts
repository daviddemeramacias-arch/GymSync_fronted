import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  constructor(private auth: AuthService, private router: Router) {}
  phone = '';
  pin = '';
  msg = '';
  loading = false;

  async login() {
    if (this.loading) return;
    this.loading = true;
    this.msg = '';
    try {
      const data = await firstValueFrom(this.auth.login(this.phone, this.pin));
      this.auth.setToken(data.token);
      this.msg = 'Login OK! Bienvenido ' + (data.user?.first_name || '');
      this.router.navigate(['/socios']);
    } catch (e: any) {
      this.msg = errorMessage(e);
    } finally {
      this.loading = false;
    }
  }
}
